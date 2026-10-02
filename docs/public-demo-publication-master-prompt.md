# Gridstone — Public Demo & Publication Master Prompt

## Mission
Transform the verified Gridstone Phase 3D shell into an internet-accessible, populated product preview without weakening the secure FastAPI/PostgreSQL architecture or pretending synthetic records are production data.

## Source-of-truth rules
1. Inspect the actual GitHub repository before changing code.
2. Treat existing Phase 3A–3D architecture as verified baseline.
3. Preserve Gridstone branding, dark graphite/cobalt/violet visual language, responsive shell, accessibility, reduced-motion behavior, and route structure.
4. Never invent a claim that real gym-member data was previously supplied. If no source dataset exists, say so and use explicitly labeled synthetic demo records.
5. Never expose real payment secrets, personal credentials, session tokens, or database secrets.

## Public-preview product requirements
- Overview must show meaningful populated metrics rather than foundation-only copy.
- Members must show realistic synthetic member records with search/filter interaction.
- Plans must show usable plan cards with duration, pricing, availability, and member counts.
- Memberships must show starts, expiries, renewals, status, and price snapshots.
- Attendance must show current/open and completed visits.
- Payments must show metadata-only transaction history.
- Reports must show operational metrics and a simple revenue trend derived from the demo dataset.
- Every public module must clearly disclose that its records are synthetic demo data.
- No page may display “feature slice not started” or blueprint skeleton copy in the published preview.

## Data contract
Use a coherent synthetic dataset with linked member codes across members, memberships, attendance, and payments. Use INR and India-friendly date formatting. Use obviously non-production contact details such as example.com email addresses. Demo data must be deterministic and version-controlled.

## Security boundary
The Vercel publication is a read-only product preview. The real secure application architecture remains FastAPI + PostgreSQL + opaque HttpOnly sessions + CSRF + server-side authorization. Do not fake a production database connection in the public static preview.

## Deployment requirements
- Preserve Node 24 / pnpm 10.18.3 pinning.
- Preserve Vite deep-link rewrites for all product routes.
- Request production alias `gridstone-nirmikchawale1.vercel.app` when Vercel accepts that alias.
- Every push intended for production must build successfully on Vercel.
- Verify `/`, `/members`, `/plans`, `/memberships`, `/attendance`, `/payments`, and `/reports` after deployment.

## Quality gate
Before calling the task complete:
1. format/lint/typecheck/test/build frontend;
2. preserve backend tests and container path;
3. remove placeholder module copy;
4. verify responsive overflow behavior;
5. verify direct deep links;
6. verify the production deployment and final public URL;
7. report exact commit SHA and distinguish synthetic preview from production database state.

## Completion language
Use PLANNED, DESIGNED, IMPLEMENTED, TESTED, COMMITTED, MERGED, DEPLOYED, VERIFIED precisely. Do not call the public preview a fully production-ready gym-management system until real CRUD workflows and the production database are deployed and verified.
