# SaaS pilot: database additive, hierarchy and HOTS ticket isolation

21 Oktober 2026. Supersedes the read-only database boundary in the earlier foundation note for this explicitly authorized phase only. HOTS source/packages/Git/deploy outputs in D:/Kantor remain read-only. User authorized adding to HOTS database, then explicitly authorized scripts using existing connection configuration. No existing business rows were changed/deleted.

## Confirmed business decisions

- Tenant = program, company = business organization. HOTS Normal uses program 103 / existing client hots-web; portal origin https://www.indofoodinternational.com.
- Overseas is a separate program. Added program 108, shortname hots-overseas, with SSO disabled and no client secret/client registration. This does not enable the current Overseas application.
- User selected yosua.gultom or kevin.sietho. Pilot uses Kevin, user 1150, active global role 2. Yosua is active user 1004 / global role 4, but receives no implicit new grant.
- Kevin is Excom with Indofood root scope and its subsidiaries, separately in HOTS and Overseas. User explicitly confirmed IndoVietnam as well. Stored relationships: company 1 -> 2 (IndoUSA), 1 -> 3 (IndoCanada), 1 -> 4 (IndoVietnam).
- Added two explicit read grants for Kevin, programs 103 and 108, root 1, include_descendants=true, role_key=excom, permissions brand.read/resources.read. No write/admin wildcard or automatic Cineva access. New children must have an explicit hierarchy relationship before inheritance applies.
- Cineva remains personal Client self-registration, active immediately, company/campaign by invitation. No Cineva program ID or account has been created in this phase.

## Physical database changes, applied and verified

Reference base: ../schema/hots_saas_baseline_2026_10_21.json. Additions: ../schema/hots_saas_additions_2026_10_21.json, authoritative SHOW CREATE TABLE output from the actual target.

1. t_tenant_runtime_store: app/kind/hash scoped JSON persistence with absolute expiry and soft revoke/consume. Raw opaque keys are not stored. Login consume uses SELECT FOR UPDATE and transactional status change; collisions cannot resurrect a consumed key. No cleanup deletes are scheduled. Payload contains sensitive session/CSRF/login verifier material and must have restricted DB access; retention/encryption-at-rest policy remains operational work.
2. t_tenant_ticket_owner: one ticket has one program/company owner; FK to existing ticket/program/company, positive company CHECK, scope index. Empty for existing tickets; no inference/backfill from creator/service/company=0.
3. t_tenant_company_relation: explicit parent/child tree, FK references and self-edge CHECK. Engine rejects cycles/multiple parents; future relation-writing services must validate the graph transactionally. No generic writer/admin UI has been exposed.
4. t_tenant_company_grant: user/program/root relation, descendants flag, role label, explicit JSON permissions, active/version, unique identity and FKs.

Added DML: one program, three hierarchy edges, two grants. All seed DML uses beginTransaction/commit/rollback, validates pre-existing rows and never overwrites an unexpected row. No ticket, user, user_permission, legacy membership or SSO callback was edited. No DROP/DELETE operation. DDL implicitly commits in MySQL: executed separately after schema/target preflight and named lock; not claimed transactionally reversible. Migration refuses existing target names and requires schema comparison before a partial rerun. Disable new runtimes/grants for backout; retain tables/data.

Direct connection reads existing env through dotenv without application import or credential output. Database/server fingerprint must match MCP before any change. Scripts live only in ../scripts/tenant_foundation_2026_10_21. Initial check accidentally imported legacy SSE logger, which transitively imported config/db and started DB monitor handles; process stopped and script corrected to an SSE-compatible CLI envelope without application/SSE imports. The check did not execute DML or application startup. No claim that the initial import was side-effect-free.

## Modular implementation and limits

tenant-server now provides program registry, hash-scoped MySQL runtime store, explicit company hierarchy resolver + MySQL reader, and read-only ticket repository. Registry binds a program in server composition, never from body/header/forwarded host. Same portal origin is allowed only with distinct API mounts. HTTPS origin, program ID, permission namespace and mount uniqueness are validated.

createPersistentTenantRuntime composes real stores, app-specific __Host session/login cookies, CSRF, hierarchy memberships, context engine and optional ticket reads. Trusted issuer/config, signature verifier, active-user resolver, identity service, query and transaction adapters must be supplied; importing never opens a pool or applies migration. Existing membership mode remains available explicitly; no union or silent fallback from empty hierarchy grants to broad legacy access.

Pilot GET /api/tenant/v1/tickets and /tickets/:id returns a context envelope and requires resources.read. COUNT/page/detail join the ownership overlay and require overlay company=t_ticket.company_id. Cross-company, unmapped or mismatched tickets return no data. This does not replace the business authorization/workflow of legacy ticket routes. No ticket mutation, attachment/report/SSE isolation or campaign endpoint migration is claimed.

Frontend workspace adds a HOTS ticket list through tenant-client, clears display by exact context ID, and rejects late scope responses. New configuration fields actually read by frontend: VITE_TENANT_API_ORIGIN (defaults own origin), VITE_TENANT_API_PATH (defaults /api/tenant/v1), VITE_TENANT_CSRF_COOKIE (defaults cineva_csrf; HOTS pilot requires hots_csrf). No legacy bearer or SSE hook is used on the workspace route.

programs.pilot.json is a reviewed composition input, not auto-loaded by startup. HOTS mapping 103 is enabled in that file; Overseas 108 and Cineva remain disabled. Current application index still supplies no tenantRuntime, so new endpoints remain 503 until explicit deployment wiring. The stored grants do not change current production HOTS/Overseas behavior.

## Production inspection, read-only SSH

User pointed to backend SSH 105 and frontend SSH 104. SSH aliases hots-be/hots-fe authenticated without password prompts. Both use Windows command shells. Active backend Node script was found at D:/hehe/hehehe/hehehehe/hehe/[PRODUCTION] IOD-INTEGRATED_API v2.8.x/index.js. Its inspected root lacks app/modules/oidc/config.js, service/oidc/config.js, app/registerRoutes.js, and oidc-provider dependency; its .env has no inspected OIDC/SSO settings. PORT is 443. This is evidence about that active process root, not proof no other IdP exists anywhere.

PM2 dump under Administrator points at different older paths; treated as historical, not effective live config. PowerShell JSON parsing of this dump failed on username/USERNAME case collisions; bounded Node JSON parsing was used instead. Raw PM2 environment/credentials/private keys were never printed.

Frontend D:/nginx/conf/nginx.conf routes /hots and /overseas as static application paths and selected API prefixes to https://backend.indofoodinternational.com:2864. The inspected routing lines do not contain /api/tenant or /oauth. Backend D:/jinx/conf/nginx.conf is a separate observed proxy configuration; it is not assumed to be the only live listener configuration.

Public frontend-origin candidate https://www.indofoodinternational.com/oauth/.well-known/openid-configuration returned HTTP 200 but could not be parsed as OIDC metadata. Local reference env is not a usable HTTPS issuer. Correct live issuer, signature/JWKS resolver and callback registration remain unverified. No production source/config edit, file upload, service restart or deployment was performed.

## Validation and next activation gates

Latest machine evidence: ../reports/tenant_foundation_2026_10_21/checks.json (62 package/HTTP tests); browser.json (9 production-build scenarios with intercepted API); live-pilot.json (15 real MySQL checks). Live checks exercise Kevin's actual grant expansion in both programs, session/context/membership pipeline, own/cross-company tickets, unmapped/mismatched ownership, consume/revoke, and real transaction rollback. Synthetic tickets/session/context rows leave no committed residue. They do not authenticate Kevin through a live IdP.

Frontend build passes; feature/route TypeScript has no diagnostics, full app remains 113 diagnostics. Portable feature bundle load checked separately; not a full HOTS deployment artifact. Screenshot inspected for mobile HOTS ticket list. Current tests do not prove end-to-end production identity or legacy endpoint isolation.

Scoped frontend lint passes using the app-local ESLint 9.13.0 executable (node node_modules/eslint/bin/eslint.js from HOTS). The hoisted workspace executable is ESLint 10.12.0 and fails with scopeManager.addGlobals incompatibility; it is not used as proof of app lint success. No dependency versions were changed to address this. Output: scoped-lint.txt. Excel report: ../reports/tenant_foundation_2026_10_21/outputs/saas_pilot_activation_2026_10_21/SaaS_Pilot_Activation.xlsx; rendered/inspected successfully. Final MCP verification: runtime rows=0, ticket-owner rows=0, active root-1 child relationships=3, active Kevin grants=2.

Remaining activation order:
1. Identify/deploy the intended central HOTS OIDC provider alongside the current production API; do not replace the old API with the Cineva app. Validate HTTPS issuer, metadata/JWKS, existing credential compatibility and transaction-safe identity writes.
2. Add BFF callback registration to hots-web only after endpoint/secret verification, preserving existing callback URIs. Register a separate Overseas client before enabling its SSO.
3. Mount persistent runtime and scoped API; add frontend 104 proxy to a verified backend target, deploy HOTS workspace consumer with hots_csrf. Overseas needs its own API mount/callback/cookies even when portal origin is shared. Configuration changes need staging/smoke/backout before live cutover.
4. Review authoritative ticket-to-program/company mapping before any existing-ticket backfill. Child data/files/reports/SSE/workflow need the same ownership policy; no automatic grant from global role or company name.
5. Complete live login acceptance with Kevin without collecting credentials in chat. Yosua admin delegation/write powers, branding write/publish, Cineva account persistence, invitations, billing and operational recovery remain separate explicit implementation work.
