# Deploying

Two halves:

1. **Frontend** — static files in `../shengji/`, served by GitHub Pages at
   `https://knowingant.github.io/shengji/`. Rebuilt with
   `scripts/build_shengji.sh` and committed.
2. **Backend** — a single Rust binary (game server, accounts, ratings) with
   a SQLite file. Runs anywhere that supports WebSockets and a persistent
   disk. Section 1 targets [Fly.io](https://fly.io); section 1b is the
   same thing on a VM you run yourself (free on Oracle).

The frontend finds the backend through `runtime.js` (`window._API_HOST`).
The source is `shengji-src/frontend/static/runtime.js`; the build script
copies it to `shengji/runtime.js`, so edit the source (not the generated
copy) if you host the backend somewhere other than
`https://knowingant-shengji.fly.dev`, then rebuild.

## 0. Tools (once)

```sh
brew install rustup node yarn wasm-pack flyctl
rustup default stable
rustup target add wasm32-unknown-unknown
```

## 1. Backend on Fly.io (once)

From the repo root (where `fly.toml` lives), in this order:

```sh
./scripts/build_shengji.sh                            # frontend first (section 3); the image needs ./shengji
fly auth login
fly launch --no-deploy --copy-config --name knowingant-shengji   # reads fly.toml as is
fly volumes create shengji_data --size 1 --region sjc # must match primary_region in fly.toml
fly secrets set GOOGLE_CLIENT_ID=<client id>.apps.googleusercontent.com   # required, see below
fly deploy
```

`fly deploy` builds `shengji-src/deploy/Dockerfile` with the repo root as
context. The image bundles `./shengji` (the built frontend) as a fallback UI
served at `/` and fails to build without it, so `scripts/build_shengji.sh`
has to run before the first deploy. GitHub Pages is still the real UI.
`fly launch` may ask whether to tweak the settings; say no. The volume must
exist before `fly deploy` (`[[mounts]]` in `fly.toml`) and in the same region
as `primary_region`.

The app will be at `https://knowingant-shengji.fly.dev`. If you picked a
different app name, put the new backend URL in
`shengji-src/frontend/static/runtime.js` (`_API_HOST`) and rebuild the
frontend (step 3). `CORS_ALLOWED_ORIGINS` in `fly.toml` is the *frontend*
origin (`https://knowingant.github.io`) and stays as is.

### Google sign-in (required)

Google is the only way to sign in on a real deployment (no passwords are
stored anywhere).

1. Google Cloud Console → APIs & Services → Credentials → Create credentials
   → OAuth client ID → Web application.
2. Authorized JavaScript origins: `https://knowingant.github.io` and
   `https://knowingant-shengji.fly.dev` (and `http://localhost:3030` for
   local dev). No redirect URIs are needed (Google Identity Services popup).
3. `fly secrets set GOOGLE_CLIENT_ID=<client id>.apps.googleusercontent.com`

Without the secret nobody can sign in. Never set `DEV_LOGIN` on the
deployed app: it lets anyone sign in as anyone.

### Data

Everything persistent is on the volume at `/data`: `shengji.db` (accounts,
sessions, ratings, round history; SQLite in WAL mode) plus the room-state
dump and header messages (`shengji_state.json`, `shengji_messages.json`).
Back up the database with a consistent snapshot (the image ships `sqlite3`
for this):

```sh
fly ssh console -C "sqlite3 /data/shengji.db '.backup /data/backup.db'"
fly sftp get /data/backup.db
```

Do not copy `shengji.db` on its own: in WAL mode recent writes sit in
`shengji.db-wal` until a checkpoint, so `fly sftp get /data/shengji.db`
without the `-wal`/`-shm` files can lose them.

### Logs / status

```sh
fly logs
fly status
curl https://knowingant-shengji.fly.dev/stats
curl 'https://knowingant-shengji.fly.dev/api/leaderboard?mode=team'
```

## 1b. Backend on a VM instead (Oracle Always Free, or any Linux box)

Same binary, same Docker image, but you run it yourself behind
[Caddy](https://caddyserver.com) for HTTPS. More steps than Fly, no monthly
bill. Files: `shengji-src/deploy/vm/` (`compose.yaml`, `Caddyfile`,
`.env.example`). The image is built by GitHub Actions on every push to
`main` that touches `shengji-src/` or `shengji/`
(`.github/workflows/backend-image.yml`) and published as
`ghcr.io/knowingant/shengji:latest` (amd64 only).

Cost notes, checked 2026-09-19: Oracle's Always Free tier includes the public
IP and 10 TB/month of traffic, so it is genuinely free, but Oracle may
reclaim an Always Free instance that stays under 20% CPU and network for 7
days, which an idle game server does. Upgrading the account to Pay As You
Go keeps the free allowances (Oracle: "Oracle doesn't charge for Always Free
resources after you upgrade") and is the usual way to avoid that. Google
Cloud's free e2-micro is not free for this: every external IPv4 address on a
VM costs $0.005/hour (about $3.60/month), which is roughly Fly's price.

### Before the VM

1. Pick a hostname. Free option: [DuckDNS](https://www.duckdns.org): sign
   in, add a subdomain such as `knowingant-shengji.duckdns.org`; the IP can
   be filled in later.
2. Add `https://<hostname>` to the Google OAuth client's authorized
   JavaScript origins (only needed for the fallback UI the backend serves
   at its own address).
3. Put `https://<hostname>` in `shengji-src/frontend/static/runtime.js`
   (`_API_HOST`), rebuild (`./scripts/build_shengji.sh`), commit, push.
   The push publishes the frontend and starts the image build (Actions
   tab, roughly 10–15 minutes). If GitHub created the package as private,
   make it public: `github.com/knowingant?tab=packages` → shengji → Package
   settings → Change visibility → Public. Otherwise the VM's `docker pull`
   is denied.

### Oracle Cloud

1. Sign up at `oracle.com/cloud/free`. A card is required for identity
   verification; nothing is charged. The home region is permanent and
   Always Free compute only runs there, so pick one near the players.
2. Compute → Instances → Create instance. Image: Canonical Ubuntu 24.04.
   Shape: Virtual machine → Specialty and previous generation →
   `VM.Standard.E2.1.Micro` (Always Free; x86, which the image needs).
   Networking: new VCN with a public subnet, assign a public IPv4 address.
   SSH keys: paste your public key (`cat ~/.ssh/id_ed25519.pub`; run
   `ssh-keygen -t ed25519` first if you have none). Create and wait for
   Running.
3. Open ports: instance → Primary VNIC → subnet → Default Security List →
   Add Ingress Rules: source `0.0.0.0/0`, protocol TCP, destination port
   `80`; add a second rule for `443`.
4. Make the IP permanent: instance → Attached VNICs → the VNIC → IPv4
   addresses → Edit → Reserved public IP. Put the resulting IP into DuckDNS.

### On the VM

```sh
ssh ubuntu@<ip>

# Oracle's Ubuntu image rejects everything but SSH in iptables.
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

curl -fsSL https://get.docker.com | sudo sh

mkdir -p ~/shengji && cd ~/shengji
B=https://raw.githubusercontent.com/knowingant/knowingant.github.io/main/shengji-src/deploy/vm
curl -fsSLO $B/compose.yaml && curl -fsSLO $B/Caddyfile && curl -fsSL $B/.env.example -o .env
nano .env                    # DOMAIN and GOOGLE_CLIENT_ID
sudo docker compose up -d
```

Check: `curl https://<hostname>/api/auth/config` prints the client ID.
`sudo docker compose logs -f` shows both containers; Caddy fetches the
certificate on first start, so DNS must already point at the VM.

Update after a push: `sudo docker compose pull && sudo docker compose up -d`
(the backend dumps room state on shutdown and reloads it, so a restart costs
players a reconnect, not their game). Data lives in `~/shengji/data/`
(SQLite plus the room dump). Backup:
`sudo docker compose exec shengji sqlite3 /data/shengji.db '.backup /data/backup.db'`,
then copy `~/shengji/data/backup.db` off the machine.

Google Cloud instead: same VM steps. In the console pick e2-micro in
us-west1, us-central1 or us-east1, boot disk type *Standard* persistent disk
(30 GB or less), tick Allow HTTP and HTTPS traffic, and reserve the external
IP under VPC network → IP addresses. Its Ubuntu image has no iptables rules
to fix, and the IP is billed as noted above.

## 2. Environment variables (any host)

| Var | Meaning | Default |
|---|---|---|
| `DATABASE_PATH` | SQLite file | `./shengji.db` |
| `SESSION_TTL_DAYS` | sign-in token lifetime | `180` |
| `GOOGLE_CLIENT_ID` | OAuth web client ID; nobody can sign in without it (or `DEV_LOGIN`) | unset |
| `DEV_LOGIN` | `1` enables `POST /api/auth/dev_login` (any username, no password). Local testing only. | unset |
| `CORS_ALLOWED_ORIGINS` | comma list of frontend origins | localhost dev origins |
| `TRUST_PROXY_HEADERS` | `1` to read `Fly-Client-IP` for rate limiting | unset |
| `STATIC_DIR` | directory of built frontend to serve at `/` | unset |
| `DUMP_PATH`, `MESSAGE_PATH` | room-state dump / header messages files | `/tmp/...` |
| `PORT` | listen port | `3030` |

The binary does not terminate TLS; put it behind Fly, Caddy, nginx, etc.

## 3. Frontend to GitHub Pages

```sh
./scripts/build_shengji.sh          # or --check to run tests/lints first
git add shengji
git commit -m "rebuild shengji"
git push
```

`shengji/` is plain static output, including `shengji/runtime.js`, which is
regenerated from `shengji-src/frontend/static/runtime.js` on every build
(Jekyll copies `shengji/` through untouched; `shengji-src/` is excluded from
the Jekyll build in `_config.yml`).

## 4. Local development

```sh
cd shengji-src/frontend && yarn watch                                  # rebuilds ../frontend/dist
cd shengji-src/backend && DEV_LOGIN=1 cargo run --features dynamic     # serves ../frontend/dist at :3030
open http://localhost:3030/
```

With the `dynamic` feature the backend serves the frontend itself, its own
`/runtime.js` sets `_API_HOST=""` (same origin), and the SQLite file is
`./shengji.db` in `backend/`. `DEV_LOGIN=1` adds a "dev sign-in" box to the
landing page: type any username and you are signed in as it (so you can be
several players at once in different browsers or private windows). To test
the real Google button locally, also set `GOOGLE_CLIENT_ID` and add
`http://localhost:3030` to the client's authorized JavaScript origins.

Tests and lints:

```sh
cd shengji-src && cargo test --all && cargo clippy --all -- -D warnings
cd shengji-src/frontend && yarn lint && yarn prettier --check && yarn test
```

Type sync after changing Rust message types:

```sh
cd shengji-src/frontend && yarn types
```

End-to-end smoke test (signs in through the dev login, joins a room over
the websocket and plays whole matches for every seat it controls; see
`tools/bot/README.md`). The backend must run with `DEV_LOGIN=1`:

```sh
cd shengji-src/tools/bot && npm install
node bot.js --host http://localhost:3030 --room 0123456789abcdef \
  --users alice,bob --room-type OneVsOne --matches 1 --first-to 3
node bot.js --host http://localhost:3030 --room fedcba9876543210 \
  --users carol,dave,erin,frank --room-type Standard --matches 1 --first-to 3
```

It cannot run against a real deployment (no dev login there); use it
locally. Note the account-creation rate limit (20 per hour per IP).
