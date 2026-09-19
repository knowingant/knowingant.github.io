//! In-memory sliding-window counters for the auth endpoints.
//!
//! Keys are free-form strings such as `login-ip:<ip>` or
//! `login:<ip>:<username>`; every key keeps the timestamps of its recent
//! events. There is one limiter per process, which is fine for a single
//! backend instance (see `DESIGN.md`, "Auth rules").

use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// Longest window any caller asks about. Events older than this are dropped
/// eagerly, and keys with no younger events are swept out.
const MAX_WINDOW: Duration = Duration::from_secs(3600);
/// Per-key cap on remembered events (bounds memory under abuse).
const MAX_EVENTS_PER_KEY: usize = 256;
/// Sweep idle keys every this many operations.
const SWEEP_EVERY: u64 = 512;

#[derive(Default)]
pub struct RateLimiter {
    inner: Mutex<Inner>,
}

#[derive(Default)]
struct Inner {
    events: HashMap<String, VecDeque<Instant>>,
    ops: u64,
}

impl Inner {
    fn tick(&mut self, now: Instant) {
        self.ops = self.ops.wrapping_add(1);
        if self.ops.is_multiple_of(SWEEP_EVERY) {
            self.events.retain(|_, q| {
                while q
                    .front()
                    .is_some_and(|t| now.duration_since(*t) >= MAX_WINDOW)
                {
                    q.pop_front();
                }
                !q.is_empty()
            });
        }
    }
}

impl RateLimiter {
    pub fn new() -> Self {
        Self::default()
    }

    /// Number of events recorded for `key` within the last `window`.
    pub fn count(&self, key: &str, window: Duration) -> usize {
        self.count_at(key, window, Instant::now())
    }

    /// Record an event for `key` now.
    pub fn record(&self, key: &str) {
        self.record_at(key, Instant::now())
    }

    fn count_at(&self, key: &str, window: Duration, now: Instant) -> usize {
        let window = window.min(MAX_WINDOW);
        let mut inner = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        inner.tick(now);
        let Some(q) = inner.events.get_mut(key) else {
            return 0;
        };
        while q
            .front()
            .is_some_and(|t| now.duration_since(*t) >= MAX_WINDOW)
        {
            q.pop_front();
        }
        if q.is_empty() {
            inner.events.remove(key);
            return 0;
        }
        q.iter()
            .rev()
            .take_while(|t| now.duration_since(**t) < window)
            .count()
    }

    fn record_at(&self, key: &str, now: Instant) {
        let mut inner = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        inner.tick(now);
        let q = inner.events.entry(key.to_string()).or_default();
        q.push_back(now);
        while q.len() > MAX_EVENTS_PER_KEY {
            q.pop_front();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_within_window_and_prunes() {
        let rl = RateLimiter::new();
        let t0 = Instant::now();
        assert_eq!(rl.count_at("k", Duration::from_secs(600), t0), 0);
        for i in 0..5 {
            rl.record_at("k", t0 + Duration::from_secs(i));
        }
        assert_eq!(
            rl.count_at("k", Duration::from_secs(600), t0 + Duration::from_secs(5)),
            5
        );
        // Only the events younger than the window count.
        assert_eq!(
            rl.count_at("k", Duration::from_secs(3), t0 + Duration::from_secs(5)),
            2
        );
        // Other keys are independent.
        assert_eq!(rl.count_at("other", Duration::from_secs(600), t0), 0);
        // After MAX_WINDOW everything is gone and the key is dropped.
        assert_eq!(
            rl.count_at(
                "k",
                Duration::from_secs(600),
                t0 + MAX_WINDOW + Duration::from_secs(10)
            ),
            0
        );
        assert!(rl.inner.lock().unwrap().events.is_empty());
    }

    #[test]
    fn caps_events_per_key() {
        let rl = RateLimiter::new();
        let t0 = Instant::now();
        for _ in 0..(MAX_EVENTS_PER_KEY + 50) {
            rl.record_at("k", t0);
        }
        assert_eq!(rl.count_at("k", MAX_WINDOW, t0), MAX_EVENTS_PER_KEY);
    }
}
