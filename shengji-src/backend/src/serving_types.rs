use std::collections::{HashMap, HashSet};
use std::fmt;

use serde::{Deserialize, Serialize};

use shengji_core::interactive::Action;
use shengji_core::settings::PlayerMode;
use shengji_mechanics::types::{CardInfo, PlayerID};
use shengji_types::GameMessage;
use storage::State;

#[derive(Serialize, Deserialize, Clone)]
pub struct VersionedGame {
    pub(crate) room_name: Vec<u8>,
    pub(crate) game: shengji_core::game_state::GameState,
    pub(crate) associated_websockets: HashMap<PlayerID, Vec<usize>>,
    /// Players who have confirmed the pending reset of a rated Finding
    /// Friends round (DESIGN.md, "Reset guards"). Room state kept in memory;
    /// cleared when the reset is cancelled, when a round starts, and on any
    /// phase change.
    #[serde(default)]
    pub(crate) reset_votes: HashSet<PlayerID>,
    pub(crate) monotonic_id: u64,
}

impl State for VersionedGame {
    type Message = GameMessage;

    fn version(&self) -> u64 {
        self.monotonic_id
    }

    fn key(&self) -> &[u8] {
        &self.room_name
    }

    fn new_from_key(key: Vec<u8>) -> Self {
        VersionedGame {
            room_name: key,
            game: shengji_core::game_state::GameState::Initialize(
                shengji_core::game_state::initialize_phase::InitializePhase::new(),
            ),
            associated_websockets: HashMap::new(),
            reset_votes: HashSet::new(),
            monotonic_id: 0,
        }
    }
}

/// First message a client sends on the websocket (see DESIGN.md, "WebSocket
/// protocol"). The in-game name is always the account's username, so there is
/// no `name` field.
#[derive(Clone, Serialize, Deserialize)]
pub struct JoinRoom {
    pub(crate) room_name: String,
    /// Bearer session token.
    pub(crate) token: String,
    #[serde(default)]
    pub(crate) disable_compression: bool,
    /// Only applied when the room does not exist yet.
    #[serde(default)]
    pub(crate) room_type: Option<PlayerMode>,
    /// Client-generated device identifier (alt detection), optional.
    #[serde(default)]
    pub(crate) device_id: Option<String>,
}

impl fmt::Debug for JoinRoom {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("JoinRoom")
            .field("room_name", &self.room_name)
            .field("token", &"<redacted>")
            .field("disable_compression", &self.disable_compression)
            .field("room_type", &self.room_type)
            .field("device_id", &self.device_id)
            .finish()
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum UserMessage {
    Message(String),
    /// Act as the first seat this connection controls.
    Action(Action),
    /// Act as a specific seat this connection controls (1v1 rooms).
    ActionAs(PlayerID, Action),
    Kick(PlayerID),
    Beep,
    ReadyCheck,
    Ready,
}

#[derive(Clone, Serialize)]
pub struct CardsBlob {
    pub cards: Vec<CardInfo>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn join_room_debug_redacts_token() {
        let j = JoinRoom {
            room_name: "0123456789abcdef".into(),
            token: "super-secret-token".into(),
            disable_compression: false,
            room_type: Some(PlayerMode::OneVsOne),
            device_id: Some("dev".into()),
        };
        let s = format!("{j:?}");
        assert!(!s.contains("super-secret-token"), "{}", s);
        assert!(s.contains("<redacted>"), "{}", s);
        assert!(s.contains("0123456789abcdef"), "{}", s);
    }

    #[test]
    fn join_room_deserializes_with_and_without_optionals() {
        let j: JoinRoom = serde_json::from_str(
            r#"{"room_name":"0123456789abcdef","token":"t","disable_compression":true,"room_type":"OneVsOne","device_id":"abc"}"#,
        )
        .unwrap();
        assert_eq!(j.room_type, Some(PlayerMode::OneVsOne));
        assert!(j.disable_compression);
        assert_eq!(j.device_id.as_deref(), Some("abc"));

        let j: JoinRoom =
            serde_json::from_str(r#"{"room_name":"0123456789abcdef","token":"t"}"#).unwrap();
        assert_eq!(j.room_type, None);
        assert!(!j.disable_compression);
        assert_eq!(j.device_id, None);

        // The old `name` field is ignored, not required.
        let j: JoinRoom =
            serde_json::from_str(r#"{"room_name":"0123456789abcdef","token":"t","name":"alice"}"#)
                .unwrap();
        assert_eq!(j.token, "t");
    }

    #[test]
    fn user_message_action_as_roundtrips() {
        let m: UserMessage = serde_json::from_str(r#"{"ActionAs":[3,"StartGame"]}"#).unwrap();
        assert!(matches!(
            m,
            UserMessage::ActionAs(PlayerID(3), Action::StartGame)
        ));
        let m: UserMessage = serde_json::from_str(r#"{"Action":"StartGame"}"#).unwrap();
        assert!(matches!(m, UserMessage::Action(Action::StartGame)));
    }
}
