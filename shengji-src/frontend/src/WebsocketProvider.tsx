import * as React from "react";
import { AppStateContext } from "./AppStateProvider";
import websocketHandler from "./websocketHandler";
import { TimerContext } from "./TimerProvider";
import memoize from "./memoize";
import WasmContext from "./WasmContext";
import { GameMessage } from "./gen-types";
import { wsUrl } from "./api";

import type { JSX } from "react";

interface Context {
  send: (value: any) => void;
}

export const WebsocketContext = React.createContext<Context>({
  send: () => {},
});

interface IProps {
  children: JSX.Element[] | JSX.Element;
}

interface IBlobToArrayBufferQueue {
  enqueue: (blob: Blob, handler: (arr: ArrayBuffer) => void) => void;
}

const getFileReader: () => IBlobToArrayBufferQueue = memoize(() => {
  const queue: Array<{ blob: Blob; handler: (arr: ArrayBuffer) => void }> = [];
  const fr = new FileReader();
  fr.onload = () => {
    const next = queue.shift();
    if (next !== undefined) {
      next.handler(fr.result as ArrayBuffer);
      if (queue.length > 0) {
        fr.readAsArrayBuffer(queue[0].blob);
      }
    }
  };
  return {
    enqueue: (blob: Blob, handler: (arr: ArrayBuffer) => void) => {
      queue.push({ blob, handler });
      if (
        queue.length > 0 &&
        (fr.readyState === FileReader.EMPTY ||
          fr.readyState === FileReader.DONE)
      ) {
        fr.readAsArrayBuffer(queue[0].blob);
      }
    },
  };
});

const getBlobArrayBuffer: () => IBlobToArrayBufferQueue = memoize(() => {
  const queue: Array<{ blob: Blob; handler: (arr: ArrayBuffer) => void }> = [];
  const inflight: number[] = [];
  const onload = (arr: ArrayBuffer): void => {
    const next = queue.shift();
    if (next !== undefined) {
      inflight.shift();
      next.handler(arr);
      if (queue.length > 0) {
        inflight.push(0);
        queue[0].blob.arrayBuffer().then(onload, (err) => console.log(err));
      }
    }
  };
  return {
    enqueue: (blob: Blob, handler: (arr: ArrayBuffer) => void) => {
      queue.push({ blob, handler });
      if (inflight.length === 0 && queue.length > 0) {
        inflight.push(0);
        blob.arrayBuffer().then(onload, (err) => console.log(err));
      }
    },
  };
});

/// Decode a binary frame from the server. Frames are normally zstd
/// compressed and go through the WASM decoder, but the no-WASM fallback
/// cannot decompress, and the backend sends some messages (pre-join errors)
/// as plain JSON bytes, so fall back to reading the bytes as UTF-8 JSON.
/// Returns null when neither works.
export function decodeBinaryMessage(
  buf: ArrayBuffer,
  decode: (bytes: Uint8Array) => unknown,
): GameMessage | null {
  try {
    return decode(new Uint8Array(buf)) as GameMessage;
  } catch (e) {
    console.warn("could not decode a binary message; trying plain JSON:", e);
  }
  try {
    return JSON.parse(new TextDecoder().decode(buf)) as GameMessage;
  } catch (e) {
    console.error("could not decode a message from the server:", e);
    return null;
  }
}

const WebsocketProvider: React.FunctionComponent<
  React.PropsWithChildren<IProps>
> = (props: IProps) => {
  const { state, updateState } = React.useContext(AppStateContext);
  const { decodeWireFormat } = React.useContext(WasmContext);
  const { setTimeout, clearTimeout } = React.useContext(TimerContext);
  const [timer, setTimer] = React.useState<number | null>(null);
  // The socket is opened lazily, on the first `send` (i.e. when the user
  // joins a room), not on page load: the server hangs up on sockets that
  // don't authenticate within a few seconds, and people sit on the landing
  // page (signing in, reading the rules) for much longer than that.
  const wsRef = React.useRef<WebSocket | null>(null);
  const pendingRef = React.useRef<string[]>([]);

  // Because state/updateState are passed in and change every time something
  // happens, we need to maintain a reference to these props to prevent stale
  // closures which may happen if state/updateState is changed between when an
  // event listener is registered and when it fires.
  // https://reactjs.org/docs/hooks-faq.html#why-am-i-seeing-stale-props-or-state-inside-my-function
  const stateRef = React.useRef(state);
  const updateStateRef = React.useRef(updateState);
  const timerRef = React.useRef(timer);
  const setTimerRef = React.useRef(setTimer);
  const setTimeoutRef = React.useRef(setTimeout);
  const clearTimeoutRef = React.useRef(clearTimeout);
  const decodeRef = React.useRef(decodeWireFormat);

  React.useEffect(() => {
    stateRef.current = state;
    updateStateRef.current = updateState;
  }, [state, updateState]);

  React.useEffect(() => {
    setTimeoutRef.current = setTimeout;
    clearTimeoutRef.current = clearTimeout;
  }, [setTimeout, clearTimeout]);

  React.useEffect(() => {
    timerRef.current = timer;
    setTimerRef.current = setTimer;
  }, [timer, setTimerRef]);

  React.useEffect(() => {
    decodeRef.current = decodeWireFormat;
  }, [decodeWireFormat]);

  const handleMessage = (ws: WebSocket, message: GameMessage): void => {
    if (message && typeof message === "object" && "Kicked" in message) {
      ws.close();
    } else {
      updateStateRef.current({
        connected: true,
        everConnected: true,
        ...websocketHandler(stateRef.current, message, (msg) => {
          ws.send(JSON.stringify(msg));
        }),
      });
    }
  };

  /// Returns an open or connecting socket, creating one if needed.
  const connect = (): WebSocket => {
    const existing = wsRef.current;
    if (
      existing !== null &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return existing;
    }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      updateStateRef.current({ connected: true, everConnected: true });
      const pending = pendingRef.current;
      pendingRef.current = [];
      pending.forEach((m) => ws.send(m));
    });
    ws.addEventListener("close", () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      pendingRef.current = [];
      updateStateRef.current({ connected: false });
    });
    ws.addEventListener("error", () => {
      // Only surface connection failures on the landing page; in a room the
      // "disconnected, please refresh" screen takes over.
      if (stateRef.current.gameState === null) {
        updateStateRef.current({
          errors: [
            ...stateRef.current.errors,
            "Could not connect to the game server; please try again.",
          ],
        });
      }
    });
    ws.addEventListener("message", (event: MessageEvent) => {
      if (timerRef.current !== null) {
        clearTimeoutRef.current(timerRef.current);
      }
      setTimerRef.current(null);

      // Check if the message is text (uncompressed JSON) or binary (compressed)
      if (typeof event.data === "string") {
        // Plain text JSON message (uncompressed)
        try {
          handleMessage(ws, JSON.parse(event.data));
        } catch (e) {
          console.error("Failed to parse JSON message:", e);
        }
      } else {
        // Binary message (compressed)
        const f = (buf: ArrayBuffer): void => {
          const message = decodeBinaryMessage(buf, decodeRef.current);
          if (message === null) {
            updateStateRef.current({
              errors: [
                ...stateRef.current.errors,
                "Could not decode a message from the server.",
              ],
            });
            return;
          }
          handleMessage(ws, message);
        };

        if (event.data.arrayBuffer !== undefined) {
          const b2a = getBlobArrayBuffer();
          b2a.enqueue(event.data, f);
        } else {
          const frs = getFileReader();
          frs.enqueue(event.data, f);
        }
      }
    });
    return ws;
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeoutRef.current(timerRef.current);
      }
      if (wsRef.current !== null) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const send = (value: any): void => {
    if (timerRef.current !== null) {
      clearTimeoutRef.current(timerRef.current);
    }
    // We expect a response back from the server within 5 seconds. Otherwise,
    // we should assume we have lost our websocket connection.

    const localTimerRef = setTimeoutRef.current(() => {
      if (timerRef.current === localTimerRef) {
        updateStateRef.current({ connected: false });
      }
    }, 5000);

    setTimerRef.current(localTimerRef);
    const ws = connect();
    const payload = JSON.stringify(value);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else {
      pendingRef.current.push(payload);
    }
  };

  return (
    <WebsocketContext.Provider value={{ send }}>
      {props.children}
    </WebsocketContext.Provider>
  );
};

export default WebsocketProvider;
