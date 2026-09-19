//! One websocket session: authenticate on join, register the user's seat(s),
//! relay actions, and rate finished rounds. See DESIGN.md ("WebSocket
//! protocol", "Rated rounds (backend semantics)", "1v1 rooms (backend)").
//!
//! A connection is identified by its account username. In Standard rooms it
//! controls the seat named `<username>`; in 1v1 rooms it controls
//! `<username>` and `<username> (2)`. Seat ids are resolved from the game
//! state by name whenever they are needed, so seats added later (the 1v1
//! self-heal at `StartGame`) are automatically controlled by the right
//! connection.

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::Duration;

use anyhow::{anyhow, bail};
use slog::{debug, error, info, o, Logger};
use tokio::sync::{mpsc, oneshot, Mutex};

use shengji_core::game_state::GameState;
use shengji_core::interactive::{Action, BroadcastMessage, InteractiveGame};
use shengji_core::message::MessageVariant;
use shengji_core::settings::{GameModeSettings, PlayerMode};
use shengji_mechanics::player::Player;
use shengji_mechanics::types::PlayerID;
use shengji_types::{GameMessage, RatingMode};
use storage::Storage;

use crate::{
    auth,
    config::Config,
    db::{self, Db},
    ratings::{
        self, seat2_name, username_for_seat, MatchOutcome, MatchResult, RoundOutcome,
        SeatRoundResult,
    },
    serving_types::{JoinRoom, UserMessage, VersionedGame},
    state_dump::InMemoryStats,
    utils::{execute_immutable_operation, execute_operation},
    ZSTD_COMPRESSOR,
};

/// The first (`JoinRoom`) message must arrive within this long.
const JOIN_TIMEOUT: Duration = Duration::from_secs(10);

/// Longest chat message we relay (DESIGN.md, "WebSocket protocol").
const MAX_CHAT_BYTES: usize = 2000;

/// Broadcasts produced by the core, with their rendered text.
type Broadcasts = Vec<(BroadcastMessage, String)>;

/// Messages for single sockets (`ws_id`, message).
type Notices = Vec<(usize, GameMessage)>;

/// Services a websocket session needs beyond game storage: the account
/// database and configuration (rating parameters, etc.).
#[derive(Clone)]
pub struct SessionServices {
    pub db: Db,
    pub config: Arc<Config>,
}

/// Everything a registered connection needs to act in its room.
struct Session<S> {
    logger: Logger,
    ws_id: usize,
    username: String,
    room: String,
    backend_storage: S,
    services: SessionServices,
}

impl<S> Session<S> {
    fn key(&self) -> Vec<u8> {
        self.room.as_bytes().to_vec()
    }
}

pub async fn entrypoint<S: Storage<VersionedGame, E>, E: std::fmt::Debug + Send>(
    tx: mpsc::UnboundedSender<Vec<u8>>,
    rx: mpsc::UnboundedReceiver<Vec<u8>>,
    ws_id: usize,
    logger: Logger,
    backend_storage: S,
    stats: Arc<Mutex<InMemoryStats>>,
    services: SessionServices,
) {
    if let Err(e) = handle_user_connected(
        tx,
        rx,
        ws_id,
        logger.clone(),
        backend_storage,
        stats,
        services,
    )
    .await
    {
        info!(logger, "Websocket session ended"; "reason" => format!("{e}"));
    }
}

/// Errors sent before the `JoinRoom` is parsed must not be compressed: the
/// client's compression preference is unknown, and a client without the WASM
/// module cannot decode zstd (DESIGN.md, "WebSocket protocol").
async fn send_join_error(tx: &'_ mpsc::UnboundedSender<Vec<u8>>, message: &str) {
    let _ = send_to_user_with_compression(tx, &GameMessage::Error(message.to_string()), true).await;
}

async fn send_to_user_with_compression(
    tx: &'_ mpsc::UnboundedSender<Vec<u8>>,
    msg: &GameMessage,
    disable_compression: bool,
) -> Result<(), anyhow::Error> {
    if let Ok(j) = serde_json::to_vec(&msg) {
        let data = if disable_compression {
            j
        } else {
            ZSTD_COMPRESSOR
                .lock()
                .unwrap()
                .compress(&j)
                .map_err(|_| anyhow::anyhow!("Unable to compress message"))?
        };

        if tx.send(data).is_ok() {
            return Ok(());
        }
    }
    Err(anyhow::anyhow!("Unable to send message to user {:?}", msg))
}

// ---------------------------------------------------------------------------
// Seat helpers (pure; unit tested below)
// ---------------------------------------------------------------------------

/// Room codes are 16 characters (the frontend generates hex; anything
/// URL-safe is accepted).
pub fn valid_room_name(room_name: &str) -> bool {
    room_name.chars().count() == 16
        && room_name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// `device_id`: 1–64 chars of `[A-Za-z0-9_-]`.
pub fn valid_device_id(device_id: &str) -> bool {
    (1..=64).contains(&device_id.len())
        && device_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// Names of the seats a user controls in a room with the given player mode.
pub fn seat_names(username: &str, mode: PlayerMode) -> Vec<String> {
    match mode {
        PlayerMode::Standard => vec![username.to_string()],
        PlayerMode::OneVsOne => vec![username.to_string(), seat2_name(username)],
    }
}

/// Ids (players or observers) of the seats `username` currently has in the
/// room, in seat order.
pub fn seat_ids(state: &GameState, username: &str) -> Vec<PlayerID> {
    seat_names(username, state.player_mode())
        .iter()
        .filter_map(|n| state.player_id(n).ok())
        .collect()
}

/// Whether the connection of `username` controls seat `id`.
pub fn owns_seat(state: &GameState, username: &str, id: PlayerID) -> bool {
    match state.player_name(id) {
        Ok(name) => seat_names(username, state.player_mode())
            .iter()
            .any(|n| n == name),
        Err(_) => false,
    }
}

/// The seat plain `Action`s act as.
pub fn first_seat(state: &GameState, username: &str) -> Result<PlayerID, anyhow::Error> {
    seat_ids(state, username)
        .first()
        .copied()
        .ok_or_else(|| anyhow!("you are not in this room"))
}

/// Other seats (players or observers) belonging to the same user as `id`.
pub fn sibling_seats(state: &GameState, id: PlayerID) -> Vec<PlayerID> {
    let user = match state.player_name(id) {
        Ok(name) => username_for_seat(name).to_string(),
        Err(_) => return vec![],
    };
    state
        .players()
        .iter()
        .chain(state.observers().iter())
        .filter(|p| p.id != id && username_for_seat(&p.name) == user)
        .map(|p| p.id)
        .collect()
}

/// Every seat name currently in the room (players, then observers).
pub fn room_names(state: &GameState) -> Vec<String> {
    state
        .players()
        .iter()
        .chain(state.observers().iter())
        .map(|p| p.name.clone())
        .collect()
}

/// Users owning player seats in a 1v1 room, at most two: users holding both
/// seats first, then by first appearance.
pub fn seat_owners(players: &[Player]) -> Vec<String> {
    let mut owners: Vec<(String, usize)> = vec![];
    for p in players {
        let u = username_for_seat(&p.name);
        match owners.iter_mut().find(|(o, _)| o == u) {
            Some((_, n)) => *n += 1,
            None => owners.push((u.to_string(), 1)),
        }
    }
    owners.sort_by_key(|(_, n)| std::cmp::Reverse(*n));
    owners.into_iter().take(2).map(|(o, _)| o).collect()
}

fn is_fresh_room(state: &GameState) -> bool {
    matches!(state, GameState::Initialize(_))
        && state.players().is_empty()
        && state.observers().is_empty()
}

/// 1v1: may `username` (be given) a team right now? Only in the Initialize
/// phase, and only if they already own a seat or fewer than two users do.
fn can_take_team(state: &GameState, username: &str) -> bool {
    if !matches!(state, GameState::Initialize(_)) {
        return false;
    }
    let owners = seat_owners(state.players());
    owners.iter().any(|o| o == username) || owners.len() < 2
}

/// Register the seat(s) of `username` per DESIGN.md ("Registration").
/// Returns the seat ids (in seat order) and the broadcasts to publish.
pub fn register_seats(
    g: &mut InteractiveGame,
    username: &str,
) -> Result<(Vec<PlayerID>, Broadcasts), anyhow::Error> {
    let mut ids = vec![];
    let mut msgs = vec![];
    match g.state().player_mode() {
        PlayerMode::Standard => {
            let (id, m) = g.register(username.to_string())?;
            ids.push(id);
            msgs.extend(m);
        }
        PlayerMode::OneVsOne => {
            let second = seat2_name(username);
            let state = g.state();
            let has_both = state.player_id(username).is_ok() && state.player_id(&second).is_ok();
            let take_team = can_take_team(state, username);
            if has_both || take_team {
                for name in [username.to_string(), second] {
                    let (id, m) = g.register(name)?;
                    msgs.extend(m);
                    if take_team && !g.state().is_player(id) {
                        if let GameState::Initialize(init) = g.state_mut() {
                            init.propagated_mut().make_player(id)?;
                        }
                    }
                    ids.push(id);
                }
            } else if g.state().player_id(username).is_ok()
                || !matches!(g.state(), GameState::Initialize(_))
            {
                // Rejoin the existing seat, or spectate a game in progress
                // (`register` adds an observer outside the Initialize phase).
                let (id, m) = g.register(username.to_string())?;
                ids.push(id);
                msgs.extend(m);
            } else if let GameState::Initialize(init) = g.state_mut() {
                // Both teams are taken: spectate. (`register` would add a
                // player in the Initialize phase.)
                ids.push(init.propagated_mut().add_observer(username.to_string())?);
            }
        }
    }
    Ok((ids, msgs))
}

// ---------------------------------------------------------------------------
// Join
// ---------------------------------------------------------------------------

async fn handle_user_connected<S: Storage<VersionedGame, E>, E: std::fmt::Debug + Send>(
    tx: mpsc::UnboundedSender<Vec<u8>>,
    mut rx: mpsc::UnboundedReceiver<Vec<u8>>,
    ws_id: usize,
    logger: Logger,
    backend_storage: S,
    stats: Arc<Mutex<InMemoryStats>>,
    services: SessionServices,
) -> Result<(), anyhow::Error> {
    let first = match tokio::time::timeout(JOIN_TIMEOUT, rx.recv()).await {
        Ok(Some(msg)) => msg,
        Ok(None) => bail!("socket closed before joining"),
        Err(_) => {
            send_join_error(&tx, "not signed in").await;
            bail!("timed out waiting for JoinRoom");
        }
    };
    let join: JoinRoom = match serde_json::from_slice(&first) {
        Ok(j) => j,
        Err(e) => {
            send_join_error(&tx, "invalid room").await;
            bail!("invalid JoinRoom message: {e}");
        }
    };
    if !valid_room_name(&join.room_name) {
        send_join_error(&tx, "invalid room").await;
        bail!("invalid room name");
    }
    let user = match auth::user_for_token(&services.db, &join.token) {
        Some(u) => u,
        None => {
            send_join_error(&tx, "not signed in").await;
            bail!("not signed in");
        }
    };
    if let Some(device) = join.device_id.as_deref().filter(|d| valid_device_id(d)) {
        if let Err(e) = services
            .db
            .with(|c| db::touch_user_device(c, user.id, device))
        {
            error!(logger, "Failed to record device"; "error" => format!("{e:?}"));
        }
    }
    let JoinRoom {
        room_name: room,
        disable_compression,
        room_type,
        ..
    } = join;
    let username = user.username;
    let logger = logger.new(o!("room" => room.clone(), "user" => username.clone()));

    let subscription = match backend_storage
        .clone()
        .subscribe(room.as_bytes().to_vec(), ws_id)
        .await
    {
        Ok(sub) => sub,
        Err(e) => {
            // The join was parsed, so the client's preference is known here.
            let _ = send_to_user_with_compression(
                &tx,
                &GameMessage::Error(format!("Failed to join room: {e:?}")),
                disable_compression,
            )
            .await;
            return Err(anyhow::anyhow!("Failed to join room {:?}", e));
        }
    };

    // Subscribe to messages for the room. After this point, we should
    // no longer use tx! It's owned by the backend storage.
    tokio::task::spawn(player_subscribe_task(
        logger.clone(),
        username.clone(),
        tx.clone(),
        subscription,
        disable_compression,
    ));

    let session = Session {
        logger: logger.clone(),
        ws_id,
        username,
        room: room.clone(),
        backend_storage: backend_storage.clone(),
        services,
    };

    let (seats, join_span) = register_user(&session, room_type, stats)
        .await
        .map_err(|_| anyhow::anyhow!("Failed to register user"))?;

    let logger = logger.new(o!("player_ids" => format!("{:?}", seats.player_ids)));
    info!(logger, "Successfully registered user"; "player_mode" => seats.player_mode);

    run_game_for_player(&session, rx).await;

    // user_ws_rx stream will keep processing as long as the user stays
    // connected. Once they disconnect, then...
    user_disconnected(room, ws_id, backend_storage, logger, join_span).await;
    Ok(())
}

async fn player_subscribe_task(
    logger: Logger,
    username: String,
    tx: mpsc::UnboundedSender<Vec<u8>>,
    mut subscription: mpsc::UnboundedReceiver<GameMessage>,
    disable_compression: bool,
) {
    debug!(logger, "Subscribed to messages");
    while let Some(v) = subscription.recv().await {
        let should_send = match &v {
            GameMessage::State { .. }
            | GameMessage::Broadcast { .. }
            | GameMessage::Message { .. }
            | GameMessage::Error(_)
            | GameMessage::Header { .. }
            | GameMessage::Joined { .. }
            | GameMessage::RoomRatings { .. }
            | GameMessage::System { .. }
            | GameMessage::MatchRated { .. } => true,
            // Name-targeted messages match any seat of this user.
            GameMessage::Beep { target } | GameMessage::Kicked { target } => {
                username_for_seat(target) == username
            }
            GameMessage::ReadyCheck { from } => username_for_seat(from) != username,
        };
        if !should_send {
            continue;
        }
        let v = if let GameMessage::State { state } = v {
            let ids = seat_ids(&state, &username);
            let g = InteractiveGame::new_from_state(state);
            match g.dump_state_for_players(&ids) {
                Ok(state) => GameMessage::State { state },
                Err(_) => continue,
            }
        } else {
            v
        };
        if send_to_user_with_compression(&tx, &v, disable_compression)
            .await
            .is_err()
        {
            break;
        }
    }
    debug!(logger, "Subscription task completed");
}

/// What a connection was registered as.
#[derive(Clone, Debug)]
struct Seats {
    names: Vec<String>,
    player_ids: Vec<PlayerID>,
    player_mode: PlayerMode,
}

async fn register_user<S: Storage<VersionedGame, E>, E: std::fmt::Debug + Send>(
    session: &Session<S>,
    room_type: Option<PlayerMode>,
    stats: Arc<Mutex<InMemoryStats>>,
) -> Result<(Seats, u64), ()> {
    let (result_tx, result_rx) = oneshot::channel();
    let logger_ = session.logger.clone();
    let username_ = session.username.clone();
    let ws_id = session.ws_id;
    execute_operation(
        ws_id,
        &session.room,
        session.backend_storage.clone(),
        move |g, version, associated_websockets, _| {
            // `room_type` only applies to a room that does not exist yet.
            if room_type == Some(PlayerMode::OneVsOne) && is_fresh_room(g.state()) {
                g.set_player_mode(PlayerMode::OneVsOne)?;
            }
            let (player_ids, register_msgs) = register_seats(g, &username_)?;
            info!(logger_, "Joining room"; "player_ids" => format!("{player_ids:?}"));
            let mut clients_to_disconnect = vec![];
            for id in &player_ids {
                let clients = associated_websockets.entry(*id).or_default();
                // If the same user joined before, remove the previous entries
                // from the state-store.
                if !g.allows_multiple_sessions_per_user() {
                    clients_to_disconnect.append(clients);
                }
                clients.push(ws_id);
            }
            clients_to_disconnect.sort_unstable();
            clients_to_disconnect.dedup();
            clients_to_disconnect.retain(|w| *w != ws_id);

            let state = g.state();
            let seats = Seats {
                names: player_ids
                    .iter()
                    .filter_map(|id| state.player_name(*id).ok().map(str::to_owned))
                    .collect(),
                player_ids,
                player_mode: state.player_mode(),
            };
            let all_names = room_names(state);
            result_tx
                .send((seats, version, clients_to_disconnect, all_names))
                .map_err(|_| anyhow::anyhow!("Couldn't send registration result back"))?;
            Ok(register_msgs
                .into_iter()
                .map(|(data, message)| GameMessage::Broadcast { data, message })
                .collect())
        },
        "register game",
    )
    .await;

    let header_messages = {
        let stats = stats.lock().await;
        stats.header_messages().to_vec()
    };
    let _ = session
        .backend_storage
        .clone()
        .publish_to_single_subscriber(
            session.key(),
            ws_id,
            GameMessage::Header {
                messages: header_messages,
            },
        )
        .await;

    let (seats, version, websockets_to_disconnect, all_names) = match result_rx.await {
        Ok(r) => r,
        Err(_) => return Err(()),
    };
    for id in websockets_to_disconnect {
        info!(session.logger, "Disconnnecting existing client"; "kicked_ws_id" => id);
        let _ = session
            .backend_storage
            .clone()
            .publish_to_single_subscriber(
                session.key(),
                id,
                GameMessage::Kicked {
                    target: session.username.clone(),
                },
            )
            .await;
    }
    let _ = session
        .backend_storage
        .clone()
        .publish_to_single_subscriber(
            session.key(),
            ws_id,
            GameMessage::Joined {
                username: session.username.clone(),
                names: seats.names.clone(),
                player_ids: seats.player_ids.clone(),
                player_mode: seats.player_mode,
            },
        )
        .await;
    publish_room_ratings(session, seats.player_mode, &all_names).await;
    Ok((seats, version))
}

/// Send everyone in the room the current ratings of every seat.
async fn publish_room_ratings<S: Storage<VersionedGame, E>, E: Send>(
    session: &Session<S>,
    player_mode: PlayerMode,
    all_names: &[String],
) {
    let mode = RatingMode::from_player_mode(player_mode);
    let ratings = ratings::ratings_for_seat_names(
        &session.services.db,
        &session.services.config,
        mode,
        all_names,
    );
    let _ = session
        .backend_storage
        .clone()
        .publish(session.key(), GameMessage::RoomRatings { mode, ratings })
        .await;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async fn run_game_for_player<S: Storage<VersionedGame, E>, E: Send + std::fmt::Debug>(
    session: &Session<S>,
    mut rx: mpsc::UnboundedReceiver<Vec<u8>>,
) {
    debug!(session.logger, "Entering main game loop");
    // Handle the main game loop
    while let Some(result) = rx.recv().await {
        match serde_json::from_slice::<UserMessage>(&result) {
            Ok(msg) => {
                if let Err(e) = handle_user_action(session, msg).await {
                    let _ = session
                        .backend_storage
                        .clone()
                        .publish_to_single_subscriber(
                            session.key(),
                            session.ws_id,
                            GameMessage::Error(format!("Unexpected error {e:?}")),
                        )
                        .await;
                }
            }
            Err(e) => {
                error!(session.logger, "Failed to deserialize message"; "error" => format!("{e:?}"));
                let _ = session
                    .backend_storage
                    .clone()
                    .publish_to_single_subscriber(
                        session.key(),
                        session.ws_id,
                        GameMessage::Error(format!("couldn't deserialize message {e:?}")),
                    )
                    .await;
            }
        }
    }
    debug!(session.logger, "Exiting main game loop");
}

async fn handle_user_action<S: Storage<VersionedGame, E>, E: Send>(
    session: &Session<S>,
    msg: UserMessage,
) -> Result<(), E> {
    let name = session.username.clone();
    match msg {
        UserMessage::Beep => {
            execute_immutable_operation(
                session.ws_id,
                &session.room,
                session.backend_storage.clone(),
                move |game, _| {
                    let next_player_id = game.next_player()?;
                    let beeped_player_name = game.player_name(next_player_id)?.to_owned();
                    Ok(vec![
                        GameMessage::Message {
                            from: name,
                            message: "BEEP".to_owned(),
                        },
                        GameMessage::Beep {
                            target: beeped_player_name,
                        },
                    ])
                },
                "send appropriate beep",
            )
            .await;
        }
        UserMessage::Message(m) if m.len() > MAX_CHAT_BYTES => {
            session
                .backend_storage
                .clone()
                .publish_to_single_subscriber(
                    session.key(),
                    session.ws_id,
                    GameMessage::Error(format!(
                        "chat messages are limited to {MAX_CHAT_BYTES} bytes"
                    )),
                )
                .await?;
        }
        UserMessage::Message(m) => {
            session
                .backend_storage
                .clone()
                .publish(
                    session.key(),
                    GameMessage::Message {
                        from: name,
                        message: m,
                    },
                )
                .await?;
        }
        UserMessage::ReadyCheck => {
            session
                .backend_storage
                .clone()
                .publish(
                    session.key(),
                    GameMessage::Message {
                        from: name.clone(),
                        message: "Is everyone ready?".to_owned(),
                    },
                )
                .await?;
            session
                .backend_storage
                .clone()
                .publish(session.key(), GameMessage::ReadyCheck { from: name })
                .await?;
        }
        UserMessage::Ready => {
            session
                .backend_storage
                .clone()
                .publish(
                    session.key(),
                    GameMessage::Message {
                        from: name,
                        message: "I'm ready!".to_owned(),
                    },
                )
                .await?;
        }
        UserMessage::Kick(id) => {
            info!(session.logger, "Kicking user"; "other" => id.0);
            execute_operation(
                session.ws_id,
                &session.room,
                session.backend_storage.clone(),
                move |game, _, _, _| kick_user(game, &name, id),
                "kick user",
            )
            .await;
        }
        UserMessage::Action(action) => {
            perform_action(session, None, action).await?;
        }
        UserMessage::ActionAs(id, action) => {
            perform_action(session, Some(id), action).await?;
        }
    }
    Ok(())
}

/// Kick seat `id`; in 1v1 rooms, every seat of that user.
fn kick_user(
    game: &mut InteractiveGame,
    username: &str,
    id: PlayerID,
) -> Result<Vec<GameMessage>, anyhow::Error> {
    let caller = first_seat(game.state(), username)?;
    let kicked_player_name = game.player_name(id)?.to_owned();
    let siblings = if game.state().player_mode() == PlayerMode::OneVsOne {
        sibling_seats(game.state(), id)
    } else {
        vec![]
    };
    let mut broadcasts: Broadcasts = vec![];
    let mut msgs = vec![];
    // Best effort for the other seats (they may be in a phase where they
    // cannot be removed), then the requested seat.
    for sibling in siblings {
        if let Ok(name) = game.player_name(sibling).map(str::to_owned) {
            if let Ok(b) = game.kick(caller, sibling) {
                broadcasts.extend(b);
                msgs.push(GameMessage::Kicked { target: name });
            }
        }
    }
    broadcasts.extend(game.kick(caller, id)?);
    msgs.push(GameMessage::Kicked {
        target: kicked_player_name,
    });
    // The core announces the departure, and `MatchAbandoned` when the kick
    // voids a match in progress; the room should see both.
    msgs.extend(
        broadcasts
            .into_iter()
            .map(|(data, message)| GameMessage::Broadcast { data, message }),
    );
    Ok(msgs)
}

// ---------------------------------------------------------------------------
// Actions: guards, 1v1 handling, rating hook
// ---------------------------------------------------------------------------

/// Whether a `ResetGame` from `caller` may confirm a pending reset request.
/// `same_team_in_rated_play` is `Some(same_team)` in the Play phase of a
/// rated room; `same_user` applies to 1v1 rooms.
pub fn reset_confirmation_allowed(
    same_team_in_rated_play: Option<bool>,
    same_user: bool,
) -> Result<(), anyhow::Error> {
    if same_team_in_rated_play == Some(true) {
        bail!("in a rated game the reset must be confirmed by a player on the other team");
    }
    if same_user {
        bail!("the reset must be confirmed by the other player");
    }
    Ok(())
}

/// Whether a reset here needs *every* other player's confirmation: a rated
/// Finding Friends round in which at least one friend is still unrevealed.
/// The landlord's hidden friends count as "the other team", so the team rule
/// alone would let a friend confirm a reset to dodge a loss (DESIGN.md,
/// "Reset guards").
pub fn needs_unanimous_reset(state: &GameState) -> bool {
    match state {
        GameState::Play(p) => state.rated() && p.game_mode().friends_unresolved(),
        _ => false,
    }
}

/// Outcome of a `ResetGame` in a round that needs unanimous confirmation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ResetVote {
    /// Hand the action to the core: it records the request, or completes the
    /// reset now that everyone else has agreed.
    Forward,
    /// Still waiting: `votes` of `needed` other players have confirmed.
    Waiting { votes: usize, needed: usize },
}

/// Record `caller`'s confirmation of a pending reset and decide whether the
/// reset may go through. Only players can vote (observers never reach here),
/// and the requester's own vote never counts towards the total.
pub fn record_reset_vote(
    state: &GameState,
    caller: PlayerID,
    votes: &mut HashSet<PlayerID>,
) -> ResetVote {
    if state.is_player(caller) {
        votes.insert(caller);
    }
    let requester = match state.reset_requester() {
        // Nothing pending yet: the core records this call as the request.
        None => return ResetVote::Forward,
        Some(r) => r,
    };
    let others = state
        .players()
        .iter()
        .map(|p| p.id)
        .filter(|id| *id != requester)
        .collect::<Vec<_>>();
    let confirmed = others.iter().filter(|id| votes.contains(id)).count();
    if confirmed >= others.len() {
        ResetVote::Forward
    } else {
        ResetVote::Waiting {
            votes: confirmed,
            needed: others.len(),
        }
    }
}

/// Reset guard (DESIGN.md, "Reset guards"): the confirming `ResetGame` must
/// come from the other team in a rated Play phase, and from a different
/// user in 1v1 rooms. A repeated request by the requester is a no-op in the
/// core, so it is allowed through. Rated Finding Friends rounds with hidden
/// friends use `record_reset_vote` instead of the team rule.
pub fn check_reset_confirmation(state: &GameState, caller: PlayerID) -> Result<(), anyhow::Error> {
    let requester = match state.reset_requester() {
        Some(r) if r != caller => r,
        _ => return Ok(()),
    };
    let same_team_in_rated_play = match state {
        GameState::Play(p) if state.rated() && !needs_unanimous_reset(state) => {
            let team = p.landlords_team();
            Some(team.contains(&requester) == team.contains(&caller))
        }
        _ => None,
    };
    let same_user = state.player_mode() == PlayerMode::OneVsOne
        && username_for_seat(state.player_name(requester)?)
            == username_for_seat(state.player_name(caller)?);
    reset_confirmation_allowed(same_team_in_rated_play, same_user)
}

/// Checks applied before an action reaches the core.
pub fn guard_action(
    state: &GameState,
    caller: PlayerID,
    action: &Action,
) -> Result<(), anyhow::Error> {
    let one_vs_one = state.player_mode() == PlayerMode::OneVsOne;
    match action {
        Action::ResetGame => {
            if !state.is_player(caller) {
                bail!("only players can reset the game");
            }
            check_reset_confirmation(state, caller)?;
        }
        Action::CancelResetGame => {
            if !state.is_player(caller) {
                bail!("only players can cancel a reset");
            }
        }
        Action::SetRated(_) | Action::SetFirstToRank(_) => {
            if !state.is_player(caller) {
                bail!("only players can change the match settings");
            }
        }
        Action::StartGame => {
            if !state.is_player(caller) {
                bail!("only players can start the game");
            }
        }
        Action::MakeObserver(_) | Action::MakePlayer(_) | Action::ReorderPlayers(_)
            if one_vs_one =>
        {
            bail!("not available in 1v1 rooms");
        }
        Action::SetGameMode(GameModeSettings::FindingFriends { .. }) if one_vs_one => {
            bail!("1v1 rooms can only play Tractor");
        }
        _ => {}
    }
    Ok(())
}

/// 1v1 self-heal at `StartGame` (DESIGN.md): demote players who are not one
/// of the two seat owners, add a missing `u (2)`, then order the seats
/// `[A, B, A (2), B (2)]` so Tractor teams are users. Returns `Joined`
/// notices for the sockets of users whose seats changed.
pub fn heal_one_vs_one(
    game: &mut InteractiveGame,
    associated_websockets: &mut HashMap<PlayerID, Vec<usize>>,
) -> Result<Notices, anyhow::Error> {
    let init = match game.state_mut() {
        GameState::Initialize(init) => init,
        _ => bail!("not supported in current phase"),
    };
    let p = init.propagated_mut();
    let owners = seat_owners(p.players());
    if owners.len() < 2 {
        bail!("1v1 rooms need two players");
    }

    let extras: Vec<PlayerID> = p
        .players()
        .iter()
        .filter(|pl| !owners.iter().any(|o| o == username_for_seat(&pl.name)))
        .map(|pl| pl.id)
        .collect();
    for id in extras {
        p.make_observer(id)?;
    }

    let mut healed: Vec<String> = vec![];
    for owner in &owners {
        for name in [owner.clone(), seat2_name(owner)] {
            if p.players().iter().any(|pl| pl.name == name) {
                continue;
            }
            healed.push(owner.clone());
            if let Some(id) = p.observers().iter().find(|o| o.name == name).map(|o| o.id) {
                p.make_player(id)?;
            } else {
                let template = p
                    .players()
                    .iter()
                    .find(|pl| username_for_seat(&pl.name) == owner)
                    .cloned();
                let (id, _) = p.add_player(name)?;
                if let Some(t) = template {
                    p.set_rank(id, t.rank())?;
                    p.set_meta_rank(id, t.metalevel)?;
                }
            }
        }
    }

    if p.players().len() != 4 {
        bail!("1v1 rooms need exactly four seats");
    }
    let order = [
        owners[0].clone(),
        owners[1].clone(),
        seat2_name(&owners[0]),
        seat2_name(&owners[1]),
    ];
    let ids = order
        .iter()
        .map(|n| {
            p.players()
                .iter()
                .find(|pl| &pl.name == n)
                .map(|pl| pl.id)
                .ok_or_else(|| anyhow!("missing seat {n}"))
        })
        .collect::<Result<Vec<_>, _>>()?;
    p.reorder_players(&ids)?;

    // Connections of users whose seats changed learn their new seat ids.
    let mut side = vec![];
    healed.sort();
    healed.dedup();
    for owner in healed {
        let names = seat_names(&owner, PlayerMode::OneVsOne);
        let seat_ids: Vec<PlayerID> = names
            .iter()
            .filter_map(|n| p.players().iter().find(|pl| &pl.name == n).map(|pl| pl.id))
            .collect();
        let mut sockets: Vec<usize> = seat_ids
            .iter()
            .flat_map(|id| associated_websockets.get(id).cloned().unwrap_or_default())
            .collect();
        sockets.sort_unstable();
        sockets.dedup();
        for id in &seat_ids {
            associated_websockets.insert(*id, sockets.clone());
        }
        for ws in sockets {
            side.push((
                ws,
                GameMessage::Joined {
                    username: owner.clone(),
                    names: names.clone(),
                    player_ids: seat_ids.clone(),
                    player_mode: PlayerMode::OneVsOne,
                },
            ));
        }
    }
    Ok(side)
}

/// Apply an action, with the 1v1 special cases. Returns the broadcasts and
/// any `Joined` notices to deliver to single sockets afterwards.
fn apply_action(
    game: &mut InteractiveGame,
    caller: PlayerID,
    action: Action,
    logger: &Logger,
    associated_websockets: &mut HashMap<PlayerID, Vec<usize>>,
) -> Result<(Broadcasts, Notices), anyhow::Error> {
    if game.state().player_mode() != PlayerMode::OneVsOne {
        return Ok((game.interact(action, caller, logger)?, vec![]));
    }
    match action {
        // Ranks apply to both seats of the user.
        Action::SetRank(_) | Action::SetMetaRank(_) => {
            let mut msgs = game.interact(action.clone(), caller, logger)?;
            for id in sibling_seats(game.state(), caller) {
                if game.state().is_player(id) {
                    msgs.extend(game.interact(action.clone(), id, logger)?);
                }
            }
            Ok((msgs, vec![]))
        }
        Action::StartGame => {
            let joined = heal_one_vs_one(game, associated_websockets)?;
            // If this user owns the landlord seat, start as it (the room may
            // only allow the landlord to start).
            let starter = game
                .state()
                .landlord()
                .filter(|l| *l == caller || sibling_seats(game.state(), caller).contains(l))
                .unwrap_or(caller);
            let mut msgs = game.interact(Action::StartGame, starter, logger)?;
            // The first round of a match needs every seat's "start"; a user
            // owns two seats, so their click counts for both.
            if msgs
                .iter()
                .any(|(b, _)| matches!(b.variant(), MessageVariant::StartVote { .. }))
            {
                for id in sibling_seats(game.state(), starter) {
                    if game.state().is_player(id) {
                        msgs.extend(game.interact(Action::StartGame, id, logger)?);
                    }
                }
            }
            Ok((msgs, joined))
        }
        other => Ok((game.interact(other, caller, logger)?, vec![])),
    }
}

/// Facts about the round captured *before* `StartNewGame` runs (the
/// round end may reset the match, so they must be read first).
#[derive(Clone, Debug)]
struct PreRound {
    rated: bool,
    player_mode: PlayerMode,
    game_mode: GameModeSettings,
    round_key: String,
    match_key: String,
    /// Rounds of the match including the one that is finishing.
    rounds: usize,
}

fn pre_round(state: &GameState, action: &Action) -> Option<PreRound> {
    match (action, state) {
        (Action::StartNewGame, GameState::Play(_)) => Some(PreRound {
            rated: state.rated(),
            player_mode: state.player_mode(),
            game_mode: state.game_mode_settings(),
            round_key: state.round_key().to_string(),
            match_key: state.match_key().to_string(),
            rounds: state.num_games_finished() + 1,
        }),
        _ => None,
    }
}

/// Build the outcome of a finished round from the `finish_game` broadcasts
/// (`EndOfGameSummary` + `GameFinished`).
pub fn parse_round_outcome<'a>(
    room: &str,
    round_key: &str,
    match_key: &str,
    player_mode: PlayerMode,
    variants: impl IntoIterator<Item = &'a MessageVariant>,
) -> Option<RoundOutcome> {
    let mut summary = None;
    let mut result = None;
    for v in variants {
        match v {
            MessageVariant::EndOfGameSummary {
                landlord_won,
                non_landlords_points,
                landlord_delta,
                non_landlord_delta,
            } => {
                summary = Some((
                    *landlord_won,
                    *non_landlords_points,
                    *landlord_delta,
                    *non_landlord_delta,
                ));
            }
            MessageVariant::GameFinished { result: r } => result = Some(r),
            _ => {}
        }
    }
    let (landlord_won, non_landlords_points, landlord_delta, non_landlord_delta) = summary?;
    let result = result?;
    let mut seats: Vec<SeatRoundResult> = result
        .iter()
        .map(|(name, r)| SeatRoundResult {
            name: name.clone(),
            is_defending: r.is_defending,
            is_landlord: r.is_landlord,
            won_game: r.won_game,
            ranks_up: r.ranks_up,
        })
        .collect();
    seats.sort_by(|a, b| a.name.cmp(&b.name));
    Some(RoundOutcome {
        room: room.to_string(),
        round_key: round_key.to_string(),
        match_key: match_key.to_string(),
        player_mode,
        landlord_won,
        level_delta: if landlord_won {
            landlord_delta
        } else {
            non_landlord_delta
        },
        non_landlords_points,
        seats,
    })
}

/// Build the outcome of a finished match from a `MatchFinished` broadcast.
fn parse_match_outcome<'a>(
    room: &str,
    pre: &PreRound,
    variants: impl IntoIterator<Item = &'a MessageVariant>,
) -> Option<MatchOutcome> {
    for v in variants {
        if let MessageVariant::MatchFinished {
            match_key,
            first_to_rank,
            standings,
        } = v
        {
            return Some(MatchOutcome {
                room: room.to_string(),
                match_key: match_key.clone(),
                player_mode: pre.player_mode,
                game_mode: pre.game_mode,
                rated: pre.rated,
                first_to_rank: *first_to_rank,
                standings: standings.clone(),
                rounds: pre.rounds,
            });
        }
    }
    None
}

/// What the action closure hands back for work that must happen outside the
/// storage lock (database access, targeted messages).
struct PostAction {
    /// A round that just finished (recorded for statistics).
    round: Option<RoundOutcome>,
    /// A match that just finished (recorded; rated if applicable).
    match_finished: Option<MatchOutcome>,
    /// `Joined` notices for connections whose seats changed.
    joined: Vec<(usize, GameMessage)>,
    all_names: Vec<String>,
    player_mode: PlayerMode,
}

async fn perform_action<S: Storage<VersionedGame, E>, E: Send>(
    session: &Session<S>,
    seat: Option<PlayerID>,
    action: Action,
) -> Result<(), E> {
    let post: Arc<std::sync::Mutex<Option<PostAction>>> = Arc::new(std::sync::Mutex::new(None));
    let post_ = post.clone();
    let username = session.username.clone();
    let room = session.room.clone();
    let logger = session.logger.clone();
    execute_operation(
        session.ws_id,
        &session.room,
        session.backend_storage.clone(),
        move |game, _, associated_websockets, reset_votes| {
            let caller = match seat {
                Some(id) => {
                    if !owns_seat(game.state(), &username, id) {
                        bail!("you do not control that seat");
                    }
                    id
                }
                None => first_seat(game.state(), &username)?,
            };
            guard_action(game.state(), caller, &action)?;
            // A reset in a rated Finding Friends round needs everyone else.
            if matches!(action, Action::ResetGame) && needs_unanimous_reset(game.state()) {
                if let ResetVote::Waiting { votes, needed } =
                    record_reset_vote(game.state(), caller, reset_votes)
                {
                    return Ok(vec![GameMessage::System {
                        message: format!(
                            "Reset in a rated Finding Friends round needs everyone else to agree ({votes} of {needed})"
                        ),
                    }]);
                }
            }
            // Cancelling, a new round and any phase change void the votes.
            let clears_votes = matches!(
                action,
                Action::CancelResetGame | Action::StartGame | Action::StartNewGame
            );
            let phase = std::mem::discriminant(game.state());
            let pre = pre_round(game.state(), &action);
            let (msgs, joined) =
                apply_action(game, caller, action, &logger, associated_websockets)?;
            if clears_votes || phase != std::mem::discriminant(game.state()) {
                reset_votes.clear();
            }
            let (round, match_finished) = match pre {
                Some(pre) => (
                    parse_round_outcome(
                        &room,
                        &pre.round_key,
                        &pre.match_key,
                        pre.player_mode,
                        msgs.iter().map(|(b, _)| b.variant()),
                    ),
                    parse_match_outcome(&room, &pre, msgs.iter().map(|(b, _)| b.variant())),
                ),
                None => (None, None),
            };
            let state = game.state();
            *post_.lock().unwrap() = Some(PostAction {
                round,
                match_finished,
                joined,
                all_names: room_names(state),
                player_mode: state.player_mode(),
            });
            Ok(msgs
                .into_iter()
                .map(|(data, message)| GameMessage::Broadcast { data, message })
                .collect())
        },
        "handle user action",
    )
    .await;

    let post = post.lock().unwrap().take();
    if let Some(post) = post {
        let seats_changed = !post.joined.is_empty();
        for (ws, msg) in post.joined {
            let _ = session
                .backend_storage
                .clone()
                .publish_to_single_subscriber(session.key(), ws, msg)
                .await;
        }
        if seats_changed {
            publish_room_ratings(session, post.player_mode, &post.all_names).await;
        }
        if let Some(outcome) = post.round {
            record_round(session, outcome).await;
        }
        if let Some(outcome) = post.match_finished {
            handle_match_outcome(session, outcome, post.all_names).await?;
        }
    }
    Ok(())
}

/// Record a finished round for statistics (outside the storage lock).
async fn record_round<S: Storage<VersionedGame, E>, E: Send>(
    session: &Session<S>,
    outcome: RoundOutcome,
) {
    let db = session.services.db.clone();
    let key = outcome.round_key.clone();
    match tokio::task::spawn_blocking(move || ratings::record_round(&db, &outcome)).await {
        Ok(Ok(Some(id))) => {
            debug!(session.logger, "Recorded round"; "round_id" => id, "round_key" => key)
        }
        Ok(Ok(None)) => {
            debug!(session.logger, "Round not recorded (duplicate or unknown seat)"; "round_key" => key)
        }
        Ok(Err(e)) => {
            error!(session.logger, "Failed to record round"; "error" => format!("{e:?}"), "round_key" => key)
        }
        Err(e) => {
            error!(session.logger, "Round recording task failed"; "error" => format!("{e:?}"), "round_key" => key)
        }
    }
}

/// Record (and, if applicable, rate) a finished match, then tell the room.
async fn handle_match_outcome<S: Storage<VersionedGame, E>, E: Send>(
    session: &Session<S>,
    outcome: MatchOutcome,
    all_names: Vec<String>,
) -> Result<(), E> {
    let db = session.services.db.clone();
    let config = session.services.config.clone();
    let outcome_ = outcome.clone();
    let result =
        tokio::task::spawn_blocking(move || ratings::apply_match(&db, &config, &outcome_)).await;
    let notice = match result {
        Ok(Ok(MatchResult::Rated {
            match_id,
            mode,
            changes,
        })) => {
            info!(session.logger, "Rated match";
                "match_id" => match_id,
                "mode" => mode.as_str(),
                "match_key" => &outcome.match_key,
            );
            session
                .backend_storage
                .clone()
                .publish(
                    session.key(),
                    GameMessage::MatchRated {
                        match_id,
                        mode,
                        changes,
                    },
                )
                .await?;
            publish_room_ratings(session, outcome.player_mode, &all_names).await;
            return Ok(());
        }
        Ok(Ok(MatchResult::Recorded { match_id, reason })) => {
            info!(session.logger, "Match recorded without rating"; "match_id" => match_id, "reason" => &reason, "match_key" => &outcome.match_key);
            if !outcome.rated {
                // An unrated room: nothing to announce beyond MatchFinished.
                return Ok(());
            }
            format!("Not rated: {reason}.")
        }
        Ok(Ok(MatchResult::Skipped(reason))) => {
            info!(session.logger, "Match not recorded"; "reason" => &reason, "match_key" => &outcome.match_key);
            if !outcome.rated {
                return Ok(());
            }
            format!("Not rated: {reason}.")
        }
        Ok(Err(e)) => {
            error!(session.logger, "Failed to record match"; "error" => format!("{e:?}"), "match_key" => &outcome.match_key);
            "Not rated: internal error.".to_string()
        }
        Err(e) => {
            error!(session.logger, "Match recording task failed"; "error" => format!("{e:?}"), "match_key" => &outcome.match_key);
            "Not rated: internal error.".to_string()
        }
    };
    session
        .backend_storage
        .clone()
        .publish(session.key(), GameMessage::System { message: notice })
        .await?;
    Ok(())
}

async fn user_disconnected<S: Storage<VersionedGame, E>, E: Send>(
    room: String,
    ws_id: usize,
    backend_storage: S,
    logger: slog::Logger,
    parent: u64,
) {
    execute_operation(
        ws_id,
        &room,
        backend_storage.clone(),
        move |_, _, associated_websockets, _| {
            for ws in associated_websockets.values_mut() {
                ws.retain(|w| *w != ws_id);
            }
            Ok(vec![])
        },
        "disconnect player",
    )
    .await;
    backend_storage
        .unsubscribe(room.as_bytes().to_vec(), ws_id)
        .await;
    info!(logger, "Websocket disconnected";
        "room" => room,
        "parent_span" => format!("{room}:{parent}"),
        "span" => format!("{room}:ws_{ws_id}")
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    use shengji_core::game_state::initialize_phase::InitializePhase;
    use shengji_core::game_state::play_phase::{PlayPhase, PlayerGameFinishedResult};
    use shengji_core::settings::FriendSelection;
    use shengji_mechanics::types::{cards, Card, EffectiveSuit, Number, Rank, Suit};

    fn logger() -> Logger {
        Logger::root(slog::Discard, o!())
    }

    fn one_vs_one_room() -> InteractiveGame {
        let mut g = InteractiveGame::new();
        g.set_player_mode(PlayerMode::OneVsOne).unwrap();
        g
    }

    fn names(state: &GameState) -> Vec<String> {
        state.players().iter().map(|p| p.name.clone()).collect()
    }

    fn observer_names(state: &GameState) -> Vec<String> {
        state.observers().iter().map(|p| p.name.clone()).collect()
    }

    /// A Play-phase Tractor game with four players, reached through the
    /// public draw / bid / advance flow (the deck is random, so the landlord
    /// is whoever holds a legal bid; use `teams` to find out).
    fn play_phase(seat_names: [&str; 4], one_vs_one: bool) -> GameState {
        let mut init = InitializePhase::new();
        if one_vs_one {
            init.propagated_mut()
                .set_player_mode(PlayerMode::OneVsOne)
                .unwrap();
        }
        let ids: Vec<PlayerID> = seat_names
            .iter()
            .map(|n| init.propagated_mut().add_player(n.to_string()).unwrap().0)
            .collect();
        let mut draw = init.start(ids[0]).unwrap();
        while !draw.done_drawing() {
            let id = draw.next_player().unwrap();
            draw.draw_card(id).unwrap();
        }
        // Everyone is on rank 2: any 2 (or a joker) is a legal bid. With 100
        // of 108 cards dealt, someone always holds one.
        let candidates = [
            cards::S_2,
            cards::H_2,
            cards::C_2,
            cards::D_2,
            Card::SmallJoker,
            Card::BigJoker,
        ];
        let bidder = ids
            .iter()
            .copied()
            .find(|id| candidates.iter().any(|c| draw.bid(*id, *c, 1)))
            .expect("some player can bid");
        let landlord = draw.next_player().unwrap();
        assert_eq!(landlord, bidder);
        let exchange = draw.advance(landlord).unwrap();
        let play = exchange.advance(landlord).unwrap();
        assert_eq!(play.landlords_team().len(), 2);
        GameState::Play(play)
    }

    /// A Play-phase Finding Friends game with four players (so one friend),
    /// picked but not yet revealed. Returns the state and the landlord.
    fn finding_friends_play_phase(seat_names: [&str; 4]) -> (GameState, PlayerID) {
        let mut init = InitializePhase::new();
        init.propagated_mut()
            .set_game_mode(GameModeSettings::FindingFriends { num_friends: None })
            .unwrap();
        let ids: Vec<PlayerID> = seat_names
            .iter()
            .map(|n| init.propagated_mut().add_player(n.to_string()).unwrap().0)
            .collect();
        let mut draw = init.start(ids[0]).unwrap();
        while !draw.done_drawing() {
            let id = draw.next_player().unwrap();
            draw.draw_card(id).unwrap();
        }
        let candidates = [
            cards::S_2,
            cards::H_2,
            cards::C_2,
            cards::D_2,
            Card::SmallJoker,
            Card::BigJoker,
        ];
        ids.iter()
            .copied()
            .find(|id| candidates.iter().any(|c| draw.bid(*id, *c, 1)))
            .expect("some player can bid");
        let landlord = draw.next_player().unwrap();
        let mut exchange = draw.advance(landlord).unwrap();
        // Any off-trump ace works as the (single) friend card.
        let trump = exchange.trump();
        let suits = [Suit::Spades, Suit::Hearts, Suit::Clubs, Suit::Diamonds];
        let friends: Vec<FriendSelection> = suits
            .iter()
            .map(|suit| Card::Suited {
                number: Number::Ace,
                suit: *suit,
            })
            .filter(|c| trump.effective_suit(*c) != EffectiveSuit::Trump)
            .take(exchange.num_friends())
            .map(|card| FriendSelection {
                card,
                initial_skip: 0,
            })
            .collect();
        assert_eq!(friends.len(), exchange.num_friends());
        exchange.set_friends(landlord, friends).unwrap();
        let play = exchange.advance(landlord).unwrap();
        // Nobody has played the friend card yet, so the landlord is alone.
        assert_eq!(play.landlords_team(), &[landlord]);
        (GameState::Play(play), landlord)
    }

    /// Play a round to the end, one card at a time, following suit when
    /// possible (always a legal play for a single-card trick format).
    fn play_out_round(play: &mut PlayPhase, num_players: usize) {
        while !play.game_finished() {
            let id = play.next_player().unwrap();
            let hand = play.hands().get(id).unwrap().clone();
            let cards: Vec<Card> = hand
                .iter()
                .flat_map(|(c, n)| std::iter::repeat_n(*c, *n))
                .collect();
            let trump = play.trick().trump();
            let card = match play.trick().trick_format() {
                Some(format) => {
                    let suit = format.suit();
                    cards
                        .iter()
                        .copied()
                        .find(|c| trump.effective_suit(*c) == suit)
                        .unwrap_or(cards[0])
                }
                None => cards[0],
            };
            play.play_cards(id, &[card]).unwrap();
            if play.trick().played_cards().len() == num_players {
                play.finish_trick().unwrap();
            }
        }
    }

    /// `(requester, teammate, opponent)` for a Play-phase state: the
    /// landlord's team and one player from the other team.
    fn teams(state: &GameState) -> (PlayerID, PlayerID, PlayerID) {
        let team = match state {
            GameState::Play(p) => p.landlords_team().to_vec(),
            _ => panic!("not in play phase"),
        };
        let opponent = state
            .players()
            .iter()
            .map(|p| p.id)
            .find(|id| !team.contains(id))
            .unwrap();
        (team[0], team[1], opponent)
    }

    #[test]
    fn validators() {
        assert!(valid_room_name("0123456789abcdef"));
        assert!(valid_room_name("ABCDEFGHIJ-_0123"));
        assert!(!valid_room_name("0123456789abcde"));
        assert!(!valid_room_name("0123456789abcdef0"));
        assert!(!valid_room_name("0123456789abcd f"));
        assert!(!valid_room_name("éééééééééééééééé"));
        assert!(valid_device_id("abc-DEF_123"));
        assert!(!valid_device_id(""));
        assert!(!valid_device_id(&"a".repeat(65)));
        assert!(!valid_device_id("a b"));
    }

    #[test]
    fn seat_owner_ordering() {
        let players = vec![
            Player::new(PlayerID(0), "carol".into()),
            Player::new(PlayerID(1), "alice".into()),
            Player::new(PlayerID(2), "alice (2)".into()),
            Player::new(PlayerID(3), "bob".into()),
            Player::new(PlayerID(4), "bob (2)".into()),
        ];
        assert_eq!(seat_owners(&players), vec!["alice", "bob"]);
        assert_eq!(seat_owners(&players[..2]), vec!["carol", "alice"]);
        assert!(seat_owners(&[]).is_empty());
    }

    #[test]
    fn register_seats_standard_room() {
        let mut g = InteractiveGame::new();
        let (ids, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(ids.len(), 1);
        assert_eq!(names(g.state()), vec!["alice"]);
        assert_eq!(seat_names("alice", PlayerMode::Standard), vec!["alice"]);
        assert_eq!(seat_ids(g.state(), "alice"), ids);
        let (again, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(again, ids);
        assert!(owns_seat(g.state(), "alice", ids[0]));
        assert!(!owns_seat(g.state(), "bob", ids[0]));
    }

    #[test]
    fn register_seats_one_vs_one_rules() {
        let mut g = one_vs_one_room();
        assert!(matches!(
            g.state().game_mode_settings(),
            GameModeSettings::Tractor
        ));
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(a.len(), 2);
        assert_eq!(names(g.state()), vec!["alice", "alice (2)"]);
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        assert_eq!(b.len(), 2);
        assert_eq!(
            names(g.state()),
            vec!["alice", "alice (2)", "bob", "bob (2)"]
        );
        // A third user spectates with one seat.
        let (c, _) = register_seats(&mut g, "carol").unwrap();
        assert_eq!(c.len(), 1);
        assert_eq!(observer_names(g.state()), vec!["carol"]);
        // Rejoining gives the same seats.
        let (a2, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(a2, a);
        assert_eq!(names(g.state()).len(), 4);

        assert_eq!(seat_ids(g.state(), "alice"), a);
        assert_eq!(seat_ids(g.state(), "carol"), c);
        assert!(seat_ids(g.state(), "dave").is_empty());
        assert!(owns_seat(g.state(), "alice", a[1]));
        assert!(!owns_seat(g.state(), "alice", b[0]));
        assert_eq!(first_seat(g.state(), "bob").unwrap(), b[0]);
        assert!(first_seat(g.state(), "dave").is_err());
        assert_eq!(sibling_seats(g.state(), a[0]), vec![a[1]]);
        assert_eq!(sibling_seats(g.state(), b[1]), vec![b[0]]);
        assert!(sibling_seats(g.state(), c[0]).is_empty());
        assert_eq!(
            room_names(g.state()),
            vec!["alice", "alice (2)", "bob", "bob (2)", "carol"]
        );
    }

    #[test]
    fn register_seats_one_vs_one_completes_a_partial_team_and_promotes_observers() {
        let mut g = one_vs_one_room();
        // alice has a single seat (e.g. restored from an older dump) and bob
        // is an observer: both get a full team in the Initialize phase.
        if let GameState::Initialize(init) = g.state_mut() {
            init.propagated_mut().add_player("alice".into()).unwrap();
            init.propagated_mut().add_observer("bob".into()).unwrap();
        }
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(a.len(), 2);
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        assert_eq!(b.len(), 2);
        assert_eq!(
            names(g.state()),
            vec!["alice", "alice (2)", "bob", "bob (2)"]
        );
        assert!(observer_names(g.state()).is_empty());
    }

    #[test]
    fn register_after_game_started_is_an_observer() {
        let mut g = one_vs_one_room();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        let mut ws = HashMap::new();
        // The first round needs both users' "start": alice's click votes
        // for both of her seats, bob's click starts the round.
        let (msgs, joined) =
            apply_action(&mut g, a[0], Action::StartGame, &logger(), &mut ws).unwrap();
        assert!(joined.is_empty());
        assert!(msgs
            .iter()
            .all(|(m, _)| matches!(m.variant(), MessageVariant::StartVote { .. })));
        assert!(matches!(g.state(), GameState::Initialize(_)));
        let (msgs, _) = apply_action(&mut g, b[0], Action::StartGame, &logger(), &mut ws).unwrap();
        assert!(!msgs.is_empty());
        assert!(matches!(g.state(), GameState::Draw(_)));
        assert_eq!(
            names(g.state()),
            vec!["alice", "bob", "alice (2)", "bob (2)"]
        );

        let (c, _) = register_seats(&mut g, "carol").unwrap();
        assert_eq!(c.len(), 1);
        assert_eq!(observer_names(g.state()), vec!["carol"]);
        let (a2, _) = register_seats(&mut g, "alice").unwrap();
        assert_eq!(a2, a);
    }

    #[test]
    fn heal_orders_seats_demotes_extras_and_adds_missing_seat() {
        let mut g = one_vs_one_room();
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        let carol = if let GameState::Initialize(init) = g.state_mut() {
            let p = init.propagated_mut();
            let carol = p.add_player("carol".into()).unwrap().0;
            // alice lost her second seat somehow.
            p.remove_player(a[1]).unwrap();
            p.set_rank(a[0], Rank::Number(Number::Five)).unwrap();
            p.set_meta_rank(a[0], 2).unwrap();
            p.set_landlord(Some(b[1])).unwrap();
            carol
        } else {
            panic!("not initialize")
        };
        let mut ws: HashMap<PlayerID, Vec<usize>> = HashMap::new();
        ws.insert(a[0], vec![7]);
        ws.insert(b[0], vec![8]);
        ws.insert(carol, vec![9]);

        let joined = heal_one_vs_one(&mut g, &mut ws).unwrap();
        let state = g.state();
        assert_eq!(names(state), vec!["bob", "alice", "bob (2)", "alice (2)"]);
        assert_eq!(observer_names(state), vec!["carol"]);
        assert_eq!(state.landlord(), Some(b[1]));
        let a2 = state.player_id("alice (2)").unwrap();
        let alice2 = state.players().iter().find(|p| p.id == a2).unwrap();
        assert_eq!(alice2.rank(), Rank::Number(Number::Five));
        assert_eq!(alice2.metalevel, 2);
        assert_eq!(ws[&a2], vec![7]);
        assert_eq!(ws[&a[0]], vec![7]);
        assert_eq!(joined.len(), 1);
        match &joined[0] {
            (
                7,
                GameMessage::Joined {
                    username,
                    names,
                    player_ids,
                    player_mode,
                },
            ) => {
                assert_eq!(username, "alice");
                assert_eq!(names, &["alice".to_string(), "alice (2)".to_string()]);
                assert_eq!(player_ids, &[a[0], a2]);
                assert_eq!(*player_mode, PlayerMode::OneVsOne);
            }
            other => panic!("{:?}", other),
        }
        assert_eq!(seat_ids(state, "alice"), vec![a[0], a2]);

        // The game can now start once everyone has clicked start.
        for id in g.state().players().iter().map(|p| p.id).collect::<Vec<_>>() {
            g.interact(Action::StartGame, id, &logger()).unwrap();
        }
        assert!(matches!(g.state(), GameState::Draw(_)));
    }

    #[test]
    fn heal_requires_two_users() {
        let mut g = one_vs_one_room();
        register_seats(&mut g, "alice").unwrap();
        let mut ws = HashMap::new();
        assert!(heal_one_vs_one(&mut g, &mut ws).is_err());
        assert!(apply_action(&mut g, PlayerID(0), Action::StartGame, &logger(), &mut ws).is_err());
        assert!(matches!(g.state(), GameState::Initialize(_)));
    }

    #[test]
    fn rank_applies_to_both_seats_in_one_vs_one() {
        let mut g = one_vs_one_room();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        let mut ws = HashMap::new();
        apply_action(
            &mut g,
            a[1],
            Action::SetRank(Rank::Number(Number::Seven)),
            &logger(),
            &mut ws,
        )
        .unwrap();
        apply_action(&mut g, a[0], Action::SetMetaRank(3), &logger(), &mut ws).unwrap();
        for p in g.state().players() {
            assert_eq!(p.rank(), Rank::Number(Number::Seven), "{}", p.name);
            assert_eq!(p.metalevel, 3, "{}", p.name);
        }
    }

    #[test]
    fn guards_reject_one_vs_one_actions_and_observer_resets() {
        let mut g = one_vs_one_room();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        register_seats(&mut g, "bob").unwrap();
        let (c, _) = register_seats(&mut g, "carol").unwrap();
        let s = g.state();
        assert!(guard_action(s, a[0], &Action::MakeObserver(a[1])).is_err());
        assert!(guard_action(s, a[0], &Action::MakePlayer(c[0])).is_err());
        assert!(guard_action(s, a[0], &Action::ReorderPlayers(vec![])).is_err());
        assert!(guard_action(
            s,
            a[0],
            &Action::SetGameMode(GameModeSettings::FindingFriends { num_friends: None })
        )
        .is_err());
        assert!(guard_action(s, a[0], &Action::SetGameMode(GameModeSettings::Tractor)).is_ok());
        assert!(guard_action(s, a[0], &Action::SetRated(false)).is_ok());
        assert!(guard_action(s, c[0], &Action::SetRated(false)).is_err());
        assert!(guard_action(s, c[0], &Action::ResetGame).is_err());
        assert!(guard_action(s, c[0], &Action::CancelResetGame).is_err());
        assert!(guard_action(s, a[0], &Action::StartGame).is_ok());

        let mut g = InteractiveGame::new();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        assert!(guard_action(g.state(), a[0], &Action::MakeObserver(a[0])).is_ok());
        assert!(guard_action(
            g.state(),
            a[0],
            &Action::SetGameMode(GameModeSettings::FindingFriends { num_friends: None })
        )
        .is_ok());
    }

    #[test]
    fn reset_confirmation_predicate() {
        assert!(reset_confirmation_allowed(None, false).is_ok());
        assert!(reset_confirmation_allowed(Some(false), false).is_ok());
        assert!(reset_confirmation_allowed(Some(true), false).is_err());
        assert!(reset_confirmation_allowed(None, true).is_err());
        assert!(reset_confirmation_allowed(Some(false), true).is_err());
    }

    #[test]
    fn reset_guard_in_rated_play_phase_needs_the_other_team() {
        let state = play_phase(["p1", "p2", "p3", "p4"], false);
        let (requester, teammate, opponent) = teams(&state);
        let mut g = InteractiveGame::new_from_state(state);
        let observer = g.register("spectator".into()).unwrap().0;
        assert!(!g.state().is_player(observer));

        // Nothing pending: any player may request.
        assert!(check_reset_confirmation(g.state(), teammate).is_ok());
        assert!(guard_action(g.state(), observer, &Action::ResetGame).is_err());

        g.interact(Action::ResetGame, requester, &logger()).unwrap();
        assert_eq!(g.state().reset_requester(), Some(requester));
        // Same requester again: a no-op in the core, allowed through.
        assert!(check_reset_confirmation(g.state(), requester).is_ok());
        // Teammate cannot confirm; opponent can.
        assert!(guard_action(g.state(), teammate, &Action::ResetGame).is_err());
        assert!(guard_action(g.state(), opponent, &Action::ResetGame).is_ok());
        assert!(guard_action(g.state(), observer, &Action::CancelResetGame).is_err());
        assert!(guard_action(g.state(), teammate, &Action::CancelResetGame).is_ok());

        // The rated flag is what turns the team rule on.
        let mut unrated = play_phase(["p1", "p2", "p3", "p4"], false);
        let (requester, teammate, _) = teams(&unrated);
        if let GameState::Play(p) = &mut unrated {
            p.propagated_mut().set_rated(false).unwrap();
        }
        let mut g = InteractiveGame::new_from_state(unrated);
        g.interact(Action::ResetGame, requester, &logger()).unwrap();
        assert!(guard_action(g.state(), teammate, &Action::ResetGame).is_ok());
    }

    #[test]
    fn reset_guard_in_rated_finding_friends_needs_every_other_player() {
        let (state, landlord) = finding_friends_play_phase(["p1", "p2", "p3", "p4"]);
        // An unrevealed friend would otherwise count as "the other team".
        assert!(needs_unanimous_reset(&state));
        let others: Vec<PlayerID> = state
            .players()
            .iter()
            .map(|p| p.id)
            .filter(|id| *id != landlord)
            .collect();
        assert_eq!(others.len(), 3);
        let mut g = InteractiveGame::new_from_state(state);
        let observer = g.register("spectator".into()).unwrap().0;
        assert!(!g.state().is_player(observer));

        let mut votes: HashSet<PlayerID> = HashSet::new();
        // Nothing pending: the request itself goes straight to the core.
        assert_eq!(
            record_reset_vote(g.state(), landlord, &mut votes),
            ResetVote::Forward
        );
        g.interact(Action::ResetGame, landlord, &logger()).unwrap();
        assert_eq!(g.state().reset_requester(), Some(landlord));

        // The team rule no longer decides; every other player must confirm.
        assert!(guard_action(g.state(), others[0], &Action::ResetGame).is_ok());
        assert_eq!(
            record_reset_vote(g.state(), others[0], &mut votes),
            ResetVote::Waiting {
                votes: 1,
                needed: 3
            }
        );
        // Voting twice does not count twice, and observers never count.
        assert_eq!(
            record_reset_vote(g.state(), others[0], &mut votes),
            ResetVote::Waiting {
                votes: 1,
                needed: 3
            }
        );
        assert!(guard_action(g.state(), observer, &Action::ResetGame).is_err());
        assert_eq!(
            record_reset_vote(g.state(), observer, &mut votes),
            ResetVote::Waiting {
                votes: 1,
                needed: 3
            }
        );
        assert_eq!(
            record_reset_vote(g.state(), others[1], &mut votes),
            ResetVote::Waiting {
                votes: 2,
                needed: 3
            }
        );
        // The last one completes it, and the core resets the round.
        assert_eq!(
            record_reset_vote(g.state(), others[2], &mut votes),
            ResetVote::Forward
        );
        g.interact(Action::ResetGame, others[2], &logger()).unwrap();
        assert!(matches!(g.state(), GameState::Initialize(_)));

        // Unrated, or Tractor: the usual "other team" rule applies instead.
        let (mut unrated, landlord) = finding_friends_play_phase(["p1", "p2", "p3", "p4"]);
        if let GameState::Play(p) = &mut unrated {
            p.propagated_mut().set_rated(false).unwrap();
        }
        assert!(!needs_unanimous_reset(&unrated));
        let other = unrated
            .players()
            .iter()
            .map(|p| p.id)
            .find(|id| *id != landlord)
            .unwrap();
        let mut g = InteractiveGame::new_from_state(unrated);
        g.interact(Action::ResetGame, landlord, &logger()).unwrap();
        assert!(guard_action(g.state(), other, &Action::ResetGame).is_ok());
        assert!(!needs_unanimous_reset(&play_phase(
            ["p1", "p2", "p3", "p4"],
            false
        )));
    }

    #[test]
    fn reset_guard_in_one_vs_one_needs_the_other_user() {
        // Seats [alice, bob, alice (2), bob (2)]: Tractor teams are users.
        let state = play_phase(["alice", "bob", "alice (2)", "bob (2)"], true);
        let (requester, same_user, other_user) = teams(&state);
        assert_eq!(
            username_for_seat(state.player_name(requester).unwrap()),
            username_for_seat(state.player_name(same_user).unwrap())
        );
        let other_user_2 = sibling_seats(&state, other_user)[0];
        let mut g = InteractiveGame::new_from_state(state);
        g.interact(Action::ResetGame, requester, &logger()).unwrap();
        assert!(guard_action(g.state(), same_user, &Action::ResetGame).is_err());
        assert!(guard_action(g.state(), other_user, &Action::ResetGame).is_ok());
        assert!(guard_action(g.state(), other_user_2, &Action::ResetGame).is_ok());

        // Unrated 1v1: still a different user.
        let mut unrated = play_phase(["alice", "bob", "alice (2)", "bob (2)"], true);
        let (requester, same_user, other_user) = teams(&unrated);
        if let GameState::Play(p) = &mut unrated {
            p.propagated_mut().set_rated(false).unwrap();
        }
        let mut g = InteractiveGame::new_from_state(unrated);
        g.interact(Action::ResetGame, same_user, &logger()).unwrap();
        assert!(check_reset_confirmation(g.state(), requester).is_err());
        assert!(check_reset_confirmation(g.state(), other_user).is_ok());
    }

    #[test]
    fn kick_removes_both_seats_in_one_vs_one() {
        let mut g = one_vs_one_room();
        let (a, _) = register_seats(&mut g, "alice").unwrap();
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        let msgs = kick_user(&mut g, "alice", b[1]).unwrap();
        let kicked = |msgs: &[GameMessage]| -> Vec<String> {
            msgs.iter()
                .filter_map(|m| match m {
                    GameMessage::Kicked { target } => Some(target.clone()),
                    _ => None,
                })
                .collect()
        };
        assert_eq!(kicked(&msgs), vec!["bob", "bob (2)"]);
        assert_eq!(names(g.state()), vec!["alice", "alice (2)"]);
        assert!(seat_ids(g.state(), "bob").is_empty());
        assert_eq!(seat_ids(g.state(), "alice"), a);

        let mut g = InteractiveGame::new();
        register_seats(&mut g, "alice").unwrap();
        let (b, _) = register_seats(&mut g, "bob").unwrap();
        let msgs = kick_user(&mut g, "alice", b[0]).unwrap();
        assert_eq!(kicked(&msgs), vec!["bob"]);
        assert_eq!(names(g.state()), vec!["alice"]);
        assert!(kick_user(&mut g, "nobody", PlayerID(0)).is_err());
    }

    /// A kick during a match voids the match in the core; the room must see
    /// the `MatchAbandoned` broadcast (DESIGN.md, "Core changes").
    #[test]
    fn kick_during_a_match_abandons_it() {
        let mut state = play_phase(["p1", "p2", "p3", "p4"], false);
        let mut play = match state {
            GameState::Play(ref mut p) => {
                // Keep the match going: nobody can reach "first to ace".
                p.propagated_mut()
                    .set_first_to_rank(Rank::Number(Number::Ace))
                    .unwrap();
                p.clone()
            }
            _ => panic!("not in play phase"),
        };
        play_out_round(&mut play, 4);
        let (init, _, _) = play.finish_game().unwrap();
        assert_eq!(init.propagated().num_games_finished(), 1);
        assert!(init.propagated().match_in_progress());

        let mut g = InteractiveGame::new_from_state(GameState::Initialize(init));
        let victim = g.state().player_id("p2").unwrap();
        let msgs = kick_user(&mut g, "p1", victim).unwrap();
        assert!(msgs
            .iter()
            .any(|m| matches!(m, GameMessage::Kicked { target } if target == "p2")));
        assert!(
            msgs.iter().any(|m| matches!(
                m,
                GameMessage::Broadcast { data, .. }
                    if matches!(data.variant(), MessageVariant::MatchAbandoned)
            )),
            "{:?}",
            msgs
        );
        // The match is over: everyone is back at rank 2.
        assert!(!g.state().match_in_progress());
        assert_eq!(names(g.state()), vec!["p1", "p3", "p4"]);
        for p in g.state().players() {
            assert_eq!(p.rank(), Rank::Number(Number::Two), "{}", p.name);
        }
    }

    #[test]
    fn pre_round_only_for_start_new_game_in_play_phase() {
        let play = play_phase(["p1", "p2", "p3", "p4"], false);
        let pre = pre_round(&play, &Action::StartNewGame).unwrap();
        assert!(pre.rated);
        assert_eq!(pre.player_mode, PlayerMode::Standard);
        assert_eq!(pre.round_key.len(), 32);
        assert_eq!(pre.rounds, 1);
        assert!(pre_round(&play, &Action::EndTrick).is_none());
        let init = InteractiveGame::new();
        assert!(pre_round(init.state(), &Action::StartNewGame).is_none());
    }

    #[test]
    fn parse_round_outcome_from_broadcasts() {
        let result_for = |is_defending: bool| PlayerGameFinishedResult {
            won_game: !is_defending,
            is_defending,
            is_landlord: false,
            ranks_up: 0,
            confetti: false,
            rank: Rank::Number(Number::Two),
        };
        let mut result = HashMap::new();
        result.insert("bob (2)".to_string(), result_for(false));
        result.insert("alice".to_string(), result_for(true));
        result.insert("bob".to_string(), result_for(false));
        result.insert("alice (2)".to_string(), result_for(true));
        let variants = [
            MessageVariant::EndOfGameSummary {
                landlord_won: false,
                non_landlords_points: 120,
                landlord_delta: 0,
                non_landlord_delta: 2,
            },
            MessageVariant::BonusLevelEarned,
            MessageVariant::GameFinished { result },
        ];
        let outcome =
            parse_round_outcome("room", "key", "mkey", PlayerMode::OneVsOne, variants.iter())
                .unwrap();
        assert_eq!(outcome.room, "room");
        assert_eq!(outcome.round_key, "key");
        assert_eq!(outcome.match_key, "mkey");
        assert_eq!(outcome.player_mode, PlayerMode::OneVsOne);
        assert!(!outcome.landlord_won);
        assert_eq!(outcome.level_delta, 2);
        assert_eq!(outcome.non_landlords_points, 120);
        let names: Vec<&str> = outcome.seats.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["alice", "alice (2)", "bob", "bob (2)"]);
        assert!(outcome.seats[0].is_defending && !outcome.seats[0].won_game);
        assert!(!outcome.seats[2].is_defending && outcome.seats[2].won_game);

        // Landlord win uses the landlord delta.
        let won = [
            MessageVariant::EndOfGameSummary {
                landlord_won: true,
                non_landlords_points: 20,
                landlord_delta: 3,
                non_landlord_delta: 0,
            },
            MessageVariant::GameFinished {
                result: HashMap::new(),
            },
        ];
        let outcome =
            parse_round_outcome("room", "key", "m", PlayerMode::Standard, won.iter()).unwrap();
        assert!(outcome.landlord_won);
        assert_eq!(outcome.level_delta, 3);

        // Both messages are required.
        assert!(
            parse_round_outcome("r", "k", "m", PlayerMode::Standard, won[..1].iter()).is_none()
        );
        assert!(
            parse_round_outcome("r", "k", "m", PlayerMode::Standard, won[1..].iter()).is_none()
        );
    }
}
