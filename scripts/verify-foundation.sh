#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

echo "==> Frontend checks"
(
  cd frontend
  pnpm format:check
  pnpm lint
  pnpm typecheck
  pnpm test:run
  pnpm build
)

echo "==> Database migration checks"
uv run --project backend alembic -c backend/alembic.ini upgrade head
uv run --project backend alembic -c backend/alembic.ini check

echo "==> Backend checks"
uv run --project backend ruff check backend
uv run --project backend ruff format --check backend
uv run --project backend mypy backend/app backend/tests
(
  cd backend
  uv run python -m pytest
)

echo "==> Migration reversibility"
uv run --project backend alembic -c backend/alembic.ini downgrade base
uv run --project backend alembic -c backend/alembic.ini upgrade head

echo "==> Container stack"
docker compose up -d --build
cleanup() {
  docker compose down -v
}
trap cleanup EXIT

for attempt in {1..30}; do
  if curl --fail --silent --show-error http://localhost:8000/api/v1/health >/dev/null; then
    echo "Foundation verification passed."
    exit 0
  fi
  sleep 2
done

docker compose logs
exit 1
