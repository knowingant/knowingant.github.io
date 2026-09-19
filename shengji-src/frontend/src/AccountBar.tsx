import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import * as api from "./api";

import type { JSX } from "react";

/// Signed-in header on the landing page: who you are, your two ratings, a
/// link to your account page, and sign out (here and everywhere).
const AccountBar = (): JSX.Element | null => {
  const { state, updateState } = React.useContext(AppStateContext);
  const auth = state.auth;

  const [busy, setBusy] = React.useState<boolean>(false);

  if (auth === null) {
    return null;
  }
  const user = auth.user;

  const signOutLocally = (): void => {
    api.setToken(null);
    updateState({ auth: null });
  };

  const signOut = async (everywhere: boolean): Promise<void> => {
    setBusy(true);
    try {
      if (everywhere) {
        await api.logoutAll();
      } else {
        await api.logout();
      }
    } catch (e) {
      // The token is being thrown away regardless.
      console.warn("logout request failed:", e);
    } finally {
      setBusy(false);
      signOutLocally();
    }
  };

  const ratingTitle =
    "Your rating on this ladder, with the number of rated matches and your win–loss (–draw) record. Ratings only move when a match ends.";

  return (
    <div className="account-bar">
      <div className="account-summary">
        <span>
          Signed in as <strong>{user.username}</strong>
        </span>
        <span className="account-ratings" title={ratingTitle}>
          <span>
            team{" "}
            <strong>{api.formatRatingWithRecord(user.ratings.team)}</strong>
          </span>
          <span>
            1v1{" "}
            <strong>{api.formatRatingWithRecord(user.ratings["1v1"])}</strong>
          </span>
        </span>
        <span className="account-actions">
          <a href={`#user/${encodeURIComponent(user.username)}`}>
            Your account page
          </a>{" "}
          <button
            type="button"
            className="normal"
            onClick={() => {
              signOut(false).catch((e) => console.error(e));
            }}
            disabled={busy}
          >
            Sign out
          </button>{" "}
          <button
            type="button"
            className="normal"
            onClick={() => {
              signOut(true).catch((e) => console.error(e));
            }}
            disabled={busy}
            title="Revokes every session of this account, including this one"
          >
            Sign out everywhere
          </button>
        </span>
      </div>
    </div>
  );
};

export default AccountBar;
