#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SHARD_TOTAL="${SHARD_TOTAL:-4}"
export SHARD_TOTAL
export PLAYWRIGHT_ARGS="${*:-}"

echo "Running sharded Playwright tests with SHARD_TOTAL=$SHARD_TOTAL"
[ -n "$PLAYWRIGHT_ARGS" ] && echo "Forwarding args: $PLAYWRIGHT_ARGS"

rm -rf blob-reports
mkdir -p blob-reports

set +e
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
COMPOSE_EXIT_CODE=$?
set -e

docker compose -f docker-compose.test.yml down --remove-orphans >/dev/null 2>&1 || true

echo "Merging blob reports..."
(
  cd websites/recipe-website/editor
  pnpm exec playwright merge-reports --reporter=html,list "$REPO_ROOT/blob-reports/"
)

echo "Merged HTML report at: $REPO_ROOT/websites/recipe-website/editor/playwright-report/"
exit "$COMPOSE_EXIT_CODE"
