# Gym Membership Management System

Group 11 Software Engineering project. **Phase 3A — Repository Foundation & Project Initialization is complete and verified on `main`. Phase 3B — Database Foundation is implemented with completion gated by CI and post-merge verification.**

## Architecture baseline

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic + SQLAlchemy + Psycopg 3
- Database: PostgreSQL 18 + Alembic migrations
- Package managers: pnpm (frontend), uv (backend)
- Deployment shape: single-origin Dockerized application
- Local development timezone: `Asia/Kolkata`

Phase 3B adds persistence only: SQLAlchemy tables for members, membership plans, memberships/renewal lineage, attendance, and payments; database constraints/indexes; deterministic Alembic migrations; and integration tests. Business CRUD APIs, authentication/authorization, dashboards, reports, and real source-data imports remain out of scope.

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

Start PostgreSQL and apply migrations:

```bash
docker compose up -d db
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

## Local development

Start the backend from the repository root after migrations are current:

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

## Database migrations

Apply all migrations:

```bash
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

Inspect the current revision and check model/migration drift:

```bash
uv run --project backend alembic -c backend/alembic.ini current
uv run --project backend alembic -c backend/alembic.ini check
```

Create a future migration only after changing SQLAlchemy metadata:

```bash
uv run --project backend alembic -c backend/alembic.ini revision --autogenerate -m "describe change"
```

See [`docs/database.md`](docs/database.md) for schema decisions and invariants.

## Docker

Build and run PostgreSQL, the migration job, and the single-origin application:

```bash
docker compose up --build
```

Compose waits for PostgreSQL, runs `alembic upgrade head`, and only then starts the app. Open `http://localhost:8000`. Stop the stack with:

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

Backend/database:

```bash
uv run --project backend alembic -c backend/alembic.ini upgrade head
uv run --project backend alembic -c backend/alembic.ini check
uv run --project backend ruff check backend
uv run --project backend ruff format --check backend
uv run --project backend mypy backend/app backend/tests
cd backend && uv run python -m pytest
```

Run the complete local foundation verification helper after dependencies are installed and PostgreSQL is running:

```bash
bash scripts/verify-foundation.sh
```

## Repository structure

```text
.
├── frontend/              React/Vite application
├── backend/
│   ├── alembic/           Versioned database migrations
│   ├── alembic.ini        Alembic configuration
│   ├── app/db/models/     SQLAlchemy persistence models
│   └── tests/             Backend and database integration tests
├── data/                  Source-data boundary guidance
├── docs/                  Architecture, database and workflow notes
├── scripts/               Developer verification helpers
├── tests/                 Cross-stack/E2E placeholder
├── .github/workflows/     CI
├── Dockerfile             Production single-origin image with migration assets
├── docker-compose.yml     PostgreSQL + migration job + application stack
├── .env.example           Non-secret environment contract
└── README.md
```

## Development workflow

Use `main` plus short-lived branches such as `feat/*`, `fix/*`, `docs/*`, `test/*`, and `chore/*`. Open a pull request, keep `main` green, and use Conventional Commit-style messages. See [`docs/development-workflow.md`](docs/development-workflow.md).

## Security notes

- Never commit `.env` or real secrets.
- The values in `.env.example` and Compose defaults are development-only placeholders.
- No card number, CVV, bank credential, UPI PIN, or equivalent payment secret belongs in this system.
- Phase 3B payments persist transaction metadata only.
- Authentication and authorization remain Phase 3C work and are intentionally not implemented in Phase 3B.

## Phase boundary

Phase 3B is limited to database persistence, migrations, constraints/indexes, and verification. Business feature/API behavior begins only in its appropriate later phase.
