#!/usr/bin/env bash
# Run the cms demo's Playwright suite inside the container.
#
# The demo is the only suite that exercises the engine on its own, and it was
# the only one with no container path: it ran in CI and on whoever's laptop
# thought to run it, so a green local run of everything else never included it.
#
# Dev mode, like every other containerized suite here — the config's webServer
# runs `pnpm dev:test`. Production mode is `pnpm e2e-start` on a host, and it is
# a diagnostic rather than a gate: see F20 in
# packages/cms/docs/incremental-regeneration.md.
#
# No AUTH_SECRET, unlike portfolio's and recipe's runners: the demo has no auth.
#
#   scripts/run-demo-tests.sh                 # the whole suite
#   scripts/run-demo-tests.sh items.spec      # one spec
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PLAYWRIGHT_ARGS="${*:-}"

rm -rf blob-reports-demo
mkdir -p blob-reports-demo

set +e
docker compose -f docker-compose.test.yml run --rm --build demo
COMPOSE_EXIT_CODE=$?
set -e

# The blob report is only useful once merged — the raw directory is a zip nobody
# can read.
echo "Merging blob report..."
(
  cd packages/cms/demo
  pnpm exec playwright merge-reports --reporter=html,list "$REPO_ROOT/blob-reports-demo/"
)

echo "Merged HTML report at: $REPO_ROOT/packages/cms/demo/playwright-report/"
exit "$COMPOSE_EXIT_CODE"
