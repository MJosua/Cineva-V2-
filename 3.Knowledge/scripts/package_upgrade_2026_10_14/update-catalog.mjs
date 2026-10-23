import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..');
const integration=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'integration.json'),'utf8'));
const configFile=path.join(root,'3.Knowledge/tools/index.config.json'),config=JSON.parse(await fs.readFile(configFile,'utf8'));
config.apps=config.apps.filter(a=>['cineva-frontend','cineva-backend'].includes(a.key));
for(const p of integration.catalog)config.apps.push({key:p.name,root:p.path,sourceRoots:[p.name==='@hots/eslint-config'?'index.js':'src'],kind:p.path.startsWith('2.')?'backend-package':'frontend-package'});
config.includeAppDocs=true;
if(!config.excludedDirectories.includes('package_upgrade_2026_10_14'))config.excludedDirectories.push('package_upgrade_2026_10_14');
await fs.writeFile(configFile,JSON.stringify(config,null,2)+'\n');
const folder=path.join(root,'3.Knowledge/packages');await fs.mkdir(folder,{recursive:true});
const lines=['# Cineva shared package registry','', 'Source: HOTS Kantor snapshots captured 2026-10-14; source reference is read-only. Local copies are the only runtime dependency. The frontend uses one npm workspace/lockfile.', '', '| Package | Upstream | Cineva version | Local path | Adoption |','|---|---|---|---|---|'];
for(const p of integration.catalog){const status=p.name==='@hots/transaction-kit'?'Catalog only; backend prerequisites pending':integration.consumed.includes(p.name)?(p.name==='@hots/eslint-config'?'Scoped tooling rules':p.name==='@hots/service-form-runtime'?'Preview normalization; full submit runtime pending':'Consumed through host/adapters'):'Available, not consumed';lines.push(`| ${p.name} | ${p.upstream} | ${p.localVersion} | ${p.path} | ${status} |`);}
lines.push('','Detailed compatibility/gaps: [integration](../architecture/reusable_packages_2026_10_14.md) and [HOTS reference notes](../architecture/hots_reference_followups_2026_10_14.md). Versions come from actual local package.json metadata. Runtime and tooling adoption are counted separately from availability.');
await fs.writeFile(path.join(folder,'REGISTRY.md'),lines.join('\n')+'\n');
await fs.writeFile(path.join(folder,'COMPATIBILITY.md'),'# Cineva compatibility boundary\n\n- UI: 53 import adapters retain old named/default exports; implementation lives in ui-kit.\n- Forms: shared builder/readonly preview, stable JSON IDs and unknown fields retained; primary domain submit runtime remains legacy.\n- Reports: shared renderer, host-controlled full-loaded-dataset query/pagination; legacy EAV/custom endpoint bodies and PDF/XLSX behavior retained.\n- Workflow: raw shared body wrapped as `{ data }` for existing pages.\n- Trigger: backend `function_type` and object category/count contract retained through adapters.\n- Preferences: shared client with old app cache/lifecycle.\n- Auth: app-owned Bearer transport injected into shared Provider; cookie-only shared factory is not adopted blindly.\n- Backend: transaction-kit snapshot only, no runtime wiring or schema changes.\n\nDetailed unresolved work and evidence: [integration](../architecture/reusable_packages_2026_10_14.md).\n');
console.log('[PACKAGE-CATALOG][INFO] : Local package registry and index scopes updated.');
