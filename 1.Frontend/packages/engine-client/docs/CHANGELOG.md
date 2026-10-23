# Changelog — @hots/engine-client

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]

## [0.2.0-cineva.2] - 2026-10-22

- Add optional `createContentClient` with injected app-core transport, workspace header, stale-context rejection, generation/render/publishing/analytics/OAuth methods. Existing `createEngineClient` factory and defaults unchanged. Local Cineva fork only.

## [0.2.0-cineva.1] - 2026-10-18

- Canonical trigger filters and typed category/count response; deprecated type alias retained with canonical precedence.
- Normalize boolean active filters to legacy controller strings; preserve query input immutability.
- Document injected transport ownership; Cineva hook removes double category casts.

## [0.2.0] - 2026-10-06
### Added
- `EngineApiError.traceId` and `.errors` (field errors) from RFC 9457 Problem Details or `X-Request-Id`.
### Changed
- Error parsing accepts both legacy `{ error: { code, message } }` and Problem Details `{ code, detail, title, details, trace_id }`.

## [0.1.0] - 2026-10-06
### Added
- Initial collection (see README for sources).
