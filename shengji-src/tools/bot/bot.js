#!/usr/bin/env node
// End-to-end test bot for the shengji backend.
//
//   node bot.js --host http://localhost:3030 --room 0123456789abcdef \
//     --users alice,bob --room-type OneVsOne --matches 1 --first-to 3
//
// For each user it signs in with the dev-login endpoint, opens a websocket
// to /api, joins the room and plays every seat the connection controls
// until --matches whole matches ("first to rank N") have finished, then
// prints the final standings, each user's ratings and statistics, and
// exits 0. Exits 1 if nothing happens for --timeout seconds, on auth
// failure, or if a connection is kicked / closed.

import process from "node:process";
import WebSocket from "ws";
import {
  applyBroadcast,
  decide,
  describeStandings,
  describeState,
  newContext,
  phaseOf,
} from "./decide.js";

// ---------------------------------------------------------------------------
// CLI

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error(`usage: node bot.js --host URL --room <16 hex> --users a,b[,c,d] [options]

  --host URL            backend origin, e.g. http://localhost:3030 (required)
  --room NAME           16 hex character room name (required)
  --users a,b           comma separated usernames: 2 for OneVsOne, 4 for Standard
  --room-type TYPE      OneVsOne (default) or Standard
  --matches N           whole matches to play before exiting (default 1)
  --first-to RANK       "first to rank N" match length, 3..A/NT (default 3);
                        --first-to keep leaves the room's own setting alone
  --unrated             make the room unrated (default: leave it rated)
  --timeout SECONDS     exit 1 after this long without a State change (default 120)
  --device-id-prefix P  device_id sent for each user is P + username (default "bot-");
                        use --no-device-id to omit it
  --verbose             also log DrawCard actions and every State

The backend must run with DEV_LOGIN=1 (POST /api/auth/dev_login).
`);
  process.exit(msg ? 2 : 0);
}

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "NT"];

export function parseArgs(argv) {
  const opts = {
    host: null,
    room: null,
    users: null,
    roomType: "OneVsOne",
    matches: 1,
    firstToRank: "3",
    rated: null,
    timeout: 120,
    deviceIdPrefix: "bot-",
    deviceId: true,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) usage(`${a} needs a value`);
      return argv[++i];
    };
    switch (a) {
      case "--host":
        opts.host = next();
        break;
      case "--room":
        opts.room = next();
        break;
      case "--users":
        opts.users = next()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "--room-type":
        opts.roomType = next();
        break;
      case "--matches":
        opts.matches = Number(next());
        break;
      case "--first-to":
        opts.firstToRank = next();
        break;
      case "--unrated":
        opts.rated = false;
        break;
      case "--timeout":
        opts.timeout = Number(next());
        break;
      case "--device-id-prefix":
        opts.deviceIdPrefix = next();
        break;
      case "--no-device-id":
        opts.deviceId = false;
        break;
      case "--verbose":
      case "-v":
        opts.verbose = true;
        break;
      case "--help":
      case "-h":
        usage();
        break;
      case "--rounds":
        usage("--rounds is gone: rounds are part of a match now, use --matches");
        break;
      case "--password":
        usage("--password is gone: sign-in uses POST /api/auth/dev_login");
        break;
      default:
        usage(`unknown argument ${a}`);
    }
  }
  if (!opts.host) usage("--host is required");
  if (!opts.room || !/^[0-9a-fA-F]{16}$/.test(opts.room)) {
    usage("--room must be 16 hex characters");
  }
  if (!opts.users || opts.users.length === 0) usage("--users is required");
  if (!["OneVsOne", "Standard"].includes(opts.roomType)) {
    usage("--room-type must be OneVsOne or Standard");
  }
  // Fewer users than seats is allowed: the missing players are expected to
  // be humans joining the same room (e.g. one bot user vs. you in a browser).
  if (opts.roomType === "OneVsOne" && opts.users.length > 2) {
    usage("OneVsOne rooms take at most 2 users");
  }
  if (opts.roomType === "Standard" && opts.users.length > 8) {
    usage("Standard rooms take at most 8 users here");
  }
  if (!Number.isInteger(opts.matches) || opts.matches < 1) usage("--matches must be >= 1");
  if (opts.firstToRank === "keep") {
    opts.firstToRank = null;
  } else if (!RANKS.includes(opts.firstToRank) || RANKS.indexOf(opts.firstToRank) < 1) {
    usage(`--first-to must be one of ${RANKS.slice(1).join(",")} (or "keep")`);
  }
  if (!(opts.timeout > 0)) usage("--timeout must be > 0");
  opts.host = opts.host.replace(/\/+$/, "");
  return opts;
}

// ---------------------------------------------------------------------------
// Logging

const t0 = Date.now();
function stamp() {
  return ((Date.now() - t0) / 1000).toFixed(2).padStart(7) + "s";
}
function log(line) {
  console.log(`${stamp()} ${line}`);
}
function loud(line) {
  console.log(`${stamp()} ${"=".repeat(8)} ${line}`);
}

// ---------------------------------------------------------------------------
// HTTP helpers

async function request(method, url, body, token) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers["authorization"] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`${method} ${url}: ${e.message}`);
  }
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text.length ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { ok: res.ok, status: res.status, body: parsed, text };
}

function errorText(r) {
  if (r.body && typeof r.body.error === "string") return r.body.error;
  return r.text ? r.text.slice(0, 200) : `HTTP ${r.status}`;
}

/// `POST /api/auth/dev_login {username, device_id}` -> `{token, user}`.
/// There is no register/login any more: accounts are created by Google
/// sign-in, or by this endpoint when the backend runs with DEV_LOGIN=1.
async function authenticate(opts, username) {
  const body = { username };
  if (opts.deviceId) body.device_id = `${opts.deviceIdPrefix}${username}`;
  const r = await request("POST", `${opts.host}/api/auth/dev_login`, body);
  if (r.ok && r.body && r.body.token) {
    log(`[${username}] signed in (id ${r.body.user?.id})`);
    return r.body;
  }
  if (r.status === 404) {
    throw new Error(
      `POST /api/auth/dev_login returned 404: the backend is not running with DEV_LOGIN=1 ` +
        `(start it as \`DEV_LOGIN=1 cargo run --features dynamic\`; there is no register/login endpoint any more)`,
    );
  }
  throw new Error(`dev_login failed for ${username}: ${r.status} ${errorText(r)}`);
}

async function fetchUser(opts, username) {
  const r = await request("GET", `${opts.host}/api/users/${encodeURIComponent(username)}`);
  if (!r.ok) throw new Error(`GET /api/users/${username}: ${r.status} ${errorText(r)}`);
  return r.body;
}

function makeRpc(opts) {
  return async (type, body) => {
    const r = await request("POST", `${opts.host}/api/rpc`, { type, ...body });
    if (!r.ok) throw new Error(`rpc ${type}: HTTP ${r.status} ${r.text.slice(0, 200)}`);
    if (!r.body || r.body.type === "Error") {
      throw new Error(`rpc ${type}: ${r.body ? JSON.stringify(r.body) : "empty response"}`);
    }
    return r.body;
  };
}

/// `RatingView` = {rating, matches, wins, losses, draws}.
function ratingView(r) {
  if (!r) return "n/a";
  return `${r.rating} (${r.matches}m ${r.wins}w-${r.losses}l-${r.draws}d)`;
}

/// The lines printed per user at the end: ratings, lifetime stats and the
/// most recent entry of `recent_matches` (`GET /api/users/<username>`).
export function profileLines(username, user) {
  const out = [];
  const rt = user.ratings || {};
  out.push(`${username}: team ${ratingView(rt.team)} | 1v1 ${ratingView(rt["1v1"])}`);
  const s = user.stats || {};
  out.push(
    `  stats: rounds ${s.rounds} (${s.rounds_won} won), landlord ${s.landlord_wins}/${s.landlord_rounds}, ` +
      `defender ${s.defender_wins}/${s.defender_rounds}, levels +${s.levels_gained}, ` +
      `matches ${s.matches} (${s.matches_won}w ${s.matches_lost}l ${s.matches_drawn}d, ${s.rated_matches} rated)`,
  );
  const m = (user.recent_matches || [])[0];
  if (!m) {
    out.push("  last match: none");
    return out;
  }
  const players = (m.players || [])
    .map((p) => `${p.username} ${p.levels}L${p.result === "won" ? " (won)" : ""}`)
    .join(", ");
  const rating =
    m.rating_before !== null && m.rating_before !== undefined && m.rating_after !== null
      ? `${m.rating_before} -> ${m.rating_after} (${m.delta >= 0 ? "+" : ""}${m.delta})`
      : "no rating change";
  out.push(
    `  last match: #${m.match_id} ${m.mode} ${m.rated ? "rated" : "unrated"}` +
      `${m.rating_applied ? "" : " (not applied)"} first-to-${m.first_to_rank} ` +
      `${m.rounds} round(s) -> ${m.result}, ${m.levels} level(s), ${rating} [${players}]`,
  );
  return out;
}

// ---------------------------------------------------------------------------
// One websocket per user

class Connection {
  constructor(bot, index, username, token) {
    this.bot = bot;
    this.index = index;
    this.username = username;
    this.token = token;
    this.ws = null;
    this.joined = false;
    this.seats = [];
    this.seatNames = [];
    this.playerMode = bot.opts.roomType;
    this.state = null;
    this.version = 0;
    this.actedVersion = -1;
    this.lastActions = [];
    this.lastActionAt = 0;
    this.evaluating = false;
    this.dirty = false;
    this.retryRequested = false;
    this.ctx = newContext({
      isLeader: index === 0,
      playerMode: bot.opts.roomType,
      matchesWanted: bot.opts.matches,
      firstToRank: bot.opts.firstToRank,
      rated: bot.opts.rated,
      warn: (m) => log(`[${username}] warning: ${m}`),
    });
    this.lastPhase = null;
    this.drawn = {};
    this.closedByUs = false;
  }

  tag(seat) {
    if (seat === undefined || this.seats.length <= 1) return `[${this.username}]`;
    const i = this.seats.indexOf(seat);
    return `[${this.username}#${i >= 0 ? i + 1 : "?"}]`;
  }

  connect() {
    const url =
      this.bot.opts.host.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/api";
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.on("open", () => {
        const join = {
          room_name: this.bot.opts.room,
          token: this.token,
          disable_compression: true,
          room_type: this.bot.opts.roomType,
        };
        if (this.bot.opts.deviceId) {
          join.device_id = `${this.bot.opts.deviceIdPrefix}${this.username}`;
        }
        ws.send(JSON.stringify(join));
        log(`[${this.username}] websocket open; sent JoinRoom (${this.bot.opts.roomType})`);
        resolve();
      });
      ws.on("message", (data) => this.onMessage(data));
      ws.on("error", (e) => {
        log(`[${this.username}] websocket error: ${e.message}`);
        reject(e);
      });
      ws.on("close", (code, reason) => {
        if (this.closedByUs || this.bot.finished) return;
        this.bot.fail(
          `[${this.username}] websocket closed (code ${code}${reason?.length ? `, ${reason}` : ""})`,
        );
      });
    });
  }

  onMessage(data) {
    const buf = Buffer.isBuffer(data)
      ? data
      : Array.isArray(data)
        ? Buffer.concat(data)
        : Buffer.from(data);
    let msg;
    try {
      msg = JSON.parse(buf.toString("utf8"));
    } catch {
      if (buf.length >= 4 && buf.readUInt32LE(0) === 0xfd2fb528) {
        this.bot.fail(
          `[${this.username}] received a zstd-compressed frame; the server ignored disable_compression`,
        );
      } else {
        log(`[${this.username}] unparseable frame (${buf.length} bytes): ${buf.toString("utf8").slice(0, 120)}`);
      }
      return;
    }
    if (!msg || typeof msg !== "object") return;
    const kind = Object.keys(msg)[0];
    const body = msg[kind];
    switch (kind) {
      case "Joined":
        this.joined = true;
        this.seats = body.player_ids || [];
        this.seatNames = body.names || [];
        this.playerMode = body.player_mode || this.playerMode;
        this.ctx.seats = this.seats;
        this.ctx.playerMode = this.playerMode;
        log(
          `[${this.username}] Joined as ${this.seatNames.map((n, i) => `${n} (id ${this.seats[i]})`).join(", ")} [${this.playerMode}]`,
        );
        this.actedVersion = -1;
        this.evaluate();
        break;
      case "State":
        this.onState(body.state);
        break;
      case "Error":
        this.onError(body);
        break;
      case "Broadcast":
        this.onBroadcast(body);
        break;
      case "Message":
        if (this.index === 0) log(`[chat] ${body.from}: ${body.message}`);
        break;
      case "System":
        loud(`[${this.username}] SYSTEM: ${body.message}`);
        if (this.index === 0) this.bot.onRatingNews(`System: ${body.message}`);
        break;
      case "MatchRated":
        this.onMatchRated(body);
        break;
      case "RoomRatings":
        if (this.index === 0) {
          const r = Object.entries(body.ratings || {})
            .map(([n, v]) => `${n} ${v.rating} (${v.matches}m)`)
            .join(", ");
          log(`[room] ratings (${body.mode}): ${r}`);
        }
        break;
      case "Kicked":
        this.bot.fail(`[${this.username}] Kicked (target ${body.target}); another session took the seat?`);
        break;
      case "Header":
      case "Beep":
      case "ReadyCheck":
        break;
      default:
        log(`[${this.username}] unknown message ${kind}: ${JSON.stringify(body).slice(0, 200)}`);
    }
  }

  onState(state) {
    this.state = state;
    this.version += 1;
    this.ctx.consecutiveErrors = 0;
    this.lastActions = [];
    this.bot.progress();
    const phase = phaseOf(state);
    if (!this.joined) this.deriveSeats(state);
    if (phase !== this.lastPhase) {
      if (this.index === 0) log(`[room] phase ${this.lastPhase ?? "-"} -> ${phase}: ${describeState(state, this.ctx)}`);
      if (phase === "Exchange" && this.index === 0) {
        const ex = state.Exchange;
        log(`[room] landlord=${ex.landlord} trump=${JSON.stringify(ex.trump)} kitty_size=${ex.kitty_size}`);
      }
      if (this.lastPhase === "Draw") {
        for (const [seat, n] of Object.entries(this.drawn)) {
          log(`${this.tag(Number(seat))} drew ${n} cards`);
        }
        this.drawn = {};
      }
      this.lastPhase = phase;
    }
    if (this.bot.opts.verbose) {
      log(`[${this.username}] State v${this.version} ${describeState(state, this.ctx)}`);
    }
    this.evaluate();
  }

  /// The first State can arrive before Joined; derive our seats by name.
  deriveSeats(state) {
    const phase = phaseOf(state);
    if (!phase) return;
    const p = state[phase].propagated;
    const all = [...(p.players || []), ...(p.observers || [])];
    const wanted = [this.username, `${this.username} (2)`];
    const seats = wanted.map((n) => all.find((pl) => pl.name === n)?.id).filter((id) => id !== undefined);
    if (seats.length > 0) {
      this.seats = seats;
      this.ctx.seats = seats;
      this.playerMode = p.player_mode || this.playerMode;
      this.ctx.playerMode = this.playerMode;
    }
  }

  onError(text) {
    log(`[${this.username}] ERROR: ${text}`);
    if (/not signed in/i.test(text)) {
      this.bot.fail(`[${this.username}] server rejected the token`);
      return;
    }
    this.ctx.consecutiveErrors += 1;
    for (const a of this.lastActions) a.onError?.();
    setTimeout(() => {
      this.retryRequested = true;
      this.evaluate();
    }, 500);
  }

  onBroadcast(body) {
    const variant = body.data?.variant;
    const info = applyBroadcast(this.ctx, variant);
    if (!info) {
      if (this.index === 0) log(`[room] ${body.message}`);
      return;
    }
    if (this.index !== 0) return;
    switch (info.kind) {
      case "round": {
        loud(`round ${info.round} of the match finished: ${body.message}`);
        const res = Object.entries(info.result)
          .map(([n, r]) => `${n}: ${r.won_game ? "won" : "lost"}${r.is_landlord ? " (landlord)" : r.is_defending ? " (defending)" : ""} +${r.ranks_up}`)
          .join("; ");
        log(`[room] ${res}`);
        break;
      }
      case "match":
        loud(
          `MATCH ${info.match}/${this.bot.opts.matches} FINISHED (first to ${info.first_to_rank}, key ${info.match_key}): ${describeStandings(info.standings)}`,
        );
        this.bot.onMatchFinished(info);
        break;
      case "match_started":
        loud(`match started: first to rank ${info.first_to_rank}`);
        break;
      case "match_abandoned":
        loud(`MATCH ABANDONED: ${body.message}`);
        break;
      case "start_vote":
        log(`[room] start vote ${info.votes}/${info.needed} (player ${info.player})`);
        break;
      case "auto_end":
        log(`[room] ${body.message}`);
        break;
      default:
        log(`[room] ${body.message}`);
    }
  }

  onMatchRated(body) {
    if (this.index !== 0) return;
    const changes = (body.changes || [])
      .map(
        (c) =>
          `${c.username} ${c.before} -> ${c.after} (${c.delta >= 0 ? "+" : ""}${c.delta}, ${c.levels} levels, score ${c.score.toFixed(3)})`,
      )
      .join("; ");
    loud(`MATCH RATED (match_id ${body.match_id}, mode ${body.mode}): ${changes}`);
    this.bot.onRatingNews("MatchRated");
  }

  wrap(seat, action) {
    if (this.playerMode === "OneVsOne") return { ActionAs: [seat, action] };
    return { Action: action };
  }

  send(a) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(this.wrap(a.seat, a.action)));
    if (a.action === "DrawCard") {
      this.drawn[a.seat] = (this.drawn[a.seat] ?? 0) + 1;
      if (!this.bot.opts.verbose) return;
    }
    log(`${this.tag(a.seat)} ${a.label}`);
  }

  async evaluate() {
    if (this.bot.finished) return;
    if (this.evaluating) {
      this.dirty = true;
      return;
    }
    this.evaluating = true;
    try {
      do {
        this.dirty = false;
        if (!this.state || this.seats.length === 0) break;
        if (this.version === this.actedVersion && !this.retryRequested) break;
        this.retryRequested = false;
        const state = this.state;
        const version = this.version;
        let actions = [];
        try {
          actions = await decide(state, this.ctx, this.bot.rpc);
        } catch (e) {
          log(`[${this.username}] decide failed: ${e.stack || e.message}`);
        }
        if (this.bot.finished) break;
        // Mark only the evaluated version as acted on: if a newer State
        // arrived while an RPC was in flight (e.g. the other seat's turn in
        // 1v1), `dirty` is set and the loop evaluates it next.
        this.actedVersion = version;
        if (actions.length) {
          this.lastActions = actions;
          this.lastActionAt = Date.now();
          for (const a of actions) this.send(a);
        }
      } while (this.dirty);
    } finally {
      this.evaluating = false;
    }
  }

  /// Safety net: if we sent something and nothing came back, try again.
  tick() {
    if (this.lastActions.length && Date.now() - this.lastActionAt > 3000) {
      this.lastActionAt = Date.now();
      this.retryRequested = true;
      this.evaluate();
    }
  }

  close() {
    this.closedByUs = true;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------

class Bot {
  constructor(opts) {
    this.opts = opts;
    this.rpc = makeRpc(opts);
    this.connections = [];
    this.finished = false;
    this.lastProgress = Date.now();
    this.ratingsPending = false;
    this.finishTimer = null;
    this.matchesFinished = 0;
    this.lastStandings = null;
  }

  progress() {
    this.lastProgress = Date.now();
  }

  fail(msg) {
    if (this.finished) return;
    this.finished = true;
    console.error(`${stamp()} FAILED: ${msg}`);
    for (const c of this.connections) {
      console.error(
        `  ${c.username}: phase=${phaseOf(c.state) ?? "none"} seats=[${c.seats.join(",")}] ` +
          `matches=${c.ctx.matchesFinished}/${this.opts.matches} rounds=${c.ctx.roundsFinished} ${describeState(c.state, c.ctx)}`,
      );
    }
    for (const c of this.connections) c.close();
    process.exit(1);
  }

  onMatchFinished(info) {
    this.matchesFinished = info.match;
    this.lastStandings = info.standings;
    if (this.matchesFinished < this.opts.matches) return;
    // Give the server a moment to publish MatchRated (or the System notice
    // saying why the match was not rated) before reading the ratings back.
    this.ratingsPending = true;
    const wait = this.opts.rated === false ? 1500 : 5000;
    this.finishTimer = setTimeout(
      () => this.finish(this.opts.rated === false ? "unrated room" : "no MatchRated within 5s"),
      wait,
    );
  }

  onRatingNews(why) {
    if (!this.ratingsPending) return;
    clearTimeout(this.finishTimer);
    setTimeout(() => this.finish(why), 300);
  }

  async finish(why) {
    if (this.finished) return;
    this.finished = true;
    log(`done: ${this.matchesFinished} match(es) played (${why})`);
    loud(`FINAL STANDINGS: ${describeStandings(this.lastStandings)}`);
    let code = 0;
    for (const u of this.opts.users) {
      try {
        const user = await fetchUser(this.opts, u);
        for (const line of profileLines(u, user)) loud(line);
      } catch (e) {
        console.error(`${stamp()} could not fetch ratings: ${e.message}`);
        code = 1;
      }
    }
    for (const c of this.connections) c.close();
    process.exit(code);
  }

  async run() {
    const sessions = [];
    for (const u of this.opts.users) {
      sessions.push(await authenticate(this.opts, u));
    }
    this.opts.users.forEach((u, i) => {
      this.connections.push(new Connection(this, i, u, sessions[i].token));
    });
    for (const c of this.connections) {
      await c.connect();
      // Let the first join create the room (and set its type) before the
      // others arrive.
      await new Promise((r) => setTimeout(r, 150));
    }
    setInterval(() => {
      if (this.finished) return;
      const idle = Date.now() - this.lastProgress;
      if (idle > this.opts.timeout * 1000) {
        this.fail(`no progress for ${Math.round(idle / 1000)}s`);
        return;
      }
      for (const c of this.connections) c.tick();
    }, 1000).unref();
    // Keep the process alive while sockets are open.
    await new Promise(() => {});
  }
}

const opts = parseArgs(process.argv.slice(2));
const bot = new Bot(opts);
process.on("unhandledRejection", (e) => bot.fail(`unhandled rejection: ${e?.stack || e}`));
bot.run().catch((e) => bot.fail(e.message));
