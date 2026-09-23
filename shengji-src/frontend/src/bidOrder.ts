import { Bid } from "./gen-types";

const bidKey = (bid: Bid): string => `${bid.card}|${bid.count}`;

const compareBids = (a: Bid, b: Bid): number => {
  if (a.card < b.card) {
    return -1;
  } else if (a.card > b.card) {
    return 1;
  } else {
    return a.count - b.count;
  }
};

/// Orders the bid options by when they became available. Options that were
/// already shown keep their places relative to each other and new ones go at
/// the end, so drawing a card never slides a new option under the cursor of
/// someone about to click an old one. Options that arrive together (the first
/// load, or several at once after a bid is taken back) are sorted by card and
/// count among themselves.
export const orderBidsByArrival = (shown: Bid[], valid: Bid[]): Bid[] => {
  const validByKey = new Map<string, Bid>();
  valid.forEach((bid) => {
    if (!validByKey.has(bidKey(bid))) {
      validByKey.set(bidKey(bid), bid);
    }
  });

  const kept: Bid[] = [];
  shown.forEach((bid) => {
    const current = validByKey.get(bidKey(bid));
    if (current !== undefined) {
      kept.push(current);
      validByKey.delete(bidKey(bid));
    }
  });
  const added = Array.from(validByKey.values()).sort(compareBids);
  return [...kept, ...added];
};
