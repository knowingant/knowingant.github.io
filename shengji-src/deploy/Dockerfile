# Backend image for the knowingant shengji fork.
#
# Build context is the REPO ROOT (knowingant.github.io), not shengji-src, so
# that the prebuilt frontend in ./shengji can be bundled and served by the
# backend as a fallback UI (the primary UI is GitHub Pages).
#
#   docker build -f shengji-src/deploy/Dockerfile -t shengji .
#   fly deploy   (fly.toml at the repo root points here)
#
# Only Rust is compiled here (no node/wasm), which keeps the build simple and
# reproducible. Build the frontend locally with scripts/build_shengji.sh.

FROM rust:1-bookworm AS builder
WORKDIR /app

# Cache dependencies: copy manifests first.
COPY shengji-src/Cargo.toml shengji-src/Cargo.lock ./
COPY shengji-src/backend/Cargo.toml backend/Cargo.toml
COPY shengji-src/backend/backend-types/Cargo.toml backend/backend-types/Cargo.toml
COPY shengji-src/core/Cargo.toml core/Cargo.toml
COPY shengji-src/mechanics/Cargo.toml mechanics/Cargo.toml
COPY shengji-src/rating/Cargo.toml rating/Cargo.toml
COPY shengji-src/storage/Cargo.toml storage/Cargo.toml
COPY shengji-src/wasm-rpc-impl/Cargo.toml wasm-rpc-impl/Cargo.toml
COPY shengji-src/frontend/json-schema-bin/Cargo.toml frontend/json-schema-bin/Cargo.toml
COPY shengji-src/frontend/shengji-wasm/Cargo.toml frontend/shengji-wasm/Cargo.toml
# Dummy sources so `cargo build` can resolve the workspace and compile deps.
RUN mkdir -p backend/src backend/backend-types/src core/src mechanics/src rating/src \
      storage/src wasm-rpc-impl/src frontend/json-schema-bin/src frontend/shengji-wasm/src \
    && echo 'fn main() {}' > backend/src/main.rs \
    && echo 'fn main() {}' > frontend/json-schema-bin/src/main.rs \
    && for d in backend/backend-types core mechanics rating storage wasm-rpc-impl frontend/shengji-wasm; do echo '' > $d/src/lib.rs; done \
    && touch backend/backend-types/dict.zstd \
    && cargo build --release --bin shengji 2>/dev/null || true

# Real sources.
COPY shengji-src/backend backend
COPY shengji-src/core core
COPY shengji-src/mechanics mechanics
COPY shengji-src/rating rating
COPY shengji-src/storage storage
COPY shengji-src/wasm-rpc-impl wasm-rpc-impl
COPY shengji-src/frontend/json-schema-bin frontend/json-schema-bin
COPY shengji-src/frontend/shengji-wasm frontend/shengji-wasm
# The backend's tests reference this file; keep the path valid for cargo.
COPY shengji-src/frontend/src/generated frontend/src/generated
RUN touch backend/src/main.rs backend/backend-types/src/lib.rs core/src/lib.rs \
      mechanics/src/lib.rs rating/src/lib.rs storage/src/lib.rs wasm-rpc-impl/src/lib.rs \
    && cargo build --release --bin shengji

FROM debian:bookworm-slim
# sqlite3 is only for backups: `sqlite3 /data/shengji.db '.backup ...'` over
# `fly ssh console` (DEPLOY.md, "Data").
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates sqlite3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/shengji /app/shengji
# Prebuilt frontend, served at / as a fallback UI (GitHub Pages is the real
# one); the backend's own /runtime.js makes it use the same origin for the API.
#
# ./shengji must exist in the build context (the repo root): it is the output
# of scripts/build_shengji.sh and is committed next to shengji-src. Docker
# does not skip a missing COPY source, so `fly deploy` / `docker build` fails
# with "not found" until the frontend has been built at least once.
COPY shengji /app/static
ENV STATIC_DIR=/app/static \
    DATABASE_PATH=/data/shengji.db \
    DUMP_PATH=/data/shengji_state.json \
    MESSAGE_PATH=/data/shengji_messages.json \
    PORT=3030
EXPOSE 3030
ENTRYPOINT ["/app/shengji"]
