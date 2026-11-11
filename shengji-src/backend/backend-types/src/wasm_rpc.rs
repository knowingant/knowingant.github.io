use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use shengji_mechanics::{
    bidding::{Bid, BidPolicy, BidReinforcementPolicy, JokerBidPolicy},
    deck::Deck,
    hands::Hands,
    player::Player,
    scoring::{GameScoreResult, GameScoringParameters},
    trick::{
        CompoundFormats, TractorRequirements, Trick, TrickDrawPolicy, TrickFormat, TrickUnit,
        UnitLike,
    },
    types::{Card, EffectiveSuit, PlayerID, Suit, Trump},
};

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct FindViablePlaysRequest {
    pub trump: Trump,
    pub tractor_requirements: TractorRequirements,
    pub cards: Vec<Card>,
    /// Also return every other valid grouping (split throws), marked
    /// `natural: false`.
    #[serde(default)]
    pub all_groupings: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct FindViablePlaysResult {
    pub results: Vec<FoundViablePlay>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct FoundViablePlay {
    pub grouping: Vec<TrickUnit>,
    pub description: String,
    /// One of the natural decompositions (what the cards mean when played
    /// without choosing), as opposed to a split the player asked for.
    #[serde(default)]
    pub natural: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct DecomposeTrickFormatRequest {
    pub trick_format: TrickFormat,
    pub hands: Hands,
    pub player_id: PlayerID,
    pub trick_draw_policy: TrickDrawPolicy,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct DecomposeTrickFormatResponse {
    pub results: Vec<DecomposedTrickFormat>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct DecomposedTrickFormat {
    pub format: Vec<UnitLike>,
    pub description: String,
    pub playable: Vec<Card>,
    pub more_than_one: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct CanPlayCardsRequest {
    pub trick: Trick,
    pub id: PlayerID,
    pub hands: Hands,
    pub cards: Vec<Card>,
    pub trick_draw_policy: TrickDrawPolicy,
    #[serde(default)]
    pub compound_formats: CompoundFormats,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct CanPlayCardsResponse {
    pub playable: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct FindValidBidsRequest {
    pub id: PlayerID,
    pub bids: Vec<Bid>,
    pub hands: Hands,
    pub players: Vec<Player>,
    pub landlord: Option<PlayerID>,
    pub epoch: usize,
    pub bid_policy: BidPolicy,
    pub bid_reinforcement_policy: BidReinforcementPolicy,
    pub joker_bid_policy: JokerBidPolicy,
    pub num_decks: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct FindValidBidsResult {
    pub results: Vec<Bid>,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct SortAndGroupCardsRequest {
    pub trump: Trump,
    pub cards: Vec<Card>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SortAndGroupCardsResponse {
    pub results: Vec<SuitGroup>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SuitGroup {
    pub suit: EffectiveSuit,
    pub cards: Vec<Card>,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct NextThresholdReachableRequest {
    pub decks: Vec<Deck>,
    pub params: GameScoringParameters,
    pub non_landlord_points: isize,
    pub observed_points: isize,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct ExplainScoringRequest {
    pub decks: Vec<Deck>,
    pub params: GameScoringParameters,
    pub smaller_landlord_team_size: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ExplainScoringResponse {
    pub results: Vec<ScoreSegment>,
    pub total_points: isize,
    pub step_size: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ScoreSegment {
    pub point_threshold: isize,
    pub results: GameScoreResult,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct ComputeScoreRequest {
    pub decks: Vec<Deck>,
    pub params: GameScoringParameters,
    pub smaller_landlord_team_size: bool,
    pub non_landlord_points: isize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ComputeScoreResponse {
    pub score: GameScoreResult,
    pub next_threshold: isize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct CardInfo {
    pub suit: Option<Suit>,
    pub effective_suit: EffectiveSuit,
    pub value: char,
    pub display_value: char,
    pub typ: char,
    pub number: Option<String>,
    pub points: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct CardInfoRequest {
    pub card: Card,
    pub trump: Trump,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct BatchCardInfoRequest {
    pub requests: Vec<CardInfoRequest>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct BatchCardInfoResponse {
    pub results: Vec<CardInfo>,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct ComputeDeckLenRequest {
    pub decks: Vec<Deck>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ComputeDeckLenResponse {
    pub length: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
#[serde(tag = "type")]
pub enum WasmRpcRequest {
    FindViablePlays(FindViablePlaysRequest),
    DecomposeTrickFormat(DecomposeTrickFormatRequest),
    CanPlayCards(CanPlayCardsRequest),
    FindValidBids(FindValidBidsRequest),
    SortAndGroupCards(SortAndGroupCardsRequest),
    NextThresholdReachable(NextThresholdReachableRequest),
    ExplainScoring(ExplainScoringRequest),
    ComputeScore(ComputeScoreRequest),
    ComputeDeckLen(ComputeDeckLenRequest),
    BatchGetCardInfo(BatchCardInfoRequest),
    DdzPlays(DdzPlaysRequest),
}

/// Dou Di Zhu: is `selected` playable over `last` (any hand when leading),
/// and what could be played from `hand`.
#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct DdzPlaysRequest {
    #[serde(default)]
    pub hand: Vec<Card>,
    #[serde(default)]
    pub selected: Vec<Card>,
    #[serde(default)]
    pub last: Option<shengji_ddz::Play>,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct DdzPlaysResponse {
    /// What `selected` is, when it may be played now.
    pub play: Option<shengji_ddz::Play>,
    pub suggestions: Vec<Vec<Card>>,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
pub struct NextThresholdReachableResponse {
    pub reachable: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, JsonSchema)]
#[serde(tag = "type")]
pub enum WasmRpcResponse {
    FindViablePlays(FindViablePlaysResult),
    DecomposeTrickFormat(DecomposeTrickFormatResponse),
    CanPlayCards(CanPlayCardsResponse),
    FindValidBids(FindValidBidsResult),
    SortAndGroupCards(SortAndGroupCardsResponse),
    NextThresholdReachable(NextThresholdReachableResponse),
    ExplainScoring(ExplainScoringResponse),
    ComputeScore(ComputeScoreResponse),
    ComputeDeckLen(ComputeDeckLenResponse),
    BatchGetCardInfo(BatchCardInfoResponse),
    DdzPlays(DdzPlaysResponse),
    Error(String),
}
