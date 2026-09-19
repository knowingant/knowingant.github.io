# shengji (knowingant fork)

A vibecoded fork of [rbtying/shengji](https://github.com/rbtying/shengji)
(MIT, by Robert Ying and friends — the real thing is at
[robertying.com/shengji](https://robertying.com/shengji/)).
Forked from upstream commit `71f8d43` (2026-04-27).

Hosted at <https://knowingant.github.io/shengji/> (frontend) with a separate
backend (see `DEPLOY.md`).

What's different from upstream:

- **Accounts** (username/password or Google); you must be signed in to play.
  Use a password you don't use anywhere else. One account per person.
- **Rated by default**: every round (deal) moves a Glicko-2-style rating.
  Two ladders, `team` and `1v1`. Design in `RATINGS.md`.
- **1v1 rooms**: two people, each plays both hands of a team.
- **Reset guards**: in a rated round a reset must be confirmed by the other
  side (in 1v1, the other user), so nobody can dodge a loss; the rule for
  rated Finding Friends rounds is in `DESIGN.md` ("Reset guards").
- Defaults: fast autodraw, no bid takebacks, no play takebacks.

Docs:

- `DESIGN.md` — architecture, protocol, backend/frontend changes.
- `RATINGS.md` — the rating system.
- `DEPLOY.md` — hosting, environment variables, local development.

Layout (Rust workspace + React frontend, as upstream) plus:

- `rating/` — rating math crate.
- `backend/src/{db,auth,ratings,config}.rs` — SQLite, accounts, rating glue.
- `deploy/Dockerfile` — backend image (context = repo root).
- `tools/bot/` — end-to-end test bot that plays rated rounds over the websocket.

Development:

```sh
cd frontend && yarn install && yarn watch
cd backend && cargo run --features dynamic   # http://localhost:3030/
```

Tests: `cargo test --all`, `cd frontend && yarn test && yarn lint`.
