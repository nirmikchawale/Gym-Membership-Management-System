# Phase 4H — Production Release & Verification Master Prompt

## Role

Act as the release engineer and final verification owner for Gridstone. Continue from the verified production foundation without redesigning completed features. Prefer the smallest safe change, preserve rollbackability, and treat observable evidence as authoritative over assumptions.

## Authoritative context

Repository: `nirmikchawale/Gym-Membership-Management-System`

Phase 4H baseline / release candidate Git SHA:

`66690638884adb5098a9f7e559d8fffe57cc8c52`

Phase branch:

`feat/phase-4h-production-release-verification`

Rollback checkpoint:

`rollback/phase-4h-pre-production-release`

Production provider: Railway project `Gridstone`, environment `production`.

Production application service: `gridstone-app`.

Production PostgreSQL service: `Postgres` with persistent volume, daily and weekly volume backups.

Production URL:

`https://gridstone-app-production.up.railway.app`

Exact-SHA Phase 4H deployment:

`15638b05-f5bd-4e90-8abc-6c3ea4b187f2`

## Non-negotiable rules

1. Do not call Phase 4H VERIFIED from deployment success alone.
2. Never invent credentials, an administrator identity, user data, test results, browser observations, or provider behavior.
3. Never commit passwords, database credentials, session secrets, bootstrap secrets, or other production secrets to Git.
4. Do not use the example `admin@example.com` identity from documentation as a real production administrator unless explicitly selected by the project owner.
5. Keep the exact release SHA traceable through every release-verification claim.
6. Use provider-held secrets for any one-time administrator bootstrap. Remove/rotate the bootstrap secret after first successful sign-in.
7. Do not seed synthetic demo data into production. Production guards must remain enabled.
8. Preserve the single-origin FastAPI + PostgreSQL deployment shape unless a verified defect requires a minimal change.
9. If a required external/client-side check cannot be executed from available tooling, mark that check BLOCKED/UNVERIFIED rather than inferring success.
10. Any code/documentation change in Phase 4H must go through the phase branch, exact-head CI, PR merge, and exact-resulting-main CI before it becomes authoritative.

## Already verified before Phase 4H

Phase 4G is complete and verified:

- managed PostgreSQL is online;
- persistent database volume is attached;
- daily and weekly database volume backup schedules are enabled;
- app service builds from the repository Dockerfile;
- production application settings and database credentials are stored at the provider rather than Git;
- Alembic migration and production-environment validation run before deployment;
- public Railway domain is configured;
- health check is `/api/v1/health`;
- provider health probe succeeds;
- Phase 4G PR exact-head CI passed;
- Phase 4G merged to `main`;
- exact resulting `main` CI passed across backend, frontend, security, and container-integration jobs.

## Phase 4H execution sequence

Execute and record evidence in this order.

### Gate 1 — Exact release deployment

Required evidence:

- deployment source SHA exactly equals `66690638884adb5098a9f7e559d8fffe57cc8c52`;
- Docker build succeeds;
- Alembic pre-deploy migration succeeds;
- production environment validation confirms PostgreSQL reachability;
- container starts successfully;
- `/api/v1/health` returns HTTP 200 through the provider health gate;
- production network configuration completes.

Current evidence: PASS. Deployment `15638b05-f5bd-4e90-8abc-6c3ea4b187f2` completed successfully and the health probe returned HTTP 200.

### Gate 2 — Public HTTPS and unauthenticated boundary

From a true external client/browser, verify:

- `/`;
- `/login`;
- direct deep links `/members`, `/plans`, `/memberships`, `/attendance`, `/dashboard`;
- `/api/v1/health`;
- HTTPS/TLS works without certificate warnings;
- SPA deep links load rather than returning deployment-level 404s;
- protected views/API data are not disclosed to unauthenticated requests;
- redirects/final paths behave intentionally.

Record HTTP status, final path, content type, and result for each route.

### Gate 3 — Secure initial administrator

Use a project-owner-approved production administrator email/name and a strong provider-held bootstrap secret. Provision using the supported CLI path, e.g. `app.cli.create_user --role admin --ensure`, sourcing the password from `GRIDSTONE_BOOTSTRAP_PASSWORD` or equivalent provider secret storage.

Verify sign-in, then remove or rotate the bootstrap secret. Do not expose the password in logs, Git, PR descriptions, screenshots, or chat summaries.

### Gate 4 — Authentication, session, logout and CSRF

With the approved administrator account:

- sign in over HTTPS;
- confirm the expected secure session cookie behavior;
- verify protected API/view access after login;
- confirm CSRF protection rejects missing/invalid token on state-changing operations;
- confirm valid CSRF-backed state-changing requests work;
- sign out;
- confirm the authenticated session no longer authorizes protected access.

Do not weaken auth or CSRF controls to make smoke tests pass.

### Gate 5 — Complete production workflow

Exercise the approved daily loop with clearly marked release-verification records only:

1. create a test member;
2. create/select an appropriate membership plan;
3. assign a membership;
4. perform a renewal;
5. validate access;
6. check in;
7. check out;
8. review membership/attendance history;
9. verify dashboard/reporting reflects the source records.

Payments/receipts/revenue remain out of scope.

Capture IDs or unique release-test labels needed for later reconciliation, but do not expose personal or secret information.

### Gate 6 — Browser/UX acceptance

On the live HTTPS URL verify, at minimum:

- desktop viewport;
- mobile viewport;
- navigation and focus/keyboard behavior;
- light theme;
- dark theme;
- loading/empty/error states where safely reachable;
- no obvious overflow, unusable controls, or route-level rendering failures;
- direct-link refresh on key application routes.

Use screenshots only when they materially help verification and contain no credentials/secrets.

### Gate 7 — Persistence across restart/redeploy

Before restart/redeploy, record the identifiers/counts of the Phase 4H verification records. Perform a controlled restart/redeploy of the same exact release SHA without destructive database operations. After the service returns healthy:

- log in again;
- verify the test member, plan/membership, renewal lineage, attendance records and dashboard source data still exist;
- confirm database connectivity remains healthy.

A restart/redeploy is not a persistence test unless the same persisted records are re-read afterward.

### Gate 8 — Backup and rollback readiness

Verify without destructive restoration of production:

- Railway database volume retains daily + weekly backup schedules;
- repository portable PostgreSQL backup/restore rehearsal remains green in CI;
- the previous healthy application deployment is still identifiable/rollback-capable where provider retention permits;
- Git rollback ref `rollback/phase-4h-pre-production-release` points to the verified pre-4H baseline;
- rollback procedure is documented and does not imply database downgrade safety without checking migration compatibility.

Do not perform a production database restore merely to prove the runbook.

### Gate 9 — Release manifest and final repository gates

Record:

- final public URL;
- exact deployed Git SHA;
- Railway deployment ID;
- PostgreSQL service/backup state (non-secret metadata only);
- all Phase 4H verification results;
- any accepted limitations;
- rollback target/procedure.

If Phase 4H requires repository changes, open a PR from the Phase 4H branch, require green CI on the exact PR head, merge, and require green CI on the exact resulting `main` SHA. If the merged SHA differs from the deployed SHA, deploy that exact new verified `main` SHA and repeat the release checks affected by the change.

Only after every mandatory release gate passes may status become:

`DEPLOYED → VERIFIED`

## Evidence schema

For each check record:

- **Check**: concise name;
- **Status**: PASS / FAIL / BLOCKED / NOT RUN;
- **Target**: URL, route, deployment, or workflow;
- **Exact Git SHA**: when relevant;
- **Observed evidence**: factual observation only;
- **Mutation performed**: none or precise safe change;
- **Rollback/recovery**: if a mutation occurred;
- **Follow-up**: only when unresolved.

## Current Phase 4H state

PASS:

- exact verified main SHA selected;
- phase branch and rollback checkpoint created;
- exact SHA deployed to existing production app service;
- build succeeded;
- pre-deploy migration succeeded;
- production PostgreSQL validation succeeded;
- container startup succeeded;
- provider health check succeeded on first probe with HTTP 200;
- Railway network configuration completed.

BLOCKED / UNVERIFIED from current automation environment:

- independent external HTTPS route/deep-link probe: available web clients are blocked by URL policy/DNS before reaching the Railway domain;
- secure production administrator provisioning: no project-owner-approved administrator identity/bootstrap credential has been supplied;
- authenticated login/logout/CSRF smoke;
- live CRUD/renewal/attendance/dashboard workflow;
- mobile/desktop + light/dark visual acceptance;
- persistence-after-redeploy using known production verification records.

Do not convert these blocked checks to PASS by inference.
