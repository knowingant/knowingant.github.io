//! One match: a fixed number of rounds between three seats, each round a
//! deal, an auction, optional doubling and the play.

use anyhow::{anyhow, bail, Error};
use rand::seq::SliceRandom;
use rand::Rng;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use shengji_mechanics::types::{Card, PlayerID, FULL_DECK};

use crate::hand::{playable, sort_hand, Kind, Play};

pub const SEATS: usize = 3;
pub const ROUND_CHOICES: [usize; 4] = [3, 6, 9, 12];
/// All-pass deals in a row before the first bidder is made landlord at 1.
pub const MAX_DEAD_DEALS: u32 = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema, Default)]
#[schemars(rename = "DdzBiddingMethod")]
pub enum BiddingMethod {
    /// 叫分: one bid of 1, 2 or 3 each; the highest takes it.
    #[default]
    CallScore,
    /// 抢地主: the first to call may be outbid once by each player still in;
    /// every grab doubles the stake.
    Grab,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzSettings")]
pub struct Settings {
    pub rounds: usize,
    pub bidding: BiddingMethod,
    /// Farmers may double; the landlord may redouble those who did.
    pub doubling: bool,
    /// Upper bound on a farmer's multiplier (bombs, spring, doubles).
    pub multiplier_cap: Option<u32>,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            rounds: 6,
            bidding: BiddingMethod::CallScore,
            doubling: true,
            multiplier_cap: None,
        }
    }
}

impl Settings {
    pub fn validate(&self) -> Result<(), Error> {
        if !ROUND_CHOICES.contains(&self.rounds) {
            bail!("a match is 3, 6, 9 or 12 rounds");
        }
        if let Some(cap) = self.multiplier_cap {
            if !(2..=1024).contains(&cap) {
                bail!("the multiplier cap must be between 2 and 1024");
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzStage")]
pub enum Stage {
    Bidding,
    Doubling,
    Playing,
    Finished,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzLastPlay")]
pub struct LastPlay {
    pub seat: usize,
    pub cards: Vec<Card>,
    pub play: Play,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzRoundResult")]
pub struct RoundResult {
    pub round: usize,
    pub landlord: usize,
    pub landlord_won: bool,
    pub stake: u32,
    pub bombs: u32,
    pub spring: bool,
    /// Per seat; the landlord's entry is the sum of the farmers'.
    pub multipliers: Vec<u32>,
    pub deltas: Vec<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzRound")]
pub struct Round {
    pub hands: Vec<Vec<Card>>,
    pub bottom: Vec<Card>,
    pub stage: Stage,
    pub first_bidder: usize,
    /// The seat to act, when it is one seat's turn.
    pub turn: Option<usize>,
    /// Each seat's bid in this deal (0 is a pass).
    pub bids: Vec<Option<u8>>,
    bid_queue: Vec<usize>,
    /// Grab bidding: the seat that called.
    pub caller: Option<usize>,
    grabbed: bool,
    caller_answered: bool,
    candidate: Option<usize>,
    pub stake: u32,
    pub landlord: Option<usize>,
    /// Farmers: doubled or not. Landlord: redoubled or not.
    pub doubles: Vec<Option<bool>>,
    pub last_play: Option<LastPlay>,
    /// Each seat's latest action in the current trick (empty is a pass).
    pub table: Vec<Option<Vec<Card>>>,
    pub bombs: u32,
    pub plays: Vec<u32>,
    pub dead_deals: u32,
    pub result: Option<RoundResult>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzAction")]
pub enum Action {
    /// Call score: 0 passes, 1 to 3 bids. Grab: 0 declines, 1 calls or grabs.
    Bid(u8),
    Double(bool),
    Play(Vec<Card>),
    Pass,
    /// After a round: deal the next one, or end the match after the last.
    NextRound,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    Bid {
        seat: usize,
        value: u8,
        grab: bool,
    },
    Redeal,
    Landlord {
        seat: usize,
        stake: u32,
    },
    Doubles {
        seats: Vec<usize>,
    },
    Redouble {
        seat: usize,
        redoubled: bool,
    },
    Bottom {
        cards: Vec<Card>,
    },
    Played {
        seat: usize,
        cards: Vec<Card>,
        kind: Kind,
    },
    Passed {
        seat: usize,
    },
    RoundFinished(RoundResult),
    NextRound {
        round: usize,
    },
    MatchFinished,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[schemars(rename = "DdzMatch")]
pub struct Match {
    pub settings: Settings,
    pub seats: Vec<PlayerID>,
    pub round: Round,
    /// 1-based.
    pub round_number: usize,
    pub totals: Vec<i64>,
    pub history: Vec<RoundResult>,
}

fn shuffled(rng: &mut impl Rng) -> Vec<Card> {
    let mut deck = FULL_DECK.to_vec();
    deck.shuffle(rng);
    deck
}

impl Round {
    /// `deck` is 54 cards: 17 to each seat in turn, the last 3 the bottom.
    pub fn deal(deck: Vec<Card>, first_bidder: usize, dead_deals: u32) -> Round {
        let mut hands = vec![vec![]; SEATS];
        for (i, c) in deck[..51].iter().enumerate() {
            hands[i % SEATS].push(*c);
        }
        for h in &mut hands {
            sort_hand(h);
        }
        Round {
            hands,
            bottom: deck[51..].to_vec(),
            stage: Stage::Bidding,
            first_bidder,
            turn: Some(first_bidder),
            bids: vec![None; SEATS],
            bid_queue: (0..SEATS).map(|i| (first_bidder + i) % SEATS).collect(),
            caller: None,
            grabbed: false,
            caller_answered: false,
            candidate: None,
            stake: 0,
            landlord: None,
            doubles: vec![None; SEATS],
            last_play: None,
            table: vec![None; SEATS],
            bombs: 0,
            plays: vec![0; SEATS],
            dead_deals,
            result: None,
        }
    }

    fn farmers(&self) -> Vec<usize> {
        (0..SEATS).filter(|s| Some(*s) != self.landlord).collect()
    }

    fn farmers_decided(&self) -> bool {
        self.farmers().iter().all(|s| self.doubles[*s].is_some())
    }

    fn start_play(&mut self, events: &mut Vec<Event>) {
        let landlord = self.landlord.expect("landlord is set before play");
        self.hands[landlord].extend(self.bottom.iter().copied());
        sort_hand(&mut self.hands[landlord]);
        self.stage = Stage::Playing;
        self.turn = Some(landlord);
        events.push(Event::Bottom {
            cards: self.bottom.clone(),
        });
    }

    fn set_landlord(&mut self, seat: usize, stake: u32, doubling: bool, events: &mut Vec<Event>) {
        self.landlord = Some(seat);
        self.stake = stake;
        self.turn = None;
        events.push(Event::Landlord { seat, stake });
        if doubling {
            self.stage = Stage::Doubling;
        } else {
            self.start_play(events);
        }
    }
}

impl Match {
    pub fn new(settings: Settings, seats: Vec<PlayerID>) -> Result<Match, Error> {
        let mut rng = rand::thread_rng();
        let first = rng.gen_range(0..SEATS);
        Match::with_deck(settings, seats, shuffled(&mut rng), first)
    }

    pub fn with_deck(
        settings: Settings,
        seats: Vec<PlayerID>,
        deck: Vec<Card>,
        first_bidder: usize,
    ) -> Result<Match, Error> {
        settings.validate()?;
        if seats.len() != SEATS {
            bail!("Fight the Landlord needs exactly 3 players");
        }
        if deck.len() != 54 {
            bail!("the deck must have 54 cards");
        }
        Ok(Match {
            settings,
            seats,
            round: Round::deal(deck, first_bidder % SEATS, 0),
            round_number: 1,
            totals: vec![0; SEATS],
            history: vec![],
        })
    }

    pub fn seat_of(&self, player: PlayerID) -> Option<usize> {
        self.seats.iter().position(|p| *p == player)
    }

    /// The player to act, when it is one player's turn.
    pub fn next_player(&self) -> Option<PlayerID> {
        self.round.turn.map(|s| self.seats[s])
    }

    pub fn round_finished(&self) -> bool {
        self.round.stage == Stage::Finished
    }

    pub fn is_last_round(&self) -> bool {
        self.round_number >= self.settings.rounds
    }

    /// Seats ordered by total, best first, with their place (ties share one).
    pub fn standings(&self) -> Vec<(usize, i64, usize)> {
        let mut order: Vec<usize> = (0..SEATS).collect();
        order.sort_by_key(|s| std::cmp::Reverse(self.totals[*s]));
        order
            .iter()
            .map(|s| {
                let place = 1 + self.totals.iter().filter(|t| **t > self.totals[*s]).count();
                (*s, self.totals[*s], place)
            })
            .collect()
    }

    pub fn act(&mut self, player: PlayerID, action: Action) -> Result<Vec<Event>, Error> {
        self.act_with(player, action, || shuffled(&mut rand::thread_rng()))
    }

    /// `redeal` supplies the deck when everyone passes.
    pub fn act_with(
        &mut self,
        player: PlayerID,
        action: Action,
        redeal: impl FnOnce() -> Vec<Card>,
    ) -> Result<Vec<Event>, Error> {
        let seat = self
            .seat_of(player)
            .ok_or_else(|| anyhow!("you are not playing in this match"))?;
        let mut events = vec![];
        match action {
            Action::Bid(value) => self.bid(seat, value, redeal, &mut events)?,
            Action::Double(yes) => self.double(seat, yes, &mut events)?,
            Action::Play(cards) => self.play(seat, cards, &mut events)?,
            Action::Pass => self.pass(seat, &mut events)?,
            Action::NextRound => self.next_round(redeal, &mut events)?,
        }
        Ok(events)
    }

    fn expect_turn(&self, seat: usize, stage: Stage) -> Result<(), Error> {
        if self.round.stage != stage {
            bail!("not supported right now");
        }
        if self.round.turn != Some(seat) {
            bail!("it is not your turn");
        }
        Ok(())
    }

    fn bid(
        &mut self,
        seat: usize,
        value: u8,
        redeal: impl FnOnce() -> Vec<Card>,
        events: &mut Vec<Event>,
    ) -> Result<(), Error> {
        self.expect_turn(seat, Stage::Bidding)?;
        let r = &mut self.round;
        let grab_phase = r.caller.is_some();
        match self.settings.bidding {
            BiddingMethod::CallScore => {
                if value > 3 {
                    bail!("bids are 1, 2 or 3");
                }
                if value > 0 && u32::from(value) <= r.stake {
                    bail!("bid higher or pass");
                }
                if value > 0 {
                    r.stake = u32::from(value);
                    r.candidate = Some(seat);
                }
                r.bid_queue.retain(|s| *s != seat);
                if value == 3 {
                    r.bid_queue.clear();
                }
            }
            BiddingMethod::Grab => {
                if value > 1 {
                    bail!("call or pass");
                }
                r.bid_queue.retain(|s| *s != seat);
                if !grab_phase {
                    if value == 1 {
                        r.caller = Some(seat);
                        r.candidate = Some(seat);
                        r.stake = 1;
                    }
                } else {
                    if value == 1 {
                        r.candidate = Some(seat);
                        r.stake *= 2;
                        r.grabbed = true;
                    }
                    if Some(seat) == r.caller {
                        r.caller_answered = true;
                    }
                }
                // Once the others have had their say, the caller answers a grab.
                if r.bid_queue.is_empty() && r.grabbed && !r.caller_answered {
                    r.bid_queue.extend(r.caller);
                }
            }
        }
        r.bids[seat] = Some(value);
        events.push(Event::Bid {
            seat,
            value,
            grab: grab_phase,
        });
        if let Some(next) = r.bid_queue.first() {
            r.turn = Some(*next);
            return Ok(());
        }
        let doubling = self.settings.doubling;
        match r.candidate {
            Some(landlord) => {
                let stake = r.stake;
                r.set_landlord(landlord, stake, doubling, events)
            }
            None if r.dead_deals >= MAX_DEAD_DEALS => {
                let first = r.first_bidder;
                r.set_landlord(first, 1, doubling, events)
            }
            None => {
                *r = Round::deal(redeal(), r.first_bidder, r.dead_deals + 1);
                events.push(Event::Redeal);
            }
        }
        Ok(())
    }

    fn double(&mut self, seat: usize, yes: bool, events: &mut Vec<Event>) -> Result<(), Error> {
        let r = &mut self.round;
        if r.stage != Stage::Doubling {
            bail!("not supported right now");
        }
        if r.doubles[seat].is_some() {
            bail!("you have already decided");
        }
        if Some(seat) == r.landlord {
            if r.turn != Some(seat) {
                bail!("it is not your turn");
            }
            r.doubles[seat] = Some(yes);
            events.push(Event::Redouble {
                seat,
                redoubled: yes,
            });
            r.start_play(events);
            return Ok(());
        }
        r.doubles[seat] = Some(yes);
        if r.farmers_decided() {
            let seats: Vec<usize> = r
                .farmers()
                .into_iter()
                .filter(|s| r.doubles[*s] == Some(true))
                .collect();
            let any = !seats.is_empty();
            events.push(Event::Doubles { seats });
            if any {
                r.turn = r.landlord;
            } else {
                r.start_play(events);
            }
        }
        Ok(())
    }

    fn play(
        &mut self,
        seat: usize,
        cards: Vec<Card>,
        events: &mut Vec<Event>,
    ) -> Result<(), Error> {
        self.expect_turn(seat, Stage::Playing)?;
        let r = &mut self.round;
        let mut hand = r.hands[seat].clone();
        for c in &cards {
            match hand.iter().position(|h| h == c) {
                Some(i) => {
                    hand.remove(i);
                }
                None => bail!("you don't have those cards"),
            }
        }
        let play = match &r.last_play {
            None => playable(&cards, None).ok_or_else(|| anyhow!("that is not a valid hand"))?,
            Some(last) => playable(&cards, Some(&last.play))
                .ok_or_else(|| anyhow!("that doesn't beat the last play"))?,
        };
        if r.last_play.is_none() {
            r.table = vec![None; SEATS];
        }
        r.hands[seat] = hand;
        r.plays[seat] += 1;
        if matches!(play.kind, Kind::Bomb | Kind::Rocket) {
            r.bombs += 1;
        }
        let mut shown = cards.clone();
        sort_hand(&mut shown);
        r.table[seat] = Some(shown.clone());
        r.last_play = Some(LastPlay {
            seat,
            cards: shown.clone(),
            play,
        });
        events.push(Event::Played {
            seat,
            cards: shown,
            kind: play.kind,
        });
        if r.hands[seat].is_empty() {
            self.finish(seat, events);
        } else {
            self.round.turn = Some((seat + 1) % SEATS);
        }
        Ok(())
    }

    fn pass(&mut self, seat: usize, events: &mut Vec<Event>) -> Result<(), Error> {
        self.expect_turn(seat, Stage::Playing)?;
        let r = &mut self.round;
        let leader = match &r.last_play {
            Some(last) => last.seat,
            None => bail!("you lead: play something"),
        };
        r.table[seat] = Some(vec![]);
        events.push(Event::Passed { seat });
        let next = (seat + 1) % SEATS;
        if next == leader {
            r.last_play = None;
        }
        r.turn = Some(next);
        Ok(())
    }

    fn finish(&mut self, winner: usize, events: &mut Vec<Event>) {
        let r = &mut self.round;
        let landlord = r.landlord.expect("landlord is set before play");
        let landlord_won = winner == landlord;
        let farmers = r.farmers();
        let spring = if landlord_won {
            farmers.iter().all(|s| r.plays[*s] == 0)
        } else {
            r.plays[landlord] == 1
        };
        let redoubled = r.doubles[landlord] == Some(true);
        let mut multipliers = vec![0u32; SEATS];
        let mut deltas = vec![0i64; SEATS];
        for f in &farmers {
            let doubled = r.doubles[*f] == Some(true);
            let exponent =
                r.bombs + u32::from(spring) + u32::from(doubled) + u32::from(doubled && redoubled);
            let mut multiplier = 1u32 << exponent.min(20);
            if let Some(cap) = self.settings.multiplier_cap {
                multiplier = multiplier.min(cap);
            }
            let amount = i64::from(r.stake) * i64::from(multiplier);
            multipliers[*f] = multiplier;
            multipliers[landlord] += multiplier;
            deltas[*f] = if landlord_won { -amount } else { amount };
            deltas[landlord] -= deltas[*f];
        }
        let result = RoundResult {
            round: self.round_number,
            landlord,
            landlord_won,
            stake: r.stake,
            bombs: r.bombs,
            spring,
            multipliers,
            deltas,
        };
        for (total, delta) in self.totals.iter_mut().zip(result.deltas.iter()) {
            *total += delta;
        }
        r.stage = Stage::Finished;
        r.turn = None;
        r.result = Some(result.clone());
        self.history.push(result.clone());
        events.push(Event::RoundFinished(result));
    }

    fn next_round(
        &mut self,
        redeal: impl FnOnce() -> Vec<Card>,
        events: &mut Vec<Event>,
    ) -> Result<(), Error> {
        if !self.round_finished() {
            bail!("the round is not over");
        }
        if self.is_last_round() {
            events.push(Event::MatchFinished);
            return Ok(());
        }
        self.round_number += 1;
        self.round = Round::deal(redeal(), (self.round.first_bidder + 1) % SEATS, 0);
        events.push(Event::NextRound {
            round: self.round_number,
        });
        Ok(())
    }

    /// What a connection controlling `players` may see: other hands only
    /// once the round is over, the bottom once play starts, and the other
    /// farmer's doubling choice once both have chosen.
    pub fn redacted_for(&self, players: &[PlayerID]) -> Match {
        let mut m = self.clone();
        let mine: Vec<usize> = players.iter().filter_map(|p| self.seat_of(*p)).collect();
        let r = &mut m.round;
        if r.stage != Stage::Finished {
            for (seat, hand) in r.hands.iter_mut().enumerate() {
                if !mine.contains(&seat) {
                    hand.fill(Card::Unknown);
                }
            }
        }
        if matches!(r.stage, Stage::Bidding | Stage::Doubling) {
            r.bottom.fill(Card::Unknown);
        }
        if r.stage == Stage::Doubling && !r.farmers_decided() {
            for (seat, d) in r.doubles.iter_mut().enumerate() {
                if !mine.contains(&seat) {
                    *d = None;
                }
            }
        }
        m
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hand::suggestions;
    use crate::hand::tests::h;
    use rand::rngs::StdRng;
    use rand::SeedableRng;

    const P: [PlayerID; 3] = [PlayerID(10), PlayerID(11), PlayerID(12)];

    fn settings(bidding: BiddingMethod, doubling: bool) -> Settings {
        Settings {
            rounds: 3,
            bidding,
            doubling,
            multiplier_cap: None,
        }
    }

    fn new_match(s: Settings, seed: u64) -> Match {
        let mut rng = StdRng::seed_from_u64(seed);
        Match::with_deck(s, P.to_vec(), shuffled(&mut rng), 0).unwrap()
    }

    /// Seat 0 holds `landlord`, the others `a` and `b`; the bottom is
    /// whatever is left. Seat 0 has already taken it at stake 1.
    fn playing(landlord: &str, a: &str, b: &str, s: Settings) -> Match {
        let mut m = new_match(s, 1);
        m.round.hands = vec![h(landlord), h(a), h(b)];
        m.round.landlord = Some(0);
        m.round.stake = 1;
        m.round.stage = Stage::Playing;
        m.round.turn = Some(0);
        m
    }

    fn act(m: &mut Match, seat: usize, a: Action) -> Vec<Event> {
        m.act(P[seat], a).unwrap()
    }

    #[test]
    fn deal_is_17_17_17_3() {
        let m = new_match(Settings::default(), 7);
        assert!(m.round.hands.iter().all(|h| h.len() == 17));
        assert_eq!(m.round.bottom.len(), 3);
        let mut all: Vec<Card> = m.round.hands.concat();
        all.extend(m.round.bottom.iter());
        let mut deck = FULL_DECK.to_vec();
        let key = |c: &Card| c.as_char();
        all.sort_by_key(key);
        deck.sort_by_key(key);
        assert_eq!(all, deck);
    }

    #[test]
    fn call_score_highest_bid_wins() {
        let mut m = new_match(settings(BiddingMethod::CallScore, false), 1);
        assert!(m.act(P[1], Action::Bid(1)).is_err());
        act(&mut m, 0, Action::Bid(1));
        assert!(m.act(P[1], Action::Bid(1)).is_err());
        act(&mut m, 1, Action::Bid(0));
        act(&mut m, 2, Action::Bid(2));
        assert_eq!(m.round.landlord, Some(2));
        assert_eq!(m.round.stake, 2);
        assert_eq!(m.round.stage, Stage::Playing);
        assert_eq!(m.round.hands[2].len(), 20);
        assert_eq!(m.round.turn, Some(2));
    }

    #[test]
    fn call_score_three_ends_the_auction() {
        let mut m = new_match(settings(BiddingMethod::CallScore, false), 1);
        act(&mut m, 0, Action::Bid(3));
        assert_eq!(m.round.landlord, Some(0));
        assert_eq!(m.round.stake, 3);
    }

    #[test]
    fn all_pass_redeals_then_forces_the_first_bidder() {
        let mut m = new_match(settings(BiddingMethod::CallScore, false), 1);
        for dead in 0..MAX_DEAD_DEALS {
            assert_eq!(m.round.dead_deals, dead);
            act(&mut m, 0, Action::Bid(0));
            act(&mut m, 1, Action::Bid(0));
            let events = act(&mut m, 2, Action::Bid(0));
            assert!(events.contains(&Event::Redeal));
            assert_eq!(m.round.stage, Stage::Bidding);
            assert_eq!(m.round.turn, Some(0));
        }
        act(&mut m, 0, Action::Bid(0));
        act(&mut m, 1, Action::Bid(0));
        act(&mut m, 2, Action::Bid(0));
        assert_eq!(m.round.landlord, Some(0));
        assert_eq!(m.round.stake, 1);
        assert_eq!(m.round_number, 1);
    }

    #[test]
    fn grab_caller_answers_a_grab() {
        let mut m = new_match(settings(BiddingMethod::Grab, false), 1);
        act(&mut m, 0, Action::Bid(1));
        act(&mut m, 1, Action::Bid(1));
        act(&mut m, 2, Action::Bid(0));
        assert_eq!(m.round.stage, Stage::Bidding);
        assert_eq!(m.round.turn, Some(0));
        act(&mut m, 0, Action::Bid(1));
        assert_eq!(m.round.landlord, Some(0));
        assert_eq!(m.round.stake, 4);
    }

    #[test]
    fn grab_passers_stay_out() {
        let mut m = new_match(settings(BiddingMethod::Grab, false), 1);
        act(&mut m, 0, Action::Bid(0));
        act(&mut m, 1, Action::Bid(1));
        act(&mut m, 2, Action::Bid(1));
        // Seat 0 passed, so it is back to the caller, not to seat 0.
        assert_eq!(m.round.turn, Some(1));
        act(&mut m, 1, Action::Bid(0));
        assert_eq!(m.round.landlord, Some(2));
        assert_eq!(m.round.stake, 2);
    }

    #[test]
    fn grab_nobody_grabs() {
        let mut m = new_match(settings(BiddingMethod::Grab, false), 1);
        act(&mut m, 0, Action::Bid(0));
        act(&mut m, 1, Action::Bid(0));
        act(&mut m, 2, Action::Bid(1));
        assert_eq!(m.round.landlord, Some(2));
        assert_eq!(m.round.stake, 1);
    }

    #[test]
    fn doubling_is_per_farmer_and_hidden_until_both_choose() {
        let mut m = new_match(settings(BiddingMethod::CallScore, true), 1);
        act(&mut m, 0, Action::Bid(3));
        assert_eq!(m.round.stage, Stage::Doubling);
        assert_eq!(m.round.hands[0].len(), 17);
        assert!(m.act(P[0], Action::Double(true)).is_err());
        act(&mut m, 1, Action::Double(true));
        assert_eq!(m.redacted_for(&[P[2]]).round.doubles[1], None);
        assert_eq!(m.redacted_for(&[P[1]]).round.doubles[1], Some(true));
        act(&mut m, 2, Action::Double(false));
        assert_eq!(m.redacted_for(&[P[2]]).round.doubles[1], Some(true));
        assert_eq!(m.round.turn, Some(0));
        act(&mut m, 0, Action::Double(true));
        assert_eq!(m.round.stage, Stage::Playing);
        assert_eq!(m.round.hands[0].len(), 20);
    }

    #[test]
    fn nobody_doubles_skips_the_redouble() {
        let mut m = new_match(settings(BiddingMethod::CallScore, true), 1);
        act(&mut m, 0, Action::Bid(1));
        act(&mut m, 1, Action::Bid(0));
        act(&mut m, 2, Action::Bid(0));
        act(&mut m, 1, Action::Double(false));
        act(&mut m, 2, Action::Double(false));
        assert_eq!(m.round.stage, Stage::Playing);
    }

    #[test]
    fn play_pass_and_lead_again() {
        let mut m = playing(
            "3 9 9",
            "5 6",
            "7 10 J",
            settings(BiddingMethod::CallScore, false),
        );
        assert!(m.act(P[0], Action::Pass).is_err());
        assert!(m.act(P[0], Action::Play(h("3 9"))).is_err());
        assert!(m.act(P[0], Action::Play(h("K"))).is_err());
        act(&mut m, 0, Action::Play(h("3")));
        assert!(m.act(P[1], Action::Play(h("5 6"))).is_err());
        assert!(m.act(P[2], Action::Play(h("7"))).is_err());
        act(&mut m, 1, Action::Play(h("5")));
        act(&mut m, 2, Action::Play(h("7")));
        act(&mut m, 0, Action::Play(h("9")));
        act(&mut m, 1, Action::Pass);
        act(&mut m, 2, Action::Play(h("10")));
        act(&mut m, 0, Action::Pass);
        act(&mut m, 1, Action::Pass);
        // Seat 2 won the trick and leads anything.
        assert_eq!(m.round.turn, Some(2));
        assert!(m.round.last_play.is_none());
        let events = act(&mut m, 2, Action::Play(h("J")));
        assert!(matches!(events.last(), Some(Event::RoundFinished(_))));
        let result = m.round.result.clone().unwrap();
        assert!(!result.landlord_won);
        assert!(!result.spring);
        assert_eq!(result.deltas, vec![-2, 1, 1]);
        assert_eq!(m.totals, vec![-2, 1, 1]);
        assert!(m.act(P[0], Action::Play(h("9"))).is_err());
    }

    #[test]
    fn spring_and_bombs_double() {
        let s = settings(BiddingMethod::CallScore, false);
        let mut m = playing("3 3 3 3 X D", "5 6", "7 8", s.clone());
        m.round.stake = 3;
        act(&mut m, 0, Action::Play(h("3 3 3 3")));
        act(&mut m, 1, Action::Pass);
        act(&mut m, 2, Action::Pass);
        act(&mut m, 0, Action::Play(h("X D")));
        let result = m.round.result.clone().unwrap();
        assert!(result.spring);
        assert_eq!(result.bombs, 2);
        // 3 x 2^(2 bombs + spring) = 24 from each farmer.
        assert_eq!(result.deltas, vec![48, -24, -24]);

        // Anti-spring: the landlord only ever made the first play.
        let mut m = playing("3 4", "5 6", "7", s);
        act(&mut m, 0, Action::Play(h("3")));
        act(&mut m, 1, Action::Pass);
        act(&mut m, 2, Action::Play(h("7")));
        let result = m.round.result.clone().unwrap();
        assert!(result.spring);
        assert_eq!(result.deltas, vec![-4, 2, 2]);
    }

    #[test]
    fn doubles_only_move_the_farmer_who_doubled() {
        let mut m = playing("3", "5 6", "7 8", settings(BiddingMethod::CallScore, true));
        m.round.doubles = vec![Some(true), Some(true), Some(false)];
        m.round.plays = vec![0, 1, 1];
        act(&mut m, 0, Action::Play(h("3")));
        let result = m.round.result.clone().unwrap();
        // Farmer 1 doubled and was redoubled (x4); farmer 2 did neither.
        assert_eq!(result.multipliers, vec![5, 4, 1]);
        assert_eq!(result.deltas, vec![5, -4, -1]);
    }

    #[test]
    fn multiplier_cap() {
        let mut s = settings(BiddingMethod::CallScore, false);
        s.multiplier_cap = Some(2);
        let mut m = playing("3 3 3 3 X D", "5 6", "7 8", s);
        act(&mut m, 0, Action::Play(h("3 3 3 3")));
        act(&mut m, 1, Action::Pass);
        act(&mut m, 2, Action::Pass);
        act(&mut m, 0, Action::Play(h("X D")));
        assert_eq!(m.round.result.clone().unwrap().deltas, vec![4, -2, -2]);
    }

    #[test]
    fn redaction() {
        let mut m = new_match(settings(BiddingMethod::CallScore, false), 3);
        let seen = m.redacted_for(&[P[1]]);
        assert!(seen.round.hands[0].iter().all(|c| *c == Card::Unknown));
        assert_eq!(seen.round.hands[0].len(), 17);
        assert_eq!(seen.round.hands[1], m.round.hands[1]);
        assert!(seen.round.bottom.iter().all(|c| *c == Card::Unknown));
        let spectator = m.redacted_for(&[]);
        assert!(spectator
            .round
            .hands
            .concat()
            .iter()
            .all(|c| *c == Card::Unknown));
        act(&mut m, 0, Action::Bid(3));
        let seen = m.redacted_for(&[P[1]]);
        assert_eq!(seen.round.bottom, m.round.bottom);
        assert!(seen.round.hands[0].iter().all(|c| *c == Card::Unknown));
        assert_eq!(seen.round.hands[0].len(), 20);
    }

    #[test]
    fn settings_are_validated() {
        let mut s = Settings::default();
        assert!(s.validate().is_ok());
        s.rounds = 5;
        assert!(s.validate().is_err());
        s.rounds = 12;
        s.multiplier_cap = Some(1);
        assert!(s.validate().is_err());
        assert!(
            Match::with_deck(Settings::default(), vec![P[0], P[1]], FULL_DECK.to_vec(), 0).is_err()
        );
    }

    /// Whole matches played by the suggestion engine: they end, stay
    /// zero-sum, rotate the first bidder and never lose a card.
    #[test]
    fn simulated_matches() {
        for seed in 0..40u64 {
            let mut rng = StdRng::seed_from_u64(seed);
            let s = Settings {
                rounds: 3,
                bidding: if seed % 2 == 0 {
                    BiddingMethod::CallScore
                } else {
                    BiddingMethod::Grab
                },
                doubling: seed % 3 != 0,
                multiplier_cap: None,
            };
            let mut m = Match::with_deck(s.clone(), P.to_vec(), shuffled(&mut rng), 0).unwrap();
            let mut steps = 0;
            let mut finished = false;
            let mut first_bidders = vec![m.round.first_bidder];
            while !finished {
                steps += 1;
                assert!(steps < 5000, "seed {seed} did not finish");
                let r = &m.round;
                let (seat, action) = match r.stage {
                    Stage::Bidding => {
                        let seat = r.turn.unwrap();
                        let value = match s.bidding {
                            BiddingMethod::Grab => rng.gen_range(0..=1),
                            BiddingMethod::CallScore => {
                                if rng.gen_bool(0.5) {
                                    0
                                } else {
                                    (r.stake + 1).min(3) as u8
                                }
                            }
                        };
                        (seat, Action::Bid(value))
                    }
                    Stage::Doubling => {
                        let seat = match r.turn {
                            Some(s) => s,
                            None => r
                                .farmers()
                                .into_iter()
                                .find(|s| r.doubles[*s].is_none())
                                .unwrap(),
                        };
                        (seat, Action::Double(rng.gen_bool(0.5)))
                    }
                    Stage::Playing => {
                        let seat = r.turn.unwrap();
                        let options =
                            suggestions(&r.hands[seat], r.last_play.as_ref().map(|l| &l.play));
                        let pass = r.last_play.is_some() && rng.gen_bool(0.3);
                        match options.first() {
                            Some(cards) if !pass => (seat, Action::Play(cards.clone())),
                            _ => (seat, Action::Pass),
                        }
                    }
                    Stage::Finished => (0, Action::NextRound),
                };
                let deck = shuffled(&mut rng);
                let events = m.act_with(P[seat], action, || deck).unwrap();
                if events.contains(&Event::MatchFinished) {
                    finished = true;
                }
                if events.iter().any(|e| matches!(e, Event::NextRound { .. })) {
                    first_bidders.push(m.round.first_bidder);
                }
                if matches!(m.round.stage, Stage::Bidding | Stage::Doubling) {
                    let cards: usize =
                        m.round.hands.iter().map(Vec::len).sum::<usize>() + m.round.bottom.len();
                    assert_eq!(cards, 54);
                }
                assert_eq!(m.totals.iter().sum::<i64>(), 0);
            }
            assert_eq!(m.history.len(), 3);
            assert_eq!(m.round_number, 3);
            assert_eq!(first_bidders, vec![0, 1, 2]);
            let standings = m.standings();
            assert_eq!(standings[0].2, 1);
            assert!(standings[0].1 >= standings[1].1 && standings[1].1 >= standings[2].1);
        }
    }
}
