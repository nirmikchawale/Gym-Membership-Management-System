# Phase 4G — Production Infrastructure

**Status: COMPLETE + VERIFIED.**

## Authoritative result

- Phase 4G resulting `main` SHA: `66690638884adb5098a9f7e559d8fffe57cc8c52`
- Phase 4G PR: #21
- PR CI run #112: success
- Exact resulting-main CI run #113: success
- Production provider: Railway project `Gridstone`, environment `production`
- Public application URL: `https://gridstone-app-production.up.railway.app`

## Railway topology

Production contains two core services:

1. `Postgres`
   - Railway PostgreSQL 18 image.
   - Persistent volume mounted at `/var/lib/postgresql/data`.
   - Private database connectivity consumed by the app through provider-held configuration.

2. `gridstone-app`
   - Built from the repository Dockerfile.
   - Single-origin deployment serving the built React frontend and FastAPI backend.
   - Public Railway HTTPS domain: `https://gridstone-app-production.up.railway.app`.
   - Production configuration is held by Railway rather than committed secrets.

## Production application configuration

Non-secret application settings include:

- `APP_ENV=production`
- `APP_NAME=Gridstone API`
- `APP_TIMEZONE=Asia/Kolkata`
- `SESSION_LIFETIME_HOURS=8`
- `PORT=8000`
- `DATABASE_URL` references the managed PostgreSQL service; credentials are not committed to Git.

Service controls:

- Dockerfile build;
- pre-deploy `alembic upgrade head` + production environment validation;
- health path `/api/v1/health`;
- 120-second health timeout;
- explicit restart-on-failure policy in the finalized Phase 4H service configuration;
- one application replica in the current Railway region.

## Deployment verification

The first two infrastructure candidates failed at Railway's health-check stage. The application itself started and migration/environment checks passed. Root cause was provider health-probe port configuration: the service used an explicit target port without a matching explicit service-level `PORT` value.

The safe fix was to set `PORT=8000`, matching the Railway domain target and listener. Candidate deployment `13fcde41-fbe5-45fe-9b4f-1234c2f4da32` then passed build, migration, PostgreSQL validation, startup and the provider health check with HTTP 200.

The Dockerfile was updated to honor `${PORT:-8000}`, so the image remains provider-port-aware while retaining a local default.

## Database safety and corrected backup record

PostgreSQL data is stored on a persistent Railway volume. The repository contains portable `pg_dump`/`pg_restore` procedures and CI rehearses backup/restore against disposable PostgreSQL, including migration-count reconciliation and migration reversibility.

### Provider-native backup entitlement

A Phase 4H provider audit established that the current Railway Hobby workspace reports:

`maxBackupsCount=0`

Therefore **native Railway volume backup schedules are not available on the current plan**. Earlier Phase 4G notes that said daily and weekly native volume backups were enabled were incorrect and are superseded by this verified provider state.

No production restore was performed merely to prove readiness. Enabling provider-native scheduled snapshots requires a Railway plan with backup entitlement or a separately approved external backup target.

## Initial administrator provisioning

No password is committed to the repository. The supported unattended path uses the existing `app.cli.create_user` command with a temporary provider-held `GRIDSTONE_BOOTSTRAP_PASSWORD`, followed by removal of that variable after release verification.

Phase 4H used this path for a dedicated release-verification administrator, completed the authenticated workflow, and then removed the bootstrap secret from the service configuration.

## Rollback

Railway retains successful application deployments that are marked rollback-capable, while Git rollback refs preserve known-good repository states. Database downgrade safety must still be considered separately from application rollback whenever migrations change schema.

## Phase 4G exit checklist

- [x] Managed PostgreSQL provisioned.
- [x] Persistent database volume attached.
- [x] Application service created from repository Dockerfile.
- [x] Production-only environment configuration stored at provider.
- [x] Controlled Alembic pre-deploy migration configured and executed successfully.
- [x] Production environment validator executed successfully.
- [x] Health check configured and passing.
- [x] Public HTTPS domain created.
- [x] Secure initial-admin provisioning path documented without committing credentials.
- [x] Rollback-capable healthy deployment retained.
- [x] Portable PostgreSQL backup/restore procedure documented and rehearsed in CI.
- [x] Phase 4G PR CI green on exact head.
- [x] Phase 4G merged to `main`.
- [x] Exact resulting `main` CI green.
- [ ] Native Railway scheduled volume backups — unavailable on current Hobby entitlement (`maxBackupsCount=0`).

Phase 4H subsequently completed production functional verification and persistence testing on the live infrastructure.
