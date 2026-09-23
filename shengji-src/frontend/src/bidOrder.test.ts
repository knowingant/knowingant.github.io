import { orderBidsByArrival } from "./bidOrder";
import { Bid } from "./gen-types";

// Card glyphs as they appear in gen-types: 2 of hearts, 2 of spades, and the
// jokers. Spades sort before hearts by code point, which is what made a later
// 2♠ jump ahead of an earlier 2♥.
const TWO_HEARTS = "🂲";
const TWO_SPADES = "🂢";
const SMALL_JOKER = "🃟";
const BIG_JOKER = "🃏";

const bid = (card: string, count: number, epoch = 1): Bid => ({
  card,
  count,
  epoch,
  id: 0,
});

const cardsAndCounts = (bids: Bid[]): [string, number][] =>
  bids.map((b) => [b.card, b.count]);

describe("orderBidsByArrival", () => {
  it("appends a newly available option after the ones already shown", () => {
    const shown = orderBidsByArrival([], [bid(TWO_HEARTS, 1)]);
    const next = orderBidsByArrival(shown, [
      bid(TWO_SPADES, 1),
      bid(TWO_HEARTS, 1),
    ]);
    expect(cardsAndCounts(next)).toEqual([
      [TWO_HEARTS, 1],
      [TWO_SPADES, 1],
    ]);
  });

  it("appends a pair after the single of the same card", () => {
    let shown = orderBidsByArrival([], [bid(TWO_HEARTS, 1)]);
    shown = orderBidsByArrival(shown, [bid(TWO_SPADES, 1), bid(TWO_HEARTS, 1)]);
    shown = orderBidsByArrival(shown, [
      bid(TWO_SPADES, 1),
      bid(TWO_HEARTS, 1),
      bid(TWO_HEARTS, 2),
    ]);
    expect(cardsAndCounts(shown)).toEqual([
      [TWO_HEARTS, 1],
      [TWO_SPADES, 1],
      [TWO_HEARTS, 2],
    ]);
  });

  it("drops options that are no longer valid and keeps the rest in place", () => {
    const shown = [
      bid(TWO_HEARTS, 1),
      bid(TWO_SPADES, 1),
      bid(TWO_HEARTS, 2),
      bid(BIG_JOKER, 2),
    ];
    // Someone bid a pair of 2♣: only the pairs can still beat it.
    const next = orderBidsByArrival(shown, [
      bid(BIG_JOKER, 2),
      bid(TWO_HEARTS, 2),
    ]);
    expect(cardsAndCounts(next)).toEqual([
      [TWO_HEARTS, 2],
      [BIG_JOKER, 2],
    ]);
  });

  it("sorts options that arrive together by card, then count", () => {
    const next = orderBidsByArrival(
      [],
      [bid(TWO_HEARTS, 2), bid(SMALL_JOKER, 2), bid(TWO_HEARTS, 1)],
    );
    expect(cardsAndCounts(next)).toEqual([
      [TWO_HEARTS, 1],
      [TWO_HEARTS, 2],
      [SMALL_JOKER, 2],
    ]);
  });

  it("puts an option that comes back after being outbid at the end", () => {
    let shown = orderBidsByArrival([], [bid(TWO_HEARTS, 1)]);
    shown = orderBidsByArrival(shown, [bid(TWO_HEARTS, 1), bid(TWO_SPADES, 1)]);
    shown = orderBidsByArrival(shown, [bid(TWO_SPADES, 1)]);
    shown = orderBidsByArrival(shown, [bid(TWO_HEARTS, 1), bid(TWO_SPADES, 1)]);
    expect(cardsAndCounts(shown)).toEqual([
      [TWO_SPADES, 1],
      [TWO_HEARTS, 1],
    ]);
  });

  it("uses the latest bid objects and shows each option once", () => {
    const shown = [bid(TWO_HEARTS, 1, 1)];
    const next = orderBidsByArrival(shown, [
      bid(TWO_SPADES, 2, 2),
      bid(TWO_HEARTS, 1, 2),
      bid(TWO_SPADES, 2, 2),
    ]);
    expect(next).toEqual([bid(TWO_HEARTS, 1, 2), bid(TWO_SPADES, 2, 2)]);
  });
});
