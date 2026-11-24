import type { Message } from "./ChatMessage";

/// The most recent chat lines kept per room, so a reload (or a dropped tab)
/// does not empty the chat.
export const CHAT_HISTORY_LINES = 100;
/// Saved chat older than this is dropped.
const CHAT_HISTORY_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const PREFIX = "chat:";

interface Saved {
  at: number;
  messages: Message[];
}

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/// Remember `messages` (the last [`CHAT_HISTORY_LINES`]) for `room`.
export const saveChat = (room: string, messages: Message[]): void => {
  const s = storage();
  if (s === null || room.length === 0) {
    return;
  }
  const saved: Saved = {
    at: Date.now(),
    messages: messages.slice(-CHAT_HISTORY_LINES),
  };
  try {
    s.setItem(PREFIX + room, JSON.stringify(saved));
  } catch {
    // Storage full or blocked: the chat just is not restored.
  }
};

/// The saved chat of `room`; other rooms' stale entries are cleared on the way.
export const loadChat = (room: string): Message[] => {
  const s = storage();
  if (s === null || room.length === 0) {
    return [];
  }
  let result: Message[] = [];
  try {
    const now = Date.now();
    for (let i = s.length - 1; i >= 0; i--) {
      const key = s.key(i);
      if (key === null || !key.startsWith(PREFIX)) {
        continue;
      }
      let saved: Saved | null = null;
      try {
        saved = JSON.parse(s.getItem(key) ?? "null") as Saved | null;
      } catch {
        saved = null;
      }
      if (
        saved === null ||
        typeof saved.at !== "number" ||
        !Array.isArray(saved.messages) ||
        now - saved.at > CHAT_HISTORY_MAX_AGE_MS
      ) {
        s.removeItem(key);
      } else if (key === PREFIX + room) {
        result = saved.messages.slice(-CHAT_HISTORY_LINES);
      }
    }
  } catch {
    return result;
  }
  return result;
};
