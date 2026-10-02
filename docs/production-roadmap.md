# Gridstone — Full-Stack Production Roadmap

## Objective

Publish the real authenticated FastAPI + PostgreSQL Gridstone application as a complete gym-operations product, preserving the verified single-origin Docker architecture.

## Scope decision

**Phase 4C Payments & Receipts is intentionally removed from this project scope.** Payment capture, payment status workflows, receipts, revenue analytics, card data, UPI credentials, banking credentials and payment-provider integration are not required for the current academic/MVP production target.

The approved completion path is now complete:

**Phase 4A ✅ → Phase 4B ✅ → Phase 4C omitted → Phase 4D ✅ → Phase 4E ✅ → Phase 4F ✅ → Phase 4G ✅ → Phase 4H ✅.**

The phase number 4C is retained only as an explicit documented omission so historical references remain unambiguous.

## Execution contract

For every phase: inspect current `main` → create rollback checkpoint → define scope/non-goals → implement the smallest complete vertical slice → test frontend/backend/database/security/mobile → open PR → require green CI → merge → verify exact `main` → update status.

Never mark a phase complete from a preview build alone.

See [`production-execution-master.md`](production-execution-master.md) for the interruption-safe and rollback contract.

## Phase 4A — Membership Lifecycle & Renewals

**Status: COMPLETE + VERIFIED.**

Delivered assignment from active member + active plan, price/currency snapshots, lifecycle reconciliation, overlap protection, renewal lineage, freeze/resume/cancel transitions, authenticated/CSRF-protected API routes, responsive UI, synthetic preview support, tests and Docker verification.

## Phase 4B — Attendance Operations

**Status: COMPLETE + VERIFIED.**

Delivered front-desk member lookup, access validation, check-in/out, one-open-visit protection, membership-linked attendance, occupancy visibility, history/search/date filters, invalid-access handling, responsive front-desk workflow and duplicate/race-condition protection.

## Phase 4C — Intentionally out of scope

**Status: OMITTED BY PROJECT DECISION.**

No implementation. Payments, receipts, revenue analytics and payment-provider integration are excluded from this production-completion program.

## Phase 4D — Operational Dashboard & Reporting

**Status: COMPLETE + VERIFIED.**

Delivered persisted operational reporting for member counts, membership lifecycle states, upcoming expiries, renewal summaries, open visits, attendance trends, plan distribution and bounded reporting windows. Dashboard values are reconciled against source records and tests.

**No payment/revenue metrics are included.**

## Phase 4E — Demo/Seed & Operational Administration

**Status: COMPLETE + VERIFIED.**

Delivered deterministic synthetic non-production seed tooling, production seed guards, repeatable administrator provisioning, production environment validation, data-retention guidance, portable PostgreSQL backup/restore procedures, disposable restore rehearsal in CI, release checklist, migration reversibility and deep-link/container verification.

## Phase 4F — Cross-Feature Hardening

**Status: COMPLETE + VERIFIED.**

Verified cross-feature workflow coverage, admin/staff authorization matrix, CSRF/session/expiry behavior, duplicate/conflict protection, SQL wildcard/input boundaries, dependency audits, mobile navigation/focus handling, browser security headers, CSP/isolation controls, request IDs, production-safe 500 responses, sanitized logging, operational indexes and exact-main CI.

Authoritative historical Phase 4F main SHA: `fca1b9f8489168fa0c045821b87c8c26964d2f2c`.

## Phase 4G — Production Infrastructure

**Status: COMPLETE + VERIFIED.**

Production infrastructure is live on Railway:

- managed PostgreSQL 18 service;
- persistent PostgreSQL volume;
- production application service built from the repository Dockerfile;
- single-origin React + FastAPI deployment;
- public HTTPS endpoint `https://gridstone-app-production.up.railway.app`;
- provider-held production configuration and database credentials;
- `APP_ENV=production` and secure production cookie configuration;
- controlled Alembic migration + environment validation before releases;
- `/api/v1/health` provider health check;
- explicit restart-on-failure policy;
- retained rollback-capable healthy application deployments;
- CI-tested portable PostgreSQL backup/restore procedure.

### Native backup entitlement limitation

The current Railway Hobby workspace reports `maxBackupsCount=0`, so **native Railway volume backup schedules cannot be enabled on this plan**. Earlier Phase 4G notes that claimed daily/weekly native schedules were enabled are superseded by the provider inspection performed during Phase 4H.

Current recovery posture therefore consists of persistent PostgreSQL storage, portable `pg_dump`/`pg_restore` procedures, automated disposable backup/restore rehearsal in CI, migration reversibility checks and rollback-capable application deployments. Enabling provider-native scheduled snapshots requires a Railway plan that supports volume backups or a separately approved external backup target.

Authoritative Phase 4G main SHA: `66690638884adb5098a9f7e559d8fffe57cc8c52`.

## Phase 4H — Production Release & Verification

**Status: COMPLETE + VERIFIED.**

Functional release candidate and persistence verification were completed on exact green main SHA:

`8de3f7f336d3b96225cef6670c59a794a66baad5`

Production URL:

`https://gridstone-app-production.up.railway.app`

Verification evidence includes:

- exact-main GitHub CI run #125 passed frontend, backend, security and container/deep-link integration jobs;
- exact SHA built and deployed successfully on Railway;
- production migrations and environment validation passed;
- provider health probe returned HTTP 200;
- release-only administrator bootstrap secret was held at the provider and then removed;
- login and authenticated `/me` passed;
- missing and invalid CSRF tokens were rejected;
- valid CSRF-protected mutations passed;
- synthetic release-verification member and plan creation passed;
- membership assignment and renewal lineage passed;
- access validation, attendance check-in and check-out passed;
- membership/attendance histories passed;
- dashboard/reporting reconciliation passed;
- logout and session invalidation passed;
- the same release-verification records were re-read successfully after a clean same-SHA redeploy, proving persistence;
- final permanent deployment uses the normal migration + production-environment-validation pre-deploy path and contains no bootstrap password variable.

Final permanent Railway deployment for SHA `8de3f7f3…`: `de15c615-28ad-436c-92aa-7f053687d7ba`.

### Browser acceptance evidence boundary

The repository verifies responsive desktop/mobile behavior, light/dark theming, SPA deep links and route integration through frontend tests/builds and container integration. The automation environment used for Phase 4H could not independently reach the public Railway domain through its external browser/DNS tooling, so no fabricated claim of exported live-browser screenshots is made. The provider-side application health and full authenticated API workflow are independently verified.

## Definition of production-ready Gridstone — achieved

A gym operator can sign in and complete the approved daily loop:

**create member → choose plan → assign membership → renew → validate access → check in/out → review operational dashboard/reporting**, with persistent PostgreSQL data, server-side authorization, tested error/security states, responsive UI and an HTTPS production deployment tied to an exact verified Git commit.

Payments remain outside the approved loop.
