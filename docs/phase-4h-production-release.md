# Phase 4H — Production Release Record

**Status: COMPLETE + VERIFIED**

This document is the authoritative non-secret release record for the first fully verified Gridstone production release within the approved academic/MVP scope.

## Release identity

- Repository: `nirmikchawale/Gym-Membership-Management-System`
- Production provider: Railway
- Project: `Gridstone`
- Environment: `production`
- Application service: `gridstone-app`
- Database service: `Postgres`
- Production URL: `https://gridstone-app-production.up.railway.app`
- Verified functional release SHA: `8de3f7f336d3b96225cef6670c59a794a66baad5`
- Exact-main GitHub CI: run #125 — success
- Functional release deployment: `a14bcacd-0996-4311-b938-201545a8d0b4` — success
- Persistence-verification redeploy: `a6c6c79d-eccf-441d-b84a-515480d80166` — success
- Final permanent deployment on the same exact SHA: `de15c615-28ad-436c-92aa-7f053687d7ba` — success

## Scope

Verified production scope:

- authentication and role-based authorization;
- Members;
- Membership Plans;
- Membership Lifecycle & Renewals;
- Attendance Operations;
- Operational Dashboard & Reporting;
- responsive desktop/mobile product shell;
- light/dark appearance;
- production PostgreSQL persistence;
- migration, health and rollback controls.

**Payments, receipts, revenue analytics, payment-provider integration and financial credentials remain intentionally out of scope.**

## Repository gates

The exact functional release SHA `8de3f7f336d3b96225cef6670c59a794a66baad5` passed GitHub Actions CI run #125.

Verified CI areas:

- frontend formatting;
- frontend lint;
- TypeScript typecheck;
- frontend tests;
- production frontend build;
- backend Alembic migrations;
- migration drift check;
- Ruff lint and format checks;
- mypy;
- backend tests;
- deterministic non-production seed behavior;
- PostgreSQL logical backup/restore rehearsal;
- migration downgrade/upgrade verification;
- frontend/backend dependency security audits;
- Docker single-origin integration;
- SPA deep-link handling;
- API/PostgreSQL integration and browser security-header checks.

## Production deployment gates

### Exact source

PASS — Railway deployment source was pinned to exact verified `main` SHA `8de3f7f336d3b96225cef6670c59a794a66baad5`.

### Build

PASS — Docker image built successfully from the repository Dockerfile.

### Database migration and validation

PASS — Alembic migration completed and the production validator confirmed PostgreSQL reachability.

### Application startup and health

PASS — Uvicorn started on the configured service port and Railway's `/api/v1/health` probe returned HTTP 200.

## Secure release-verification administrator

A dedicated release-verification administrator was provisioned using the repository-supported CLI and a temporary provider-held `GRIDSTONE_BOOTSTRAP_PASSWORD`.

Controls:

- the password was not committed to Git;
- the password was not passed as a command-line argument;
- the account was used only for controlled release verification;
- the bootstrap variable was removed from Railway after verification;
- the final permanent service configuration contains no `GRIDSTONE_BOOTSTRAP_PASSWORD` variable.

## Auth, CSRF and session verification

PASS:

- login succeeded;
- authenticated `/api/v1/auth/me` succeeded;
- mutation without CSRF was rejected;
- mutation with invalid CSRF was rejected;
- valid CSRF-protected mutations succeeded;
- logout succeeded;
- the logged-out session was rejected afterward.

## Complete production workflow verification

The verifier created only clearly marked synthetic release records using the prefix `PH4H-VERIFY-*`.

PASS:

1. member creation;
2. plan creation;
3. membership assignment;
4. membership renewal;
5. renewal lineage back to the original membership;
6. attendance access eligibility;
7. attendance check-in;
8. attendance check-out;
9. membership history containing original + renewal;
10. attendance history containing the verification visit;
11. dashboard reconciliation;
12. bounded reporting-window behavior.

Representative successful release-verification record identifiers were emitted only as non-secret operational evidence in provider deployment logs.

## Persistence verification

After the functional workflow completed, the temporary bootstrap credential was removed and the exact same release SHA was redeployed with a credential-free persistence verifier.

PASS — the verifier re-read the same known release records and confirmed:

- verification member still existed;
- verification plan still existed;
- two linked memberships remained present;
- the renewal record retained the expected parent lineage;
- the attendance visit remained present and closed.

This establishes persistence across application redeployment against the managed PostgreSQL volume.

## Final permanent production configuration

The service was returned to the normal permanent pre-deploy path:

```text
alembic upgrade head → production environment validation
```

The final permanent deployment `de15c615-28ad-436c-92aa-7f053687d7ba` completed successfully on exact SHA `8de3f7f336d3b96225cef6670c59a794a66baad5` and passed the provider health check with HTTP 200.

Final app variables expose only the expected non-secret variable names; the bootstrap password variable is absent.

Restart handling is explicit with restart-on-failure behavior and bounded retries.

## Responsive/browser evidence

Repository tests and builds verify the production responsive implementation, including mobile navigation/focus behavior, desktop/mobile layout foundations, persistent light/dark theming, SPA deep links and route integration.

The external browser/DNS client available to the release automation environment could not independently reach the Railway public domain, so this record deliberately does **not** fabricate live-browser screenshots or external-client observations. Provider health, container/deep-link integration and the complete authenticated production API/database workflow are separately verified.

## Backup and recovery status

### Persistent database

PASS — PostgreSQL uses a persistent Railway volume mounted at `/var/lib/postgresql/data`.

### Portable backup/restore

PASS — CI rehearses `pg_dump`/`pg_restore` against disposable PostgreSQL and reconciles restored data/migration state.

### Migration reversibility

PASS — CI verifies migration downgrade/upgrade behavior.

### Provider-native volume snapshots

**LIMITATION — unavailable on the current Railway Hobby workspace.**

The provider reports `maxBackupsCount=0`. Therefore native Railway scheduled volume backups cannot be enabled on the current plan. Earlier notes claiming daily/weekly native volume schedules were enabled are superseded by this provider audit.

Enabling provider-native scheduled snapshots requires a plan with backup entitlement or a separately approved external backup destination.

## Rollback readiness

PASS — successful Railway deployments are retained as rollback-capable, including the verified release lineage. Repository rollback refs preserve known-good Git states.

Application rollback must not be assumed to make a destructive database schema downgrade safe. Migration compatibility must be checked separately whenever schema changes are involved.

## Accepted limitations

1. Native Railway scheduled volume backups are unavailable on the current Hobby plan.
2. The release automation environment could not export independent live-browser screenshots from the public Railway domain; no screenshot claim is inferred.
3. Payments remain intentionally excluded from scope.

None of these limitations changes the verified status of the approved functional release scope.

## Final verdict

Gridstone satisfies the approved production-ready loop:

**sign in → create member → choose/create plan → assign membership → renew → validate access → check in → check out → review history → reconcile dashboard/reporting**

with persistent PostgreSQL data, server-side authorization, CSRF/session controls, responsive frontend implementation, CI-tested recovery procedures and an HTTPS Railway production deployment tied to an exact verified Git commit.
