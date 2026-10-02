# Development Workflow

## Branching

Keep `main` healthy and use short-lived branches:

- `feat/*`
- `fix/*`
- `docs/*`
- `test/*`
- `chore/*`

Open a pull request into `main`. Prefer Conventional Commit-style messages such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.

## Before opening or updating a PR

Run the relevant local checks. For foundation-level changes, run all checks via:

```bash
bash scripts/verify-foundation.sh
```

CI independently verifies the exact Node 24, Python 3.14, PostgreSQL 18, Alembic migration history, and Docker toolchain.

## Database change discipline

For persistence changes:

1. Change SQLAlchemy metadata deliberately.
2. Generate or hand-author an Alembic revision.
3. Review constraints, indexes, foreign keys, defaults, upgrade order, and downgrade order.
4. Run `alembic upgrade head` and `alembic check`.
5. Run database integration tests.
6. Verify downgrade-to-base and re-upgrade in CI for foundational revisions.

Never edit an already-deployed migration to disguise a schema change; add a new revision instead.

## Scope control

Phase 3B may define persistence for members, plans, memberships/renewal lineage, attendance, and payments, but must not add business CRUD endpoints, authentication/authorization, dashboard/report behavior, or real production/demo source-data imports. Payments must never store card numbers, CVV, bank credentials, UPI PINs, or equivalent secrets.

## Completion vocabulary

Use status precisely: PLANNED, DESIGNED, IMPLEMENTED, TESTED, COMMITTED, MERGED, DEPLOYED, VERIFIED. A local file is not "done" merely because it exists.
