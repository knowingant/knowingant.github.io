import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import * as api from "./api";

import type { JSX } from "react";

// ---------------------------------------------------------------------------
// Google Identity Services, loaded on demand (only when the backend has a
// GOOGLE_CLIENT_ID configured). Minimal typings for the bits we use.
// ---------------------------------------------------------------------------

interface GsiCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GsiButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
}

interface GsiId {
  initialize: (config: {
    client_id: string;
    callback: (response: GsiCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiPromise: Promise<GsiId> | null = null;

/// Inject the GSI script once and resolve with `google.accounts.id`.
export function loadGoogleIdentity(): Promise<GsiId> {
  if (gsiPromise !== null) {
    return gsiPromise;
  }
  gsiPromise = new Promise<GsiId>((resolve, reject) => {
    const existing = window.google?.accounts?.id;
    if (existing !== undefined) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id !== undefined) {
        resolve(id);
      } else {
        reject(new Error("Google sign-in script loaded but is unusable"));
      }
    };
    script.onerror = () => {
      reject(new Error("could not load the Google sign-in script"));
    };
    document.head.appendChild(script);
  }).catch((e) => {
    gsiPromise = null; // allow a retry on the next mount
    throw e;
  });
  return gsiPromise;
}

/// `GET /api/auth/config`, shared across the landing page.
export function useAuthConfig(): {
  config: api.AuthConfig | null;
  error: string | null;
} {
  const [config, setConfig] = React.useState<api.AuthConfig | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    api.fetchAuthConfig().then(
      (c) => {
        if (!cancelled) {
          setConfig(c);
        }
      },
      (e) => {
        if (!cancelled) {
          setError(api.errorMessage(e));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return { config, error };
}

interface IGoogleButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: GsiButtonConfig["text"];
}

/// The official "Sign in with Google" button. Each mount (re)initializes
/// GSI with its own callback, which is fine because only one of these is on
/// screen at a time (sign-in form vs. account bar).
export const GoogleButton = (props: IGoogleButtonProps): JSX.Element => {
  const { state } = React.useContext(AppStateContext);
  const container = React.useRef<HTMLDivElement>(null);
  const callbackRef = React.useRef(props.onCredential);
  callbackRef.current = props.onCredential;
  const [error, setError] = React.useState<string | null>(null);
  const dark = state.settings.darkMode;
  const text = props.text ?? "signin_with";

  React.useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity().then(
      (id) => {
        if (cancelled || container.current === null) {
          return;
        }
        id.initialize({
          client_id: props.clientId,
          callback: (r) => callbackRef.current(r.credential),
          ux_mode: "popup",
          auto_select: false,
          itp_support: true,
        });
        container.current.innerHTML = "";
        id.renderButton(container.current, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
        });
      },
      (e) => {
        if (!cancelled) {
          setError(api.errorMessage(e));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [props.clientId, text, dark]);

  return (
    <div className="google-button">
      <div ref={container} />
      {error !== null && (
        <p className="auth-error">Google sign-in is unavailable: {error}</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Startup: turn a stored token back into a session.
// ---------------------------------------------------------------------------

/// Mounted once at app start. If a token is stored, asks the server who we
/// are; a 401 means the token is dead and gets cleared. Either way
/// `authLoading` ends up false.
///
/// It also follows the stored token across tabs (the `storage` event):
/// signing out in another tab signs this one out, and signing in (or as
/// someone else) in another tab restores that session here.
export const AuthBootstrap = (): null => {
  const { state, updateState } = React.useContext(AppStateContext);
  // The token AppState currently holds, readable from the event listener
  // without a stale closure.
  const authTokenRef = React.useRef<string | null>(null);
  authTokenRef.current = state.auth?.token ?? null;

  React.useEffect(() => {
    // Only the most recent lookup may touch the state: a slow /me response
    // must not resurrect a session that was signed out while it was in
    // flight.
    let latest = 0;
    const restore = (): void => {
      const seq = ++latest;
      const token = api.getToken();
      if (token === null || token.length === 0) {
        updateState({ auth: null, authLoading: false });
        return;
      }
      api.me().then(
        (user) => {
          if (seq !== latest) {
            return;
          }
          updateState({
            auth: { token, user },
            name: user.username,
            authLoading: false,
          });
        },
        (e) => {
          if (seq !== latest) {
            return;
          }
          if (e instanceof api.ApiError && e.status === 401) {
            api.setToken(null);
          } else {
            // Network / server trouble: keep the token so a refresh retries,
            // but show the sign-in form rather than spinning forever.
            console.error("could not restore session:", e);
          }
          updateState({ auth: null, authLoading: false });
        },
      );
    };
    restore();

    const onStorage = (event: StorageEvent): void => {
      // `key === null` is another tab calling localStorage.clear().
      if (event.key !== null && event.key !== api.TOKEN_KEY) {
        return;
      }
      if (api.getToken() !== authTokenRef.current) {
        restore();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      latest++;
    };
  }, []);
  return null;
};

// ---------------------------------------------------------------------------
// The signed-out landing panel: Google sign-in (plus a dev login locally).
// ---------------------------------------------------------------------------

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

function usernameProblem(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "Usernames are 3–20 characters: letters, digits and underscores only.";
  }
  return null;
}

/// Why there is no password field anywhere on this site.
export const VibecodedNotice = (): JSX.Element => (
  <div className="auth-warning" role="note">
    <p>
      <strong>Heads up:</strong> this site is <strong>vibecoded</strong> and run
      by an <strong>idiot</strong>. That is exactly why there are no passwords:
      Google handles signing in, and nothing secret is stored here. All this
      site keeps is your username, your ratings and your game history.
    </p>
  </div>
);

export const NoAltsRule = (): JSX.Element => (
  <div className="auth-rule">
    <p>
      <strong>One account per person. Do not make alts.</strong> Matches are
      rated, and the site records which browser each account signs in from: a
      match between accounts that have shared a device is not rated, and it is
      obvious. Two accounts means both get removed.
    </p>
  </div>
);

const Auth = (): JSX.Element => {
  const { updateState } = React.useContext(AppStateContext);
  const { config, error: configError } = useAuthConfig();

  const [devUsername, setDevUsername] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Google sign-in for an account we have not seen before.
  const [pending, setPending] = React.useState<api.NeedsUsername | null>(null);
  const [pickedUsername, setPickedUsername] = React.useState<string>("");

  const finish = (session: api.AuthSession): void => {
    api.setToken(session.token);
    updateState({
      auth: session,
      name: session.user.username,
      authLoading: false,
    });
  };

  const handleDevLogin = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (busy) {
      return;
    }
    const name = devUsername.trim();
    const problem = usernameProblem(name);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      finish(await api.devLogin(name));
    } catch (e) {
      setError(api.errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async (credential: string): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const response = await api.googleSignIn(credential);
      if (api.isNeedsUsername(response)) {
        setPending(response);
        setPickedUsername(response.suggested_username);
      } else {
        finish(response);
      }
    } catch (e) {
      setError(api.errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (busy || pending === null) {
      return;
    }
    const name = pickedUsername.trim();
    const problem = usernameProblem(name);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      finish(await api.googleComplete(pending.pending, name));
    } catch (e) {
      setError(api.errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const googleClientId = config?.google_client_id ?? null;
  const devLoginEnabled = config?.dev_login === true;

  if (pending !== null) {
    return (
      <div className="auth">
        <h2>Almost there</h2>
        <p>
          Your Google account is verified. Pick the username other players will
          see (3&ndash;20 characters: letters, digits, underscores). You cannot
          change it later.
        </p>
        <form className="auth-form" onSubmit={handleComplete}>
          <label>
            <strong>Username:</strong>{" "}
            <input
              type="text"
              value={pickedUsername}
              onChange={(e) => setPickedUsername(e.target.value)}
              autoComplete="username"
              maxLength={20}
              autoFocus={true}
            />
          </label>
          <NoAltsRule />
          {error !== null && <p className="auth-error">{error}</p>}
          <div>
            <input type="submit" value="Create account" disabled={busy} />{" "}
            <button
              type="button"
              className="normal"
              onClick={() => {
                setPending(null);
                setError(null);
              }}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="auth">
      <p>
        You need an account to play: in-game names are account names, and
        matches are rated. Sign in with Google below.
      </p>
      <VibecodedNotice />

      {googleClientId !== null && (
        <div className="auth-google">
          <GoogleButton
            clientId={googleClientId}
            onCredential={(credential) => {
              handleGoogle(credential).catch((e) => console.error(e));
            }}
            text="continue_with"
          />
          <p className="auth-hint">
            The first time you sign in you pick the username other players will
            see. There is nothing else to set up, and no password to forget.
          </p>
        </div>
      )}

      {devLoginEnabled && (
        <div className="auth-dev">
          {googleClientId !== null && <p className="auth-or">or</p>}
          <h4>Dev sign-in (local testing only)</h4>
          <p className="auth-hint">
            This server has <code>DEV_LOGIN</code> turned on: any username signs
            in (and is created) without any verification. It is never on in
            production.
          </p>
          <form className="auth-form" onSubmit={handleDevLogin}>
            <label>
              <strong>Username:</strong>{" "}
              <input
                type="text"
                value={devUsername}
                onChange={(e) => setDevUsername(e.target.value)}
                autoComplete="username"
                maxLength={20}
              />
            </label>
            <div>
              <input type="submit" value="Dev sign-in" disabled={busy} />
            </div>
          </form>
        </div>
      )}

      {googleClientId === null && !devLoginEnabled && config !== null && (
        <p className="auth-error">
          Sign-in is not configured on this server: it has no Google client ID
          and no dev login, so there is no way to make or use an account. If
          this is your server, set <code>GOOGLE_CLIENT_ID</code>.
        </p>
      )}

      <NoAltsRule />
      {error !== null && <p className="auth-error">{error}</p>}
      {configError !== null && (
        <p className="auth-hint">
          (Could not check how sign-in is configured on this server:{" "}
          {configError})
        </p>
      )}
    </div>
  );
};

export default Auth;
