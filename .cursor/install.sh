#!/usr/bin/env bash
# Repository bootstrap for the Simplifiedaction Cloud Agent environment.
# Idempotent: safe to run repeatedly against cached state.
set -euo pipefail

# --- System dependency: PostgreSQL (accounts, favorites, notation history) ---
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

# --- Node dependencies (respects the committed lockfile) ---
npm ci

# --- Local dev config (gitignored). Finnhub/Stripe stay empty => graceful fallback. ---
if [ ! -f .env ]; then
  cat > .env <<'EOF'
PORT=3000
JWT_SECRET=dev-secret-change-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simplifiedaction
FINNHUB_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
EOF
fi

echo "install.sh: done"
