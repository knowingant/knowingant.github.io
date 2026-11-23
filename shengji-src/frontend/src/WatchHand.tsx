import * as React from "react";
import classNames from "classnames";
import Cards from "./Cards";
import DdzHand from "./ddz/DdzHand";
import { UNKNOWN_CARD } from "./ddz/ddzCards";
import { AppStateContext } from "./AppStateProvider";
import { WebsocketContext } from "./WebsocketProvider";
import { propagatedOf } from "./RatedBanner";
import type { DdzMatch, GameState, Hands, Trump } from "./gen-types";

import type { JSX } from "react";

const LANDLORD = " (地主)";

/// The hands and trump of the current phase, or null in the lobby.
const handsOf = (
  gameState: GameState,
): { hands: Hands; trump: Trump } | null => {
  if ("Draw" in gameState) {
    return { hands: gameState.Draw.hands, trump: { NoTrump: {} } };
  }
  if ("Exchange" in gameState) {
    return { hands: gameState.Exchange.hands, trump: gameState.Exchange.trump };
  }
  if ("Play" in gameState) {
    return { hands: gameState.Play.hands, trump: gameState.Play.trump };
  }
  return null;
};

/// For spectators: a picker for the player whose hand to watch. The choice
/// is sent to the server (`Shadow`), which then redacts the state for that
/// player instead of for us, so their cards arrive with the next state and
/// are shown here, above the table, in every room type. In a Dou Di Zhu room
/// watching shows every hand, and all of them are listed under the picker.
/// Players never see this.
const WatchHand = (props: { gameState: GameState }): JSX.Element | null => {
  const { state } = React.useContext(AppStateContext);
  const { send } = React.useContext(WebsocketContext);
  const [target, setTarget] = React.useState<number | null>(null);

  const propagated = propagatedOf(props.gameState);
  const phase = handsOf(props.gameState);
  const ddz: DdzMatch | null =
    "Ddz" in props.gameState ? props.gameState.Ddz.game : null;
  if (propagated === null || (phase === null && ddz === null)) {
    return null;
  }
  const players = propagated.players;
  const own = state.seats?.playerIds ?? [];
  const isSpectator = !own.some((id) => players.some((p) => p.id === id));
  if (!isSpectator) {
    return null;
  }
  const watching =
    target !== null && players.some((p) => p.id === target) ? target : null;
  // Once the round is over the table shows the remaining cards itself.
  const watchedDdz =
    ddz !== null && watching !== null && ddz.round.stage !== "Finished"
      ? ddz
      : null;

  return (
    <div className="watch-hand">
      <label>
        Watch:{" "}
        <select
          value={watching === null ? "" : String(watching)}
          onChange={(evt) => {
            const v =
              evt.target.value === "" ? null : parseInt(evt.target.value, 10);
            setTarget(v);
            send({ Shadow: v });
          }}
        >
          <option value="">nobody</option>
          {ddz !== null ? (
            <option value={String(watching ?? players[0]?.id ?? "")}>
              everyone
            </option>
          ) : (
            players.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))
          )}
        </select>
      </label>
      {watching !== null && phase !== null ? (
        <div className="watch-hand-cards">
          <Cards hands={phase.hands} playerId={watching} trump={phase.trump} />
        </div>
      ) : null}
      {watchedDdz !== null ? (
        <div className="watch-hand-cards">
          {watchedDdz.seats.map((id, seat) => {
            const hand = watchedDdz.round.hands[seat] ?? [];
            // Only hands the server sent face up (it redacts them unless the
            // room's shadowing policy let us watch).
            if (!hand.some((card) => card !== UNKNOWN_CARD)) {
              return null;
            }
            return (
              <div className="ddz-watched" key={id}>
                <div
                  className={classNames({
                    next: watchedDdz.round.turn === seat,
                  })}
                >
                  {players.find((p) => p.id === id)?.name ?? ""}
                  {watchedDdz.round.landlord === seat ? LANDLORD : ""}
                </div>
                <DdzHand cards={hand} smaller={true} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default WatchHand;
