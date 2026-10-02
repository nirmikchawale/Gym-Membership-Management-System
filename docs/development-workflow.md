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

CI independently verifies the exact Node 24, Python 3.14, PostgreSQL 18, and Docker toolchain.

## Scope control

Do not introduce member CRUD, plans, memberships, attendance, payments, renewals, dashboard/report functionality, or authentication during Phase 3A. Infrastructure-only changes are allowed when required to validate the foundation.

## Completion vocabulary

Use status precisely: PLANNED, DESIGNED, IMPLEMENTED, TESTED, COMMITTED, MERGED, DEPLOYED, VERIFIED. A local file is not "done" merely because it exists.
