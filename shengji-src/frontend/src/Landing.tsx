import * as React from "react";
import Errors from "./Errors";
import JoinRoom from "./JoinRoom";
import Auth from "./Auth";
import AccountBar from "./AccountBar";
import { AppStateContext } from "./AppStateProvider";

import type { JSX } from "react";

/// The landing page: title, sign-in / registration, and (once signed in)
/// the account bar and the join-room form. The leaderboards live on their
/// own page (`#leaderboard`).
const Landing = (): JSX.Element => {
  const { state, updateState } = React.useContext(AppStateContext);

  const title = (
    <h1>
      升级 / <span className="red">Tractor</span> / 找朋友 /{" "}
      <span className="red">Finding Friends</span> / 斗地主 /{" "}
      <span className="red">Fight the Landlord</span>
    </h1>
  );

  const intro = (
    <>
      <p>
        Play rated 升级 / Tractor / 找朋友 / Finding Friends / 斗地主 / Fight
        the Landlord online.
      </p>
      <p>
        If you&apos;re not familiar with the rules, check them out{" "}
        <a href="rules.html">here</a>! See{" "}
        <a href="#leaderboard">leaderboards</a> and browse all{" "}
        <a href="#matches">matches</a>.
      </p>
    </>
  );

  let content: JSX.Element;
  if (state.authLoading) {
    content = <p>Loading...</p>;
  } else if (state.auth === null) {
    content = <Auth />;
  } else {
    content = (
      <>
        <AccountBar />
        <JoinRoom
          name={state.auth.user.username}
          room_name={state.roomName}
          setRoomName={(roomName: string) => {
            updateState({ roomName });
            window.location.hash = roomName;
          }}
        />
      </>
    );
  }

  return (
    <>
      <Errors errors={state.errors} />
      <div className="game">
        {title}
        {intro}
        {content}
      </div>
    </>
  );
};

export default Landing;
