#!/usr/bin/env bash
# Run portfolio's Playwright suite inside the container.
#
# Baselines must be generated here, never on a host: host font rasterization
# lands a few percent off, which is indistinguishable from a real regression.
#
#   scripts/run-portfolio-tests.sh                       # run the suite
#   scripts/run-portfolio-tests.sh visual.spec --update-snapshots
#
# AUTH_SECRET is passed through rather than baked — .dockerignore keeps
# .env.local out of the image on purpose.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -z "${AUTH_SECRET:-}" ] && [ -f websites/portfolio/editor/.env.local ]; then
  AUTH_SECRET="$(grep -h '^AUTH_SECRET=' websites/portfolio/editor/.env.local | head -1 | cut -d= -f2- | tr -d '"')"
fi
export AUTH_SECRET="${AUTH_SECRET:-}"
export PLAYWRIGHT_ARGS="${*:-}"

mkdir -p blob-reports-portfolio

docker compose -f docker-compose.test.yml build shard-1
docker compose -f docker-compose.test.yml run --rm portfolio
