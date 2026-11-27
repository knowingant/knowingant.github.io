//! The room chat, kept on the server so a player who was away (or reloaded)
//! sees what was said. A bounded log per room in the database; sent to a
//! connection when it joins.

use std::sync::OnceLock;

use shengji_types::GameMessage;

use crate::db::{self, Db};

/// Chat lines kept per room.
pub const CHAT_LOG_LINES: i64 = 200;
/// How long a line is kept.
pub const CHAT_LOG_MAX_AGE_SECS: i64 = 7 * 24 * 60 * 60;

static LOG: OnceLock<Db> = OnceLock::new();

/// Start logging into `db` (and forget lines that are too old).
pub fn init(db: Db) {
    let _ = db.with(|c| db::chat_log_delete_older(c, db::now_secs() - CHAT_LOG_MAX_AGE_SECS));
    let _ = LOG.set(db);
}

/// Whether `message` is something the chat shows.
pub fn is_chat(message: &GameMessage) -> bool {
    matches!(
        message,
        GameMessage::Message { .. }
            | GameMessage::Broadcast { .. }
            | GameMessage::System { .. }
            | GameMessage::MatchRated { .. }
    )
}

/// Log the chat lines among `messages` for `room`.
pub fn record(room: &str, messages: &[GameMessage]) {
    let Some(db) = LOG.get() else {
        return;
    };
    for m in messages.iter().filter(|m| is_chat(m)) {
        if let Ok(payload) = serde_json::to_string(m) {
            let _ = db.with(|c| db::chat_log_add(c, room, &payload, CHAT_LOG_LINES));
        }
    }
}

/// The logged chat of `room`, oldest first.
pub fn history(room: &str) -> Vec<GameMessage> {
    let Some(db) = LOG.get() else {
        return vec![];
    };
    db.with(|c| db::chat_log_for_room(c, room, CHAT_LOG_LINES))
        .unwrap_or_default()
        .iter()
        .filter_map(|p| serde_json::from_str(p).ok())
        .collect()
}
