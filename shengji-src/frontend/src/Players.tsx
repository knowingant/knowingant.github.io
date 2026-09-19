import * as React from "react";

import classNames from "classnames";
import { MovePlayerLeft, MovePlayerRight } from "./MovePlayerButton";
import { Player, RatingView } from "./gen-types";
import { WebsocketContext } from "./WebsocketProvider";
import { AppStateContext } from "./AppStateProvider";
import { accountHref } from "./AccountPage";

import type { JSX } from "react";

interface IProps {
  players: Player[];
  observers: Player[];
  landlord?: number | null;
  landlords_team?: number[];
  movable?: boolean;
  /// Show the movable controls, but locked: the roster is frozen while a
  /// match is in progress (the server rejects the actions anyway).
  movableDisabled?: boolean;
  next?: number | null;
  name: string;
}

/// " (1512)"; "" when the rating is not known (nobody has sent us the
/// room's ratings yet).
export const ratingSuffix = (rating: RatingView | undefined | null): string => {
  if (rating === undefined || rating === null) {
    return "";
  }
  return ` (${rating.rating})`;
};

/// The 1v1 second seat "alice (2)" is rated as the user "alice".
export const seatUsername = (seatName: string): string =>
  seatName.replace(/ \(2\)$/, "");

const Players = (props: IProps): JSX.Element => {
  const {
    players,
    observers,
    landlord,

    landlords_team,
    movable,
    movableDisabled,
    next,
    name,
  } = props;
  const { send } = React.useContext(WebsocketContext);
  const { state } = React.useContext(AppStateContext);
  const ratings = state.roomRatings?.ratings;
  // Every seat this connection controls counts as "you" (two in 1v1 rooms).
  const ownNames = new Set<string>(state.seats?.names ?? []);
  ownNames.add(name);

  const ratingFor = (p: Player): RatingView | undefined =>
    ratings === undefined || ratings === null
      ? undefined
      : (ratings[p.name] ?? ratings[seatUsername(p.name)]);

  const makeDescriptor = (p: Player): Array<JSX.Element | string> => {
    const rating = ratingSuffix(ratingFor(p));
    // The account page is a hash route on this very page, so a bare hash is
    // enough; open it in a new tab so nobody loses their seat.
    const nameLink = (
      <a
        key={`name-${p.id}`}
        href={accountHref(seatUsername(p.name))}
        target="_blank"
        rel="noreferrer"
        title={`${seatUsername(p.name)}'s account page`}
      >
        {p.name}
      </a>
    );
    if (p.metalevel <= 1) {
      return [nameLink, `${rating} (rank ${p.level})`];
    } else {
      return [
        nameLink,
        `${rating} (rank ${p.level}`,
        <sup key={`meta-${p.id}`}>{p.metalevel}</sup>,
        ")",
      ];
    }
  };

  return (
    <table className="players">
      <tbody>
        <tr>
          {players.map((player) => {
            const className = classNames("player", {
              landlord:
                player.id === landlord || landlords_team?.includes(player.id),
              movable,
              next: player.id === next,
            });

            const descriptor = makeDescriptor(player);

            if (player.id === landlord) {
              descriptor.push(" (当庄)");
            }
            if (ownNames.has(player.name)) {
              descriptor.push(" (You!)");
            }

            return (
              <td key={player.id} className={className}>
                {descriptor}
                {movable && (
                  <span
                    style={{
                      display: "block",
                      marginTop: "6px",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <MovePlayerLeft
                      players={players}
                      player={player}
                      disabled={movableDisabled}
                    />
                    <span
                      style={
                        movableDisabled === true
                          ? { cursor: "not-allowed", opacity: 0.4 }
                          : { cursor: "pointer" }
                      }
                      onClick={(_) => {
                        if (movableDisabled !== true) {
                          send({ Action: { MakeObserver: player.id } });
                        }
                      }}
                    >
                      ✔️
                    </span>
                    <MovePlayerRight
                      players={players}
                      player={player}
                      disabled={movableDisabled}
                    />
                  </span>
                )}
              </td>
            );
          })}
          {observers.map((player) => {
            const className = classNames("player observer", { movable });
            const descriptor = makeDescriptor(player);

            if (ownNames.has(player.name)) {
              descriptor.push(" (You!)");
            }

            return (
              <td key={player.id} className={className}>
                <span style={{ textDecoration: "line-through" }}>
                  {descriptor}
                </span>
                {movable && (
                  <span
                    style={{
                      display: "block",
                      marginTop: "6px",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <span
                      style={
                        movableDisabled === true
                          ? { cursor: "not-allowed", opacity: 0.4 }
                          : { cursor: "pointer" }
                      }
                      onClick={(_) => {
                        if (movableDisabled !== true) {
                          send({ Action: { MakePlayer: player.id } });
                        }
                      }}
                    >
                      💤
                    </span>
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
};

export default Players;
