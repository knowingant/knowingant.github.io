// Dou Di Zhu for the test bot: lobby (settings, start votes), bidding,
// doubling, play (the backend's own suggestions through `DdzPlays`) and the
// "next round" click. See ddz/src/game.rs for the state it reads.

import { BIG_JOKER, SMALL_JOKER, cardsLabel, parseCard } from "./cards.js";

function act(seat, action, label) {
  return { seat, action, label: label ?? (typeof action === "string" ? action : JSON.stringify(action)) };
}

/// A rough hand strength for bidding: jokers, twos, aces and bombs.
export function strength(hand) {
  let s = 0;
  const counts = {};
  for (const c of hand) {
    if (c === BIG_JOKER) s += 4;
    else if (c === SMALL_JOKER) s += 3;
    else {
      const n = parseCard(c)?.number;
      if (n === "2") s += 2;
      else if (n === "A") s += 1;
      counts[n] = (counts[n] ?? 0) + 1;
    }
  }
  for (const n of Object.values(counts)) if (n === 4) s += 3;
  return s;
}

/// The settings the bot wants that the room does not have yet.
export function pendingDdzSettings(propagated, ctx) {
  const out = [];
  if (ctx.rated !== null && ctx.rated !== undefined && !!propagated.rated !== !!ctx.rated) {
    out.push({ SetRated: !!ctx.rated });
  }
  const have = propagated.ddz ?? {};
  const want = { ...have, ...(ctx.ddz ?? {}) };
  if (JSON.stringify(have) !== JSON.stringify(want)) {
    out.push({ SetDdzSettings: want });
  }
  return out;
}

export function decideDdzLobby(init, ctx) {
  const p = init.propagated;
  if (ctx.matchesFinished >= ctx.matchesWanted) return [];
  const players = p.players || [];
  const seat = ctx.seats.find((s) => players.some((pl) => pl.id === s));
  if (seat === undefined) return [];
  if (ctx.isLeader) {
    const pending = pendingDdzSettings(p, ctx);
    if (pending.length) return pending.map((a) => act(seat, a));
  }
  if (players.length !== 3) return [];
  if ((p.start_votes || []).includes(seat)) return [];
  return [act(seat, "StartGame")];
}

export async function decideDdz(phase, ctx, rpc) {
  const g = phase.game;
  const r = g.round;
  const seat = g.seats.findIndex((id) => ctx.seats.includes(id));
  if (seat < 0) return [];
  const me = g.seats[seat];
  const ddz = (action, label) => act(me, { Ddz: action }, label);
  const hand = r.hands[seat] || [];
  switch (r.stage) {
    case "Bidding": {
      if (r.turn !== seat) return [];
      const s = strength(hand);
      if (g.settings.bidding === "Grab") {
        const called = r.caller !== null && r.caller !== undefined;
        const yes = called ? s >= 7 : s >= 4;
        return [ddz({ Bid: yes ? 1 : 0 }, yes ? (called ? "Grab" : "Call") : "Pass")];
      }
      const want = s >= 9 ? 3 : s >= 6 ? 2 : s >= 3 ? 1 : 0;
      const bid = want > r.stake ? want : 0;
      return [ddz({ Bid: bid }, bid ? `Bid ${bid}` : "Pass")];
    }
    case "Doubling": {
      if (r.doubles[seat] !== null && r.doubles[seat] !== undefined) return [];
      if (seat === r.landlord && r.turn !== seat) return [];
      const yes = strength(hand) >= 7;
      return [ddz({ Double: yes }, `Double ${yes}`)];
    }
    case "Playing": {
      if (r.turn !== seat) return [];
      const last = r.last_play ?? null;
      // A farmer leaves the other farmer's play alone.
      const partner =
        last !== null && seat !== r.landlord && last.seat !== r.landlord && last.seat !== seat;
      let plays = [];
      try {
        const res = await rpc("DdzPlays", { hand, selected: [], last: last?.play ?? null });
        plays = (res && res.suggestions) || [];
      } catch (e) {
        ctx.warn?.(`DdzPlays failed: ${e.message}`);
      }
      if (plays.length === 0 || (partner && plays[0].length < hand.length)) {
        return [ddz("Pass", "Pass")];
      }
      return [ddz({ Play: plays[0] }, `Play ${cardsLabel(plays[0])}`)];
    }
    case "Finished":
      return ctx.isLeader && !ctx.ddzManualNext ? [ddz("NextRound", "NextRound")] : [];
    default:
      return [];
  }
}

export function applyDdzBroadcast(ctx, variant) {
  switch (variant.type) {
    case "DdzRoundFinished":
      ctx.roundsFinished += 1;
      return {
        kind: "round",
        round: variant.round,
        result: Object.fromEntries(
          (variant.results || []).map((r) => [
            r.name,
            { won_game: r.won, is_landlord: r.is_landlord, is_defending: false, ranks_up: r.delta },
          ]),
        ),
      };
    case "DdzMatchFinished":
      ctx.matchesFinished += 1;
      ctx.roundsFinished = 0;
      return {
        kind: "match",
        match: ctx.matchesFinished,
        match_key: variant.match_key,
        first_to_rank: `${variant.rounds} rounds`,
        standings: variant.standings || [],
      };
    case "DdzMatchStarted":
      return { kind: "match_started", first_to_rank: `${variant.rounds} rounds` };
    case "DdzMatchAbandoned":
      return { kind: "match_abandoned" };
    default:
      return null;
  }
}

export function describeDdz(phase) {
  const g = phase.game;
  const r = g.round;
  return `Ddz: round ${g.round_number}/${g.settings.rounds} ${r.stage}, turn=${r.turn ?? "-"}, landlord=${r.landlord ?? "-"}, stake=${r.stake}, hands=${r.hands.map((h) => h.length).join("/")}, totals=${g.totals.join("/")}`;
}
