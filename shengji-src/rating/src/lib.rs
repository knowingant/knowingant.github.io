//! Rating math for rated matches. `../RATINGS.md` is the specification and
//! this crate must match it exactly (the numbers quoted there are pinned by
//! tests here).
//!
//! Plain Elo per match with a margin-of-victory score and a K that grows
//! linearly with the match length ("first to rank N" → `T = N − 2` levels):
//!
//! * `m_uv = (L_u − L_v) / T` for every pair of users on different sides,
//! * `s_uv = 0.75 + 0.25·m` for a win, `0.25 + 0.25·m` for a loss, `0.5`
//!   for a tie,
//! * `E_uv = 1 / (1 + 10^((R_v − R_u)/400))`,
//! * `Δ_u = K(N) · mean_v (s_uv − E_uv)` with `K(N) = 120 · (N − 2)`.
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
            k_per_level: 120.0,
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

/// Score of `u` against `v` for a normalized margin `m ∈ [−1, 1]`.
pub fn score_for_margin(m: f64) -> f64 {
    let m = m.clamp(-1.0, 1.0);
    if m > 0.0 {
        0.75 + 0.25 * m
    } else if m < 0.0 {
        0.25 + 0.25 * m
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
            let after = (u.rating + k * (score - expected)).max(params.rating_floor);
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
    fn even_shutout_at_default_n_is_180() {
        // N = 5 -> T = 3, K = 360; shutout: winner 3 levels, loser 0.
        let c = two(3, 0, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 180.0).abs() < 1e-9, "{:?}", c);
        assert!((c[1].delta() + 180.0).abs() < 1e-9, "{:?}", c);
        assert_eq!(c[0].score, 1.0);
        assert_eq!(c[1].score, 0.0);
    }

    #[test]
    fn even_narrow_wins_at_default_n() {
        // loser reached rank 3 (1 level): m = 2/3 -> s = 0.9167 -> +150
        let c = two(3, 1, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 150.0).abs() < 1e-6, "{:?}", c);
        // loser reached rank 4 (2 levels): m = 1/3 -> s = 0.8333 -> +120
        let c = two(3, 2, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 120.0).abs() < 1e-6, "{:?}", c);
        assert!((c[1].delta() + 120.0).abs() < 1e-6, "{:?}", c);
    }

    #[test]
    fn k_scales_linearly_with_match_length() {
        for t in 1..=12usize {
            let c = two(t, 0, 1500.0, 1500.0, t);
            assert!(
                (c[0].delta() - 60.0 * t as f64).abs() < 1e-6,
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
        assert!((c[0].delta() - 360.0 * (1.0 - e)).abs() < 1e-9);
        assert!(c[0].delta() > 85.0 && c[0].delta() < 87.0, "{:?}", c);
        let c = two(3, 2, 1700.0, 1500.0, 3);
        assert!(c[0].delta() > 25.0 && c[0].delta() < 28.0, "{:?}", c);
        let c = two(2, 3, 1700.0, 1500.0, 3);
        assert!(c[0].delta() < -212.0 && c[0].delta() > -215.0, "{:?}", c);
        // zero-sum for two users
        assert!((c[0].delta() + c[1].delta()).abs() < 1e-9);
    }

    #[test]
    fn overshoot_is_capped_at_target() {
        let c = two(5, 0, 1500.0, 1500.0, 3);
        assert!((c[0].delta() - 180.0).abs() < 1e-9);
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
        assert!((c[0].delta() - 150.0).abs() < 1e-6);
        assert!((c[1].delta() - 150.0).abs() < 1e-6);
        assert!((c[2].delta() + 150.0).abs() < 1e-6);
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
        // winners: draw vs each other (0.5), 0.9167 vs the 1-level player,
        // 1.0 vs the 0-level player -> mean 0.8056 -> +110
        assert!((c[0].score - (0.5 + 11.0 / 12.0 + 1.0) / 3.0).abs() < 1e-9);
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
        assert!((score_for_margin(0.5) - 0.875).abs() < 1e-12);
        assert!((score_for_margin(-0.5) - 0.125).abs() < 1e-12);
        let c = two(0, 3, 0.05, 1500.0, 3);
        assert_eq!(c[0].after, 0.0);
    }
}
