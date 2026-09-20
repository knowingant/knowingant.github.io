#![deny(warnings)]

use std::net::SocketAddr;
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use axum::{
    extract::ws::{Message, WebSocketUpgrade},
    response::{IntoResponse, Redirect},
    routing::{get, post},
    Extension, Json, Router,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use slog::{debug, error, info, o, Drain, Logger};
use tokio::sync::{mpsc, Mutex};

use http::{HeaderValue, Method};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};

use shengji_core::settings;
use shengji_mechanics::types::FULL_DECK;
use shengji_types::ZSTD_ZSTD_DICT;
use storage::{HashMapStorage, Storage};

mod auth;
mod config;
mod db;
mod ratings;
mod serving_types;
mod shengji_handler;
mod state_dump;
mod utils;
mod wasm_rpc_handler;

use config::Config;
use db::Db;
use serving_types::{CardsBlob, VersionedGame};
use state_dump::InMemoryStats;

/// Our global unique user id counter.
static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1);

lazy_static::lazy_static! {
    static ref CARDS_JSON: CardsBlob = CardsBlob {
        cards: FULL_DECK.iter().map(|c| c.as_info()).collect()
    };

    static ref ROOT_LOGGER: Logger = {
        #[cfg(not(feature = "dynamic"))]
        let drain = slog_bunyan::default(std::io::stdout());
        #[cfg(feature = "dynamic")]
        let drain = slog_term::FullFormat::new(slog_term::TermDecorator::new().build()).build();

        let version = std::env::var("VERSION").unwrap_or_else(|_| "unknown_dev".to_string());

        Logger::root(
            slog_async::Async::new(drain.fuse()).build().fuse(),
            o!("version" => version)
        )
    };

    static ref ZSTD_COMPRESSOR: std::sync::Mutex<zstd::bulk::Compressor<'static>> = {
        // default zstd dictionary size is 112_640
        let comp = zstd::bulk::Compressor::with_dictionary(0, &zstd::bulk::decompress(ZSTD_ZSTD_DICT, 112_640).unwrap()).unwrap();
        std::sync::Mutex::new(comp)
    };

    static ref VERSION: String = {
        std::env::var("VERSION").unwrap_or_else(|_| "unknown_dev".to_string())
    };

    static ref DUMP_PATH: String = {
        std::env::var("DUMP_PATH").unwrap_or_else(|_| "/tmp/shengji_state.json".to_string())
    };
    static ref MESSAGE_PATH: String = {
        std::env::var("MESSAGE_PATH").unwrap_or_else(|_| "/tmp/shengji_messages.json".to_string())
    };
}

/// `runtime.js` for the case where the backend serves the frontend itself:
/// same-origin API, so `_API_HOST` is empty.
async fn runtime_settings() -> impl IntoResponse {
    let body = format!(
        "window._API_HOST = \"\";window._VERSION = \"{}\";",
        *VERSION
    );
    (
        [(http::header::CONTENT_TYPE, "text/javascript; charset=utf-8")],
        body,
    )
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let config = Config::from_env();
    info!(ROOT_LOGGER, "Loaded configuration";
        "database_path" => &config.database_path,
        "static_dir" => config.static_dir.as_deref().unwrap_or("<none>"),
        "google_sign_in" => config.google_client_id.is_some(),
        "port" => config.port,
    );

    // `shengji replay-ratings`: recompute every rated match with the current
    // formula (after changing it) and exit. Run with the server stopped or
    // between matches; it is one transaction and idempotent.
    if std::env::args().nth(1).as_deref() == Some("replay-ratings") {
        let db = Db::open(&config.database_path)?;
        let report = ratings::replay_ratings(&db, &config)?;
        println!(
            "replayed {} rated match(es) in {}",
            report.len(),
            config.database_path
        );
        for m in &report {
            println!(
                "match {} ({} ladder, first to {}):",
                m.match_id,
                m.mode.as_str(),
                m.first_to_rank
            );
            for p in &m.players {
                let (b, a) = p.replayed;
                match p.stored {
                    Some((sb, sa)) if (sb, sa) != (b, a) => println!(
                        "  {}: was {} -> {}, now {} -> {} ({:+})",
                        p.username,
                        sb,
                        sa,
                        b,
                        a,
                        a - b
                    ),
                    _ => println!("  {}: {} -> {} ({:+})", p.username, b, a, a - b),
                }
            }
        }
        return Ok(());
    }

    let db = Db::open(&config.database_path)?;
    let _ = db.with(|c| db::delete_expired_sessions(c));

    let (backend_storage, stats) = state_dump::load_state().await?;

    tokio::task::spawn(periodically_dump_state(
        backend_storage.clone(),
        stats.clone(),
    ));

    // SIGINT/SIGTERM: write one last state dump before exiting. The signal
    // handler runs on its own thread and cannot await, so it only wakes the
    // task that does the dumping.
    let shutdown = Arc::new(tokio::sync::Notify::new());
    tokio::task::spawn(dump_state_and_exit(
        shutdown.clone(),
        backend_storage.clone(),
        stats.clone(),
    ));
    ctrlc::set_handler(move || {
        info!(ROOT_LOGGER, "Received SIGTERM, shutting down");
        shutdown.notify_one();
    })
    .unwrap();

    let app = Router::new()
        .route("/api", get(handle_websocket))
        .route("/api/rpc", post(wasm_rpc_handler::handle_wasm_rpc))
        .merge(auth::router(auth::AuthState::new(
            db.clone(),
            config.clone(),
        )))
        .merge(ratings::router(ratings::RatingsState::new(
            db.clone(),
            config.clone(),
        )))
        .route(
            "/default_settings.json",
            get(|| async { Json(settings::PropagatedState::default()) }),
        )
        .route("/stats", get(get_stats))
        .route("/runtime.js", get(runtime_settings))
        .route("/cards.json", get(|| async { Json(CARDS_JSON.clone()) }))
        .route(
            "/rules",
            get(|| async { Redirect::permanent("/rules.html") }),
        )
        .route("/public_games.json", get(state_dump::public_games));

    let app = match config.static_dir.as_deref() {
        Some(dir) => {
            let index = std::path::Path::new(dir).join("index.html");
            app.fallback_service(ServeDir::new(dir).fallback(ServeFile::new(index)))
        }
        None => app,
    };

    // Configure CORS based on environment variables
    // CORS_ALLOWED_ORIGINS: comma-separated list of allowed origins (e.g., "http://localhost:3000,https://example.com")
    // Set to "*" to allow any origin (not recommended for production)
    // If not set, defaults to allowing localhost origins in development
    let cors = {
        let allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
            .unwrap_or_else(|_| {
                // Default to common development origins if not specified
                "http://localhost:3000,http://localhost:3030,http://127.0.0.1:3000,http://127.0.0.1:3030".to_string()
            });

        if allowed_origins.trim() == "*" {
            // Allow any origin (use with caution)
            info!(
                ROOT_LOGGER,
                "CORS configured to allow ANY origin - not recommended for production"
            );
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
                // `Authorization` is a "CORS non-wildcard request-header":
                // it must be listed explicitly, `*` does not cover it.
                .allow_headers([http::header::AUTHORIZATION, http::header::CONTENT_TYPE])
                .max_age(std::time::Duration::from_secs(600))
        } else {
            let origins: Vec<HeaderValue> = allowed_origins
                .split(',')
                .filter_map(|origin| origin.trim().parse::<HeaderValue>().ok())
                .collect();

            if origins.is_empty() {
                // If no valid origins, fall back to same-origin only
                info!(
                    ROOT_LOGGER,
                    "No valid CORS origins configured, using same-origin policy"
                );
                CorsLayer::new()
            } else {
                info!(ROOT_LOGGER, "CORS origins configured: {:?}", origins);
                CorsLayer::new()
                    .allow_origin(AllowOrigin::list(origins))
                    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
                    .allow_headers([http::header::AUTHORIZATION, http::header::CONTENT_TYPE])
                    .max_age(std::time::Duration::from_secs(600))
            }
        }
    };

    let app = app
        .layer(cors)
        .layer(Extension(backend_storage))
        .layer(Extension(stats))
        .layer(Extension(db))
        .layer(Extension(config.clone()));

    axum::Server::bind(&SocketAddr::from(([0, 0, 0, 0], config.port)))
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await?;

    info!(ROOT_LOGGER, "Shutting down");
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
struct GameStats {
    num_games_created: u64,
    num_active_games: usize,
    num_players_online_now: usize,
    sha: &'static str,
}

async fn get_stats(
    Extension(backend_storage): Extension<HashMapStorage<VersionedGame>>,
) -> Result<Json<GameStats>, &'static str> {
    let num_games_created = backend_storage
        .clone()
        .get_states_created()
        .await
        .map_err(|_| "failed to get number of games created")?;
    let (num_active_games, num_players_online_now) = backend_storage
        .clone()
        .stats()
        .await
        .map_err(|_| "failed to get number of active games and online players")?;
    Ok(Json(GameStats {
        num_games_created,
        num_players_online_now,
        num_active_games,
        sha: &VERSION,
    }))
}

async fn periodically_dump_state(
    backend_storage: HashMapStorage<VersionedGame>,
    stats: Arc<Mutex<InMemoryStats>>,
) {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
    loop {
        interval.tick().await;
        let _ =
            state_dump::dump_state(Extension(backend_storage.clone()), Extension(stats.clone()))
                .await;
    }
}

/// Wait for the shutdown signal, dump the state one last time (at most five
/// seconds), then exit.
async fn dump_state_and_exit(
    shutdown: Arc<tokio::sync::Notify>,
    backend_storage: HashMapStorage<VersionedGame>,
    stats: Arc<Mutex<InMemoryStats>>,
) {
    shutdown.notified().await;
    let dump = state_dump::dump_state(Extension(backend_storage), Extension(stats));
    match tokio::time::timeout(tokio::time::Duration::from_secs(5), dump).await {
        Ok(Ok(_)) => info!(ROOT_LOGGER, "Wrote the final state dump"),
        Ok(Err(e)) => error!(ROOT_LOGGER, "Failed to write the final state dump"; "error" => e),
        Err(_) => error!(ROOT_LOGGER, "Timed out writing the final state dump"),
    }
    std::process::exit(0);
}

/// Origins allowed to open websockets (same list as CORS). `None` = any.
fn allowed_origins() -> Option<Vec<String>> {
    let raw = std::env::var("CORS_ALLOWED_ORIGINS").unwrap_or_else(|_| {
        "http://localhost:3000,http://localhost:3030,http://127.0.0.1:3000,http://127.0.0.1:3030"
            .to_string()
    });
    if raw.trim() == "*" {
        return None;
    }
    Some(
        raw.split(',')
            .map(|s| s.trim().trim_end_matches('/').to_ascii_lowercase())
            .filter(|s| !s.is_empty())
            .collect(),
    )
}

async fn handle_websocket(
    ws: WebSocketUpgrade,
    headers: http::HeaderMap,
    Extension(backend_storage): Extension<HashMapStorage<VersionedGame>>,
    Extension(stats): Extension<Arc<Mutex<InMemoryStats>>>,
    Extension(db): Extension<Db>,
    Extension(config): Extension<Arc<Config>>,
) -> axum::response::Response {
    // Browsers always send `Origin` on websocket upgrades; if it is present
    // and not one of ours, refuse. (Bearer tokens in the first message are the
    // real authentication; this is defense in depth.) Same-origin requests
    // (the backend serving the frontend itself) carry the backend's own
    // origin, which is accepted by comparing against the Host header.
    if let Some(origin) = headers
        .get(http::header::ORIGIN)
        .and_then(|v| v.to_str().ok())
    {
        let origin = origin.trim_end_matches('/').to_ascii_lowercase();
        let host = headers
            .get(http::header::HOST)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_ascii_lowercase();
        let same_origin = !host.is_empty()
            && (origin == format!("http://{host}") || origin == format!("https://{host}"));
        if let Some(allowed) = allowed_origins() {
            if !same_origin && !allowed.contains(&origin) {
                info!(ROOT_LOGGER, "Rejected websocket from disallowed origin"; "origin" => origin);
                return (http::StatusCode::FORBIDDEN, "origin not allowed").into_response();
            }
        }
    }
    // Frames are capped at 64 KiB (DESIGN.md, "WebSocket protocol"): no
    // legitimate client message comes close.
    let ws = ws.max_message_size(64 * 1024).max_frame_size(64 * 1024);
    ws.on_upgrade(|ws| {
        let ws_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);
        let logger = ROOT_LOGGER.new(o!("ws_id" => ws_id));
        info!(logger, "Websocket connection initialized");
        // Split the socket into a sender and receive of messages.
        let (mut user_ws_tx, mut user_ws_rx) = ws.split();

        // Use an unbounded channel to handle buffering and flushing of messages
        // to the websocket...
        let logger_ = logger.clone();
        let (tx, mut rx) = mpsc::unbounded_channel();
        tokio::task::spawn(async move {
            while let Some(v) = rx.recv().await {
                let _ = user_ws_tx.send(Message::Binary(v)).await;
            }
            debug!(logger_, "Ending tx task");
        });

        // And another channel to receive messages from the websocket
        let logger_ = logger.clone();
        let (tx2, rx2) = mpsc::unbounded_channel();
        tokio::task::spawn(async move {
            while let Some(result) = user_ws_rx.next().await {
                match result {
                    Ok(Message::Close(_)) => {
                        break;
                    }
                    Ok(Message::Binary(r)) => {
                        let _ = tx2.send(r);
                    }
                    Ok(Message::Text(r)) => {
                        let _ = tx2.send(r.into_bytes());
                    }
                    Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => (),
                    Err(e) => {
                        error!(logger_, "Failed to fetch message"; "error" => format!("{e:?}"));
                        break;
                    }
                }
            }
            debug!(logger_, "Ending rx task");
        });

        shengji_handler::entrypoint(
            tx,
            rx2,
            ws_id,
            logger,
            backend_storage,
            stats,
            shengji_handler::SessionServices { db, config },
        )
    })
    .into_response()
}

#[cfg(test)]
mod tests {
    use super::CARDS_JSON;

    static CARDS_JSON_FROM_FILE: &str = include_str!("../../frontend/src/generated/cards.json");

    #[test]
    fn test_cards_json_compatibility() {
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(
                &serde_json::to_string(&*CARDS_JSON).unwrap()
            )
            .unwrap(),
            serde_json::from_str::<serde_json::Value>(CARDS_JSON_FROM_FILE).unwrap(),
            "Run `yarn download-cards-json` with the backend running to sync the generated cards.json file"
        );
    }
}
