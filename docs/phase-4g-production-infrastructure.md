# Phase 4G — Production Infrastructure

Status: IMPLEMENTED ON PHASE BRANCH; provider candidate healthy; pending PR/exact-main verification before phase is marked VERIFIED.

## Baseline

- Baseline `main` SHA: `601ebec5f85c3f24366959a44a15530cb25e6075`
- Baseline CI: GitHub Actions CI passed on the exact baseline SHA.
- Phase branch: `feat/phase-4g-production-infrastructure`
- Rollback refs already existed before implementation: `rollback/phase-4g-pre-production` and `rollback/pre-4g-production-infra`.

## Railway topology

Project: `Gridstone`

Production environment contains:

1. `Postgres`
   - Railway-managed PostgreSQL 18 image.
   - Persistent volume mounted at `/var/lib/postgresql/data`.
   - Daily and weekly volume backup schedules enabled.
   - PITR intentionally not enabled in Phase 4G.

2. `gridstone-app`
   - Built from the repository Dockerfile.
   - Single-origin deployment serving the built React frontend and FastAPI backend.
   - Public Railway HTTPS domain: `https://gridstone-app-production.up.railway.app`.
   - Production configuration is held by Railway rather than committed secrets.

## Production application configuration

Non-secret application settings:

- `APP_ENV=production`
- `APP_NAME=Gridstone API`
- `APP_TIMEZONE=Asia/Kolkata`
- `SESSION_LIFETIME_HOURS=8`
- `PORT=8000`
- `DATABASE_URL` is a Railway reference to the managed PostgreSQL service; credentials are not committed to Git.

Service controls:

- Dockerfile build.
- Pre-deploy command performs `alembic upgrade head` and production environment validation.
- Health path: `/api/v1/health`.
- Health timeout: 120 seconds.
- Restart policy: restart on failure, maximum 10 retries.
- One application replica in the current Railway region.

## Deployment verification

The first two candidate deployments failed only at Railway's health-check stage. The application itself started and the migration/production-environment checks passed. Root cause was provider health-probe port configuration: the service used an explicit target port but did not yet have an explicit service-level `PORT` variable.

The safe fix was to set `PORT=8000`, matching the Railway domain target and application listener. The third candidate deployment (`13fcde41-fbe5-45fe-9b4f-1234c2f4da32`) succeeded. Railway recorded:

- Docker build: success.
- Alembic pre-deploy migration: success.
- Production environment validator: PostgreSQL reachable.
- Application startup: success.
- Health check: succeeded on first attempt.
- `GET /api/v1/health`: HTTP 200.

The Dockerfile is also updated on the Phase 4G branch to honor `${PORT:-8000}` so future providers do not depend on a Railway-only start-command override.

## Database safety

- PostgreSQL data is on a persistent Railway volume.
- Daily and weekly native volume backups are enabled.
- The repository already contains portable `pg_dump` / restore rehearsal procedures and CI coverage for backup/restore behavior.
- No destructive database operation or restore was performed during Phase 4G.

## Initial administrator provisioning

No production administrator account or password is committed or invented in Phase 4G. The secure supported path remains the repository CLI (`app.cli.create_user`) using a provider-held `GRIDSTONE_BOOTSTRAP_PASSWORD` for unattended provisioning, followed by removal/rotation of that bootstrap secret after first sign-in. Actual administrator provisioning belongs to the controlled Phase 4H release verification step.

## Rollback target

Until Phase 4H creates a verified release, the infrastructure candidate above is the first healthy application deployment. Railway retains deployment images for plan-dependent rollback windows; repository rollback refs preserve the pre-4G Git baseline. No Phase 4G result should be called a fully verified production release until the PR is merged, exact-main CI passes, and Phase 4H smoke/persistence verification is complete.

## Phase 4G exit checklist

- [x] Managed PostgreSQL provisioned.
- [x] Persistent database volume attached.
- [x] Application service created from repository Dockerfile.
- [x] Production-only environment configuration stored at provider.
- [x] Controlled Alembic pre-deploy migration configured and executed successfully.
- [x] Production environment validator executed successfully.
- [x] Health check configured and passing.
- [x] Restart policy configured.
- [x] Public HTTPS domain created.
- [x] Secure initial-admin provisioning path documented without committing credentials.
- [x] Daily and weekly database backup policy configured.
- [x] Healthy provider candidate tied to the exact previously-green baseline SHA.
- [ ] Phase 4G PR CI green on its exact head.
- [ ] Merge to `main`.
- [ ] Exact resulting `main` CI green.

After the final three repository gates pass, Phase 4G can be marked VERIFIED and Phase 4H can begin.
