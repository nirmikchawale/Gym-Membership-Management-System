# Gridstone — Full-Stack Production Roadmap

## Objective

Turn the verified Gridstone engineering foundation into a complete gym-operations product and then publish the **real authenticated FastAPI + PostgreSQL application**, not only a static/read-only preview.

## Scope decision

**Phase 4C Payments & Receipts is intentionally removed from this project scope.** Payment capture, payment status workflows, receipts, revenue analytics, card data, UPI credentials, banking credentials, and payment-provider integration are not required for the current academic/MVP production target.

The approved completion path is therefore:

**Phase 4B → Phase 4D → Phase 4E → Phase 4F → Phase 4G → Phase 4H.**

The phase number 4C is retained only as an explicit documented omission so historical references do not become ambiguous.

## Execution contract

For every phase: inspect current `main` → create rollback checkpoint → define scope/non-goals → implement the smallest complete vertical slice → test frontend/backend/database/security/mobile → open PR → require green CI → merge → verify exact `main` → update status. Never mark a phase complete from a preview build alone.

See [`production-execution-master.md`](production-execution-master.md) for the interruption-safe and rollback contract.

## Phase 4A — Membership Lifecycle & Renewals

**Complete and verified.**

Delivered assignment from active member + active plan, plan price/currency snapshots, lifecycle reconciliation, overlap protection, renewal lineage, freeze/resume/cancel transitions, authenticated/CSRF-protected API routes, responsive UI, synthetic preview support, tests, and Docker verification.

## Phase 4B — Attendance Operations

- member lookup optimized for front-desk speed;
- access validation against current member/membership state;
- check-in and check-out;
- enforce one open visit per member using the existing database invariant plus service conflict handling;
- link new visits to the membership that authorized access;
- current open visits;
- history/search/date filters;
- inactive/scheduled/frozen/expired/cancelled-access handling;
- touch-first mobile flow and keyboard flow;
- race-condition and duplicate-check-in tests.

**Exit gate:** a staff user can identify a member, validate access, check them in/out and review attendance history.

## Phase 4C — Intentionally out of scope

No implementation. Payments and receipts are excluded from this production-completion program.

## Phase 4D — Operational Dashboard & Reporting

Build only from implemented application data:

- active/inactive member counts;
- active/scheduled/frozen/expired/cancelled membership counts;
- memberships expiring soon;
- renewal/lifecycle summary;
- open visits and attendance trends;
- plan distribution;
- useful date ranges and filters;
- empty/loading/error states;
- export only if required by the academic/project scope.

**No payment/revenue metrics.**

**Exit gate:** dashboard numbers reconcile against source tables and tests.

## Phase 4E — Demo/Seed & Operational Administration

- deterministic synthetic seed command for local/staging environments;
- production guard that blocks seed execution;
- first-admin provisioning documented and repeatable;
- production-safe environment validation;
- data-retention/deactivation behavior documented;
- backup/restore procedure documented;
- restore rehearsal against a disposable database where practical;
- release checklist.

## Phase 4F — Cross-Feature Hardening

- end-to-end workflows across Members → Plans → Memberships/Renewals → Attendance;
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
- HTTPS public/custom domain;
- production `DATABASE_URL` and environment secrets stored only in provider secret storage;
- `APP_ENV=production` and secure `__Host-` cookies;
- run Alembic migrations as a controlled release step;
- provision initial admin through a secure one-time operational process;
- health checks and restart policy;
- database backups and recovery target;
- staging/candidate validation before production when provider capabilities allow;
- production logs/metrics/error visibility;
- identify and retain the last known-good deployment for rollback.

Vercel may remain useful for the read-only frontend preview. The final product is not production-complete until the authenticated backend and PostgreSQL are live.

## Phase 4H — Production Release & Verification

- deploy exact green `main` SHA;
- migrate database;
- provision administrator securely;
- verify login/logout and CSRF;
- smoke-test Members, Plans, Memberships/Renewals, Attendance and Dashboard/Reporting on the public HTTPS URL;
- verify mobile and desktop;
- verify direct deep links;
- verify database persistence across restart/redeploy;
- verify backup/rollback runbook;
- record release URL and deployed SHA;
- only then use status `DEPLOYED → VERIFIED`.

## Definition of production-ready Gridstone

A gym operator can sign in and complete the approved daily loop:

**create member → choose plan → assign membership → renew → validate access → check in/out → review operational dashboard/reporting**, with persistent PostgreSQL data, server-side authorization, tested error states, responsive UI, and an HTTPS production deployment tied to an exact verified Git commit.
