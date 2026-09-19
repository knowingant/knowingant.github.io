//! Runtime configuration, read once from environment variables.

use std::sync::Arc;

#[derive(Clone, Debug)]
pub struct Config {
    /// SQLite database file.
    pub database_path: String,
    /// Session token lifetime.
    pub session_ttl_secs: i64,
    /// Google OAuth web client ID (Google sign-in is disabled when `None`).
    pub google_client_id: Option<String>,
    /// `DEV_LOGIN=1`: enable `POST /api/auth/dev_login` (any username, no
    /// password). Local development only.
    pub dev_login: bool,
    /// Directory of the built frontend to serve at `/`, if any.
    pub static_dir: Option<String>,
    /// Port to listen on.
    pub port: u16,
    /// Rating parameters.
    pub rating_params: shengji_rating::Params,
}

impl Config {
    pub fn from_env() -> Arc<Config> {
        let session_ttl_days: i64 = std::env::var("SESSION_TTL_DAYS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(180);
        let static_dir = std::env::var("STATIC_DIR").ok().filter(|s| !s.is_empty());
        #[cfg(feature = "dynamic")]
        let static_dir = static_dir.or_else(|| Some("../frontend/dist".to_string()));
        Arc::new(Config {
            database_path: std::env::var("DATABASE_PATH")
                .unwrap_or_else(|_| "./shengji.db".to_string()),
            session_ttl_secs: session_ttl_days * 86_400,
            google_client_id: std::env::var("GOOGLE_CLIENT_ID")
                .ok()
                .filter(|s| !s.is_empty()),
            dev_login: std::env::var("DEV_LOGIN")
                .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
                .unwrap_or(false),
            static_dir,
            port: std::env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3030),
            rating_params: shengji_rating::Params::default(),
        })
    }
}
