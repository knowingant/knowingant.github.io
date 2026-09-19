#!/bin/sh
# Build the shengji frontend and publish it into ./shengji/ (served by GitHub
# Pages at https://knowingant.github.io/shengji/).
#
# Requires: rustup (stable + wasm32-unknown-unknown target), wasm-pack, node,
# yarn.  See shengji-src/DEPLOY.md.
#
#   ./scripts/build_shengji.sh            # build + publish
#   ./scripts/build_shengji.sh --check    # also run Rust/TS tests and lints
set -eu

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
SRC="$ROOT/shengji-src"
OUT="$ROOT/shengji"

export PATH="/opt/homebrew/opt/rustup/bin:/opt/homebrew/bin:$HOME/.cargo/bin:$PATH"

if [ "${1:-}" = "--check" ]; then
  echo "==> cargo test"
  (cd "$SRC" && cargo test --workspace --exclude storage && cargo test -p storage --lib)  # storage integration tests need a live Redis
  echo "==> cargo clippy"
  (cd "$SRC" && cargo clippy --all -- -D warnings)
fi

echo "==> yarn install"
(cd "$SRC/frontend" && yarn install --frozen-lockfile)

if [ "${1:-}" = "--check" ]; then
  echo "==> yarn lint / prettier / test"
  (cd "$SRC/frontend" && yarn lint && yarn prettier --check && yarn test)
fi

echo "==> yarn build"
(cd "$SRC/frontend" && yarn build)

echo "==> publish to $OUT"
mkdir -p "$OUT"
rsync -a --delete --exclude '*.map' "$SRC/frontend/dist/" "$OUT/"

echo "Done. Commit ./shengji and push to publish."
echo "Backend URL used by the static site: $(grep _API_HOST "$OUT/runtime.js")"
