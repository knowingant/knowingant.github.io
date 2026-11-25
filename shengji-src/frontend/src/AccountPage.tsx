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

/// `#matches` (everyone's) or `#matches/<username>`.
export const matchesHref = (username?: string): string =>
  username === undefined
    ? "#matches"
    : `#matches/${encodeURIComponent(username)}`;

const ladderName = api.ladderName;

/// `47 (68.12%)`, or just `0` when there is nothing to take a percentage of.
const withPercent = (count: number, total: number): string =>
  total > 0 ? `${count} (${((count / total) * 100).toFixed(2)}%)` : `${count}`;

/// `+0.0776 (won +1.0965, lost −0.9068)`: the net levels per round against the
/// other side, then the average gain in rounds won and the average the other
/// side gained in rounds lost.
const averageRankChange = (s: api.ProfileStats): string => {
  const conceded = s.levels_conceded ?? 0;
  const lost = s.rounds - s.rounds_won;
  if (s.rounds === 0) {
    return "0";
  }
  const signed = (x: number): string =>
    `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(4)}`;
  const net = (s.levels_gained - conceded) / s.rounds;
  const gain = s.rounds_won > 0 ? s.levels_gained / s.rounds_won : 0;
  const loss = lost > 0 ? conceded / lost : 0;
  return `${signed(net)} (won ${signed(gain)}, lost ${signed(-loss)})`;
};

const Ladders = (props: {
  ratings: { team: RatingView; "1v1": RatingView; ddz?: RatingView };
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
      {(["team", "1v1", "ddz"] as RatingMode[]).map((mode) => {
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
      "Rounds defending",
      `${s.defender_rounds} (won ${withPercent(s.defender_wins, s.defender_rounds)})`,
    ],
    [
      "Rounds as the landlord",
      `${s.landlord_rounds} (won ${withPercent(s.landlord_wins, s.landlord_rounds)})`,
    ],
    ["Levels gained", `${s.levels_gained}`],
    ["Average rank G/L", averageRankChange(s)],
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

const DdzStats = (props: { stats: api.ProfileStats }): JSX.Element => {
  const s = props.stats;
  const rows: Array<[string, string]> = [
    ["Rounds played", `${s.rounds}`],
    ["Rounds won", withPercent(s.rounds_won, s.rounds)],
    [
      "Rounds as the landlord",
      `${s.landlord_rounds} (won ${withPercent(s.landlord_wins, s.landlord_rounds)})`,
    ],
    ["Points", api.formatDelta(s.levels_gained)],
    [
      "Points per round",
      s.rounds > 0
        ? `${s.levels_gained < 0 ? "−" : "+"}${Math.abs(s.levels_gained / s.rounds).toFixed(2)}`
        : "0",
    ],
    ["Matches played", `${s.matches}`],
    [
      "Matches 1st / 2nd / 3rd",
      `${s.matches_won} / ${s.matches_drawn} / ${s.matches_lost}`,
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

/// `, 1520 +20`: the rating after the match and the change, the sign green,
/// red or gray as the change is positive, negative or zero. Nothing for a
/// match that did not move ratings.
const RatingChange = (props: {
  player: api.ProfileMatchPlayer;
}): JSX.Element | null => {
  const { rating_before: before, rating_after: after } = props.player;
  if (
    before === null ||
    before === undefined ||
    after === null ||
    after === undefined
  ) {
    return null;
  }
  const delta = after - before;
  const kind = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <>
      , {after}{" "}
      <span className={`rating-delta rating-delta-${kind}`}>
        {delta < 0 ? "−" : "+"}
        {Math.abs(delta)}
      </span>
    </>
  );
};

/// One finished match. With `username`, that player is highlighted and their
/// own result and rating movement are shown underneath.
export const Match = (props: {
  match: api.ListedMatch;
  username?: string;
}): JSX.Element => {
  const { match, username } = props;
  const ddz = match.mode === "ddz";
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
        {ddz ? null : (
          <>
            {" · "}
            first to rank {match.first_to_rank}
          </>
        )}
        {" · "}
        {match.rounds === 1 ? "1 round" : `${match.rounds} rounds`}
      </div>
      <ul className="account-match-players">
        {match.players.map((p) => (
          <li
            key={p.username}
            className={p.username === username ? "me" : undefined}
          >
            {ddz ? (
              <>
                {p.final_rank}.{" "}
                <a href={accountHref(p.username)}>{p.username}</a>{" "}
                {api.formatDelta(p.levels)}
              </>
            ) : (
              <>
                <a href={accountHref(p.username)}>{p.username}</a> &mdash; rank{" "}
                {p.final_rank}
              </>
            )}
            <RatingChange player={p} />
          </li>
        ))}
      </ul>
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
          Every finished round and match counts here; the ladders above only
          count rated matches.
        </p>
        <Stats stats={profile.stats} />
        {profile.ddz_stats !== undefined && profile.ddz_stats.matches > 0 ? (
          <>
            <h3>Fight the Landlord</h3>
            <DdzStats stats={profile.ddz_stats} />
          </>
        ) : null}
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
        <p>
          <a href={matchesHref(profile.username)}>All matches</a>
        </p>
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
