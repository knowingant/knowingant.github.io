import * as React from "react";
import { WebsocketContext } from "./WebsocketProvider";

import type { JSX } from "react";

/// Rewrites a client message so that a plain `{Action: X}` is performed as
/// the given seat: `{ActionAs: [playerId, X]}`. Every other message shape
/// (`{Message: ...}`, `"Beep"`, `{Kick: ...}`, an existing `ActionAs`, ...)
/// is passed through untouched.
export const bindActionToSeat = (playerId: number, msg: any): any => {
  if (
    msg !== null &&
    typeof msg === "object" &&
    !Array.isArray(msg) &&
    "Action" in msg &&
    !("ActionAs" in msg)
  ) {
    return { ActionAs: [playerId, msg.Action] };
  }
  return msg;
};

interface IProps {
  playerId: number;
  children: React.ReactNode;
}

/// Provides a `WebsocketContext` whose `send` binds actions to one seat of a
/// 1v1 connection. Everything rendered underneath (Draw / Exchange / Play,
/// BidArea, Cards, BeepButton, ...) keeps using `WebsocketContext.send` and
/// automatically acts as that seat.
const SeatProvider = (props: IProps): JSX.Element => {
  const parent = React.useContext(WebsocketContext);
  const { playerId } = props;
  const value = React.useMemo(
    () => ({
      send: (msg: any): void => parent.send(bindActionToSeat(playerId, msg)),
    }),
    [parent, playerId],
  );
  return (
    <WebsocketContext.Provider value={value}>
      {props.children}
    </WebsocketContext.Provider>
  );
};

/// The (possibly seat-bound) send function of the nearest provider.
export const useSeatSend = (): ((msg: any) => void) =>
  React.useContext(WebsocketContext).send;

export default SeatProvider;
