//! A Fight the Landlord match in progress. The rules live in `shengji_ddz`; this
//! phase holds the room state around them and turns what happens into
//! broadcasts.

use anyhow::{anyhow, bail, Error};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use shengji_ddz::{Action, Event, Match, RoundResult};
use shengji_mechanics::types::PlayerID;

use crate::game_state::initialize_phase::InitializePhase;
use crate::message::{DdzSeatResult, DdzStanding, MessageVariant};
use crate::settings::PropagatedState;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct DdzPhase {
    propagated: PropagatedState,
    game: Match,
    player_requested_reset: Option<PlayerID>,
}

impl DdzPhase {
    /// Start a match between the three players of `propagated`.
    pub fn start(propagated: &PropagatedState) -> Result<Self, Error> {
        let mut propagated = propagated.clone();
        let seats: Vec<PlayerID> = propagated.players.iter().map(|p| p.id).collect();
        let game = Match::new(propagated.ddz.clone(), seats)?;
        propagated.begin_match(PropagatedState::new_key());
        propagated.round_key = PropagatedState::new_key();
        Ok(DdzPhase {
            propagated,
            game,
            player_requested_reset: None,
        })
    }

    pub fn from_parts(propagated: PropagatedState, game: Match) -> Self {
        DdzPhase {
            propagated,
            game,
            player_requested_reset: None,
        }
    }

    pub fn propagated(&self) -> &PropagatedState {
        &self.propagated
    }

    pub fn propagated_mut(&mut self) -> &mut PropagatedState {
        &mut self.propagated
    }

    pub fn game(&self) -> &Match {
        &self.game
    }

    pub fn next_player(&self) -> Result<PlayerID, Error> {
        self.game
            .next_player()
            .ok_or_else(|| anyhow!("nobody in particular is next"))
    }

    fn name(&self, seat: usize) -> String {
        let id = self.game.seats[seat];
        self.propagated
            .players
            .iter()
            .find(|p| p.id == id)
            .map(|p| p.name.clone())
            .unwrap_or_default()
    }

    fn round_finished(&self, result: &RoundResult) -> MessageVariant {
        MessageVariant::DdzRoundFinished {
            round_key: self.propagated.round_key.clone(),
            match_key: self.propagated.match_key.clone(),
            round: result.round,
            landlord: self.game.seats[result.landlord],
            landlord_won: result.landlord_won,
            stake: result.stake,
            bombs: result.bombs,
            spring: result.spring,
            results: (0..self.game.seats.len())
                .map(|seat| DdzSeatResult {
                    player: self.game.seats[seat],
                    name: self.name(seat),
                    is_landlord: seat == result.landlord,
                    won: (seat == result.landlord) == result.landlord_won,
                    delta: result.deltas[seat],
                    total: self.game.totals[seat],
                })
                .collect(),
        }
    }

    fn standings(&self) -> Vec<DdzStanding> {
        self.game
            .standings()
            .into_iter()
            .map(|(seat, points, place)| DdzStanding {
                player: self.game.seats[seat],
                name: self.name(seat),
                points,
                place,
            })
            .collect()
    }

    /// Apply a player's action. Returns the lobby to go back to when the
    /// match has ended, and the broadcasts.
    pub fn act(
        &mut self,
        id: PlayerID,
        action: Action,
    ) -> Result<(Option<InitializePhase>, Vec<MessageVariant>), Error> {
        let method = self.game.settings.bidding;
        let events = self.game.act(id, action)?;
        let mut msgs = vec![];
        let mut next = None;
        for event in events {
            match event {
                Event::Bid { value, grab, .. } => msgs.push(MessageVariant::DdzBid {
                    value,
                    method,
                    grab,
                }),
                Event::Redeal => msgs.push(MessageVariant::DdzRedeal),
                Event::Landlord { seat, stake } => msgs.push(MessageVariant::DdzLandlord {
                    landlord: self.game.seats[seat],
                    stake,
                }),
                Event::Doubles { seats } => msgs.push(MessageVariant::DdzDoubles {
                    players: seats.iter().map(|s| self.game.seats[*s]).collect(),
                }),
                Event::Redouble { redoubled, .. } => {
                    msgs.push(MessageVariant::DdzRedouble { redoubled })
                }
                Event::Bottom { cards } => msgs.push(MessageVariant::DdzBottom { cards }),
                Event::Played { cards, .. } => msgs.push(MessageVariant::PlayedCards {
                    cards,
                    units: vec![],
                }),
                Event::Passed { .. } => msgs.push(MessageVariant::DdzPassed),
                Event::RoundFinished(result) => msgs.push(self.round_finished(&result)),
                Event::NextRound { round } => {
                    self.propagated.round_key = PropagatedState::new_key();
                    self.player_requested_reset = None;
                    msgs.push(MessageVariant::DdzNextRound { round });
                }
                Event::MatchFinished => {
                    msgs.push(MessageVariant::DdzMatchFinished {
                        match_key: self.propagated.match_key.clone(),
                        rounds: self.game.round_number,
                        standings: self.standings(),
                    });
                    let mut propagated = self.propagated.clone();
                    propagated.reset_match();
                    propagated.round_key.clear();
                    next = Some(InitializePhase::from_propagated(propagated));
                }
            }
        }
        Ok((next, msgs))
    }

    /// The second player to ask ends the match, unrated.
    pub fn request_reset(
        &mut self,
        player: PlayerID,
    ) -> Result<(Option<InitializePhase>, Vec<MessageVariant>), Error> {
        if !self.propagated.players.iter().any(|p| p.id == player) {
            bail!("only players can reset the game");
        }
        match self.player_requested_reset {
            Some(p) if p == player => Ok((None, vec![])),
            Some(_) => {
                let mut propagated = self.propagated.clone();
                propagated.reset_match();
                propagated.round_key.clear();
                Ok((
                    Some(InitializePhase::from_propagated(propagated)),
                    vec![
                        MessageVariant::ResettingGame,
                        MessageVariant::DdzMatchAbandoned,
                    ],
                ))
            }
            None => {
                self.player_requested_reset = Some(player);
                Ok((None, vec![MessageVariant::ResetRequested]))
            }
        }
    }

    pub fn cancel_reset(&mut self) -> Option<MessageVariant> {
        self.player_requested_reset
            .take()
            .map(|_| MessageVariant::ResetCanceled)
    }

    pub fn reset_requester(&self) -> Option<PlayerID> {
        self.player_requested_reset
    }

    pub fn destructively_redact_for_players(&mut self, players: &[PlayerID]) {
        self.game = self.game.redacted_for(players);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game_state::GameState;
    use crate::interactive::{Action as RoomAction, InteractiveGame};
    use crate::settings::PlayerMode;
    use shengji_ddz::{suggestions, BiddingMethod, Settings, Stage};
    use shengji_mechanics::types::Card;

    fn logger() -> slog::Logger {
        slog::Logger::root(slog::Discard, slog::o!())
    }

    fn lobby() -> (InteractiveGame, Vec<PlayerID>) {
        let mut g = InteractiveGame::new();
        g.set_player_mode(PlayerMode::DouDiZhu).unwrap();
        let ids = ["a", "b", "c"]
            .iter()
            .map(|n| g.register(n.to_string()).unwrap().0)
            .collect::<Vec<_>>();
        (g, ids)
    }

    fn variants(msgs: &[(crate::interactive::BroadcastMessage, String)]) -> Vec<MessageVariant> {
        msgs.iter().map(|(b, _)| b.variant().clone()).collect()
    }

    fn ddz(g: &InteractiveGame) -> &DdzPhase {
        match g.state() {
            GameState::Ddz(p) => p,
            other => panic!("not in a match: {:?}", other),
        }
    }

    /// Play the current round to its end with the suggestion engine.
    fn play_round(g: &mut InteractiveGame) -> Vec<MessageVariant> {
        let l = logger();
        loop {
            let round = ddz(g).game().round.clone();
            let seats = ddz(g).game().seats.clone();
            let (seat, action) = match round.stage {
                Stage::Bidding => {
                    let seat = round.turn.unwrap();
                    (seat, Action::Bid(if round.stake == 0 { 1 } else { 0 }))
                }
                Stage::Doubling => {
                    let seat = round.turn.unwrap_or_else(|| {
                        (0..3)
                            .find(|s| Some(*s) != round.landlord && round.doubles[*s].is_none())
                            .unwrap()
                    });
                    (seat, Action::Double(false))
                }
                Stage::Playing => {
                    let seat = round.turn.unwrap();
                    let last = round.last_play.as_ref().map(|l| &l.play);
                    match suggestions(&round.hands[seat], last).first() {
                        Some(cards) => (seat, Action::Play(cards.clone())),
                        None => (seat, Action::Pass),
                    }
                }
                Stage::Finished => panic!("round already finished"),
            };
            let msgs = variants(
                &g.interact(RoomAction::Ddz(action), seats[seat], &l)
                    .unwrap(),
            );
            if msgs
                .iter()
                .any(|m| matches!(m, MessageVariant::DdzRoundFinished { .. }))
            {
                return msgs;
            }
        }
    }

    #[test]
    fn needs_three_players_and_every_start_vote() {
        let l = logger();
        let mut g = InteractiveGame::new();
        g.set_player_mode(PlayerMode::DouDiZhu).unwrap();
        let a = g.register("a".into()).unwrap().0;
        let b = g.register("b".into()).unwrap().0;
        assert!(g.interact(RoomAction::StartGame, a, &l).is_err());
        let c = g.register("c".into()).unwrap().0;
        for id in [a, b] {
            let msgs = variants(&g.interact(RoomAction::StartGame, id, &l).unwrap());
            assert!(matches!(msgs[0], MessageVariant::StartVote { .. }));
            assert!(matches!(g.state(), GameState::Initialize(_)));
        }
        let msgs = variants(&g.interact(RoomAction::StartGame, c, &l).unwrap());
        assert!(matches!(
            msgs[0],
            MessageVariant::DdzMatchStarted { rounds: 6 }
        ));
        let phase = ddz(&g);
        assert_eq!(phase.game().seats, vec![a, b, c]);
        assert_eq!(phase.propagated().match_key().len(), 32);
        assert_eq!(phase.propagated().round_key().len(), 32);
    }

    #[test]
    fn settings_are_set_in_the_lobby_and_validated() {
        let l = logger();
        let (mut g, ids) = lobby();
        let mut s = Settings {
            rounds: 3,
            bidding: BiddingMethod::Grab,
            doubling: false,
            multiplier_cap: Some(8),
        };
        let msgs = variants(
            &g.interact(RoomAction::SetDdzSettings(s.clone()), ids[0], &l)
                .unwrap(),
        );
        assert!(matches!(msgs[0], MessageVariant::DdzSettingsSet { .. }));
        assert_eq!(g.state().ddz_settings(), &s);
        s.rounds = 4;
        assert!(g
            .interact(RoomAction::SetDdzSettings(s), ids[0], &l)
            .is_err());
    }

    #[test]
    fn a_match_runs_to_the_end_and_returns_to_the_lobby() {
        let l = logger();
        let (mut g, ids) = lobby();
        let s = Settings {
            rounds: 3,
            ..Settings::default()
        };
        g.interact(RoomAction::SetDdzSettings(s), ids[0], &l)
            .unwrap();
        for id in &ids {
            g.interact(RoomAction::StartGame, *id, &l).unwrap();
        }
        let match_key = ddz(&g).propagated().match_key().to_string();
        let mut round_keys = vec![];
        for round in 1..=3 {
            let msgs = play_round(&mut g);
            let finished = msgs
                .iter()
                .find_map(|m| match m {
                    MessageVariant::DdzRoundFinished {
                        round_key,
                        match_key: mk,
                        round: r,
                        results,
                        ..
                    } => {
                        assert_eq!(mk, &match_key);
                        assert_eq!(*r, round);
                        assert_eq!(results.iter().map(|r| r.delta).sum::<i64>(), 0);
                        assert_eq!(results.iter().filter(|r| r.is_landlord).count(), 1);
                        Some(round_key.clone())
                    }
                    _ => None,
                })
                .unwrap();
            round_keys.push(finished);
            // Everyone sees every hand once the round is over.
            if let GameState::Ddz(p) = g.state().for_players(&[]) {
                assert!(p
                    .game()
                    .round
                    .hands
                    .concat()
                    .iter()
                    .all(|c| *c != Card::Unknown));
            }
            let msgs = variants(
                &g.interact(RoomAction::Ddz(Action::NextRound), ids[0], &l)
                    .unwrap(),
            );
            if round < 3 {
                assert!(matches!(msgs[0], MessageVariant::DdzNextRound { .. }));
            } else {
                match &msgs[0] {
                    MessageVariant::DdzMatchFinished {
                        match_key: mk,
                        rounds,
                        standings,
                    } => {
                        assert_eq!(mk, &match_key);
                        assert_eq!(*rounds, 3);
                        assert_eq!(standings.len(), 3);
                        assert_eq!(standings.iter().map(|s| s.points).sum::<i64>(), 0);
                        assert_eq!(standings[0].place, 1);
                    }
                    other => panic!("{:?}", other),
                }
            }
        }
        round_keys.dedup();
        assert_eq!(round_keys.len(), 3);
        // Back in the lobby with the same players and no match.
        match g.state() {
            GameState::Initialize(p) => {
                assert_eq!(p.players().len(), 3);
                assert_eq!(p.match_key(), "");
                assert_eq!(p.player_mode(), PlayerMode::DouDiZhu);
            }
            other => panic!("{:?}", other),
        }
    }

    #[test]
    fn hands_are_hidden_from_others_and_spectators() {
        let l = logger();
        let (mut g, ids) = lobby();
        for id in &ids {
            g.interact(RoomAction::StartGame, *id, &l).unwrap();
        }
        let watcher = g.register("watcher".into()).unwrap().0;
        assert!(!g.state().is_player(watcher));
        let hidden = |state: GameState, seat: usize| match state {
            GameState::Ddz(p) => p.game().round.hands[seat]
                .iter()
                .all(|c| *c == Card::Unknown),
            _ => panic!(),
        };
        assert!(!hidden(g.state().for_players(&[ids[0]]), 0));
        assert!(hidden(g.state().for_players(&[ids[0]]), 1));
        assert!(hidden(g.state().for_players(&[watcher]), 0));
        assert!(g
            .interact(RoomAction::Ddz(Action::Bid(1)), watcher, &l)
            .is_err());
    }

    #[test]
    fn two_players_can_abandon_the_match() {
        let l = logger();
        let (mut g, ids) = lobby();
        for id in &ids {
            g.interact(RoomAction::StartGame, *id, &l).unwrap();
        }
        g.interact(RoomAction::ResetGame, ids[0], &l).unwrap();
        assert_eq!(g.state().reset_requester(), Some(ids[0]));
        g.interact(RoomAction::ResetGame, ids[0], &l).unwrap();
        assert!(matches!(g.state(), GameState::Ddz(_)));
        let msgs = variants(&g.interact(RoomAction::ResetGame, ids[1], &l).unwrap());
        assert!(msgs
            .iter()
            .any(|m| matches!(m, MessageVariant::DdzMatchAbandoned)));
        match g.state() {
            GameState::Initialize(p) => assert_eq!(p.match_key(), ""),
            other => panic!("{:?}", other),
        }
    }
}
