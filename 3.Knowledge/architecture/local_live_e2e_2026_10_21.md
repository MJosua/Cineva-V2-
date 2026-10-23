# E2E lokal nyata: HOTS, Overseas, Integrated-API

21 Oktober 2026, Asia/Jakarta. User supplied running URLs and authorized dummy login for Yosua, then Marcel. Browser interactions used CUA against actual pages; separate real HTTP API probes used credentials only in memory. No fixture/API interception, Kantor source edit, restart, deployment or grant change. Normal authentication changes login/session metadata; this is not a database-write-free run. No ticket create/edit/approve/payment, file export, or business mutation was performed.

Targets: HOTS http://localhost:8080/hots/, Overseas http://localhost:8084/overseas/, PAR remote 8085, backend http://localhost:9999. Origins confirmed from current frontend config. Kantor source layout has evolved to app/http/registerRoutes.js and programs/hots/core/auth; older paths in prior audits must not be assumed current.

Evidence: ../reports/local_live_e2e_2026_10_21/summary.json, api.json (Yosua), api.marcel.sarsito.json, oidc-metadata.json and screenshots. API probes do not save credentials, cookies, bearer tokens, entire login payloads or PAR form data. JWT claim decoding is observational only, never signature verification or an access grant. Re-run API probes via api-probe.mjs runProbe with credentials supplied transiently; do not embed them in scripts/env/report files.

Excel: [Local Live E2E](../reports/local_live_e2e_2026_10_21/outputs/Local_Live_E2E.xlsx), rendered and visually inspected. Summary contains 12 PASS, 2 FAIL (two scenarios of one dashboard defect), 3 GAP and 2 NOT_TESTED. The final foreign-ticket browser check was repeated after reauthentication: denial remained visible without the session-expired overlay. Overseas was logged out and all agent-created test tabs were closed; user app servers were left running.

## Verified behavior

- Yosua (user 1004, role 4) logs into HOTS; My Tickets shows 130. Overseas IndoUSA portal/PAR loads real data (47). Login to IndoCanada succeeds and All PAR shows 0.
- Actual tokens contain login_company_id=2/country=704 for IndoUSA, and company=3/country=716 for Canada. Keep-login preserves both. Default PAR list follows signed login context. Admin explicit company override remains possible and is not reported as a vulnerability.
- Marcel (user 1033, role 2) is denied IndoUSA login with the business message 'bukan negara area akun tersebut', but is allowed IndoCanada. No role/grant was changed to make the tests pass.
- Marcel's Canada token returns an empty PAR list for both its own company and manipulated company_id=2. Reading the observed USA ticket form-data endpoint returns 403, and the browser shows 'You are not allowed to view this PAR ticket'. This tests the selected ticket/country pair, not every resource type/company combination.
- Anonymous PAR ticket request returns 401. Overseas logout redirects to login; both same-origin Overseas tabs synchronize the logout. HOTS remained authenticated after Overseas logout/reload in the earlier controlled browser step. Subsequent independent API logins caused reauthentication prompts; these prompts are not independently attributed to the company-isolation feature.

## F01: dashboard aggregate crosses company authorization (high priority)

Same Marcel Canada token:

| Request | Response |
|---|---|
| GET /engine/par-document/tickets?company_id=2&page=1&limit=20 | HTTP 200, 0 rows |
| GET /engine/par-document/tickets/2610813000047/form-data | HTTP 403 |
| GET /engine/par-document/dashboard-summary?company_id=3 | HTTP 200, total 0 |
| GET /engine/par-document/dashboard-summary?company_id=2 | HTTP 200, total 47 |
| GET /engine/par-document/dashboard-summary | HTTP 200, total 47 |

Read-only MCP confirms all 47 existing service-108 tickets belong to company 2 at this snapshot. No company-3 ticket exists in that aggregate. UI shows Canada / Marcel while the dashboard shows 47 PAR. This is confirmed unauthorized aggregate visibility for the tested account; it does not establish full foreign ticket/form access, which was denied.

Cause traced in current read-only Kantor source:
- Frontend 1.Frontend/overseas_module/par/src/ParModule.tsx:226 sends date filters but no active company_id for dashboard-summary.
- Backend app/modules/par-document/parDocument.controller.js:353 passes userId and optional query company, not the same signed login scope used by ticket listing.
- Backend app/modules/par-document/parDocument.service.parts/reporting/get-par-dashboard-summary.js:16 accepts userId but builds the SQL scope from service_id and unvalidated optional companyId; the observed function does not apply actor visibility/ownership rules to the aggregate.

Architectural fix proposal, not applied here: reuse a modular PAR visibility-scope builder for list/count/dashboard, validating actor permissions and selected company on the server. The frontend must send/select its active company for UI consistency, but adding only that parameter does not prevent a caller requesting another company or omitting the filter. Include direct manipulated-request regression tests and read-only non-admin browser acceptance. Do not broaden roles or create blanket grants as a workaround.

## Remaining SaaS integration gaps

- New GET /api/tenant/v1/bootstrap returns 404 on the actual local backend. The tenant foundation implemented in Cineva has not been adopted by the running Kantor app. Successful legacy login is not proof that the new hierarchy grants or ticket-ownership overlay enforce these endpoints.
- Local OIDC discovery works: issuer http://localhost:9999/oauth, authorization/token/JWKS endpoints and S256 metadata are real JSON. HOTS .env/.env.development explicitly set VITE_SSO_ENFORCED=false; Overseas signs in via /hots_auth/login. Complete browser Code/PKCE/client delegation/global logout was not tested. Do not confuse the working local provider with the older production-process inspection.
- Overseas uses shared localStorage overseas_session and a storage listener in src/App.tsx:70-73. Two same-origin tabs follow one shared session/context; tab 2 logout routes tab 1 to login. This is a gap for independent per-tab company workspaces, not evidence of a foreign-row leak by itself.
- Company selector is a static list in overseas_base/src/data/demoData.ts, currently IndoUSA and IndoCanada. The new company hierarchy/IndoVietnam and program registry are not its data source.

## Outcome and next work

Real local integration can be tested and core login/list/detail paths work. SaaS signoff is blocked by the confirmed dashboard isolation defect and missing foundation adoption; the summary also records SSO/per-tab gaps and untested write workflows. No fixes were applied to Kantor because it remains a read-only source reference from this workspace. The next implementation should occur in the owning HOTS project with a bounded shared scope fix, followed by rerunning these actual-account scenarios. Reports/Excel and all one-off scripts stay in Cineva knowledge.
