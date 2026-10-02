# Gridstone — Full-Stack Production Roadmap

## Objective

Turn the verified Gridstone engineering foundation into a complete gym-operations product and then publish the **real authenticated FastAPI + PostgreSQL application**, not only a static/read-only preview.

## Execution contract

For every phase: inspect current `main` → define scope/non-goals → implement the smallest complete vertical slice → test frontend/backend/database/security/mobile → open PR → require green CI → merge → verify exact `main` → update status. Never mark a phase complete from a preview build alone.

## Phase 4A — Membership Lifecycle & Renewals

Deliver the missing bridge between Members and Plans:

- create/assign a membership to an active member from an active plan;
- snapshot plan price and currency at assignment time;
- derive start/end dates from the selected plan duration;
- list/search/filter/paginate memberships;
- detail view with member, plan, dates, price and lineage;
- prevent overlapping live memberships for one member;
- renew a membership with one-to-one renewal lineage;
- freeze/resume access without silently extending dates;
- cancel without destructive deletion;
- automatically reconcile scheduled/active/expired state from local business date;
- authenticated reads, CSRF-protected state changes;
- responsive desktop/mobile UI and read-only synthetic preview behavior;
- backend/frontend tests and Docker deep-link verification.

**Exit gate:** a staff user can complete Member → Plan → Membership → Renewal coherently and CI is green on merged `main`.

## Phase 4B — Attendance Operations

- member lookup optimized for front-desk speed;
- check-in and check-out;
- enforce one open visit per member using the existing database constraint;
- current open visits;
- history/search/date filters;
- inactive/cancelled-access handling;
- touch-first mobile flow and keyboard flow;
- race-condition and duplicate-check-in tests.

**Exit gate:** a staff user can identify a member, validate access, check them in/out and review attendance history.

## Phase 4C — Payments & Receipts

- record payment metadata only (never card/CVV/UPI PIN/bank secrets);
- attach payment to membership;
- amount/currency/method/status/reference/paid-at;
- pending/succeeded/failed/refunded/voided transitions with explicit rules;
- receipt/reference lookup;
- payment history by member/membership;
- duplicate external-reference protection;
- reconciliation-friendly filters and summaries.

**Exit gate:** membership revenue can be recorded and audited without storing restricted payment credentials.

## Phase 4D — Operational Dashboard & Reporting

Build only from real application data:

- active members;
- memberships expiring soon;
- renewals due/completed;
- open visits and attendance trends;
- payment/revenue summaries;
- plan distribution;
- useful date ranges and filters;
- empty/loading/error states;
- export only if required by the academic/project scope.

**Exit gate:** dashboard numbers reconcile against source tables and tests.

## Phase 4E — Demo/Seed & Operational Administration

- deterministic synthetic seed command for local/staging environments;
- no seed execution in production by accident;
- first-admin provisioning documented and repeatable;
- production-safe environment validation;
- data-retention/deactivation behavior documented;
- backup/restore procedure documented and test-restored at least once.

## Phase 4F — Cross-Feature Hardening

- end-to-end workflows across Members → Plans → Memberships → Attendance → Payments;
- authorization matrix tests for admin/staff;
- CSRF/session/logout/expiry tests;
- duplicate/idempotency/race-condition tests;
- SQL wildcard and input-boundary tests;
- dependency audits;
- accessibility audit: keyboard, focus, labels, contrast, reduced motion;
- responsive audit at narrow mobile, tablet and desktop widths;
- long-text/empty/error/slow-network states;
- browser security headers and no-store verification;
- structured error handling and production-safe logging;
- performance checks for list endpoints and indexes.

## Phase 4G — Production Infrastructure

Preferred deployment shape: preserve the verified single-origin Docker architecture.

- managed PostgreSQL production database;
- production application service built from repository Dockerfile;
- HTTPS custom/public domain;
- production `DATABASE_URL` and environment secrets stored only in provider secret storage;
- `APP_ENV=production` and secure `__Host-` cookies;
- run Alembic migrations as a controlled release step;
- provision initial admin through a secure one-time operational process;
- health checks and restart policy;
- database backups and recovery target;
- staging environment before production;
- production logs/metrics/error visibility.

Vercel remains useful for the read-only frontend preview. The final product should not be represented as production-complete until the authenticated backend and PostgreSQL are live.

## Phase 4H — Production Release & Verification

- deploy exact green `main` SHA;
- migrate database;
- provision administrator;
- verify login/logout and CSRF;
- smoke-test every primary workflow on the public HTTPS URL;
- verify mobile and desktop;
- verify direct deep links;
- verify database persistence across restarts;
- verify backup/restore runbook;
- tag release and record deployed SHA;
- only then use status `DEPLOYED → VERIFIED`.

## Definition of production-ready Gridstone

A gym operator can sign in and complete the daily loop:

**create member → choose plan → assign membership → renew → check in/out → record payment → review dashboard/reporting**, with persistent PostgreSQL data, server-side authorization, tested error states, responsive UI, and an HTTPS production deployment tied to an exact verified Git commit.
