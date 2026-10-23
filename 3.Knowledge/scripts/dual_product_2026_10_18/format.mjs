import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),require=createRequire(path.join(root,'1.Frontend/HOTS/package.json')),ts=require('typescript');
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
for(const area of ['cineva-shared','cineva-hq','creator-space']){
 const dir=path.join(root,'1.Frontend/HOTS/src/features',area);
 for(const file of await fs.readdir(dir)){
  if(!/\.tsx?$/.test(file))continue;
  const target=path.join(dir,file),source=ts.createSourceFile(file,await fs.readFile(target,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  if(source.parseDiagnostics.length)throw new Error('Invalid syntax: '+target);
  await fs.writeFile(target,printer.printFile(source));
 }
}
