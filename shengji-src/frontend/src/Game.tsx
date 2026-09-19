import * as React from "react";
import classNames from "classnames";
import Errors from "./Errors";
import Initialize from "./Initialize";
import Draw, { drawNextPlayer } from "./Draw";
import Exchange, { exchangeNextPlayer } from "./Exchange";
import { AppStateContext, leaveRoom } from "./AppStateProvider";
import { TimerContext } from "./TimerProvider";
import Credits from "./Credits";
import Chat from "./Chat";
import Play from "./Play";
import DebugInfo from "./DebugInfo";
import TitleHandler from "./TitleHandler";
import ResetButton from "./ResetButton";
import RatedBanner from "./RatedBanner";
import MatchSummaryModal from "./MatchSummaryModal";
import SeatProvider from "./SeatProvider";
import { PhasePart } from "./phasePart";
import { GameState } from "./gen-types";

import type { JSX } from "react";

const Confetti = React.lazy(async () => await import("./Confetti"));

interface IProps {
  headerMessages: JSX.Element | null;
}

/// The player whose turn it is in the current phase, or null when nobody is
/// specifically "next" (Initialize, or an empty player queue in Play).
const nextPlayerOf = (gameState: GameState): number | null => {
  if ("Draw" in gameState) {
    return drawNextPlayer(gameState.Draw);
  }
  if ("Exchange" in gameState) {
    return exchangeNextPlayer(gameState.Exchange);
  }
  if ("Play" in gameState) {
    const queue = gameState.Play.trick.player_queue;
    return queue.length > 0 ? queue[0] : null;
  }
  return null;
};

/// The in-room view: renders the current phase for the seat(s) this
/// connection controls.
///
/// In 1v1 rooms a connection owns both seats of its team (`alice` and
/// `alice (2)`). The Draw / Exchange / Play phase is then rendered in parts
/// (see `PhasePart`): the shared `board` (players, trump, trick) once, full
/// width; a `seat` part per seat (that seat's hand and buttons) side by side
/// under it; and the `footer` (points, previous trick, kitty) once below.
/// Each instance sits under a `SeatProvider`, which rewrites every
/// `{Action: X}` it sends into `{ActionAs: [seatId, X]}`. The Initialize
/// phase is room settings and is rendered once, as the first seat.
const Game = (props: IProps): JSX.Element => {
  const { state, updateState } = React.useContext(AppStateContext);
  const timerContext = React.useContext(TimerContext);
  const gameState = state.gameState!;

  // `seats` may still be null if the first `State` beat the `Joined`
  // message; treat that as one seat named `state.name`.
  const seats = state.seats;
  const seatNames =
    seats !== null && seats.names.length > 0 ? seats.names : [state.name];
  const dualSeat =
    seats !== null &&
    seats.playerMode === "OneVsOne" &&
    seats.names.length === 2 &&
    seats.playerIds.length === 2;
  const nextPlayer = dualSeat ? nextPlayerOf(gameState) : null;

  const renderPhase = (name: string, part: PhasePart): JSX.Element | null => {
    if ("Draw" in gameState) {
      return (
        <Draw
          state={gameState.Draw}
          playDrawCardSound={state.settings.playDrawCardSound}
          autodrawSpeedMs={state.settings.autodrawSpeedMs}
          name={name}
          setTimeout={timerContext.setTimeout}
          clearTimeout={timerContext.clearTimeout}
          part={part}
        />
      );
    }
    if ("Exchange" in gameState) {
      return <Exchange state={gameState.Exchange} name={name} part={part} />;
    }
    if ("Play" in gameState) {
      return (
        <Play
          playPhase={gameState.Play}
          name={name}
          showLastTrick={state.settings.showLastTrick}
          unsetAutoPlayWhenWinnerChanges={
            state.settings.unsetAutoPlayWhenWinnerChanges
          }
          showTrickInPlayerOrder={state.settings.showTrickInPlayerOrder}
          beepOnTurn={state.settings.beepOnTurn}
          part={part}
        />
      );
    }
    return null;
  };

  let phase: JSX.Element | null;
  if ("Initialize" in gameState) {
    phase = <Initialize state={gameState.Initialize} name={seatNames[0]} />;
  } else if (dualSeat && seats !== null) {
    // The board once, full width; the two seats side by side under it
    // (`.seats` is a two-column grid), so neither hand has to be scrolled
    // to; then the footer (points, previous trick, kitty) once.
    phase = (
      <>
        <SeatProvider playerId={seats.playerIds[0]}>
          {renderPhase(seats.names[0], "board")}
        </SeatProvider>
        <div className="seats">
          {seats.names.map((name, idx) => {
            const playerId = seats.playerIds[idx];
            const active = nextPlayer !== null && nextPlayer === playerId;
            return (
              <SeatProvider key={playerId} playerId={playerId}>
                <div className={classNames("seat", { "seat-active": active })}>
                  <h3 className="seat-heading">
                    Seat {idx + 1}: {name}
                    {active ? (
                      <span className="seat-turn"> (your turn)</span>
                    ) : null}
                  </h3>
                  {renderPhase(name, "seat")}
                </div>
              </SeatProvider>
            );
          })}
        </div>
        <SeatProvider playerId={seats.playerIds[0]}>
          {renderPhase(seats.names[0], "footer")}
        </SeatProvider>
      </>
    );
  } else {
    phase = renderPhase(seatNames[0], "all");
  }

  return (
    <div
      className={classNames(
        state.settings.fourColor ? "four-color" : null,
        state.settings.showCardLabels ? "always-show-labels" : null,
        state.settings.hideChatBox ? "hide-chat-box" : null,
      )}
    >
      {props.headerMessages}
      <Errors errors={state.errors} />
      <MatchSummaryModal />
      {state.confetti !== null ? (
        <React.Suspense fallback={null}>
          <Confetti
            confetti={state.confetti}
            clearConfetti={() => updateState({ confetti: null })}
          />
        </React.Suspense>
      ) : null}
      <div className="game">
        <div className="leave-block">
          <a
            href={window.location.pathname}
            onClick={(evt) => {
              evt.preventDefault();
              leaveRoom();
            }}
            title="Leave this room and go back to the lobby"
          >
            Leave room
          </a>
        </div>
        {"Initialize" in gameState ? null : (
          <ResetButton
            state={gameState}
            name={seatNames[0]}
            names={seatNames}
          />
        )}
        <RatedBanner />
        {phase}
        {state.settings.showDebugInfo ? <DebugInfo /> : null}
      </div>
      <Chat messages={state.messages} />
      <hr />
      <Credits />
      <TitleHandler playerName={state.name} />
    </div>
  );
};

export default Game;
