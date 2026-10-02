# Gridstone

Group 11 Software Engineering project for a Gym Membership Management System.

## Current verified status

Gridstone has moved beyond the original MVP foundation. The repository now contains the verified business and operational slices below:

| Phase / slice | Status | What is delivered |
| --- | --- | --- |
| Phase 3A — Repository Foundation | ✅ Verified | React/Vite frontend, FastAPI backend, Docker, CI and repository baseline |
| Phase 3B — Database Foundation | ✅ Verified | PostgreSQL 18, SQLAlchemy models, Alembic migrations and database invariants |
| Phase 3C — Authentication & Authorization | ✅ Verified | Admin/staff accounts, Argon2 passwords, opaque sessions, CSRF and server authorization |
| Phase 3D — Design System & Product Shell | ✅ Verified | Responsive product shell, navigation, light/dark themes and deep links |
| Members | ✅ Verified | Search, filtering, create/edit, activation controls and validation |
| Membership Plans | ✅ Verified | Plan catalogue, pricing/duration, admin mutation controls and historical price safety |
| Phase 4A — Membership Lifecycle & Renewals | ✅ Verified | Assignment, renewals, lifecycle states, overlap protection and renewal lineage |
| Phase 4B — Attendance Operations | ✅ Verified | Access validation, check-in/out, open visits, attendance history and front-desk workflow |
| Phase 4C — Payments | ⛔ Intentionally out of scope | No payment capture, receipts, revenue or payment-provider integration in this project |
| Phase 4D — Dashboard & Reporting | ✅ Verified | Operational dashboard/reporting from persisted member, membership and attendance data |
| Phase 4E — Operational Administration | ✅ Verified | Deterministic non-production seed, production guard, admin bootstrap, config validation and backup/restore rehearsal |
| Phase 4F — Cross-Feature Hardening | ✅ Verified | Cross-feature workflow tests, session/CSRF hardening, browser headers, safe logging, mobile focus and regression coverage |
| Phase 4G — Production Infrastructure | ▶️ Next | Managed PostgreSQL + real single-origin production application service |
| Phase 4H — Production Verification | ⏳ Pending 4G | Deploy exact green `main`, migrate, provision admin and verify the public HTTPS system end to end |

**Authoritative verified Phase 4F main commit:** `fca1b9f8489168fa0c045821b87c8c26964d2f2c`.

The approved completion path is now:

**4B ✅ → 4C omitted → 4D ✅ → 4E ✅ → 4F ✅ → 4G → 4H**

## What Gridstone can do today

The authenticated application currently supports:

- internal `admin` and `staff` authentication;
- member search, filtering, creation, editing and activation/deactivation;
- membership-plan catalogue and administrator-controlled plan changes;
- membership assignment and price/currency snapshots;
- scheduled, active, expired, frozen and cancelled membership states;
- renewals with lineage and overlap protection;
- front-desk membership access validation;
- attendance check-in and check-out;
- one-open-visit-per-member protection;
- attendance history and filtering;
- operational dashboard and reporting from persisted records;
- responsive desktop/mobile layouts;
- user-selectable light and dark appearance;
- CSRF-protected mutations and server-side authorization;
- deterministic staging/demo data with production seeding blocked;
- PostgreSQL backup/restore rehearsal in CI;
- production-safe request IDs, HTTP logging and hardened browser security headers.

## Architecture

- **Frontend:** React + TypeScript + Vite + React Router
- **Backend:** FastAPI + Pydantic + SQLAlchemy + Psycopg 3
- **Database:** PostgreSQL 18 + Alembic
- **Authentication:** Argon2 password hashing + opaque server-side sessions
- **Authorization:** server-enforced `admin` / `staff` roles
- **Deployment target:** single-origin Docker application with managed PostgreSQL
- **Timezone:** `Asia/Kolkata`
- **Frontend package manager:** pnpm 10
- **Backend package manager:** uv

The single-origin design is intentional: the browser talks to one HTTPS Gridstone application, FastAPI serves the built React SPA and API, and PostgreSQL remains private behind the application service.

## Current routes

- `/` — operational overview/dashboard
- `/members` — Members
- `/plans` — Membership Plans
- `/memberships` — Membership Lifecycle & Renewals
- `/attendance` — Attendance Operations
- `/reports` — Dashboard/Reporting workspace

There is no Payments product slice in the approved project scope.

## Public preview vs final production

The existing Vercel deployment is a **read-only product preview**. It is useful for design/demo viewing, but it is not the final production system because it does not host the authenticated FastAPI + persistent PostgreSQL stack.

Final production publication occurs only in **Phase 4G + Phase 4H**, when the real backend, managed PostgreSQL database, migrations, secure administrator provisioning, persistence, backups and public HTTPS verification are complete.

## Demo data

The public preview uses deterministic synthetic records only. The demo dataset is fabricated and must not be interpreted as real customer data.

Operational seed tooling is restricted to non-production environments. Production seeding is explicitly blocked.

## Security and hardening

Gridstone currently includes:

- Argon2 password hashes;
- opaque server-side session tokens with only token hashes stored in PostgreSQL;
- `HttpOnly`, `SameSite=Strict` cookies and secure `__Host-` cookie names in production;
- session-bound CSRF validation for state-changing requests;
- admin/staff authorization checks on the server;
- session expiry and logout revocation;
- `Cache-Control: no-store` for API responses;
- HSTS in production;
- CSP, frame blocking, referrer restrictions and browser isolation headers;
- per-request identifiers;
- sanitized structured request logging without query-string/secret leakage;
- generic 500 responses that do not expose exception details;
- dependency audits in CI;
- SQL wildcard/input-boundary regression tests;
- cross-feature workflow tests;
- mobile navigation focus and keyboard regression coverage.

No card number, CVV, UPI PIN, banking credential or equivalent payment secret belongs in this project.

## Local development

Prerequisites:

- Node.js 24
- pnpm 10
- Python 3.14
- uv
- Docker + Docker Compose

First-time setup:

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

Provision an administrator through the hidden password prompt:

```bash
cd backend
uv run python -m app.cli.create_user --email admin@example.com --name "Gym Admin" --role admin
```

Run the backend:

```bash
uv run --project backend uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

Run the frontend in another terminal:

```bash
cd frontend
pnpm dev
```

Or run the single-origin stack:

```bash
docker compose up --build
```

## Quality gates

Frontend:

```bash
cd frontend
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm audit --prod --audit-level moderate
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

CI also verifies deterministic staging seed behavior, PostgreSQL backup/restore, migration reversibility, dependency audits and the Docker single-origin application.

## Documentation

- [`docs/production-roadmap.md`](docs/production-roadmap.md) — approved 4B → 4H completion path
- [`docs/production-execution-master.md`](docs/production-execution-master.md) — rollback/interruption-safe phase contract
- [`docs/database.md`](docs/database.md) — schema and invariants
- [`docs/authentication.md`](docs/authentication.md) — authentication/authorization contract
- [`docs/design-system.md`](docs/design-system.md) — Gridstone design system
- [`docs/development-workflow.md`](docs/development-workflow.md) — Git/PR/CI workflow

## Next phase

**Phase 4G — Production Infrastructure** is the next active phase.

Its goal is to deploy the real authenticated Gridstone application with managed PostgreSQL while preserving the verified single-origin Docker architecture. After 4G is stable, **Phase 4H** will deploy and verify the exact green `main` SHA on the final public HTTPS URL.
