# Gridstone Operations Runbook

## Purpose

This runbook makes environment setup, demo data, administrator provisioning, backup, restore and release checks repeatable without committing secrets. Payments remain outside the approved project scope.

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

Before a production schema migration, take or confirm a provider snapshot/backup. Every committed migration must continue to pass the repository downgrade/upgrade CI gate.

## Deterministic synthetic seed

The seed is intended only for development, test and staging. It creates four reserved `DEMO-*` plans plus deterministic `GST-DEMO-*` members, memberships and attendance. Re-running it is idempotent: existing deterministic records are left intact.

```bash
cd backend
APP_ENV=staging uv run python -m app.cli.seed_demo
```

The default seed contains 112 synthetic members. Running the command with `APP_ENV=production` fails before any write.

Do not rename synthetic records to resemble real customers. Demo email addresses use the reserved `.invalid` domain.

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

For an unattended provider command, place the initial password in the provider's secret store as `GRIDSTONE_BOOTSTRAP_PASSWORD`, run the same command with `--ensure`, then remove/rotate the bootstrap secret after successful sign-in. The password must never be passed as a command-line argument.

`--ensure` is idempotent only when the requested active account already exists with the requested role. It does not silently change an existing account's password or privilege level.

## Production environment validation

After provider variables are configured and the managed PostgreSQL service is reachable:

```bash
cd backend
APP_ENV=production uv run python -m app.cli.validate_environment
```

The validator checks the production environment class, PostgreSQL URL shape, non-local database host, absence of the known development password, secure `__Host-` cookie names and database connectivity. It never prints the database URL or password.

## Backup policy

Production should use the managed PostgreSQL provider's automated backups/snapshots as the primary recovery mechanism. Before migrations or high-risk operational work, create an on-demand snapshot when the provider supports it.

For a portable logical backup, use PostgreSQL 18 tooling matching the server major version:

```bash
PGPASSWORD='from-secret-store' pg_dump \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" \
  --format custom --file gridstone.dump "$PGDATABASE"
```

Do not commit dumps. Treat backup files as sensitive because member contact data may be present.

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

## Release checklist

Before a production candidate is promoted:

1. exact `main` Git SHA recorded;
2. GitHub frontend, backend, security and container gates green for that SHA;
3. provider production variables configured through secret storage;
4. `APP_ENV=production` validation passes;
5. managed PostgreSQL backup/snapshot confirmed;
6. Alembic migration plan reviewed and applied;
7. initial admin is provisioned or previously verified;
8. HTTPS health check passes;
9. login/logout/session/CSRF smoke checks pass;
10. Members, Plans, Memberships/Renewals, Attendance and Dashboard/Reports smoke checks pass;
11. mobile/desktop and light/dark smoke checks pass;
12. persistence survives restart/redeploy;
13. rollback target (last known-good SHA/deployment) is recorded;
14. backup/restore rehearsal is green;
15. release URL and exact deployed SHA are recorded.

If any gate fails, do not label the release VERIFIED. Keep or restore the last known-good deployment and investigate forward from an isolated branch.
