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

Plain Elo with a margin-of-victory score and a K that grows with the match
length. No rating deviation, no volatility, no provisional period: a change
depends only on the ratings involved and the final result.

For each user `u` let

- `L_u` = levels climbed at the end of the match, i.e. `rank_u − 2` counted
  in ranks (`2→0, 3→1, …, A→12, NT→13`), capped at `T = N − 2` (a 3-level
  win can overshoot N; the overshoot doesn't count);
- `R_u` = rating before the match.

For every pair `(u, v)` of users on **different sides** (Tractor: the other
team; Finding Friends: every other player; 1v1: the other user):

```
margin  m_uv = (L_u − L_v) / T                       ∈ [−1, 1]
score   s_uv = 0.75 + 0.25·m_uv   if m_uv > 0        (a win is worth ≥ 0.75)
             = 0.25 + 0.25·m_uv   if m_uv < 0        (a loss is worth ≤ 0.25)
             = 0.5                if m_uv = 0
expected E_uv = 1 / (1 + 10^((R_v − R_u) / 400))
```

and the user's change is the average over their opponents:

```
Δ_u = K(N) · mean_v (s_uv − E_uv),      K(N) = 120 · (N − 2)
```

Ratings are rounded to integers for display and clamped at 0.

## What that means in numbers

Two equally rated sides, default N = 5 (`T = 3`, `K = 360`):

| result | winner's score | Δ winner | Δ loser |
|---|---|---|---|
| shutout: loser never left rank 2 | 1.0 | **+180** | −180 |
| loser got to rank 3 | 0.917 | +150 | −150 |
| loser got to rank 4 | 0.833 | +120 | −120 |

So a win against an equal opponent is worth 120–180 points at N = 5
(`80 + 20N` for the full margin). Longer matches swing more: the full-margin
win is `60·(N − 2)` points (60 at N = 3, 480 at N = 10), because a longer
race carries proportionally more information.

Rating differences matter the usual Elo way: a 1700 beating a 1500 by the
full margin gains `360·(1 − 0.76) ≈ +86`; beating them narrowly (loser at
rank 4) gains `360·(0.833 − 0.76) ≈ +26`; losing to them narrowly costs the
1700 `360·(0.167 − 0.76) ≈ −213`.

Team members share a rank in Tractor, so both members of the winning team
get the same score against each opponent; their changes differ only through
their own ratings. In Finding Friends every player has their own rank and
is scored against everyone else, so two players who both reached N draw
with each other (`s = 0.5`) and both beat everyone below them.

## What is not handled

- Matches that never finish (someone leaves, the room is reset from the
  first round, a player is kicked mid-match) are not rated. There is no
  forfeit or claim-win mechanic.
- Settings that make rounds trivially short are still rated; the match
  length N is the only difficulty factor.
- A new account starts at 1500 with a full-size K like everyone else, so
  the first few matches of a strong player move slowly; that is the price of
  having no provisional period, as requested.
