import { AppState } from "./AppStateProvider";
import beep from "./beep";
import { GameMessage, RatingChange, RatingMode } from "./gen-types";
import { Message } from "./ChatMessage";
import { formatDelta, ladderName } from "./api";

const truncate =
  (length: number) =>
  <T>(array: T[]): T[] => {
    if (array.length > length) {
      return array.slice(array.length - length);
    } else {
      return array;
    }
  };
const truncateMessages = truncate(300);

const formatMatchRated = (mode: RatingMode, changes: RatingChange[]): string =>
  `Match rated (${ladderName(mode)}): ` +
  changes
    .map(
      (c) => `${c.username} ${c.before} → ${c.after} (${formatDelta(c.delta)})`,
    )
    .join(", ");

/// The chat line a server message stands for, or null if the chat does not
/// show it. Used for live messages and for the history sent on joining.
const chatLineOf = (message: GameMessage): Message | null => {
  if ("Message" in message) {
    return message.Message;
  } else if ("Broadcast" in message) {
    return {
      from: "GAME",
      message: message.Broadcast.message,
      data: message.Broadcast.data,
      from_game: true,
    };
  } else if ("System" in message) {
    return { from: "GAME", message: message.System.message, from_game: true };
  } else if ("MatchRated" in message) {
    const u = message.MatchRated;
    return {
      from: "GAME",
      message: formatMatchRated(u.mode, u.changes),
      from_game: true,
      ratings: { match_id: u.match_id, mode: u.mode, changes: u.changes },
    };
  }
  return null;
};

const appendMessage = (
  state: AppState,
  message: Message,
): Partial<AppState> => ({
  messages: truncateMessages([...state.messages, message]),
});

/// `ChatHistory` arrives once on joining: the room's recent chat, which
/// replaces what we have, keeping only lines that arrived live and are not
/// in it (matched one for one, so repeated lines are not lost).
const chatHistoryHandler: WebsocketHandler = (
  state: AppState,
  message: GameMessage,
) => {
  if (!("ChatHistory" in message)) {
    return null;
  }
  const history = message.ChatHistory.messages
    .map(chatLineOf)
    .filter((m): m is Message => m !== null);
  const unmatched = new Map<string, number>();
  for (const m of history) {
    const key = JSON.stringify(m);
    unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
  }
  const extra = state.messages.filter((m) => {
    const key = JSON.stringify(m);
    const left = unmatched.get(key) ?? 0;
    if (left > 0) {
      unmatched.set(key, left - 1);
      return false;
    }
    return true;
  });
  return { messages: truncateMessages([...history, ...extra]) };
};

type WebsocketHandler = (
  state: AppState,
  message: GameMessage,
) => Partial<AppState> | null;

/// Live chat: `Message`, `Broadcast`, `System` and `MatchRated` lines.
const chatHandler: WebsocketHandler = (
  state: AppState,
  message: GameMessage,
) => {
  const line = chatLineOf(message);
  return line === null ? null : appendMessage(state, line);
};

const errorHandler: WebsocketHandler = (
  state: AppState,
  message: GameMessage,
) => {
  if ("Error" in message) {
    return { errors: [...state.errors, message.Error] };
  } else {
    return null;
  }
};

const stateHandler: WebsocketHandler = (_: AppState, message: GameMessage) => {
  if ("State" in message) {
    return { gameState: message.State.state };
  } else {
    return null;
  }
};

const headerMessageHandler: WebsocketHandler = (
  _: AppState,
  message: GameMessage,
) => {
  if ("Header" in message) {
    return { headerMessages: message.Header.messages };
  } else {
    return null;
  }
};

const BEEP_MS = 2000;
let lastBeeped = performance.now() - BEEP_MS;
const beepHandler = (message: GameMessage): void => {
  if ("Beep" in message) {
    const now = performance.now();
    // Rate-limit beeps to prevent annoyance.
    if (now - lastBeeped >= BEEP_MS) {
      // Full volume and comically long: a beep is someone asking you to
      // hurry up. One at a time, so they never overlap.
      beep(100, 261.63, BEEP_MS);
      lastBeeped = now;
    }
  }
};

let lastReadyChecked = performance.now();
const readyCheckHandler = (
  message: GameMessage,
  send: (msg: any) => void,
): void => {
  if ("ReadyCheck" in message) {
    const now = performance.now();
    // Rate-limit beeps to prevent annoyance.
    if (now - lastReadyChecked >= 1000) {
      beep(3, 261.63, 200);
      lastReadyChecked = now;
      if (confirm("Are you ready to start the game?")) {
        send("Ready");
      }
    }
  }
};

const gameFinishedHandler: WebsocketHandler = (
  state: AppState,
  message: GameMessage,
) => {
  if (
    "Broadcast" in message &&
    message.Broadcast.data.variant.type === "GameFinished"
  ) {
    const result = message.Broadcast.data.variant.result;
    const updates: Partial<AppState> = {};
    if (state.name in result) {
      const ownResult = result[state.name];
      const gameStatistics = state.gameStatistics;

      const newGameStatistics = { ...gameStatistics };
      newGameStatistics.gamesPlayed++;
      if (ownResult.is_defending) {
        newGameStatistics.gamesPlayedAsDefending++;
        if (ownResult.is_landlord) {
          newGameStatistics.gamesPlayedAsLandlord++;
        }
      }

      if (ownResult.won_game) {
        newGameStatistics.gamesWon++;
        if (ownResult.is_defending) {
          newGameStatistics.gamesWonAsDefending++;
          if (ownResult.is_landlord) {
            newGameStatistics.gamesWonAsLandlord++;
          }
        }
      }

      newGameStatistics.ranksUp += ownResult.ranks_up;
      updates.gameStatistics = newGameStatistics;
    }
    const gameWinners = Object.entries(result)
      .filter((r) => r[1].confetti)
      .map((r) => r[0]);
    if (gameWinners.length > 0) {
      const group = gameWinners
        .join(", ")
        .replace(/, ((?:.(?!, ))+)$/, " and $1");
      updates.confetti = `${group} successfully defended on the final level!`;
    }
    if (
      updates.gameStatistics !== undefined ||
      updates.confetti !== undefined
    ) {
      return updates;
    }
  }
  return null;
};

const joinedHandler: WebsocketHandler = (_: AppState, message: GameMessage) => {
  if ("Joined" in message) {
    const j = message.Joined;
    return {
      name: j.username,
      seats: {
        username: j.username,
        names: j.names,
        playerIds: j.player_ids,
        playerMode: j.player_mode,
      },
    };
  } else {
    return null;
  }
};

const roomRatingsHandler: WebsocketHandler = (
  _: AppState,
  message: GameMessage,
) => {
  if ("RoomRatings" in message) {
    return {
      roomRatings: {
        mode: message.RoomRatings.mode,
        ratings: message.RoomRatings.ratings,
      },
    };
  } else {
    return null;
  }
};

/// `MatchRated` arrives once, after a rated match has ended: it feeds the
/// match summary modal (it is a chat line too, see `chatLineOf`).
const matchRatedHandler: WebsocketHandler = (
  _: AppState,
  message: GameMessage,
) => {
  if ("MatchRated" in message) {
    const u = message.MatchRated;
    return {
      lastMatchRated: {
        matchId: u.match_id,
        mode: u.mode,
        changes: u.changes,
      },
    };
  } else {
    return null;
  }
};

/// The `MatchFinished` broadcast opens the match summary modal (and any
/// `MatchRated` that follows fills in the rating changes).
const matchFinishedHandler: WebsocketHandler = (
  _: AppState,
  message: GameMessage,
) => {
  if (
    "Broadcast" in message &&
    message.Broadcast.data.variant.type === "MatchFinished"
  ) {
    const variant = message.Broadcast.data.variant;
    return {
      lastMatchFinished: {
        matchKey: variant.match_key,
        firstToRank: variant.first_to_rank,
        standings: variant.standings,
      },
      lastMatchRated: null,
    };
  } else if (
    "Broadcast" in message &&
    message.Broadcast.data.variant.type === "DdzMatchFinished"
  ) {
    const variant = message.Broadcast.data.variant;
    return {
      lastMatchFinished: {
        matchKey: variant.match_key,
        firstToRank: "",
        standings: [],
        ddz: { rounds: variant.rounds, standings: variant.standings },
      },
      lastMatchRated: null,
    };
  } else {
    return null;
  }
};

const allHandlers: WebsocketHandler[] = [
  chatHandler,
  chatHistoryHandler,
  errorHandler,
  stateHandler,
  headerMessageHandler,
  gameFinishedHandler,
  joinedHandler,
  roomRatingsHandler,
  matchRatedHandler,
  matchFinishedHandler,
];

const composedHandlers = (
  state: AppState,
  message: GameMessage,
  send: (msg: any) => void,
): Partial<AppState> => {
  let partials = {};
  allHandlers.forEach((h) => {
    const partial = h(state, message);
    partials = { ...partials, ...partial };
    state = { ...state, ...partial };
  });
  beepHandler(message);
  readyCheckHandler(message, send);
  return partials;
};

export default composedHandlers;
