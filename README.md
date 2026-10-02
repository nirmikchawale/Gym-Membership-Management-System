# Gridstone

Group 11 Software Engineering project. **Phases 3A — Repository Foundation & Project Initialization, 3B — Database Foundation, 3C — Authentication & Authorization, and 3D — Design System & Product Shell are complete and verified on `main`. The next vertical product slice is Members.**

Gridstone is the product name for the Gym Membership Management System.

## Architecture baseline

- Frontend: React + TypeScript + Vite + React Router
- UI iconography: Lucide React
- Backend: FastAPI + Pydantic + SQLAlchemy + Psycopg 3
- Database: PostgreSQL 18 + Alembic migrations
- Authentication: Argon2 password hashing + opaque server-side sessions
- Authorization: server-enforced `admin` / `staff` roles
- Package managers: pnpm (frontend), uv (backend)
- Deployment shape: single-origin Dockerized application
- Local development timezone: `Asia/Kolkata`

Phase 3B established persistence for members, membership plans, memberships/renewal lineage, attendance, and payments. Phase 3C added internal staff/admin authentication and authorization with CSRF-protected, database-backed sessions. Phase 3D established the responsive Gridstone product shell, design tokens, navigation, real routes/deep links, accessible motion and honest future-module blueprints. Business CRUD APIs, dashboard/reporting data, member self-service, and real source-data imports remain future work.

## Gridstone product shell

The verified Phase 3D interface uses a Graphite + electric cobalt + mineral violet visual system with a geometric Gridstone mark, responsive desktop/mobile navigation, live staff identity and system-health treatment, and restrained scroll-tide ambient depth that respects `prefers-reduced-motion`.

Current authenticated product routes:

- `/` — workspace overview
- `/members`
- `/plans`
- `/memberships`
- `/attendance`
- `/payments`
- `/reports`

The business-module routes are intentionally design-system blueprints until their owning vertical slices are implemented. They do not fabricate operational records or pretend unfinished CRUD exists.

See [`docs/design-system.md`](docs/design-system.md) for the Phase 3D design, responsive, accessibility and motion contract.

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

Provision the first Gridstone administrator through a hidden password prompt:

```bash
cd backend
uv run python -m app.cli.create_user --email admin@example.com --name "Gym Admin" --role admin
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

Vite serves Gridstone on `http://localhost:5173` and proxies `/api/*` to `http://localhost:8000`. The application verifies the active staff session and API/PostgreSQL health at startup. In the production single-origin image, FastAPI serves the built SPA and safely falls back to `index.html` for non-API deep links such as `/members`; unknown `/api/*` paths remain API 404s.

Useful endpoints:

- App: `http://localhost:5173`
- API health: `http://localhost:8000/api/v1/health`
- Login: `POST http://localhost:8000/api/v1/auth/login`
- Current user: `GET http://localhost:8000/api/v1/auth/me`
- Logout: `POST http://localhost:8000/api/v1/auth/logout`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`
- Swagger UI: `http://localhost:8000/api/docs`

## Authentication

Phase 3C implements internal `admin` and `staff` accounts only. There is no public or member self-registration.

- Passwords are stored only as Argon2 hashes.
- Browser sessions are opaque, random server-side sessions; PostgreSQL stores only the session-token hash.
- Session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` outside development/test.
- Authenticated state-changing requests use CSRF protection.
- Sessions expire after 8 hours by default and are explicitly revoked on logout.
- Authorization is enforced server-side.

See [`docs/authentication.md`](docs/authentication.md) for the Phase 3C security contract and provisioning workflow.

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

Create a future revision only after changing SQLAlchemy metadata:

```bash
uv run --project backend alembic -c backend/alembic.ini revision --autogenerate -m "describe change"
```

See [`docs/database.md`](docs/database.md) for schema decisions and invariants.

## Docker

Build and run PostgreSQL, the migration job, and the single-origin Gridstone application:

```bash
docker compose up --build
```

Compose waits for PostgreSQL, runs `alembic upgrade head`, and only then starts Gridstone. Open `http://localhost:8000`. Stop the stack with:

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
├── frontend/              React/Vite Gridstone application
│   └── src/
│       ├── components/    Brand, UI primitives and workspace shell
│       ├── lib/           API, navigation, app state and motion helpers
│       ├── pages/         Overview, login and routed module surfaces
│       └── styles/        Gridstone design tokens and responsive system
├── backend/
│   ├── alembic/           Versioned database migrations
│   ├── alembic.ini        Alembic configuration
│   ├── app/api/           FastAPI routes and auth dependencies
│   ├── app/core/          Settings and security helpers
│   ├── app/db/models/     SQLAlchemy persistence models
│   ├── app/services/      Application services, including authentication
│   ├── app/cli/           Administrative provisioning helpers
│   └── tests/             Backend/database/auth integration tests
├── data/                  Source-data boundary guidance
├── docs/                  Architecture, database, auth, design and workflow notes
├── scripts/               Developer verification helpers
├── tests/                 Cross-stack/E2E placeholder
├── .github/workflows/     CI
├── Dockerfile             Production single-origin image with migration assets
├── docker-compose.yml     PostgreSQL + migration job + Gridstone stack
├── .env.example           Non-secret environment contract
└── README.md
```

## Development workflow

Use `main` plus short-lived branches such as `feat/*`, `fix/*`, `docs/*`, `test/*`, and `chore/*`. Open a pull request, keep `main` green, and use Conventional Commit-style messages. See [`docs/development-workflow.md`](docs/development-workflow.md).

## Security notes

- Never commit `.env` or real secrets.
- The values in `.env.example` and Compose defaults are development-only placeholders.
- Never store plaintext passwords or raw session tokens in PostgreSQL.
- No card number, CVV, bank credential, UPI PIN, or equivalent payment secret belongs in this system.
- Phase 3B payments persist transaction metadata only.
- Phase 3C protects internal staff/admin access; member self-service, password reset and MFA are not implemented.
- Phase 3D adds no business write paths; future module actions must preserve server-side authorization and CSRF controls.

## Phase boundary

**Phase 3D — Design System & Product Shell is complete and verified.** The next vertical product slice is **Members**. Plans, memberships/renewals, attendance, payments, dashboard and reporting remain later work. Production publication should occur only after those approved product slices and final hardening are complete.
