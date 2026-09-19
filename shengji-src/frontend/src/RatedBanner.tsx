import * as React from "react";
import classNames from "classnames";
import { AppStateContext } from "./AppStateProvider";
import { GameState, PropagatedState } from "./gen-types";

import type { JSX } from "react";

/// The room-level settings shared by every phase, or null when there is no
/// game state yet.
export const propagatedOf = (
  gameState: GameState | null,
): PropagatedState | null => {
  if (gameState === null) {
    return null;
  }
  if ("Initialize" in gameState) {
    return gameState.Initialize.propagated;
  }
  if ("Draw" in gameState) {
    return gameState.Draw.propagated;
  }
  if ("Exchange" in gameState) {
    return gameState.Exchange.propagated;
  }
  if ("Play" in gameState) {
    return gameState.Play.propagated;
  }
  return null;
};

/// `rated` defaults to true on the server (serde default), so a missing
/// field means rated.
export const isRated = (propagated: PropagatedState | null): boolean =>
  propagated === null ||
  propagated.rated === undefined ||
  propagated.rated === null ||
  propagated.rated;

/// The rank a player has to reach to win the match. Defaults to 5 (serde
/// default on the server).
export const firstToRankOf = (propagated: PropagatedState | null): string => {
  const rank = propagated?.first_to_rank;
  return rank === undefined || rank === null || rank === "" ? "5" : rank;
};

/// How many rounds of the current match have finished. A match is in
/// progress once this is greater than zero.
export const roundsFinishedOf = (
  propagated: PropagatedState | null,
): number => {
  const finished = propagated?.num_games_finished;
  return finished === undefined || finished === null ? 0 : finished;
};

/// A one-line banner at the top of the game area: whether this match counts
/// towards ratings, how long it is, and which round of it is being played.
/// Visible in every phase; the settings themselves are changed from the
/// Initialize phase's game settings.
const RatedBanner = (): JSX.Element | null => {
  const { state } = React.useContext(AppStateContext);
  const propagated = propagatedOf(state.gameState);
  if (propagated === null) {
    return null;
  }
  const oneVsOne = propagated.player_mode === "OneVsOne";
  const rated = isRated(propagated);
  const firstToRank = firstToRankOf(propagated);
  const roundsFinished = roundsFinishedOf(propagated);
  // Before the first round of a match starts the room sits in the lobby;
  // once cards are dealt it's round 1 even though nothing has finished yet.
  const inLobby = state.gameState !== null && "Initialize" in state.gameState;
  const parts = [
    rated ? "Rated match" : "Unrated match",
    `first to rank ${firstToRank}`,
    roundsFinished > 0 || !inLobby
      ? `round ${roundsFinished + 1}`
      : "not started",
  ];
  if (oneVsOne) {
    parts.push("1v1 ladder");
  }
  return (
    <div
      className={classNames("rated-banner", {
        rated,
        unrated: !rated,
      })}
      title={
        rated
          ? `This ${oneVsOne ? "1v1" : "team"} match is rated.`
          : "This match does not affect ratings."
      }
    >
      {parts.join(" · ")}
    </div>
  );
};

export default RatedBanner;
