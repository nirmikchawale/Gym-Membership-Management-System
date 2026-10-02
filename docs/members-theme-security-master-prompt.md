# Gridstone — Members Vertical Slice, Theme & Security Hardening Master Prompt

## Mission
Complete the Members vertical product slice immediately after the verified Phase 3D Design System & Product Shell. Preserve the explicit phase boundary: Plans, memberships/renewals, attendance, payments, dashboard and reporting remain later approved work. Do not present later modules as completed business functionality.

## Required outcomes
1. Implement Members end to end: authenticated API, service logic, validation, persistence, search, status filtering, pagination, member detail, create, edit, deactivate and reactivate.
2. Keep deletion out of scope so historical references remain safe; use activation state instead.
3. Add exactly 100 additional deterministic synthetic member records to the public/registered demo, bringing the member demo total from 12 to 112.
4. Keep all demo identities and contact details fabricated and clearly labeled as synthetic.
5. Add user-selectable light and dark themes to both the authenticated application and the public preview. Persist the user’s choice locally and respect system preference on first load.
6. Treat desktop and mobile as first-class layouts. Prevent page-level horizontal overflow, convert member tables into mobile cards, keep touch targets large, and make long names/emails wrap safely.
7. Security-audit the current implementation. Fix concrete weaknesses without weakening the verified architecture.

## Architecture boundary
- Frontend: React + TypeScript + Vite + React Router.
- Backend: FastAPI + Pydantic + SQLAlchemy + PostgreSQL.
- Auth: opaque server-side sessions, HttpOnly session cookie, session-bound CSRF validation, SameSite=Strict, Secure outside development/test.
- REST remains under `/api/v1`.
- Application service owns member transaction behavior.
- PostgreSQL constraints remain authoritative.
- No payment secrets or unrelated feature CRUD in this slice.

## Members API contract
- `GET /api/v1/members`: authenticated, query search, active/inactive/all filter, offset pagination, hard page-size cap.
- `GET /api/v1/members/{id}`: authenticated detail.
- `POST /api/v1/members`: authenticated + CSRF; normalized, validated input.
- `PATCH /api/v1/members/{id}`: authenticated + CSRF; partial edit.
- `POST /api/v1/members/{id}/deactivate`: authenticated + CSRF.
- `POST /api/v1/members/{id}/activate`: authenticated + CSRF.
- Use generic not-found/conflict messages and ORM parameterization.
- Escape search wildcards so user-entered `%`/`_` do not unexpectedly match the full directory.
- Cap list responses to 100 rows per request.

## Frontend Members requirements
- Search by name, code, email, phone and plan context in the public demo; corresponding server-side fields in the authenticated app.
- Status filter.
- Pagination.
- Member detail panel.
- Add and edit form in authenticated mode.
- Activate/deactivate behavior in authenticated mode.
- Read-only disclosure in public preview.
- Useful loading, empty and error states.
- No overlapping controls at narrow widths.

## Theme requirements
- `light` and `dark` only.
- System preference is initial fallback; explicit user choice wins and persists.
- Toggle available on sign-in and authenticated/public workspace.
- Contrast, borders, focus rings, cards, forms, navigation, modals and data tables must remain legible in both modes.
- Theme switching must not require reload.

## Public preview security boundary
- Do not infer public-preview mode from a hostname wildcard such as `*.vercel.app`.
- Public preview must be an explicit build-time mode (`VITE_PUBLIC_PREVIEW=true`).
- The real single-origin Docker/FastAPI build must keep authentication enabled.
- Public preview is read-only and must never claim a live production database.

## Security hardening checklist
- Preserve HttpOnly/Secure/SameSite session controls and CSRF enforcement.
- Add browser security headers: CSP, `X-Content-Type-Options`, clickjacking protection, referrer policy and restrictive permissions policy.
- Add HSTS in production.
- Disable interactive API docs/openapi publication in production unless deliberately re-enabled.
- Mark browser-consumed API responses `Cache-Control: no-store`.
- Add dependency vulnerability audits for frontend and backend to CI.
- Keep safe HTTP methods free of state changes.
- Validate string lengths, formats, dates and pagination bounds.
- Avoid exposing stack traces or database error details.

## Testing gate
Before merge:
- frontend formatting, lint, strict TypeScript, component tests and Vite build;
- backend Alembic upgrade/drift/reversibility, Ruff, mypy and pytest;
- Members auth/CSRF/search/wildcard/validation/conflict/status/pagination tests;
- security-header tests;
- frontend and backend dependency audit;
- Docker single-origin integration and `/members` deep-link check;
- mobile-safe CSS and reduced-motion behavior retained.

## Git protocol
Work on a short-lived branch. Open a PR. Do not merge until every CI job is green. Fix CI findings, rerun, merge with exact head SHA, then verify `main` CI. Mirror the verified frontend/theme/security-preview changes to the Vercel-connected `nirmikchawale/gridstone` repository without promoting the application as final production. The public URL remains a preview until all later slices and final hardening are complete.

## Completion language
Use PLANNED → DESIGNED → IMPLEMENTED → TESTED → COMMITTED → MERGED → VERIFIED. For the public Vercel surface, `DEPLOYED` means preview deployment only. Do not call Gridstone fully production-ready until the approved later product slices and final hardening are complete.
