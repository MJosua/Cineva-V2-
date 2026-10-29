---
category: architecture
status: active
superseded_by: null
tags: [packages, promotion, scheduling, content, tenant]
relates_to: [architecture/package_promotion_2026_10_19.md, architecture/content_studio_implementation_2026_10_22.md, packages/REGISTRY.md]
---

# Existing Cineva capabilities promoted to Kantor — 29 October 2026

User explicitly authorized upgrading Kantor packages with existing Cineva capabilities and committing only related changes. This is a scoped exception to the default Kantor read-only rule. It does not authorize changes to Kantor program/backend/DB/deploy or global index writers. All source packages in Cineva retain their current fork versions and workspace lockfile.

## Architecture and release

Pure universal content contracts/rendering remain in content-kit; scoped workspace/brand adaptation remains in tenant-client; optional content API transport remains in engine-client. Host auth, server transaction/rollback, EAV mappings, marketing workflows, provider credentials and persistence are not transferred or activated.

| Package | Kantor change | Cineva source |
|---|---|---|
| @hots/content-kit | New 0.1.0 | 0.1.0-cineva.1 source/tests |
| @hots/tenant-client | New 0.1.0 | 0.1.0-cineva.1 source/tests; uses existing Kantor tenant-contracts |
| @hots/engine-client | 0.2.1 → 0.3.0 | Only optional src/content.ts and named export; upstream trigger types/fixes and old factory unchanged |
| @hots/scheduling-kit | Already 0.1.0; unchanged | Source matches Cineva 0.1.0-cineva.2 |
| @hots/domain-kit | Already 0.1.0; unchanged | Source matches Cineva 0.1.0-cineva.2 |

Kantor app-core, ui-kit, table-engine and in-progress page-engine are ahead of the Cineva snapshots in some capabilities. Preserve their code instead of overwriting with older snapshots. A 25-file hash baseline protects pre-existing changes, including page-engine work. Git commit staging is restricted to the two new package directories, engine-client's four changed/new files, package README and package-local release note.

## Correct calendar inventory

Resource overlap/capacity detection is already reusable in scheduling-kit. Cineva Content Studio week/month/list and reschedule are application UI, not exported generic calendar widgets. Recurrence, generic drag/reschedule, durable reservation locking, page persistence/publish and generic named theme families are not delivered by this promotion. TenantBrand is an existing configurable semantic-token adapter, not the named theme catalogue.

Backend notification-kit and tenant-server adapters are not part of this frontend package commit. They require separate backend ownership, repository and dependency review. No new implementation is claimed for these packages.

## Verification

`node 3.Knowledge/scripts/package_promotion_2026_10_29/check.mjs` runs actual Kantor tests and isolated content/trigger client checks. 67 tests pass: 8 content, 7 tenant-client, 6 tenant-contracts, 16 scheduling, 16 domain, 9 table row actions, 5 content/legacy-trigger contracts. Source SHA256 parity holds for all promoted source files; protected file hashes remain unchanged. Typecheck results are recorded separately in the same report directory.

No runtime app migration, browser acceptance of a new consumer, production build/deploy, DB writes, real SSO or social-provider integration is certified. No schema/SQL or calculation-engine changes. No superseded source is removed.

Evidence: `3.Knowledge/reports/package_promotion_2026_10_29/{provenance,validation,protected-baseline}.json` and test/typecheck logs. Excel: `outputs/package_promotion_2026_10_29/HOTS_Package_Upgrade_Report.xlsx`. Kantor package-local release inventory: `D:/Kantor/1.Frontend/packages/docs/CINEVA_PROMOTION_2026_10_29.md`.

Kantor package commit: `a9a780a2e74f07d60b6fa32fa49b27ccf3c1a540`. Strict promoted-API typecheck: zero diagnostics using the existing host React/Axios declaration dependencies. Existing engine factory byte-equivalence (excluding the additive export) and all protected file hashes verified after commit.
