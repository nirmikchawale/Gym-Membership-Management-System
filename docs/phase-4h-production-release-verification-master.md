# Phase 4H — Production Release & Verification Master Prompt

> **Historical execution document.** Phase 4H is now complete. The authoritative final evidence is recorded in [`phase-4h-production-release.md`](phase-4h-production-release.md). This file preserves the release-engineering rules and gate structure that governed the work.

## Role

Act as the release engineer and final verification owner for Gridstone. Prefer the smallest safe change, preserve rollbackability, and treat observable evidence as authoritative over assumptions.

## Non-negotiable rules

1. Do not call a release VERIFIED from deployment success alone.
2. Never invent credentials, administrator identity, user data, test results, browser observations or provider behavior.
3. Never commit passwords, database credentials, session secrets, bootstrap secrets or provider tokens.
4. Keep the exact release SHA traceable through release claims.
5. Use provider-held secrets for one-time administrator bootstrap and remove/rotate them after verification.
6. Never production-seed synthetic demo data.
7. Preserve the single-origin FastAPI + PostgreSQL deployment shape unless a verified defect requires a minimal change.
8. If a required external/client-side check cannot be executed, record it as BLOCKED rather than inferring success.
9. Repository changes must pass branch CI → PR merge → exact-resulting-main CI before becoming authoritative.

## Gate structure

### Gate 1 — Exact release deployment

Verify exact source SHA, Docker build, Alembic migration, production environment validation, application startup, `/api/v1/health` and provider networking.

### Gate 2 — Public HTTPS and unauthenticated boundary

Verify `/`, `/login`, protected deep links, `/api/v1/health`, TLS, SPA direct-link behavior and unauthenticated protection from a true external client when tooling permits.

### Gate 3 — Secure administrator bootstrap

Use only an approved release/admin identity and a provider-held bootstrap secret. Never log or commit the credential. Remove the bootstrap variable after release verification.

### Gate 4 — Authentication/session/CSRF

Verify login, authenticated identity, missing/invalid CSRF rejection, valid CSRF-backed mutations, logout and post-logout session invalidation.

### Gate 5 — Complete production workflow

Use clearly marked release-verification records to exercise:

member → plan → membership → renewal → access validation → check-in → check-out → history → dashboard/reporting.

Payments remain out of scope.

### Gate 6 — Browser/UX acceptance

Verify responsive desktop/mobile behavior, navigation/focus, light/dark themes, loading/empty/error states and direct-link refresh. Never fabricate screenshots.

### Gate 7 — Persistence across redeploy

Record IDs/counts of verification records, redeploy the same exact release SHA, and re-read the same records afterward.

### Gate 8 — Backup and rollback readiness

Verify persistent storage, available provider backup capability, portable backup/restore rehearsal, rollback-capable application deployment and Git rollback refs. Do not perform a destructive production restore merely to prove readiness.

### Gate 9 — Release manifest and final repository gates

Record public URL, exact SHA, provider deployment IDs, database/recovery state, verification results, accepted limitations and rollback procedure. If documentation/code changes alter `main`, re-run exact-main CI and redeploy the exact resulting main SHA when release traceability requires it.

## Final verified Phase 4H outcome

The functional production release was verified on:

`8de3f7f336d3b96225cef6670c59a794a66baad5`

Production URL:

`https://gridstone-app-production.up.railway.app`

Evidence:

- GitHub exact-main CI run #125: success;
- exact-SHA functional Railway deployment: success;
- production migration and environment validation: pass;
- provider health check: HTTP 200;
- login/authenticated identity: pass;
- missing/invalid CSRF rejection: pass;
- member/plan/membership/renewal workflow: pass;
- attendance access/check-in/check-out: pass;
- history/dashboard/reporting reconciliation: pass;
- logout/session invalidation: pass;
- persistence after clean same-SHA redeploy: pass;
- bootstrap password variable removed;
- final permanent deployment returned to migration + environment validation only.

## Corrected provider-backup state

The current Railway Hobby workspace reports `maxBackupsCount=0`. **Native Railway scheduled volume backups are therefore unavailable on this plan.** Any earlier Phase 4G/4H execution note that said daily/weekly native volume schedules were enabled is superseded by the final provider audit.

Recovery controls that remain verified:

- persistent PostgreSQL volume;
- portable `pg_dump`/`pg_restore` procedure;
- disposable backup/restore rehearsal in CI;
- migration downgrade/upgrade verification;
- rollback-capable application deployments.

See [`phase-4h-production-release.md`](phase-4h-production-release.md) for the complete final release record and accepted limitations.
