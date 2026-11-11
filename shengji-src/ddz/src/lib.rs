//! Fight the Landlord (斗地主) rules: hand types, bidding, play and scoring for a
//! three-player match of a fixed number of rounds. Pure: no I/O.

pub mod game;
pub mod hand;

pub use game::{
    Action, BiddingMethod, Event, LastPlay, Match, Round, RoundResult, Settings, Stage,
    ROUND_CHOICES, SEATS,
};
pub use hand::{beats, classify, interpretations, playable, suggestions, Kind, Play};
