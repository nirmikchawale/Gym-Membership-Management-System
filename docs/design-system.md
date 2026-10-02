# Gridstone design system — Phase 3D

Phase 3D turns the authenticated proof shell into the reusable Gridstone product surface. It does not implement business CRUD.

## Product direction

Gridstone is an operational tool, not a marketing dashboard. The interface should feel composed under pressure: dark mineral surfaces, clear hierarchy, restrained cobalt/violet light, compact but readable information density, and motion that never competes with the task.

The visual direction is **Graphite + electric cobalt + mineral violet**. Green is not used as a brand accent. Semantic success may use a restrained teal signal where state communication requires it.

## Design principles

1. **Front-desk speed** — common navigation targets and controls remain obvious and touch-safe.
2. **Calm density** — information can be compact without becoming visually noisy.
3. **Visible system trust** — staff identity, authorization role and system health are easy to understand.
4. **Mobile is intentional** — navigation becomes a drawer, layouts stack and tables have an explicit mobile strategy.
5. **Motion earns its place** — ambient scroll-tide depth is decorative only and disappears for `prefers-reduced-motion`.
6. **No fake product behavior** — unfinished business modules show honest interface blueprints instead of simulated records or nonfunctional controls.

## Core tokens

The token source lives in `frontend/src/styles/global.css`.

- Background: `--bg`, `--bg-soft`
- Surfaces: `--surface`, `--surface-2`, `--surface-3`, `--surface-glass`
- Text: `--text`, `--text-soft`, `--muted`, `--faint`
- Borders: `--border`, `--border-strong`
- Brand accents: `--accent`, `--accent-strong`, `--accent-violet`, `--accent-cyan`
- Semantic state: `--success`, `--warning`, `--danger`
- Shared geometry: radius, spacing, shadow and focus tokens

## Brand mark

The Gridstone mark is a four-cell geometric stone/grid glyph. One cell is deliberately offset to suggest movement and an operating system that is structured without feeling rigid. The mark is built from CSS so it stays crisp at every density without adding an asset pipeline.

## Shared primitives

Phase 3D introduces reusable components for:

- Gridstone brand lockup
- buttons with primary, secondary, ghost and danger variants
- semantic badges
- authenticated workspace shell
- desktop/sidebar navigation
- mobile drawer navigation
- user/role identity
- live system signal
- page headers
- module cards
- blueprint/loading skeleton patterns
- empty/error/session states

Business-specific form, table, dialog and destructive-confirmation variants should extend these primitives when their owning vertical slice is implemented, rather than being guessed in advance.

## Navigation and routes

React Router owns the product route map.

- `/` — workspace overview
- `/members`
- `/plans`
- `/memberships`
- `/attendance`
- `/payments`
- `/reports`

The FastAPI single-origin host now serves `index.html` as a safe SPA fallback for non-API deep links. Unknown `/api/*` paths remain API 404s and never fall through to the frontend.

## Responsive behavior

Desktop (`> 62rem`):

- persistent left navigation;
- sticky command/status top bar;
- multi-column module and foundation surfaces.

Tablet/mobile (`<= 62rem`):

- off-canvas navigation with backdrop and Escape-key dismissal;
- compact identity treatment;
- single-column content where density would otherwise become unsafe.

Small mobile (`<= 44rem`):

- stacked hero metrics;
- one-column module/principle cards;
- blueprint rows collapse to their primary information columns;
- no horizontal page overflow.

Controls keep a minimum 44px interaction height.

## Accessibility

- semantic headings and landmarks;
- skip-to-content link;
- visible focus rings;
- keyboard-dismissable mobile navigation;
- high-contrast text hierarchy;
- status communication is not color-only;
- reduced-motion mode removes animation and scroll-tide transforms;
- form errors use `role="alert"`;
- decorative icons are hidden from assistive technology.

## Scroll-tide motion

`useScrollTide` updates two CSS variables through one `requestAnimationFrame`-throttled passive scroll listener. Only ambient background orbs consume those variables. The behavior:

- is decorative;
- has a hard movement cap;
- never moves controls or operational content;
- is disabled completely when reduced motion is requested.

This keeps the earlier Scroll Tide direction while protecting performance and usability.

## Phase boundary

Phase 3D owns the product shell and design language only. Members, plans, memberships/renewals, attendance, payments and reporting remain subsequent vertical feature slices. Their routes are present so navigation and deep-link architecture can be verified, but they expose honest blueprints rather than fake data or premature CRUD.
