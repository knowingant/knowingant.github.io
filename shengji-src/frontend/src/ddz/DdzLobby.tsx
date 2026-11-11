import * as React from "react";
import Players from "../Players";
import Kicker from "../Kicker";
import ReadyCheck from "../ReadyCheck";
import SettingsButton from "../SettingsButton";
import { WebsocketContext } from "../WebsocketProvider";
import { isRated } from "../RatedBanner";
import { DdzSettings, InitializePhase } from "../gen-types";

import type { JSX } from "react";

export const DEFAULT_DDZ_SETTINGS: DdzSettings = {
  rounds: 6,
  bidding: "CallScore",
  doubling: true,
  multiplier_cap: null,
};

export const DdzTitle = (): JSX.Element => (
  <h1>
    斗地主 / <span className="red">Fight the Landlord</span>
    &nbsp;
    <SettingsButton />
  </h1>
);

interface IProps {
  state: InitializePhase;
  name: string;
}

/// The lobby of a Fight the Landlord room: who is in, the match settings, start.
const DdzLobby = (props: IProps): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);
  const propagated = props.state.propagated;
  const settings = propagated.ddz ?? DEFAULT_DDZ_SETTINGS;
  const rated = isRated(propagated);
  const players = propagated.players;
  const me = players.find((p) => p.name === props.name);
  const votes = propagated.start_votes ?? [];
  const voted = me !== undefined && votes.includes(me.id);
  const progress = `${votes.length}/${players.length}`;

  const set = (change: Partial<DdzSettings>): void =>
    send({ Action: { SetDdzSettings: { ...settings, ...change } } });

  return (
    <div>
      <DdzTitle />
      <Players
        players={players}
        observers={propagated.observers}
        landlord={null}
        next={null}
        movable={true}
        name={props.name}
        hideRank={true}
      />
      <p>
        Send link to other players to allow them to join the game:{" "}
        <a href={window.location.href} target="_blank" rel="noreferrer">
          <code>{window.location.href}</code>
        </a>
      </p>
      {players.length === 3 ? (
        <>
          <button className="big" onClick={() => send({ Action: "StartGame" })}>
            {voted
              ? `You're ready — waiting for the others (${progress})`
              : `Start match (${progress} ready)`}
          </button>
          <ReadyCheck />
        </>
      ) : (
        <h2>Waiting for players...</h2>
      )}
      <Kicker
        players={players}
        onKick={(playerId: number) => send({ Kick: playerId })}
      />
      <div className="game-settings">
        <h3>Game settings</h3>
        <div>
          <label>
            Rated:{" "}
            <select
              value={rated ? "yes" : "no"}
              onChange={(evt) =>
                send({ Action: { SetRated: evt.target.value === "yes" } })
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Rounds:{" "}
            <select
              value={settings.rounds}
              onChange={(evt) =>
                set({ rounds: parseInt(evt.target.value, 10) })
              }
            >
              {[3, 6, 9, 12].map((n) => (
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Room type:{" "}
            <select
              value="DouDiZhu"
              onChange={(evt) => send({ SetPlayerMode: evt.target.value })}
            >
              <option value="Standard">Standard (4+ players)</option>
              <option value="OneVsOne">
                1v1 (each player controls two hands)
              </option>
              <option value="DouDiZhu">
                斗地主 / Fight the Landlord (3 players)
              </option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Bidding:{" "}
            <select
              value={settings.bidding}
              onChange={(evt) =>
                set({ bidding: evt.target.value as DdzSettings["bidding"] })
              }
            >
              <option value="CallScore">叫分 / bid 1 to 3</option>
              <option value="Grab">抢地主 / call and grab</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Doubling:{" "}
            <select
              value={settings.doubling ? "yes" : "no"}
              onChange={(evt) => set({ doubling: evt.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Multiplier cap:{" "}
            <select
              value={settings.multiplier_cap ?? ""}
              onChange={(evt) =>
                set({
                  multiplier_cap:
                    evt.target.value === ""
                      ? null
                      : parseInt(evt.target.value, 10),
                })
              }
            >
              <option value="">None</option>
              {[4, 8, 16, 32, 64].map((n) => (
                <option value={n} key={n}>
                  ×{n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DdzLobby;
