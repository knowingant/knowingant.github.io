//! Verification of Google ID tokens ("Sign in with Google" credentials).
//!
//! Rules (see `DESIGN.md`, "Auth rules"): RS256 signature against Google's
//! JWKS, key chosen by `kid`, cached for ~6 hours, refetched on an unknown
//! `kid` at most once per minute and never at startup; `iss` must be one of
//! Google's issuers, `aud` must equal our client ID, `exp` is checked with
//! 60 s leeway. Identity is `sub`; `email` is reported only if verified.

use std::sync::Mutex;
use std::time::{Duration, Instant};

use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

pub const JWKS_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS: [&str; 2] = ["accounts.google.com", "https://accounts.google.com"];
const CACHE_TTL: Duration = Duration::from_secs(6 * 3600);
const MIN_REFETCH_INTERVAL: Duration = Duration::from_secs(60);
const FETCH_TIMEOUT: Duration = Duration::from_secs(10);
const LEEWAY_SECS: u64 = 60;

/// One RSA public key from Google's JWKS document.
#[derive(Clone, Debug, Deserialize, PartialEq)]
pub struct Jwk {
    pub kid: String,
    pub kty: String,
    #[serde(default)]
    pub alg: Option<String>,
    pub n: String,
    pub e: String,
}

impl Jwk {
    fn is_rs256(&self) -> bool {
        self.kty == "RSA" && self.alg.as_deref().is_none_or(|a| a == "RS256")
    }
}

#[derive(Deserialize)]
struct JwkSet {
    keys: Vec<Jwk>,
}

/// The claims we read out of a verified ID token.
#[derive(Deserialize)]
struct Claims {
    sub: String,
    #[serde(default)]
    email: Option<String>,
    /// Google sends a boolean; be lenient and accept `"true"` too.
    #[serde(default)]
    email_verified: Option<serde_json::Value>,
}

/// A verified Google identity.
#[derive(Clone, Debug, PartialEq)]
pub struct GoogleIdentity {
    /// Google's stable account id (the `sub` claim).
    pub sub: String,
    /// The account email, only if Google reports it as verified.
    pub email: Option<String>,
    /// The email regardless of verification; used only to suggest a
    /// username, never stored.
    pub email_hint: Option<String>,
}

#[derive(Debug, PartialEq)]
pub enum GoogleError {
    /// Malformed, expired, mis-signed, wrong issuer/audience, unknown key.
    Invalid,
    /// Google's keys could not be fetched and none are cached.
    Unavailable,
}

pub struct GoogleVerifier {
    client_id: String,
    http: reqwest::Client,
    jwks: Mutex<Option<(Instant, Vec<Jwk>)>>,
}

impl GoogleVerifier {
    pub fn new(client_id: String) -> Self {
        let http = reqwest::Client::builder()
            .timeout(FETCH_TIMEOUT)
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        GoogleVerifier {
            client_id,
            http,
            jwks: Mutex::new(None),
        }
    }

    /// Verify a Google ID token and return the identity it asserts.
    pub async fn verify(&self, credential: &str) -> Result<GoogleIdentity, GoogleError> {
        let credential = credential.trim();
        if credential.is_empty() || credential.len() > 8192 {
            return Err(GoogleError::Invalid);
        }
        let header = decode_header(credential).map_err(|_| GoogleError::Invalid)?;
        if header.alg != Algorithm::RS256 {
            return Err(GoogleError::Invalid);
        }
        let kid = header.kid.ok_or(GoogleError::Invalid)?;
        let jwk = self.key_for(&kid).await?.ok_or(GoogleError::Invalid)?;
        let key =
            DecodingKey::from_rsa_components(&jwk.n, &jwk.e).map_err(|_| GoogleError::Invalid)?;

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[self.client_id.as_str()]);
        validation.set_issuer(&ISSUERS);
        validation.set_required_spec_claims(&["exp", "iss", "aud", "sub"]);
        validation.leeway = LEEWAY_SECS;
        validation.validate_exp = true;

        let data =
            decode::<Claims>(credential, &key, &validation).map_err(|_| GoogleError::Invalid)?;
        let claims = data.claims;
        if claims.sub.is_empty() {
            return Err(GoogleError::Invalid);
        }
        let verified = matches!(claims.email_verified, Some(serde_json::Value::Bool(true)))
            || matches!(
                &claims.email_verified,
                Some(serde_json::Value::String(s)) if s.eq_ignore_ascii_case("true")
            );
        let email_hint = claims.email.filter(|e| !e.is_empty());
        Ok(GoogleIdentity {
            sub: claims.sub,
            email: if verified { email_hint.clone() } else { None },
            email_hint,
        })
    }

    /// The cached key with this `kid`, fetching / refreshing the JWKS as the
    /// caching rules allow.
    async fn key_for(&self, kid: &str) -> Result<Option<Jwk>, GoogleError> {
        let find = |keys: &[Jwk]| keys.iter().find(|k| k.kid == kid && k.is_rs256()).cloned();

        let (have_cache, fresh, recently_fetched, found) = {
            let guard = self.jwks.lock().unwrap_or_else(|e| e.into_inner());
            match &*guard {
                Some((fetched_at, keys)) => {
                    let age = fetched_at.elapsed();
                    (
                        true,
                        age < CACHE_TTL,
                        age < MIN_REFETCH_INTERVAL,
                        find(keys.as_slice()),
                    )
                }
                None => (false, false, false, None),
            }
        };
        if fresh {
            if found.is_some() {
                return Ok(found);
            }
            if recently_fetched {
                // Unknown kid, but we asked Google less than a minute ago.
                return Ok(None);
            }
        }

        match self.fetch().await {
            Ok(keys) => {
                let found = find(keys.as_slice());
                *self.jwks.lock().unwrap_or_else(|e| e.into_inner()) = Some((Instant::now(), keys));
                Ok(found)
            }
            Err(e) => {
                slog::warn!(crate::ROOT_LOGGER, "Failed to fetch Google JWKS";
                    "error" => format!("{e}"), "have_cache" => have_cache);
                if have_cache {
                    // Keys rotate rarely; a stale set is better than nothing.
                    Ok(found)
                } else {
                    Err(GoogleError::Unavailable)
                }
            }
        }
    }

    async fn fetch(&self) -> Result<Vec<Jwk>, reqwest::Error> {
        let set: JwkSet = self
            .http
            .get(JWKS_URL)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        Ok(set.keys)
    }

    /// Pretend the JWKS was just fetched and contained `keys`.
    #[cfg(test)]
    pub fn set_keys_for_tests(&self, keys: Vec<Jwk>) {
        *self.jwks.lock().unwrap() = Some((Instant::now(), keys));
    }
}
