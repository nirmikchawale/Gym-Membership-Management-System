# Gridstone Demo Completeness — Implementation Record

Status: **IMPLEMENTED ON FEATURE BRANCH — CI/merge verification pending.**

## Implemented

- One deterministic client-side demo state shared by Members, Plans, Memberships, Attendance, Overview and Reports.
- 112 baseline synthetic members plus interactive member creation/edit/status controls.
- Linked synthetic plan catalogue with create/edit/availability controls and derived membership usage counts.
- Synthetic memberships covering active, scheduled, frozen, expired and cancelled lifecycle states.
- Interactive assignment, renewal, freeze, resume and cancel actions with renewal lineage.
- Generated attendance history, open visits, access decisions, check-in and check-out.
- Dashboard/reporting metrics derived from the same current demo sandbox state.
- Session-scoped demo mutations with a deterministic reset action.
- Interactive-demo language replacing stale read-only/phase-placeholder UI.
- Dedicated Payments route as the sole intentional unavailable feature.
- Obsolete generic placeholder module page removed.
- Demo-runtime tests for baseline completeness, mutations, price-snapshot safety, renewal lineage, attendance and reset.

## Security boundary

The sandbox is activated only when `VITE_PUBLIC_PREVIEW=true`. Production continues through the existing FastAPI/PostgreSQL/auth/CSRF APIs. Demo mutations do not seed or write the production database.

## Pending release gates

- [ ] Exact feature-branch CI green.
- [ ] PR merged to `main`.
- [ ] Exact resulting `main` CI green.
- [ ] Exact resulting `main` deployed to Railway.
- [ ] Production migration/environment validation and health HTTP 200.

Payments remains intentionally outside project scope and is the only module permitted to show an unavailable/not-implemented status.
