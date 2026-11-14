import * as React from "react";
import classNames from "classnames";
import Card from "../Card";
import ArrayUtils from "../util/array";
import { SettingsContext } from "../AppStateProvider";
import { DDZ_TRUMP, sortDdz } from "./ddzCards";

import type { JSX } from "react";

interface IProps {
  cards: string[];
  /// Selectable when both are given.
  selected?: string[];
  onSelect?: (selected: string[]) => void;
  smaller?: boolean;
}

/// A hand, lowest card first (the "reverse card order" setting flips it,
/// as in Tractor). With `selected` the chosen cards move to a row above.
const DdzHand = (props: IProps): JSX.Element => {
  const { cards, selected, onSelect } = props;
  const { reverseCardOrder } = React.useContext(SettingsContext);
  const selectable = selected !== undefined && onSelect !== undefined;
  const chosen = selectable ? sortDdz(selected, reverseCardOrder) : [];
  const rest = sortDdz(
    selectable ? ArrayUtils.minus(cards, selected) : cards,
    reverseCardOrder,
  );

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
        smaller={props.smaller}
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
