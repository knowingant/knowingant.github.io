use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use shengji_core::{game_state, interactive};

pub mod wasm_rpc;

/// Which rating ladder a room plays on.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, JsonSchema)]
pub enum RatingMode {
    #[serde(rename = "team")]
    Team,
    #[serde(rename = "1v1")]
    OneVsOne,
}

impl RatingMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            RatingMode::Team => "team",
            RatingMode::OneVsOne => "1v1",
        }
    }

    pub fn from_player_mode(mode: shengji_core::settings::PlayerMode) -> Self {
        match mode {
            shengji_core::settings::PlayerMode::Standard => RatingMode::Team,
            shengji_core::settings::PlayerMode::OneVsOne => RatingMode::OneVsOne,
        }
    }
}

impl std::str::FromStr for RatingMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "team" => Ok(RatingMode::Team),
            "1v1" => Ok(RatingMode::OneVsOne),
            other => Err(format!("unknown rating mode {other:?}")),
        }
    }
}

/// A user's rating on one ladder, as shown to clients.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct RatingView {
    /// Rounded rating.
    pub rating: i64,
    /// Rated matches played on this ladder.
    pub matches: i64,
    pub wins: i64,
    pub losses: i64,
    /// Matches in which the user neither won nor lost overall (possible in
    /// Finding Friends, where several players can reach the target rank).
    pub draws: i64,
}

/// One user's rating change from one rated match.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct RatingChange {
    pub username: String,
    pub before: i64,
    pub after: i64,
    pub delta: i64,
    /// Levels the user had climbed when the match ended (capped at N − 2).
    pub levels: i64,
    /// Mean score against the opposing users, in [0, 1].
    pub score: f64,
}

#[allow(clippy::large_enum_variant)]
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub enum GameMessage {
    State {
        state: game_state::GameState,
    },
    /// Sent to a single connection after it has been registered in a room.
    Joined {
        username: String,
        /// Seat names controlled by this connection (1 in Standard rooms,
        /// 1 or 2 in OneVsOne rooms).
        names: Vec<String>,
        player_ids: Vec<shengji_mechanics::types::PlayerID>,
        player_mode: shengji_core::settings::PlayerMode,
    },
    /// Ratings of everyone currently in the room, keyed by seat name.
    RoomRatings {
        mode: RatingMode,
        ratings: std::collections::HashMap<String, RatingView>,
    },
    /// A notice from the server (e.g. why a round was not rated). Rendered
    /// like a game broadcast; user chat can never produce this variant.
    System {
        message: String,
    },
    /// Rating changes resulting from a rated match (sent right after the
    /// `MatchFinished` broadcast).
    MatchRated {
        match_id: i64,
        mode: RatingMode,
        changes: Vec<RatingChange>,
    },
    Message {
        from: String,
        message: String,
    },
    Broadcast {
        data: interactive::BroadcastMessage,
        message: String,
    },
    Beep {
        target: String,
    },
    ReadyCheck {
        from: String,
    },
    Error(String),
    Header {
        messages: Vec<String>,
    },
    Kicked {
        target: String,
    },
}

/// zstd dictionary, compressed with zstd.
pub const ZSTD_ZSTD_DICT: &[u8] = include_bytes!("../dict.zstd");
