#!/usr/bin/env bash
# Per-boot startup for the Simplifiedaction Cloud Agent environment.
# Idempotent: starts PostgreSQL and reconciles the app database/role.
set -euo pipefail

# Start the PostgreSQL cluster (no-op if already running).
sudo pg_ctlcluster 16 main start 2>/dev/null || true

# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q 2>/dev/null; then
    break
  fi
  sleep 1
done

# Ensure the app role password and database exist (idempotent).
sudo -u postgres psql -tAc "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='simplifiedaction'" | grep -q 1; then
  sudo -u postgres createdb simplifiedaction
fi

echo "start.sh: PostgreSQL ready (database 'simplifiedaction')"
