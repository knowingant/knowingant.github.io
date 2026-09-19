import * as React from "react";
import Errors from "./Errors";
import JoinRoom from "./JoinRoom";
import Auth from "./Auth";
import AccountBar from "./AccountBar";
import Leaderboard from "./Leaderboard";
import { AppStateContext } from "./AppStateProvider";

import type { JSX } from "react";

/// The landing page: title, sign-in / registration, and (once signed in)
/// the account bar, the join-room form and the leaderboard.
const Landing = (): JSX.Element => {
  const { state, updateState } = React.useContext(AppStateContext);

  const title = (
    <h1>
      升级 / <span className="red">Tractor</span> / 找朋友 /{" "}
      <span className="red">Finding Friends</span>
    </h1>
  );

  const intro = (
    <>
      <p>
        Welcome! This website helps you play 升级 / Tractor / 找朋友 / Finding
        Friends with other people online, in rated matches.
      </p>
      <p>
        A match is &ldquo;first to rank N&rdquo; (5 by default), and ratings
        move once, when the match ends.
      </p>
      <p>
        If you&apos;re not familiar with the rules, check them out{" "}
        <a href="rules.html">here</a>!
      </p>
    </>
  );

  let content: JSX.Element;
  if (state.authLoading) {
    content = <p>Loading your account...</p>;
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
        <Leaderboard />
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
