# Gridstone — Demo Completeness Master Plan

## Objective

Close the final demo gap so every approved Gridstone feature is visibly implemented with one coherent deterministic synthetic dataset. No user-facing feature may present itself as unfinished, planned, read-only, disabled, or "not implemented yet" except Payments, which remains intentionally outside the approved project scope.

## Baseline

- Repository: `nirmikchawale/Gym-Membership-Management-System`
- Baseline `main`: `d4f2c4288259277e44967bb706ae73ea4041d075`
- Production architecture: React/Vite + FastAPI + PostgreSQL, single origin on Railway
- Public/demo architecture: client-side synthetic sandbox only; never fake a production database or weaken production authentication
- Payments: intentionally excluded and may be the only unavailable module

## Non-negotiable rules

1. Preserve production FastAPI/PostgreSQL/auth/CSRF behavior unchanged.
2. Demo mutations must stay client-side and synthetic; never seed production with demo records.
3. All demo records must be deterministic, clearly fictional, and internally linked across features.
4. The same synthetic member/plan/membership/attendance state must feed Members, Plans, Memberships, Attendance, Overview and Reports.
5. Demo changes must reconcile across pages and survive navigation during the browser session; a reset action must restore the deterministic baseline.
6. Remove stale phase-era language from active UI: no "later slice", "read-only preview", "state-changing controls disabled", "does not mutate", or equivalent unfinished-product wording for approved features.
7. Payments stays explicitly unavailable/out of scope; do not add payment capture, receipts, revenue analytics, provider integration or payment secrets.
8. Preserve responsive mobile/desktop behavior, light/dark themes, accessibility, keyboard/focus support and deep links.
9. All code goes through exact-head CI → PR → merge → exact-main CI → exact-main production deployment.

## Required demo coverage

### Members
- At least 112 deterministic members.
- Search/filter/pagination.
- Create/edit synthetic member.
- Activate/deactivate synthetic member.
- Member details remain linked to memberships/attendance.

### Plans
- Deterministic plan catalogue with member counts derived from current demo memberships.
- Search/filter/pagination.
- Create/edit synthetic plan.
- Activate/deactivate synthetic plan.
- Historical membership price snapshots remain unchanged after plan edits.

### Memberships & Renewals
- Every demo member receives meaningful lifecycle context.
- Include active, scheduled, frozen, expired and cancelled examples.
- Assignment, renewal, freeze, resume and cancel all operate in the demo sandbox.
- Renewal lineage is visible and preserved.

### Attendance & Access
- Deterministic attendance history across the same demo members.
- Eligible and blocked access examples.
- Open and completed visits.
- Check-in and check-out mutate the demo sandbox and immediately update the ledger/access state.

### Overview & Reports
- Derive totals, lifecycle counts, expiry queue, plan distribution, occupancy and attendance trend from current demo sandbox state.
- Reporting windows remain interactive.
- Changes made in Members/Memberships/Attendance must reconcile when Overview/Reports are opened.

### Payments
- May appear only as intentionally unavailable/out-of-scope.
- No fake payment workflow.

## UX acceptance

- Demo is labelled `Interactive synthetic demo` / `Demo sandbox`, not read-only.
- A visible `Reset demo data` action restores the deterministic baseline.
- No stale implementation-status copy is visible for approved features.
- All controls remain usable at desktop and mobile widths.
- Empty/error/loading states remain meaningful.

## Verification

- Unit tests for deterministic baseline, mutation isolation, reset, lifecycle transitions, attendance mutations and dashboard reconciliation.
- Existing frontend format/lint/typecheck/tests/build.
- Existing backend migrations/lint/typecheck/tests/seed/backup-restore/migration reversal.
- Dependency security audits.
- Existing Docker single-origin/deep-link/API/PostgreSQL integration.
- Repository search gate confirming forbidden unfinished UI phrases are absent from active frontend code except the intentional Payments wording.

## Exit condition

The phase is closed only when the exact merged `main` passes all CI jobs and the exact same commit is deployed successfully to Railway with healthy PostgreSQL and HTTP 200 health. The public/demo experience must show every approved feature as complete and data-backed; Payments is the sole intentional exception.
