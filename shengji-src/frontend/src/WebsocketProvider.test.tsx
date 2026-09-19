// Tests for the backend URL helpers in api.ts (`apiHost`, `apiUrl`, `wsUrl`)
// that WebsocketProvider and every fetch go through. These are pure
// functions of `window._API_HOST` (set by runtime.js) and `location`, so the
// tests run in the plain node environment with those globals stubbed.
import { apiHost, apiUrl, wsUrl } from "./api";

const setLocation = (
  protocol: string,
  host: string,
  pathname: string,
): void => {
  (global as any).location = { protocol, host, pathname };
};

describe("api.ts URL helpers", () => {
  beforeEach(() => {
    (global as any).window = { _API_HOST: undefined };
    setLocation("https:", "example.com", "/game/");
  });

  describe("apiHost", () => {
    it("is empty when _API_HOST is unset", () => {
      expect(apiHost()).toBe("");
    });

    it("is empty when _API_HOST is null or empty", () => {
      (global as any).window._API_HOST = null;
      expect(apiHost()).toBe("");
      (global as any).window._API_HOST = "";
      expect(apiHost()).toBe("");
    });

    it("strips trailing slashes from _API_HOST", () => {
      (global as any).window._API_HOST = "https://api.example.com/";
      expect(apiHost()).toBe("https://api.example.com");
      (global as any).window._API_HOST = "https://api.example.com///";
      expect(apiHost()).toBe("https://api.example.com");
    });
  });

  describe("wsUrl", () => {
    it("derives wss:// from an https _API_HOST", () => {
      (global as any).window._API_HOST = "https://api.example.com";
      expect(wsUrl()).toBe("wss://api.example.com/api");
    });

    it("derives ws:// from an http _API_HOST", () => {
      (global as any).window._API_HOST = "http://localhost:3030";
      expect(wsUrl()).toBe("ws://localhost:3030/api");
    });

    it("ignores a trailing slash on _API_HOST", () => {
      (global as any).window._API_HOST = "https://api.example.com/";
      expect(wsUrl()).toBe("wss://api.example.com/api");
    });

    it("uses the page location when _API_HOST is unset", () => {
      expect(wsUrl()).toBe("wss://example.com/game/api");
    });

    it("uses the page location when _API_HOST is null or empty", () => {
      (global as any).window._API_HOST = null;
      expect(wsUrl()).toBe("wss://example.com/game/api");
      (global as any).window._API_HOST = "";
      expect(wsUrl()).toBe("wss://example.com/game/api");
    });

    it("uses ws:// for a non-https page", () => {
      setLocation("http:", "localhost:3000", "/");
      expect(wsUrl()).toBe("ws://localhost:3000/api");
    });

    it("inserts a slash when the pathname does not end with one", () => {
      setLocation("https:", "example.com", "/game");
      expect(wsUrl()).toBe("wss://example.com/game/api");
    });
  });

  describe("apiUrl", () => {
    it("prefixes absolute paths with _API_HOST", () => {
      (global as any).window._API_HOST = "https://api.example.com";
      expect(apiUrl("/api/auth/me")).toBe(
        "https://api.example.com/api/auth/me",
      );
    });

    it("prefixes relative paths with _API_HOST and a slash", () => {
      (global as any).window._API_HOST = "https://api.example.com/";
      expect(apiUrl("public_games.json")).toBe(
        "https://api.example.com/public_games.json",
      );
    });

    it("resolves absolute paths against the page directory when same-origin", () => {
      setLocation("https:", "example.com", "/shengji/");
      expect(apiUrl("/api/rpc")).toBe("/shengji/api/rpc");
    });

    it("drops the page's file name when resolving same-origin absolute paths", () => {
      setLocation("https:", "example.com", "/shengji/index.html");
      expect(apiUrl("/api/rpc")).toBe("/shengji/api/rpc");
    });

    it("keeps same-origin absolute paths at the root", () => {
      setLocation("https:", "example.com", "/");
      expect(apiUrl("/api/rpc")).toBe("/api/rpc");
    });

    it("leaves relative paths alone when same-origin", () => {
      expect(apiUrl("default_settings.json")).toBe("default_settings.json");
    });
  });
});
