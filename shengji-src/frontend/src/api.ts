// Backend location and authenticated fetch helpers.
//
// The static (GitHub Pages) build reads the backend origin from
// `window._API_HOST`, set by `runtime.js`. An empty string / null means
// "same origin as this page" (the backend serving the frontend itself).

import type { RatingMode, RatingView } from "./gen-types";

export interface UserView {
  id: number;
  username: string;
  /// Unix seconds.
  created_at: number;
  ratings: { team: RatingView; "1v1": RatingView };
}

export interface AuthSession {
  token: string;
  user: UserView;
}

/// `GET /api/auth/config`. Sign-in is impossible unless at least one of
/// these is configured on the server.
export interface AuthConfig {
  google_client_id: string | null;
  dev_login: boolean;
}

/// `POST /api/auth/google` for a Google account we have not seen before.
export interface NeedsUsername {
  needs_username: true;
  pending: string;
  suggested_username: string;
}

export type GoogleSignInResponse = AuthSession | NeedsUsername;

export function isNeedsUsername(r: GoogleSignInResponse): r is NeedsUsername {
  return (r as NeedsUsername).needs_username === true;
}

/// One row of `GET /api/leaderboard`.
export interface LeaderboardEntry {
  username: string;
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

/// The "how did this account do" block of `GET /api/users/:username`. Every
/// finished round and match counts here, rated or not.
export interface ProfileStats {
  rounds: number;
  rounds_won: number;
  defender_rounds: number;
  defender_wins: number;
  landlord_rounds: number;
  landlord_wins: number;
  levels_gained: number;
  matches: number;
  matches_won: number;
  matches_lost: number;
  matches_drawn: number;
  rated_matches: number;
}

export type MatchResult = "won" | "lost" | "drawn";

/// One seat-owner in a finished match.
export interface ProfileMatchPlayer {
  username: string;
  /// Which side they played on (team parity, or their own side in Finding
  /// Friends).
  side: number;
  levels: number;
  final_rank: string;
  result: MatchResult;
  rating_before: number | null;
  rating_after: number | null;
}

/// One entry of `recent_matches` (newest first, at most 20).
export interface ProfileMatch {
  match_id: number;
  mode: RatingMode;
  rated: boolean;
  /// Whether the match actually moved ratings (a rated match can still be
  /// skipped, e.g. when two players shared a device).
  rating_applied?: boolean;
  first_to_rank: string;
  /// Unix seconds.
  finished_at: number;
  rounds: number;
  players: ProfileMatchPlayer[];
  /// This user's own levels / result / rating movement.
  levels: number;
  result: MatchResult;
  rating_before: number | null;
  rating_after: number | null;
  delta: number | null;
}

/// `GET /api/users/:username`.
export interface ProfileView extends UserView {
  stats: ProfileStats;
  recent_matches: ProfileMatch[];
}

/// localStorage key of the session token. Exported so AuthBootstrap can
/// watch for it changing in another tab (the `storage` event).
export const TOKEN_KEY = "auth_token";
const DEVICE_KEY = "device_id";

/// The documented body of a 401 from an authenticated endpoint whose token
/// is missing, unknown or expired.
export const NOT_SIGNED_IN = "not signed in";

/// Origin of the backend, without a trailing slash. "" = same origin.
export function apiHost(): string {
  const host = (window as any)._API_HOST;
  if (typeof host === "string" && host.length > 0) {
    return host.replace(/\/+$/, "");
  }
  return "";
}

/// Absolute URL for a backend path such as "/api/auth/me" or
/// "public_games.json". Relative paths are resolved against the page's
/// directory when the API is same-origin (the app lives under /shengji/).
export function apiUrl(path: string): string {
  const host = apiHost();
  if (host !== "") {
    return host + (path.startsWith("/") ? path : "/" + path);
  }
  if (path.startsWith("/")) {
    const dir = location.pathname.endsWith("/")
      ? location.pathname
      : location.pathname.replace(/[^/]*$/, "");
    return dir.replace(/\/$/, "") + path;
  }
  return path;
}

/// WebSocket URL for the game endpoint.
export function wsUrl(): string {
  const host = apiHost();
  if (host !== "") {
    return (
      host.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://") +
      "/api"
    );
  }
  return (
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    location.pathname +
    (location.pathname.endsWith("/") ? "api" : "/api")
  );
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token === null) {
      window.localStorage.removeItem(TOKEN_KEY);
    } else {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // ignore (private mode etc.)
  }
}

/// A random per-browser identifier, sent on login and room join as a cheap
/// "same device" signal for alt detection. Not a secret.
export function deviceId(): string {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (id === null || id.length === 0) {
      const arr = new Uint8Array(16);
      window.crypto.getRandomValues(arr);
      id = Array.from(arr, (d) => ("0" + d.toString(16)).slice(-2)).join("");
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    // TS targets ES5: restore the prototype chain so `instanceof` works.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/// True when `e` is the server telling us our session token is no longer
/// valid (as opposed to, say, a wrong password on the login form).
export function isNotSignedIn(e: unknown): boolean {
  return (
    e instanceof ApiError && e.status === 401 && e.message === NOT_SIGNED_IN
  );
}

/// Human-readable error text for anything thrown by `apiFetch`.
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message;
  }
  if (e instanceof Error) {
    return e.message.length > 0 ? e.message : "request failed";
  }
  return "request failed";
}

/// fetch() against the backend. Adds the bearer token when signed in, sends
/// JSON bodies, parses JSON responses, and throws ApiError with the
/// server's `error` message on non-2xx. Never sends cookies.
///
/// `init.token` sends that session token instead of the stored one (the
/// in-memory session of a tab whose stored token was replaced or removed
/// by another tab); by default the stored token is used.
///
/// A 401 whose body is the documented "not signed in" clears the stored
/// token if it is the one that was sent (the session is dead either way);
/// the caller is responsible for clearing `AppState.auth`.
export async function apiFetch<T = any>(
  path: string,
  init: {
    method?: string;
    body?: any;
    auth?: boolean;
    token?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const token =
    init.token !== undefined && init.token !== null ? init.token : getToken();
  const sendAuth = init.auth !== false && token !== null;
  if (sendAuth) {
    headers["Authorization"] = "Bearer " + token;
  }
  const response = await fetch(apiUrl(path), {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body,
    credentials: "omit",
  });
  const text = await response.text();
  let parsed: any = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const message =
      parsed !== null && typeof parsed.error === "string"
        ? parsed.error
        : `request failed (${response.status})`;
    if (
      sendAuth &&
      response.status === 401 &&
      message === NOT_SIGNED_IN &&
      getToken() === token
    ) {
      setToken(null);
    }
    throw new ApiError(response.status, message);
  }
  return parsed as T;
}

// --- typed wrappers for the endpoints in DESIGN.md ("HTTP API") ---------

let authConfigPromise: Promise<AuthConfig> | null = null;

/// `GET /api/auth/config`, fetched once per page load and shared.
export function fetchAuthConfig(): Promise<AuthConfig> {
  if (authConfigPromise === null) {
    authConfigPromise = apiFetch<AuthConfig>("/api/auth/config", {
      auth: false,
    }).catch((e) => {
      // Let a later caller retry (e.g. the backend was still starting).
      authConfigPromise = null;
      throw e;
    });
  }
  return authConfigPromise;
}

export function googleSignIn(
  credential: string,
): Promise<GoogleSignInResponse> {
  return apiFetch<GoogleSignInResponse>("/api/auth/google", {
    auth: false,
    body: { credential, device_id: deviceId() },
  });
}

export function googleComplete(
  pending: string,
  username: string,
): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/google/complete", {
    auth: false,
    body: { pending, username, device_id: deviceId() },
  });
}

/// `POST /api/auth/dev_login`. Only reachable when the server sets
/// `DEV_LOGIN=1` (local development); a 404 means it is off.
export function devLogin(username: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/dev_login", {
    auth: false,
    body: { username, device_id: deviceId() },
  });
}

export function me(): Promise<UserView> {
  return apiFetch<UserView>("/api/auth/me");
}

/// Revoke the session. Pass the in-memory session token (`AppState.auth
/// .token`) so that signing out still reaches the server after another
/// tab has removed or replaced the stored token; without it the stored
/// token is used.
export function logout(token?: string | null): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST", token });
}

export function logoutAll(token?: string | null): Promise<void> {
  return apiFetch<void>("/api/auth/logout_all", { method: "POST", token });
}

export function fetchLeaderboard(
  mode: RatingMode,
  limit: number = 50,
): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(
    `/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=${limit}`,
    { auth: false },
  );
}

/// `GET /api/users/:username` (public). A 404 means there is no such
/// account.
export function fetchProfile(username: string): Promise<ProfileView> {
  return apiFetch<ProfileView>(`/api/users/${encodeURIComponent(username)}`, {
    auth: false,
  });
}

/// `1512`. Ratings are plain integers: no rating deviation, no provisional
/// period.
export function formatRating(
  r: Pick<RatingView, "rating"> | null | undefined,
): string {
  if (r === null || r === undefined) {
    return "—";
  }
  return `${r.rating}`;
}

/// `2–1` (wins–losses), or `2–1–1` when there are draws.
export function formatRecord(
  r: Pick<RatingView, "wins" | "losses" | "draws"> | null | undefined,
): string {
  if (r === null || r === undefined) {
    return "—";
  }
  const record = `${r.wins}–${r.losses}`;
  return r.draws > 0 ? `${record}–${r.draws}` : record;
}

/// `2–1–0` (wins–losses–draws), for a table column of its own.
export function formatWinLossDraw(
  r: Pick<RatingView, "wins" | "losses" | "draws"> | null | undefined,
): string {
  if (r === null || r === undefined) {
    return "—";
  }
  return `${r.wins}–${r.losses}–${r.draws}`;
}

/// `1512 (3 matches, 2–1)`, or `1500 (no matches yet)`.
export function formatRatingWithRecord(
  r: RatingView | null | undefined,
): string {
  if (r === null || r === undefined) {
    return "—";
  }
  if (r.matches === 0) {
    return `${r.rating} (no matches yet)`;
  }
  const matches = r.matches === 1 ? "1 match" : `${r.matches} matches`;
  return `${r.rating} (${matches}, ${formatRecord(r)})`;
}

/// `+180` / `−180` (a real minus sign), for a rating change.
export function formatDelta(delta: number): string {
  return delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`;
}

/// A unix-seconds timestamp as a local date, e.g. "18 Sep 2026".
export function formatDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  if (isNaN(date.getTime())) {
    return "unknown";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
