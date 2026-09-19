/* tslint:disable:max-classes-per-file variable-name forin */
import * as React from "react";
import { DrawPhase, Player, Trump } from "./gen-types";
import Header from "./Header";
import Players from "./Players";
import LabeledPlay from "./LabeledPlay";
import BeepButton from "./BeepButton";
import BidArea from "./BidArea";
import InlineCard from "./InlineCard";
import { WebsocketContext } from "./WebsocketProvider";

import type { JSX } from "react";

interface IDrawProps {
  state: DrawPhase;
  playDrawCardSound: boolean;
  autodrawSpeedMs: number | null;
  name: string;
  setTimeout: (fn: () => void, timeout: number) => number;
  clearTimeout: (id: number) => void;
  /// Hide the shared board (header, player list, kitty) and only render this
  /// seat's bid area, buttons and hand. Used for the second seat in 1v1.
  compact?: boolean;
}

interface IDrawInnerProps extends IDrawProps {
  /// Seat-bound send from `WebsocketContext` (see `SeatProvider`).
  send: (msg: any) => void;
}

interface IDrawState {
  autodraw: boolean;
}

/// Who should act next in the Draw phase: the player at `position` while
/// cards remain, otherwise the last bidder (who picks up the kitty).
export const drawNextPlayer = (state: DrawPhase): number => {
  if (state.deck.length === 0 && state.bids.length > 0) {
    return state.bids[state.bids.length - 1].id;
  }
  return state.propagated.players[state.position].id;
};

/// Delay before re-sending a draw for a state we already drew from (the
/// previous draw is either still in flight or was rejected).
const AUTODRAW_RETRY_MS = 1000;

class DrawInner extends React.Component<IDrawInnerProps, IDrawState> {
  private timeout: number | null = null;
  /// The draw-state key the pending timer was armed for.
  private timerKey: string | null = null;
  /// The draw-state key at the time of the last `DrawCard` we sent.
  private lastSentKey: string | null = null;
  private drawCardAudio: HTMLAudioElement | null = null;

  constructor(props: IDrawInnerProps) {
    super(props);
    this.state = {
      autodraw: true,
    };
    this.drawCard = this.drawCard.bind(this);
    this.pickUpKitty = this.pickUpKitty.bind(this);
    this.revealCard = this.revealCard.bind(this);
    this.onAutodrawClicked = this.onAutodrawClicked.bind(this);
  }

  componentDidMount(): void {
    this.armAutodraw();
  }

  componentDidUpdate(): void {
    this.armAutodraw();
  }

  componentWillUnmount(): void {
    this.cancelTimer();
  }

  private cancelTimer(): void {
    if (this.timeout !== null) {
      this.props.clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.timerKey = null;
  }

  private canDraw(): boolean {
    return (
      this.props.state.propagated.players[this.props.state.position].name ===
        this.props.name && this.props.state.deck.length > 0
    );
  }

  /// Identifies "the draw we are about to make": changes after every
  /// successful draw by anyone.
  private drawKey(): string {
    return `${this.props.state.position}:${this.props.state.deck.length}`;
  }

  /// (Re-)arm the autodraw timer whenever drawing is possible and no timer is
  /// pending for the current state. This is deliberately not gated on a
  /// false -> true transition of `canDraw`: if a draw is rejected by the
  /// server (the state does not change but an error arrives), the next
  /// update re-arms it and the draw self-recovers. A re-arm for a state we
  /// already sent a draw for uses a longer delay, so a re-render while the
  /// draw is in flight does not fire a duplicate.
  private armAutodraw(): void {
    if (!this.canDraw() || !this.state.autodraw) {
      return;
    }
    const key = this.drawKey();
    if (this.timeout !== null) {
      if (this.timerKey === key) {
        return;
      }
      // The state advanced while a (retry) timer was pending: replace it
      // with a timer at the normal speed.
      this.cancelTimer();
    }
    const speed =
      this.props.autodrawSpeedMs !== null ? this.props.autodrawSpeedMs : 10;
    const delay =
      key === this.lastSentKey ? Math.max(speed, AUTODRAW_RETRY_MS) : speed;
    this.timerKey = key;
    this.timeout = this.props.setTimeout(() => {
      this.timeout = null;
      this.timerKey = null;
      this.drawCard();
    }, delay);
  }

  drawCard(): void {
    const canDraw =
      this.props.state.propagated.players[this.props.state.position].name ===
      this.props.name;
    this.cancelTimer();
    if (canDraw) {
      this.lastSentKey = this.drawKey();
      if (this.props.playDrawCardSound) {
        if (this.drawCardAudio === null) {
          this.drawCardAudio = new Audio(
            "434472_dersuperanton_taking-card.mp3",
          );
        }

        this.drawCardAudio.play();
      }
      this.props.send({ Action: "DrawCard" });
    }
  }

  pickUpKitty(evt: React.SyntheticEvent): void {
    evt.preventDefault();
    this.props.send({ Action: "PickUpKitty" });
  }

  revealCard(evt: React.SyntheticEvent): void {
    evt.preventDefault();
    this.props.send({ Action: "RevealCard" });
  }

  onAutodrawClicked(evt: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      autodraw: evt.target.checked,
    });
    if (evt.target.checked) {
      this.drawCard();
    } else {
      this.cancelTimer();
    }
  }

  render(): JSX.Element {
    const canDraw = this.canDraw();
    const next = drawNextPlayer(this.props.state);

    const players: { [playerId: number]: Player } = {};
    let playerId = -1;
    this.props.state.propagated.players.forEach((p) => {
      players[p.id] = p;
      if (p.name === this.props.name) {
        playerId = p.id;
      }
    });

    const landlord = this.props.state.propagated.landlord;
    let trump: Trump | undefined;
    if (
      landlord !== null &&
      landlord !== undefined &&
      players[landlord] !== undefined
    ) {
      trump = {
        NoTrump: {
          number:
            players[landlord].level !== "NT" &&
            players[landlord].level !== undefined &&
            players[landlord].level !== null
              ? players[landlord].level
              : null,
        },
      };
    }
    return (
      <div>
        {this.props.compact ? null : (
          <>
            <Header
              gameMode={this.props.state.game_mode}
              chatLink={this.props.state.propagated.chat_link}
            />
            <Players
              players={this.props.state.propagated.players}
              observers={this.props.state.propagated.observers}
              landlord={landlord}
              next={next}
              name={this.props.name}
            />
          </>
        )}
        <BidArea
          bids={this.props.state.bids}
          autobid={this.props.state.autobid!}
          hands={this.props.state.hands}
          epoch={0}
          name={this.props.name}
          trump={trump}
          landlord={landlord!}
          players={this.props.state.propagated.players}
          bidPolicy={this.props.state.propagated.bid_policy!}
          bidReinforcementPolicy={
            this.props.state.propagated.bid_reinforcement_policy!
          }
          jokerBidPolicy={this.props.state.propagated.joker_bid_policy!}
          numDecks={this.props.state.num_decks}
          header={
            <>
              <h2>
                Bids ({this.props.state.deck.length} cards remaining in the
                deck)
              </h2>
              {!this.props.compact &&
              this.props.state.removed_cards!.length > 0 ? (
                <p>
                  Note:{" "}
                  {this.props.state.removed_cards!.map((c) => (
                    <InlineCard key={c} card={c} />
                  ))}{" "}
                  have been removed from the deck
                </p>
              ) : null}
            </>
          }
          prefixButtons={
            <>
              <button
                onClick={(evt: React.SyntheticEvent) => {
                  evt.preventDefault();
                  this.drawCard();
                }}
                disabled={!canDraw}
                className="big"
              >
                Draw card
              </button>
              <label>
                auto-draw
                <input
                  type="checkbox"
                  name="autodraw"
                  checked={this.state.autodraw}
                  onChange={this.onAutodrawClicked}
                />
              </label>
            </>
          }
          suffixButtons={
            <>
              <button
                onClick={this.pickUpKitty}
                disabled={
                  this.props.state.deck.length > 0 ||
                  (this.props.state.bids.length === 0 &&
                    this.props.state.autobid === null &&
                    !(
                      landlord !== null &&
                      landlord !== undefined &&
                      players[landlord].level === "NT"
                    )) ||
                  (landlord !== null && landlord !== playerId) ||
                  (landlord === null &&
                    ((this.props.state.propagated
                      .first_landlord_selection_policy === "ByWinningBid" &&
                      this.props.state.bids[this.props.state.bids.length - 1]
                        .id !== playerId) ||
                      (this.props.state.propagated
                        .first_landlord_selection_policy === "ByFirstBid" &&
                        this.props.state.bids[0].id !== playerId)))
                }
                className="big"
              >
                Pick up cards from the bottom
              </button>
              <button
                onClick={this.revealCard}
                disabled={
                  landlord === null ||
                  landlord === undefined ||
                  this.props.state.deck.length > 0 ||
                  this.props.state.bids.length > 0 ||
                  this.props.state.autobid !== null ||
                  (this.props.state.revealed_cards || 0) >=
                    this.props.state.kitty.length ||
                  (landlord !== null &&
                    landlord !== undefined &&
                    players[landlord].level === "NT")
                }
                className="big"
              >
                Reveal card from the bottom
              </button>
              <BeepButton />
            </>
          }
          bidTakeBacksEnabled={
            this.props.state.propagated.bid_takeback_policy ===
            "AllowBidTakeback"
          }
        />
        {this.props.compact ? null : (
          <LabeledPlay
            className="kitty"
            cards={this.props.state.kitty}
            trump={{ NoTrump: {} }}
            label="底牌"
          />
        )}
      </div>
    );
  }
}

/// Reads the (possibly seat-bound) `send` from context and hands it to the
/// class component above.
const Draw = (props: IDrawProps): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);
  return <DrawInner {...props} send={send} />;
};

export default Draw;
