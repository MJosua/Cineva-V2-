# 001 — Tailwind + shadcn as the standard styling

- **Date:** 2026-10-05 · **Status:** accepted

## Context
HOTS uses Tailwind + shadcn (~65 files). form uses plain CSS, Event uses `theme.js`. Chakra UI was considered.

## Decision
Tailwind is the primary styling system; components come from `@hots/ui-kit` (shadcn/Radix). No second theme system (e.g. Chakra) alongside it.

## Consequences
One token source (`tokens.css` + preset). form/Event adopt the preset when they migrate.
