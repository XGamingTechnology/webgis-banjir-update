#!/usr/bin/env sh
set -eu

BRANCH="${WEBGIS_BRANCH:-Staging}"
COMPOSE_FILE="${WEBGIS_COMPOSE_FILE:-compose.staging.yml}"
HEALTH_URL="${WEBGIS_HEALTH_URL:-http://127.0.0.1:3100/health}"
MAX_ATTEMPTS="${WEBGIS_HEALTH_ATTEMPTS:-30}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit, stash, or discard local changes before deploying." >&2
  git status --short
  exit 1
fi

echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

echo "==> Checking out $BRANCH"
git checkout "$BRANCH"

echo "==> Fast-forwarding from origin/$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Validating Docker Compose"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "==> Building and starting staging"
docker compose -f "$COMPOSE_FILE" up -d --build

echo "==> Waiting for health endpoint: $HEALTH_URL"
attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if curl -fsS "$HEALTH_URL" >/tmp/webgis-health.json 2>/dev/null; then
    echo "==> Health check passed"
    cat /tmp/webgis-health.json
    echo
    docker compose -f "$COMPOSE_FILE" ps
    echo "==> Deployed commit: $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 1
  attempt=$((attempt + 1))
done

echo "ERROR: health check failed after $MAX_ATTEMPTS attempts." >&2
docker compose -f "$COMPOSE_FILE" ps >&2 || true
docker logs --tail=100 webgis-banjir-staging >&2 || true
exit 1
