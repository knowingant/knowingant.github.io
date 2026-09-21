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
//! * `E_uv = 1 / (1 + 10^((R_v − R_u)/400))`,
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
    /// `K(N) = k_per_level · (N − 2)`.
    pub k_per_level: f64,
    /// Elo logistic scale (rating points per factor of 10 in odds).
    pub elo_scale: f64,
    /// Rating of a new account.
    pub initial_rating: f64,
    /// Lowest possible rating (applied after the update).
    pub rating_floor: f64,
}

impl Default for Params {
    fn default() -> Self {
        Params {
            k_per_level: 24.0,
            elo_scale: 400.0,
            initial_rating: 1500.0,
            rating_floor: 0.0,
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

/// `K(N)`.
pub fn k_factor(params: &Params, target_levels: usize) -> f64 {
    params.k_per_level * target_levels as f64
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
///
/// Returns one [`Change`] per standing, in input order. A user with no
/// opponents on another side (e.g. everyone on one side) gets no change.
pub fn rate_match(params: &Params, target_levels: usize, standings: &[Standing]) -> Vec<Change> {
    let t = target_levels.max(1) as f64;
    let k = k_factor(params, target_levels.max(1));
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
        // An 800 loses narrowly to a 1500: Elo expected 0.017 of them, the
        // narrow loss scores 0.033, so unclamped they would gain (and the
        // 1500, expected to win by more, would lose). Neither happens.
        let c = two(3, 2, 1500.0, 800.0, 3);
        assert_eq!(c[0].delta(), 0.0, "{:?}", c);
        assert_eq!(c[1].delta(), 0.0, "{:?}", c);
        // A shutout by the favourite still pays them (a little).
        let c = two(3, 0, 1500.0, 800.0, 3);
        assert!(c[0].delta() > 0.0 && c[0].delta() < 10.0, "{:?}", c);
        assert!((c[0].delta() + c[1].delta()).abs() < 1e-9);
    }

    #[test]
    fn k_scales_linearly_with_match_length() {
        for t in 1..=12usize {
            let c = two(t, 0, 1500.0, 1500.0, t);
            assert!(
                (c[0].delta() - 12.0 * t as f64).abs() < 1e-6,
                "T={t} {:?}",
                c
            );
        }
        assert_eq!(target_levels(5), 3);
        assert_eq!(target_levels(3), 1);
        assert_eq!(target_levels(2), 1);
    }

    #[test]
    fn rating_difference_matters_the_elo_way() {
        let e = expected_score(&p(), 1700.0, 1500.0);
        assert!((e - 0.7597).abs() < 1e-3, "{e}");
        let c = two(3, 0, 1700.0, 1500.0, 3);
        assert!((c[0].delta() - 72.0 * (1.0 - e)).abs() < 1e-9);
        assert!(c[0].delta() > 17.0 && c[0].delta() < 18.0, "{:?}", c);
        // narrow win: 72·(0.9667 − 0.7597) ≈ +14.9
        let c = two(3, 2, 1700.0, 1500.0, 3);
        assert!(c[0].delta() > 14.5 && c[0].delta() < 15.5, "{:?}", c);
        // narrow loss: 72·(0.0333 − 0.7597) ≈ −52.3
        let c = two(2, 3, 1700.0, 1500.0, 3);
        assert!(c[0].delta() < -52.0 && c[0].delta() > -53.0, "{:?}", c);
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
        let solo = rate_match(&p(), 3, &[s(1500.0, 3, 0), s(1500.0, 0, 0)]);
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
}
