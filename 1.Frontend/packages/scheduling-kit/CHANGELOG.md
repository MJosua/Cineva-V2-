# Changelog

## 0.3.0-cineva.1 — 2026-11-02

- Synced from Kantor `@hots/scheduling-kit` 0.3.0 (upstream additions: strict date helpers from 0.2.0, plus `workdays.ts`: `addWorkingDays`, `isWorkingDay`, `evaluateExtension`). Source and tests copied unchanged; no Cineva-only code added. The compiled `/runtime` subpath is not carried in this snapshot.

## 0.1.0-cineva.1 — 2026-10-19

- Added pure ES2020 interval overlap and collective resource availability policy with half-open boundaries, sweep-line capacity, hold expiry, cancellation, exclusion, blackout and buffer handling.
- Added strict date-only stay ordinal adapter with exclusive checkout and nights.
- Added structured generic issues and sixteen synthetic contract tests.
- Initial local additive capability; no upstream source copied and no HOTS Kantor changes. Availability only: no server persistence/concurrency guarantees.
