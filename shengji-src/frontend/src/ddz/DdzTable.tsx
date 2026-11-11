import * as React from "react";
import classNames from "classnames";
import Card from "../Card";
import Players from "../Players";
import { WebsocketContext } from "../WebsocketProvider";
import { useEngine } from "../useEngine";
import { formatDelta } from "../api";
import { DdzPhase } from "../gen-types";
import DdzHand from "./DdzHand";
import { DdzTitle } from "./DdzLobby";
import { DDZ_TRUMP, sortDdz } from "./ddzCards";

import type { JSX } from "react";

interface IProps {
  state: DdzPhase;
  name: string;
}

const LANDLORD = " (地主)";

/// A row of small cards that overlap more as they get crowded, so a seat's
/// box keeps its size whatever is played into it.
const Fan = (props: { cards: string[] }): JSX.Element => (
  <div className="ddz-fan">
    {props.cards.map((card, idx) => (
      <div className="ddz-fan-card" key={idx}>
        <Card card={card} trump={DDZ_TRUMP} plain={true} smaller={true} />
      </div>
    ))}
  </div>
);

/// A Dou Di Zhu match in progress: the three seats with what each last did,
/// the bottom cards, and this player's hand and choices.
const DdzTable = (props: IProps): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);
  const engine = useEngine();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [canPlay, setCanPlay] = React.useState<boolean>(false);

  const { propagated, game } = props.state;
  const round = game.round;
  const players = propagated.players;
  const nameOf = (seat: number): string =>
    players.find((p) => p.id === game.seats[seat])?.name ?? "";
  const me = players.find((p) => p.name === props.name);
  const mySeat = me === undefined ? -1 : game.seats.indexOf(me.id);
  const landlord = round.landlord ?? null;
  const myTurn = mySeat >= 0 && round.turn === mySeat;
  const hand = mySeat >= 0 ? round.hands[mySeat] : [];
  const last = round.last_play ?? null;
  const act = (action: unknown): void => send({ Action: { Ddz: action } });

  // Cards that left the hand can't stay selected.
  const handKey = sortDdz(hand).join("");
  React.useEffect(() => {
    setSelected((s) => {
      const left = [...hand];
      const kept = s.filter((c) => {
        const i = left.indexOf(c);
        if (i < 0) {
          return false;
        }
        left.splice(i, 1);
        return true;
      });
      return kept.length === s.length ? s : kept;
    });
  }, [handKey]);

  const playing = round.stage === "Playing" && myTurn;
  const lastKey = JSON.stringify(last?.play ?? null);
  const selectedKey = sortDdz(selected).join("");
  React.useEffect(() => {
    if (!playing || selected.length === 0) {
      setCanPlay(false);
      return;
    }
    let cancelled = false;
    engine
      .ddzPlays({ hand: [], selected, last: last?.play ?? null })
      .then((r) => {
        if (!cancelled) {
          setCanPlay(r.play !== null && r.play !== undefined);
        }
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, [playing, selectedKey, lastKey, engine]);

  const scores: { [id: number]: string } = {};
  game.seats.forEach((id, seat) => {
    scores[id] = `(${formatDelta(game.totals[seat])})`;
  });

  /// What a seat's box shows: its cards on the table, or a word.
  const seatNote = (seat: number): string => {
    if (round.stage === "Bidding") {
      const bid = round.bids[seat];
      if (bid === null || bid === undefined) {
        return "";
      }
      if (bid === 0) {
        return "Pass";
      }
      if (game.settings.bidding === "CallScore") {
        return `${bid}`;
      }
      return round.caller === seat ? "Call" : "Grab";
    }
    if (round.stage === "Doubling") {
      const d = round.doubles[seat];
      if (d === null || d === undefined) {
        return "";
      }
      const word = seat === landlord ? "Redouble" : "Double";
      return d ? word : `No ${word.toLowerCase()}`;
    }
    const shown = round.table[seat];
    return shown !== null && shown !== undefined && shown.length === 0
      ? "Pass"
      : "";
  };

  const seatCards = (seat: number): string[] => {
    if (round.stage === "Finished") {
      // Everyone's remaining cards, except the last play of the winner.
      return round.hands[seat].length > 0
        ? sortDdz(round.hands[seat])
        : (round.table[seat] ?? []);
    }
    if (round.stage !== "Playing") {
      return [];
    }
    return round.table[seat] ?? [];
  };

  const result = round.result ?? null;

  const seats = game.seats.map((id, seat) => {
    const cards = seatCards(seat);
    const note = seatNote(seat);
    return (
      <div
        key={id}
        className={classNames("labeled-play", "ddz-seat", {
          landlord: seat === landlord,
        })}
      >
        {cards.length > 0 ? (
          <Fan cards={cards} />
        ) : (
          <div className="ddz-fan ddz-note">{note}</div>
        )}
        <div className={classNames("label", { next: round.turn === seat })}>
          {nameOf(seat)}
          {seat === landlord ? LANDLORD : ""}
          {result !== null
            ? ` ${formatDelta(result.deltas[seat])}`
            : ` · ${round.hands[seat].length}`}
        </div>
      </div>
    );
  });

  const info: string[] = [];
  if (landlord !== null) {
    info.push(`Stake ${round.stake}`);
    const doubled = round.doubles.filter(
      (d, seat) => seat !== landlord && d === true,
    ).length;
    if (doubled > 0) {
      info.push(round.doubles[landlord] === true ? "redoubled" : "doubled");
    }
    if (round.bombs > 0) {
      info.push(`bombs ${round.bombs}`);
    }
    if (result?.spring === true) {
      info.push("spring");
    }
  }

  let actions: JSX.Element | null = null;
  if (mySeat >= 0) {
    if (round.stage === "Bidding" && myTurn) {
      actions =
        game.settings.bidding === "CallScore" ? (
          <>
            <button className="big" onClick={() => act({ Bid: 0 })}>
              Pass
            </button>
            {[1, 2, 3].map((n) => (
              <button
                className="big"
                key={n}
                disabled={n <= round.stake}
                onClick={() => act({ Bid: n })}
              >
                {n}
              </button>
            ))}
          </>
        ) : (
          <>
            <button className="big" onClick={() => act({ Bid: 0 })}>
              Pass
            </button>
            <button className="big" onClick={() => act({ Bid: 1 })}>
              {round.caller === null || round.caller === undefined
                ? "Call"
                : "Grab"}
            </button>
          </>
        );
    } else if (
      round.stage === "Doubling" &&
      (round.doubles[mySeat] === null || round.doubles[mySeat] === undefined) &&
      (mySeat !== landlord || myTurn)
    ) {
      const word = mySeat === landlord ? "Redouble" : "Double";
      actions = (
        <>
          <button className="big" onClick={() => act({ Double: false })}>
            No {word.toLowerCase()}
          </button>
          <button className="big" onClick={() => act({ Double: true })}>
            {word}
          </button>
        </>
      );
    } else if (round.stage === "Playing" && myTurn) {
      actions = (
        <>
          <button
            className="big"
            disabled={last === null}
            onClick={() => act("Pass")}
          >
            Pass
          </button>
          <button
            className="big"
            disabled={!canPlay}
            onClick={() => act({ Play: selected })}
          >
            Play
          </button>
        </>
      );
    } else if (round.stage === "Finished") {
      actions = (
        <button className="big" onClick={() => act("NextRound")}>
          {game.round_number >= game.settings.rounds
            ? "End match"
            : "Next round"}
        </button>
      );
    }
  }

  return (
    <div>
      <DdzTitle />
      <Players
        players={players}
        observers={propagated.observers}
        landlord={landlord === null ? null : game.seats[landlord]}
        next={
          round.turn === null || round.turn === undefined
            ? null
            : game.seats[round.turn]
        }
        name={props.name}
        hideRank={true}
        scores={scores}
        landlordLabel={LANDLORD}
      />
      <div className="ddz-table">
        {seats}
        <div className="labeled-play ddz-seat">
          <Fan cards={round.bottom} />
          <div className="label">Bottom</div>
        </div>
      </div>
      <p className="ddz-info">{info.join(" · ")}</p>
      {mySeat >= 0 ? <div className="ddz-actions">{actions}</div> : null}
      {mySeat >= 0 && round.stage !== "Finished" ? (
        <DdzHand cards={hand} selected={selected} onSelect={setSelected} />
      ) : null}
    </div>
  );
};

export default DdzTable;
