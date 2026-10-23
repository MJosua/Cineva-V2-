import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..'),src=path.join(root,'1.Frontend/HOTS/src');
const snapshot=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'snapshot.json'),'utf8'));
const archived=[];
async function archive(rel){const file=path.join(src,rel),dest=path.join(root,'3.Knowledge/_archive/package_upgrade_2026_10_14',rel);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(file,dest,fs.constants.COPYFILE_EXCL);archived.push(rel);}
for(const c of snapshot.components.filter(c=>!c.status)){
 if(c.original.named.some(n=>!c.package.named.includes(n))||c.original.defaultExport!==c.package.defaultExport)throw new Error(`Export incompatibility: ${c.name}`);
 const rel=`components/ui/${c.name}`;await archive(rel);
 const entry=c.name.replace(/\.tsx$/,'');
 await fs.writeFile(path.join(src,rel),`// Compatibility entry; implementation owned by the local @hots/ui-kit package.\nexport * from '@hots/ui-kit/components/${entry}';\n${c.original.defaultExport?`export { default } from '@hots/ui-kit/components/${entry}';\n`:''}`);
}
for(const rel of ['lib/utils.ts','hooks/use-mobile.tsx','components/forms/UnifiedFormStructureEditor.tsx','components/report/DataTableReport.tsx','api/workflowAdmin.js','hooks/useTriggerFunction.ts','hooks/usePreferences.ts','components/PDFViewer/PdfViewer.jsx'])await archive(rel);
await fs.writeFile(path.join(src,'lib/utils.ts'),"export { cn } from '@hots/ui-kit/utils';\n");
await fs.writeFile(path.join(src,'hooks/use-mobile.tsx'),"export { useIsMobile } from '@hots/ui-kit/hooks/use-mobile';\n");
const uiPackage=path.join(root,'1.Frontend/packages/ui-kit/package.json'),metadata=JSON.parse(await fs.readFile(uiPackage,'utf8'));
metadata.version='0.2.0-cineva.1';metadata.exports['./components/*']='./src/components/*.tsx';metadata.exports['./utils']='./src/lib/utils.ts';metadata.exports['./hooks/use-mobile']='./src/hooks/use-mobile.tsx';
await fs.writeFile(uiPackage,JSON.stringify(metadata,null,2)+'\n');
const appPackage=path.join(root,'1.Frontend/HOTS/package.json'),app=JSON.parse(await fs.readFile(appPackage,'utf8'));
for(const p of snapshot.packages.filter(p=>p.local.startsWith('1.Frontend/')))app.dependencies[p.name]=`file:${path.relative(path.dirname(appPackage),path.join(root,p.local)).replaceAll('\\','/')}`;
app.dependencies['react-pdf']='^7.6.0';
await fs.writeFile(appPackage,JSON.stringify(app,null,2)+'\n');
await fs.writeFile(path.join(import.meta.dirname,'archived.json'),JSON.stringify(archived,null,2));
console.log(JSON.stringify({uiComponents:snapshot.components.filter(c=>!c.status).length,archived:archived.length,localPackages:snapshot.packages.length}));
