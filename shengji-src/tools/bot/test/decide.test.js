import { test } from "node:test";
import assert from "node:assert/strict";
import { BIG_JOKER, SMALL_JOKER, UNKNOWN, makeCard } from "../cards.js";
import {
  BID_MIN_CARDS,
  applyBroadcast,
  chooseDiscard,
  chooseFriends,
  decide,
  decideDraw,
  decideExchange,
  decideInitialize,
  decidePlay,
  describeState,
  drawLandlord,
  gameOver,
  describeStandings,
  newContext,
  pendingSettings,
  pickBid,
  roundKey,
  suitFollow,
} from "../decide.js";

const H = (n) => makeCard("Hearts", n);
const S = (n) => makeCard("Spades", n);
const D = (n) => makeCard("Diamonds", n);
const C = (n) => makeCard("Clubs", n);

// ---------------------------------------------------------------------------
// Fixtures (shapes from frontend/src/gen-types.d.ts)

const PLAYERS = [
  { id: 0, name: "alice", level: "2", metalevel: 1 },
  { id: 1, name: "bob", level: "2", metalevel: 1 },
  { id: 2, name: "alice (2)", level: "2", metalevel: 1 },
  { id: 3, name: "bob (2)", level: "2", metalevel: 1 },
];

function propagated(over = {}) {
  return {
    players: PLAYERS,
    observers: [],
    landlord: null,
    max_player_id: 4,
    game_mode: "Tractor",
    round_key: "0123456789abcdef",
    num_games_finished: 0,
    kitty_theft_policy: "NoKittyTheft",
    first_landlord_selection_policy: "ByWinningBid",
    bid_policy: "JokerOrHigherSuit",
    bid_reinforcement_policy: "ReinforceWhileWinning",
    joker_bid_policy: "BothTwoOrMore",
    trick_draw_policy: "NoProtections",
    player_mode: "OneVsOne",
    rated: true,
    first_to_rank: "5",
    match_key: "",
    start_votes: [],
    ...over,
  };
}

/// hands: {playerId: [cards...]}; other players get redacted counts.
function hands(map, trump = null) {
  const out = {};
  for (const p of PLAYERS) out[String(p.id)] = {};
  for (const [pid, cards] of Object.entries(map)) {
    const h = {};
    for (const c of cards) h[c] = (h[c] ?? 0) + 1;
    out[String(pid)] = h;
  }
  return { hands: out, trump };
}

const TRUMP = { Standard: { suit: "♡", number: "2" } }; // hearts, 2s

function drawState(over = {}) {
  return {
    num_decks: 2,
    game_mode: "Tractor",
    deck: Array(50).fill(UNKNOWN),
    propagated: propagated(),
    hands: hands({ 0: [], 1: [], 2: [], 3: [] }),
    bids: [],
    autobid: null,
    position: 0,
    kitty: Array(8).fill(UNKNOWN),
    revealed_cards: 0,
    level: null,
    removed_cards: [],
    decks: [],
    player_requested_reset: null,
    ...over,
  };
}

function exchangeState(over = {}) {
  return {
    propagated: propagated({ landlord: 0 }),
    num_decks: 2,
    game_mode: "Tractor",
    hands: hands({ 0: [S("3"), S("5"), H("3"), D("A"), C("4")] }, TRUMP),
    kitty: [S("2"), D("7"), C("9"), C("10"), H("K"), D("3"), S("J"), S("Q")],
    kitty_size: 8,
    landlord: 0,
    trump: TRUMP,
    exchanger: 0,
    finalized: false,
    epoch: 1,
    bids: [{ id: 0, card: H("2"), count: 1, epoch: 0 }],
    autobid: null,
    removed_cards: [],
    decks: [],
    player_requested_reset: null,
    ...over,
  };
}

function trick(over = {}) {
  return {
    player_queue: [0, 1, 2, 3],
    played_cards: [],
    played_card_mappings: [],
    current_winner: null,
    trick_format: null,
    trump: TRUMP,
    bomb_policy: "NoBombs",
    ...over,
  };
}

function playState(over = {}) {
  return {
    num_decks: 2,
    game_mode: "Tractor",
    propagated: propagated({ landlord: 0 }),
    hands: hands(
      { 0: [S("3"), S("5"), H("3"), D("A"), C("4")], 1: Array(5).fill(UNKNOWN), 2: Array(5).fill(UNKNOWN), 3: Array(5).fill(UNKNOWN) },
      TRUMP,
    ),
    points: { 0: [], 1: [], 2: [], 3: [] },
    penalties: { 0: 0, 1: 0, 2: 0, 3: 0 },
    kitty: Array(8).fill(UNKNOWN),
    landlord: 0,
    landlords_team: [0, 2],
    exchanger: 0,
    trump: TRUMP,
    trick: trick(),
    last_trick: null,
    game_ended_early: false,
    removed_cards: [],
    decks: [],
    player_requested_reset: null,
    ...over,
  };
}

const alice = (over = {}) => newContext({ seats: [0, 2], isLeader: true, playerMode: "OneVsOne", ...over });
const bob = (over = {}) => newContext({ seats: [1, 3], isLeader: false, playerMode: "OneVsOne", ...over });

function fakeRpc(handlers = {}) {
  const calls = [];
  const rpc = async (type, body) => {
    calls.push({ type, body });
    if (!(type in handlers)) throw new Error(`unexpected rpc ${type}`);
    const h = handlers[type];
    return typeof h === "function" ? h(body) : h;
  };
  rpc.calls = calls;
  return rpc;
}

const labels = (actions) => actions.map((a) => a.label);

// ---------------------------------------------------------------------------
// Initialize

test("Initialize: the first round of a match needs every user's vote", () => {
  // num_games_finished === 0: the room is between matches, so every user
  // clicks start (one click covers both seats of a 1v1 user).
  const init = { propagated: propagated() };
  const a = decideInitialize(init, alice());
  assert.deepEqual(labels(a), ["StartGame (start vote)"]);
  assert.equal(a[0].seat, 0);
  assert.equal(a[0].action, "StartGame");
  const b = decideInitialize(init, bob());
  assert.deepEqual(labels(b), ["StartGame (start vote)"]);
  assert.equal(b[0].seat, 1);
});

test("Initialize: one vote per connection, however many other votes arrive", () => {
  // Every vote produces a State for everybody; seeing somebody else's vote
  // must not make this connection vote again.
  const a = alice();
  assert.deepEqual(labels(decideInitialize({ propagated: propagated() }, a)), [
    "StartGame (start vote)",
  ]);
  for (const votes of [[1], [1, 3], [1, 3]]) {
    assert.deepEqual(decideInitialize({ propagated: propagated({ start_votes: votes }) }, a), []);
  }
  // Once the server confirms our vote we stay quiet too.
  assert.deepEqual(
    decideInitialize({ propagated: propagated({ start_votes: [1, 3, 0, 2] }) }, a),
    [],
  );
  // ... but a cleared vote (any other lobby action) is sent again.
  assert.deepEqual(
    labels(decideInitialize({ propagated: propagated({ start_votes: [1] }) }, a)),
    ["StartGame (start vote)"],
  );
  // And so is a vote the server rejected.
  const again = alice();
  const sent = decideInitialize({ propagated: propagated() }, again);
  assert.deepEqual(decideInitialize({ propagated: propagated() }, again), []);
  sent[0].onError();
  assert.deepEqual(labels(decideInitialize({ propagated: propagated() }, again)), [
    "StartGame (start vote)",
  ]);
});

test("Initialize: a connection does not vote twice, and re-votes when its vote is cleared", () => {
  const voted = { propagated: propagated({ start_votes: [0, 2] }) };
  assert.deepEqual(decideInitialize(voted, alice()), []);
  assert.deepEqual(labels(decideInitialize(voted, bob())), ["StartGame (start vote)"]);
  // A settings action cleared everybody's votes: alice votes again.
  const cleared = { propagated: propagated({ start_votes: [] }) };
  assert.deepEqual(labels(decideInitialize(cleared, alice())), ["StartGame (start vote)"]);
  // Only this connection's own seats count.
  const others = { propagated: propagated({ start_votes: [1, 3] }) };
  assert.deepEqual(labels(decideInitialize(others, alice())), ["StartGame (start vote)"]);
});

test("Initialize: between rounds only one user starts the next round", () => {
  const init = { propagated: propagated({ num_games_finished: 1, landlord: 3, start_votes: [] }) };
  assert.deepEqual(decideInitialize(init, alice()), []);
  const acts = decideInitialize(init, bob());
  assert.deepEqual(labels(acts), ["StartGame"]);
  assert.equal(acts[0].seat, 3);
  // ... and start_votes are irrelevant mid-match: no re-voting by everyone.
  const voted = { propagated: propagated({ num_games_finished: 2, landlord: 3, start_votes: [0, 2] }) };
  assert.deepEqual(decideInitialize(voted, alice()), []);
  assert.deepEqual(labels(decideInitialize(voted, bob())), ["StartGame"]);
});

test("Initialize: between rounds without a landlord the leader starts", () => {
  const init = { propagated: propagated({ num_games_finished: 1, landlord: null }) };
  assert.deepEqual(labels(decideInitialize(init, alice())), ["StartGame"]);
  assert.deepEqual(decideInitialize(init, bob()), []);
});

test("Initialize: waits for 4 players, and for exactly 4 in 1v1", () => {
  const three = { propagated: propagated({ players: PLAYERS.slice(0, 3) }) };
  assert.deepEqual(decideInitialize(three, alice()), []);
  const five = { propagated: propagated({ players: [...PLAYERS, { id: 4, name: "eve", level: "2", metalevel: 1 }] }) };
  assert.deepEqual(decideInitialize(five, alice()), []);
  assert.deepEqual(labels(decideInitialize(five, alice({ playerMode: "Standard" }))), [
    "StartGame (start vote)",
  ]);
});

test("Initialize: nothing once the requested matches are done", () => {
  const init = { propagated: propagated() };
  assert.deepEqual(decideInitialize(init, alice({ matchesFinished: 1, matchesWanted: 1 })), []);
  assert.deepEqual(
    labels(decideInitialize(init, alice({ matchesFinished: 1, matchesWanted: 2 }))),
    ["StartGame (start vote)"],
  );
});

test("Initialize: nothing when this connection is only an observer", () => {
  const init = { propagated: propagated() };
  assert.deepEqual(decideInitialize(init, alice({ seats: [7, 8] })), []);
});

// --- settings before the start vote ---------------------------------------

test("pendingSettings only reports settings that actually differ", () => {
  const p = propagated({ first_to_rank: "5", rated: true });
  assert.deepEqual(pendingSettings(p, alice()), []); // firstToRank/rated null
  assert.deepEqual(
    pendingSettings(p, alice({ firstToRank: "5", rated: true })).map((x) => x.key),
    [],
  );
  assert.deepEqual(
    pendingSettings(p, alice({ firstToRank: "3", rated: false })).map((x) => x.action),
    [{ SetFirstToRank: "3" }, { SetRated: false }],
  );
});

test("Initialize: settings are sent before voting, by the leader, exactly once", () => {
  const init = { propagated: propagated({ first_to_rank: "5" }) };
  const a = alice({ firstToRank: "3" });
  // The leader sends the setting and nobody votes yet: any settings action
  // clears the start votes, so voting first would be wasted.
  const first = decideInitialize(init, a);
  assert.deepEqual(labels(first), ["SetFirstToRank 3"]);
  assert.deepEqual(first[0].action, { SetFirstToRank: "3" });
  // Re-evaluating the same (not yet updated) state does not resend it.
  assert.deepEqual(decideInitialize(init, a), []);
  // Non-leaders never send settings, and wait for the setting to land.
  assert.deepEqual(decideInitialize(init, bob({ firstToRank: "3" })), []);
  // Once the room has the setting everybody votes.
  const ready = { propagated: propagated({ first_to_rank: "3" }) };
  assert.deepEqual(labels(decideInitialize(ready, a)), ["StartGame (start vote)"]);
  assert.deepEqual(labels(decideInitialize(ready, bob({ firstToRank: "3" }))), [
    "StartGame (start vote)",
  ]);
});

test("Initialize: --unrated sends SetRated before voting", () => {
  const init = { propagated: propagated({ first_to_rank: "3", rated: true }) };
  const a = alice({ firstToRank: "3", rated: false });
  assert.deepEqual(labels(decideInitialize(init, a)), ["SetRated false"]);
  assert.deepEqual(decideInitialize(init, a), []);
  const ready = { propagated: propagated({ first_to_rank: "3", rated: false }) };
  assert.deepEqual(labels(decideInitialize(ready, a)), ["StartGame (start vote)"]);
});

test("Initialize: both settings go out together, and never mid-match", () => {
  const init = { propagated: propagated({ first_to_rank: "5", rated: true }) };
  const a = alice({ firstToRank: "3", rated: false });
  assert.deepEqual(labels(decideInitialize(init, a)), ["SetFirstToRank 3", "SetRated false"]);
  // Mid-match the settings are locked; the bot just starts the next round.
  const mid = { propagated: propagated({ num_games_finished: 1, landlord: 0, first_to_rank: "5" }) };
  assert.deepEqual(labels(decideInitialize(mid, alice({ firstToRank: "3", rated: false }))), [
    "StartGame",
  ]);
});

// --- broadcast counting ----------------------------------------------------

test("applyBroadcast counts rounds and matches", () => {
  const ctx = alice();
  assert.equal(applyBroadcast(ctx, null), null);
  assert.equal(applyBroadcast(ctx, { type: "TrickWon", winner: 0, points: 5 }), null);
  assert.deepEqual(applyBroadcast(ctx, { type: "MatchStarted", first_to_rank: "3" }), {
    kind: "match_started",
    first_to_rank: "3",
  });
  assert.deepEqual(applyBroadcast(ctx, { type: "StartVote", player: 0, votes: 2, needed: 4 }), {
    kind: "start_vote",
    player: 0,
    votes: 2,
    needed: 4,
  });
  assert.equal(applyBroadcast(ctx, { type: "GameEndedAutomatically" }).kind, "auto_end");

  const r1 = applyBroadcast(ctx, { type: "GameFinished", result: {} });
  assert.equal(r1.round, 1);
  assert.equal(ctx.roundsFinished, 1);
  assert.equal(ctx.matchesFinished, 0);
  applyBroadcast(ctx, { type: "GameFinished", result: {} });
  assert.equal(ctx.roundsFinished, 2);

  const standings = [
    { player: 0, name: "alice", rank: "3", levels: 1, winner: true },
    { player: 1, name: "bob", rank: "2", levels: 0, winner: false },
  ];
  const m = applyBroadcast(ctx, {
    type: "MatchFinished",
    match_key: "abc",
    first_to_rank: "3",
    standings,
  });
  assert.equal(m.kind, "match");
  assert.equal(m.match, 1);
  assert.equal(m.match_key, "abc");
  assert.deepEqual(m.standings, standings);
  assert.equal(ctx.matchesFinished, 1);
  // The round counter is per match.
  assert.equal(ctx.roundsFinished, 0);
  // A second match counts on top.
  applyBroadcast(ctx, { type: "MatchFinished", standings: [] });
  assert.equal(ctx.matchesFinished, 2);
});

test("describeStandings names the winner", () => {
  assert.equal(
    describeStandings([
      { player: 0, name: "alice", rank: "3", levels: 1, winner: true },
      { player: 1, name: "bob", rank: "2", levels: 0, winner: false },
    ]),
    "alice rank 3 (1 level) WINNER; bob rank 2 (0 levels)",
  );
  assert.equal(describeStandings(null), "");
});

// ---------------------------------------------------------------------------
// Draw

test("Draw: draws when it is one of my seats' turn", async () => {
  const rpc = fakeRpc();
  const a = await decideDraw(drawState({ position: 2 }), alice(), rpc);
  assert.deepEqual(labels(a), ["DrawCard"]);
  assert.equal(a[0].seat, 2);
  assert.equal(a[0].quiet, true);
  assert.deepEqual(await decideDraw(drawState({ position: 1 }), alice(), rpc), []);
  assert.equal(rpc.calls.length, 0);
});

test("Draw: bids through FindValidBids once enough cards are in hand, once per hand size", async () => {
  const hand = [H("2"), S("3"), S("4"), D("9")];
  assert.equal(hand.length, BID_MIN_CARDS);
  const state = drawState({ position: 1, hands: hands({ 0: hand }) });
  const rpc = fakeRpc({
    FindValidBids: (body) => {
      assert.equal(body.id, 0);
      assert.equal(body.epoch, 0);
      assert.equal(body.num_decks, 2);
      assert.equal(body.bid_policy, "JokerOrHigherSuit");
      assert.deepEqual(body.players, PLAYERS);
      return { type: "FindValidBids", results: [{ id: 0, card: H("2"), count: 1, epoch: 0 }] };
    },
  });
  const ctx = alice();
  const a = await decideDraw(state, ctx, rpc);
  assert.deepEqual(labels(a), ["Bid 2♥ x1"]);
  assert.deepEqual(a[0].action, { Bid: [H("2"), 1] });
  assert.equal(a[0].seat, 0);
  // Same hand size again: no second RPC, no second bid.
  assert.deepEqual(await decideDraw(state, ctx, rpc), []);
  assert.equal(rpc.calls.length, 1);
});

test("Draw: does not bid when somebody already bid, or when the RPC finds nothing", async () => {
  const hand = [H("2"), S("3"), S("4"), D("9"), C("5"), C("6")];
  const withBid = drawState({ position: 1, hands: hands({ 0: hand }), bids: [{ id: 1, card: S("2"), count: 1, epoch: 0 }] });
  const rpc = fakeRpc({ FindValidBids: { type: "FindValidBids", results: [] } });
  assert.deepEqual(await decideDraw(withBid, alice(), rpc), []);
  assert.equal(rpc.calls.length, 0);
  const noBid = drawState({ position: 1, hands: hands({ 0: hand }) });
  assert.deepEqual(await decideDraw(noBid, alice(), rpc), []);
  assert.equal(rpc.calls.length, 1);
});

test("Draw: RPC failure is tolerated", async () => {
  const hand = [H("2"), S("3"), S("4"), D("9")];
  const rpc = async () => {
    throw new Error("boom");
  };
  const warnings = [];
  const a = await decideDraw(drawState({ position: 0, hands: hands({ 0: hand }) }), alice({ warn: (m) => warnings.push(m) }), rpc);
  assert.deepEqual(labels(a), ["DrawCard"]);
  assert.equal(warnings.length, 1);
});

test("pickBid prefers the cheapest suited bid", () => {
  const b = pickBid([
    { id: 0, card: SMALL_JOKER, count: 2 },
    { id: 0, card: H("2"), count: 2 },
    { id: 0, card: S("2"), count: 1 },
  ]);
  assert.equal(b.card, S("2"));
  assert.equal(pickBid([]), null);
});

test("drawLandlord follows the selection policy", () => {
  const bids = [
    { id: 1, card: S("2"), count: 1, epoch: 0 },
    { id: 3, card: H("2"), count: 2, epoch: 0 },
  ];
  assert.equal(drawLandlord(drawState({ bids })), 3);
  assert.equal(drawLandlord(drawState({ bids, propagated: propagated({ first_landlord_selection_policy: "ByFirstBid" }) })), 1);
  assert.equal(drawLandlord(drawState({ bids, propagated: propagated({ landlord: 2 }) })), 2);
  assert.equal(drawLandlord(drawState({ autobid: { id: 0, card: H("2"), count: 1, epoch: 0 } })), 0);
  assert.equal(drawLandlord(drawState()), null);
});

test("Draw: when the deck is empty the winning bidder picks up the kitty", async () => {
  const bids = [{ id: 3, card: H("2"), count: 1, epoch: 0 }];
  const state = drawState({ deck: [], bids });
  const rpc = fakeRpc();
  const b = await decideDraw(state, bob(), rpc);
  assert.deepEqual(labels(b), ["PickUpKitty"]);
  assert.equal(b[0].seat, 3);
  assert.deepEqual(await decideDraw(state, alice(), rpc), []);
});

test("Draw: deck empty, no bids, landlord set -> RevealCard (or PickUpKitty when NT)", async () => {
  const rpc = fakeRpc({ FindValidBids: { type: "FindValidBids", results: [] } });
  const state = drawState({ deck: [], propagated: propagated({ landlord: 2 }) });
  const a = await decideDraw(state, alice(), rpc);
  assert.deepEqual(labels(a), ["RevealCard"]);
  assert.equal(a[0].seat, 2);
  assert.deepEqual(await decideDraw(state, bob(), rpc), []);
  // Autobid appeared after a reveal: pick up.
  const revealed = drawState({ deck: [], propagated: propagated({ landlord: 2 }), revealed_cards: 1, autobid: { id: 2, card: S("7"), count: 1, epoch: 0 } });
  assert.deepEqual(labels(await decideDraw(revealed, alice(), rpc)), ["PickUpKitty"]);
  // A landlord playing NT cannot reveal and picks up directly.
  const nt = drawState({
    deck: [],
    propagated: propagated({ landlord: 2, players: PLAYERS.map((p) => (p.id === 2 ? { ...p, level: "NT" } : p)) }),
  });
  assert.deepEqual(labels(await decideDraw(nt, alice(), rpc)), ["PickUpKitty"]);
});

test("Draw: deck empty and no bids -> bid if the RPC finds one (instead of revealing)", async () => {
  const rpc = fakeRpc({ FindValidBids: { type: "FindValidBids", results: [{ id: 0, card: H("2"), count: 1, epoch: 0 }] } });
  const state = drawState({ deck: [], hands: hands({ 0: [H("2")] }), propagated: propagated({ landlord: 0 }) });
  const a = await decideDraw(state, alice(), rpc);
  assert.deepEqual(labels(a), ["Bid 2♥ x1"]);
});

// ---------------------------------------------------------------------------
// Exchange

test("chooseDiscard prefers low non-trump non-point cards", () => {
  assert.equal(chooseDiscard([H("3"), S("5"), S("3"), D("A")], TRUMP), S("3"));
  assert.equal(chooseDiscard([H("3"), S("5")], TRUMP), S("5"));
  assert.equal(chooseDiscard([H("3"), BIG_JOKER], TRUMP), H("3"));
  assert.equal(chooseDiscard([UNKNOWN], TRUMP), null);
});

test("Exchange: pick up the whole kitty, discard down to kitty_size, then BeginPlay", () => {
  const ctx = alice();
  const full = exchangeState();
  let a = decideExchange(full, ctx);
  assert.deepEqual(labels(a), [`MoveCardToHand 2♠`]);
  assert.deepEqual(a[0].action, { MoveCardToHand: S("2") });
  assert.equal(a[0].seat, 0);
  // Still picking up while cards remain in the kitty.
  a = decideExchange(exchangeState({ kitty: [S("Q")] }), ctx);
  assert.deepEqual(a[0].action, { MoveCardToHand: S("Q") });
  // Kitty empty: discard the lowest non-trump card.
  a = decideExchange(exchangeState({ kitty: [] }), ctx);
  assert.deepEqual(a[0].action, { MoveCardToKitty: S("3") });
  a = decideExchange(exchangeState({ kitty: [S("3"), S("5"), D("A"), C("4"), D("7"), C("9"), D("3")], hands: hands({ 0: [H("3"), S("J")] }, TRUMP) }), ctx);
  assert.deepEqual(a[0].action, { MoveCardToKitty: S("J") });
  // Kitty full again: the landlord begins play.
  a = decideExchange(exchangeState(), ctx);
  assert.deepEqual(labels(a), ["BeginPlay"]);
  assert.equal(a[0].seat, 0);
  assert.deepEqual(ctx.mem.exchange[roundKey(full.propagated)], { phase: "done" });
});

test("Exchange: a new round key starts the pick-up over", () => {
  const ctx = alice();
  decideExchange(exchangeState({ kitty: [] }), ctx); // -> discard phase
  const next = exchangeState({ propagated: propagated({ landlord: 0, round_key: "fedcba9876543210" }) });
  assert.deepEqual(labels(decideExchange(next, ctx)), [`MoveCardToHand 2♠`]);
});

test("Exchange: repeated errors during pick-up fall back to starting with the dealt kitty", () => {
  const ctx = alice({ consecutiveErrors: 3 });
  assert.deepEqual(labels(decideExchange(exchangeState(), ctx)), ["BeginPlay"]);
});

test("Exchange: hidden kitty is never picked up", () => {
  const ctx = alice();
  assert.deepEqual(labels(decideExchange(exchangeState({ kitty: Array(8).fill(UNKNOWN) }), ctx)), ["BeginPlay"]);
});

test("Exchange: nothing to do when neither the exchanger nor the landlord is mine", () => {
  assert.deepEqual(decideExchange(exchangeState(), bob()), []);
  assert.deepEqual(decideExchange(exchangeState({ kitty: [] }), bob()), []);
});

test("Exchange: with kitty theft the exchanger finalizes before the landlord begins play", () => {
  const ctx = alice();
  ctx.mem.exchange["0123456789abcdef"] = { phase: "done" };
  const theft = exchangeState({ propagated: propagated({ landlord: 0, kitty_theft_policy: "AllowKittyTheft" }) });
  assert.deepEqual(labels(decideExchange(theft, ctx)), ["PutDownKitty"]);
  const finalized = exchangeState({ propagated: theft.propagated, finalized: true });
  assert.deepEqual(labels(decideExchange(finalized, ctx)), ["BeginPlay"]);
});

test("Exchange: Finding Friends picks friends before BeginPlay", () => {
  const ctx = alice();
  ctx.mem.exchange["0123456789abcdef"] = { phase: "done" };
  const ff = exchangeState({ game_mode: { FindingFriends: { num_friends: 1, friends: [] } } });
  const a = decideExchange(ff, ctx);
  assert.equal(Object.keys(a[0].action)[0], "SetFriends");
  const friends = a[0].action.SetFriends;
  assert.equal(friends.length, 1);
  assert.deepEqual(friends[0], { card: S("Q"), initial_skip: 0 });
  const picked = exchangeState({ game_mode: { FindingFriends: { num_friends: 1, friends: [{ card: S("Q"), initial_skip: 0, skip: 0, player_id: null }] } } });
  assert.deepEqual(labels(decideExchange(picked, ctx)), ["BeginPlay"]);
});

test("chooseFriends avoids trump suit/number and uses distinct suits", () => {
  const f = chooseFriends(3, { Standard: { suit: "♤", number: "Q" } });
  assert.deepEqual(
    f.map((x) => x.card),
    [H("J"), D("J"), C("J")],
  );
});

// ---------------------------------------------------------------------------
// Play

test("gameOver", () => {
  assert.equal(gameOver(playState()), false);
  assert.equal(gameOver(playState({ game_ended_early: true })), true);
  const empty = playState({ hands: hands({ 0: [], 1: [], 2: [], 3: [] }, TRUMP) });
  assert.equal(gameOver(empty), true);
  assert.equal(gameOver({ ...empty, trick: trick({ played_cards: [{ id: 0, cards: [S("3")], bad_throw_cards: [], better_player: null }] }) }), false);
});

test("Play: at the end of the game the landlord's connection sends StartNewGame", async () => {
  const done = playState({ hands: hands({ 0: [], 1: [], 2: [], 3: [] }, TRUMP), trick: trick({ player_queue: [] }) });
  const a = await decidePlay(done, alice(), fakeRpc());
  assert.deepEqual(labels(a), ["StartNewGame"]);
  assert.equal(a[0].seat, 0);
  assert.deepEqual(await decidePlay(done, bob(), fakeRpc()), []);
});

test("Play: a full trick is ended by the connection that played last", async () => {
  const played = [0, 1, 2, 3].map((id) => ({ id, cards: [UNKNOWN], bad_throw_cards: [], better_player: null }));
  const full = playState({ trick: trick({ player_queue: [], played_cards: played, current_winner: 1 }) });
  const b = await decidePlay(full, bob(), fakeRpc());
  assert.deepEqual(labels(b), ["EndTrick"]);
  assert.equal(b[0].seat, 3);
  assert.deepEqual(await decidePlay(full, alice(), fakeRpc()), []);
});

test("Play: leads a single low non-trump card", async () => {
  const rpc = fakeRpc();
  const a = await decidePlay(playState(), alice(), rpc);
  assert.deepEqual(a[0].action, { PlayCards: [S("3")] });
  assert.equal(a[0].seat, 0);
  assert.equal(a[0].label, "PlayCards 3♠");
  assert.equal(rpc.calls.length, 0);
  assert.deepEqual(await decidePlay(playState(), bob(), rpc), []);
});

test("Play: follows using DecomposeTrickFormat, validated with CanPlayCards", async () => {
  const format = { suit: "Spades", trump: TRUMP, units: [{ Repeated: { card: { card: S("9"), trump: TRUMP }, count: 1 } }] };
  const state = playState({
    trick: trick({
      player_queue: [2, 3, 0],
      played_cards: [{ id: 1, cards: [S("9")], bad_throw_cards: [], better_player: null }],
      trick_format: format,
      current_winner: 1,
    }),
    hands: hands({ 2: [S("3"), S("5"), H("3"), D("A"), C("4")] }, TRUMP),
  });
  const rpc = fakeRpc({
    DecomposeTrickFormat: (body) => {
      assert.equal(body.player_id, 2);
      assert.deepEqual(body.trick_format, format);
      assert.equal(body.trick_draw_policy, "NoProtections");
      return { type: "DecomposeTrickFormat", results: [{ format: [], description: "single", playable: [S("5")], more_than_one: true }] };
    },
    CanPlayCards: (body) => {
      assert.equal(body.id, 2);
      assert.deepEqual(body.trick, state.trick);
      return { type: "CanPlayCards", playable: true };
    },
  });
  const a = await decidePlay(state, alice(), rpc);
  assert.deepEqual(a[0].action, { PlayCards: [S("5")] });
  assert.equal(a[0].seat, 2);
  assert.match(a[0].label, /decompose/);
  assert.deepEqual(rpc.calls.map((c) => c.type), ["DecomposeTrickFormat", "CanPlayCards"]);
});

test("Play: falls back to following suit (padded) when nothing decomposes", async () => {
  const format = { suit: "Spades", trump: TRUMP, units: [{ Repeated: { card: { card: S("9"), trump: TRUMP }, count: 2 } }] };
  const state = playState({
    trick: trick({
      player_queue: [0, 2, 3],
      played_cards: [{ id: 1, cards: [S("9"), S("9")], bad_throw_cards: [], better_player: null }],
      trick_format: format,
    }),
    hands: hands({ 0: [H("3"), D("A"), C("4"), S("J")] }, TRUMP),
  });
  const rpc = fakeRpc({
    DecomposeTrickFormat: { type: "DecomposeTrickFormat", results: [{ format: [], description: "pair", playable: [], more_than_one: false }] },
    CanPlayCards: (body) => ({ type: "CanPlayCards", playable: body.cards.includes(S("J")) }),
  });
  const a = await decidePlay(state, alice(), rpc);
  // One spade (all I have) plus the lowest other card.
  assert.deepEqual(a[0].action, { PlayCards: [S("J"), C("4")] });
  assert.match(a[0].label, /follow suit/);
});

test("Play: a rejected play is not repeated on retry", async () => {
  const format = { suit: "Spades", trump: TRUMP, units: [{ Repeated: { card: { card: S("9"), trump: TRUMP }, count: 1 } }] };
  const state = playState({
    trick: trick({ player_queue: [0], played_cards: [{ id: 1, cards: [S("9")], bad_throw_cards: [], better_player: null }], trick_format: format }),
    hands: hands({ 0: [S("3"), C("4")] }, TRUMP),
  });
  const rpc = fakeRpc({
    DecomposeTrickFormat: { type: "DecomposeTrickFormat", results: [{ format: [], description: "single", playable: [C("4")], more_than_one: false }] },
    CanPlayCards: async () => {
      throw new Error("rpc down");
    },
  });
  const ctx = alice({ warn: () => {} });
  const first = await decidePlay(state, ctx, rpc);
  assert.deepEqual(first[0].action, { PlayCards: [C("4")] });
  first[0].onError();
  const second = await decidePlay(state, ctx, rpc);
  assert.deepEqual(second[0].action, { PlayCards: [S("3")] });
});

test("suitFollow pads with the lowest other cards", () => {
  assert.deepEqual(suitFollow([H("3"), D("A"), S("J"), S("4"), C("4")], 3, TRUMP, "Spades"), [S("4"), S("J"), C("4")]);
  assert.deepEqual(suitFollow([H("3"), D("A")], 1, TRUMP, "Spades"), [D("A")]);
});

// ---------------------------------------------------------------------------

test("decide dispatches on the phase and describeState is readable", async () => {
  const rpc = fakeRpc();
  assert.deepEqual(labels(await decide({ Initialize: { propagated: propagated() } }, alice(), rpc)), [
    "StartGame (start vote)",
  ]);
  assert.deepEqual(labels(await decide({ Draw: drawState() }, alice(), rpc)), ["DrawCard"]);
  assert.deepEqual(labels(await decide({ Exchange: exchangeState() }, alice(), rpc)), ["MoveCardToHand 2♠"]);
  assert.deepEqual(labels(await decide({ Play: playState() }, alice(), rpc)), ["PlayCards 3♠"]);
  assert.deepEqual(await decide({ Bogus: {} }, alice(), rpc), []);
  assert.match(
    describeState({ Initialize: { propagated: propagated({ start_votes: [0, 2] }) } }, alice()),
    /^Initialize: 4 players .*num_games_finished=0, first_to_rank=5, rated=true, start_votes=\[0,2\]$/,
  );
  assert.match(describeState({ Draw: drawState() }, alice()), /^Draw: 50 in deck/);
  assert.match(describeState({ Play: playState() }, alice()), /^Play: queue=\[0,1,2,3\]/);
  assert.equal(describeState(null, alice()), "no state");
});
