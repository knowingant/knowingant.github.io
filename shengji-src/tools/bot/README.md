# shengji e2e bot

A standalone Node script that signs users in, joins a room over the
websocket and plays whole **matches** ("first to rank N") automatically for
every seat it controls. It exists to exercise the backend end to end (dev
sign-in, `JoinRoom`, 1v1 seat handling, start votes, the Draw/Exchange/Play
protocol, automatic round end, match end and ratings) without a browser.

Only dependency: `ws`. Requires Node 18+ (global `fetch`).

## Running

Backend (the bot needs the HTTP API, `/api/rpc` and the websocket).
`DEV_LOGIN=1` is required: there is no register/login endpoint any more, and
without it `POST /api/auth/dev_login` is a 404 (the bot says so and exits 1).

```sh
cd shengji-src/backend && DEV_LOGIN=1 DATABASE_PATH=/tmp/bot.db cargo run --features dynamic
```

Bot, in another terminal:

```sh
cd shengji-src/tools/bot && npm install
node bot.js --host http://localhost:3030 --room 0123456789abcdef \
  --users alice,bob --room-type OneVsOne --matches 1 --first-to 3
```

Standard (4 users, one seat each):

```sh
node bot.js --host http://localhost:3030 --room fedcba9876543210 \
  --users carol,dave,erin,frank --room-type Standard --matches 1 --first-to 3
```

Options:

| flag | meaning |
|---|---|
| `--host URL` | backend origin (`ws://`/`wss://` is derived from it) |
| `--room NAME` | 16 hex characters; use a fresh name so `room_type` applies |
| `--users a,b` | 2 users for `OneVsOne`, 4+ for `Standard` |
| `--room-type` | `OneVsOne` (default) or `Standard` |
| `--matches N` | matches to play before exiting (default 1) |
| `--first-to RANK` | match length, `3`..`A`/`NT` (default `3`, so test matches are short); `--first-to keep` leaves the room's setting alone |
| `--unrated` | make the room unrated (default: leave it rated) |
| `--timeout S` | exit 1 after this long without a `State` change (default 120) |
| `--device-id-prefix P` | `device_id` sent per user is `P + username` (default `bot-`); `--no-device-id` omits it |
| `--verbose` | also log every `DrawCard` and every received `State` |

Exit status: `0` after `--matches` matches finished, the final standings
were printed and each user's `GET /api/users/<username>` (ratings, lifetime
stats, last `recent_matches` entry) has been printed; `1` on auth failure, a
rejected token, `Kicked`, a closed socket, or no progress for `--timeout`
seconds (the phase, seats and match/round counters of every connection are
printed).

Log format: one line per action, e.g. `[alice#1] Bid 2♥ x1` (`#n` is the
seat index on that connection; Standard rooms print `[alice]`), every server
`Error` as `[alice] ERROR: ...`, broadcasts as `[room] ...`, and
`MatchStarted` / `MatchFinished` / `MatchRated` / `System` / the final
ratings with a `========` prefix. `DrawCard` is summarised as
`[alice#1] drew 25 cards` unless `--verbose`.

## Tests

```sh
npm test
```

`node:test` unit tests over the pure decision functions (`decide.js`) and
the card encoding (`cards.js`), using hand-written `GameState` fixtures in
the shapes of `frontend/src/gen-types.d.ts`: the start-vote logic (everybody
votes for the first round of a match, one vote per connection however many
other votes arrive, a re-vote when the vote was cleared or rejected, a
single `StartGame` between rounds), the settings-before-voting rule, and
`applyBroadcast`'s round/match counting.

The websocket/HTTP layer in `bot.js` is covered by running it against a real
backend (see below) rather than by unit tests.

### Verified end to end

Against `DEV_LOGIN=1 PORT=3031 cargo run --features dynamic` (fresh DB),
`--first-to 3`, one command per room:

- 1v1 rated (`alice`,`bob`): one match, two rounds, `MatchRated` with
  `alice 1500 -> 1560 (+60)` / `bob 1500 -> 1440 (-60)`; `/api/users` shows
  `1v1 1560 (1m 1w-0l-0d)` / `1440 (1m 0w-1l-0d)`.
- Standard rated (`carol`,`dave`,`erin`,`frank`): one match, one round,
  `carol`/`erin` `+60`, `dave`/`frank` `-60` on the `team` ladder.
- 1v1 `--unrated`: `MatchFinished` but no `MatchRated`; ratings unchanged and
  `recent_matches[0]` has `rated: false` with no delta; the backend logs
  "Match recorded without rating … this room is unrated".
- 1v1 `--matches 2`: the room returns to Initialize at rank 2 with
  `num_games_finished 0`, both users vote again and the second match is
  rated on the updated ratings (`+40`/`-40` at 1560 vs 1440).

## How it plays

- **Initialize, new match** (`propagated.num_games_finished === 0`): the
  first user sends the room settings that still differ — `SetFirstToRank`
  and, with `--unrated`, `SetRated` — *before* anybody votes, because any
  lobby action other than `StartGame` clears every start vote; each setting
  is sent at most once per match. Once the settings are in the state, every
  user sends one `StartGame`. The server answers each with a `StartVote`
  broadcast (`{player, votes, needed}`) and starts the round on the last
  vote (`MatchStarted`, then `StartingGame`). In a 1v1 room one user's
  `StartGame` counts for both of their seats, so it is still sent once per
  user. A connection votes once and votes again only if its vote was cleared
  or rejected, never just because somebody else's vote produced a `State`.
- **Initialize, between rounds** (`num_games_finished > 0`): exactly one
  user sends `StartGame` — the owner of `propagated.landlord` (which also
  satisfies `AllowLandlordOnly`), else the first user.
- **Draw**: `DrawCard` whenever `players[position]` is one of my seats and
  the deck is non-empty. Every 3 cards (from 4 in hand) each seat asks
  `POST /api/rpc` `FindValidBids` and, if nobody has bid yet, bids the
  cheapest result (lowest count, suited before jokers). When the deck is
  empty the landlord (`propagated.landlord`, else the winning/first bid per
  `first_landlord_selection_policy`, else the autobid) sends `PickUpKitty`;
  if there is no bid at all and a landlord is set it sends `RevealCard`
  until an autobid appears (or `PickUpKitty` directly at level NT).
- **Exchange**: the exchanger moves every kitty card to hand
  (`MoveCardToHand`), then moves the lowest non-trump, non-point cards back
  (`MoveCardToKitty`) until `kitty.length === kitty_size`, then the landlord
  sends `BeginPlay` (after `PutDownKitty` if kitty theft is enabled, and
  after `SetFriends` in Finding Friends). One card per received `State`.
- **Play**: when `trick.player_queue[0]` is mine: leading, play the single
  lowest non-trump non-point card; following, ask `DecomposeTrickFormat`
  and take the first entry with a non-empty `playable` (the UI's "suggest a
  play"), padded to the trick size; fall back to "as many cards of the led
  suit as I hold plus the lowest others", then to "any cards". Candidates
  are checked with `CanPlayCards` first; a play the server rejects is not
  repeated. When the queue is empty and cards were played, the connection
  that played last sends `EndTrick`.
- **Round end**: rounds end by themselves — the server sets
  `game_ended_early` and broadcasts `GameEndedAutomatically` as soon as the
  remaining cards cannot change the result. The bot never sends
  `EndGameEarly` (it is gone from the UI and the server refuses it while the
  bottom holds points); it just sends `StartNewGame` from the landlord's
  connection once the hands are empty or `game_ended_early` is set.
- **Match end**: the `StartNewGame` that decides the match broadcasts
  `MatchFinished {match_key, first_to_rank, standings}` and, in a rated
  room, a separate `MatchRated {match_id, mode, changes}` message (or a
  `System` "Not rated: …" notice). The room then goes back to Initialize
  with everyone at rank 2 and `num_games_finished 0`, ready for the next
  match. The bot counts `MatchFinished` broadcasts; after `--matches` of
  them it prints the standings, waits up to 5 s for `MatchRated`/`System`
  (1.5 s in an unrated room, where nothing is published), reads
  `GET /api/users/<username>` for every user and exits 0.
- One decision per received `State`; on a server `Error` the latest state
  is re-evaluated after 500 ms; if nothing comes back within 3 s of sending
  an action it is re-evaluated as well.

## Assumptions about the protocol (please double-check)

1. **Auth**: `POST /api/auth/dev_login {username, device_id}` →
   `{token, user}`; 404 means the backend is not running with `DEV_LOGIN=1`
   (reported as such). `device_id` is `bot-<username>`, distinct per user so
   alt detection does not un-rate the match; it is also sent with
   `JoinRoom`. The endpoint is rate limited (20 / hour / IP), which is
   enough for a handful of runs but not for a tight loop.
2. **JoinRoom**: the first websocket message is
   `{"room_name", "token", "disable_compression": true, "room_type", "device_id"}`.
   If the `JoinRoom` struct rejects unknown fields, pass `--no-device-id`.
3. **Frames**: the server sends binary frames containing plain JSON when
   `disable_compression` is true; the bot decodes text or binary. If a
   zstd frame (magic `28 B5 2F FD`) arrives it exits 1 with a message.
4. **Joined**: `{"Joined": {username, names, player_ids, player_mode}}` is
   sent to the joining socket, possibly *after* the first `State`. Until
   it arrives seats are derived by matching `username` / `username (2)`
   among players and observers.
5. **Actions**: `{"ActionAs": [player_id, Action]}` whenever
   `player_mode` is `OneVsOne` (from `Joined`, else the state's
   `propagated.player_mode`, else `--room-type`); `{"Action": Action}` in
   Standard rooms. `Action` JSON follows `gen-types.d.ts` (unit variants as
   strings, e.g. `"DrawCard"`; `{"Bid": [card, count]}`,
   `{"PlayCards": [cards]}`, `{"SetFirstToRank": "3"}`, `{"SetRated": false}`
   — a `Rank` is the plain string `"2"`..`"A"`/`"NT"`).
6. **Errors**: a rejected action produces
   `{"Error": "Failed to handle user action: <reason>"}` on this socket
   only and no `State`. `"not signed in"` is treated as fatal.
7. **Start votes**: `propagated.start_votes` is a plain list of the
   `PlayerID`s that have voted, visible to every client, cleared by any
   lobby action other than `StartGame` and by `begin_match`. A repeated
   `StartGame` from the same seat is idempotent. `SetRated` /
   `SetFirstToRank` / `StartGame` require the caller to be a player, and the
   first two are refused once `num_games_finished > 0`.
8. **RPC**: `POST /api/rpc` with `{"type": "<Variant>", ...fields}`
   returns `{"type": "<Variant>", ...}`; failures are HTTP 500 (note:
   serde cannot serialise the internally tagged newtype
   `WasmRpcResponse::Error(String)`, so the body may be empty — the bot
   treats any non-200 as failure and falls back to local heuristics).
   `FindValidBids` is called with `epoch: 0` and the Draw state's `hands`,
   `players`, `landlord`, policies and `num_decks`; `DecomposeTrickFormat`
   with `trick.trick_format`, `hands`, `player_id`, `trick_draw_policy`;
   `CanPlayCards` with `trick`, `id`, `hands`, `cards`,
   `trick_draw_policy`, `compound_formats`.
9. **Exchange start**: `ExchangePhase::new` sets `kitty_size = kitty.len()`
   and does not move the kitty into the landlord's hand, so `BeginPlay` is
   legal immediately; the bot still performs the pick-up/discard cycle. It
   relies on `for_players` leaving the kitty visible to the exchanger's
   connection; if the kitty arrives redacted it just sends `BeginPlay`.
10. **Ratings**: `MatchRated` carries `{match_id, mode, changes:
    [{username, before, after, delta, levels, score}]}` (there is no
    `RatingsUpdated` any more). `levels` is capped at `first_to_rank − 2`,
    so it can be smaller than the `levels` in the standings. A rated match
    needs exactly the 2 users of a 1v1 room, or ≥ 4 accounts in a Standard
    room, and no shared `device_id`; otherwise a `System` "Not rated: …"
    notice is published instead — except in an explicitly unrated room,
    where nothing at all follows `MatchFinished`.
11. **Account page**: `GET /api/users/<username>` →
    `{id, username, created_at, ratings: {team, "1v1"}, stats,
    recent_matches}`; `RatingView` is `{rating, matches, wins, losses,
    draws}` and `recent_matches[0]` is the most recent match.
12. **round_key**: `propagated.round_key` keys the per-round exchange
    bookkeeping, falling back to `num_games_finished`.
13. **Turn order**: each `State` is the redacted state for this connection
    (`Hands` of other players are `{"🂠": n}`; the deck is `n` unknown
    cards but its length is real).
14. **No bids at all**: if no player ever obtains a valid bid and no
    landlord is configured, the game cannot proceed and the bot exits by
    timeout (practically impossible with two decks).
15. Kitty theft and Finding Friends paths (`PutDownKitty`, `SetFriends`
    with a Q/J of non-trump suits) are implemented from the code but not
    needed for 1v1 or Standard Tractor and were not run against the backend.
16. `Kicked` (another session of the same user joined, or a real kick) ends
    the run with exit 1; `Beep`, `ReadyCheck` and `Header` are ignored.
    `MatchAbandoned` is logged but not otherwise handled: the bot would keep
    playing the restarted climb until it finishes a match.
