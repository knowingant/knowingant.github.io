# Design: knowingant shengji fork

This is a fork of [rbtying/shengji](https://github.com/rbtying/shengji) (MIT).
The frontend is served as static files from GitHub Pages at
`https://knowingant.github.io/shengji/`; the backend (Rust, axum) is hosted
separately (see `DEPLOY.md`) and its URL is configured in `runtime.js`.

## Changes from upstream

1. **Defaults**: autodraw speed fast (10 ms); bid takeback disallowed; play
   takeback disallowed; kitty ("bottom") penalty `Power` (2^n where n is the
   size of the largest component of the last trick). All still room settings.
2. **Accounts**: Google sign-in only; the account's username is the in-game
   name. Signing in is required to join any room. No passwords are stored.
3. **Matches**: a room plays "first to rank N" matches (N is a room
   setting, default 5, minimum 3). The first round of a match only starts
   once *every* player has clicked Start. The match ends the moment a player
   reaches rank N; everyone goes back to rank 2 for the next match.
4. **Ratings**: rooms are rated by default; a rated match moves an Elo-style
   rating once, at the end of the match, by an amount that depends on the
   ratings and the final margin only (`RATINGS.md`). Two ladders: `team`
   (Standard rooms) and `1v1`. Rounds are never rated on their own.
5. **Round end**: a round ends automatically as soon as the remaining cards
   cannot change the result and the bottom holds no points. The manual
   "end game early" button is gone (the client can't see the bottom, so it
   could never know whether ending early was safe).
6. **1v1 rooms**: exactly two users; each controls both seats of one team
   (seat names `alice` and `alice (2)`). Rated on the `1v1` ladder.
7. **Account pages**: per-user statistics (rounds, matches, ratings, match
   history) at `#user/<username>`.
8. **Footer**: says this is a vibecoded clone, credits Robert Ying, and asks
   people to donate to him (Venmo `@Robert-Ying` / the Stripe link).
9. **Removed**: Sentry, Twitter/OG metadata pointing at robertying.com,
   username/password accounts.

## Backend layout (Rust workspace)

- `core/`, `mechanics/`, `storage/`, `wasm-rpc-impl/`: upstream, with the
  additions listed under "Core changes".
- `rating/` (`shengji-rating`): pure rating math, unit tested, no I/O.
- `backend/src/db.rs`: SQLite (rusqlite, bundled) schema + queries.
- `backend/src/auth.rs` (+ `auth/google.rs`, `auth/ratelimit.rs`): Google
  ID-token verification, username pick, session tokens, dev login.
- `backend/src/ratings.rs`: match results → ratings/statistics, leaderboard
  and account endpoints.
- `backend/src/shengji_handler.rs`: websocket session (auth on join, 1v1
  seat handling, match/round hooks).
- `backend/src/main.rs`: routes, config, static serving.

### Configuration (env vars)

| Var | Meaning | Default |
|---|---|---|
| `DATABASE_PATH` | SQLite file | `./shengji.db` |
| `SESSION_TTL_DAYS` | sign-in token lifetime | `180` |
| `GOOGLE_CLIENT_ID` | OAuth web client ID; sign-in is impossible without it (or `DEV_LOGIN`) | unset |
| `DEV_LOGIN` | `1` enables `POST /api/auth/dev_login` (any username, no password). **Local development only; never set in production.** | unset |
| `CORS_ALLOWED_ORIGINS` | comma list, e.g. `https://knowingant.github.io` | localhost dev origins |
| `TRUST_PROXY_HEADERS` | `1` to read `Fly-Client-IP` for rate limiting | unset |
| `STATIC_DIR` | directory of built frontend to serve at `/` (optional) | unset (`dynamic` feature: `../frontend/dist`) |
| `DUMP_PATH`, `MESSAGE_PATH` | as upstream | `/tmp/...` |
| `PORT` | listen port | `3030` |

## HTTP API

All JSON. Errors are `{"error": "<message>"}` with a 4xx status (including
JSON body rejections). Authenticated endpoints take
`Authorization: Bearer <token>`. Tokens: 32 random bytes, base64url; only
the SHA-256 hash is stored; absolute expiry `created_at + SESSION_TTL_DAYS`;
a missing/unknown/expired token gives 401 `{"error": "not signed in"}` and
the frontend clears its stored token on that response.

- `GET /api/auth/config` → `{"google_client_id": string|null, "dev_login": bool}`
- `POST /api/auth/google` `{credential, device_id?}` where `credential` is a
  Google ID token from Google Identity Services →
  - existing account: `{token, user}`
  - new: `{"needs_username": true, "pending": "<opaque>", "suggested_username": "..."}`
- `POST /api/auth/google/complete` `{pending, username, device_id?}` → `{token, user}`
  - username: 3–20 chars, `[A-Za-z0-9_]`, unique case-insensitively, not
    reserved (`game`, `ratings`, `system`, `server`, `admin`, `moderator`,
    `observer`, `shengji`, anything starting with `_`)
- `POST /api/auth/dev_login` `{username, device_id?}` → `{token, user}`;
  404 unless `DEV_LOGIN=1`. Creates the account if needed.
- `POST /api/auth/logout` (auth) → `204` (this token only; live websockets
  finish naturally)
- `POST /api/auth/logout_all` (auth) → `204`
- `GET /api/auth/me` (auth) → `user`
- `GET /api/leaderboard?mode=team|1v1&limit=50` →
  `{"entries": [{username, rating, matches, wins, losses, draws}]}` (users
  with ≥ 1 rated match on that ladder, by rating desc)
- `GET /api/users/:username` → `profile` (see "Account pages")

`user` = `{id, username, ratings: {team: RatingView, "1v1": RatingView}}`,
`RatingView` = `{rating: int, matches, wins, losses, draws}`.

Google ID-token verification: RS256 signature against Google's JWKS
(`https://www.googleapis.com/oauth2/v3/certs`, key chosen by `kid`; cached
~6 h; refetched on an unknown `kid` at most once per minute; never at
startup), required claims `exp`, `iss`, `aud`, `sub`; `iss` ∈
{`accounts.google.com`, `https://accounts.google.com`}; `aud` ==
`GOOGLE_CLIENT_ID`; 60 s leeway. Identity is `sub`; `email` is stored only
if `email_verified`. The `pending` token is 32 random bytes (hash stored,
10-minute TTL, single use).

Rate limits (in-memory, keyed by client IP — the `Fly-Client-IP` header only
when `TRUST_PROXY_HEADERS=1`, else the socket peer): `google` 30 / 10 min /
IP; `google/complete` and `dev_login` 20 / hour / IP. The auth router has a
16 KiB body limit.

Upstream endpoints kept: `POST /api/rpc`, `/default_settings.json`,
`/cards.json`, `/public_games.json`, `/stats`, `/runtime.js`.
**Removed**: `/full_state.json` (it dumped every room's unredacted hands).

### Alt detection (best effort)

The client keeps a random `device_id` in localStorage and sends it on
sign-in and on every room join; `user_devices(user_id, device_id, ...)`
records it. A match in which two *different* users share a device seen in
the last 30 days is **not rated**, and a `System` message says so. Nothing
is auto-banned; IP overlap is deliberately not used.

## WebSocket protocol (`GET /api`, upgrade)

First message from client (`JoinRoom`), within 10 s of connecting:

```json
{"room_name": "<16 chars [A-Za-z0-9_-]>", "token": "<bearer token>",
 "disable_compression": false, "room_type": "Standard" | "OneVsOne",
 "device_id": "..."}
```

`room_type` is only applied when the room does not exist yet. Bad/missing
token → `Error("not signed in")` and the socket is closed. Errors sent
before the join succeeds are never compressed. The upgrade request's
`Origin`, when present, must be one of `CORS_ALLOWED_ORIGINS` (or
same-origin). Frames are capped at 64 KiB; chat messages at 2000 bytes.

After registration the server sends, to this socket only:

```json
{"Joined": {"username": "alice", "names": ["alice"], "player_ids": [3],
            "player_mode": "Standard"}}
```

(1v1 room, user owns a team: `names: ["alice", "alice (2)"]`, two ids.)

Client → server (`UserMessage`) as upstream plus
`{"ActionAs": [<player_id>, <Action>]}` (act as one of the seats this
connection controls; plain `{"Action": ...}` acts as the first seat).

Server → client (`GameMessage`) additions:

- `Joined {...}` (above)
- `RoomRatings {mode, ratings: {<seat name>: RatingView}}` after every join
  and after every rating update.
- `MatchRated {match_id, mode, changes: [{username, before, after, delta,
  levels, score}]}` after a rated match.
- `System {message}` — a server notice, rendered like a game broadcast.
  User chat can never produce this variant.

Name-targeted messages (`Beep`, `Kicked`, `ReadyCheck`) match against all
names of a connection. The first `State` may reach the client before
`Joined`; the frontend treats `seats == null` as one seat named `state.name`.

## Core changes (`core/`, `mechanics/`)

- Defaults: `BidTakebackPolicy::NoBidTakeback`,
  `PlayTakebackPolicy::NoPlayTakeback`, `KittyPenalty::Power`.
- `PropagatedState`: `rated: bool` (default true), `player_mode:
  PlayerMode {Standard, OneVsOne}` (fixed at room creation by the backend),
  `first_to_rank: Rank` (default 5; `SetFirstToRank` rejects anything below
  3), `round_key` (random per round), `match_key` (random per match, set when
  its first round starts), `start_votes`.
- Actions: `SetRated(bool)`, `SetFirstToRank(Rank)`. `StartGame` in the
  Initialize phase of a room with no match in progress records a vote
  (`MessageVariant::StartVote {player, votes, needed}`) and only starts the
  round when every player has voted; any other lobby action clears the
  votes. Between rounds of a match a single `StartGame` starts the next
  round (as upstream).
- A match is in progress once `num_games_finished > 0`. While it is: the
  settings that define it are locked (`rated`, `first_to_rank`,
  `game_mode`, ranks, `max_rank`, landlord, roster changes:
  `MakeObserver` / `MakePlayer` / `ReorderPlayers`), observers are not
  promoted between rounds, and kicking a player abandons the match
  (`MatchAbandoned`: ranks reset, nothing rated).
- `finish_game` (round end): after rank advancement, if any player's rank
  ≥ `first_to_rank`, emit `MatchFinished {match_key, first_to_rank,
  standings: [{player, name, rank, levels, winner}]}` and reset the match
  (ranks 2, landlord none, `num_games_finished` 0, waiting observers join).
  Otherwise the next landlord is chosen as upstream.
- Resetting the first round of a match (`ResetGame`) also clears the match
  key and votes; resetting a later round just replays that round.
- `finish_trick`: after a trick, if the kitty holds no point cards and the
  remaining cards cannot reach the next scoring threshold (true points, not
  the possibly hidden ones), the round ends (`game_ended_early`,
  `GameEndedAutomatically`). `EndGameEarly` is refused while the kitty holds
  points.
- `MessageVariant::EndOfGameSummary` carries `landlord_delta` /
  `non_landlord_delta`; new variants `FirstToRankSet`, `StartVote`,
  `MatchStarted`, `MatchFinished`, `MatchAbandoned`,
  `GameEndedAutomatically`, `RatedSet`.
- Redaction for several seats: `GameState::for_players(&[PlayerID])`,
  `Hands::destructively_redact_except_for_players`. `reset_requester()`,
  `BroadcastMessage::variant()/actor()`, `Rank::index()/from_index()`.
- `reorder_players` rejects duplicate ids; landlord labels are capped at 16
  chars; observers can be kicked from the lobby;
  `make_all_observers_into_players` is a no-op in 1v1 rooms and during a
  match.

## Rated matches (backend semantics)

When a `StartNewGame` (round end) produces `MatchFinished`, the handler
captures, *inside* the storage operation, the pre-round `rated`,
`player_mode`, `match_key`, the standings and the round's own outcome, hands
them out through a mutex/oneshot (the `register_user` pattern), and after
the operation:

1. records the round and the match for statistics regardless of `rated`
   (`rounds`, `round_players`, `matches`, `match_players`);
2. if `rated` and the match is rateable — Standard: ≥ 4 players; 1v1:
   exactly 2 users; every seat name maps to an account; no two users share
   a device (30 days); `match_key` not already rated — calls
   `ratings::apply_match` (one SQLite transaction; idempotent on
   `match_key`), then publishes `MatchRated` and a fresh `RoomRatings`;
   otherwise publishes a `System` notice saying why the match was not rated.

Every other round end also records the round (`rounds` / `round_players`,
with the match key) for statistics; nothing is published for it.

Sides for the rating call: Tractor → the two seat-parity teams;
Finding Friends → each player their own side; 1v1 → each user (both seats)
one side. Levels = `Rank::index(final rank)`; the crate caps at N − 2.

Seat → user mapping is purely by name (`alice (2)` → `alice`): the server
assigns names from the authenticated account.

Reset guards (rating-dodge prevention), enforced in the handler before
`interact`: `ResetGame` / `CancelResetGame` / `SetRated` /
`SetFirstToRank` / `StartGame` require the caller to be a player. In a rated
room during the Play phase, the confirming `ResetGame` must come from a
player on a different team than the requester (Tractor:
`PlayPhase::landlords_team()`; 1v1: a different user); in Finding Friends
while any friend is still unrevealed, the reset needs every other player's
confirmation (`reset_votes` on `VersionedGame`; cleared on cancel or phase
change).

## 1v1 rooms (backend)

- Creation: `room_type: "OneVsOne"` on a fresh room sets
  `player_mode = OneVsOne` and forces `game_mode = Tractor`.
- Registration ("both seats or none"): `u` and `u (2)` both exist → rejoin
  both; Initialize with fewer than 2 seat owners → add both seats; else
  observer.
- Rejected in 1v1 rooms: `MakeObserver`, `MakePlayer`, `ReorderPlayers`,
  `SetGameMode(FindingFriends)`. `Kick(id)` kicks both seats of that user.
- `StartGame`: self-heal (demote non-owners, add a missing `u (2)`), require
  exactly 4 seats from exactly 2 users, reorder to `[A, B, A (2), B (2)]`
  (landlord preserved), then the action is applied for **both** seats of
  the caller (so one click is one user's vote). `SetRank` / `SetMetaRank`
  likewise apply to both seats.
- Redaction: `for_players(connection's seat ids)`.

## Account pages and statistics

`GET /api/users/:username` →

```
{ id, username, created_at,
  ratings: {team: RatingView, "1v1": RatingView},
  stats: { rounds, rounds_won, defender_rounds, defender_wins,
           landlord_rounds, landlord_wins, levels_gained,
           matches, matches_won, matches_lost, matches_drawn,
           rated_matches },
  recent_matches: [ {match_id, mode, rated, first_to_rank, finished_at,
                     players: [{username, levels, winner}],
                     levels, result: "won"|"lost"|"drawn",
                     rating_before?, rating_after?, delta?} ]   // last 20
}
```

Statistics count every finished round and match the user played, rated or
not; ratings count rated matches only. The frontend route `#user/<name>`
renders this; `AccountBar`, leaderboard rows and player names link to it.

## Frontend

- `src/api.ts`: `apiHost()` from `window._API_HOST` (`runtime.js`; empty =
  same origin), `apiUrl`, `wsUrl`, `apiFetch` (bearer, JSON errors, clears
  the token on a "not signed in" 401), typed wrappers.
- The websocket is opened lazily on the first `send` (the join), not on
  page load.
- Landing page: signed out → `Auth.tsx` (Google button; a "dev sign-in"
  username form when `dev_login` is on; the no-alts rule and the
  vibecoded/idiot notice). Signed in → `AccountBar` (username, ratings,
  profile link, sign out), `JoinRoom` (room code, room type), leaderboard.
- Hash routing: `#<16-char room>` joins a room; `#user/<name>` shows an
  account page (`AccountPage.tsx`).
- In room (`Game.tsx`): `RatedBanner` ("Rated match · first to 5 · round
  2" / "Unrated"), `Initialize.tsx` with the Rated and First-to-rank
  selects (disabled while a match is in progress) and a Start button that
  shows the vote count ("Start (2/4 ready)"); no "End game early" button;
  a match summary (modal + chat) on `MatchFinished` / `MatchRated`; 1v1
  dual-seat rendering via `SeatProvider` (`{Action: X}` →
  `{ActionAs: [pid, X]}`), second seat `compact`.
- `Players.tsx` shows ratings next to names; `ChatMessage.tsx` renders
  `MatchRated`, `System`, `StartVote`, `MatchFinished` nicely.
- `Credits.tsx`: the vibecoded/clone/donate footer; change log entry.
