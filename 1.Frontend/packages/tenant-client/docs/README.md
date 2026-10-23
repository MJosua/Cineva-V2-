# @hots/tenant-client 0.1.0-cineva.1

New local Cineva package. Reuses `@hots/tenant-contracts` and the host's injected `@hots/app-core` HTTP/CSRF transport. No tokens in localStorage and no new HTTP engine. React entry provides TenantProvider/useActiveWorkspace/TenantBrand; core entry supports Node tests without React.

`createTenantClient({transport})`: bootstrap, selectCompany, request, acceptInvitation, brand, subscription disposal, clear/dispose. Each instance owns context/cache/generation, so two apps/tabs do not share mutable active company. Switch clears context, aborts requests, closes subscriptions and rejects late responses, including overlapping switch operations. Cached snapshots never skip server membership revalidation. API paths are fixed relative paths, preventing context headers being sent to arbitrary URLs. Transport must unwrap `{success,data}` and propagate HTTP status for revoke/expiry handling.

TenantBrand applies validated semantic tokens and restores previous inline values on switch/unmount. Asset URL is consumed from backend-resolved metadata. This does not isolate arbitrary same-origin scripts/MFEs from one another.

Initial consumer: Cineva `/platform/workspaces` (Vite base currently `/hots/`). Default API is same origin; explicit `VITE_TENANT_API_ORIGIN` may configure another trusted API origin. This route uses BFF bootstrap authorization, not the legacy localStorage auth gate. Existing Cineva product routes are not automatically migrated.

Run `node --test test/*.test.mjs`. Initial release: context lifecycle, invite acceptance, brand provider, scoped transport adapter contract. No live SSO or persistence asserted.
