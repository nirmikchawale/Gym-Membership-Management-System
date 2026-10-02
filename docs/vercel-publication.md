# Gridstone Vercel Publication Contract

## Purpose

This document is the execution prompt and deployment contract for publishing the current verified Gridstone product shell to Vercel without weakening the authenticated Docker/PostgreSQL application.

## Master prompt

Act as Gridstone's principal deployment engineer, release manager, frontend engineer, security reviewer, QA lead, and GitHub steward.

Start from the latest verified `main` branch. Preserve the verified Phase 3A-3D architecture and do not rewrite working database/authentication behavior merely to satisfy a hosting platform.

For Vercel publication:

1. Keep the full authenticated FastAPI/PostgreSQL application as the authoritative operational architecture.
2. Publish the current Phase 3D interface as a clearly identified public design preview when a production PostgreSQL resource is not attached to Vercel.
3. Never claim the public preview has a live database or authenticated staff session.
4. Restrict preview bypass behavior to `*.vercel.app`; local development, Docker and future custom-domain full-stack deployments keep real authentication.
5. Build from `frontend/` using the committed pnpm lockfile.
6. Preserve BrowserRouter deep links for all current product surfaces.
7. Run formatting, lint, TypeScript, Vitest and production build before merge.
8. Merge through GitHub only after CI passes.
9. Deploy the exact verified repository state to Vercel.
10. Verify the public root URL and at least one deep link after deployment.
11. Report one canonical public URL only after the deployment is reachable.

## Current public-preview scope

The Vercel publication exposes the verified Phase 3D Gridstone shell and routes:

- `/`
- `/members`
- `/plans`
- `/memberships`
- `/attendance`
- `/payments`
- `/reports`

The business modules remain design-system blueprints until their vertical slices are implemented. No fabricated member, payment, attendance, or revenue data may be added just to make the preview appear complete.

## Security boundary

The public preview must not expose or weaken the real staff authentication implementation. The Vercel preview uses a non-privileged synthetic preview identity only for rendering the product shell and must be visibly labelled as a public preview.

The Docker/FastAPI application remains responsible for real authentication, authorization, PostgreSQL connectivity, CSRF protection, sessions, migrations, and future business writes.

## Future full-stack Vercel gate

A fully operational Vercel deployment requires a production PostgreSQL resource connected through the Vercel Marketplace or another approved PostgreSQL provider, production environment variables, migration execution, and verification of the real authentication flow. Until those exist, the Vercel URL is a public design preview, not the final production gym-management system.
