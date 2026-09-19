import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import * as api from "./api";
import { accountHref } from "./AccountPage";
import type { RatingMode } from "./gen-types";

import type { JSX } from "react";

interface Loadable {
  loading: boolean;
  error: string | null;
  data: api.LeaderboardResponse | null;
}

const initial: Loadable = { loading: true, error: null, data: null };

interface ILadderProps {
  mode: RatingMode;
  title: string;
  state: Loadable;
  highlight: string | null;
}

const Ladder = (props: ILadderProps): JSX.Element => {
  const { state } = props;
  let body: JSX.Element;
  if (state.data === null && state.loading) {
    body = <p className="auth-hint">Loading…</p>;
  } else if (state.data === null) {
    body = (
      <p className="auth-error">
        Could not load: {state.error ?? "unknown error"}
      </p>
    );
  } else if (state.data.entries.length === 0) {
    body = (
      <p className="auth-hint">
        Nobody has finished a rated match on this ladder yet. Play one!
      </p>
    );
  } else {
    body = (
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Rating</th>
            <th>Matches</th>
            <th title="wins–losses–draws">W&ndash;L&ndash;D</th>
          </tr>
        </thead>
        <tbody>
          {state.data.entries.map((entry, idx) => (
            <tr
              key={entry.username}
              className={entry.username === props.highlight ? "me" : ""}
            >
              <td>{idx + 1}</td>
              <td>
                <a href={accountHref(entry.username)}>{entry.username}</a>
              </td>
              <td>{entry.rating}</td>
              <td>{entry.matches}</td>
              <td>{api.formatWinLossDraw(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="ladder">
      <h4>{props.title}</h4>
      {body}
    </div>
  );
};

/// The two ladders (team / 1v1), side by side, with a refresh button.
const Leaderboard = (): JSX.Element => {
  const { state } = React.useContext(AppStateContext);
  const [team, setTeam] = React.useState<Loadable>(initial);
  const [oneVsOne, setOneVsOne] = React.useState<Loadable>(initial);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const load = React.useCallback((): void => {
    setRefreshing(true);
    const fetchOne = (
      mode: RatingMode,
      set: React.Dispatch<React.SetStateAction<Loadable>>,
    ): Promise<void> => {
      set((s) => ({ ...s, loading: true }));
      return api.fetchLeaderboard(mode).then(
        (data) => set({ loading: false, error: null, data }),
        (e) =>
          set((s) => ({ ...s, loading: false, error: api.errorMessage(e) })),
      );
    };
    Promise.all([fetchOne("team", setTeam), fetchOne("1v1", setOneVsOne)])
      .catch((e) => console.error(e))
      .then(() => setRefreshing(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const me = state.auth?.user.username ?? null;

  return (
    <div className="leaderboard">
      <h3>
        Leaderboard{" "}
        <button
          type="button"
          className="normal"
          onClick={load}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </h3>
      <div className="leaderboard-tables">
        <Ladder mode="team" title="Team ladder" state={team} highlight={me} />
        <Ladder mode="1v1" title="1v1 ladder" state={oneVsOne} highlight={me} />
      </div>
    </div>
  );
};

export default Leaderboard;
