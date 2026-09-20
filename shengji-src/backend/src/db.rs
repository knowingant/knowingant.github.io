//! SQLite persistence: accounts, sessions, ratings, match and round history.
//!
//! All functions are synchronous and take a `&Connection`; callers hold the
//! [`Db`] mutex for the duration of a logical operation (queries are
//! millisecond-scale, so this is fine at this scale). Do **not** do slow work
//! (network calls) while holding the lock.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use shengji_types::{RatingMode, RatingView};

#[derive(Debug, Error)]
pub enum DbError {
    #[error("username is already taken")]
    UsernameTaken,
    #[error("google account is already linked to a user")]
    GoogleSubTaken,
    #[error("already recorded")]
    Duplicate,
    #[error("database error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("database lock poisoned")]
    Poisoned,
    #[error("{0}")]
    Other(String),
}

pub type DbResult<T> = Result<T, DbError>;

/// Handle to the database. Cheap to clone.
#[derive(Clone)]
pub struct Db {
    conn: Arc<Mutex<Connection>>,
}

impl Db {
    /// Open (creating if needed) the database at `path` and run migrations.
    pub fn open(path: &str) -> DbResult<Db> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        migrate(&conn)?;
        Ok(Db {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// In-memory database (tests).
    #[cfg(test)]
    pub fn open_in_memory() -> DbResult<Db> {
        let conn = Connection::open_in_memory()?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        migrate(&conn)?;
        Ok(Db {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Lock the connection.
    pub fn lock(&self) -> DbResult<MutexGuard<'_, Connection>> {
        self.conn.lock().map_err(|_| DbError::Poisoned)
    }

    /// Run `f` with the locked connection.
    pub fn with<R>(&self, f: impl FnOnce(&mut Connection) -> DbResult<R>) -> DbResult<R> {
        let mut guard = self.lock()?;
        f(&mut guard)
    }

    /// Run `f` inside a transaction (committed if `f` returns `Ok`).
    pub fn transaction<R>(
        &self,
        f: impl FnOnce(&rusqlite::Transaction<'_>) -> DbResult<R>,
    ) -> DbResult<R> {
        let mut guard = self.lock()?;
        let tx = guard.transaction()?;
        let r = f(&tx)?;
        tx.commit()?;
        Ok(r)
    }
}

fn migrate(conn: &Connection) -> DbResult<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            google_sub TEXT UNIQUE,
            email TEXT,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
        CREATE TABLE IF NOT EXISTS pending_google (
            token_hash TEXT PRIMARY KEY,
            google_sub TEXT NOT NULL,
            email TEXT,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_devices (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            device_id TEXT NOT NULL,
            first_seen INTEGER NOT NULL,
            last_seen INTEGER NOT NULL,
            PRIMARY KEY (user_id, device_id)
        );
        CREATE INDEX IF NOT EXISTS user_devices_device ON user_devices(device_id);
        CREATE TABLE IF NOT EXISTS ratings (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mode TEXT NOT NULL,
            rating REAL NOT NULL,
            matches INTEGER NOT NULL DEFAULT 0,
            wins INTEGER NOT NULL DEFAULT 0,
            losses INTEGER NOT NULL DEFAULT 0,
            draws INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER,
            PRIMARY KEY (user_id, mode)
        );
        CREATE INDEX IF NOT EXISTS ratings_mode_rating ON ratings(mode, rating DESC);
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_key TEXT NOT NULL UNIQUE,
            room TEXT NOT NULL,
            mode TEXT NOT NULL,
            rated INTEGER NOT NULL,
            rating_applied INTEGER NOT NULL DEFAULT 0,
            first_to_rank TEXT NOT NULL,
            finished_at INTEGER NOT NULL,
            rounds INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS match_players (
            match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            side INTEGER NOT NULL,
            levels INTEGER NOT NULL,
            final_rank TEXT NOT NULL,
            result TEXT NOT NULL,
            rating_before REAL,
            rating_after REAL,
            score REAL,
            PRIMARY KEY (match_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS match_players_user ON match_players(user_id, match_id DESC);
        CREATE TABLE IF NOT EXISTS rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round_key TEXT NOT NULL UNIQUE,
            match_key TEXT NOT NULL,
            room TEXT NOT NULL,
            mode TEXT NOT NULL,
            played_at INTEGER NOT NULL,
            landlord_won INTEGER NOT NULL,
            level_delta INTEGER NOT NULL,
            non_landlords_points INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS round_players (
            round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            is_defender INTEGER NOT NULL,
            is_landlord INTEGER NOT NULL,
            won INTEGER NOT NULL,
            levels_gained INTEGER NOT NULL,
            PRIMARY KEY (round_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS round_players_user ON round_players(user_id);
        "#,
    )?;
    Ok(())
}

/// Hash of a bearer / pending token as stored in the database (hex SHA-256).
pub fn token_hash(token: &str) -> String {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(token.as_bytes());
    digest.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn parse_mode(mode: String, col: usize) -> rusqlite::Result<RatingMode> {
    mode.parse().map_err(|_| {
        rusqlite::Error::FromSqlConversionFailure(
            col,
            rusqlite::types::Type::Text,
            "bad rating mode".into(),
        )
    })
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    #[serde(skip_serializing)]
    pub google_sub: Option<String>,
    #[serde(skip_serializing)]
    pub email: Option<String>,
    pub created_at: i64,
}

fn row_to_user(row: &rusqlite::Row<'_>) -> rusqlite::Result<User> {
    Ok(User {
        id: row.get(0)?,
        username: row.get(1)?,
        google_sub: row.get(2)?,
        email: row.get(3)?,
        created_at: row.get(4)?,
    })
}

const USER_COLS: &str = "id, username, google_sub, email, created_at";

fn prefixed(cols: &str, prefix: &str) -> String {
    cols.split(", ")
        .map(|c| format!("{prefix}.{c}"))
        .collect::<Vec<_>>()
        .join(", ")
}

/// Create a user. `google_sub` is `None` only for dev-login accounts.
pub fn create_user(
    conn: &Connection,
    username: &str,
    google_sub: Option<&str>,
    email: Option<&str>,
) -> DbResult<User> {
    let res = conn.execute(
        "INSERT INTO users (username, google_sub, email, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![username, google_sub, email, now_secs()],
    );
    match res {
        Ok(_) => {}
        Err(rusqlite::Error::SqliteFailure(e, Some(msg)))
            if e.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            if msg.contains("users.google_sub") {
                return Err(DbError::GoogleSubTaken);
            }
            return Err(DbError::UsernameTaken);
        }
        Err(e) => return Err(e.into()),
    }
    let id = conn.last_insert_rowid();
    get_user_by_id(conn, id)?.ok_or_else(|| DbError::Other("user vanished".into()))
}

pub fn get_user_by_id(conn: &Connection, id: i64) -> DbResult<Option<User>> {
    Ok(conn
        .query_row(
            &format!("SELECT {USER_COLS} FROM users WHERE id = ?1"),
            params![id],
            row_to_user,
        )
        .optional()?)
}

/// Case-insensitive lookup.
pub fn get_user_by_username(conn: &Connection, username: &str) -> DbResult<Option<User>> {
    Ok(conn
        .query_row(
            &format!("SELECT {USER_COLS} FROM users WHERE username = ?1 COLLATE NOCASE"),
            params![username],
            row_to_user,
        )
        .optional()?)
}

pub fn get_user_by_google_sub(conn: &Connection, sub: &str) -> DbResult<Option<User>> {
    Ok(conn
        .query_row(
            &format!("SELECT {USER_COLS} FROM users WHERE google_sub = ?1"),
            params![sub],
            row_to_user,
        )
        .optional()?)
}

/// Look up several users by (exact, case-insensitive) username.
pub fn get_users_by_usernames(
    conn: &Connection,
    usernames: &[String],
) -> DbResult<HashMap<String, User>> {
    let mut out = HashMap::new();
    for name in usernames {
        if let Some(u) = get_user_by_username(conn, name)? {
            out.insert(name.clone(), u);
        }
    }
    Ok(out)
}

// ---------------------------------------------------------------------------
// Devices (cheap alt-detection signal; see DESIGN.md)
// ---------------------------------------------------------------------------

/// Record that `user_id` was seen on `device_id` (a client-generated random
/// identifier stored in the browser's localStorage).
pub fn touch_user_device(conn: &Connection, user_id: i64, device_id: &str) -> DbResult<()> {
    let now = now_secs();
    conn.execute(
        "INSERT INTO user_devices (user_id, device_id, first_seen, last_seen) VALUES (?1, ?2, ?3, ?3) \
         ON CONFLICT(user_id, device_id) DO UPDATE SET last_seen = excluded.last_seen",
        params![user_id, device_id, now],
    )?;
    Ok(())
}

/// Pairs of distinct users among `user_ids` that have shared a device within
/// the last `within_secs` seconds, as `(user_a, user_b, device_id)`.
pub fn shared_devices(
    conn: &Connection,
    user_ids: &[i64],
    within_secs: i64,
) -> DbResult<Vec<(i64, i64, String)>> {
    let since = now_secs() - within_secs;
    let mut devices: HashMap<String, Vec<i64>> = HashMap::new();
    let mut stmt =
        conn.prepare("SELECT device_id FROM user_devices WHERE user_id = ?1 AND last_seen >= ?2")?;
    for &uid in user_ids {
        let rows = stmt.query_map(params![uid, since], |r| r.get::<_, String>(0))?;
        for d in rows {
            devices.entry(d?).or_default().push(uid);
        }
    }
    let mut out = vec![];
    for (device, mut users) in devices {
        users.sort_unstable();
        users.dedup();
        for i in 0..users.len() {
            for j in (i + 1)..users.len() {
                out.push((users[i], users[j], device.clone()));
            }
        }
    }
    out.sort();
    Ok(out)
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

pub fn create_session(
    conn: &Connection,
    user_id: i64,
    token_hash: &str,
    ttl_secs: i64,
) -> DbResult<()> {
    let now = now_secs();
    conn.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
        params![token_hash, user_id, now, now + ttl_secs],
    )?;
    Ok(())
}

/// Resolve a session token hash to its user, if the session exists and has
/// not expired.
pub fn get_user_by_session(conn: &Connection, token_hash: &str) -> DbResult<Option<User>> {
    Ok(conn
        .query_row(
            &format!(
                "SELECT {} FROM users u JOIN sessions s ON s.user_id = u.id \
                 WHERE s.token_hash = ?1 AND s.expires_at > ?2",
                prefixed(USER_COLS, "u")
            ),
            params![token_hash, now_secs()],
            row_to_user,
        )
        .optional()?)
}

pub fn delete_session(conn: &Connection, token_hash: &str) -> DbResult<()> {
    conn.execute(
        "DELETE FROM sessions WHERE token_hash = ?1",
        params![token_hash],
    )?;
    Ok(())
}

/// Delete every session of a user except (optionally) one token hash.
pub fn delete_user_sessions(
    conn: &Connection,
    user_id: i64,
    except_token_hash: Option<&str>,
) -> DbResult<usize> {
    Ok(match except_token_hash {
        Some(keep) => conn.execute(
            "DELETE FROM sessions WHERE user_id = ?1 AND token_hash != ?2",
            params![user_id, keep],
        )?,
        None => conn.execute("DELETE FROM sessions WHERE user_id = ?1", params![user_id])?,
    })
}

pub fn delete_expired_sessions(conn: &Connection) -> DbResult<usize> {
    let n = conn.execute(
        "DELETE FROM sessions WHERE expires_at <= ?1",
        params![now_secs()],
    )?;
    conn.execute(
        "DELETE FROM pending_google WHERE expires_at <= ?1",
        params![now_secs()],
    )?;
    Ok(n)
}

// ---------------------------------------------------------------------------
// Pending Google sign-ups (Google account verified, username not chosen yet)
// ---------------------------------------------------------------------------

pub fn create_pending_google(
    conn: &Connection,
    token_hash: &str,
    google_sub: &str,
    email: Option<&str>,
    ttl_secs: i64,
) -> DbResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO pending_google (token_hash, google_sub, email, expires_at) VALUES (?1, ?2, ?3, ?4)",
        params![token_hash, google_sub, email, now_secs() + ttl_secs],
    )?;
    Ok(())
}

/// Consume a pending Google sign-up, returning `(google_sub, email)`.
pub fn take_pending_google(
    conn: &Connection,
    token_hash: &str,
) -> DbResult<Option<(String, Option<String>)>> {
    let row: Option<(String, Option<String>)> = conn
        .query_row(
            "SELECT google_sub, email FROM pending_google WHERE token_hash = ?1 AND expires_at > ?2",
            params![token_hash, now_secs()],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .optional()?;
    if row.is_some() {
        conn.execute(
            "DELETE FROM pending_google WHERE token_hash = ?1",
            params![token_hash],
        )?;
    }
    Ok(row)
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RatingRow {
    pub user_id: i64,
    pub mode: RatingMode,
    pub rating: f64,
    pub matches: i64,
    pub wins: i64,
    pub losses: i64,
    pub draws: i64,
    pub updated_at: Option<i64>,
}

impl RatingRow {
    pub fn new(user_id: i64, mode: RatingMode, params: &shengji_rating::Params) -> Self {
        RatingRow {
            user_id,
            mode,
            rating: params.initial_rating,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            updated_at: None,
        }
    }

    pub fn to_view(&self) -> RatingView {
        RatingView {
            rating: self.rating.round() as i64,
            matches: self.matches,
            wins: self.wins,
            losses: self.losses,
            draws: self.draws,
        }
    }
}

fn row_to_rating(row: &rusqlite::Row<'_>) -> rusqlite::Result<RatingRow> {
    let mode: String = row.get(1)?;
    Ok(RatingRow {
        user_id: row.get(0)?,
        mode: parse_mode(mode, 1)?,
        rating: row.get(2)?,
        matches: row.get(3)?,
        wins: row.get(4)?,
        losses: row.get(5)?,
        draws: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

const RATING_COLS: &str = "user_id, mode, rating, matches, wins, losses, draws, updated_at";

/// A user's rating on a ladder; a fresh default row if they have never played.
pub fn get_rating(
    conn: &Connection,
    user_id: i64,
    mode: RatingMode,
    params: &shengji_rating::Params,
) -> DbResult<RatingRow> {
    let row = conn
        .query_row(
            &format!("SELECT {RATING_COLS} FROM ratings WHERE user_id = ?1 AND mode = ?2"),
            params![user_id, mode.as_str()],
            row_to_rating,
        )
        .optional()?;
    Ok(row.unwrap_or_else(|| RatingRow::new(user_id, mode, params)))
}

pub fn upsert_rating(conn: &Connection, row: &RatingRow) -> DbResult<()> {
    conn.execute(
        "INSERT INTO ratings (user_id, mode, rating, matches, wins, losses, draws, updated_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) \
         ON CONFLICT(user_id, mode) DO UPDATE SET rating = excluded.rating, \
         matches = excluded.matches, wins = excluded.wins, losses = excluded.losses, \
         draws = excluded.draws, updated_at = excluded.updated_at",
        params![
            row.user_id,
            row.mode.as_str(),
            row.rating,
            row.matches,
            row.wins,
            row.losses,
            row.draws,
            row.updated_at
        ],
    )?;
    Ok(())
}

/// Top-rated users on a ladder (only users with at least one rated match).
/// `limit <= 0` means no limit.
pub fn leaderboard(
    conn: &Connection,
    mode: RatingMode,
    limit: i64,
) -> DbResult<Vec<(User, RatingRow)>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {}, {} FROM ratings r JOIN users u ON u.id = r.user_id \
         WHERE r.mode = ?1 AND r.matches > 0 ORDER BY r.rating DESC, r.matches DESC, u.username ASC LIMIT ?2",
        prefixed(USER_COLS, "u"),
        prefixed(RATING_COLS, "r"),
    ))?;
    let n_user = USER_COLS.split(", ").count();
    let rows = stmt.query_map(
        params![mode.as_str(), if limit <= 0 { -1 } else { limit }],
        |row| {
            let user = row_to_user(row)?;
            let mode: String = row.get(n_user + 1)?;
            let rating = RatingRow {
                user_id: row.get(n_user)?,
                mode: parse_mode(mode, n_user + 1)?,
                rating: row.get(n_user + 2)?,
                matches: row.get(n_user + 3)?,
                wins: row.get(n_user + 4)?,
                losses: row.get(n_user + 5)?,
                draws: row.get(n_user + 6)?,
                updated_at: row.get(n_user + 7)?,
            };
            Ok((user, rating))
        },
    )?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct MatchRecord {
    /// Idempotency key: `PropagatedState::match_key`.
    pub match_key: String,
    pub room: String,
    pub mode: RatingMode,
    pub rated: bool,
    /// Whether ratings were actually applied (rated and rateable).
    pub rating_applied: bool,
    /// The "first to rank N" target, as a rank string ("5", "A", "NT").
    pub first_to_rank: String,
    pub finished_at: i64,
    /// Rounds played in the match.
    pub rounds: i64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct MatchPlayerRecord {
    pub user_id: i64,
    /// Side index (teammates share a side).
    pub side: i64,
    /// Levels climbed (uncapped).
    pub levels: i64,
    pub final_rank: String,
    /// "won" | "lost" | "drawn"
    pub result: String,
    pub rating_before: Option<f64>,
    pub rating_after: Option<f64>,
    pub score: Option<f64>,
}

/// Whether a match with this key has already been recorded.
pub fn match_exists(conn: &Connection, match_key: &str) -> DbResult<bool> {
    Ok(conn
        .query_row(
            "SELECT 1 FROM matches WHERE match_key = ?1",
            params![match_key],
            |_| Ok(()),
        )
        .optional()?
        .is_some())
}

/// Insert a match and its players. Fails with `DbError::Duplicate` if the
/// key was already recorded.
pub fn insert_match(
    conn: &Connection,
    m: &MatchRecord,
    players: &[MatchPlayerRecord],
) -> DbResult<i64> {
    let res = conn.execute(
        "INSERT INTO matches (match_key, room, mode, rated, rating_applied, first_to_rank, finished_at, rounds) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            m.match_key,
            m.room,
            m.mode.as_str(),
            m.rated as i64,
            m.rating_applied as i64,
            m.first_to_rank,
            m.finished_at,
            m.rounds
        ],
    );
    match res {
        Ok(_) => {}
        Err(rusqlite::Error::SqliteFailure(e, _))
            if e.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            return Err(DbError::Duplicate);
        }
        Err(e) => return Err(e.into()),
    }
    let id = conn.last_insert_rowid();
    for p in players {
        conn.execute(
            "INSERT INTO match_players (match_id, user_id, side, levels, final_rank, result, rating_before, rating_after, score) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                id,
                p.user_id,
                p.side,
                p.levels,
                p.final_rank,
                p.result,
                p.rating_before,
                p.rating_after,
                p.score
            ],
        )?;
    }
    Ok(id)
}

/// A finished match as shown on account pages.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct MatchSummary {
    pub match_id: i64,
    pub mode: RatingMode,
    pub rated: bool,
    pub rating_applied: bool,
    pub first_to_rank: String,
    pub finished_at: i64,
    pub rounds: i64,
    pub players: Vec<MatchSummaryPlayer>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct MatchSummaryPlayer {
    pub username: String,
    pub side: i64,
    pub levels: i64,
    pub final_rank: String,
    pub result: String,
    pub rating_before: Option<f64>,
    pub rating_after: Option<f64>,
}

/// The most recent `limit` matches a user played, newest first.
pub fn recent_matches_for_user(
    conn: &Connection,
    user_id: i64,
    limit: i64,
) -> DbResult<Vec<MatchSummary>> {
    let mut stmt = conn.prepare(
        "SELECT m.id, m.mode, m.rated, m.rating_applied, m.first_to_rank, m.finished_at, m.rounds \
         FROM matches m JOIN match_players mp ON mp.match_id = m.id \
         WHERE mp.user_id = ?1 ORDER BY m.id DESC LIMIT ?2",
    )?;
    let heads = stmt
        .query_map(params![user_id, limit], |row| {
            let mode: String = row.get(1)?;
            Ok(MatchSummary {
                match_id: row.get(0)?,
                mode: parse_mode(mode, 1)?,
                rated: row.get::<_, i64>(2)? != 0,
                rating_applied: row.get::<_, i64>(3)? != 0,
                first_to_rank: row.get(4)?,
                finished_at: row.get(5)?,
                rounds: row.get(6)?,
                players: vec![],
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    let mut out = Vec::with_capacity(heads.len());
    let mut pstmt = conn.prepare(
        "SELECT u.username, mp.side, mp.levels, mp.final_rank, mp.result, mp.rating_before, mp.rating_after \
         FROM match_players mp JOIN users u ON u.id = mp.user_id WHERE mp.match_id = ?1 \
         ORDER BY mp.levels DESC, u.username ASC",
    )?;
    for mut h in heads {
        h.players = pstmt
            .query_map(params![h.match_id], |row| {
                Ok(MatchSummaryPlayer {
                    username: row.get(0)?,
                    side: row.get(1)?,
                    levels: row.get(2)?,
                    final_rank: row.get(3)?,
                    result: row.get(4)?,
                    rating_before: row.get(5)?,
                    rating_after: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        out.push(h);
    }
    Ok(out)
}

/// A rated match as needed to replay ratings: its players with the sides and
/// levels that were recorded, in recording order.
#[derive(Clone, Debug, PartialEq)]
pub struct RatedMatchRow {
    pub id: i64,
    pub mode: RatingMode,
    pub first_to_rank: String,
    pub finished_at: i64,
    pub players: Vec<RatedMatchPlayer>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct RatedMatchPlayer {
    pub user_id: i64,
    pub username: String,
    pub side: i64,
    pub levels: i64,
    pub rating_before: Option<f64>,
    pub rating_after: Option<f64>,
}

/// Every match whose ratings were applied, oldest first.
pub fn rated_matches_in_order(conn: &Connection) -> DbResult<Vec<RatedMatchRow>> {
    let mut stmt = conn.prepare(
        "SELECT id, mode, first_to_rank, finished_at FROM matches \
         WHERE rating_applied = 1 ORDER BY id ASC",
    )?;
    let heads = stmt
        .query_map([], |row| {
            let mode: String = row.get(1)?;
            Ok(RatedMatchRow {
                id: row.get(0)?,
                mode: parse_mode(mode, 1)?,
                first_to_rank: row.get(2)?,
                finished_at: row.get(3)?,
                players: vec![],
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    let mut pstmt = conn.prepare(
        "SELECT mp.user_id, u.username, mp.side, mp.levels, mp.rating_before, mp.rating_after \
         FROM match_players mp JOIN users u ON u.id = mp.user_id \
         WHERE mp.match_id = ?1 ORDER BY mp.rowid ASC",
    )?;
    let mut out = Vec::with_capacity(heads.len());
    for mut h in heads {
        h.players = pstmt
            .query_map(params![h.id], |row| {
                Ok(RatedMatchPlayer {
                    user_id: row.get(0)?,
                    username: row.get(1)?,
                    side: row.get(2)?,
                    levels: row.get(3)?,
                    rating_before: row.get(4)?,
                    rating_after: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        out.push(h);
    }
    Ok(out)
}

/// Overwrite the rating columns of one player's row in a match (replays).
pub fn update_match_player_rating(
    conn: &Connection,
    match_id: i64,
    user_id: i64,
    before: f64,
    after: f64,
    score: f64,
) -> DbResult<()> {
    conn.execute(
        "UPDATE match_players SET rating_before = ?3, rating_after = ?4, score = ?5 \
         WHERE match_id = ?1 AND user_id = ?2",
        params![match_id, user_id, before, after, score],
    )?;
    Ok(())
}

/// Delete every ladder row (a replay rebuilds them from the matches).
pub fn clear_ratings(conn: &Connection) -> DbResult<()> {
    conn.execute("DELETE FROM ratings", [])?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RoundRecord {
    /// Idempotency key: `PropagatedState::round_key` of the round.
    pub round_key: String,
    /// `PropagatedState::match_key` of the match the round belongs to.
    pub match_key: String,
    pub room: String,
    pub mode: RatingMode,
    pub played_at: i64,
    pub landlord_won: bool,
    pub level_delta: i64,
    pub non_landlords_points: i64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RoundPlayerRecord {
    pub user_id: i64,
    pub is_defender: bool,
    pub is_landlord: bool,
    pub won: bool,
    pub levels_gained: i64,
}

#[cfg(test)]
pub fn round_exists(conn: &Connection, round_key: &str) -> DbResult<bool> {
    Ok(conn
        .query_row(
            "SELECT 1 FROM rounds WHERE round_key = ?1",
            params![round_key],
            |_| Ok(()),
        )
        .optional()?
        .is_some())
}

/// Insert a round and its players. Fails with `DbError::Duplicate` if the
/// key was already recorded.
pub fn insert_round(
    conn: &Connection,
    round: &RoundRecord,
    players: &[RoundPlayerRecord],
) -> DbResult<i64> {
    let res = conn.execute(
        "INSERT INTO rounds (round_key, match_key, room, mode, played_at, landlord_won, level_delta, non_landlords_points) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            round.round_key,
            round.match_key,
            round.room,
            round.mode.as_str(),
            round.played_at,
            round.landlord_won as i64,
            round.level_delta,
            round.non_landlords_points,
        ],
    );
    match res {
        Ok(_) => {}
        Err(rusqlite::Error::SqliteFailure(e, _))
            if e.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            return Err(DbError::Duplicate);
        }
        Err(e) => return Err(e.into()),
    }
    let id = conn.last_insert_rowid();
    for p in players {
        conn.execute(
            "INSERT INTO round_players (round_id, user_id, is_defender, is_landlord, won, levels_gained) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                id,
                p.user_id,
                p.is_defender as i64,
                p.is_landlord as i64,
                p.won as i64,
                p.levels_gained
            ],
        )?;
    }
    Ok(id)
}

/// Rounds recorded for a match key.
#[cfg(test)]
pub fn rounds_in_match(conn: &Connection, match_key: &str) -> DbResult<i64> {
    Ok(conn.query_row(
        "SELECT COUNT(*) FROM rounds WHERE match_key = ?1",
        params![match_key],
        |r| r.get(0),
    )?)
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/// Lifetime statistics of a user across all rounds and matches (rated or
/// not).
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct UserStats {
    pub rounds: i64,
    pub rounds_won: i64,
    pub defender_rounds: i64,
    pub defender_wins: i64,
    pub landlord_rounds: i64,
    pub landlord_wins: i64,
    pub levels_gained: i64,
    pub matches: i64,
    pub matches_won: i64,
    pub matches_lost: i64,
    pub matches_drawn: i64,
    pub rated_matches: i64,
}

pub fn user_stats(conn: &Connection, user_id: i64) -> DbResult<UserStats> {
    let (
        rounds,
        rounds_won,
        defender_rounds,
        defender_wins,
        landlord_rounds,
        landlord_wins,
        levels_gained,
    ) = conn.query_row(
        "SELECT COUNT(*), COALESCE(SUM(won), 0), COALESCE(SUM(is_defender), 0), \
                    COALESCE(SUM(CASE WHEN is_defender = 1 AND won = 1 THEN 1 ELSE 0 END), 0), \
                    COALESCE(SUM(is_landlord), 0), \
                    COALESCE(SUM(CASE WHEN is_landlord = 1 AND won = 1 THEN 1 ELSE 0 END), 0), \
                    COALESCE(SUM(levels_gained), 0) \
             FROM round_players WHERE user_id = ?1",
        params![user_id],
        |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, i64>(1)?,
                r.get::<_, i64>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, i64>(4)?,
                r.get::<_, i64>(5)?,
                r.get::<_, i64>(6)?,
            ))
        },
    )?;
    let (matches, matches_won, matches_lost, matches_drawn, rated_matches) = conn.query_row(
        "SELECT COUNT(*), \
                COALESCE(SUM(CASE WHEN mp.result = 'won' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(CASE WHEN mp.result = 'lost' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(CASE WHEN mp.result = 'drawn' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(m.rating_applied), 0) \
         FROM match_players mp JOIN matches m ON m.id = mp.match_id WHERE mp.user_id = ?1",
        params![user_id],
        |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, i64>(1)?,
                r.get::<_, i64>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, i64>(4)?,
            ))
        },
    )?;
    Ok(UserStats {
        rounds,
        rounds_won,
        defender_rounds,
        defender_wins,
        landlord_rounds,
        landlord_wins,
        levels_gained,
        matches,
        matches_won,
        matches_lost,
        matches_drawn,
        rated_matches,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn users_sessions_roundtrip() {
        let db = Db::open_in_memory().unwrap();
        let conn = db.lock().unwrap();
        let u = create_user(&conn, "Alice", Some("sub-a"), None).unwrap();
        assert_eq!(u.username, "Alice");
        assert!(matches!(
            create_user(&conn, "alice", Some("sub-b"), None),
            Err(DbError::UsernameTaken)
        ));
        assert!(matches!(
            create_user(&conn, "bob", Some("sub-a"), None),
            Err(DbError::GoogleSubTaken)
        ));
        assert_eq!(
            get_user_by_username(&conn, "ALICE").unwrap().unwrap().id,
            u.id
        );
        assert_eq!(
            get_user_by_google_sub(&conn, "sub-a").unwrap().unwrap().id,
            u.id
        );
        create_session(&conn, u.id, "tok", 100).unwrap();
        assert_eq!(get_user_by_session(&conn, "tok").unwrap().unwrap().id, u.id);
        assert!(get_user_by_session(&conn, "nope").unwrap().is_none());
        create_session(&conn, u.id, "expired", -1).unwrap();
        assert!(get_user_by_session(&conn, "expired").unwrap().is_none());
        create_session(&conn, u.id, "t2", 100).unwrap();
        assert_eq!(delete_user_sessions(&conn, u.id, Some("tok")).unwrap(), 2);
        delete_session(&conn, "tok").unwrap();
        assert!(get_user_by_session(&conn, "tok").unwrap().is_none());
        // dev accounts have no google sub
        let d = create_user(&conn, "devuser", None, None).unwrap();
        assert!(d.google_sub.is_none());
    }

    #[test]
    fn google_pending() {
        let db = Db::open_in_memory().unwrap();
        let conn = db.lock().unwrap();
        create_pending_google(&conn, "p", "sub1", Some("a@b.c"), 100).unwrap();
        let (sub, email) = take_pending_google(&conn, "p").unwrap().unwrap();
        assert_eq!(sub, "sub1");
        assert_eq!(email.as_deref(), Some("a@b.c"));
        assert!(take_pending_google(&conn, "p").unwrap().is_none());
    }

    #[test]
    fn devices() {
        let db = Db::open_in_memory().unwrap();
        let conn = db.lock().unwrap();
        let a = create_user(&conn, "a", Some("sa"), None).unwrap();
        let b = create_user(&conn, "b", Some("sb"), None).unwrap();
        let c = create_user(&conn, "c", Some("sc"), None).unwrap();
        touch_user_device(&conn, a.id, "dev1").unwrap();
        touch_user_device(&conn, b.id, "dev1").unwrap();
        touch_user_device(&conn, c.id, "dev2").unwrap();
        let shared = shared_devices(&conn, &[a.id, b.id, c.id], 3600).unwrap();
        assert_eq!(shared, vec![(a.id, b.id, "dev1".to_string())]);
    }

    #[test]
    fn ratings_matches_rounds_and_stats() {
        let params = shengji_rating::Params::default();
        let db = Db::open_in_memory().unwrap();
        let conn = db.lock().unwrap();
        let a = create_user(&conn, "a", Some("sa"), None).unwrap();
        let b = create_user(&conn, "b", Some("sb"), None).unwrap();
        let fresh = get_rating(&conn, a.id, RatingMode::Team, &params).unwrap();
        assert_eq!(fresh.rating, 1500.0);
        assert_eq!(fresh.matches, 0);
        assert!(leaderboard(&conn, RatingMode::Team, 10).unwrap().is_empty());

        // one round in the match, then the match itself
        let round_id = insert_round(
            &conn,
            &RoundRecord {
                round_key: "r1".into(),
                match_key: "m1".into(),
                room: "room".into(),
                mode: RatingMode::OneVsOne,
                played_at: 1,
                landlord_won: true,
                level_delta: 3,
                non_landlords_points: 0,
            },
            &[
                RoundPlayerRecord {
                    user_id: a.id,
                    is_defender: true,
                    is_landlord: true,
                    won: true,
                    levels_gained: 3,
                },
                RoundPlayerRecord {
                    user_id: b.id,
                    is_defender: false,
                    is_landlord: false,
                    won: false,
                    levels_gained: 0,
                },
            ],
        )
        .unwrap();
        assert!(round_id > 0);
        assert!(round_exists(&conn, "r1").unwrap());
        assert!(matches!(
            insert_round(
                &conn,
                &RoundRecord {
                    round_key: "r1".into(),
                    match_key: "m1".into(),
                    room: "room".into(),
                    mode: RatingMode::OneVsOne,
                    played_at: 2,
                    landlord_won: false,
                    level_delta: 0,
                    non_landlords_points: 90,
                },
                &[],
            ),
            Err(DbError::Duplicate)
        ));
        assert_eq!(rounds_in_match(&conn, "m1").unwrap(), 1);

        let match_id = insert_match(
            &conn,
            &MatchRecord {
                match_key: "m1".into(),
                room: "room".into(),
                mode: RatingMode::OneVsOne,
                rated: true,
                rating_applied: true,
                first_to_rank: "5".into(),
                finished_at: 2,
                rounds: 1,
            },
            &[
                MatchPlayerRecord {
                    user_id: a.id,
                    side: 0,
                    levels: 3,
                    final_rank: "5".into(),
                    result: "won".into(),
                    rating_before: Some(1500.0),
                    rating_after: Some(1680.0),
                    score: Some(1.0),
                },
                MatchPlayerRecord {
                    user_id: b.id,
                    side: 1,
                    levels: 0,
                    final_rank: "2".into(),
                    result: "lost".into(),
                    rating_before: Some(1500.0),
                    rating_after: Some(1320.0),
                    score: Some(0.0),
                },
            ],
        )
        .unwrap();
        assert!(match_exists(&conn, "m1").unwrap());
        assert!(matches!(
            insert_match(
                &conn,
                &MatchRecord {
                    match_key: "m1".into(),
                    room: "room".into(),
                    mode: RatingMode::OneVsOne,
                    rated: true,
                    rating_applied: false,
                    first_to_rank: "5".into(),
                    finished_at: 3,
                    rounds: 1,
                },
                &[],
            ),
            Err(DbError::Duplicate)
        ));
        for (u, after, res) in [(&a, 1680.0, ("won", 1, 0)), (&b, 1320.0, ("lost", 0, 1))] {
            upsert_rating(
                &conn,
                &RatingRow {
                    user_id: u.id,
                    mode: RatingMode::OneVsOne,
                    rating: after,
                    matches: 1,
                    wins: res.1,
                    losses: res.2,
                    draws: 0,
                    updated_at: Some(2),
                },
            )
            .unwrap();
        }
        let lb = leaderboard(&conn, RatingMode::OneVsOne, 10).unwrap();
        assert_eq!(lb.len(), 2);
        assert_eq!(lb[0].0.username, "a");
        assert_eq!(lb[0].1.to_view().rating, 1680);
        assert!(leaderboard(&conn, RatingMode::Team, 10).unwrap().is_empty());

        let recent = recent_matches_for_user(&conn, b.id, 10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].match_id, match_id);
        assert_eq!(recent[0].players.len(), 2);
        assert_eq!(recent[0].players[0].username, "a");
        assert_eq!(recent[0].players[1].result, "lost");

        let stats = user_stats(&conn, a.id).unwrap();
        assert_eq!(
            stats,
            UserStats {
                rounds: 1,
                rounds_won: 1,
                defender_rounds: 1,
                defender_wins: 1,
                landlord_rounds: 1,
                landlord_wins: 1,
                levels_gained: 3,
                matches: 1,
                matches_won: 1,
                matches_lost: 0,
                matches_drawn: 0,
                rated_matches: 1,
            }
        );
        let stats_b = user_stats(&conn, b.id).unwrap();
        assert_eq!(stats_b.matches_lost, 1);
        assert_eq!(stats_b.defender_rounds, 0);
        assert_eq!(user_stats(&conn, 999).unwrap(), UserStats::default());
    }
}
