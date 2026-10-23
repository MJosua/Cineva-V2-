# Changelog — @hots/table-engine

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]

## [0.2.0-cineva.2] - 2026-10-18
- Cineva-local refactor: extract column ordering/persistence, row selection and grouping hooks from `useTableEngine`. Public props/context remain compatible.
- Enforce a 1000-line maximum for each table-engine source file through the Cineva workspace package test command. No upstream HOTS changes.

## [0.2.0] - 2026-10-06
### Changed
- Internal structure only: the 2488-line monolith is split into a head (`src/ReusableTableEngine.tsx`) + `state/`, `parts/`, `cells/`, `controls/`, `types.ts`. Every file ≤ 1000 lines (largest 816). Public API and rendering unchanged.
### Added
- `useTableEngine` and `TableEngineCtx` exported for advanced composition.

## [0.1.0] - 2026-10-05
### Added
- Initial extraction as a reusable package (see README for source and differences from HOTS).
