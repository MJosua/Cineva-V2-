# Changelog — @hots/app-core

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]

## [0.6.0-cineva.1] - 2026-10-19
- Add parameterized notification inbox client and named SSE subscription/cleanup.
- Add `/notifications` and `/sse` source export subpaths; retain all root APIs.
- Carry upstream 0.5.1 exact-origin HTTP credential fix into this local snapshot.
- Same notification addon is present in authorized upstream app-core 0.6.0; Cineva legacy auth stays in its host adapter.

## [0.5.0] - 2026-10-06
### Added
- RFC 9457 Problem Details support: `ProblemDetails`, `isProblemDetails`, `toApiError(error)`; `ApiError` gains `status`, `traceId`, `type`, `details` (additive).
- `X-Request-Id` correlation header on every API request (`REQUEST_ID_HEADER`, `newRequestId`); rejected axios errors carry `error.apiError`.
### Changed
- `unwrap()` throws an ApiError with status/code when the body is a Problem Details object (legacy envelopes unchanged).

## [0.4.0] - 2026-10-06
### Added
- `resolveApiBase`, `getApiBase`, `isServerReady`, `pingEndpoint`, `findHealthyUrl` — endpoint failover collected from the three copies of `apiResolver` (E-Order, HOTS, Event). Candidates/ping path/timeout are parameters; still writes `window.__API_URL__`.

## [0.3.0] - 2026-10-06
### Added
- `floorCbm`, `formatCbm` (E-Order `formatCBMForDisplay` rule: floor to 1 decimal).
### Changed
- `ApiError` fields declared explicitly (no TS parameter properties) — same public shape.

## [0.2.0] - 2026-10-06
### Added
- `resolveMediaUrl`, `originFromApiBase` (from Event mediaHelper, origin/tempDir configurable)
- `downloadFile`, `saveBlob`, `fileNameFromDisposition` (cookie-auth blob download, replaces Event manual-token downloads)

## [0.1.0] - 2026-10-05
### Added
- Initial extraction as a reusable package (see README for source and differences from HOTS).
