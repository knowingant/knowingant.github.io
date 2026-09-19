//! Accounts and sessions: Google sign-in (the only real sign-in), the
//! username pick for new Google accounts, a development-only login, and
//! session tokens.
//!
//! See `DESIGN.md` ("HTTP API") for the contract.

use std::net::{IpAddr, SocketAddr};
use std::sync::Arc;
use std::time::Duration;

use axum::async_trait;
use axum::extract::rejection::JsonRejection;
use axum::extract::{ConnectInfo, DefaultBodyLimit, FromRequest, FromRequestParts, State};
use axum::http::request::Parts;
use axum::http::{header, HeaderMap, Request, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use base64::Engine;
use rand::RngCore;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::config::Config;
use crate::db::{self, Db, DbError, User};

use shengji_types::RatingMode;

mod google;
mod ratelimit;

pub use google::{GoogleError, GoogleVerifier};
use ratelimit::RateLimiter;

/// Usernames nobody may register (case-insensitive), so server notices and
/// game messages can never be impersonated.
const RESERVED_USERNAMES: &[&str] = &[
    "game",
    "ratings",
    "system",
    "server",
    "admin",
    "moderator",
    "observer",
    "shengji",
];

/// How long a Google sign-in may wait for its username to be chosen.
const PENDING_GOOGLE_TTL_SECS: i64 = 10 * 60;

/// Request bodies on the auth routes are tiny; cap them.
const AUTH_BODY_LIMIT: usize = 16 * 1024;

const MSG_NOT_SIGNED_IN: &str = "not signed in";
const MSG_TOO_MANY_ATTEMPTS: &str = "too many attempts";
const MSG_GOOGLE_DISABLED: &str = "google sign-in is not enabled";
const MSG_DEV_LOGIN_DISABLED: &str = "dev sign-in is not enabled";
const MSG_PENDING_INVALID: &str = "google sign-in expired, please try again";

/// Rate limits, `(events, window)`.
#[derive(Clone, Debug)]
struct Limits {
    /// Google sign-in attempts per IP.
    google_ip: (usize, Duration),
    /// New accounts (google/complete, dev_login) per IP.
    register_ip: (usize, Duration),
}

impl Default for Limits {
    fn default() -> Self {
        Limits {
            google_ip: (30, Duration::from_secs(600)),
            register_ip: (20, Duration::from_secs(3600)),
        }
    }
}

/// Shared state for the auth routes (rate limiter, Google JWKS cache, ...).
#[derive(Clone)]
pub struct AuthState {
    pub db: Db,
    pub config: Arc<Config>,
    limits: Limits,
    /// Whether `Fly-Client-IP` is trusted for the client address
    /// (`TRUST_PROXY_HEADERS=1`).
    trust_proxy_headers: bool,
    limiter: Arc<RateLimiter>,
    google: Option<Arc<GoogleVerifier>>,
}

impl AuthState {
    pub fn new(db: Db, config: Arc<Config>) -> Self {
        let trust_proxy_headers = std::env::var("TRUST_PROXY_HEADERS")
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false);
        let google = config
            .google_client_id
            .clone()
            .map(|id| Arc::new(GoogleVerifier::new(id)));
        if config.dev_login {
            slog::warn!(
                crate::ROOT_LOGGER,
                "DEV_LOGIN is enabled: anyone can sign in as any username. Never run like this in production."
            );
        }
        AuthState {
            db,
            config,
            limits: Limits::default(),
            trust_proxy_headers,
            limiter: Arc::new(RateLimiter::new()),
            google,
        }
    }

    fn google(&self) -> Result<&GoogleVerifier, ApiError> {
        self.google
            .as_deref()
            .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, MSG_GOOGLE_DISABLED))
    }

    /// 429 if `key` already has `limit` events in `window`.
    fn check_limit(&self, key: &str, (limit, window): (usize, Duration)) -> Result<(), ApiError> {
        if self.limiter.count(key, window) >= limit {
            Err(ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                MSG_TOO_MANY_ATTEMPTS,
            ))
        } else {
            Ok(())
        }
    }
}

/// Routes under `/api/auth/...`. Mounted by `main.rs` with `.merge()`.
pub fn router(state: AuthState) -> Router {
    Router::new()
        .route("/api/auth/config", get(auth_config))
        .route("/api/auth/google", post(google_sign_in))
        .route("/api/auth/google/complete", post(google_complete))
        .route("/api/auth/dev_login", post(dev_login))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/logout_all", post(logout_all))
        .route("/api/auth/me", get(me))
        .layer(DefaultBodyLimit::max(AUTH_BODY_LIMIT))
        .with_state(state)
}

/// Resolve a bearer token (as sent by clients) to a user, or `None` if the
/// token is missing, malformed, unknown or expired.
///
/// Used by the websocket join handler.
pub fn user_for_token(db: &Db, token: &str) -> Option<User> {
    let token = token.trim();
    if token.is_empty() || token.len() > 128 {
        return None;
    }
    let hash = db::token_hash(token);
    db.with(|c| db::get_user_by_session(c, &hash))
        .ok()
        .flatten()
}

/// The `user` object of DESIGN.md: `{id, username, ratings: {team, "1v1"}}`.
pub fn user_view(db: &Db, config: &Config, user: &User) -> Value {
    let rating = |mode: RatingMode| {
        db.with(|c| db::get_rating(c, user.id, mode, &config.rating_params))
            .map(|r| r.to_view())
            .unwrap_or_else(|_| db::RatingRow::new(user.id, mode, &config.rating_params).to_view())
    };
    json!({
        "id": user.id,
        "username": user.username,
        "created_at": user.created_at,
        "ratings": {
            "team": rating(RatingMode::Team),
            "1v1": rating(RatingMode::OneVsOne),
        },
    })
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/// An error response: `{"error": message}` with a status.
#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub message: String,
}

impl ApiError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        ApiError {
            status,
            message: message.into(),
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        ApiError::new(StatusCode::BAD_REQUEST, message)
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        ApiError::new(StatusCode::NOT_FOUND, message)
    }

    fn not_signed_in() -> Self {
        ApiError::new(StatusCode::UNAUTHORIZED, MSG_NOT_SIGNED_IN)
    }

    pub fn internal() -> Self {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "internal error")
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "error": self.message }))).into_response()
    }
}

impl From<DbError> for ApiError {
    fn from(e: DbError) -> Self {
        match e {
            DbError::UsernameTaken => {
                ApiError::new(StatusCode::CONFLICT, "username is already taken")
            }
            DbError::GoogleSubTaken => ApiError::new(
                StatusCode::CONFLICT,
                "that google account is already linked to another user",
            ),
            DbError::Duplicate => ApiError::new(StatusCode::CONFLICT, "already recorded"),
            other => {
                slog::error!(crate::ROOT_LOGGER, "Database error in auth"; "error" => format!("{other}"));
                ApiError::internal()
            }
        }
    }
}

impl From<GoogleError> for ApiError {
    fn from(e: GoogleError) -> Self {
        match e {
            GoogleError::Invalid => {
                ApiError::new(StatusCode::UNAUTHORIZED, "invalid google credential")
            }
            GoogleError::Unavailable => ApiError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                "google sign-in is temporarily unavailable",
            ),
        }
    }
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

/// JSON body whose rejections are `{"error": ...}` (400) instead of axum's
/// plain-text ones.
pub struct AppJson<T>(pub T);

#[async_trait]
impl<S, B, T> FromRequest<S, B> for AppJson<T>
where
    Json<T>: FromRequest<S, B, Rejection = JsonRejection>,
    S: Send + Sync,
    B: Send + 'static,
{
    type Rejection = ApiError;

    async fn from_request(req: Request<B>, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(req, state).await {
            Ok(Json(v)) => Ok(AppJson(v)),
            Err(rejection) => Err(ApiError::bad_request(rejection.body_text())),
        }
    }
}

/// The client address used for rate limiting: the `Fly-Client-IP` header
/// when `TRUST_PROXY_HEADERS=1`, else the socket peer (`ConnectInfo`), else
/// `"unknown"` (e.g. under a test server without connect info).
pub struct ClientIp(pub String);

#[async_trait]
impl FromRequestParts<AuthState> for ClientIp {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AuthState,
    ) -> Result<Self, Self::Rejection> {
        if state.trust_proxy_headers {
            if let Some(ip) = parts
                .headers
                .get("fly-client-ip")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.trim().parse::<IpAddr>().ok())
            {
                return Ok(ClientIp(ip.to_string()));
            }
        }
        let ip = parts
            .extensions
            .get::<ConnectInfo<SocketAddr>>()
            .map(|c| c.0.ip().to_string())
            .unwrap_or_else(|| "unknown".to_string());
        Ok(ClientIp(ip))
    }
}

/// The signed-in user (401 `{"error": "not signed in"}` otherwise).
pub struct AuthUser {
    pub user: User,
    /// Hash of the session token this request used.
    pub token_hash: String,
}

#[async_trait]
impl FromRequestParts<AuthState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AuthState,
    ) -> Result<Self, Self::Rejection> {
        let token = bearer_token(&parts.headers).ok_or_else(ApiError::not_signed_in)?;
        let user = user_for_token(&state.db, token).ok_or_else(ApiError::not_signed_in)?;
        Ok(AuthUser {
            user,
            token_hash: db::token_hash(token),
        })
    }
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    let value = headers.get(header::AUTHORIZATION)?.to_str().ok()?;
    let (scheme, token) = value.trim().split_once(' ')?;
    if !scheme.eq_ignore_ascii_case("bearer") {
        return None;
    }
    let token = token.trim();
    if token.is_empty() || token.len() > 128 {
        None
    } else {
        Some(token)
    }
}

// ---------------------------------------------------------------------------
// Validation and helpers
// ---------------------------------------------------------------------------

/// 3–20 chars of `[A-Za-z0-9_]`, not reserved.
pub fn validate_username(name: &str) -> Result<(), &'static str> {
    if !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err("username may only contain letters, digits and underscores");
    }
    if !(3..=20).contains(&name.len()) {
        return Err("username must be 3 to 20 characters");
    }
    if name.starts_with('_')
        || RESERVED_USERNAMES
            .iter()
            .any(|r| r.eq_ignore_ascii_case(name))
    {
        return Err("that username is reserved");
    }
    Ok(())
}

/// An acceptable `device_id` (≤ 64 chars of `[A-Za-z0-9_-]`), else `None`.
pub fn clean_device_id(device_id: Option<&str>) -> Option<&str> {
    let d = device_id?.trim();
    let ok = !d.is_empty()
        && d.len() <= 64
        && d.chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-');
    ok.then_some(d)
}

/// 32 random bytes, base64url without padding (session and pending tokens).
fn new_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

/// Create a session for `user` (and record the device), returning
/// `{token, user}`.
fn issue_session(
    state: &AuthState,
    user: &User,
    device_id: Option<&str>,
) -> Result<Value, ApiError> {
    let token = new_token();
    let hash = db::token_hash(&token);
    state.db.with(|c| {
        db::create_session(c, user.id, &hash, state.config.session_ttl_secs)?;
        if let Some(d) = device_id {
            db::touch_user_device(c, user.id, d)?;
        }
        Ok(())
    })?;
    Ok(json!({
        "token": token,
        "user": user_view(&state.db, &state.config, user),
    }))
}

fn username_exists(db: &Db, name: &str) -> bool {
    db.with(|c| db::get_user_by_username(c, name))
        .map(|u| u.is_some())
        .unwrap_or(true)
}

/// A free username derived from the email's local part.
fn suggest_username(db: &Db, email_hint: Option<&str>) -> String {
    let mut base: String = email_hint
        .and_then(|e| e.split('@').next())
        .unwrap_or("")
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_')
        .skip_while(|c| *c == '_')
        .take(20)
        .collect();
    if validate_username(&base).is_err() {
        base = "player".to_string();
    }
    if !username_exists(db, &base) {
        return base;
    }
    for n in 1..=50u32 {
        let suffix = n.to_string();
        let mut candidate: String = base.chars().take(20 - suffix.len()).collect();
        candidate.push_str(&suffix);
        if !username_exists(db, &candidate) {
            return candidate;
        }
    }
    format!("player{}", rand::random::<u32>() % 1_000_000)
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct GoogleBody {
    credential: String,
    #[serde(default)]
    device_id: Option<String>,
}

#[derive(Deserialize)]
struct GoogleCompleteBody {
    pending: String,
    username: String,
    #[serde(default)]
    device_id: Option<String>,
}

#[derive(Deserialize)]
struct DevLoginBody {
    username: String,
    #[serde(default)]
    device_id: Option<String>,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// `GET /api/auth/config`
async fn auth_config(State(state): State<AuthState>) -> Json<Value> {
    Json(json!({
        "google_client_id": state.config.google_client_id,
        "dev_login": state.config.dev_login,
    }))
}

/// `POST /api/auth/google {credential, device_id?}` →
/// `{token, user}` for an existing account, else
/// `{needs_username: true, pending, suggested_username}`.
async fn google_sign_in(
    State(state): State<AuthState>,
    ClientIp(ip): ClientIp,
    AppJson(body): AppJson<GoogleBody>,
) -> Result<Json<Value>, ApiError> {
    let google = state.google()?;
    let key = format!("google-ip:{ip}");
    state.check_limit(&key, state.limits.google_ip)?;
    state.limiter.record(&key);

    let identity = google.verify(&body.credential).await?;
    let existing = state
        .db
        .with(|c| db::get_user_by_google_sub(c, &identity.sub))?;
    if let Some(user) = existing {
        return Ok(Json(issue_session(
            &state,
            &user,
            clean_device_id(body.device_id.as_deref()),
        )?));
    }

    let pending = new_token();
    let pending_hash = db::token_hash(&pending);
    state.db.with(|c| {
        db::create_pending_google(
            c,
            &pending_hash,
            &identity.sub,
            identity.email.as_deref(),
            PENDING_GOOGLE_TTL_SECS,
        )
    })?;
    let suggested = suggest_username(&state.db, identity.email_hint.as_deref());
    Ok(Json(json!({
        "needs_username": true,
        "pending": pending,
        "suggested_username": suggested,
    })))
}

/// `POST /api/auth/google/complete {pending, username, device_id?}` → `{token, user}`
async fn google_complete(
    State(state): State<AuthState>,
    ClientIp(ip): ClientIp,
    AppJson(body): AppJson<GoogleCompleteBody>,
) -> Result<Json<Value>, ApiError> {
    state.google()?;
    let username = body.username.trim();
    validate_username(username).map_err(ApiError::bad_request)?;

    let key = format!("register-ip:{ip}");
    state.check_limit(&key, state.limits.register_ip)?;
    state.limiter.record(&key);

    // Check availability first so a taken name does not burn the single-use
    // pending token.
    if username_exists(&state.db, username) {
        return Err(DbError::UsernameTaken.into());
    }

    let pending_hash = db::token_hash(body.pending.trim());
    let token = new_token();
    let token_hash = db::token_hash(&token);
    let device_id = clean_device_id(body.device_id.as_deref());
    let ttl = state.config.session_ttl_secs;
    // One transaction: consuming the pending token rolls back if the user
    // cannot be created (e.g. a lost race on the username).
    let res = state.db.transaction(|tx| {
        let (sub, email) = db::take_pending_google(tx, &pending_hash)?
            .ok_or_else(|| DbError::Other(MSG_PENDING_INVALID.to_string()))?;
        let user = db::create_user(tx, username, Some(&sub), email.as_deref())?;
        db::create_session(tx, user.id, &token_hash, ttl)?;
        if let Some(d) = device_id {
            db::touch_user_device(tx, user.id, d)?;
        }
        Ok(user)
    });
    let user = match res {
        Ok(user) => user,
        Err(DbError::Other(m)) if m == MSG_PENDING_INVALID => {
            return Err(ApiError::new(StatusCode::UNAUTHORIZED, MSG_PENDING_INVALID));
        }
        Err(e) => return Err(e.into()),
    };
    Ok(Json(json!({
        "token": token,
        "user": user_view(&state.db, &state.config, &user),
    })))
}

/// `POST /api/auth/dev_login {username, device_id?}` → `{token, user}`.
/// Only with `DEV_LOGIN=1`; creates the account if it does not exist.
async fn dev_login(
    State(state): State<AuthState>,
    ClientIp(ip): ClientIp,
    AppJson(body): AppJson<DevLoginBody>,
) -> Result<Json<Value>, ApiError> {
    if !state.config.dev_login {
        return Err(ApiError::new(StatusCode::NOT_FOUND, MSG_DEV_LOGIN_DISABLED));
    }
    let username = body.username.trim();
    validate_username(username).map_err(ApiError::bad_request)?;
    let key = format!("register-ip:{ip}");
    state.check_limit(&key, state.limits.register_ip)?;
    state.limiter.record(&key);

    let user = state
        .db
        .with(|c| match db::get_user_by_username(c, username)? {
            Some(u) => Ok(u),
            None => db::create_user(c, username, None, None),
        })?;
    Ok(Json(issue_session(
        &state,
        &user,
        clean_device_id(body.device_id.as_deref()),
    )?))
}

/// `POST /api/auth/logout` (auth) → 204; revokes this token only.
async fn logout(State(state): State<AuthState>, auth: AuthUser) -> Result<StatusCode, ApiError> {
    state.db.with(|c| db::delete_session(c, &auth.token_hash))?;
    Ok(StatusCode::NO_CONTENT)
}

/// `POST /api/auth/logout_all` (auth) → 204; revokes every session.
async fn logout_all(
    State(state): State<AuthState>,
    auth: AuthUser,
) -> Result<StatusCode, ApiError> {
    state
        .db
        .with(|c| db::delete_user_sessions(c, auth.user.id, None))?;
    Ok(StatusCode::NO_CONTENT)
}

/// `GET /api/auth/me` (auth) → `user`
async fn me(State(state): State<AuthState>, auth: AuthUser) -> Json<Value> {
    Json(user_view(&state.db, &state.config, &auth.user))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::{HeaderName, HeaderValue};
    use axum_test::{TestResponse, TestServer};
    use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};

    const CLIENT_ID: &str = "test-client-id.apps.googleusercontent.com";

    // Throwaway 2048-bit RSA key generated for these tests only.
    const TEST_KEY_PEM: &str = "-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLvloMXL2GfOZf
J8rnJt8NoMoFfhD+9kQT8r/hRAloEzE+CbUn2LLF05T7NGHf0iO/GWCMVcTg1wwX
wK0+vroTZJJAEaQXZr7bX8rot5ZVrt5El+FQJ3G4JJo7TrQAbNyJpEJggjBMfdM3
usMR9T9JTbV65DO/+Po6zQRuiWtcZIvVYGYHe5etpLiXibAIoSp8qZnFOiAiFux3
cH2kFnKiqSEMb/3M0XfwMO/xuAqJ2gB8auIJpgn8+3qWPHdwPz0nttFLgndslw7+
esEwSfq3cd1XtyiXmv3VGllRR3Tsfap25Yg2vWBqFsXInHCS8er15oCYfpNtmdf0
OjtBBx2ZAgMBAAECggEABRmTuTS+k+iEieFN/MfThEIFYIpm7EI3ksdsJRGTXzOr
c0CMtG2XZFM0dYPFMemENncRBxOUCPvqYXNTxYBCbzRrTUIrySABJcOxyW4Oq9XO
Wj7yLL6Urq3FibfBqB48IyVgOc3JyKELKb1UP0WJaEvdyltT43RSNikrg9qkfB88
PmnzagyF9iljJZDk6h8TBzcXMovatGNN+wqHWhMCnom6QbUPXXiOctv0HpF847D8
StkQhjgyTBRSeJgHoFYs+FD8+ZC4fo4mBvV/5SSlF2v/GrTAwEoQlDOi6lIGHDUY
9sldf32Wc9n0uHcZrmWx7S3CSPT6DqGnnTrgMBv6sQKBgQDrPNr6omik5TnM14zg
rSOHm49WSonaONgH3cXS5OzBja8NGQZxY/AZs91kpQj2Pamb3P6k/ymQRCR2t5iz
SF5DNad9erWeyPpq+kpgzkqKOh1b2Je8YuUNRnEwMmeq7Lsvs6xqs/BAubQ6nm9z
RnPnaeVcJDWLG1oW9V4HdbD9cQKBgQDdueSRVeGqi+sXMTfBgvy2XEGR/6AdZ0BU
usZPzaA5N+5LnsgZcEkfv8wrsY5Y2U6tM2kIhFlzpsIOl4ztsYegatbSrDHMHkR6
ErX36+J+adlAbEgxI68dBgjSrGe0EDrf2gOdqq+I0FhCQsaTYKfP0lsZo8udbUw+
0avOTz2uqQKBgQDnxw1H2E/c8RKTV2qyUUXprod7kXPkNQ/+KDBrjC4Ow4hQEnE7
tilzWbpxGP8MiFMehI/OiK8uO0XmRx3IwCxIcow14XskGYhLcZNpcLkXGw2kWnOf
JZ3kB50szO1CB4CkDpd6hxLY42DGRScw4KEAyWE4+WBcULXiWx6roPWjsQKBgQCR
4LH+5NAaEwBTO/CBApsdp8kEM3i2n631kQTUkGbv/lprqkXgZr3Vg6ziumj7D83x
qjdagSkRLA/U5eS0pe6jnmdEKEKDFw7aeeD7Alj77swe1J8SpXWa1NONOBzqnRr/
GEL0ws3GZ70Jq0FWyWrfEnkZf2iBZN2bHvu4Ou5MMQKBgE1q0peez5AvQ3RuwPMJ
r+Kyv+1IOC4Pd7neK55YruUfqDSFVDvDnIPhASVqrEAvZ87J+kf7N9cuAtCoMECW
EWLY6WtzIcymc7ADUVTZd4bbVpJvoWLpM04fvP4vOqXNtEDwtrMr1nNIoG1eRJ2p
ZRYeMaYEIqkY8auOnYyhKLJW
-----END PRIVATE KEY-----
";
    const TEST_KEY_N: &str = "y75aDFy9hnzmXyfK5ybfDaDKBX4Q_vZEE_K_4UQJaBMxPgm1J9iyxdOU-zRh39IjvxlgjFXE4NcMF8CtPr66E2SSQBGkF2a-21_K6LeWVa7eRJfhUCdxuCSaO060AGzciaRCYIIwTH3TN7rDEfU_SU21euQzv_j6Os0EbolrXGSL1WBmB3uXraS4l4mwCKEqfKmZxTogIhbsd3B9pBZyoqkhDG_9zNF38DDv8bgKidoAfGriCaYJ_Pt6ljx3cD89J7bRS4J3bJcO_nrBMEn6t3HdV7col5r91RpZUUd07H2qduWINr1gahbFyJxwkvHq9eaAmH6TbZnX9Do7QQcdmQ";
    const TEST_KEY_E: &str = "AQAB";
    const TEST_KID: &str = "test-kid-1";

    fn test_config(google_client_id: Option<&str>, dev_login: bool) -> Arc<Config> {
        Arc::new(Config {
            database_path: ":memory:".to_string(),
            session_ttl_secs: 3600,
            google_client_id: google_client_id.map(String::from),
            dev_login,
            static_dir: None,
            port: 0,
            rating_params: shengji_rating::Params::default(),
        })
    }

    fn test_state(google_client_id: Option<&str>, dev_login: bool) -> AuthState {
        let db = Db::open_in_memory().unwrap();
        let mut state = AuthState::new(db, test_config(google_client_id, dev_login));
        state.trust_proxy_headers = false;
        state
    }

    fn server(state: &AuthState) -> TestServer {
        TestServer::new(router(state.clone())).unwrap()
    }

    fn bearer(token: &str) -> (HeaderName, HeaderValue) {
        (
            header::AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
        )
    }

    async fn me(server: &TestServer, token: &str) -> TestResponse {
        let (name, value) = bearer(token);
        server.get("/api/auth/me").add_header(name, value).await
    }

    async fn dev(server: &TestServer, username: &str) -> TestResponse {
        server
            .post("/api/auth/dev_login")
            .json(&json!({ "username": username, "device_id": format!("dev-{username}") }))
            .await
    }

    fn token_of(resp: &TestResponse) -> String {
        resp.json::<Value>()["token"].as_str().unwrap().to_string()
    }

    fn error_of(resp: &TestResponse) -> String {
        let body = resp.json::<Value>();
        assert_eq!(body.as_object().unwrap().len(), 1, "{body}");
        body["error"].as_str().unwrap().to_string()
    }

    fn google_token(claims: &Value, kid: &str) -> String {
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some(kid.to_string());
        encode(
            &header,
            claims,
            &EncodingKey::from_rsa_pem(TEST_KEY_PEM.as_bytes()).unwrap(),
        )
        .unwrap()
    }

    fn google_claims(sub: &str, email: &str) -> Value {
        let now = db::now_secs();
        json!({
            "iss": "https://accounts.google.com",
            "aud": CLIENT_ID,
            "sub": sub,
            "email": email,
            "email_verified": true,
            "iat": now,
            "exp": now + 300,
        })
    }

    fn install_test_keys(state: &AuthState) {
        state
            .google
            .as_ref()
            .unwrap()
            .set_keys_for_tests(vec![google::Jwk {
                kid: TEST_KID.to_string(),
                kty: "RSA".to_string(),
                alg: Some("RS256".to_string()),
                n: TEST_KEY_N.to_string(),
                e: TEST_KEY_E.to_string(),
            }]);
    }

    async fn google(server: &TestServer, claims: &Value) -> TestResponse {
        server
            .post("/api/auth/google")
            .json(&json!({ "credential": google_token(claims, TEST_KID), "device_id": "dev-g" }))
            .await
    }

    #[tokio::test]
    async fn config_reports_sign_in_methods() {
        let s1 = server(&test_state(None, false));
        let resp = s1.get("/api/auth/config").await;
        assert_eq!(resp.status_code(), StatusCode::OK);
        assert_eq!(
            resp.json::<Value>(),
            json!({ "google_client_id": null, "dev_login": false })
        );
        let server2 = server(&test_state(Some(CLIENT_ID), true));
        assert_eq!(
            server2.get("/api/auth/config").await.json::<Value>(),
            json!({ "google_client_id": CLIENT_ID, "dev_login": true })
        );
    }

    #[tokio::test]
    async fn dev_login_creates_and_reuses_accounts() {
        let state = test_state(None, true);
        let server = server(&state);
        let a = dev(&server, "alice").await;
        assert_eq!(a.status_code(), StatusCode::OK, "{}", a.text());
        let body = a.json::<Value>();
        assert_eq!(body["user"]["username"], "alice");
        assert_eq!(body["user"]["ratings"]["team"]["rating"], 1500);
        assert_eq!(body["user"]["ratings"]["1v1"]["matches"], 0);
        let t1 = token_of(&a);
        let again = dev(&server, "alice").await;
        assert_eq!(again.status_code(), StatusCode::OK);
        assert_eq!(again.json::<Value>()["user"]["id"], body["user"]["id"]);
        let m = me(&server, &t1).await;
        assert_eq!(m.status_code(), StatusCode::OK);
        assert_eq!(m.json::<Value>()["username"], "alice");
        // bad names
        assert_eq!(
            dev(&server, "ab").await.status_code(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            dev(&server, "GAME").await.status_code(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            dev(&server, "a b").await.status_code(),
            StatusCode::BAD_REQUEST
        );
    }

    #[tokio::test]
    async fn dev_login_is_404_when_disabled() {
        let server = server(&test_state(Some(CLIENT_ID), false));
        let resp = dev(&server, "alice").await;
        assert_eq!(resp.status_code(), StatusCode::NOT_FOUND);
        assert_eq!(error_of(&resp), MSG_DEV_LOGIN_DISABLED);
    }

    #[tokio::test]
    async fn me_without_or_with_bad_token_is_401() {
        let server = server(&test_state(None, true));
        let resp = server.get("/api/auth/me").await;
        assert_eq!(resp.status_code(), StatusCode::UNAUTHORIZED);
        assert_eq!(error_of(&resp), MSG_NOT_SIGNED_IN);
        let resp = me(&server, "nope").await;
        assert_eq!(resp.status_code(), StatusCode::UNAUTHORIZED);
        assert_eq!(error_of(&resp), MSG_NOT_SIGNED_IN);
    }

    #[tokio::test]
    async fn logout_and_logout_all() {
        let server = server(&test_state(None, true));
        let t1 = token_of(&dev(&server, "alice").await);
        let t2 = token_of(&dev(&server, "alice").await);
        let (n, v) = bearer(&t1);
        let resp = server.post("/api/auth/logout").add_header(n, v).await;
        assert_eq!(resp.status_code(), StatusCode::NO_CONTENT);
        assert_eq!(
            me(&server, &t1).await.status_code(),
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(me(&server, &t2).await.status_code(), StatusCode::OK);
        let t3 = token_of(&dev(&server, "alice").await);
        let (n, v) = bearer(&t2);
        let resp = server.post("/api/auth/logout_all").add_header(n, v).await;
        assert_eq!(resp.status_code(), StatusCode::NO_CONTENT);
        assert_eq!(
            me(&server, &t2).await.status_code(),
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            me(&server, &t3).await.status_code(),
            StatusCode::UNAUTHORIZED
        );
    }

    #[tokio::test]
    async fn google_endpoints_are_404_when_disabled() {
        let server = server(&test_state(None, true));
        let resp = server
            .post("/api/auth/google")
            .json(&json!({ "credential": "x" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::NOT_FOUND);
        assert_eq!(error_of(&resp), MSG_GOOGLE_DISABLED);
        let resp = server
            .post("/api/auth/google/complete")
            .json(&json!({ "pending": "x", "username": "alice" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn google_sign_in_complete_and_return() {
        let state = test_state(Some(CLIENT_ID), false);
        install_test_keys(&state);
        let server = server(&state);

        // First sign-in: needs a username.
        let resp = google(&server, &google_claims("sub-1", "Alice.Smith@gmail.com")).await;
        assert_eq!(resp.status_code(), StatusCode::OK, "{}", resp.text());
        let body = resp.json::<Value>();
        assert_eq!(body["needs_username"], true);
        assert_eq!(body["suggested_username"], "AliceSmith");
        let pending = body["pending"].as_str().unwrap().to_string();

        // Bad username choices don't consume the pending token.
        let resp = server
            .post("/api/auth/google/complete")
            .json(&json!({ "pending": pending, "username": "system" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::BAD_REQUEST);

        let resp = server
            .post("/api/auth/google/complete")
            .json(&json!({ "pending": pending, "username": "alice", "device_id": "dev-a" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::OK, "{}", resp.text());
        let token = token_of(&resp);
        assert_eq!(
            me(&server, &token).await.json::<Value>()["username"],
            "alice"
        );

        // The pending token is single use.
        let resp = server
            .post("/api/auth/google/complete")
            .json(&json!({ "pending": pending, "username": "alice2" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::UNAUTHORIZED);
        assert_eq!(error_of(&resp), MSG_PENDING_INVALID);

        // Returning user: straight to a session.
        let resp = google(&server, &google_claims("sub-1", "alice.smith@gmail.com")).await;
        assert_eq!(resp.status_code(), StatusCode::OK);
        let body = resp.json::<Value>();
        assert_eq!(body["user"]["username"], "alice");
        assert!(body["token"].is_string());

        // A second Google account can't take the same username.
        let resp = google(&server, &google_claims("sub-2", "bob@gmail.com")).await;
        let pending2 = resp.json::<Value>()["pending"]
            .as_str()
            .unwrap()
            .to_string();
        let resp = server
            .post("/api/auth/google/complete")
            .json(&json!({ "pending": pending2, "username": "ALICE" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn google_rejects_bad_tokens() {
        let state = test_state(Some(CLIENT_ID), false);
        install_test_keys(&state);
        let server = server(&state);
        let now = db::now_secs();
        let mut wrong_aud = google_claims("s", "a@b.c");
        wrong_aud["aud"] = json!("other-client");
        let mut expired = google_claims("s", "a@b.c");
        expired["exp"] = json!(now - 3600);
        let mut no_aud = google_claims("s", "a@b.c");
        no_aud.as_object_mut().unwrap().remove("aud");
        let mut no_iss = google_claims("s", "a@b.c");
        no_iss.as_object_mut().unwrap().remove("iss");
        let mut bad_iss = google_claims("s", "a@b.c");
        bad_iss["iss"] = json!("https://evil.example");
        for claims in [wrong_aud, expired, no_aud, no_iss, bad_iss] {
            let resp = google(&server, &claims).await;
            assert_eq!(resp.status_code(), StatusCode::UNAUTHORIZED, "{claims}");
        }
        let resp = server
            .post("/api/auth/google")
            .json(&json!({ "credential": "not.a.jwt" }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn register_rate_limit_returns_429() {
        let state = test_state(None, true);
        let server = server(&state);
        for i in 0..state.limits.register_ip.0 {
            let resp = dev(&server, &format!("user{i}")).await;
            assert_eq!(resp.status_code(), StatusCode::OK);
        }
        let resp = dev(&server, "onemore").await;
        assert_eq!(resp.status_code(), StatusCode::TOO_MANY_REQUESTS);
        assert_eq!(error_of(&resp), MSG_TOO_MANY_ATTEMPTS);
    }

    #[tokio::test]
    async fn json_rejections_are_error_objects() {
        let server = server(&test_state(None, true));
        let resp = server
            .post("/api/auth/dev_login")
            .text("not json")
            .content_type("application/json")
            .await;
        assert_eq!(resp.status_code(), StatusCode::BAD_REQUEST);
        assert!(resp.json::<Value>()["error"].is_string());
        let resp = server
            .post("/api/auth/dev_login")
            .json(&json!({ "nope": 1 }))
            .await;
        assert_eq!(resp.status_code(), StatusCode::BAD_REQUEST);
        assert!(resp.json::<Value>()["error"].is_string());
    }

    #[test]
    fn username_and_device_validation() {
        assert!(validate_username("alice").is_ok());
        assert!(validate_username("Al1ce_99").is_ok());
        assert!(validate_username("ab").is_err());
        assert!(validate_username("a".repeat(21).as_str()).is_err());
        assert!(validate_username("al ice").is_err());
        assert!(validate_username("_alice").is_err());
        assert!(validate_username("Ratings").is_err());
        assert!(validate_username("alice (2)").is_err());
        assert_eq!(clean_device_id(Some(" abc-DEF_1 ")), Some("abc-DEF_1"));
        assert_eq!(clean_device_id(Some("")), None);
        assert_eq!(clean_device_id(Some("has space")), None);
        assert_eq!(clean_device_id(Some(&"x".repeat(65))), None);
        assert_eq!(clean_device_id(None), None);
    }

    #[test]
    fn user_for_token_rejects_junk() {
        let db = Db::open_in_memory().unwrap();
        assert!(user_for_token(&db, "").is_none());
        assert!(user_for_token(&db, &"x".repeat(200)).is_none());
        assert!(user_for_token(&db, "unknown").is_none());
    }
}
