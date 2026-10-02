# Phase 4E — Operational Administration

Base / rollback SHA: `0d717547ca4d166b224d71bce293a3e1bff6ab94` (Phase 4D verified).

## Scope

- deterministic synthetic seed for development/test/staging;
- hard production seed guard;
- idempotent, secret-safe first-admin provisioning;
- production environment validation;
- PostgreSQL backup/restore runbook and disposable CI rehearsal;
- deactivation/data-retention guidance;
- release checklist.

## Non-goals

- no Phase 4C payment functionality;
- no production provider provisioning (Phase 4G);
- no production deployment (Phase 4H).

## Exit gate

Fresh/disposable PostgreSQL can be migrated, seeded, dumped, restored and reconciled; production seeding is blocked; production configuration can be validated without printing secrets; exact PR head and exact merged `main` CI must both be green.
