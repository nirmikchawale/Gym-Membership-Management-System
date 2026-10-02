# Gridstone — Full-Stack Production Roadmap

## Objective

Turn the verified Gridstone engineering foundation into a complete gym-operations product and publish the **real authenticated FastAPI + PostgreSQL application**, not only a static/read-only preview.

## Scope decision

**Phase 4C Payments & Receipts is intentionally removed from this project scope.** Payment capture, payment status workflows, receipts, revenue analytics, card data, UPI credentials, banking credentials and payment-provider integration are not required for the current academic/MVP production target.

The approved completion path is:

**Phase 4B ✅ → Phase 4C omitted → Phase 4D ✅ → Phase 4E ✅ → Phase 4F ✅ → Phase 4G → Phase 4H.**

The phase number 4C is retained only as an explicit documented omission so historical references do not become ambiguous.

## Execution contract

For every phase: inspect current `main` → create rollback checkpoint → define scope/non-goals → implement the smallest complete vertical slice → test frontend/backend/database/security/mobile → open PR → require green CI → merge → verify exact `main` → update status.

Never mark a phase complete from a preview build alone.

See [`production-execution-master.md`](production-execution-master.md) for the interruption-safe and rollback contract.

## Phase 4A — Membership Lifecycle & Renewals

**Status: COMPLETE + VERIFIED.**

Delivered assignment from active member + active plan, price/currency snapshots, lifecycle reconciliation, overlap protection, renewal lineage, freeze/resume/cancel transitions, authenticated/CSRF-protected API routes, responsive UI, synthetic preview support, tests and Docker verification.

## Phase 4B — Attendance Operations

**Status: COMPLETE + VERIFIED.**

Delivered:

- front-desk member lookup;
- access validation against current member/membership state;
- check-in and check-out;
- one-open-visit-per-member enforcement;
- attendance linkage to the membership that authorized access;
- open-visit/current-occupancy visibility;
- attendance history, search and date filters;
- inactive/scheduled/frozen/expired/cancelled access handling;
- responsive front-desk workflow;
- duplicate/race-condition protection and tests.

**Exit gate passed:** a staff user can identify a member, validate access, check them in/out and review attendance history.

## Phase 4C — Intentionally out of scope

**Status: OMITTED BY PROJECT DECISION.**

No implementation. Payments, receipts, revenue analytics and payment-provider integration are excluded from this production-completion program.

## Phase 4D — Operational Dashboard & Reporting

**Status: COMPLETE + VERIFIED.**

Delivered operational reporting only from implemented persisted application data:

- active/inactive member counts;
- active/scheduled/frozen/expired/cancelled membership counts;
- memberships expiring soon;
- lifecycle/renewal summary;
- open visits and attendance trends;
- plan distribution;
- bounded reporting windows and filters;
- loading/empty/error states;
- dashboard/reporting reconciliation tests.

**No payment/revenue metrics are included.**

**Exit gate passed:** dashboard numbers reconcile against source records and tests.

## Phase 4E — Demo/Seed & Operational Administration

**Status: COMPLETE + VERIFIED.**

Delivered:

- deterministic synthetic seed command for development/test/staging;
- production guard that blocks seed execution;
- repeatable first-admin provisioning;
- production-safe environment validation;
- data-retention/deactivation guidance;
- PostgreSQL backup/restore procedure;
- disposable-database restore rehearsal in CI;
- release checklist;
- migration reversibility and deep-link/container verification.

## Phase 4F — Cross-Feature Hardening

**Status: COMPLETE + VERIFIED.**

Verified on authoritative `main` commit:

`fca1b9f8489168fa0c045821b87c8c26964d2f2c`

Delivered:

- end-to-end workflow coverage across Members → Plans → Memberships/Renewals → Attendance;
- admin/staff authorization-matrix tests;
- CSRF/session/expiry coverage;
- duplicate/idempotency/conflict regression coverage;
- SQL wildcard and input-boundary tests;
- dependency audits;
- mobile navigation focus/keyboard regression coverage;
- responsive design foundations retained across completed slices;
- browser security headers and API `no-store` verification;
- CSP tightening and browser isolation headers;
- per-request identifiers;
- generic production-safe 500 responses;
- sanitized structured HTTP request logging without secret/query-string leakage;
- operational index verification;
- exact-main CI verification after merge.

Phase 4F exact-main CI run #109 completed successfully.

## Phase 4G — Production Infrastructure

**Status: NEXT ACTIVE PHASE.**

Preferred deployment shape: preserve the verified single-origin Docker architecture.

Required work:

- managed PostgreSQL production database;
- production application service built from the repository Dockerfile;
- public HTTPS endpoint/domain;
- production `DATABASE_URL` and secrets stored only in provider secret storage;
- `APP_ENV=production` and secure `__Host-` cookies;
- controlled Alembic migration step;
- secure one-time initial administrator provisioning;
- health check and restart policy;
- database backup/recovery configuration;
- staging/candidate validation where provider capabilities allow;
- production logs/metrics/error visibility;
- retained last-known-good deployment for rollback;
- documented provider-specific rollback procedure.

The Vercel site may remain useful for the read-only frontend preview. The final product is not production-complete until the authenticated backend and PostgreSQL are live.

## Phase 4H — Production Release & Verification

**Status: PENDING PHASE 4G.**

Required work:

- deploy exact green `main` SHA;
- migrate the production database;
- provision administrator securely;
- verify login/logout and CSRF;
- smoke-test Members, Plans, Memberships/Renewals, Attendance and Dashboard/Reporting on the public HTTPS URL;
- verify mobile and desktop layouts;
- verify light/dark themes;
- verify direct deep links;
- verify database persistence across restart/redeploy;
- verify backup and rollback runbook;
- record release URL and deployed SHA;
- only then use status `DEPLOYED → VERIFIED`.

## Definition of production-ready Gridstone

A gym operator can sign in and complete the approved daily loop:

**create member → choose plan → assign membership → renew → validate access → check in/out → review operational dashboard/reporting**, with persistent PostgreSQL data, server-side authorization, tested error states, responsive UI and an HTTPS production deployment tied to an exact verified Git commit.

Payments are not part of that approved loop.
