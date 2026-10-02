# Architecture Summary

## Current implementation boundary

Phase 3A established the repository and application infrastructure. Phase 3B adds the database persistence foundation: SQLAlchemy domain tables, deterministic Alembic migrations, database constraints/indexes, migration verification, and synthetic database integration tests. Business API CRUD, authentication/authorization, and dashboard/report behavior remain outside this phase.

## Development request path

```text
Browser
  -> Vite dev server (:5173)
  -> /api proxy
  -> FastAPI (:8000)
  -> SQLAlchemy / Psycopg 3
  -> PostgreSQL 18
```

## Production container path

```text
Migration job
  -> Alembic upgrade head
  -> PostgreSQL 18

Browser
  -> FastAPI/Uvicorn (:8000)
       -> /api/*      FastAPI routers
       -> /*          built React static files
  -> PostgreSQL 18
```

The application container starts only after the database is healthy and the migration job has completed successfully. Browser traffic remains single-origin.

## Backend layering target

```text
Router
-> Pydantic request/response schema
-> authentication / authorization
-> application service
-> domain rules
-> repository / query
-> SQLAlchemy session
-> PostgreSQL
```

Phase 3B establishes the SQLAlchemy persistence layer only. Application services, not repositories, will own business transactions when feature phases begin.

## API contract

- Base path: `/api/v1`
- Health: `GET /api/v1/health`
- OpenAPI: `/api/openapi.json`
- Swagger UI: `/api/docs`
- Transport naming: `snake_case`
- Future business errors: RFC 9457-style Problem Details

## Database contract

- PostgreSQL 18
- Alembic-controlled schema history
- UUID primary keys
- timezone-aware timestamps
- deterministic constraint/index naming
- persistence tables: members, membership plans, memberships, attendance, payments
- renewal lineage represented by a self-reference on memberships
- no payment secrets stored

See [`database.md`](database.md) for schema invariants and migration workflow.

## Frontend state boundary

The current shell uses a direct `fetch` only to prove connectivity. TanStack Query, React Router, React Hook Form, Zod, Tailwind CSS, and Recharts remain frozen stack choices and will be introduced when their owning implementation phases need them rather than as unused dependencies.

## Responsive/accessibility foundation

Global CSS establishes mobile-first sizing, no horizontal overflow, visible focus, skip-to-content behavior, Graphite/Volt seed tokens, 44px-class interactive sizing, and reduced-motion handling. The full design system remains Phase 3D work.
