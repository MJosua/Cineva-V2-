import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../../..'),base=path.join(root,'3.Knowledge/reports/local_live_e2e_2026_10_21');
const read=async name=>JSON.parse(await fs.readFile(path.join(base,name),'utf8'));
const [admin,restricted,oidc]=await Promise.all(['api.json','api.marcel.sarsito.json','oidc-metadata.json'].map(read));
const usa=admin.companies.find(c=>c.company==='indousa'),canada=admin.companies.find(c=>c.company==='indocanada'),marcel=restricted.companies.find(c=>c.company==='indocanada');
assert.equal(usa.reads[0].total,47);assert.equal(canada.reads[0].total,0);assert.equal(marcel.foreignDetail.status,403);assert.equal(marcel.reads[2].rowCount,0);
assert.equal(marcel.otherCompanyDashboard.metrics.all_time_total,47);assert.equal(marcel.unscopedDashboard.metrics.all_time_total,47);assert.equal(marcel.dashboard.counts.all_time_total,0);
const cases=[
 ['HOTS login Yosua','PASS','Browser: identity Yosua Gultom; My Tickets has 130 tickets.'],
 ['Overseas Yosua IndoUSA','PASS','Browser: IndoUSA portal + 47 PAR. API signed login company=2.'],
 ['Overseas Yosua IndoCanada','PASS','Browser: Canada portal + All PAR empty. API signed login company=3; total=0.'],
 ['Marcel IndoUSA login','PASS','Browser and real API reject: bukan negara area akun tersebut. No grant changed.'],
 ['Marcel IndoCanada login','PASS','Browser identity Marcel Sarsito, active Canada. Actual user=1033, role=2.'],
 ['Anonymous PAR API','PASS','Unauthenticated tickets endpoint returns 401.'],
 ['Keep-login context preservation','PASS','API refresh preserves company/country for both admin scopes.'],
 ['Marcel foreign-company list filter','PASS','company_id=2 with Canada token yields 0 rows; no USA ticket payload.'],
 ['Marcel foreign-ticket detail','PASS','Known USA ticket form-data returns 403. Browser displays denial.'],
 ['Marcel own-company dashboard API','PASS','Explicit company_id=3 returns total 0.'],
 ['Marcel foreign/unscoped dashboard','FAIL','Same Canada token can read aggregate 47 USA PAR with company_id=2 or no company filter.'],
 ['Canada dashboard context in browser','FAIL','Header says Canada / Marcel while dashboard shows 47 PAR belonging to company 2.'],
 ['HOTS session after Overseas logout','PASS','HOTS My Tickets still authenticated after Overseas logout/reload, before separate API-login probes.'],
 ['Overseas tab-local company context','GAP','Two Overseas tabs synchronize overseas_session. Logging out tab 2 also routes tab 1 to login; no independent company context.'],
 ['New tenant foundation runtime','GAP','Real Integrated-API /api/tenant/v1/bootstrap returns 404; Cineva foundation not adopted by running Kantor backend.'],
 ['Local OIDC discovery','PASS',`Actual JSON metadata: ${oidc.issuer}; PKCE S256 advertised. This is not full sign-in proof.`],
 ['Portal SSO adoption','GAP','HOTS env and development env VITE_SSO_ENFORCED=false; Overseas LoginPage posts /hots_auth/login directly.'],
 ['Complete Code/PKCE browser flow','NOT_TESTED','No feature flags changed. Local provider reachability alone is not E2E SSO.'],
 ['Write/approval/payment workflows','NOT_TESTED','Read/auth tests only; no ticket create/edit/approval/payment or grant mutation.'],
];
const counts=Object.fromEntries(['PASS','FAIL','GAP','NOT_TESTED'].map(status=>[status,cases.filter(c=>c[1]===status).length]));
await fs.writeFile(path.join(base,'summary.json'),JSON.stringify({date:'2026-10-21',timezone:'Asia/Jakarta',frontend:['http://localhost:8080/hots/','http://localhost:8084/overseas/'],backend:admin.apiBase,browser:'CUA in-app browser, real UI, no interception',accounts:['yosua.gultom','marcel.sarsito'],counts,cases,sourceChangesInKantor:0,businessMutations:0,authSideEffects:'Normal login/refresh/logout metadata and sessions; not claimed database-write-free.',credentialsPersisted:false,boundary:'These results concern current running Kantor applications, not the separate synthetic Cineva foundation tests.'},null,2));
process.stdout.write('[LOCAL-E2E][INFO] : '+JSON.stringify(counts)+'\n');
