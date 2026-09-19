// Decision logic: given the latest redacted `GameState` for a connection and
// the seats it controls, decide which actions to send. Everything here is
// free of I/O except for the injected `rpc(type, body)` function (a POST to
// /api/rpc), so it can be unit tested with hand-written fixtures.
//
// Every decision returns an array of
//   { seat: <player id>, action: <Action>, label: "human readable" }
// The caller wraps `action` as {"Action": ...} (Standard rooms) or
// {"ActionAs": [seat, ...]} (1v1 rooms).

import {
  UNKNOWN,
  cardLabel,
  cardsLabel,
  effectiveSuit,
  handCards,
  handSize,
  isJoker,
  makeCard,
  minusCards,
  parseCard,
  parseTrump,
  points,
  sortCards,
} from "./cards.js";

/// Try to bid once this many cards are in hand ...
export const BID_MIN_CARDS = 4;
/// ... and again every time this many more cards have been drawn.
export const BID_EVERY = 3;
/// After this many consecutive server errors in a phase, fall back to a
/// simpler strategy (e.g. stop trying to pick up the kitty).
export const ERROR_FALLBACK_AFTER = 3;

/// A per-connection, mutable scratchpad for the decision functions.
export function newMemory() {
  return {
    bidTried: {}, // "<round>:<seat>" -> hand size at the last bid attempt
    exchange: {}, // "<round>" -> { phase: "pickup" | "discard" | "done" }
    failedPlays: {}, // "<trick key>" -> Set of JSON card arrays rejected
    settings: {}, // "m<matchesFinished>" -> { firstToRank: true, rated: true }
    startVote: {}, // "m<matchesFinished>" -> { sent, seen, lastVotes }
  };
}

/// Context passed to every decision:
///   seats:          player ids controlled by this connection
///   isLeader:       true for the first user (sends the room settings and
///                   starts later rounds when there is no landlord yet)
///   playerMode:     "Standard" | "OneVsOne"
///   matchesFinished / matchesWanted: to stop starting new matches
///   roundsFinished: rounds finished in the match currently being played
///   firstToRank:    desired `first_to_rank` ("3".."A"/"NT"), null to leave
///   rated:          desired `rated`, null to leave the room's setting alone
///   mem:            newMemory()
///   consecutiveErrors: server errors since the last State message
export function newContext(overrides = {}) {
  return {
    seats: [],
    isLeader: false,
    playerMode: "Standard",
    matchesFinished: 0,
    matchesWanted: 1,
    roundsFinished: 0,
    firstToRank: null,
    rated: null,
    mem: newMemory(),
    consecutiveErrors: 0,
    ...overrides,
  };
}

/// A key identifying the current round. `round_key` is minted by the
/// backend at StartGame; fall back to the finished-games counter.
export function roundKey(propagated) {
  if (propagated && typeof propagated.round_key === "string" && propagated.round_key) {
    return propagated.round_key;
  }
  return `g${propagated ? propagated.num_games_finished ?? 0 : 0}`;
}

function mine(ctx, pid) {
  return pid !== null && pid !== undefined && ctx.seats.includes(pid);
}

function act(seat, action, label) {
  return { seat, action, label: label ?? (typeof action === "string" ? action : JSON.stringify(action)) };
}

// ---------------------------------------------------------------------------
// Initialize

/// Whether a new match can still be started here.
export function matchInProgress(propagated) {
  return (propagated?.num_games_finished ?? 0) > 0;
}

/// The room settings the bot wants that the room does not have yet. Only
/// meaningful before the first round of a match: `SetRated` /
/// `SetFirstToRank` are refused once `num_games_finished > 0`, and any
/// settings action clears everybody's start votes, so they have to be sent
/// (once) *before* voting to start.
export function pendingSettings(propagated, ctx) {
  const out = [];
  const want = ctx.firstToRank;
  if (want !== null && want !== undefined && String(propagated.first_to_rank ?? "") !== String(want)) {
    out.push({
      key: "firstToRank",
      action: { SetFirstToRank: String(want) },
      label: `SetFirstToRank ${want}`,
    });
  }
  if (ctx.rated !== null && ctx.rated !== undefined && !!propagated.rated !== !!ctx.rated) {
    out.push({
      key: "rated",
      action: { SetRated: !!ctx.rated },
      label: `SetRated ${!!ctx.rated}`,
    });
  }
  return out;
}

export function decideInitialize(init, ctx) {
  const p = init.propagated;
  if (ctx.matchesFinished >= ctx.matchesWanted) return [];
  const n = (p.players || []).length;
  if (n < 4) return [];
  if (ctx.playerMode === "OneVsOne" && n !== 4) return [];
  const seat = ctx.seats.find((s) => p.players.some((pl) => pl.id === s));
  if (seat === undefined) return [];

  if (matchInProgress(p)) {
    // Between rounds of a match a single StartGame starts the next round.
    const landlord = p.landlord ?? null;
    if (landlord !== null && p.players.some((pl) => pl.id === landlord)) {
      // The landlord's connection starts (works for AllowLandlordOnly too).
      return mine(ctx, landlord) ? [act(landlord, "StartGame")] : [];
    }
    return ctx.isLeader ? [act(seat, "StartGame")] : [];
  }

  // The first round of a match: settings first, then one vote per user.
  const pending = pendingSettings(p, ctx);
  if (pending.length > 0) {
    if (!ctx.isLeader) return [];
    const sent = (ctx.mem.settings[`m${ctx.matchesFinished}`] ??= {});
    const todo = pending.filter((x) => !sent[x.key]);
    for (const x of todo) sent[x.key] = true;
    return todo.map((x) => act(seat, x.action, x.label));
  }
  // Every player has to click start; one click covers both seats of a 1v1
  // user, so each connection votes once. It re-votes if its vote was
  // cleared (any lobby action other than StartGame clears every vote), but
  // not merely because somebody else's vote arrived first: every vote
  // produces a State, so re-voting on each of those would send one start
  // per player per player.
  const votes = p.start_votes || [];
  const st = (ctx.mem.startVote[`m${ctx.matchesFinished}`] ??= {
    sent: false,
    seen: false,
    lastVotes: 0,
  });
  const cleared = votes.length === 0 && st.lastVotes > 0;
  st.lastVotes = votes.length;
  if (ctx.seats.some((s) => votes.includes(s))) {
    st.seen = true;
    st.sent = true;
    return [];
  }
  // Our vote is gone although the server had recorded it, or every vote was
  // dropped: vote again.
  if (st.seen || cleared) {
    st.seen = false;
    st.sent = false;
  }
  if (st.sent) return [];
  st.sent = true;
  const a = act(seat, "StartGame", "StartGame (start vote)");
  a.onError = () => {
    st.sent = false;
  };
  return [a];
}

/// Fold a `Broadcast`'s `data.variant` into the context's counters. Returns
/// a description of what happened (for logging) or null for variants the
/// bot does not care about.
export function applyBroadcast(ctx, variant) {
  if (!variant || typeof variant !== "object") return null;
  switch (variant.type) {
    case "GameFinished":
      ctx.roundsFinished += 1;
      return { kind: "round", round: ctx.roundsFinished, result: variant.result || {} };
    case "MatchFinished":
      ctx.matchesFinished += 1;
      ctx.roundsFinished = 0;
      return {
        kind: "match",
        match: ctx.matchesFinished,
        match_key: variant.match_key,
        first_to_rank: variant.first_to_rank,
        standings: variant.standings || [],
      };
    case "MatchStarted":
      return { kind: "match_started", first_to_rank: variant.first_to_rank };
    case "MatchAbandoned":
      return { kind: "match_abandoned" };
    case "StartVote":
      return {
        kind: "start_vote",
        player: variant.player,
        votes: variant.votes,
        needed: variant.needed,
      };
    case "GameEndedAutomatically":
      return { kind: "auto_end" };
    default:
      return null;
  }
}

/// One line per standing, e.g. "alice 3 (1 level) WINNER; bob 2 (0 levels)".
export function describeStandings(standings) {
  return (standings || [])
    .map((s) => `${s.name} rank ${s.rank} (${s.levels} level${s.levels === 1 ? "" : "s"})${s.winner ? " WINNER" : ""}`)
    .join("; ");
}

// ---------------------------------------------------------------------------
// Draw

/// Prefer the cheapest bid: lowest count, suited before jokers.
export function pickBid(results) {
  const sorted = [...results].sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    const ja = isJoker(a.card) ? 1 : 0;
    const jb = isJoker(b.card) ? 1 : 0;
    return ja - jb;
  });
  return sorted[0] ?? null;
}

/// Who will be landlord when the deck is empty, mirroring
/// DrawPhase::advance: the configured landlord, else the winning (last) or
/// first bid depending on first_landlord_selection_policy.
export function drawLandlord(draw) {
  const set = draw.propagated.landlord ?? null;
  if (set !== null) return set;
  if (draw.autobid) return draw.autobid.id;
  const bids = draw.bids || [];
  if (bids.length === 0) return null;
  const policy = draw.propagated.first_landlord_selection_policy || "ByWinningBid";
  return policy === "ByFirstBid" ? bids[0].id : bids[bids.length - 1].id;
}

export async function decideDraw(draw, ctx, rpc) {
  const actions = [];
  const players = draw.propagated.players;
  const deckLeft = draw.deck.length;
  const bids = draw.bids || [];
  const autobid = draw.autobid ?? null;
  const revealed = draw.revealed_cards || 0;

  if (deckLeft > 0) {
    const cur = players[draw.position]?.id;
    if (mine(ctx, cur)) actions.push({ ...act(cur, "DrawCard"), quiet: true });
  }

  // Bidding: only while nobody has bid (spec: "if there is no bid yet").
  let bidAction = null;
  if (bids.length === 0 && autobid === null && revealed === 0) {
    const rk = roundKey(draw.propagated);
    for (const seat of ctx.seats) {
      if (!players.some((p) => p.id === seat)) continue;
      const hand = handCards(draw.hands, seat);
      const key = `${rk}:${seat}`;
      const last = ctx.mem.bidTried[key] ?? -Infinity;
      const due =
        deckLeft === 0 ||
        (hand.length >= BID_MIN_CARDS && hand.length - last >= BID_EVERY);
      if (!due) continue;
      ctx.mem.bidTried[key] = hand.length;
      let results = [];
      try {
        const res = await rpc("FindValidBids", {
          id: seat,
          bids,
          hands: draw.hands,
          players,
          landlord: draw.propagated.landlord ?? null,
          epoch: 0,
          bid_policy: draw.propagated.bid_policy ?? "JokerOrHigherSuit",
          bid_reinforcement_policy:
            draw.propagated.bid_reinforcement_policy ?? "ReinforceWhileWinning",
          joker_bid_policy: draw.propagated.joker_bid_policy ?? "BothTwoOrMore",
          num_decks: draw.num_decks,
        });
        results = (res && res.results) || [];
      } catch (e) {
        ctx.warn?.(`FindValidBids failed: ${e.message}`);
      }
      const bid = pickBid(results);
      if (bid) {
        bidAction = act(
          seat,
          { Bid: [bid.card, bid.count] },
          `Bid ${cardLabel(bid.card)} x${bid.count}`,
        );
        actions.push(bidAction);
        break;
      }
    }
  }

  if (deckLeft === 0) {
    const landlordSet = draw.propagated.landlord ?? null;
    const landlord = drawLandlord(draw);
    if (bids.length === 0 && autobid === null) {
      // Nobody has bid. If a landlord is configured they can reveal cards
      // from the kitty (or pick up directly when playing NT). Otherwise
      // somebody has to bid (attempted above).
      if (landlordSet !== null && mine(ctx, landlordSet) && bidAction === null) {
        const level = players.find((p) => p.id === landlordSet)?.level;
        if (level === "NT") {
          actions.push(act(landlordSet, "PickUpKitty"));
        } else if (revealed < draw.kitty.length) {
          actions.push(act(landlordSet, "RevealCard"));
        }
      }
    } else if (landlord !== null && mine(ctx, landlord)) {
      actions.push(act(landlord, "PickUpKitty"));
    }
  }
  return actions;
}

// ---------------------------------------------------------------------------
// Exchange

/// Lowest non-trump, non-point card if any, else the lowest card.
export function chooseDiscard(hand, trump) {
  const known = hand.filter((c) => c !== UNKNOWN && parseCard(c));
  if (known.length === 0) return null;
  const sorted = sortCards(known, trump);
  const nonTrump = sorted.filter((c) => effectiveSuit(c, trump) !== "Trump");
  const noPoints = nonTrump.filter((c) => points(c) === 0);
  if (noPoints.length) return noPoints[0];
  if (nonTrump.length) return nonTrump[0];
  return sorted[0];
}

/// Friend cards for Finding Friends: a non-trump, non-point, non-highest
/// card per friend, each in a different non-trump suit.
export function chooseFriends(numFriends, trump) {
  const t = parseTrump(trump);
  const suits = ["Spades", "Hearts", "Diamonds", "Clubs"].filter((s) => s !== t.suit);
  const numbers = ["Q", "J", "9", "8", "7", "6", "4", "3", "2"].filter((n) => n !== t.number);
  const friends = [];
  let i = 0;
  while (friends.length < numFriends && i < suits.length * numbers.length) {
    const suit = suits[i % suits.length];
    const number = numbers[Math.floor(i / suits.length)];
    friends.push({ card: makeCard(suit, number), initial_skip: 0 });
    i++;
  }
  return friends;
}

export function decideExchange(ex, ctx) {
  const K = ex.kitty_size;
  const n = ex.kitty.length;
  const theft = ex.propagated.kitty_theft_policy === "AllowKittyTheft";
  const exchanger = ex.exchanger ?? ex.landlord;
  const landlord = ex.landlord;
  const rk = roundKey(ex.propagated);
  const st = (ctx.mem.exchange[rk] ??= { phase: "pickup" });

  if (mine(ctx, exchanger) && !ex.finalized) {
    if (st.phase === "pickup") {
      if (ctx.consecutiveErrors >= ERROR_FALLBACK_AFTER) {
        st.phase = "discard";
      } else if (n > 0 && ex.kitty[0] !== UNKNOWN && parseCard(ex.kitty[0])) {
        const card = ex.kitty[0];
        return [act(exchanger, { MoveCardToHand: card }, `MoveCardToHand ${cardLabel(card)}`)];
      } else {
        st.phase = "discard";
      }
    }
    if (st.phase === "discard") {
      if (n < K) {
        const card = chooseDiscard(handCards(ex.hands, exchanger), ex.trump);
        if (card) {
          return [act(exchanger, { MoveCardToKitty: card }, `MoveCardToKitty ${cardLabel(card)}`)];
        }
        return [];
      }
      st.phase = "done";
    }
    if (n !== K) return [];
    if (theft) return [act(exchanger, "PutDownKitty")];
  }

  if (!mine(ctx, landlord)) return [];
  if (n !== K) return [];
  if (theft && !ex.finalized && !ex.autobid) return [];
  if (ex.game_mode && ex.game_mode !== "Tractor" && ex.game_mode.FindingFriends) {
    const ff = ex.game_mode.FindingFriends;
    const want = ff.num_friends ?? 0;
    if ((ff.friends || []).length !== want) {
      const friends = chooseFriends(want, ex.trump);
      return [
        act(
          landlord,
          { SetFriends: friends },
          `SetFriends ${cardsLabel(friends.map((f) => f.card))}`,
        ),
      ];
    }
  }
  return [act(landlord, "BeginPlay")];
}

// ---------------------------------------------------------------------------
// Play

/// Lead a single card: the lowest non-point non-trump card, else the
/// lowest card. A single card is always a legal lead.
export function chooseLead(hand, trump) {
  return chooseDiscard(hand, trump);
}

/// Pad `chosen` up to `size` cards with the lowest remaining cards of the
/// hand, preferring cards of `suit`.
export function padPlay(chosen, hand, size, trump, suit) {
  const out = [...chosen].slice(0, size);
  let rest = sortCards(minusCards(hand, out), trump);
  if (suit) {
    const same = rest.filter((c) => effectiveSuit(c, trump) === suit);
    const other = rest.filter((c) => effectiveSuit(c, trump) !== suit);
    rest = [...same, ...other];
  }
  for (const c of rest) {
    if (out.length >= size) break;
    out.push(c);
  }
  return out;
}

/// "As many cards of the led suit as I have, padded with anything."
export function suitFollow(hand, size, trump, suit) {
  const same = sortCards(
    hand.filter((c) => effectiveSuit(c, trump) === suit),
    trump,
  );
  return padPlay(same.slice(0, size), hand, size, trump, suit);
}

export function gameOver(play) {
  if (play.game_ended_early) return true;
  const allEmpty = play.propagated.players.every((p) => handSize(play.hands, p.id) === 0);
  return allEmpty && play.trick.played_cards.length === 0;
}

function trickKey(play, me, hand) {
  return `${roundKey(play.propagated)}:${me}:${hand.length}`;
}

export async function decidePlay(play, ctx, rpc) {
  const trick = play.trick;
  const queue = trick.player_queue || [];
  const played = trick.played_cards || [];

  if (gameOver(play)) {
    return mine(ctx, play.landlord) ? [act(play.landlord, "StartNewGame")] : [];
  }

  if (queue.length === 0) {
    if (played.length > 0) {
      const last = played[played.length - 1].id;
      return mine(ctx, last) ? [act(last, "EndTrick")] : [];
    }
    return [];
  }

  const me = queue[0];
  if (!mine(ctx, me)) return [];
  const hand = handCards(play.hands, me).filter((c) => c !== UNKNOWN);
  if (hand.length === 0) return [];
  const trump = play.trump;

  if (played.length === 0) {
    const card = chooseLead(hand, trump);
    return [act(me, { PlayCards: [card] }, `PlayCards ${cardLabel(card)}`)];
  }

  const size = played[0].cards.length;
  const format = trick.trick_format ?? null;
  const suit = format ? format.suit : null;
  const policy = play.propagated.trick_draw_policy ?? "NoProtections";
  const candidates = [];
  const seen = new Set();
  const push = (cards, why) => {
    if (!cards || cards.length !== size) return;
    const k = JSON.stringify(cards);
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push({ cards, why });
  };

  // 1. The UI's "suggest a play": first decomposition with a playable set.
  if (format) {
    try {
      const res = await rpc("DecomposeTrickFormat", {
        trick_format: format,
        hands: play.hands,
        player_id: me,
        trick_draw_policy: policy,
      });
      const results = (res && res.results) || [];
      const best = results.find((r) => r.playable && r.playable.length > 0);
      if (best) {
        push(padPlay(best.playable, hand, size, trump, suit), `decompose: ${best.description}`);
      }
    } catch (e) {
      ctx.warn?.(`DecomposeTrickFormat failed: ${e.message}`);
    }
  }
  // 2. Follow suit as far as possible, pad with anything.
  push(suitFollow(hand, size, trump, suit), "follow suit");
  // 3. Anything at all.
  push(sortCards(hand, trump).slice(0, size), "lowest cards");

  const failed = ctx.mem.failedPlays[trickKey(play, me, hand)] ?? new Set();
  const untried = candidates.filter((c) => !failed.has(JSON.stringify(c.cards)));
  const pool = untried.length ? untried : candidates;

  // Validate with the backend when possible; otherwise trust the order.
  let choice = null;
  for (const c of pool) {
    let ok = null;
    try {
      const res = await rpc("CanPlayCards", {
        trick,
        id: me,
        hands: play.hands,
        cards: c.cards,
        trick_draw_policy: policy,
        compound_formats: play.propagated.compound_formats ?? {},
      });
      ok = !!(res && res.playable);
    } catch (e) {
      ctx.warn?.(`CanPlayCards failed: ${e.message}`);
      ok = null;
    }
    if (ok === null) {
      choice = choice ?? c;
      break;
    }
    if (ok) {
      choice = c;
      break;
    }
  }
  if (!choice) {
    choice = pool.find((c) => c.why === "follow suit") ?? pool[0];
  }
  const a = act(
    me,
    { PlayCards: choice.cards },
    `PlayCards ${cardsLabel(choice.cards)} (${choice.why})`,
  );
  // If the server rejects this play, remember it so the next attempt for
  // the same trick tries the next candidate.
  const key = trickKey(play, me, hand);
  const cards = choice.cards;
  a.onError = () => {
    (ctx.mem.failedPlays[key] ??= new Set()).add(JSON.stringify(cards));
  };
  return [a];
}

// ---------------------------------------------------------------------------

export function phaseOf(state) {
  if (!state || typeof state !== "object") return null;
  for (const k of ["Initialize", "Draw", "Exchange", "Play"]) {
    if (k in state) return k;
  }
  return null;
}

/// Dispatch on the phase. `rpc(type, body)` posts to /api/rpc.
export async function decide(state, ctx, rpc) {
  switch (phaseOf(state)) {
    case "Initialize":
      return decideInitialize(state.Initialize, ctx);
    case "Draw":
      return decideDraw(state.Draw, ctx, rpc);
    case "Exchange":
      return decideExchange(state.Exchange, ctx);
    case "Play":
      return decidePlay(state.Play, ctx, rpc);
    default:
      return [];
  }
}

/// One-line description of what the connection is waiting for, for the
/// no-progress diagnostic.
export function describeState(state, ctx) {
  const phase = phaseOf(state);
  if (!phase) return "no state";
  const s = state[phase];
  const p = s.propagated;
  const names = (p.players || []).map((pl) => `${pl.name}#${pl.id}`).join(", ");
  switch (phase) {
    case "Initialize":
      return `Initialize: ${p.players.length} players [${names}], landlord=${p.landlord ?? "none"}, num_games_finished=${p.num_games_finished ?? 0}, first_to_rank=${p.first_to_rank ?? "?"}, rated=${p.rated}, start_votes=[${(p.start_votes || []).join(",")}]`;
    case "Draw":
      return `Draw: ${s.deck.length} in deck, position=${s.position} (id ${p.players[s.position]?.id}), bids=${(s.bids || []).length}, autobid=${s.autobid ? "yes" : "no"}, landlord=${drawLandlord(s) ?? "none"}, revealed=${s.revealed_cards || 0}`;
    case "Exchange":
      return `Exchange: kitty ${s.kitty.length}/${s.kitty_size}, exchanger=${s.exchanger}, landlord=${s.landlord}, finalized=${!!s.finalized}, mem=${JSON.stringify(ctx.mem.exchange[roundKey(p)] ?? null)}`;
    case "Play":
      return `Play: queue=[${(s.trick.player_queue || []).join(",")}], played=${(s.trick.played_cards || []).length}, hands=${p.players.map((pl) => handSize(s.hands, pl.id)).join("/")}, ended_early=${!!s.game_ended_early}`;
    default:
      return phase;
  }
}
