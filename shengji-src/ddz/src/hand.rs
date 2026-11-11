//! Hand types: what a set of cards is, and what beats what.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use shengji_mechanics::types::{Card, Number, Suit};

/// 3 is 0, ..., A is 11, 2 is 12, small joker 13, big joker 14.
pub const RANK_ACE: u8 = 11;
pub const RANK_TWO: u8 = 12;
pub const RANK_SMALL_JOKER: u8 = 13;
pub const RANK_BIG_JOKER: u8 = 14;
const NUM_RANKS: usize = 15;

pub fn rank(card: Card) -> Option<u8> {
    match card {
        Card::Unknown => None,
        Card::SmallJoker => Some(RANK_SMALL_JOKER),
        Card::BigJoker => Some(RANK_BIG_JOKER),
        Card::Suited { number, .. } => Some(match number {
            Number::Three => 0,
            Number::Four => 1,
            Number::Five => 2,
            Number::Six => 3,
            Number::Seven => 4,
            Number::Eight => 5,
            Number::Nine => 6,
            Number::Ten => 7,
            Number::Jack => 8,
            Number::Queen => 9,
            Number::King => 10,
            Number::Ace => 11,
            Number::Two => 12,
        }),
    }
}

fn suit_order(card: Card) -> u8 {
    match card {
        Card::Suited { suit, .. } => match suit {
            Suit::Spades => 3,
            Suit::Hearts => 2,
            Suit::Clubs => 1,
            Suit::Diamonds => 0,
        },
        _ => 0,
    }
}

/// Highest first; unknown cards last.
pub fn sort_hand(cards: &mut [Card]) {
    cards.sort_by_key(|c| {
        std::cmp::Reverse((rank(*c).map(|r| r as i16).unwrap_or(-1), suit_order(*c)))
    });
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzKind")]
pub enum Kind {
    Single,
    Pair,
    Triple,
    TripleSingle,
    TriplePair,
    Straight,
    PairStraight,
    Airplane,
    AirplaneSingles,
    AirplanePairs,
    FourTwoSingles,
    FourTwoPairs,
    Bomb,
    Rocket,
}

/// A classified set of cards.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzPlay")]
pub struct Play {
    pub kind: Kind,
    /// Rank of the body (the top rank of a sequence).
    pub rank: u8,
    /// Ranks in the body: straight length, number of pairs or triples.
    pub len: usize,
    /// Number of cards.
    pub size: usize,
}

fn counts(cards: &[Card]) -> Option<[u8; NUM_RANKS]> {
    let mut counts = [0u8; NUM_RANKS];
    for c in cards {
        counts[rank(*c)? as usize] += 1;
    }
    Some(counts)
}

/// Top ranks of every run of `len` consecutive ranks (3 to A) whose count
/// satisfies `ok`, highest first.
fn runs(counts: &[u8; NUM_RANKS], len: usize, ok: impl Fn(u8) -> bool) -> Vec<u8> {
    let mut out = vec![];
    if len == 0 || len > RANK_ACE as usize + 1 {
        return out;
    }
    for top in (len - 1..=RANK_ACE as usize).rev() {
        if (top + 1 - len..=top).all(|r| ok(counts[r])) {
            out.push(top as u8);
        }
    }
    out
}

/// Every way to read `cards` as one hand, preferred reading first. Empty if
/// the cards are not a hand.
pub fn interpretations(cards: &[Card]) -> Vec<Play> {
    let n = cards.len();
    let counts = match counts(cards) {
        Some(c) if n > 0 => c,
        _ => return vec![],
    };
    let with = |k: u8| -> Vec<u8> {
        (0..NUM_RANKS as u8)
            .rev()
            .filter(|r| counts[*r as usize] == k)
            .collect()
    };
    let (singles, pairs, triples, quads) = (with(1), with(2), with(3), with(4));
    let distinct = singles.len() + pairs.len() + triples.len() + quads.len();
    let both_jokers =
        counts[RANK_SMALL_JOKER as usize] == 1 && counts[RANK_BIG_JOKER as usize] == 1;
    let mut out = vec![];
    let mut push = |kind, rank, len| {
        out.push(Play {
            kind,
            rank,
            len,
            size: n,
        })
    };

    if n == 2 && both_jokers {
        push(Kind::Rocket, RANK_BIG_JOKER, 1);
        return out;
    }
    if distinct == 1 {
        let r = (0..NUM_RANKS as u8)
            .find(|r| counts[*r as usize] > 0)
            .unwrap();
        let kind = match n {
            1 => Kind::Single,
            2 => Kind::Pair,
            3 => Kind::Triple,
            _ => Kind::Bomb,
        };
        push(kind, r, 1);
        return out;
    }
    if n >= 5 && singles.len() == n {
        if let Some(top) = runs(&counts, n, |c| c == 1).first() {
            push(Kind::Straight, *top, n);
        }
    }
    if n >= 6 && pairs.len() * 2 == n {
        if let Some(top) = runs(&counts, n / 2, |c| c == 2).first() {
            push(Kind::PairStraight, *top, n / 2);
        }
    }
    if n >= 6 && triples.len() * 3 == n {
        if let Some(top) = runs(&counts, n / 3, |c| c == 3).first() {
            push(Kind::Airplane, *top, n / 3);
        }
    }
    if n == 4 && triples.len() == 1 && singles.len() == 1 {
        push(Kind::TripleSingle, triples[0], 1);
    }
    if n == 5 && triples.len() == 1 && pairs.len() == 1 {
        push(Kind::TriplePair, triples[0], 1);
    }
    // Wings never share a rank with the body, so body ranks hold exactly
    // three cards; and the two jokers are never attached together.
    if n >= 8 && n.is_multiple_of(4) && !both_jokers {
        for top in runs(&counts, n / 4, |c| c == 3) {
            push(Kind::AirplaneSingles, top, n / 4);
        }
    }
    if n >= 10 && n.is_multiple_of(5) {
        let k = n / 5;
        for top in runs(&counts, k, |c| c == 3) {
            let body = top as usize + 1 - k..=top as usize;
            let wings_ok = (0..NUM_RANKS).all(|r| {
                body.contains(&r)
                    || counts[r] == 0
                    || ((counts[r] == 2 || counts[r] == 4) && r < RANK_SMALL_JOKER as usize)
            });
            if wings_ok {
                push(Kind::AirplanePairs, top, k);
            }
        }
    }
    if n == 6 && quads.len() == 1 && !both_jokers {
        push(Kind::FourTwoSingles, quads[0], 1);
    }
    if n == 8 {
        for q in &quads {
            let wings_ok = (0..NUM_RANKS).all(|r| {
                r == *q as usize
                    || counts[r] == 0
                    || ((counts[r] == 2 || counts[r] == 4) && r < RANK_SMALL_JOKER as usize)
            });
            if wings_ok {
                push(Kind::FourTwoPairs, *q, 1);
            }
        }
    }
    out
}

pub fn classify(cards: &[Card]) -> Option<Play> {
    interpretations(cards).into_iter().next()
}

pub fn beats(new: &Play, old: &Play) -> bool {
    match (new.kind, old.kind) {
        (Kind::Rocket, _) => true,
        (_, Kind::Rocket) => false,
        (Kind::Bomb, Kind::Bomb) => new.rank > old.rank,
        (Kind::Bomb, _) => true,
        (_, Kind::Bomb) => false,
        _ => {
            new.kind == old.kind
                && new.len == old.len
                && new.size == old.size
                && new.rank > old.rank
        }
    }
}

/// The reading of `cards` that may be played now: any hand on a lead, one
/// that beats `last` otherwise.
pub fn playable(cards: &[Card], last: Option<&Play>) -> Option<Play> {
    let all = interpretations(cards);
    match last {
        None => all.into_iter().next(),
        Some(last) => all.into_iter().find(|p| beats(p, last)),
    }
}

/// Plays available from `hand`, simplest first. Not exhaustive (wings are
/// always the lowest spare cards); used by the test bot.
pub fn suggestions(hand: &[Card], last: Option<&Play>) -> Vec<Vec<Card>> {
    let mut by_rank: Vec<Vec<Card>> = vec![vec![]; NUM_RANKS];
    for c in hand {
        if let Some(r) = rank(*c) {
            by_rank[r as usize].push(*c);
        }
    }
    let count = |r: usize| by_rank[r].len();
    let take = |r: usize, k: usize| by_rank[r][..k].to_vec();
    let run = |top: usize, len: usize, k: usize| -> Option<Vec<Card>> {
        if len == 0 || top > RANK_ACE as usize || top + 1 < len {
            return None;
        }
        let mut cards = vec![];
        for r in top + 1 - len..=top {
            if count(r) < k {
                return None;
            }
            cards.extend(take(r, k));
        }
        Some(cards)
    };
    // The `n` lowest spare groups of `k` cards outside the body, preferring
    // ranks that hold exactly `k`.
    let wings = |body: &[Card], n: usize, k: usize| -> Option<Vec<Card>> {
        let body_ranks: Vec<u8> = body.iter().filter_map(|c| rank(*c)).collect();
        let mut ranks: Vec<usize> = (0..NUM_RANKS)
            .filter(|r| !body_ranks.contains(&(*r as u8)) && count(*r) >= k)
            .filter(|r| k == 1 || *r < RANK_SMALL_JOKER as usize)
            .collect();
        ranks.sort_by_key(|r| (count(*r) != k, *r));
        if ranks.len() < n {
            return None;
        }
        Some(ranks[..n].iter().flat_map(|r| take(*r, k)).collect())
    };
    let with_wings = |body: Vec<Card>, n: usize, k: usize| -> Option<Vec<Card>> {
        let mut cards = body;
        let w = wings(&cards, n, k)?;
        cards.extend(w);
        Some(cards)
    };

    let mut out: Vec<Vec<Card>> = vec![];
    match last {
        None => {
            if classify(hand).is_some() {
                out.push(hand.to_vec());
            }
            let mut ranks: Vec<usize> = (0..NUM_RANKS).filter(|r| count(*r) > 0).collect();
            ranks.sort_by_key(|r| (count(*r) == 4, *r));
            for r in ranks {
                match count(r) {
                    1 => {
                        let straight = (5..=12).rev().find_map(|len| run(r + len - 1, len, 1));
                        out.extend(straight);
                        out.push(take(r, 1));
                    }
                    2 => {
                        let pairs = (3..=10).rev().find_map(|len| run(r + len - 1, len, 2));
                        out.extend(pairs);
                        out.push(take(r, 2));
                    }
                    3 => {
                        out.extend(with_wings(take(r, 3), 1, 1));
                        out.extend(with_wings(take(r, 3), 1, 2));
                        out.push(take(r, 3));
                    }
                    _ => out.push(take(r, 4)),
                }
            }
        }
        Some(last) => {
            let above = last.rank as usize + 1;
            match last.kind {
                Kind::Single | Kind::Pair | Kind::Triple => {
                    let k = last.size;
                    out.extend(
                        (above..NUM_RANKS)
                            .filter(|r| count(*r) >= k)
                            .map(|r| take(r, k)),
                    );
                }
                Kind::TripleSingle | Kind::TriplePair => {
                    let k = last.size - 3;
                    out.extend(
                        (above..=RANK_TWO as usize)
                            .filter(|r| count(*r) >= 3)
                            .filter_map(|r| with_wings(take(r, 3), 1, k)),
                    );
                }
                Kind::Straight | Kind::PairStraight | Kind::Airplane => {
                    let k = last.size / last.len;
                    out.extend((above..=RANK_ACE as usize).filter_map(|top| run(top, last.len, k)));
                }
                Kind::AirplaneSingles | Kind::AirplanePairs => {
                    let k = last.size / last.len - 3;
                    out.extend(
                        (above..=RANK_ACE as usize)
                            .filter_map(|top| run(top, last.len, 3))
                            .filter_map(|body| with_wings(body, last.len, k)),
                    );
                }
                Kind::FourTwoSingles | Kind::FourTwoPairs => {
                    let k = (last.size - 4) / 2;
                    out.extend(
                        (above..=RANK_TWO as usize)
                            .filter(|r| count(*r) == 4)
                            .filter_map(|r| with_wings(take(r, 4), 2, k)),
                    );
                }
                Kind::Bomb | Kind::Rocket => {}
            }
            if last.kind != Kind::Rocket {
                let floor = if last.kind == Kind::Bomb { above } else { 0 };
                out.extend(
                    (floor..=RANK_TWO as usize)
                        .filter(|r| count(*r) == 4)
                        .map(|r| take(r, 4)),
                );
                if count(RANK_SMALL_JOKER as usize) == 1 && count(RANK_BIG_JOKER as usize) == 1 {
                    let mut rocket = take(RANK_SMALL_JOKER as usize, 1);
                    rocket.extend(take(RANK_BIG_JOKER as usize, 1));
                    out.push(rocket);
                }
            }
        }
    }
    out.retain(|cards| playable(cards, last).is_some());
    out.dedup();
    out
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use shengji_mechanics::types::Suit;

    /// "3 3 10 J X D": ranks separated by spaces, X and D the small and big
    /// joker. Suits are handed out in order per rank.
    pub fn h(s: &str) -> Vec<Card> {
        let suits = [Suit::Spades, Suit::Hearts, Suit::Clubs, Suit::Diamonds];
        let mut seen = std::collections::HashMap::new();
        s.split_whitespace()
            .map(|t| {
                let number = match t {
                    "X" => return Card::SmallJoker,
                    "D" => return Card::BigJoker,
                    "2" => Number::Two,
                    "3" => Number::Three,
                    "4" => Number::Four,
                    "5" => Number::Five,
                    "6" => Number::Six,
                    "7" => Number::Seven,
                    "8" => Number::Eight,
                    "9" => Number::Nine,
                    "10" => Number::Ten,
                    "J" => Number::Jack,
                    "Q" => Number::Queen,
                    "K" => Number::King,
                    "A" => Number::Ace,
                    other => panic!("bad card {other}"),
                };
                let i = seen.entry(t.to_string()).or_insert(0usize);
                let suit = suits[*i];
                *i += 1;
                Card::Suited { suit, number }
            })
            .collect()
    }

    fn kind(s: &str) -> Option<(Kind, u8, usize)> {
        classify(&h(s)).map(|p| (p.kind, p.rank, p.len))
    }

    #[test]
    fn basic_kinds() {
        assert_eq!(kind("3"), Some((Kind::Single, 0, 1)));
        assert_eq!(kind("D"), Some((Kind::Single, 14, 1)));
        assert_eq!(kind("2 2"), Some((Kind::Pair, 12, 1)));
        assert_eq!(kind("K K K"), Some((Kind::Triple, 10, 1)));
        assert_eq!(kind("K K K K"), Some((Kind::Bomb, 10, 1)));
        assert_eq!(kind("X D"), Some((Kind::Rocket, 14, 1)));
        assert_eq!(kind("3 4"), None);
        assert_eq!(kind(""), None);
    }

    #[test]
    fn triples_with_wings() {
        assert_eq!(kind("7 7 7 3"), Some((Kind::TripleSingle, 4, 1)));
        assert_eq!(kind("7 7 7 D"), Some((Kind::TripleSingle, 4, 1)));
        assert_eq!(kind("2 2 2 3 3"), Some((Kind::TriplePair, 12, 1)));
        assert_eq!(kind("7 7 7 3 4"), None);
        assert_eq!(kind("7 7 7 X D"), None);
    }

    #[test]
    fn sequences() {
        assert_eq!(kind("3 4 5 6 7"), Some((Kind::Straight, 4, 5)));
        assert_eq!(
            kind("3 4 5 6 7 8 9 10 J Q K A"),
            Some((Kind::Straight, 11, 12))
        );
        assert_eq!(kind("3 4 5 6"), None);
        assert_eq!(kind("10 J Q K A 2"), None);
        assert_eq!(kind("J Q K A 2"), None);
        assert_eq!(kind("3 4 5 6 8"), None);
        assert_eq!(kind("3 3 4 4 5 5"), Some((Kind::PairStraight, 2, 3)));
        assert_eq!(kind("3 3 4 4"), None);
        assert_eq!(kind("K K A A 2 2"), None);
        assert_eq!(kind("3 3 3 4 4 4"), Some((Kind::Airplane, 1, 2)));
        assert_eq!(kind("A A A 2 2 2"), None);
        assert_eq!(kind("3 3 3 5 5 5"), None);
    }

    #[test]
    fn airplanes_with_wings() {
        assert_eq!(kind("3 3 3 4 4 4 9 J"), Some((Kind::AirplaneSingles, 1, 2)));
        // A pair as two single wings.
        assert_eq!(kind("3 3 3 4 4 4 9 9"), Some((Kind::AirplaneSingles, 1, 2)));
        assert_eq!(
            kind("3 3 3 4 4 4 9 9 J J"),
            Some((Kind::AirplanePairs, 1, 2))
        );
        // Wings can't share a rank with the body, or be both jokers.
        assert_eq!(kind("3 3 3 3 4 4 4 9"), None);
        assert_eq!(kind("3 3 3 4 4 4 X D"), None);
        assert_eq!(kind("3 3 3 4 4 4 9 9 J Q"), None);
        assert_eq!(kind("3 3 3 4 4 4 9 9 X D"), None);
        // Twelve cards: a plain airplane first, three with wings second.
        let all = interpretations(&h("3 3 3 4 4 4 5 5 5 6 6 6"));
        assert_eq!(all[0].kind, Kind::Airplane);
        assert_eq!(all[0].len, 4);
        assert!(all
            .iter()
            .all(|p| p.kind == Kind::Airplane || p.kind == Kind::AirplaneSingles));
        assert_eq!(
            kind("4 4 4 5 5 5 6 6 6 9 9 9"),
            Some((Kind::AirplaneSingles, 3, 3))
        );
    }

    #[test]
    fn four_with_two() {
        assert_eq!(kind("5 5 5 5 3 4"), Some((Kind::FourTwoSingles, 2, 1)));
        assert_eq!(kind("5 5 5 5 3 3"), Some((Kind::FourTwoSingles, 2, 1)));
        assert_eq!(kind("5 5 5 5 X D"), None);
        assert_eq!(kind("5 5 5 5 3 3 4 4"), Some((Kind::FourTwoPairs, 2, 1)));
        assert_eq!(kind("5 5 5 5 3 3 4 6"), None);
        assert_eq!(kind("5 5 5 5 3"), None);
    }

    fn b(new: &str, old: &str) -> bool {
        playable(&h(new), classify(&h(old)).as_ref()).is_some()
    }

    #[test]
    fn what_beats_what() {
        assert!(b("4", "3"));
        assert!(!b("3", "3"));
        assert!(b("D", "X"));
        assert!(b("2", "A"));
        assert!(!b("4 4", "3"));
        assert!(b("4 5 6 7 8", "3 4 5 6 7"));
        assert!(!b("4 5 6 7 8 9", "3 4 5 6 7"));
        assert!(b("8 8 8 3", "7 7 7 A"));
        assert!(!b("8 8 8 3 3", "7 7 7 A"));
        assert!(b("3 3 3 3", "2 2"));
        assert!(b("4 4 4 4", "3 3 3 3"));
        assert!(!b("3 3 3 3", "4 4 4 4"));
        assert!(b("X D", "2 2 2 2"));
        assert!(!b("2 2 2 2", "X D"));
        // Four with two is not a bomb.
        assert!(b("3 3 3 3", "A A A A 5 6"));
        assert!(!b("A A A A 5 6", "3 3 3 3"));
        assert!(b("6 6 6 6 3 4", "5 5 5 5 A K"));
        // Following three triples with wings using four triples.
        assert!(b("4 4 4 5 5 5 6 6 6 3 3 3", "3 3 3 4 4 4 5 5 5 7 8 9"));
    }

    #[test]
    fn suggestions_are_playable() {
        let hand = h("3 3 3 4 5 6 7 8 8 9 9 10 10 J J J J 2 X D");
        let leads = suggestions(&hand, None);
        assert!(!leads.is_empty());
        for cards in &leads {
            assert!(classify(cards).is_some(), "{cards:?}");
        }
        for last in [
            "3",
            "5 5",
            "4 4 4",
            "4 4 4 5",
            "4 4 4 5 5",
            "3 4 5 6 7",
            "3 3 4 4 5 5",
            "9 9 9 9",
        ] {
            let last = classify(&h(last)).unwrap();
            let plays = suggestions(&hand, Some(&last));
            assert!(!plays.is_empty(), "{last:?}");
            for cards in &plays {
                assert!(playable(cards, Some(&last)).is_some(), "{cards:?}");
            }
        }
        assert!(suggestions(&h("3 4 5"), classify(&h("X D")).as_ref()).is_empty());
        // The whole hand goes first when it is one play.
        assert_eq!(suggestions(&h("7 7 7 3"), None)[0].len(), 4);
    }
}
