# Gym Membership Management System

Group 11 Software Engineering project. **Phase 3A — Repository Foundation & Project Initialization is complete and verified on `main`. Phase 3B — Database Foundation has not started.**

## Architecture baseline

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic + SQLAlchemy + Psycopg 3
- Database: PostgreSQL 18
- Package managers: pnpm (frontend), uv (backend)
- Deployment shape: single-origin Dockerized application
- Local development timezone: `Asia/Kolkata`

Phase 3A intentionally contains no gym business features. It proves the engineering foundation: applications start, API health works, the frontend reaches the API, PostgreSQL connectivity is verified, quality checks run, Docker builds, and CI reproduces the checks.

## Prerequisites

Install:

- Node.js 24 LTS
- Corepack / pnpm 10
- Python 3.14
- uv
- Docker with Docker Compose

## First-time setup

```bash
git clone https://github.com/nirmikchawale/Gym-Membership-Management-System.git
cd Gym-Membership-Management-System
cp .env.example .env
corepack enable
cd frontend && pnpm install && cd ..
uv sync --project backend --group dev
```

## Local development

Start PostgreSQL:

```bash
docker compose up -d db
```

Start the backend from the repository root:

```bash
uv run --project backend uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
pnpm dev
```

Vite serves the frontend on `http://localhost:5173` and proxies `/api/*` to `http://localhost:8000`. The application shell calls `GET /api/v1/health`, whose success also proves a live PostgreSQL connection.

Useful endpoints:

- App: `http://localhost:5173`
- API health: `http://localhost:8000/api/v1/health`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`
- Swagger UI: `http://localhost:8000/api/docs`

## Docker

Build and run the single-origin application plus PostgreSQL:

```bash
docker compose up --build
```

Then open `http://localhost:8000`. Stop the stack with:

```bash
docker compose down
```

## Quality commands

Frontend:

```bash
cd frontend
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Backend:

```bash
uv run --project backend ruff check backend
uv run --project backend ruff format --check backend
uv run --project backend mypy backend/app backend/tests
cd backend && uv run python -m pytest
```

Run the local foundation verification helper (after dependencies are installed and PostgreSQL is running):

```bash
bash scripts/verify-foundation.sh
```

## Repository structure

```text
.
├── frontend/              React/Vite application
├── backend/               FastAPI application
├── data/                  Dataset guidance; no production/demo import yet
├── docs/                  Architecture and workflow notes
├── scripts/               Developer verification helpers
├── tests/                 Cross-stack/E2E placeholder
├── .github/workflows/     CI
├── Dockerfile             Production single-origin image
├── docker-compose.yml     Local PostgreSQL + application stack
├── .env.example           Non-secret environment contract
└── README.md
```

## Development workflow

Use `main` plus short-lived branches such as `feat/*`, `fix/*`, `docs/*`, `test/*`, and `chore/*`. Open a pull request, keep `main` green, and use Conventional Commit-style messages. See [`docs/development-workflow.md`](docs/development-workflow.md).

## Security notes

- Never commit `.env` or real secrets.
- The values in `.env.example` and Compose defaults are development-only placeholders.
- No card number, CVV, bank credential, or UPI PIN handling belongs in this system.
- Authentication and authorization are Phase 3C work and are intentionally not implemented in Phase 3A.

## Phase boundary

The Phase 3A exit gate has passed. The next phase is **Phase 3B — Database Foundation**. Business-feature implementation must not begin before its appropriate phase.
