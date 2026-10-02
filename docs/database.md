# Database Foundation

Phase 3B establishes the persistence model and migration discipline for the Gym Membership Management System. It deliberately does not add business CRUD endpoints, authentication, authorization, dashboard behavior, or production/demo source-data imports.

## Principles

- PostgreSQL 18 is the authoritative database engine.
- SQLAlchemy models describe application persistence; Alembic revisions are the deployable schema history.
- UUID primary keys are application-generated and are never derived from mutable business identifiers.
- `created_at` and `updated_at` are timezone-aware timestamps; PostgreSQL stores absolute instants while the application presents local time using `Asia/Kolkata` where appropriate.
- Database constraints protect invariants independently of API validation.
- Foreign keys use restrictive deletion for historical business records; application workflows should archive/deactivate rather than erase referenced records.
- Payments store transaction metadata only. Card numbers, CVV, bank credentials, UPI PINs, and equivalent secrets are forbidden.
- Real source archives remain immutable. Phase 3B tests use synthetic fixtures only.

## Persistence model

```text
members
  1 ─────< memberships >───── 1 membership_plans
               |
               | optional self-reference: renewed_from_membership_id
               |
               └────< payments

members
  1 ─────< attendance
```

### `members`

Stable member identity and contact data. `member_code`, `email`, and `phone` are unique when present. Email is required to be normalized to lowercase at the database boundary.

### `membership_plans`

Plan catalogue persistence with duration, price, currency, and active state. Price and duration constraints prevent invalid catalogue rows.

### `memberships`

Historical member-to-plan assignments. The row snapshots price/currency so later plan edits do not rewrite commercial history. Renewal lineage is represented by `renewed_from_membership_id` rather than duplicating membership facts in a separate renewal table.

### `attendance`

Check-in/check-out history. A partial unique index allows at most one open attendance visit per member, and a check constraint prevents checkout before check-in.

### `payments`

Membership payment records with amount, currency, status, method, timestamps, and an optional external reference. No sensitive payment credentials are persisted.

## Migration workflow

From the repository root:

```bash
uv run --project backend alembic -c backend/alembic.ini upgrade head
uv run --project backend alembic -c backend/alembic.ini current
uv run --project backend alembic -c backend/alembic.ini check
```

Create a future revision only after changing SQLAlchemy metadata:

```bash
uv run --project backend alembic -c backend/alembic.ini revision --autogenerate -m "describe change"
```

Review generated SQL and constraint/index names before committing. CI starts with an empty PostgreSQL 18 database, upgrades to head, checks model/migration drift, runs integration tests, downgrades to base, and upgrades to head again.

## Seed/data boundary

Phase 3B intentionally does not fabricate or import production/demo datasets. Test cases create synthetic rows transactionally. A later data-population phase may introduce explicit minimal/demo/test seed modes after an authoritative source dataset is available, without weakening production constraints.
