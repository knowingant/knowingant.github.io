import * as React from "react";
import gameStatistics, { GameStatistics } from "./state/GameStatistics";
import settings, { Settings } from "./state/Settings";
import {
  GameState,
  MatchStanding,
  PlayerMode,
  RatingChange,
  RatingMode,
  RatingView,
} from "./gen-types";
import { Message } from "./ChatMessage";
import { AuthSession } from "./api";
import { State, combineState, noPersistence } from "./State";
import {
  stringLocalStorageState,
  numberLocalStorageState,
} from "./localStorageState";

import type { JSX } from "react";

/// The seats this connection controls in the current room (from the
/// server's `Joined` message). One seat in Standard rooms; two in 1v1 rooms
/// when the user owns a team.
export interface Seats {
  username: string;
  names: string[];
  playerIds: number[];
  playerMode: PlayerMode;
}

export interface RoomRatings {
  mode: RatingMode;
  ratings: { [seatName: string]: RatingView };
}

/// The standings of the match that just ended (the `MatchFinished`
/// broadcast), shown in a modal until it is dismissed.
export interface MatchFinishedSummary {
  matchKey: string;
  firstToRank: string;
  standings: MatchStanding[];
}

/// The rating changes of the match that just ended (the `MatchRated`
/// message, which follows `MatchFinished` when the match was rateable).
export interface MatchRatedSummary {
  matchId: number;
  mode: RatingMode;
  changes: RatingChange[];
}

/// The part of the hash that names a room ("" for `#user/<name>` and for an
/// empty hash). Room codes are exactly 16 characters.
export const roomNameFromHash = (hash: string): string => {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  return trimmed.startsWith("user/") ? "" : trimmed.slice(0, 16);
};

export interface AppState {
  settings: Settings;
  gameStatistics: GameStatistics;
  connected: boolean;
  everConnected: boolean;
  roomName: string;
  /// The signed-in user's name (== first seat name). Kept in sync with
  /// `auth.user.username`.
  name: string;
  /// Signed-in session, or null when signed out. The token itself is also
  /// persisted by `api.ts`.
  auth: AuthSession | null;
  /// True until the stored token has been checked against the server.
  authLoading: boolean;
  seats: Seats | null;
  roomRatings: RoomRatings | null;
  /// Set when a match ends; cleared when the summary modal is dismissed.
  lastMatchFinished: MatchFinishedSummary | null;
  lastMatchRated: MatchRatedSummary | null;
  gameState: GameState | null;
  headerMessages: string[];
  errors: string[];
  messages: Message[];
  confetti: string | null;
  changeLogLastViewed: number;
}

const appState: State<AppState> = combineState({
  settings,
  gameStatistics,
  connected: noPersistence(() => false),
  everConnected: noPersistence(() => false),
  roomName: noPersistence(() => roomNameFromHash(window.location.hash)),
  name: stringLocalStorageState("name"),
  auth: noPersistence<AuthSession | null>(() => null),
  authLoading: noPersistence(() => true),
  seats: noPersistence<Seats | null>(() => null),
  roomRatings: noPersistence<RoomRatings | null>(() => null),
  lastMatchFinished: noPersistence<MatchFinishedSummary | null>(() => null),
  lastMatchRated: noPersistence<MatchRatedSummary | null>(() => null),
  changeLogLastViewed: numberLocalStorageState("change_log_last_viewed"),
  gameState: noPersistence<GameState | null>(() => null),
  headerMessages: noPersistence<string[]>(() => []),
  errors: noPersistence<string[]>(() => []),
  messages: noPersistence<Message[]>(() => []),
  confetti: noPersistence<string | null>(() => null),
});

interface Context {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const AppStateContext = React.createContext<Context>({
  state: appState.loadDefault(),
  updateState: () => {},
});

export const SettingsContext = React.createContext<Settings>(
  appState.loadDefault().settings,
);

export const AppStateConsumer = AppStateContext.Consumer;

interface IProps {
  children: React.ReactNode;
}
const AppStateProvider = (props: IProps): JSX.Element => {
  const [state, setState] = React.useState<AppState>(() => {
    return appState.loadDefault();
  });
  const updateState = (newState: Partial<AppState>): void => {
    setState((s) => {
      const combined = { ...s, ...newState };
      appState.persist(state, combined);
      return combined;
    });
  };
  return (
    <AppStateContext.Provider value={{ state, updateState }}>
      <SettingsContext.Provider value={state.settings}>
        {props.children}
      </SettingsContext.Provider>
    </AppStateContext.Provider>
  );
};
export default AppStateProvider;
