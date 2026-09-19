import * as React from "react";
import { WebsocketContext } from "./WebsocketProvider";
import { GameState, Player } from "./gen-types";

import type { JSX } from "react";

interface IProps {
  state: GameState;
  name: string;
  /// Every seat name this connection controls (1v1 rooms have two). A reset
  /// requested by any of them counts as "ours". Defaults to `[name]`.
  names?: string[];
}

/// The name of the player (or observer) who requested a reset, if any.
const findRequester = (state: GameState): string | undefined => {
  let players: Player[] = [];
  let observers: Player[] = [];
  let requested: number | null | undefined;
  if ("Draw" in state) {
    players = state.Draw.propagated.players;
    observers = state.Draw.propagated.observers;
    requested = state.Draw.player_requested_reset;
  } else if ("Exchange" in state) {
    players = state.Exchange.propagated.players;
    observers = state.Exchange.propagated.observers;
    requested = state.Exchange.player_requested_reset;
  } else if ("Play" in state) {
    players = state.Play.propagated.players;
    observers = state.Play.propagated.observers;
    requested = state.Play.player_requested_reset;
  }
  if (requested === null || requested === undefined) {
    return undefined;
  }
  // The requester may have become an observer since asking (or, in older
  // rooms, may have asked as one), so look in both lists.
  return (
    players.find((p) => p.id === requested)?.name ??
    observers.find((p) => p.id === requested)?.name
  );
};

const ResetButton = (props: IProps): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);

  const requester = findRequester(props.state);
  const ownNames = props.names ?? [props.name];

  if (requester == null) {
    return (
      <div className="reset-block">
        <a
          href={window.location.href}
          onClick={(evt) => {
            evt.preventDefault();
            send({ Action: "ResetGame" });
          }}
          title="Request to return to the game settings screen and re-deal all cards"
        >
          Reset game
        </a>
      </div>
    );
  } else if (ownNames.includes(requester)) {
    return (
      <div className="reset-block">
        <p>Waiting for confirmation...</p>
        <a
          href={window.location.href}
          onClick={(evt) => {
            evt.preventDefault();
            send({ Action: "CancelResetGame" });
          }}
          title="Continue playing the game"
        >
          Cancel
        </a>
      </div>
    );
  } else {
    return (
      <div className="reset-block">
        <p>{requester} wants to reset the game</p>
        <a
          href={window.location.href}
          onClick={(evt) => {
            evt.preventDefault();
            send({ Action: "ResetGame" });
          }}
          title="Return to the game settings screen and re-deal all cards"
          style={{
            marginRight: "8px",
          }}
        >
          Accept
        </a>
        <a
          href={window.location.href}
          onClick={(evt) => {
            evt.preventDefault();
            send({ Action: "CancelResetGame" });
          }}
          title="Continue playing the game"
        >
          Cancel
        </a>
      </div>
    );
  }
};

export default ResetButton;
