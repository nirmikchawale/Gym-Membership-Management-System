# Gridstone

Group 11 Software Engineering project for a Gym Membership Management System.

## Production status

Gridstone is **production deployed and verified** for the approved project scope.

- **Production URL:** https://gridstone-app-production.up.railway.app
- **Verified application SHA:** `8de3f7f336d3b96225cef6670c59a794a66baad5`
- **Verified GitHub CI:** run #125 — frontend, backend, security and container integration all passed
- **Verified Railway release deployment:** `de15c615-28ad-436c-92aa-7f053687d7ba`
- **Database:** Railway PostgreSQL 18 with persistent volume
- **Architecture:** single-origin React + FastAPI Docker application with private PostgreSQL
- **Payments:** intentionally out of scope

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
| Phase 4C — Payments | ⛔ Intentionally out of scope | No payment capture, receipts, revenue or payment-provider integration |
| Phase 4D — Dashboard & Reporting | ✅ Verified | Operational dashboard/reporting from persisted member, membership and attendance data |
| Phase 4E — Operational Administration | ✅ Verified | Non-production seed guard, admin bootstrap, production validation and backup/restore rehearsal |
| Phase 4F — Cross-Feature Hardening | ✅ Verified | Cross-feature workflow, auth/CSRF hardening, browser headers, safe logging and regression coverage |
| Phase 4G — Production Infrastructure | ✅ Verified | Managed PostgreSQL, persistent storage, Docker app service, HTTPS, migrations, health and rollback |
| Phase 4H — Production Release & Verification | ✅ Verified | Exact-main deployment, production workflow verification, persistence proof and credential cleanup |

The approved completion path is complete:

**4A ✅ → 4B ✅ → 4C omitted → 4D ✅ → 4E ✅ → 4F ✅ → 4G ✅ → 4H ✅**

## What Gridstone supports

The authenticated application supports:

- internal `admin` and `staff` authentication;
- member search, filtering, creation, editing and activation/deactivation;
- membership-plan catalogue and administrator-controlled plan changes;
- membership assignment and historical price/currency snapshots;
- scheduled, active, expired, frozen and cancelled membership states;
- renewals with lineage and overlap protection;
- front-desk membership access validation;
- attendance check-in/check-out and one-open-visit protection;
- attendance history and filtering;
- operational dashboard and reporting from persisted records;
- responsive desktop/mobile layouts;
- persistent light/dark appearance;
- CSRF-protected mutations and server-side authorization;
- deterministic synthetic development/staging data with production seeding blocked;
- PostgreSQL backup/restore rehearsal in CI;
- production-safe request IDs, HTTP logging and hardened browser security headers.

## Production verification

Phase 4H exercised the real production API and database with synthetic `PH4H-VERIFY-*` records. Verified operations included:

1. login and authenticated `/me`;
2. rejection of missing/invalid CSRF tokens;
3. member creation;
4. plan creation;
5. membership assignment;
6. membership renewal with lineage;
7. access eligibility;
8. attendance check-in and check-out;
9. membership and attendance history;
10. dashboard/reporting reconciliation;
11. logout and session invalidation.

The verification records were then re-read after a clean redeploy of the same exact SHA, proving PostgreSQL persistence across application redeployment. The temporary provider-held bootstrap password was removed afterward, and the permanent service returned to the normal migration + production-environment-validation pre-deploy path.

## Architecture

- **Frontend:** React + TypeScript + Vite + React Router
- **Backend:** FastAPI + Pydantic + SQLAlchemy + Psycopg 3
- **Database:** PostgreSQL 18 + Alembic
- **Authentication:** Argon2 password hashing + opaque server-side sessions
- **Authorization:** server-enforced `admin` / `staff` roles
- **Deployment:** Railway single-origin Docker application + managed PostgreSQL
- **Timezone:** `Asia/Kolkata`
- **Frontend package manager:** pnpm 10
- **Backend package manager:** uv

The browser talks to one HTTPS Gridstone application. FastAPI serves both the built React SPA and API, while PostgreSQL remains private behind the application service.

## Application routes

- `/` — operational overview/dashboard
- `/login` — authentication
- `/members` — Members
- `/plans` — Membership Plans
- `/memberships` — Membership Lifecycle & Renewals
- `/attendance` — Attendance Operations
- `/reports` — Dashboard/Reporting workspace

There is no Payments product slice in the approved project scope.

## Backup and recovery status

The PostgreSQL database uses a persistent Railway volume. Repository CI continuously rehearses portable PostgreSQL `pg_dump`/`pg_restore` recovery against disposable PostgreSQL and verifies migration reversibility.

**Provider limitation:** the current Railway Hobby workspace reports `maxBackupsCount=0`, so native Railway volume backup schedules are unavailable on this plan. Earlier documentation claiming daily/weekly native Railway snapshots is superseded by the Phase 4H provider audit. Enabling provider-native scheduled snapshots requires a plan with backup entitlement or a separately approved external backup target.

## Security and hardening

Gridstone includes:

- Argon2 password hashes;
- opaque server-side session tokens with only token hashes stored in PostgreSQL;
- `HttpOnly`, `SameSite=Strict` cookies and secure `__Host-` cookie names in production;
- session-bound CSRF validation for state-changing requests;
- admin/staff authorization checks on the server;
- session expiry and logout revocation;
- `Cache-Control: no-store` for API responses;
- HSTS in production;
- CSP, frame blocking, referrer restrictions and browser-isolation headers;
- per-request identifiers;
- sanitized structured request logging without query-string/secret leakage;
- generic production-safe 500 responses;
- dependency audits in CI;
- SQL wildcard/input-boundary regression tests;
- cross-feature workflow tests;
- mobile navigation focus and keyboard regression coverage.

No card number, CVV, UPI PIN, banking credential or equivalent payment secret belongs in this project.

## Local development

Prerequisites: Node.js 24, pnpm 10, Python 3.14, uv, Docker and Docker Compose.

```bash
git clone https://github.com/nirmikchawale/Gym-Membership-Management-System.git
cd Gym-Membership-Management-System
cp .env.example .env
corepack enable
cd frontend && pnpm install && cd ..
uv sync --project backend --group dev
```

Start PostgreSQL and migrate:

```bash
docker compose up -d db
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

Provision a local administrator through the hidden password prompt:

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

CI also verifies deterministic staging seed behavior, PostgreSQL backup/restore rehearsal, migration reversibility, dependency audits and the Docker single-origin application.

## Documentation

- [`docs/production-roadmap.md`](docs/production-roadmap.md) — completed production roadmap and final release state
- [`docs/phase-4h-production-release.md`](docs/phase-4h-production-release.md) — Phase 4H release evidence and accepted limitations
- [`docs/operations-runbook.md`](docs/operations-runbook.md) — production operations, backup/restore and release procedures
- [`docs/database.md`](docs/database.md) — schema and invariants
- [`docs/authentication.md`](docs/authentication.md) — authentication/authorization contract
- [`docs/design-system.md`](docs/design-system.md) — Gridstone design system
- [`docs/development-workflow.md`](docs/development-workflow.md) — Git/PR/CI workflow

## Project state

The approved implementation roadmap is complete. Future changes should be treated as maintenance or explicitly scoped new features rather than silently extending Phase 4A–4H.
