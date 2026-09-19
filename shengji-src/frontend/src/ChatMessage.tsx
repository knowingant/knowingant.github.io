import * as React from "react";
import InlineCard from "./InlineCard";
import classNames from "classnames";
import ArrayUtil from "./util/array";
import {
  BroadcastMessage,
  MessageVariant,
  RatingChange,
  RatingMode,
} from "./gen-types";
import { formatDelta } from "./api";

import type { JSX } from "react";

export interface Message {
  from: string;
  message: string;
  data?: BroadcastMessage;
  from_game?: boolean;
  /// Set for `MatchRated` server messages.
  ratings?: MatchRatedUpdate;
}

export interface MatchRatedUpdate {
  match_id: number;
  mode: RatingMode;
  changes: RatingChange[];
}

const ladderName = (mode: RatingMode): string =>
  mode === "1v1" ? "1v1 ladder" : "team ladder";

const renderMessage = (message: Message): JSX.Element => {
  const variant = message.data?.variant;
  switch (variant?.type) {
    case "StartVote":
      return (
        <span>
          {message.data?.actor_name} is ready to start ({variant.votes}/
          {variant.needed})
        </span>
      );
    case "MatchStarted":
      return <span>Match started: first to rank {variant.first_to_rank}</span>;
    case "FirstToRankSet":
      return (
        <span>
          {message.data?.actor_name} set the match to first to rank{" "}
          {variant.rank}
        </span>
      );
    case "MatchAbandoned":
      return (
        <span>
          The match was abandoned because a player left; everyone is back at
          rank 2
        </span>
      );
    case "GameEndedAutomatically":
      return (
        <span>
          The remaining cards can&apos;t change the result, so this round is
          over
        </span>
      );
    case "MadeBid":
      return (
        <span>
          {message.data?.actor_name} bid{" "}
          {ArrayUtil.range(variant.count, (i) => (
            <InlineCard card={variant.card} key={i} />
          ))}
        </span>
      );
    case "PlayedCards":
      return (
        <span>
          {message.data?.actor_name} played{" "}
          {variant.cards.map((card, i) => (
            <InlineCard card={card} key={i} />
          ))}
        </span>
      );
    case "EndOfGameKittyReveal":
      return (
        <span>
          {variant.cards.map((card, i) => (
            <InlineCard card={card} key={i} />
          ))}{" "}
          in kitty
        </span>
      );
    case "GameScoringParametersChanged":
      return renderScoringMessage(message);
    default:
      return <span>{message.message}</span>;
  }
};

const renderScoringMessage = (message: Message): JSX.Element => {
  const changes = [];
  const variant = message.data?.variant;
  if (variant?.type === "GameScoringParametersChanged") {
    if (
      variant.old_parameters.step_size_per_deck !==
      variant.parameters.step_size_per_deck
    ) {
      changes.push(
        <span key={changes.length}>
          step size: {variant.parameters.step_size_per_deck}分 per deck
        </span>,
      );
    }
    if (
      variant.old_parameters.deadzone_size !== variant.parameters.deadzone_size
    ) {
      changes.push(
        <span key={changes.length}>
          non-leveling steps: {variant.parameters.deadzone_size}{" "}
        </span>,
      );
    }
    if (
      variant.old_parameters.num_steps_to_non_landlord_turnover !==
      variant.parameters.num_steps_to_non_landlord_turnover
    ) {
      changes.push(
        <span key={changes.length}>
          steps to turnover:{" "}
          {variant.parameters.num_steps_to_non_landlord_turnover}{" "}
        </span>,
      );
    }
    for (const k in variant.parameters.step_adjustments) {
      const adj = variant.parameters.step_adjustments[k];
      if (adj !== variant.old_parameters.step_adjustments[k]) {
        changes.push(
          <span key={changes.length}>
            step size adjustment for {k} decks set to {adj}{" "}
          </span>,
        );
      }
    }
    for (const k in variant.old_parameters.step_adjustments) {
      const adj = variant.parameters.step_adjustments[k];
      if (adj === undefined || adj === null || adj === 0) {
        changes.push(
          <span key={changes.length}>adjustment for {k} decks removed </span>,
        );
      }
    }
    if (
      variant.old_parameters.bonus_level_policy !==
      variant.parameters.bonus_level_policy
    ) {
      if (
        variant.parameters.bonus_level_policy ===
        "BonusLevelForSmallerLandlordTeam"
      ) {
        changes.push(
          <span key={changes.length}>small-team bonus enabled</span>,
        );
      } else {
        changes.push(
          <span key={changes.length}>small-team bonus disabled</span>,
        );
      }
    }
    return (
      <span>
        {message.data?.actor_name} updated the scoring parameters: {changes}
      </span>
    );
  } else {
    return <></>;
  }
};

/// A `MatchRated` message: one line per user, "alice 1500 → 1680 (+180)".
/// Ratings only move at the end of a rated match.
const renderMatchRated = (
  message: Message,
  ratings: MatchRatedUpdate,
): JSX.Element => (
  <div
    className={classNames("message", "ratings-update", {
      "game-message": message.from_game,
    })}
  >
    <span>{message.from}: </span>
    <span>Match rated ({ladderName(ratings.mode)})</span>
    <ul>
      {ratings.changes.map((c) => (
        <li key={c.username}>
          <span className="ratings-update-user">{c.username}</span> {c.before} →{" "}
          {c.after}{" "}
          <span
            className={classNames("ratings-update-delta", {
              up: c.delta > 0,
              down: c.delta < 0,
            })}
          >
            ({formatDelta(c.delta)})
          </span>
        </li>
      ))}
    </ul>
  </div>
);

/// A `MatchFinished` broadcast: the final standings, winners marked. (It
/// gets a block of its own rather than going through `renderMessage`, which
/// renders into a `<p>`.)
const renderMatchFinished = (
  message: Message,
  variant: Extract<MessageVariant, { type: "MatchFinished" }>,
): JSX.Element => (
  <div
    className={classNames("message", "match-finished", {
      "game-message": message.from_game,
    })}
  >
    <span>{message.from}: </span>
    <span>Match over &mdash; first to rank {variant.first_to_rank}</span>
    <ul>
      {variant.standings.map((s) => (
        <li key={s.player} className={classNames({ winner: s.winner })}>
          {s.winner ? "🏆 " : ""}
          {s.name} &mdash; rank {s.rank} ({s.levels}{" "}
          {s.levels === 1 ? "level" : "levels"})
        </li>
      ))}
    </ul>
  </div>
);

interface IProps {
  message: Message;
}
const ChatMessage = (props: IProps): JSX.Element => {
  const { message } = props;
  if (message.ratings !== undefined && message.ratings !== null) {
    return renderMatchRated(message, message.ratings);
  }
  const variant = message.data?.variant;
  if (variant?.type === "MatchFinished") {
    return renderMatchFinished(message, variant);
  }
  return (
    <>
      {message.data?.variant.type === "StartingGame" ? (
        <p
          className={classNames("message", {
            "game-message": message.from_game,
          })}
        >
          🚜 🚜 🚜 🚜 🚜 🚜 🚜 🚜 🚜 🚜 🚜 🚜
        </p>
      ) : null}
      <p
        className={classNames("message", { "game-message": message.from_game })}
      >
        {"from" in message && <span>{message.from}: </span>}
        {renderMessage(message)}
      </p>
    </>
  );
};

export default ChatMessage;
