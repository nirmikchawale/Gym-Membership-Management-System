# Gridstone

Group 11 Software Engineering project. **Phases 3A — Repository Foundation & Project Initialization, 3B — Database Foundation, 3C — Authentication & Authorization, and 3D — Design System & Product Shell are complete and verified. The Members vertical product slice is now implemented and under the same verification gate. Plans, memberships/renewals, attendance, payments, dashboard and reporting remain later approved work.**

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

Phase 3B established persistence for members, membership plans, memberships/renewal lineage, attendance, and payments. Phase 3C added internal staff/admin authentication and authorization with CSRF-protected, database-backed sessions. Phase 3D established the responsive Gridstone product shell, design tokens, navigation, real routes/deep links and accessible motion. The current Members slice adds the first real business workflow on that foundation.

## Current product scope

The authenticated Members workflow supports:

- server-side search by member code, name, email and phone;
- active/inactive filtering;
- offset pagination with a hard 100-row request cap;
- member detail;
- create and edit;
- deactivate/reactivate instead of destructive deletion;
- normalized member codes, names, email and phone input;
- date validation and database uniqueness handling;
- authenticated reads and CSRF-protected state changes.

Current routes:

- `/` — workspace overview
- `/members` — completed Members product slice
- `/plans` — later approved slice
- `/memberships` — later approved slice
- `/attendance` — later approved slice
- `/payments` — later approved slice
- `/reports` — later approved slice

Later-module routes remain honest scope-boundary surfaces. They do not present unfinished CRUD behavior as completed product functionality.

## Public demo dataset

The Vercel-facing public preview is intentionally read-only and uses a deterministic synthetic member dataset. It now contains **112 member records: the original 12 demo records plus exactly 100 additional generated entries**. The demo names, phone numbers and `example.com` addresses are fabricated and are not imported customer records.

Public-preview mode is enabled only by the explicit build-time environment variable `VITE_PUBLIC_PREVIEW=true`. The authenticated Docker/FastAPI application does not infer preview mode from a hostname and continues to require a real staff session.

## Light and dark themes

Gridstone supports user-selectable **light** and **dark** appearance modes across sign-in, the authenticated workspace and the public preview. An explicit choice is stored locally on the device; otherwise the application uses the operating-system color preference. Theme changes apply without a page reload.

The responsive system keeps desktop and mobile first-class: member tables become touch-friendly cards on narrow screens, long names/contact details wrap safely, controls maintain touch-sized targets, and reduced-motion behavior remains supported.

See [`docs/design-system.md`](docs/design-system.md) for the Phase 3D design contract and [`docs/members-theme-security-master-prompt.md`](docs/members-theme-security-master-prompt.md) for this Members/theme/security execution contract.

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

Vite serves Gridstone on `http://localhost:5173` and proxies `/api/*` to `http://localhost:8000`. The application verifies the active staff session and API/PostgreSQL health at startup. In the single-origin image, FastAPI serves the built SPA and safely falls back to `index.html` for non-API deep links such as `/members`; unknown `/api/*` paths remain API 404s.

Useful endpoints in development/test:

- App: `http://localhost:5173`
- API health: `GET http://localhost:8000/api/v1/health`
- Login: `POST http://localhost:8000/api/v1/auth/login`
- Current user: `GET http://localhost:8000/api/v1/auth/me`
- Logout: `POST http://localhost:8000/api/v1/auth/logout`
- Members: `GET/POST http://localhost:8000/api/v1/members`
- Member detail/update: `GET/PATCH http://localhost:8000/api/v1/members/{id}`
- Member status: `POST http://localhost:8000/api/v1/members/{id}/activate|deactivate`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`
- Swagger UI: `http://localhost:8000/api/docs`

Interactive API docs/OpenAPI are development/test conveniences and are disabled when `APP_ENV` is production.

## Authentication and security

Phase 3C implements internal `admin` and `staff` accounts only. There is no public or member self-registration.

- Passwords are stored only as Argon2 hashes.
- Browser sessions are opaque, random server-side sessions; PostgreSQL stores only the session-token hash.
- Session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` outside development/test.
- Authenticated state-changing requests use session-bound CSRF validation.
- Sessions expire after 8 hours by default and are explicitly revoked on logout.
- Authorization is enforced server-side.
- API responses use `Cache-Control: no-store` plus browser security headers.
- Production responses add HSTS.
- Public preview mode must be explicitly enabled at build time; `*.vercel.app` no longer bypasses authentication automatically.
- CI audits frontend and backend dependencies in addition to lint/type/test/build checks.

No card number, CVV, bank credential, UPI PIN, or equivalent payment secret belongs in this system.

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
pnpm audit --audit-level high
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

CI additionally exports the locked backend dependency set and runs `pip-audit` before the Docker integration job.

## Repository structure

```text
.
├── frontend/              React/Vite Gridstone application
│   └── src/
│       ├── components/    Brand, UI primitives, theme toggle and workspace shell
│       ├── lib/           API, demo dataset, theme, navigation and motion helpers
│       ├── pages/         Overview, login, Members and later-slice surfaces
│       └── styles/        Design tokens, themes, Members and responsive system
├── backend/
│   ├── alembic/           Versioned database migrations
│   ├── alembic.ini        Alembic configuration
│   ├── app/api/           FastAPI routes and auth dependencies
│   ├── app/core/          Settings and security helpers
│   ├── app/db/models/     SQLAlchemy persistence models
│   ├── app/schemas/       API validation/response schemas
│   ├── app/services/      Authentication and member application services
│   ├── app/cli/           Administrative provisioning helpers
│   └── tests/             Backend/database/auth/member/security tests
├── data/                  Source-data boundary guidance
├── docs/                  Architecture, database, auth, design and workflow notes
├── scripts/               Developer verification helpers
├── tests/                 Cross-stack/E2E placeholder
├── .github/workflows/     CI including dependency audits
├── Dockerfile             Single-origin image with migration assets
├── docker-compose.yml     PostgreSQL + migration job + Gridstone stack
├── .env.example           Non-secret environment contract
└── README.md
```

## Development workflow

Use `main` plus short-lived branches such as `feat/*`, `fix/*`, `docs/*`, `test/*`, and `chore/*`. Open a pull request, keep `main` green, and use Conventional Commit-style messages. See [`docs/development-workflow.md`](docs/development-workflow.md).

## Phase boundary

**Phase 3D — Design System & Product Shell remains complete and verified. The Members vertical product slice is the only business slice implemented by this change.** Plans, memberships/renewals, attendance, payments, dashboard and reporting remain later work. The Vercel site is a public preview, not final production publication. Final production publication remains gated on the later approved product slices and final hardening.
