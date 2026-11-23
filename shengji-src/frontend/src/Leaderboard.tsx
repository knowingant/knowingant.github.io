import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import * as api from "./api";
import { accountHref } from "./AccountPage";
import type { RatingMode } from "./gen-types";

import type { JSX } from "react";

interface RatingLoadable {
  loading: boolean;
  error: string | null;
  data: api.LeaderboardResponse | null;
}

interface PerRoundLoadable {
  loading: boolean;
  error: string | null;
  data: api.PerRoundResponse | null;
}

const initialRating: RatingLoadable = {
  loading: true,
  error: null,
  data: null,
};

const initialPerRound: PerRoundLoadable = {
  loading: true,
  error: null,
  data: null,
};

/// `+1.8333` / `−0.5000`: an average per round, to four decimals.
const formatAverage = (average: number): string =>
  `${average < 0 ? "−" : ""}${Math.abs(average).toFixed(4)}`;

type View = "team" | "1v1" | "ddz" | "tractor" | "ddz_points";

interface ILadderProps {
  mode: RatingMode;
  title: string;
  state: RatingLoadable;
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

interface IPerRoundProps {
  title: string;
  /// What is being averaged, for the column's tooltip.
  unit: string;
  state: PerRoundLoadable;
  highlight: string | null;
}

/// Best average per round: levels climbed per round in Tractor, points per
/// round in Fight the Landlord. Every finished round counts, rated or not.
const PerRoundLadder = (props: IPerRoundProps): JSX.Element => {
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
    body = <p className="auth-hint">Not enough finished rounds yet.</p>;
  } else {
    body = (
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th title={`Average ${props.unit} per round`}>Avg/round</th>
            <th>Rounds</th>
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
              <td>{formatAverage(entry.average)}</td>
              <td>{entry.rounds}</td>
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

/// The `#leaderboard` page: a dropdown picks one of the three rating ladders
/// (team / 1v1 / Fight the Landlord) or the best average per round in Tractor
/// or Fight the Landlord; a refresh button reloads them all.
const Leaderboard = (): JSX.Element => {
  const { state } = React.useContext(AppStateContext);
  const [team, setTeam] = React.useState<RatingLoadable>(initialRating);
  const [oneVsOne, setOneVsOne] = React.useState<RatingLoadable>(initialRating);
  const [ddz, setDdz] = React.useState<RatingLoadable>(initialRating);
  const [tractor, setTractor] =
    React.useState<PerRoundLoadable>(initialPerRound);
  const [ddzPoints, setDdzPoints] =
    React.useState<PerRoundLoadable>(initialPerRound);
  const [view, setView] = React.useState<View>("team");
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const load = React.useCallback((): void => {
    setRefreshing(true);
    const fetchRating = (
      mode: RatingMode,
      set: React.Dispatch<React.SetStateAction<RatingLoadable>>,
    ): Promise<void> => {
      set((s) => ({ ...s, loading: true }));
      return api.fetchLeaderboard(mode).then(
        (data) => set({ loading: false, error: null, data }),
        (e) =>
          set((s) => ({ ...s, loading: false, error: api.errorMessage(e) })),
      );
    };
    const fetchPerRound = (
      game: "tractor" | "ddz",
      set: React.Dispatch<React.SetStateAction<PerRoundLoadable>>,
    ): Promise<void> => {
      set((s) => ({ ...s, loading: true }));
      return api.fetchPerRoundLeaderboard(game).then(
        (data) => set({ loading: false, error: null, data }),
        (e) =>
          set((s) => ({ ...s, loading: false, error: api.errorMessage(e) })),
      );
    };
    Promise.all([
      fetchRating("team", setTeam),
      fetchRating("1v1", setOneVsOne),
      fetchRating("ddz", setDdz),
      fetchPerRound("tractor", setTractor),
      fetchPerRound("ddz", setDdzPoints),
    ])
      .catch((e) => console.error(e))
      .then(() => setRefreshing(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // The app has no viewport meta (the game table needs the desktop layout), so
  // phones render this page at ~980px. Opt in to device width while it's open.
  React.useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  const me = state.auth?.user.username ?? null;
  const minRounds = tractor.data?.min_rounds ?? ddzPoints.data?.min_rounds ?? 5;

  return (
    <div className="game leaderboard-page">
      <p>
        <a href="#">&larr; Back to the lobby</a>
      </p>
      <h2>
        Leaderboards{" "}
        <button
          type="button"
          className="normal"
          onClick={load}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </h2>
      <div className="leaderboard-controls">
        <label>
          Show{" "}
          <select
            value={view}
            onChange={(e) => setView(e.target.value as View)}
          >
            <optgroup label="Rating ladders">
              <option value="team">Team ladder</option>
              <option value="1v1">1v1 ladder</option>
              <option value="ddz">Fight the Landlord ladder</option>
            </optgroup>
            <optgroup label="Per round">
              <option value="tractor">Tractor: average rank G/L</option>
              <option value="ddz_points">
                Fight the Landlord: points per round
              </option>
            </optgroup>
          </select>
        </label>
      </div>
      {view === "team" && (
        <Ladder mode="team" title="Team ladder" state={team} highlight={me} />
      )}
      {view === "1v1" && (
        <Ladder mode="1v1" title="1v1 ladder" state={oneVsOne} highlight={me} />
      )}
      {view === "ddz" && (
        <Ladder
          mode="ddz"
          title="Fight the Landlord ladder"
          state={ddz}
          highlight={me}
        />
      )}
      {(view === "tractor" || view === "ddz_points") && (
        <>
          <p className="ladder-footnote">
            Averages count every finished round, rated or not; a player needs at
            least {minRounds} rounds of that game to be listed.
          </p>
          {view === "tractor" ? (
            <PerRoundLadder
              title="Tractor: average rank G/L"
              unit="levels"
              state={tractor}
              highlight={me}
            />
          ) : (
            <PerRoundLadder
              title="Fight the Landlord: points per round"
              unit="points"
              state={ddzPoints}
              highlight={me}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
