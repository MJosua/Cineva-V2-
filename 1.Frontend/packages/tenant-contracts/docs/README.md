# @hots/tenant-contracts 0.1.0-cineva.1

New local Cineva package, no upstream snapshot/version claimed. Universal runtime, no React/Node-only/DB dependencies. Canonical source physically lives in the frontend workspace; backend consumes the same CJS implementation, never React. Import uses an ESM facade; require uses CJS. No duplicated backend validation engine.

Tenant is program (`hots`, `overseas`, `cineva`), company is a business organization. Context version 1 requires positive numeric company ID, string canonical user ID and membership version. Company 0/implicit company 1 are rejected. `normalizeContext` validates shape, **not authentication**. Only tenant-server issues verified contexts.

Exports: `normalizeContext`, collision-safe `contextKey`, `assertOwner`, `validateBrand`, `TenantError`, validators. Brand config uses HSL semantic tokens matching HOTS CSS. Logo asset metadata must match program/company/asset ID and use HTTPS PNG/JPEG/WebP; backend ownership resolver remains mandatory. SVG is intentionally unsupported until a sanitizing storage adapter exists.

Run `node --test test/*.test.cjs`. Initial release: context/brand validation, dual module compatibility, no persistence or SQL changes. See `3.Knowledge/architecture/tenant_foundation_2026_10_21.md`.
