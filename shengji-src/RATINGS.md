# Rating system

Ratings are per **match**, not per round. A match is "first to rank N":
everyone starts at rank 2 and the match ends the moment any player's rank
reaches N (N is a room setting, default 5, minimum 3). Only matches played
with the room's "Rated" setting on count.

Two independent ladders: `team` (Standard rooms, Tractor or Finding Friends)
and `1v1` (1v1 rooms). Everyone starts at 1500.

Implemented in the `rating` crate (`shengji-rating`), applied by
`backend/src/ratings.rs`. The numbers below are pinned by that crate's
tests.

## The formula

Plain Elo with a K that grows with the match length and a small
margin-of-victory term. No rating deviation, no volatility, no provisional
period: a change depends only on the ratings involved and the final result.

For each user `u` let

- `L_u` = levels climbed at the end of the match, i.e. `rank_u − 2` counted
  in ranks (`2→0, 3→1, …, A→12, NT→13`), capped at `T = N − 2` (a 3-level
  win can overshoot N; the overshoot doesn't count);
- `R_u` = rating before the match.

For every pair `(u, v)` of users on **different sides** (Tractor: the other
team; Finding Friends: every other player; 1v1: the other user):

```
margin  m_uv = (L_u − L_v) / T                       ∈ [−1, 1]
score   s_uv = 0.95 + 0.05·m_uv   if m_uv > 0        (a win is worth ≥ 0.95)
             = 0.05 + 0.05·m_uv   if m_uv < 0        (a loss is worth ≤ 0.05)
             = 0.5                if m_uv = 0
expected E_uv = 1 / (1 + 10^((R_v − R_u) / 400))
```

The result is what counts; the margin is a second-order term that moves a
result's value by at most 5%. The user's change is the average over their
opponents:

```
Δ_u = K(N) · mean_v (s_uv − E_uv),      K(N) = 24 · (N − 2)
```

then clamped so that a result is never punished: a user whose mean score is
above ½ cannot lose points and one below ½ cannot gain any. That only bites
in lopsided pairings, where Elo's expectation is more extreme than the
margin-adjusted score, and it is the one place the system is not exactly
zero-sum. Ratings are rounded to integers for display and clamped at 0.

## What that means in numbers

Two equally rated sides, default N = 5 (`T = 3`, `K = 72`):

| result | winner's score | Δ winner | Δ loser |
|---|---|---|---|
| shutout: loser never left rank 2 | 1.0 | **+36** | −36 |
| loser got to rank 3 | 0.983 | +34.8 | −34.8 |
| loser got to rank 4 | 0.967 | +33.6 | −33.6 |

So a win against an equal opponent is worth 34–36 points at N = 5
(`16 + 4N` for the full margin). Longer matches swing more: the full-margin
win is `12·(N − 2)` points (12 at N = 3, 96 at N = 10), because a longer
race carries proportionally more information. Changes are deliberately
small: the ladder is meant to move over dozens of matches, not a handful.

Rating differences matter the usual Elo way: a 1700 beating a 1500 by the
full margin gains `72·(1 − 0.76) ≈ +17`; beating them narrowly (loser at
rank 4) gains `72·(0.967 − 0.76) ≈ +15`; losing to them narrowly costs the
1700 `72·(0.033 − 0.76) ≈ −52`.

Team members share a rank in Tractor, so both members of the winning team
get the same score against each opponent; their changes differ only through
their own ratings. In Finding Friends every player has their own rank and
is scored against everyone else, so two players who both reached N draw
with each other (`s = 0.5`) and both beat everyone below them.

## Changing the formula

`shengji replay-ratings` (the backend binary with that one argument, see
DEPLOY.md) recomputes every rated match from scratch, in order, under the
current formula, and rewrites the ladders and the per-match numbers shown
on account pages. Matches recorded without rating and all statistics are
left alone, and running it twice is harmless. The 2026-09-20 change from a
25% to a 5% margin term and the 2026-09-21 change of K from 120 to 24 per
level (every change a fifth of what it was) were applied that way.

## What is not handled

- Matches that never finish (someone leaves, the room is reset from the
  first round, a player is kicked mid-match) are not rated. There is no
  forfeit or claim-win mechanic.
- Settings that make rounds trivially short are still rated; the match
  length N is the only difficulty factor.
- A new account starts at 1500 with a full-size K like everyone else, so
  the first few matches of a strong player move slowly; that is the price of
  having no provisional period, as requested.
