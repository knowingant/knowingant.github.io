import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import Landing from "./Landing";
import Game from "./Game";
import AccountPage from "./AccountPage";
import Credits from "./Credits";
import TitleHandler from "./TitleHandler";

import type { JSX } from "react";

/// The username of the `#user/<username>` route, or null for every other
/// hash (a room code, or nothing).
export const accountRouteUsername = (hash: string): string | null => {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed.startsWith("user/")) {
    return null;
  }
  const username = decodeURIComponent(trimmed.slice("user/".length)).trim();
  return username.length > 0 ? username : null;
};

/// `window.location.hash`, kept up to date as the user follows in-page
/// links (`#user/<name>`, "back to the lobby") and uses the back button.
const useHash = (): string => {
  const [hash, setHash] = React.useState<string>(() => window.location.hash);
  React.useEffect(() => {
    const onHashChange = (): void => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
};

/// Top-level switch between the landing page (sign-in / join room), an
/// account page and the in-room game view. Everything shared (header
/// messages, dark mode) lives here.
const Root = (): JSX.Element => {
  const { state } = React.useContext(AppStateContext);
  const accountUsername = accountRouteUsername(useHash());

  const [previousHeaderMessages, setPreviousHeaderMessages] = React.useState<
    string[]
  >([]);
  const [showHeaderMessages, setShowHeaderMessages] = React.useState<boolean>(
    state.headerMessages.length > 0,
  );
  React.useEffect(() => {
    if (
      state.headerMessages.length > 0 &&
      (previousHeaderMessages.length !== state.headerMessages.length ||
        !previousHeaderMessages.every((m, i) => state.headerMessages[i] === m))
    ) {
      setShowHeaderMessages(true);
    } else if (state.headerMessages.length === 0) {
      setShowHeaderMessages(false);
    }
    setPreviousHeaderMessages(state.headerMessages);
  }, [state.headerMessages]);

  React.useEffect(() => {
    if (state.settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    return () => {
      document.body.classList.remove("dark-mode");
    };
  }, [state.settings.darkMode]);

  const headerMessages = showHeaderMessages ? (
    <div
      className="header-message"
      onClick={() => setShowHeaderMessages(false)}
    >
      {state.headerMessages.map((msg, idx) => (
        <p key={idx}>{msg}</p>
      ))}
    </div>
  ) : null;

  if (accountUsername !== null) {
    return (
      <div>
        {headerMessages}
        <AccountPage username={accountUsername} />
        <hr />
        <Credits />
        <TitleHandler playerName={state.name} />
      </div>
    );
  }

  if (state.gameState !== null && state.roomName.length === 16) {
    if (state.connected) {
      return <Game headerMessages={headerMessages} />;
    }
    return (
      <>
        <p>
          It looks like you got disconnected from the server, please refresh! If
          the game is still ongoing, you should be able to re-join with the same
          account and pick up where you left off.
        </p>
      </>
    );
  } else {
    return (
      <div>
        {headerMessages}
        <Landing />
        <hr />
        <Credits />
        <TitleHandler playerName={state.name} />
      </div>
    );
  }
};

export default Root;
