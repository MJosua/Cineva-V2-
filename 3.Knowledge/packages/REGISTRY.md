# Cineva shared package registry

Source: HOTS Kantor snapshots captured 2026-10-14; source reference is read-only. Local copies are the only runtime dependency. The frontend uses one npm workspace/lockfile.

| Package | Upstream | Cineva version | Local path | Adoption |
|---|---|---|---|---|
| @hots/content-kit | New local universal module, no HOTS upstream release | 0.1.0-cineva.1 | 1.Frontend/packages/content-kit | FE studio and BE service share contracts/8 templates/renderer/metrics; browser exports and backend raster verified; provider/production acceptance pending |
| @hots/tenant-contracts | New local package, no upstream fork | 0.1.0-cineva.1 | 1.Frontend/packages/tenant-contracts | Canonical universal contract consumed by client/server; context/brand/asset negative tests |
| @hots/tenant-client | New local package | 0.1.0-cineva.1 | 1.Frontend/packages/tenant-client | Workspace route, scoped transport, invite acceptance and React brand provider; synthetic browser acceptance |
| @hots/tenant-server | New local package | 0.1.0-cineva.1 | 2.Backend/packages/tenant-server | Program registry, hierarchy membership, real MySQL stores/ticket read pilot, BFF/SSO/transaction adapters; 4 additive DB tables applied; production runtime/issuer not activated |
| @hots/domain-kit | 0.1.0, promoted with user authorization 2026-10-19 | 0.1.0-cineva.2 | 1.Frontend/packages/domain-kit | Offline relations/attributes/rules/commands consumed; source/test parity with new Kantor package; server adapters pending |
| @hots/scheduling-kit | 0.1.0, promoted with user authorization 2026-10-19 | 0.1.0-cineva.2 | 1.Frontend/packages/scheduling-kit | Cineva crew/gear adapter consumed; source/test parity with Kantor; full calendar and server reservation pending |
| @hots/dynamic-form | 0.1.0 | 0.1.0-cineva.2 | 1.Frontend/dynamic-form | Consumed; shared whitelist fix, legacy round-trip |
| @hots/service-form-runtime | 0.1.0 | 0.1.0 | 1.Frontend/service-form-runtime | Preview normalization; full submit runtime pending |
| @hots/app-core | 0.6.0 | 0.6.0-cineva.1 | 1.Frontend/packages/app-core | Notification client/subscriptions consumed; explicit user-authorized upstream frontend package upgrade, exact-origin HTTP fix retained |
| @hots/calc-kit | 0.5.1 | 0.5.1 | 1.Frontend/packages/calc-kit | Available, not consumed |
| @hots/engine-client | 0.2.1 reference metadata checked 2026-10-22 | 0.2.0-cineva.2 | 1.Frontend/packages/engine-client | Existing trigger contracts retained; additive content client with scoped transport and stale-context rejection |
| @hots/eslint-config | 0.1.0 | 0.1.0 | 1.Frontend/packages/eslint-config | Scoped tooling rules |
| @hots/geo-kit | 0.1.0 | 0.1.0 | 1.Frontend/packages/geo-kit | Available, not consumed |
| @hots/import-kit | 0.1.0 | 0.1.0 | 1.Frontend/packages/import-kit | Available, not consumed |
| @hots/page-engine | 0.1.0 | 0.1.0 | 1.Frontend/packages/page-engine | Available, not consumed |
| @hots/table-engine | 0.2.0 | 0.2.0-cineva.2 | 1.Frontend/packages/table-engine | Consumed through host/adapters |
| @hots/tracking-kit | 0.1.0 | 0.1.0 | 1.Frontend/packages/tracking-kit | Available, not consumed |
| @hots/ui-kit | 0.2.0 | 0.2.0-cineva.1 | 1.Frontend/packages/ui-kit | Consumed through host/adapters |
| @hots/workflow-policy-kit | 0.2.0 | 0.2.0 | 1.Frontend/packages/workflow-policy-kit | Available, not consumed |
| @hots/transaction-kit | 0.2.0 | 0.2.0 | 2.Backend/packages/transaction-kit | Used by tenant UoW and opt-in content virtual snapshot adapter; kernel reused without modification. Content DB writes/production activation untested |
| @hots/notification-kit | Local extraction; no Kantor backend changes | 0.1.0-cineva.1 | 2.Backend/packages/notification-kit | Legacy SSE writer consumed; scoped repository engine tested with dummy adapters, physical DB deferred |

Detailed compatibility/gaps: [integration](../architecture/reusable_packages_2026_10_14.md) and [HOTS reference notes](../architecture/hots_reference_followups_2026_10_14.md). Versions come from actual local package.json metadata. Runtime and tooling adoption are counted separately from availability.

## Tenant adoption boundary

User decision 2026-10-21: isolation must live in frontend/backend packages. The three local packages above now implement the foundation; they have no upstream release/publication claim. See [implementation](../architecture/tenant_foundation_2026_10_21.md). app-core HTTP and transaction-kit are reused. Legacy business consumers, real session/invitation persistence, provider activation and production acceptance remain pending; package presence is not full SaaS readiness.

