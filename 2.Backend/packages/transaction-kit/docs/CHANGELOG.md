# Changelog — @hots/transaction-kit

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]

## [0.2.0] - 2026-10-06
### Added
- `toProblemDetails(err, { instance, traceId })` and `sendProblem(res, err, opts)` — RFC 9457 responses (`application/problem+json`, HOTS `code`, `errors[]`, `trace_id`, legacy `success/message`); unknown errors return 500 without leaking internals.
### Changed
- All MySQL repos validate table identifiers (`assertIdentifier`); justified `eslint-disable no-restricted-syntax` headers for identifier interpolation.

## [0.1.0] - 2026-10-06
### Added
- Initial version (see README for sources and verification).
