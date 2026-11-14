import { cardLookup } from "../util/cardHelpers";
import { Trump } from "../gen-types";

/// Cards are drawn with the shared `Card` component, which wants a trump.
export const DDZ_TRUMP: Trump = { NoTrump: {} };

export const SMALL_JOKER = "🃟";
export const BIG_JOKER = "🃏";
export const UNKNOWN_CARD = "🂠";

const ORDER = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
];

/// 3 is lowest, then up to A, 2, small joker, big joker. Unknown cards: -1.
export const ddzRank = (card: string): number => {
  if (card === BIG_JOKER) {
    return 14;
  }
  if (card === SMALL_JOKER) {
    return 13;
  }
  const number = cardLookup[card]?.number;
  return number === null || number === undefined ? -1 : ORDER.indexOf(number);
};

/// Lowest first (highest first with `reverse`), suits in a fixed order
/// within a rank.
export const sortDdz = (cards: string[], reverse: boolean = false): string[] =>
  [...cards].sort(
    (a, b) =>
      (reverse ? ddzRank(b) - ddzRank(a) : ddzRank(a) - ddzRank(b)) ||
      a.localeCompare(b),
  );
