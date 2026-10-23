# Changelog

## 2026-10-14

- Integrated local reusable package snapshots and npm frontend workspace.
- Forwarded 53 generic UI entries to ui-kit, preserving named/default exports.
- Replaced unified visual builder and generic report table with shared engines plus domain/contract adapters.
- Shared workflow/trigger/preferences API clients and PDF viewer; preserved legacy Bearer and payload contracts.
- Added read-only reference notes, package provenance, gap inventory and verification reports in Cineva knowledge.
# 2026-10-19 — Local reusable domain and scheduling packages

Notification follow-up: app-core 0.6.0-cineva.1 inbox client and named event subscriptions now drive the existing notification bell through host adapters. Missing `window.__sseConnection` dependency removed. Upstream frontend package 0.6.0 updated with explicit user authorization; backend Kantor untouched. Cineva backend consumes local notification-kit writer. DB/auth migrations remain pending.

- Adopt `@hots/domain-kit@0.1.0-cineva.1` for portable document relations, attributes, cross-object cash rules and revision-checked edit commands through Cineva adapters.
- Adopt `@hots/scheduling-kit@0.1.0-cineva.1` for crew/gear conflict policy; vendor validation, first-conflict messages and EAV contract remain in Cineva.
- Synthetic acceptance: 44 generic/consumer tests and 38 browser scenarios, plus existing domain regressions. Production build passed; feature lint/type diagnostics zero, full-app existing baseline 101.
- HOTS Kantor and database remain untouched. Durable server adapters and remaining reusable-module backlog are pending.

# Content Studio — 2026-10-22

Added local HQ/Creator Content Studio and a separate tenant-scoped server consumer. Shared content-kit contracts, eight templates, photo/logo/brand kit, SVG/PNG ZIP exports, revision/QC, calendar, per-account targets and analytics. Existing marketplace/campaign/payout/booking flows remain. Server APIs are opt-in; default preview is explicitly simulated and not production publishing. See Cineva knowledge implementation report for validation and activation gates.

