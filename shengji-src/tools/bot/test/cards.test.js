import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BIG_JOKER,
  SMALL_JOKER,
  UNKNOWN,
  cardLabel,
  cardOrder,
  effectiveSuit,
  handCards,
  handSize,
  makeCard,
  minusCards,
  parseCard,
  parseTrump,
  points,
  sortCards,
} from "../cards.js";

const H = (n) => makeCard("Hearts", n);
const S = (n) => makeCard("Spades", n);
const D = (n) => makeCard("Diamonds", n);
const C = (n) => makeCard("Clubs", n);

test("wire cards match the backend's code points", () => {
  // From mechanics/src/types.rs: S_A = 🂡, H_2 = 🂲, D_10 = 🃊, C_K = 🃞
  assert.equal(S("A"), "\u{1F0A1}");
  assert.equal(H("2"), "\u{1F0B2}");
  assert.equal(D("10"), "\u{1F0CA}");
  assert.equal(C("K"), "\u{1F0DE}");
  assert.equal(C("Q"), "\u{1F0DD}");
  assert.equal(C("J"), "\u{1F0DB}");
});

test("parseCard round trips and recognises jokers / unknown", () => {
  assert.deepEqual(parseCard(H("10")), { kind: "suited", suit: "Hearts", number: "10" });
  assert.deepEqual(parseCard(S("A")), { kind: "suited", suit: "Spades", number: "A" });
  assert.deepEqual(parseCard(SMALL_JOKER), { kind: "small_joker" });
  assert.deepEqual(parseCard(BIG_JOKER), { kind: "big_joker" });
  assert.deepEqual(parseCard(UNKNOWN), { kind: "unknown" });
  assert.equal(parseCard("x"), null);
  assert.equal(parseCard("\u{1F0AC}"), null); // the knight is not a card
});

test("cardLabel", () => {
  assert.equal(cardLabel(H("2")), "2♥");
  assert.equal(cardLabel(S("10")), "10♠");
  assert.equal(cardLabel(SMALL_JOKER), "LJ");
  assert.equal(cardLabel(BIG_JOKER), "HJ");
  assert.equal(cardLabel(UNKNOWN), "??");
});

test("parseTrump handles Standard and NoTrump", () => {
  assert.deepEqual(parseTrump({ Standard: { suit: "♡", number: "2" } }), {
    suit: "Hearts",
    number: "2",
  });
  assert.deepEqual(parseTrump({ NoTrump: { number: "5" } }), { suit: null, number: "5" });
  assert.deepEqual(parseTrump({ NoTrump: {} }), { suit: null, number: null });
});

test("effectiveSuit under a standard trump", () => {
  const trump = { Standard: { suit: "♡", number: "2" } };
  assert.equal(effectiveSuit(S("2"), trump), "Trump");
  assert.equal(effectiveSuit(H("3"), trump), "Trump");
  assert.equal(effectiveSuit(S("3"), trump), "Spades");
  assert.equal(effectiveSuit(C("K"), trump), "Clubs");
  assert.equal(effectiveSuit(BIG_JOKER, trump), "Trump");
  assert.equal(effectiveSuit(UNKNOWN, trump), "Unknown");
  const nt = { NoTrump: { number: "2" } };
  assert.equal(effectiveSuit(S("2"), nt), "Trump");
  assert.equal(effectiveSuit(S("3"), nt), "Spades");
});

test("sortCards puts non-trump before trump and jokers on top", () => {
  const trump = { Standard: { suit: "♡", number: "2" } };
  const sorted = sortCards([BIG_JOKER, H("3"), S("2"), S("A"), D("3"), H("2"), SMALL_JOKER], trump);
  assert.deepEqual(sorted, [D("3"), S("A"), H("3"), S("2"), H("2"), SMALL_JOKER, BIG_JOKER]);
  assert.ok(cardOrder(H("2"), trump) > cardOrder(S("2"), trump));
});

test("points", () => {
  assert.equal(points(H("5")), 5);
  assert.equal(points(H("10")), 10);
  assert.equal(points(H("K")), 10);
  assert.equal(points(H("A")), 0);
  assert.equal(points(BIG_JOKER), 0);
});

test("handCards / handSize / minusCards", () => {
  const hands = { hands: { 3: { [H("2")]: 2, [S("A")]: 1 }, 4: { [UNKNOWN]: 5 } }, trump: null };
  assert.deepEqual(handCards(hands, 3).sort(), [H("2"), H("2"), S("A")].sort());
  assert.equal(handSize(hands, 3), 3);
  assert.equal(handSize(hands, 4), 5);
  assert.deepEqual(handCards(hands, 9), []);
  assert.deepEqual(minusCards([H("2"), H("2"), S("A")], [H("2")]), [H("2"), S("A")]);
});
