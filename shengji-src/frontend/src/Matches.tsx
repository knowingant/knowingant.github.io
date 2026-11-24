import * as React from "react";
import * as api from "./api";
import { Match, matchesHref } from "./AccountPage";
import { useDeviceWidth } from "./useDeviceWidth";
import type { RatingMode } from "./gen-types";

import type { JSX } from "react";

interface IProps {
  /// From `#matches/<username>`; empty for every match.
  initialUser: string;
}

/// The `#matches` page: every finished match, newest first, filtered by
/// player, ladder, rated or not and (with a player) their result.
const Matches = (props: IProps): JSX.Element => {
  useDeviceWidth();
  const [userInput, setUserInput] = React.useState<string>(props.initialUser);
  const [user, setUser] = React.useState<string>(props.initialUser);
  const [mode, setMode] = React.useState<RatingMode | "">("");
  const [rated, setRated] = React.useState<"" | "yes" | "no">("");
  const [result, setResult] = React.useState<"" | api.MatchResult>("");
  const [matches, setMatches] = React.useState<api.ListedMatch[]>([]);
  const [page, setPage] = React.useState<number>(1);
  const [pages, setPages] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // The route changed (e.g. a player link clicked on this page).
  React.useEffect(() => {
    setUserInput(props.initialUser);
    setUser(props.initialUser);
    setPage(1);
  }, [props.initialUser]);

  const query = (): api.MatchesQuery => ({
    user: user.trim() === "" ? undefined : user.trim(),
    mode: mode === "" ? undefined : mode,
    rated: rated === "" ? undefined : rated,
    result: user.trim() === "" || result === "" ? undefined : result,
    page,
  });

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.fetchMatches(query()).then(
      (r) => {
        if (!cancelled) {
          setMatches(r.matches);
          setPages(Math.max(1, Math.ceil(r.total / r.per_page)));
          setLoading(false);
        }
      },
      (e) => {
        if (!cancelled) {
          setMatches([]);
          setError(api.errorMessage(e));
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user, mode, rated, result, page]);

  // A filter changed: back to the first page.
  const filterChanged = (): void => setPage(1);

  const filtered = user.trim() !== "";
  return (
    <div className="game matches-page">
      <p>
        <a href="#">&larr; Back to the lobby</a>
      </p>
      <h2>Matches</h2>
      <form
        className="matches-filters"
        onSubmit={(e) => {
          e.preventDefault();
          filterChanged();
          setUser(userInput);
          window.location.hash =
            userInput.trim() === "" ? "matches" : matchesHref(userInput.trim());
        }}
      >
        <label>
          Player{" "}
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </label>
        <label>
          Ladder{" "}
          <select
            value={mode}
            onChange={(e) => {
              filterChanged();
              setMode(e.target.value as RatingMode | "");
            }}
          >
            <option value="">All</option>
            <option value="team">Team</option>
            <option value="1v1">1v1</option>
            <option value="ddz">Fight the Landlord</option>
          </select>
        </label>
        <label>
          Rated{" "}
          <select
            value={rated}
            onChange={(e) => {
              filterChanged();
              setRated(e.target.value as "" | "yes" | "no");
            }}
          >
            <option value="">All</option>
            <option value="yes">Rated</option>
            <option value="no">Unrated</option>
          </select>
        </label>
        {filtered ? (
          <label>
            Result{" "}
            <select
              value={result}
              onChange={(e) => {
                filterChanged();
                setResult(e.target.value as "" | api.MatchResult);
              }}
            >
              <option value="">All</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="drawn">Drew</option>
            </select>
          </label>
        ) : null}
        <button type="submit" className="normal">
          Search
        </button>
      </form>
      {error !== null ? (
        <p className="auth-error">Could not load: {error}</p>
      ) : matches.length === 0 && !loading ? (
        <p className="auth-hint">No matches.</p>
      ) : (
        <ul className="account-matches">
          {matches.map((m) => (
            <Match
              key={m.match_id}
              match={m}
              username={filtered ? user.trim() : undefined}
            />
          ))}
        </ul>
      )}
      {loading ? <p className="auth-hint">Loading…</p> : null}
      {pages > 1 ? (
        <p className="matches-pages">
          <button
            type="button"
            className="normal"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>{" "}
          Page {page} of {pages}{" "}
          <button
            type="button"
            className="normal"
            disabled={page >= pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </p>
      ) : null}
    </div>
  );
};

export default Matches;
