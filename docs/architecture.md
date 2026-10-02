# Architecture Summary

## Current implementation boundary

Phase 3A establishes infrastructure only. The frozen product architecture remains a React SPA, REST API, FastAPI modular monolith, and PostgreSQL database. Business modules are not implemented here.

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
Browser
  -> FastAPI/Uvicorn (:8000)
       -> /api/*      FastAPI routers
       -> /*          built React static files
  -> PostgreSQL 18
```

This keeps browser traffic single-origin and avoids a CORS dependency in the application architecture.

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

Phase 3A currently contains only the infrastructure slices needed for health and database connectivity. Later phases will add domain/services/repositories incrementally. Application services, not repositories, will own business transactions.

## API contract

- Base path: `/api/v1`
- Health: `GET /api/v1/health`
- OpenAPI: `/api/openapi.json`
- Swagger UI: `/api/docs`
- Transport naming: `snake_case`
- Future business errors: RFC 9457-style Problem Details

## Frontend state boundary

The Phase 3A shell uses a direct `fetch` only to prove connectivity. TanStack Query, React Router, React Hook Form, Zod, Tailwind CSS, and Recharts remain frozen stack choices and will be introduced when their owning implementation phases need them rather than as unused dependencies.

## Responsive/accessibility foundation

Global CSS establishes mobile-first sizing, no horizontal overflow, visible focus, skip-to-content behavior, Graphite/Volt seed tokens, 44px-class interactive sizing, and reduced-motion handling. The full design system remains Phase 3D work.
