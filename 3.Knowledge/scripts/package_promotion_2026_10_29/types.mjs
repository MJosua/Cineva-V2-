/** @purpose Strictly typechecks promoted TypeScript APIs using the existing host's dependency declarations. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),target='D:/Kantor/1.Frontend/packages';
const require=createRequire(path.join(root,'1.Frontend/HOTS/package.json')),ts=require('typescript');
const react=path.dirname(require.resolve('@types/react/package.json'));
const files=[`${target}/engine-client/src/content.ts`,`${target}/tenant-client/src/index.ts`,`${target}/content-kit/src/index.d.mts`];
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,types:[],baseUrl:root,paths:{'@hots/tenant-contracts': [`${target}/tenant-contracts/src/index.d.ts`],react:[`${react}/index.d.ts`],'react/jsx-runtime':[`${react}/jsx-runtime.d.ts`],axios:[require.resolve('axios').replace(/dist[\\/]node[\\/]axios\.cjs$/,'index.d.ts')]}};
const program=ts.createProgram(files,options),diagnostics=ts.getPreEmitDiagnostics(program);
const output=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'});
fs.writeFileSync(path.join(root,'3.Knowledge/reports/package_promotion_2026_10_29/typecheck.txt'),output||'Strict promoted API typecheck: 0 diagnostics. Host React/Axios declaration dependencies reused.\n');
console.log(output||'Strict promoted API typecheck: 0 diagnostics');if(diagnostics.length)process.exitCode=1;
