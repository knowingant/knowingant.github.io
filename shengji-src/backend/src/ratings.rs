//! Match results → ratings and statistics, plus the leaderboard and account
//! endpoints.
//!
//! See `DESIGN.md` ("Rated matches", "Account pages") and `RATINGS.md`.

use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use slog::error;

use shengji_core::settings::{GameModeSettings, MatchStanding, PlayerMode};
use shengji_mechanics::types::Rank;
use shengji_rating::{rate_match, Standing};
use shengji_types::{RatingChange, RatingMode, RatingView};

use crate::auth::{self, ApiError};
use crate::config::Config;
use crate::db::{
    self, Db, DbError, DbResult, MatchPlayerRecord, MatchRecord, RoundPlayerRecord, RoundRecord,
};

/// Suffix of a 1v1 user's second seat name (`alice (2)`).
pub const SEAT2_SUFFIX: &str = " (2)";

/// Two users who shared a device within this window are not rated
/// against each other.
pub const SHARED_DEVICE_WINDOW_SECS: i64 = 30 * 86_400;

/// Matches shown on an account page.
pub const RECENT_MATCHES: i64 = 20;

pub const DEFAULT_LEADERBOARD_LIMIT: usize = 50;
pub const MAX_LEADERBOARD_LIMIT: usize = 200;

/// Name of a 1v1 user's second seat.
pub fn seat2_name(username: &str) -> String {
    format!("{username}{SEAT2_SUFFIX}")
}

/// The account behind a seat name (`alice (2)` → `alice`).
pub fn username_for_seat(seat_name: &str) -> &str {
    seat_name.strip_suffix(SEAT2_SUFFIX).unwrap_or(seat_name)
}

/// Charset check for names taken from URLs (the account rules are stricter;
/// this only keeps junk out of queries).
pub fn valid_username(username: &str) -> bool {
    !username.is_empty()
        && username.len() <= 20
        && username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_')
}

/// Current ratings for a set of seat names, keyed by the seat name. Unknown
/// names are omitted.
pub fn ratings_for_seat_names(
    db: &Db,
    config: &Config,
    mode: RatingMode,
    seat_names: &[String],
) -> HashMap<String, RatingView> {
    let usernames: Vec<String> = seat_names
        .iter()
        .map(|s| username_for_seat(s).to_string())
        .collect();
    let res = db.with(|c| {
        let users = db::get_users_by_usernames(c, &usernames)?;
        let mut out = HashMap::new();
        for seat in seat_names {
            if let Some(u) = users.get(username_for_seat(seat)) {
                let row = db::get_rating(c, u.id, mode, &config.rating_params)?;
                out.insert(seat.clone(), row.to_view());
            }
        }
        Ok(out)
    });
    match res {
        Ok(m) => m,
        Err(e) => {
            error!(crate::ROOT_LOGGER, "Failed to load room ratings"; "error" => format!("{e:?}"));
            HashMap::new()
        }
    }
}

// ---------------------------------------------------------------------------
// Outcomes captured by the websocket handler
// ---------------------------------------------------------------------------

/// One seat's result in a finished round (from `GameFinished`).
#[derive(Clone, Debug, PartialEq)]
pub struct SeatRoundResult {
    pub name: String,
    pub is_defending: bool,
    pub is_landlord: bool,
    pub won_game: bool,
    pub ranks_up: usize,
}

/// A finished round, recorded for statistics.
#[derive(Clone, Debug, PartialEq)]
pub struct RoundOutcome {
    pub room: String,
    pub round_key: String,
    pub match_key: String,
    pub player_mode: PlayerMode,
    pub landlord_won: bool,
    /// Level delta of the winning side.
    pub level_delta: usize,
    pub non_landlords_points: isize,
    pub seats: Vec<SeatRoundResult>,
}

/// A finished match (from `MatchFinished`).
#[derive(Clone, Debug, PartialEq)]
pub struct MatchOutcome {
    pub room: String,
    pub match_key: String,
    pub player_mode: PlayerMode,
    pub game_mode: GameModeSettings,
    /// The room's `rated` setting.
    pub rated: bool,
    pub first_to_rank: Rank,
    /// In seat (player) order.
    pub standings: Vec<MatchStanding>,
    /// Rounds the match took.
    pub rounds: usize,
}

impl MatchOutcome {
    pub fn mode(&self) -> RatingMode {
        RatingMode::from_player_mode(self.player_mode)
    }
}

/// Result of [`apply_match`].
#[derive(Clone, Debug, PartialEq)]
pub enum MatchResult {
    /// Ratings were applied.
    Rated {
        match_id: i64,
        mode: RatingMode,
        changes: Vec<RatingChange>,
    },
    /// Recorded for statistics only; `reason` says why it was not rated.
    Recorded { match_id: i64, reason: String },
    /// Nothing was recorded (duplicate or unknown accounts).
    Skipped(String),
}

/// One user's standing, aggregated over their seats.
#[derive(Clone, Debug, PartialEq)]
pub struct UserStanding {
    pub username: String,
    /// Index of the user's first seat in player order.
    pub first_seat: usize,
    pub levels: usize,
    pub rank: Rank,
    pub winner: bool,
}

/// Collapse seat standings into one entry per user (first-appearance order).
pub fn user_standings(standings: &[MatchStanding]) -> Vec<UserStanding> {
    let mut out: Vec<UserStanding> = vec![];
    for (i, s) in standings.iter().enumerate() {
        let name = username_for_seat(&s.name);
        if let Some(u) = out.iter_mut().find(|u| u.username == name) {
            u.levels = u.levels.max(s.levels);
            u.rank = u.rank.max(s.rank);
            u.winner |= s.winner;
        } else {
            out.push(UserStanding {
                username: name.to_string(),
                first_seat: i,
                levels: s.levels,
                rank: s.rank,
                winner: s.winner,
            });
        }
    }
    out
}

/// Side index of each user for the rating call: Tractor → seat parity;
/// Finding Friends and 1v1 → each user their own side.
pub fn sides(outcome: &MatchOutcome, users: &[UserStanding]) -> Vec<usize> {
    match (outcome.player_mode, outcome.game_mode) {
        (PlayerMode::Standard, GameModeSettings::Tractor) => {
            users.iter().map(|u| u.first_seat % 2).collect()
        }
        _ => (0..users.len()).collect(),
    }
}

/// Why a match in a rated room cannot be rated, if anything.
fn unrateable_reason(outcome: &MatchOutcome, users: &[UserStanding]) -> Option<String> {
    if !outcome.rated {
        return Some("this room is unrated".to_string());
    }
    match outcome.player_mode {
        PlayerMode::Standard if users.len() < 4 => Some("fewer than 4 players".to_string()),
        PlayerMode::OneVsOne if users.len() != 2 => {
            Some("1v1 matches need exactly 2 players".to_string())
        }
        _ => None,
    }
}

fn result_word(u: &UserStanding, users: &[UserStanding]) -> &'static str {
    if u.winner {
        "won"
    } else if users.iter().any(|o| o.winner) {
        "lost"
    } else {
        "drawn"
    }
}

/// Record a finished round for statistics. Returns the round id, or `None`
/// if it was already recorded or a seat does not map to an account.
pub fn record_round(db: &Db, outcome: &RoundOutcome) -> DbResult<Option<i64>> {
    // One entry per user.
    let mut per_user: Vec<(String, RoundPlayerRecord)> = vec![];
    for s in &outcome.seats {
        let name = username_for_seat(&s.name).to_string();
        if let Some((_, r)) = per_user.iter_mut().find(|(n, _)| *n == name) {
            r.is_defender |= s.is_defending;
            r.is_landlord |= s.is_landlord;
            r.won |= s.won_game;
            r.levels_gained = r.levels_gained.max(s.ranks_up as i64);
        } else {
            per_user.push((
                name,
                RoundPlayerRecord {
                    user_id: 0,
                    is_defender: s.is_defending,
                    is_landlord: s.is_landlord,
                    won: s.won_game,
                    levels_gained: s.ranks_up as i64,
                },
            ));
        }
    }
    let names: Vec<String> = per_user.iter().map(|(n, _)| n.clone()).collect();
    let mode = RatingMode::from_player_mode(outcome.player_mode);
    db.transaction(|tx| {
        let users = db::get_users_by_usernames(tx, &names)?;
        let mut players = Vec::with_capacity(per_user.len());
        for (name, mut rec) in per_user.clone() {
            match users.get(&name) {
                Some(u) => {
                    rec.user_id = u.id;
                    players.push(rec);
                }
                None => return Ok(None),
            }
        }
        match db::insert_round(
            tx,
            &RoundRecord {
                round_key: outcome.round_key.clone(),
                match_key: outcome.match_key.clone(),
                room: outcome.room.clone(),
                mode,
                played_at: db::now_secs(),
                landlord_won: outcome.landlord_won,
                level_delta: outcome.level_delta as i64,
                non_landlords_points: outcome.non_landlords_points as i64,
            },
            &players,
        ) {
            Ok(id) => Ok(Some(id)),
            Err(DbError::Duplicate) => Ok(None),
            Err(e) => Err(e),
        }
    })
}

/// Record a finished match and, when the room is rated and the match is
/// rateable, apply the rating changes (one SQLite transaction, idempotent on
/// `match_key`).
pub fn apply_match(db: &Db, config: &Config, outcome: &MatchOutcome) -> DbResult<MatchResult> {
    let users = user_standings(&outcome.standings);
    if users.is_empty() {
        return Ok(MatchResult::Skipped("no players".to_string()));
    }
    let names: Vec<String> = users.iter().map(|u| u.username.clone()).collect();
    let mode = outcome.mode();
    let params = &config.rating_params;
    // "First to rank N" is N − 2 levels; Rank::index() already counts from 2.
    let t = outcome.first_to_rank.index().max(1);
    let side_of = sides(outcome, &users);
    let mut reason = unrateable_reason(outcome, &users);

    db.transaction(|tx| {
        if db::match_exists(tx, &outcome.match_key)? {
            return Ok(MatchResult::Skipped(
                "this match was already recorded".to_string(),
            ));
        }
        let accounts = db::get_users_by_usernames(tx, &names)?;
        let mut ids = Vec::with_capacity(users.len());
        for u in &users {
            match accounts.get(&u.username) {
                Some(a) => ids.push(a.id),
                None => {
                    return Ok(MatchResult::Skipped(format!(
                        "{} is not a registered account",
                        u.username
                    )))
                }
            }
        }
        if reason.is_none() {
            if let Some((a, b, _)) = db::shared_devices(tx, &ids, SHARED_DEVICE_WINDOW_SECS)?
                .into_iter()
                .next()
            {
                let name = |id: i64| {
                    users
                        .iter()
                        .zip(ids.iter())
                        .find(|(_, i)| **i == id)
                        .map(|(u, _)| u.username.clone())
                        .unwrap_or_default()
                };
                reason = Some(format!(
                    "{} and {} played from the same device",
                    name(a),
                    name(b)
                ));
            }
        }
        let apply = reason.is_none();
        let now = db::now_secs();
        let rows: Vec<db::RatingRow> = ids
            .iter()
            .map(|&id| db::get_rating(tx, id, mode, params))
            .collect::<DbResult<_>>()?;
        let changes = if apply {
            let standings: Vec<Standing> = users
                .iter()
                .zip(rows.iter())
                .zip(side_of.iter())
                .map(|((u, r), &side)| Standing {
                    rating: r.rating,
                    levels: u.levels,
                    side,
                })
                .collect();
            rate_match(params, t, &standings)
        } else {
            vec![]
        };
        let mut players = Vec::with_capacity(users.len());
        let mut change_views = Vec::with_capacity(users.len());
        for (i, u) in users.iter().enumerate() {
            let row = &rows[i];
            let (before, after, score) = if apply {
                let c = changes[i];
                let mut new_row = row.clone();
                new_row.rating = c.after;
                new_row.matches += 1;
                if c.score > 0.5 {
                    new_row.wins += 1;
                } else if c.score < 0.5 {
                    new_row.losses += 1;
                } else {
                    new_row.draws += 1;
                }
                new_row.updated_at = Some(now);
                db::upsert_rating(tx, &new_row)?;
                let b = c.before.round() as i64;
                let a = c.after.round() as i64;
                change_views.push(RatingChange {
                    username: u.username.clone(),
                    before: b,
                    after: a,
                    delta: a - b,
                    levels: u.levels.min(t) as i64,
                    score: c.score,
                });
                (Some(c.before), Some(c.after), Some(c.score))
            } else {
                (None, None, None)
            };
            players.push(MatchPlayerRecord {
                user_id: ids[i],
                side: side_of[i] as i64,
                levels: u.levels as i64,
                final_rank: u.rank.as_str().to_string(),
                result: result_word(u, &users).to_string(),
                rating_before: before,
                rating_after: after,
                score,
            });
        }
        let match_id = db::insert_match(
            tx,
            &MatchRecord {
                match_key: outcome.match_key.clone(),
                room: outcome.room.clone(),
                mode,
                rated: outcome.rated,
                rating_applied: apply,
                first_to_rank: outcome.first_to_rank.as_str().to_string(),
                finished_at: now,
                rounds: outcome.rounds as i64,
            },
            &players,
        )?;
        Ok(if apply {
            MatchResult::Rated {
                match_id,
                mode,
                changes: change_views,
            }
        } else {
            MatchResult::Recorded {
                match_id,
                reason: reason.clone().unwrap_or_default(),
            }
        })
    })
}

// ---------------------------------------------------------------------------
// HTTP: leaderboard and account pages
// ---------------------------------------------------------------------------

/// Shared state for the rating routes.
#[derive(Clone)]
pub struct RatingsState {
    pub db: Db,
    pub config: Arc<Config>,
}

impl RatingsState {
    pub fn new(db: Db, config: Arc<Config>) -> Self {
        RatingsState { db, config }
    }
}

/// Routes: `GET /api/leaderboard`, `GET /api/users/:username`.
pub fn router(state: RatingsState) -> Router {
    Router::new()
        .route("/api/leaderboard", get(leaderboard))
        .route("/api/users/:username", get(user_profile))
        .with_state(state)
}

#[derive(Deserialize)]
struct LeaderboardQuery {
    mode: Option<String>,
    limit: Option<String>,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct LeaderboardEntry {
    pub username: String,
    pub rating: i64,
    pub matches: i64,
    pub wins: i64,
    pub losses: i64,
    pub draws: i64,
}

pub fn leaderboard_view(
    db: &Db,
    mode: RatingMode,
    limit: usize,
) -> DbResult<Vec<LeaderboardEntry>> {
    db.with(|c| {
        Ok(db::leaderboard(c, mode, limit as i64)?
            .into_iter()
            .map(|(u, r)| LeaderboardEntry {
                username: u.username,
                rating: r.rating.round() as i64,
                matches: r.matches,
                wins: r.wins,
                losses: r.losses,
                draws: r.draws,
            })
            .collect())
    })
}

async fn leaderboard(
    State(state): State<RatingsState>,
    Query(q): Query<LeaderboardQuery>,
) -> Result<Json<Value>, ApiError> {
    let mode: RatingMode = q
        .mode
        .as_deref()
        .unwrap_or("team")
        .parse()
        .map_err(|_| ApiError::bad_request("mode must be team or 1v1"))?;
    let limit = match q.limit.as_deref() {
        None => DEFAULT_LEADERBOARD_LIMIT,
        Some(s) => s
            .parse::<usize>()
            .ok()
            .filter(|n| *n >= 1)
            .ok_or_else(|| ApiError::bad_request("limit must be a positive number"))?
            .min(MAX_LEADERBOARD_LIMIT),
    };
    let entries = leaderboard_view(&state.db, mode, limit)?;
    Ok(Json(json!({ "entries": entries })))
}

/// The account page payload (DESIGN.md, "Account pages").
pub fn profile_view(db: &Db, config: &Config, user: &db::User) -> DbResult<Value> {
    let mut v = auth::user_view(db, config, user);
    let (stats, recent) = db.with(|c| {
        Ok((
            db::user_stats(c, user.id)?,
            db::recent_matches_for_user(c, user.id, RECENT_MATCHES)?,
        ))
    })?;
    let recent: Vec<Value> = recent
        .into_iter()
        .map(|m| {
            let me = m.players.iter().find(|p| p.username == user.username);
            let (levels, result, before, after) = me
                .map(|p| (p.levels, p.result.clone(), p.rating_before, p.rating_after))
                .unwrap_or((0, "drawn".to_string(), None, None));
            let delta = match (before, after) {
                (Some(b), Some(a)) => Some(a.round() as i64 - b.round() as i64),
                _ => None,
            };
            json!({
                "match_id": m.match_id,
                "mode": m.mode,
                "rated": m.rated,
                "rating_applied": m.rating_applied,
                "first_to_rank": m.first_to_rank,
                "finished_at": m.finished_at,
                "rounds": m.rounds,
                "players": m.players.iter().map(|p| json!({
                    "username": p.username,
                    "side": p.side,
                    "levels": p.levels,
                    "final_rank": p.final_rank,
                    "result": p.result,
                    "rating_before": p.rating_before.map(|r| r.round() as i64),
                    "rating_after": p.rating_after.map(|r| r.round() as i64),
                })).collect::<Vec<_>>(),
                "levels": levels,
                "result": result,
                "rating_before": before.map(|r| r.round() as i64),
                "rating_after": after.map(|r| r.round() as i64),
                "delta": delta,
            })
        })
        .collect();
    if let Some(obj) = v.as_object_mut() {
        obj.insert("stats".to_string(), json!(stats));
        obj.insert("recent_matches".to_string(), json!(recent));
    }
    Ok(v)
}

async fn user_profile(
    State(state): State<RatingsState>,
    path: Result<Path<String>, axum::extract::rejection::PathRejection>,
) -> Result<Json<Value>, ApiError> {
    let Path(username) = path.map_err(|_| ApiError::not_found("unknown user"))?;
    if !valid_username(&username) {
        return Err(ApiError::not_found("unknown user"));
    }
    let user = state
        .db
        .with(|c| db::get_user_by_username(c, &username))?
        .ok_or_else(|| ApiError::not_found("unknown user"))?;
    Ok(Json(profile_view(&state.db, &state.config, &user)?))
}

#[cfg(test)]
mod tests {
    use super::*;
    use shengji_mechanics::types::{Number, PlayerID};

    fn config() -> Config {
        Config {
            database_path: ":memory:".to_string(),
            session_ttl_secs: 3600,
            google_client_id: None,
            dev_login: true,
            static_dir: None,
            port: 0,
            rating_params: shengji_rating::Params::default(),
        }
    }

    fn standing(i: usize, name: &str, rank: Rank, target: Rank) -> MatchStanding {
        MatchStanding {
            player: PlayerID(i),
            name: name.to_string(),
            rank,
            levels: rank.index(),
            winner: rank >= target,
        }
    }

    const R2: Rank = Rank::Number(Number::Two);
    const R4: Rank = Rank::Number(Number::Four);
    const R5: Rank = Rank::Number(Number::Five);

    fn outcome_1v1(rated: bool, key: &str) -> MatchOutcome {
        MatchOutcome {
            room: "room".into(),
            match_key: key.into(),
            player_mode: PlayerMode::OneVsOne,
            game_mode: GameModeSettings::Tractor,
            rated,
            first_to_rank: R5,
            standings: vec![
                standing(0, "alice", R5, R5),
                standing(1, "bob", R2, R5),
                standing(2, "alice (2)", R5, R5),
                standing(3, "bob (2)", R2, R5),
            ],
            rounds: 1,
        }
    }

    #[test]
    fn seat_helpers() {
        assert_eq!(seat2_name("alice"), "alice (2)");
        assert_eq!(username_for_seat("alice (2)"), "alice");
        assert_eq!(username_for_seat("alice"), "alice");
        assert!(valid_username("alice_1"));
        assert!(!valid_username("alice (2)"));
        assert!(!valid_username(""));
    }

    #[test]
    fn user_standings_collapse_seats_and_sides() {
        let o = outcome_1v1(true, "k");
        let users = user_standings(&o.standings);
        assert_eq!(users.len(), 2);
        assert_eq!(users[0].username, "alice");
        assert!(users[0].winner && users[0].levels == 3);
        assert_eq!(users[1].username, "bob");
        assert_eq!(sides(&o, &users), vec![0, 1]);

        let team = MatchOutcome {
            player_mode: PlayerMode::Standard,
            standings: vec![
                standing(0, "a", R5, R5),
                standing(1, "b", R4, R5),
                standing(2, "c", R5, R5),
                standing(3, "d", R4, R5),
            ],
            ..outcome_1v1(true, "t")
        };
        let users = user_standings(&team.standings);
        assert_eq!(sides(&team, &users), vec![0, 1, 0, 1]);
        let ff = MatchOutcome {
            game_mode: GameModeSettings::FindingFriends { num_friends: None },
            ..team.clone()
        };
        assert_eq!(sides(&ff, &users), vec![0, 1, 2, 3]);
    }

    fn make_users(db: &Db, names: &[&str]) {
        db.with(|c| {
            for n in names {
                db::create_user(c, n, None, None)?;
            }
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn apply_match_rates_a_1v1_shutout_once() {
        let db = Db::open_in_memory().unwrap();
        let cfg = config();
        make_users(&db, &["alice", "bob"]);
        let res = apply_match(&db, &cfg, &outcome_1v1(true, "m1")).unwrap();
        match res {
            MatchResult::Rated { mode, changes, .. } => {
                assert_eq!(mode, RatingMode::OneVsOne);
                assert_eq!(changes.len(), 2);
                assert_eq!(
                    (changes[0].before, changes[0].after, changes[0].delta),
                    (1500, 1680, 180)
                );
                assert_eq!(
                    (changes[1].before, changes[1].after, changes[1].delta),
                    (1500, 1320, -180)
                );
                assert_eq!(changes[0].levels, 3);
                assert_eq!(changes[0].score, 1.0);
            }
            other => panic!("{:?}", other),
        }
        // idempotent
        assert!(matches!(
            apply_match(&db, &cfg, &outcome_1v1(true, "m1")).unwrap(),
            MatchResult::Skipped(_)
        ));
        let lb = leaderboard_view(&db, RatingMode::OneVsOne, 10).unwrap();
        assert_eq!(lb[0].username, "alice");
        assert_eq!((lb[0].rating, lb[0].matches, lb[0].wins), (1680, 1, 1));
        assert_eq!((lb[1].rating, lb[1].losses), (1320, 1));
        let u = db
            .with(|c| db::get_user_by_username(c, "bob"))
            .unwrap()
            .unwrap();
        let profile = profile_view(&db, &cfg, &u).unwrap();
        assert_eq!(profile["stats"]["matches_lost"], 1);
        assert_eq!(profile["recent_matches"][0]["delta"], -180);
        assert_eq!(profile["recent_matches"][0]["result"], "lost");
        assert_eq!(profile["ratings"]["1v1"]["rating"], 1320);
    }

    #[test]
    fn unrated_and_shared_device_matches_are_recorded_without_rating() {
        let db = Db::open_in_memory().unwrap();
        let cfg = config();
        make_users(&db, &["alice", "bob"]);
        match apply_match(&db, &cfg, &outcome_1v1(false, "u1")).unwrap() {
            MatchResult::Recorded { reason, .. } => assert!(reason.contains("unrated")),
            other => panic!("{:?}", other),
        }
        db.with(|c| {
            let a = db::get_user_by_username(c, "alice")?.unwrap();
            let b = db::get_user_by_username(c, "bob")?.unwrap();
            db::touch_user_device(c, a.id, "same")?;
            db::touch_user_device(c, b.id, "same")
        })
        .unwrap();
        match apply_match(&db, &cfg, &outcome_1v1(true, "u2")).unwrap() {
            MatchResult::Recorded { reason, .. } => {
                assert!(reason.contains("same device"), "{}", reason)
            }
            other => panic!("{:?}", other),
        }
        let u = db
            .with(|c| db::get_user_by_username(c, "alice"))
            .unwrap()
            .unwrap();
        let stats = db.with(|c| db::user_stats(c, u.id)).unwrap();
        assert_eq!(
            (stats.matches, stats.matches_won, stats.rated_matches),
            (2, 2, 0)
        );
        assert_eq!(
            db.with(|c| db::get_rating(c, u.id, RatingMode::OneVsOne, &cfg.rating_params))
                .unwrap()
                .rating,
            1500.0
        );
        // unknown account -> skipped
        let mut o = outcome_1v1(true, "u3");
        o.standings[1].name = "ghost".into();
        assert!(matches!(
            apply_match(&db, &cfg, &o).unwrap(),
            MatchResult::Skipped(_)
        ));
    }

    #[test]
    fn team_and_finding_friends_matches() {
        let db = Db::open_in_memory().unwrap();
        let cfg = config();
        make_users(&db, &["a", "b", "c", "d"]);
        let team = MatchOutcome {
            player_mode: PlayerMode::Standard,
            standings: vec![
                standing(0, "a", R5, R5),
                standing(1, "b", R4, R5),
                standing(2, "c", R5, R5),
                standing(3, "d", R4, R5),
            ],
            ..outcome_1v1(true, "t1")
        };
        match apply_match(&db, &cfg, &team).unwrap() {
            MatchResult::Rated { mode, changes, .. } => {
                assert_eq!(mode, RatingMode::Team);
                assert_eq!(changes[0].delta, 120);
                assert_eq!(changes[2].delta, 120);
                assert_eq!(changes[1].delta, -120);
            }
            other => panic!("{:?}", other),
        }
        // fewer than four players in a standard room -> recorded, not rated
        let small = MatchOutcome {
            player_mode: PlayerMode::Standard,
            standings: vec![standing(0, "a", R5, R5), standing(1, "b", R2, R5)],
            ..outcome_1v1(true, "t2")
        };
        assert!(matches!(
            apply_match(&db, &cfg, &small).unwrap(),
            MatchResult::Recorded { .. }
        ));
        // Fresh accounts so everyone starts at 1500 again.
        make_users(&db, &["e", "f", "g", "h"]);
        let ff = MatchOutcome {
            player_mode: PlayerMode::Standard,
            game_mode: GameModeSettings::FindingFriends { num_friends: None },
            standings: vec![
                standing(0, "e", R5, R5),
                standing(1, "f", R5, R5),
                standing(2, "g", R4, R5),
                standing(3, "h", R2, R5),
            ],
            ..outcome_1v1(true, "t3")
        };
        match apply_match(&db, &cfg, &ff).unwrap() {
            MatchResult::Rated { changes, .. } => {
                // a/b: mean of 0.5, 0.833, 1.0 = 0.778 -> +100; c: -30; d: -170
                assert_eq!(changes[0].delta, 100);
                assert_eq!(changes[1].delta, 100);
                assert_eq!(changes[2].delta, -30);
                assert_eq!(changes[3].delta, -170);
                let total: i64 = changes.iter().map(|c| c.delta).sum();
                assert!(total.abs() <= 2, "{}", total);
            }
            other => panic!("{:?}", other),
        }
    }

    #[test]
    fn record_round_collapses_seats_and_is_idempotent() {
        let db = Db::open_in_memory().unwrap();
        make_users(&db, &["alice", "bob"]);
        let seat = |name: &str, def: bool, ll: bool, won: bool, up: usize| SeatRoundResult {
            name: name.into(),
            is_defending: def,
            is_landlord: ll,
            won_game: won,
            ranks_up: up,
        };
        let outcome = RoundOutcome {
            room: "room".into(),
            round_key: "r1".into(),
            match_key: "m1".into(),
            player_mode: PlayerMode::OneVsOne,
            landlord_won: true,
            level_delta: 2,
            non_landlords_points: 10,
            seats: vec![
                seat("alice", true, true, true, 2),
                seat("bob", false, false, false, 0),
                seat("alice (2)", true, false, true, 2),
                seat("bob (2)", false, false, false, 0),
            ],
        };
        assert!(record_round(&db, &outcome).unwrap().is_some());
        assert!(record_round(&db, &outcome).unwrap().is_none());
        let a = db
            .with(|c| db::get_user_by_username(c, "alice"))
            .unwrap()
            .unwrap();
        let stats = db.with(|c| db::user_stats(c, a.id)).unwrap();
        assert_eq!(
            (
                stats.rounds,
                stats.rounds_won,
                stats.landlord_rounds,
                stats.levels_gained
            ),
            (1, 1, 1, 2)
        );
    }
}
