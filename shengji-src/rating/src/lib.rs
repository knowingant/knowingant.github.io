//! Rating math for rated matches. `../RATINGS.md` is the specification and
//! this crate must match it exactly (the numbers quoted there are pinned by
//! tests here).
//!
//! Plain Elo per match with a margin-of-victory score and a K that grows
//! linearly with the match length ("first to rank N" → `T = N − 2` levels):
//!
//! * `m_uv = (L_u − L_v) / T` for every pair of users on different sides,
//! * `s_uv = 0.95 + 0.05·m` for a win, `0.05 + 0.05·m` for a loss, `0.5`
//!   for a tie: the result is what counts, the margin is a second-order
//!   term worth at most 5% of it,
//! * `E_uv = 1 / (1 + 10^((R_v − R_u)/2000))`,
//! * `Δ_u = K(N) · mean_v (s_uv − E_uv)` with `K(N) = 24 · (N − 2)`,
//!   clamped so that whoever came out ahead never loses points and whoever
//!   came out behind never gains any.
//!
//! No rating deviation, no volatility: a change is a function of the ratings
//! and the final result only. This crate is pure: no I/O, no clocks.

use serde::{Deserialize, Serialize};

/// Tunable parameters. [`Params::default`] is what production uses.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Params {
    /// `K = k_per_level · L` for a match of `L` levels (`first to rank N` is
    /// `N − 2` levels), up to `k_linear_levels`; beyond that it grows with the
    /// square root of `L` (see [`k_factor`]).
    pub k_per_level: f64,
    /// Levels up to which `K` is linear (3 = first to rank 5).
    pub k_linear_levels: f64,
    /// Elo logistic scale (rating points per factor of 10 in odds).
    pub elo_scale: f64,
    /// Rating of a new account.
    pub initial_rating: f64,
    /// Lowest possible rating (applied after the update).
    pub rating_floor: f64,
    /// Fight the Landlord: `K = ddz_k_per_round · rounds`, up to
    /// `ddz_k_linear_rounds` rounds, then with the square root of the rounds.
    pub ddz_k_per_round: f64,
    pub ddz_k_linear_rounds: f64,
    /// Fight the Landlord: a points gap of this much per round is a full margin.
    pub ddz_margin_per_round: f64,
}

impl Default for Params {
    fn default() -> Self {
        Params {
            k_per_level: 24.0,
            k_linear_levels: 3.0,
            elo_scale: 2000.0,
            initial_rating: 1500.0,
            rating_floor: 0.0,
            ddz_k_per_round: 8.0,
            ddz_k_linear_rounds: 6.0,
            ddz_margin_per_round: 6.0,
        }
    }
}

/// One user's final standing in a match.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Standing {
    /// Rating before the match.
    pub rating: f64,
    /// Levels climbed by the end of the match (`rank − 2` in ranks; may
    /// exceed the target, it is capped inside [`rate_match`]).
    pub levels: usize,
    /// Side identifier. Users with the same `side` are never compared with
    /// each other (Tractor teammates, or both seats of a 1v1 user).
    pub side: usize,
}

/// Result of [`rate_match`] for one user, in the input order.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Change {
    pub before: f64,
    pub after: f64,
    /// Mean score against the opposing users, in `[0, 1]`.
    pub score: f64,
    /// Mean expected score against the opposing users.
    pub expected: f64,
}

impl Change {
    pub fn delta(&self) -> f64 {
        self.after - self.before
    }
}

/// Number of levels a match to rank `n` takes (`N − 2` in the spec).
pub fn target_levels(first_to_rank_index: usize) -> usize {
    first_to_rank_index.saturating_sub(2).max(1)
}

/// `size` up to `linear`, then `linear · sqrt(size / linear)`: a long match
/// is worth more than a short one, but ever less per extra unit of length.
fn grows_linearly_then_sqrt(size: f64, linear: f64) -> f64 {
    if size <= linear {
        size
    } else {
        linear * (size / linear).sqrt()
    }
}

/// `K` of a Tractor match that is worth `levels` levels (`N − 2` for first to
/// rank `N`, times the step-size factor, see [`rate_match`]): linear up to
/// `k_linear_levels` (first to rank 5), proportional to the square root of
/// the levels after that.
pub fn k_factor(params: &Params, levels: f64) -> f64 {
    params.k_per_level * grows_linearly_then_sqrt(levels, params.k_linear_levels)
}

/// `K` of a Fight the Landlord match of `rounds` rounds.
pub fn ddz_k_factor(params: &Params, rounds: f64) -> f64 {
    params.ddz_k_per_round * grows_linearly_then_sqrt(rounds, params.ddz_k_linear_rounds)
}

/// How much of a result the margin is worth: a win scores
/// `1 − MARGIN_WEIGHT + MARGIN_WEIGHT·m`, so the closest possible win is
/// still worth `1 − MARGIN_WEIGHT` and the margin only moves it by up to
/// `MARGIN_WEIGHT`.
pub const MARGIN_WEIGHT: f64 = 0.05;

/// Score of `u` against `v` for a normalized margin `m ∈ [−1, 1]`.
pub fn score_for_margin(m: f64) -> f64 {
    let m = m.clamp(-1.0, 1.0);
    if m > 0.0 {
        1.0 - MARGIN_WEIGHT + MARGIN_WEIGHT * m
    } else if m < 0.0 {
        MARGIN_WEIGHT + MARGIN_WEIGHT * m
    } else {
        0.5
    }
}

/// Elo expected score of a player rated `r_u` against `r_v`.
pub fn expected_score(params: &Params, r_u: f64, r_v: f64) -> f64 {
    1.0 / (1.0 + 10f64.powf((r_v - r_u) / params.elo_scale))
}

/// Rate one finished match. `target_levels` is `N − 2` (at least 1).
/// `step_ratio` is the room's scoring step size over the default one: with
/// smaller steps a level is easier to come by, so the match counts as that
/// fraction of its length for `K` (half-size steps: first to rank 5 rates
/// like first to rank 3.5). Larger steps count as the default.
///
/// Returns one [`Change`] per standing, in input order. A user with no
/// opponents on another side (e.g. everyone on one side) gets no change.
pub fn rate_match(
    params: &Params,
    target_levels: usize,
    step_ratio: f64,
    standings: &[Standing],
) -> Vec<Change> {
    let t = target_levels.max(1) as f64;
    let k = k_factor(params, t * step_ratio.clamp(f64::MIN_POSITIVE, 1.0));
    standings
        .iter()
        .map(|u| {
            let mut n = 0usize;
            let mut sum_s = 0.0;
            let mut sum_e = 0.0;
            for v in standings.iter().filter(|v| v.side != u.side) {
                let lu = u.levels.min(target_levels.max(1)) as f64;
                let lv = v.levels.min(target_levels.max(1)) as f64;
                let m = (lu - lv) / t;
                sum_s += score_for_margin(m);
                sum_e += expected_score(params, u.rating, v.rating);
                n += 1;
            }
            if n == 0 {
                return Change {
                    before: u.rating,
                    after: u.rating,
                    score: 0.5,
                    expected: 0.5,
                };
            }
            let score = sum_s / n as f64;
            let expected = sum_e / n as f64;
            let mut after = u.rating + k * (score - expected);
            // A result is never punished: whoever came out ahead (mean score
            // above ½) cannot lose points and whoever came out behind cannot
            // gain any. This only bites in lopsided pairings, where the Elo
            // expectation is more extreme than the margin-adjusted score.
            if score > 0.5 {
                after = after.max(u.rating);
            } else if score < 0.5 {
                after = after.min(u.rating);
            }
            let after = after.max(params.rating_floor);
            Change {
                before: u.rating,
                after,
                score,
                expected,
            }
        })
        .collect()
}

/// One player's result in a Fight the Landlord match.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct PointsStanding {
    /// Rating before the match.
    pub rating: f64,
    /// Match total (the three totals sum to zero).
    pub points: i64,
}

/// Rate a Fight the Landlord match of `rounds` rounds (`../RATINGS.md`, "Fight the
/// Landlord"). Every player is scored against each of the others as in
/// [`rate_match`], with the points gap as the margin:
///
/// * `m_uv = (S_u − S_v) / (ddz_margin_per_round · rounds)`, clamped to ±1,
/// * `Δ_u = K · mean_v (s_uv − E_uv)` with `K = ddz_k_per_round · rounds`.
///
/// There is no clamp, so the three changes sum to zero (apart from the rating
/// floor).
pub fn rate_points_match(
    params: &Params,
    rounds: usize,
    standings: &[PointsStanding],
) -> Vec<Change> {
    let rounds = rounds.max(1) as f64;
    let k = ddz_k_factor(params, rounds);
    let full = params.ddz_margin_per_round * rounds;
    standings
        .iter()
        .enumerate()
        .map(|(i, u)| {
            let mut n = 0usize;
            let mut sum_s = 0.0;
            let mut sum_e = 0.0;
            for (_, v) in standings.iter().enumerate().filter(|(j, _)| *j != i) {
                sum_s += score_for_margin((u.points - v.points) as f64 / full);
                sum_e += expected_score(params, u.rating, v.rating);
                n += 1;
            }
            if n == 0 {
                return Change {
                    before: u.rating,
                    after: u.rating,
                    score: 0.5,
                    expected: 0.5,
                };
            }
            let score = sum_s / n as f64;
            let expected = sum_e / n as f64;
            let after = u.rating + k * (score - expected);
            Change {
                before: u.rating,
                after: after.max(params.rating_floor),
                score,
                expected,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p() -> Params {
        Params::default()
    }

    fn two(levels_a: usize, levels_b: usize, ra: f64, rb: f64, t: usize) -> Vec<Change> {
        rate_match(
            &p(),
            t,
            1.0,
            &[
                Standing {
                    rating: ra,
                    levels: levels_a,
                    side: 0,
                },
                Standing {
                    rating: rb,
                    levels: levels_b,
                    side: 1,
                },
            ],
        )
    }

    #[test]
    fn even_shutout_at_default_n_is_36() {
        // N = 5 -> T = 3, K = 72; shutout: winner 3 levels, loser 0.
        let c = two(3, 0, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 36.0).abs() < 1e-9, "{:?}", c);
        assert!((c[1].delta() + 36.0).abs() < 1e-9, "{:?}", c);
        assert_eq!(c[0].score, 1.0);
        assert_eq!(c[1].score, 0.0);
    }

    #[test]
    fn even_narrow_wins_at_default_n() {
        // loser reached rank 3 (1 level): m = 2/3 -> s = 0.9833 -> +34.8
        let c = two(3, 1, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 34.8).abs() < 1e-6, "{:?}", c);
        // loser reached rank 4 (2 levels): m = 1/3 -> s = 0.9667 -> +33.6
        let c = two(3, 2, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 33.6).abs() < 1e-6, "{:?}", c);
        assert!((c[1].delta() + 33.6).abs() < 1e-6, "{:?}", c);
    }

    #[test]
    fn lopsided_results_are_never_punished() {
        // A 500 loses narrowly to a 3600: Elo expected 0.028 of them, the
        // narrow loss scores 0.033, so unclamped they would gain (and the
        // 3600, expected to win by more, would lose). Neither happens.
        let c = two(3, 2, 3600.0, 500.0, 3);
        assert_eq!(c[0].delta(), 0.0, "{:?}", c);
        assert_eq!(c[1].delta(), 0.0, "{:?}", c);
        // A shutout by the favourite still pays them (a little).
        let c = two(3, 0, 3600.0, 500.0, 3);
        assert!(c[0].delta() > 0.0 && c[0].delta() < 10.0, "{:?}", c);
        assert!((c[0].delta() + c[1].delta()).abs() < 1e-9);
    }

    #[test]
    fn k_is_linear_to_rank_5_then_sqrt() {
        // Between equals a shutout is worth K/2: 12·T up to T = 3 (rank 5),
        // then 36·sqrt(T/3).
        for t in 1..=3usize {
            let c = two(t, 0, 1500.0, 1500.0, t);
            assert!((c[0].delta() - 12.0 * t as f64).abs() < 1e-6, "T={t} {c:?}");
        }
        for t in 4..=12usize {
            let c = two(t, 0, 1500.0, 1500.0, t);
            let want = 36.0 * (t as f64 / 3.0).sqrt();
            assert!((c[0].delta() - want).abs() < 1e-6, "T={t} {c:?}");
        }
        assert_eq!(target_levels(5), 3);
        assert_eq!(target_levels(3), 1);
        assert_eq!(target_levels(2), 1);
    }

    #[test]
    fn smaller_steps_count_as_a_shorter_match() {
        let shutout = |t: usize, ratio: f64| {
            rate_match(
                &p(),
                t,
                ratio,
                &[
                    Standing {
                        rating: 1500.0,
                        levels: t,
                        side: 0,
                    },
                    Standing {
                        rating: 1500.0,
                        levels: 0,
                        side: 1,
                    },
                ],
            )[0]
            .delta()
        };
        // Half-size steps: first to rank 5 (3 levels) rates like 1.5 levels.
        assert!((shutout(3, 0.5) - 18.0).abs() < 1e-9);
        // First to rank 8 (6 levels) at half steps is like 3 levels.
        assert!((shutout(6, 0.5) - 36.0).abs() < 1e-9);
        // Bigger steps are not rewarded.
        assert_eq!(shutout(3, 2.0), shutout(3, 1.0));
    }

    #[test]
    fn rating_difference_matters_the_elo_way() {
        let e = expected_score(&p(), 1700.0, 1500.0);
        assert!((e - 0.5573).abs() < 1e-3, "{e}");
        let c = two(3, 0, 1700.0, 1500.0, 3);
        assert!((c[0].delta() - 72.0 * (1.0 - e)).abs() < 1e-9);
        assert!(c[0].delta() > 31.5 && c[0].delta() < 32.5, "{:?}", c);
        // narrow win: 72·(0.9667 − 0.5573) ≈ +29.5
        let c = two(3, 2, 1700.0, 1500.0, 3);
        assert!(c[0].delta() > 29.0 && c[0].delta() < 30.0, "{:?}", c);
        // narrow loss: 72·(0.0333 − 0.5573) ≈ −37.7
        let c = two(2, 3, 1700.0, 1500.0, 3);
        assert!(c[0].delta() < -37.0 && c[0].delta() > -38.5, "{:?}", c);
        // zero-sum for two users
        assert!((c[0].delta() + c[1].delta()).abs() < 1e-9);
    }

    #[test]
    fn overshoot_is_capped_at_target() {
        let c = two(5, 0, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 36.0).abs() < 1e-9);
    }

    #[test]
    fn teams_share_scores_and_stay_zero_sum() {
        let s = |r: f64, l: usize, side: usize| Standing {
            rating: r,
            levels: l,
            side,
        };
        let c = rate_match(
            &p(),
            3,
            1.0,
            &[
                s(1500.0, 3, 0),
                s(1500.0, 3, 0),
                s(1500.0, 1, 1),
                s(1500.0, 1, 1),
            ],
        );
        assert!((c[0].delta() - 34.8).abs() < 1e-6);
        assert!((c[1].delta() - 34.8).abs() < 1e-6);
        assert!((c[2].delta() + 34.8).abs() < 1e-6);
        let total: f64 = c.iter().map(|c| c.delta()).sum();
        assert!(total.abs() < 1e-6);
        // teammates are not compared with each other: a lone side gets nothing
        let solo = rate_match(&p(), 3, 1.0, &[s(1500.0, 3, 0), s(1500.0, 0, 0)]);
        assert_eq!(solo[0].delta(), 0.0);
    }

    #[test]
    fn finding_friends_is_pairwise_free_for_all() {
        let s = |r: f64, l: usize, side: usize| Standing {
            rating: r,
            levels: l,
            side,
        };
        // two players reached the target together, one climbed one level,
        // one never moved
        let c = rate_match(
            &p(),
            3,
            1.0,
            &[
                s(1500.0, 3, 0),
                s(1500.0, 3, 1),
                s(1500.0, 1, 2),
                s(1500.0, 0, 3),
            ],
        );
        // winners: draw vs each other (0.5), 0.9833 vs the 1-level player,
        // 1.0 vs the 0-level player -> mean 0.8278 -> +23.6
        let vs_one_level = 1.0 - MARGIN_WEIGHT + MARGIN_WEIGHT * 2.0 / 3.0;
        assert!((c[0].score - (0.5 + vs_one_level + 1.0) / 3.0).abs() < 1e-9);
        assert!((c[0].delta() - c[1].delta()).abs() < 1e-9);
        assert!(c[0].delta() > 0.0 && c[3].delta() < 0.0 && c[2].delta() < 0.0);
        let total: f64 = c.iter().map(|c| c.delta()).sum();
        assert!(total.abs() < 1e-6);
    }

    #[test]
    fn floor_and_score_table() {
        assert_eq!(score_for_margin(0.0), 0.5);
        assert_eq!(score_for_margin(1.0), 1.0);
        assert_eq!(score_for_margin(-1.0), 0.0);
        assert!((score_for_margin(0.5) - 0.975).abs() < 1e-12);
        assert!((score_for_margin(-0.5) - 0.025).abs() < 1e-12);
        // A rating so low that even the tiny expected-score deficit takes it
        // below zero gets floored.
        let c = two(0, 3, 0.005, 1500.0, 3);
        assert_eq!(c[0].after, 0.0);
    }

    fn ddz(rounds: usize, players: &[(f64, i64)]) -> Vec<f64> {
        let standings: Vec<PointsStanding> = players
            .iter()
            .map(|(rating, points)| PointsStanding {
                rating: *rating,
                points: *points,
            })
            .collect();
        rate_points_match(&p(), rounds, &standings)
            .iter()
            .map(|c| (c.delta() * 10.0).round() / 10.0)
            .collect()
    }

    // The tables in RATINGS.md ("Fight the Landlord").
    #[test]
    fn ddz_equal_ratings_six_rounds() {
        let e = 1500.0;
        assert_eq!(
            ddz(6, &[(e, 30), (e, -6), (e, -24)]),
            vec![24.0, -0.6, -23.4]
        );
        assert_eq!(ddz(6, &[(e, 4), (e, 2), (e, -6)]), vec![22.0, 0.2, -22.2]);
        assert_eq!(
            ddz(6, &[(e, 12), (e, 12), (e, -24)]),
            vec![12.0, 12.0, -24.0]
        );
        assert_eq!(ddz(6, &[(e, 0), (e, 0), (e, 0)]), vec![0.0, 0.0, 0.0]);
    }

    #[test]
    fn ddz_unequal_ratings() {
        assert_eq!(
            ddz(6, &[(1700.0, 30), (1500.0, -6), (1500.0, -24)]),
            vec![21.2, 0.8, -22.0]
        );
        assert_eq!(
            ddz(6, &[(1500.0, 30), (1500.0, -6), (1700.0, -24)]),
            vec![25.4, 0.8, -26.2]
        );
    }

    #[test]
    fn ddz_k_is_linear_to_six_rounds_then_sqrt() {
        let e = 1500.0;
        // A full-margin first place between equals earns K/2.
        for (rounds, win) in [(3, 12.0), (6, 24.0), (9, 29.4), (12, 33.9)] {
            let big = 100 * rounds as i64;
            assert_eq!(ddz(rounds, &[(e, big), (e, 0), (e, -big)])[0], win);
        }
    }

    #[test]
    fn ddz_changes_sum_to_zero() {
        for standings in [
            [(2300.0, 1), (1500.0, 0), (1500.0, -1)],
            [(1500.0, 1), (2300.0, 0), (1500.0, -1)],
            [(2300.0, 1), (2300.0, 0), (700.0, -1)],
            [(1700.0, 30), (1500.0, -6), (1300.0, -24)],
        ] {
            let sum: f64 = ddz(6, &standings).iter().sum();
            assert!(sum.abs() < 0.151, "{standings:?}: {sum}");
        }
    }
}
