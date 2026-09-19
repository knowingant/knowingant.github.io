// Local model of the wire encoding of cards, suits and trump.
//
// The backend serialises a `Card` as a single Unicode playing-card character
// (U+1F0A1.. for spades, U+1F0B1.. hearts, U+1F0C1.. diamonds, U+1F0D1..
// clubs, plus the two jokers and U+1F0A0 for "unknown"/redacted), a `Suit`
// as one of ♤ ♡ ♢ ♧, a `Number` as "2".."10","J","Q","K","A" and a `Rank`
// as a Number or "NT". `Trump` is `{Standard: {suit, number}}` or
// `{NoTrump: {number}}` and `EffectiveSuit` is one of the strings below.
// See mechanics/src/types.rs.

export const UNKNOWN = "\u{1F0A0}";
export const SMALL_JOKER = "\u{1F0DF}";
export const BIG_JOKER = "\u{1F0CF}";

const SUIT_BASE = {
  Spades: 0x1f0a0,
  Hearts: 0x1f0b0,
  Diamonds: 0x1f0c0,
  Clubs: 0x1f0d0,
};

// Code point offset (within a suit block) -> number string.
const OFFSET_TO_NUMBER = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  13: "Q",
  14: "K",
};

const NUMBER_VALUE = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const SUIT_CHAR_TO_NAME = {
  "♤": "Spades", // ♤
  "♡": "Hearts", // ♡
  "♢": "Diamonds", // ♢
  "♧": "Clubs", // ♧
};

const SUIT_SYMBOL = {
  Spades: "♠",
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣",
};

/// Parse a wire card. Returns
///   {kind: "suited", suit: "Hearts", number: "10"}
///   {kind: "small_joker"} | {kind: "big_joker"} | {kind: "unknown"}
/// or null for anything that is not a card.
export function parseCard(card) {
  if (typeof card !== "string") return null;
  const cp = card.codePointAt(0);
  if (cp === undefined || [...card].length !== 1) return null;
  if (card === SMALL_JOKER) return { kind: "small_joker" };
  if (card === BIG_JOKER) return { kind: "big_joker" };
  if (card === UNKNOWN) return { kind: "unknown" };
  for (const [suit, base] of Object.entries(SUIT_BASE)) {
    const off = cp - base;
    if (off >= 1 && off <= 14 && OFFSET_TO_NUMBER[off] !== undefined) {
      return { kind: "suited", suit, number: OFFSET_TO_NUMBER[off] };
    }
  }
  return null;
}

/// Build a wire card from a suit name and a number string (used by tests
/// and by the friend selection heuristic).
export function makeCard(suit, number) {
  const base = SUIT_BASE[suit];
  const off = Object.entries(OFFSET_TO_NUMBER).find(([, n]) => n === number);
  if (base === undefined || off === undefined) {
    throw new Error(`bad card ${suit} ${number}`);
  }
  return String.fromCodePoint(base + Number(off[0]));
}

export function numberValue(number) {
  return NUMBER_VALUE[number] ?? 0;
}

export function isJoker(card) {
  return card === SMALL_JOKER || card === BIG_JOKER;
}

/// Points of a card (5, 10 or K), else 0.
export function points(card) {
  const p = parseCard(card);
  if (!p || p.kind !== "suited") return 0;
  if (p.number === "5") return 5;
  if (p.number === "10" || p.number === "K") return 10;
  return 0;
}

/// Human label such as "2♥", "10♠", "LJ", "HJ" or "??".
export function cardLabel(card) {
  const p = parseCard(card);
  if (!p) return String(card);
  switch (p.kind) {
    case "suited":
      return `${p.number}${SUIT_SYMBOL[p.suit]}`;
    case "small_joker":
      return "LJ";
    case "big_joker":
      return "HJ";
    default:
      return "??";
  }
}

export function cardsLabel(cards) {
  return cards.map(cardLabel).join(" ");
}

/// Normalise a wire `Trump` into {suit: "Hearts"|null, number: "2"|null}.
export function parseTrump(trump) {
  if (!trump || typeof trump !== "object") return { suit: null, number: null };
  if (trump.Standard) {
    const s = trump.Standard.suit;
    return {
      suit: SUIT_CHAR_TO_NAME[s] ?? (SUIT_BASE[s] !== undefined ? s : null),
      number: trump.Standard.number ?? null,
    };
  }
  if (trump.NoTrump) {
    return { suit: null, number: trump.NoTrump.number ?? null };
  }
  return { suit: null, number: null };
}

/// The effective suit of a card under `trump`, using the same strings as
/// the backend's `EffectiveSuit` ("Trump", "Spades", ..., "Unknown").
export function effectiveSuit(card, trump) {
  const p = parseCard(card);
  if (!p || p.kind === "unknown") return "Unknown";
  if (p.kind !== "suited") return "Trump";
  const t = parseTrump(trump);
  if (t.number !== null && p.number === t.number) return "Trump";
  if (t.suit !== null && p.suit === t.suit) return "Trump";
  return p.suit;
}

/// Sort key: lower is weaker. Non-trump cards sort by number; trump cards
/// come after all non-trump cards, in trump order.
export function cardOrder(card, trump) {
  const p = parseCard(card);
  if (!p || p.kind === "unknown") return -1;
  if (p.kind === "big_joker") return 1000;
  if (p.kind === "small_joker") return 999;
  const t = parseTrump(trump);
  const v = numberValue(p.number);
  if (t.number !== null && p.number === t.number) {
    // Trump-number cards: the one in the trump suit is highest.
    return t.suit !== null && p.suit === t.suit ? 998 : 997;
  }
  if (t.suit !== null && p.suit === t.suit) {
    return 900 + v;
  }
  return v;
}

/// Cards sorted weakest first (stable).
export function sortCards(cards, trump) {
  return [...cards]
    .map((c, i) => ({ c, i, k: cardOrder(c, trump) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.c);
}

/// Expand `Hands.hands[playerId]` ({card: count}) into a flat card array.
export function handCards(hands, playerId) {
  const h = hands && hands.hands ? hands.hands[String(playerId)] : undefined;
  if (!h) return [];
  const out = [];
  for (const [card, count] of Object.entries(h)) {
    for (let i = 0; i < count; i++) out.push(card);
  }
  return out;
}

export function handSize(hands, playerId) {
  const h = hands && hands.hands ? hands.hands[String(playerId)] : undefined;
  if (!h) return 0;
  return Object.values(h).reduce((a, b) => a + b, 0);
}

/// Remove the cards in `used` (with multiplicity) from `cards`.
export function minusCards(cards, used) {
  const counts = new Map();
  for (const c of used) counts.set(c, (counts.get(c) ?? 0) + 1);
  const out = [];
  for (const c of cards) {
    const n = counts.get(c) ?? 0;
    if (n > 0) counts.set(c, n - 1);
    else out.push(c);
  }
  return out;
}
