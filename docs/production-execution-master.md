# Gridstone — Autonomous Production Execution Contract

## Mission

Complete the remaining approved Gridstone path in strict sequence: **Phase 4B Attendance Operations → Phase 4D Dashboard & Reporting → Phase 4E Operational Administration → Phase 4F Cross-Feature Hardening → Phase 4G Production Infrastructure → Phase 4H Production Release & Verification**.

**Phase 4C Payments is intentionally out of scope.** Do not implement payment capture, payment state workflows, receipts, or payment-specific dashboard metrics in this execution program.

## Non-negotiable execution order

1. Inspect exact current `main` and record its SHA.
2. Create a short-lived phase branch from that exact SHA.
3. Create a permanent checkpoint/rollback ref before modifying the phase.
4. Implement only the current phase.
5. Run the repository quality gates in CI.
6. Do not merge unless the exact PR head is green.
7. Merge the phase.
8. Verify CI again on the exact resulting `main` SHA.
9. Record the phase as `VERIFIED` only after exact-main CI passes.
10. Create the next phase branch only after the previous phase is verified.

This sequence is deliberately interruption-safe: a disconnected client, tool failure, failed build, or incomplete follow-up leaves the repository either on the last verified `main` or on an isolated, unmerged phase branch.

## Rollback strategy

### Source rollback

Each phase has a `checkpoint/<phase>-start` or equivalent immutable branch at the previously verified `main` SHA. If a phase fails before merge, close or abandon its PR; `main` remains untouched. If a regression is discovered after merge, create a revert PR back to the previous checkpoint rather than force-pushing `main`.

### Database rollback

Every schema change must be represented by an Alembic migration with a tested downgrade. Before production migration, obtain a database backup/snapshot. If the deployment fails after migration, prefer application rollback when the new schema is backward-compatible; otherwise restore/downgrade only under the documented release runbook after confirming no incompatible production writes occurred.

### Deployment rollback

Production releases are tied to an exact Git SHA. Preserve the last known-good deployment. A failed candidate never replaces the verified release until health checks and smoke tests pass. If post-release smoke tests fail, redeploy the last known-good SHA and verify health before investigating forward.

### Secrets and credentials

Secrets live only in provider secret storage or protected local prompts. They are never committed, echoed into documentation, or placed into public preview data.

## Phase 4B — Attendance Operations

Goal: make front-desk access validation and visit tracking a real end-to-end workflow.

Required outcomes:

- fast member lookup;
- access decision based on active member + active membership covering the business date;
- explicit denial for inactive, scheduled, frozen, expired, or cancelled access;
- check-in and check-out;
- one-open-visit-per-member protection at service and database levels;
- current open visits;
- attendance history with search/date/state filters;
- membership linkage for new attendance records so the access decision is auditable;
- CSRF-protected mutations and authenticated reads;
- touch-first narrow-screen layout and keyboard-friendly desktop layout;
- synthetic read-only public preview;
- concurrency/duplicate and lifecycle tests.

Exit gate: a staff user can identify a member, see the access reason, check in, check out, and find the resulting visit in history. Exact merged `main` CI must be green.

## Phase 4D — Dashboard & Reporting

Goal: replace decorative/future-state dashboard surfaces with summaries derived only from real implemented data.

Approved sources: members, plans, memberships/renewals, and attendance. Payment/revenue metrics are excluded.

Required outcomes:

- member and membership operational counts;
- expiring-soon membership queue;
- renewal/lifecycle summary;
- currently-open visits;
- attendance trend for a bounded date window;
- plan distribution;
- useful empty/error/loading states;
- API-level aggregate tests that reconcile against source records;
- responsive, accessible dashboard UI.

Exit gate: every displayed metric can be reconciled to persisted source data and exact-main CI is green.

## Phase 4E — Operational Administration

Goal: make setup, demo/staging data, backup, restore, and environment validation repeatable and production-safe.

Required outcomes:

- deterministic synthetic seed command for development/staging only;
- hard production guard against accidental seeding;
- idempotent first-admin provisioning workflow;
- production environment validation command;
- documented deactivation/retention behavior;
- backup and restore runbook;
- automated backup/restore rehearsal against a disposable database in CI where practical;
- release checklist.

Exit gate: a fresh environment can be initialized predictably without exposing secrets and the restore procedure has been exercised.

## Phase 4F — Cross-Feature Hardening

Goal: validate the product as one system rather than isolated modules.

Required outcomes:

- full Member → Plan → Membership/Renewal → Attendance workflow tests;
- admin/staff authorization matrix;
- CSRF/session/logout/expiry checks;
- duplicate/race/idempotency checks;
- search wildcard and input-boundary checks;
- accessibility and responsive regression coverage;
- security headers/no-store verification;
- production-safe error/logging behavior;
- dependency audits;
- query/index/performance sanity checks;
- no payment functionality introduced.

Exit gate: all cross-feature gates pass on the exact merged `main` SHA.

## Phase 4G — Production Infrastructure

Goal: deploy the authenticated single-origin Docker application with managed PostgreSQL.

Required outcomes:

- provider project/environment;
- managed PostgreSQL;
- application service built from the repository Dockerfile;
- provider-held production secrets;
- `APP_ENV=production`;
- controlled Alembic pre-deploy step;
- health check and restart policy;
- public HTTPS domain;
- secure initial-admin provisioning path;
- backup policy and last-known-good deployment identified;
- staging/candidate validation before promotion where provider capabilities allow.

Exit gate: infrastructure is live, healthy, persistent, and tied to an exact green Git SHA. Do not call it production-verified yet.

## Phase 4H — Production Release & Verification

Goal: prove the live system works end to end.

Required outcomes:

- deploy exact verified `main` SHA;
- migrations complete successfully;
- administrator provisioned securely;
- HTTPS health endpoint passes;
- login/logout/session/CSRF smoke checks;
- primary Member, Plan, Membership/Renewal, Attendance, and Dashboard workflows pass on the public URL;
- direct deep links work;
- desktop/mobile smoke checks;
- persistence survives application restart/redeploy;
- backup/rollback runbook is usable;
- release SHA and URL recorded.

Only after these checks may status advance to **DEPLOYED → VERIFIED**.

## Continuation rule

At any interruption, recover by reading `main`, the open PR list, the phase checkpoint branch, and CI state. Resume the first phase that is not `VERIFIED`; never skip a failed gate and never infer completion from an unfinished branch.