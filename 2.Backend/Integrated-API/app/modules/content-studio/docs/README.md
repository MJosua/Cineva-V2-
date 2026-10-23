# Cineva Content Studio 0.1.0-cineva.1

Additive, opt-in Integrated-API module. Shared content-kit contracts and renderer, existing transaction-kit, tenant authorization and app-core/engine-client are reused. HOTS Kantor remains unchanged.

## Entrypoints

- `/api/content/v1`: workspace, typed commands, generate, render, analytics/sync/AI, account OAuth and reconciliation. Contract: `../openapi.json`.
- `runtime.mjs`: explicit persistent composition. No automatic demo identity, database connection, table creation or cron.
- `bootstrap.js`: `CONTENT_STUDIO_ENABLED=1` plus `CONTENT_RUNTIME_FACTORY` filename inside backend `config/` opt into a deployment-owned factory exporting `createRuntime({pool,logger})`. Default startup leaves API disabled with 503.
- `worker-entry.mjs`: optional independent process; same explicit enabled flag and factory. It starts only the content runner, never legacy repair/cron scripts. Backend working directory and env are mandatory.
- `release.mjs`: public exports for isolated CJS bundle; knowledge release script creates a self-contained code artifact using Node builtins only. Browser/Puppeteer, MySQL pool, auth, provider credentials and fonts remain injected infrastructure, not embedded in bundle.

## Composition contract

Supply MySQL store, verified authorize(req,permission), exact Origin/CSRF assertMutation, authorizeJob(scope,actor,target), entitlements(principal), workflow.review(doc,input,actor,transaction), credential resolver and assets.prepare. Use `tenantContentAuthorization` with active Cineva tenant engine; do not supply request-body roles/scopes. Personal scopes require a separately verified principal adapter, not company zero.

For workflow binding, execute the existing host's Form/Workflow/Trigger operations on `transaction.connection` when used. The shared reviewDocument policy is used by preview/tests; it does not activate or replace an existing live ticket workflow. Optional relations.canLink verifies campaign/assignment/deliverable references before attachment. EAV ticket writes remain the existing engine's responsibility.

OAuth connections require deployment-reviewed endpoints/scopes, registered HTTPS callback and a provider-specific verified account resolver. The generic OAuth adapter supplies code exchange and optional PKCE; Page/Professional account eligibility is never inferred from a handle. OAuth state is single-use in scoped persistent snapshot, PKCE private data and provider credentials are encrypted with AES-GCM and scope AAD. Keep 32-byte vault/signing keys in server secret storage. Refresh policy is supplied by the credential resolver, using OAuth refresh adapter if the provider supports it. Secrets are not returned to UI or logs.

Use `createVirtualMedia` for provider asset URLs. It signs expiring scope/target/revision capabilities, rejects revoked accounts and streams rasterized PNG from frozen JSON. `createPuppeteerRasterizer` requires a managed browser, fonts and bounded deployment concurrency. Do not persist generated HTML/PDF files. Provider keys never appear in asset URLs.

## Persistence and concurrency

Physical `t_document` columns and composite entity_type/entity_id index were verified read-only on 22 October 2026 and recorded in Cineva knowledge. `createMysqlDocumentStore` uses entity_type `cineva_content_workspace`, hash-derived entity_id, virtual JSON snapshot, GET_LOCK held across transaction-kit begin/commit/rollback, duplicate-row rejection, and connection release after lock. It does not create tables or alter schema.

This is a bounded pilot aggregate: 6 MB snapshot, 100 documents, 500 publish targets, 2,000 idempotency receipts, 200 recent audit entries. Scope enumeration is paginated <=100; dedicated due-job indexes and independent retention tables are a future scale migration. Never silently truncate immutable document/operation history or bypass the cap. Runtime registration must not accidentally connect this module to the read-only HOTS reference database from Cineva.

Worker claims per-target leases under short transactions, performs network calls outside transaction, heartbeats, rechecks access/account/revision/lease before sending, and records checkpoints/results in new transactions. Ambiguous results are unknown, never blindly resent. Ready Instagram containers can be reconciled and resumed without recreating the container. Acknowledgement lost after external success may still require manual reconciliation; there is no exactly-once distributed-transaction guarantee. Revocation racing an already accepted provider call cannot undo a live post. Partial multi-provider success remains partial.

## Quota and analytics

AI generation/AI insights reserve quota before inference; success settles once, validation failure releases, fenced deadlines allow recovery after process failure. Render export charged once per idempotency key. Publish quota counts accepted target intents, including eventual failed/cancelled targets, not delivered posts; cancellation does not implicitly refund. These are content units, not payment or creator payout balances. No subscription payment checkout was added.

Metrics use latest lifetime snapshot per target and publication-date filters. Missing metrics remain null. ER requires all five interaction metrics and views; no unsupported metric becomes zero. Account followers are not attributed to individual posts. AI insight validates evidence IDs/sample and schema, which is not proof of semantic entailment. UI labels deterministic summary separately; inference requires an explicit model.

## Provider boundaries

Graph API version/scopes/metric names and Story capability are explicit configuration and must be verified for each app/account. Story currently supports one portrait slide. TikTok requires verified media domain, creator-info privacy options, explicit user consent, and configurable brand-content disclosures. Recommended music uses auto_add_music, not arbitrary trending-audio selection or a reach guarantee. Production visibility/app review is external acceptance.

## Validation and runbook

From Cineva root: `npm.cmd run test:content-studio`, `npm.cmd run test:content-studio:browser`, `npm.cmd run test:content-studio:server-browser`, `npm.cmd run build:frontend`. Browser scripts use explicit local origins and synthetic accounts. `npm.cmd run release:content-studio` emits the independent server code bundle.

Preview: `/hots/cineva-preview.html#/hq/studio` and `#/creator/studio` are localStorage-only, labeled simulations. Live UI is under `/hots/platform/workspaces` after authorized Cineva company selection. Do not switch the preview to server mode implicitly. Production requires real tenant/SSO/session wiring, reviewed configuration, controlled MySQL write acceptance, actual model/provider tests and separate deployment. No production activation is performed by tests or package install.
