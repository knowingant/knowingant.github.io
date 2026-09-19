import * as React from "react";
import ReactModal from "react-modal";
import classNames from "classnames";
import { AppStateContext, leaveRoom } from "./AppStateProvider";
import { formatDelta } from "./api";

import type { JSX } from "react";

const contentStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  maxWidth: "560px",
  transform: "translate(-50%, -50%)",
};

/// Shown when a `MatchFinished` broadcast arrives: the final standings, plus
/// the rating changes once the `MatchRated` message follows (it only does
/// for a match that was actually rated). Dismissing it clears both.
const MatchSummaryModal = (): JSX.Element | null => {
  const { state, updateState } = React.useContext(AppStateContext);
  const finished = state.lastMatchFinished;
  const rated = state.lastMatchRated;

  if (finished === null) {
    return null;
  }

  const close = (): void =>
    updateState({ lastMatchFinished: null, lastMatchRated: null });

  return (
    <ReactModal
      isOpen={true}
      onRequestClose={close}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      style={{ content: contentStyle }}
    >
      <h2>Match over</h2>
      <p>First to rank {finished.firstToRank}.</p>
      <ul className="match-standings">
        {finished.standings.map((s) => (
          <li
            key={s.player}
            className={classNames({ winner: s.winner })}
            title={s.winner ? "Reached the target rank" : undefined}
          >
            {s.winner ? "🏆 " : ""}
            <strong>{s.name}</strong> &mdash; rank {s.rank} ({s.levels}{" "}
            {s.levels === 1 ? "level" : "levels"})
          </li>
        ))}
      </ul>
      {rated !== null ? (
        <>
          <h3>
            Rating changes ({rated.mode === "1v1" ? "1v1" : "team"} ladder)
          </h3>
          <ul className="match-rating-changes">
            {rated.changes.map((c) => (
              <li key={c.username}>
                <strong>{c.username}</strong> {c.before} &rarr; {c.after}{" "}
                <span
                  className={classNames("ratings-update-delta", {
                    up: c.delta > 0,
                    down: c.delta < 0,
                  })}
                >
                  ({formatDelta(c.delta)})
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="auth-hint">
          Ratings only update at the end of a rated match; if this one was
          rated, the changes will appear here in a moment.
        </p>
      )}
      <button className="normal" onClick={close}>
        Close
      </button>{" "}
      <button
        className="normal"
        onClick={leaveRoom}
        title="Leave this room and go back to the lobby"
      >
        Back to lobby
      </button>
    </ReactModal>
  );
};

export default MatchSummaryModal;
