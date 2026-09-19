import * as React from "react";
import { WebsocketContext } from "./WebsocketProvider";
import { AppStateContext } from "./AppStateProvider";
import { TimerContext } from "./TimerProvider";
import PublicRoomsPane from "./PublicRoomsPane";
import { isWasmAvailable } from "./detectWasm";
import * as api from "./api";
import type { PlayerMode } from "./gen-types";

import type { JSX } from "react";

interface IProps {
  /// The signed-in account's username; this is the in-game name.
  name: string;
  room_name: string;
  setRoomName: (name: string) => void;
}

const JoinRoom = (props: IProps): JSX.Element => {
  const [editable, setEditable] = React.useState<boolean>(false);
  const [shouldGenerate, setShouldGenerate] = React.useState<boolean>(
    props.room_name.length !== 16,
  );
  const [roomType, setRoomType] = React.useState<PlayerMode>("Standard");
  const { send } = React.useContext(WebsocketContext);
  const { state, updateState } = React.useContext(AppStateContext);
  const { setTimeout } = React.useContext(TimerContext);

  const handleRoomChange = (event: React.ChangeEvent<HTMLInputElement>): void =>
    props.setRoomName(event.target.value.trim());

  const handleSubmit = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (props.name.length > 0 && props.room_name.length === 16) {
      const token = api.getToken();
      if (token === null || token.length === 0) {
        // The stored token went away underneath us (signed out in another
        // tab, or a 401 cleared it): go back to the sign-in form instead of
        // sending a join with `token: null`.
        updateState({
          auth: null,
          errors: [
            ...state.errors,
            "You are signed out; please sign in again.",
          ],
        });
        return;
      }
      send({
        room_name: props.room_name,
        token,
        disable_compression: !isWasmAvailable(),
        room_type: roomType,
        device_id: api.deviceId(),
      });
    }
  };

  const editableRoomName = (
    <input
      type="text"
      placeholder="Enter a room code"
      value={props.room_name}
      onChange={handleRoomChange}
      maxLength={16}
    />
  );
  const nonEditableRoomName = (
    <span
      title="Set the room name"
      onClick={(evt) => {
        evt.preventDefault();
        setEditable(true);
      }}
    >
      {props.room_name}
    </span>
  );

  const generateRoomName = (): void => {
    const arr = new Uint8Array(8);
    window.crypto.getRandomValues(arr);
    setShouldGenerate(false);
    props.setRoomName(
      Array.from(arr, (d) => ("0" + d.toString(16)).substr(-2)).join(""),
    );
  };

  if (shouldGenerate) {
    setTimeout(generateRoomName, 0);
  }

  return (
    <div>
      <form className="join-room" onSubmit={handleSubmit}>
        <div>
          <h2>
            <label>
              <strong>Room Name:</strong>{" "}
              {editable ? editableRoomName : nonEditableRoomName}{" "}
              <span
                title="Generate new room"
                onClick={() => generateRoomName()}
              >
                🎲
              </span>{" "}
            </label>
          </h2>
        </div>
        <div>
          <strong>Playing as:</strong>{" "}
          <span className="join-room-name" title="Your account username">
            {props.name}
          </span>{" "}
          <span className="auth-hint">(account name)</span>
        </div>
        <fieldset className="room-type">
          <legend>
            <strong>Room type</strong>
          </legend>
          <label>
            <input
              type="radio"
              name="room_type"
              value="Standard"
              checked={roomType === "Standard"}
              onChange={() => setRoomType("Standard")}
            />{" "}
            Standard (4+ players)
          </label>
          <label>
            <input
              type="radio"
              name="room_type"
              value="OneVsOne"
              checked={roomType === "OneVsOne"}
              onChange={() => setRoomType("OneVsOne")}
            />{" "}
            1v1 (each player controls two hands)
          </label>
          <p className="auth-hint">
            Joining an existing room uses its existing type.
          </p>
        </fieldset>
        <div>
          <input
            type="submit"
            value="Join (or create) the game!"
            disabled={props.room_name.length !== 16 || props.name.length === 0}
          />
        </div>
      </form>
      <div>
        <p>
          Pick a room code above (or roll the dice) to create a new room, or
          enter the code of an existing room to (re-)join it.
        </p>
        <p>
          Rooms are <strong>rated by default</strong>, and they play{" "}
          <strong>matches</strong>: a match is &ldquo;first to rank N&rdquo; (5
          by default). You can change N or turn rating off entirely in settings
          before the match starts.
        </p>
        <p>
          If you&apos;re unfamiliar with the game, it might be helpful to{" "}
          <a href="rules.html" target="_blank">
            read the rules
          </a>{" "}
          first.
        </p>
        <p>
          Once you are in the game, share the room link with at least three
          friends (or one friend, for 1v1) to start playing!
        </p>
        <p>
          Compared to the robertying site, the defaults here are fast autodraw
          and no taking back bids or plays.
        </p>
      </div>
      <PublicRoomsPane setRoomName={props.setRoomName} />
    </div>
  );
};

export default JoinRoom;
