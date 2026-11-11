import * as React from "react";
import classNames from "classnames";
import Card from "../Card";
import ArrayUtils from "../util/array";
import { DDZ_TRUMP, sortDdz } from "./ddzCards";

import type { JSX } from "react";

interface IProps {
  cards: string[];
  /// Selectable when both are given.
  selected?: string[];
  onSelect?: (selected: string[]) => void;
}

/// A hand, highest card first. With `selected` the chosen cards move to a
/// row above, as in the Tractor hand.
const DdzHand = (props: IProps): JSX.Element => {
  const { cards, selected, onSelect } = props;
  const selectable = selected !== undefined && onSelect !== undefined;
  const chosen = selectable ? sortDdz(selected) : [];
  const rest = sortDdz(selectable ? ArrayUtils.minus(cards, selected) : cards);

  const row = (
    list: string[],
    onClick?: (card: string) => void,
  ): JSX.Element[] =>
    list.map((card, idx) => (
      <Card
        key={`${card}-${idx}`}
        card={card}
        trump={DDZ_TRUMP}
        plain={true}
        collapseRight={idx !== list.length - 1}
        onClick={onClick === undefined ? undefined : () => onClick(card)}
      />
    ));

  return (
    <div className="hand">
      {selectable ? (
        <div className="selected-cards">
          {chosen.length > 0 ? (
            row(chosen, (card) => onSelect(ArrayUtils.minus(selected, [card])))
          ) : (
            <Card card="🂠" trump={DDZ_TRUMP} plain={true} />
          )}
        </div>
      ) : null}
      <div
        className={classNames("unselected-cards", { unclickable: !selectable })}
      >
        {row(
          rest,
          selectable ? (card) => onSelect([...selected, card]) : undefined,
        )}
      </div>
    </div>
  );
};

export default DdzHand;
