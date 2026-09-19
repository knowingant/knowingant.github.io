import * as React from "react";
import * as api from "./api";
import type { RatingMode, RatingView } from "./gen-types";

import type { JSX } from "react";

interface IProps {
  /// The name from the `#user/<username>` hash route.
  username: string;
}

/// The link to another account page. The base URL is the page itself, so a
/// bare hash is enough.
export const accountHref = (username: string): string =>
  `#user/${encodeURIComponent(username)}`;

const ladderName = (mode: RatingMode): string =>
  mode === "1v1" ? "1v1 ladder" : "team ladder";

/// "won" / "lost" / "drew", as a verb with the player as the subject.
const resultVerb = (result: api.MatchResult): string => {
  switch (result) {
    case "won":
      return "won";
    case "lost":
      return "lost";
    default:
      return "drew";
  }
};

/// `47 (68%)`, or just `0` when there is nothing to take a percentage of.
const withPercent = (count: number, total: number): string =>
  total > 0 ? `${count} (${Math.round((count / total) * 100)}%)` : `${count}`;

const Ladders = (props: {
  ratings: { team: RatingView; "1v1": RatingView };
}): JSX.Element => (
  <table className="leaderboard-table account-ladders">
    <thead>
      <tr>
        <th>Ladder</th>
        <th>Rating</th>
        <th>Matches</th>
        <th>W&ndash;L&ndash;D</th>
      </tr>
    </thead>
    <tbody>
      {(["team", "1v1"] as RatingMode[]).map((mode) => {
        const rating = props.ratings[mode];
        return (
          <tr key={mode}>
            <td>{ladderName(mode)}</td>
            <td>{api.formatRating(rating)}</td>
            <td>{rating?.matches ?? 0}</td>
            <td>{api.formatWinLossDraw(rating)}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const Stats = (props: { stats: api.ProfileStats }): JSX.Element => {
  const s = props.stats;
  const rows: Array<[string, string]> = [
    ["Rounds played", `${s.rounds}`],
    ["Rounds won", withPercent(s.rounds_won, s.rounds)],
    [
      "Rounds on the defending team",
      `${s.defender_rounds} (won ${withPercent(s.defender_wins, s.defender_rounds)})`,
    ],
    [
      "Rounds as the landlord",
      `${s.landlord_rounds} (won ${withPercent(s.landlord_wins, s.landlord_rounds)})`,
    ],
    ["Levels gained", `${s.levels_gained}`],
    ["Matches played", `${s.matches}`],
    [
      "Matches won / lost / drawn",
      `${s.matches_won} / ${s.matches_lost} / ${s.matches_drawn}`,
    ],
    ["Rated matches", `${s.rated_matches}`],
  ];
  return (
    <table className="leaderboard-table account-stats">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Match = (props: {
  match: api.ProfileMatch;
  username: string;
}): JSX.Element => {
  const { match, username } = props;
  const ratedLabel = !match.rated
    ? "unrated"
    : match.rating_applied === false
      ? "rated (ratings were not applied)"
      : "rated";
  return (
    <li className="account-match">
      <div className="account-match-header">
        <strong>{api.formatDate(match.finished_at)}</strong>
        {" · "}
        {ladderName(match.mode)}
        {" · "}
        {ratedLabel}
        {" · "}
        first to rank {match.first_to_rank}
        {" · "}
        {match.rounds === 1 ? "1 round" : `${match.rounds} rounds`}
      </div>
      <ul className="account-match-players">
        {match.players.map((p) => (
          <li
            key={p.username}
            className={p.username === username ? "me" : undefined}
          >
            <a href={accountHref(p.username)}>{p.username}</a> &mdash; rank{" "}
            {p.final_rank} ({p.levels} {p.levels === 1 ? "level" : "levels"}),{" "}
            {resultVerb(p.result)}
            {p.result === "won" ? " 🏆" : ""}
          </li>
        ))}
      </ul>
      <div className="account-match-outcome">
        <strong>{username}</strong> {resultVerb(match.result)}
        {match.delta !== null &&
        match.delta !== undefined &&
        match.rating_before !== null &&
        match.rating_after !== null ? (
          <>
            {": "}
            {match.rating_before} &rarr; {match.rating_after} (
            {api.formatDelta(match.delta)})
          </>
        ) : (
          <> (no rating change)</>
        )}
      </div>
    </li>
  );
};

/// The `#user/<username>` route: one account's ratings, statistics and
/// recent matches, from `GET /api/users/:username`.
const AccountPage = (props: IProps): JSX.Element => {
  const { username } = props;
  const [profile, setProfile] = React.useState<api.ProfileView | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [notFound, setNotFound] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setProfile(null);
    api.fetchProfile(username).then(
      (p) => {
        if (!cancelled) {
          setProfile(p);
          setLoading(false);
        }
      },
      (e) => {
        if (cancelled) {
          return;
        }
        if (e instanceof api.ApiError && e.status === 404) {
          setNotFound(true);
        } else {
          setError(api.errorMessage(e));
        }
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [username]);

  let body: JSX.Element;
  if (loading) {
    body = <p className="auth-hint">Loading&hellip;</p>;
  } else if (notFound) {
    body = (
      <p className="auth-error">
        No such user: nobody plays here under the name{" "}
        <strong>{username}</strong>.
      </p>
    );
  } else if (profile === null) {
    body = (
      <p className="auth-error">
        Could not load this account: {error ?? "unknown error"}
      </p>
    );
  } else {
    body = (
      <>
        <h2>{profile.username}</h2>
        <p className="auth-hint">
          Member since {api.formatDate(profile.created_at)}
        </p>
        <h3>Ladders</h3>
        <Ladders ratings={profile.ratings} />
        <h3>Statistics</h3>
        <p className="auth-hint">
          Every finished round and match counts here, rated or not; the ladders
          above only count rated matches.
        </p>
        <Stats stats={profile.stats} />
        <h3>Recent matches</h3>
        {profile.recent_matches.length === 0 ? (
          <p className="auth-hint">No finished matches yet.</p>
        ) : (
          <ul className="account-matches">
            {profile.recent_matches.map((m) => (
              <Match key={m.match_id} match={m} username={profile.username} />
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className="game account-page">
      <p>
        <a href="#">&larr; Back to the lobby</a>
      </p>
      {body}
    </div>
  );
};

export default AccountPage;
