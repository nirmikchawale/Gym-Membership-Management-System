FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

FROM python:3.14-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    STATIC_DIR="/app/static"

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.10.0 /uv /uvx /bin/
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic
COPY backend/app ./app
COPY --from=frontend-build /app/frontend/dist ./static

EXPOSE 8000

CMD ["/bin/sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
