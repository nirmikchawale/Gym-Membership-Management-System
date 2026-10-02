# Phase 4D — Operational Dashboard & Reporting

## Scope

This phase replaces future-state dashboard surfaces with summaries derived only from persisted Gridstone operational data.

Included sources:

- members;
- membership plans;
- memberships and renewal lineage;
- attendance visits.

Explicitly excluded:

- payments;
- receipts;
- revenue metrics;
- payment-provider integrations.

## Delivered behavior

- authenticated `/api/v1/dashboard` aggregate endpoint;
- active/inactive member counts;
- scheduled/active/frozen/expired/cancelled membership counts;
- renewal count from renewal lineage;
- open visits and current-day check-ins;
- bounded 7/14/30-day attendance trend windows;
- bounded 30/60/90-day membership expiry queues;
- live membership distribution by plan;
- operational dashboard at `/`;
- reporting controls at `/reports`;
- synthetic public-preview parity without introducing fake revenue data;
- loading, empty and error states;
- responsive layouts using the existing Gridstone design system;
- aggregate reconciliation tests and range validation.

## Verification contract

Phase 4D is not complete until the exact pull-request head passes frontend, backend, security and container CI, is merged, and the exact resulting `main` SHA passes CI again.
