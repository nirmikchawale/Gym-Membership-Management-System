# Gridstone Operations Runbook

## Purpose

This runbook makes environment setup, administrator provisioning, migration, backup/restore and release checks repeatable without committing secrets. Payments remain outside the approved project scope.

## Environment classes

- `development`: local engineering only.
- `test`: automated/disposable validation only.
- `staging`: non-production candidate validation; synthetic data is allowed.
- `production`: real persistent application data. Synthetic demo seeding is blocked by code.

Production secrets belong only in provider secret storage. Never commit `DATABASE_URL`, administrator passwords, session material, backup credentials or provider tokens.

## Database migrations

Run migrations before starting a new application release:

```bash
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

Before a high-risk production schema migration, confirm the available recovery mechanism. Every committed migration must continue to pass the repository downgrade/upgrade CI gate.

## Deterministic synthetic seed

The seed is intended only for development, test and staging. It creates reserved `DEMO-*` plans plus deterministic `GST-DEMO-*` members, memberships and attendance.

```bash
cd backend
APP_ENV=staging uv run python -m app.cli.seed_demo
```

Running the command with `APP_ENV=production` fails before any write. Do not rename synthetic records to resemble real customers. Demo email addresses use the reserved `.invalid` domain.

## Initial administrator provisioning

The normal interactive path keeps the password out of shell history:

```bash
cd backend
uv run python -m app.cli.create_user \
  --email admin@example.com \
  --name "Gridstone Administrator" \
  --role admin \
  --ensure
```

`admin@example.com` is documentation-only. Do not silently treat it as a real production identity.

For an unattended provider command, place the initial password in provider secret storage as `GRIDSTONE_BOOTSTRAP_PASSWORD`, run the same command with `--ensure`, verify sign-in, and then remove/rotate the bootstrap secret. The password must never be passed as a command-line argument or committed to Git.

`--ensure` is idempotent only when the requested active account already exists with the requested role. It does not silently change an existing account's password or privilege level.

## Production environment validation

After provider variables are configured and PostgreSQL is reachable:

```bash
cd backend
APP_ENV=production uv run python -m app.cli.validate_environment
```

The validator checks the production environment class, PostgreSQL URL shape, non-local database host, absence of the known development password, secure `__Host-` cookie names and database connectivity. It never prints the database URL or password.

## Backup policy

### Current Railway entitlement

The current Railway Hobby workspace reports `maxBackupsCount=0`. Native Railway volume snapshots/scheduled backups therefore **cannot be enabled on the present plan**.

Earlier project notes that stated daily and weekly Railway native backups were enabled are superseded by the Phase 4H provider audit.

Current recovery controls are:

- persistent Railway PostgreSQL volume;
- portable logical PostgreSQL backup/restore procedure;
- disposable backup/restore rehearsal in CI;
- migration downgrade/upgrade verification in CI;
- rollback-capable application deployments.

Provider-native scheduled snapshots require a Railway plan with backup entitlement or a separately approved external backup target.

### Portable logical backup

Use PostgreSQL 18 tooling matching the server major version:

```bash
PGPASSWORD='from-secret-store' pg_dump \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" \
  --format custom --file gridstone.dump "$PGDATABASE"
```

Do not commit dumps. Treat backup files as sensitive because member contact data may be present. Store them only in an approved private backup destination.

## Restore procedure

Restore into a new/disposable database first; do not overwrite production as the first recovery step.

```bash
createdb --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" gridstone_restore
pg_restore --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" \
  --dbname gridstone_restore --exit-on-error gridstone.dump
```

Validate at minimum:

- the `alembic_version` row exists;
- member counts reconcile;
- representative member/membership/attendance rows are readable;
- application migrations can run against the restored database;
- an authenticated smoke test succeeds before any recovery promotion.

The repository CI runs `scripts/rehearse-backup-restore.sh` against disposable PostgreSQL and reconciles restored member and migration counts.

## Data retention and deactivation

Gridstone preserves operational history instead of destructively deleting referenced records:

- members should be deactivated when they no longer use the gym;
- plans should be archived/deactivated rather than deleted when historical memberships reference them;
- memberships retain price/currency snapshots and lifecycle history;
- attendance retains the membership reference that authorized access;
- authentication sessions are revocable and should not be treated as business records.

Any future hard-delete or privacy-erasure workflow must explicitly handle foreign-key history and applicable institutional/legal requirements; it is not implemented implicitly by this runbook.

## Production release checklist

Before a production candidate is called VERIFIED:

1. record the exact `main` Git SHA;
2. require GitHub frontend, backend, security and container gates green for that SHA;
3. configure production variables only through provider secret storage;
4. require `APP_ENV=production` validation to pass;
5. confirm the currently available recovery mechanism and note any provider entitlement limitation;
6. review and apply the Alembic migration plan;
7. provision or verify the administrator through the supported secure path;
8. require the HTTPS/provider health check to pass;
9. verify login/logout/session/CSRF behavior;
10. smoke-test Members, Plans, Memberships/Renewals, Attendance and Dashboard/Reports;
11. verify responsive desktop/mobile and light/dark behavior through available test/browser evidence;
12. prove persistence by re-reading known records after restart/redeploy;
13. record a rollback-capable last-known-good SHA/deployment;
14. require portable backup/restore rehearsal and migration reversibility to remain green;
15. record release URL, deployed SHA and accepted limitations;
16. remove temporary bootstrap credentials from provider configuration.

If any mandatory gate fails, do not label the release VERIFIED. Keep or restore the last known-good deployment and investigate forward from an isolated branch.

## Current production reference

As of Phase 4H closeout:

- production URL: `https://gridstone-app-production.up.railway.app`;
- verified application SHA: `8de3f7f336d3b96225cef6670c59a794a66baad5`;
- final permanent Railway deployment for that SHA: `de15c615-28ad-436c-92aa-7f053687d7ba`;
- bootstrap password variable: removed;
- permanent pre-deploy path: Alembic migration + production environment validation;
- provider-native volume backups: unavailable on current Hobby plan.
