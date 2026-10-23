import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),base=path.join(root,'3.Knowledge/reports/local_live_e2e_2026_10_21');
const summary=JSON.parse(await fs.readFile(path.join(base,'summary.json'),'utf8'));
const w=Workbook.create(),s=w.worksheets.add('Local E2E');s.showGridLines=false;
s.getRange('A2').values=[['E2E nyata HOTS / Overseas']];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#483326'};
s.getRange('A3').values=[['21 Oktober 2026 | 12 PASS, 2 FAIL (1 masalah dashboard), 3 GAP, 2 belum diuji']];s.getRange('A3').format.font={name:'Arial',size:10};
s.getRange('A5:C5').values=[['Skenario','Status','Bukti dan batas']];const end=summary.cases.length+5;s.getRange(`A6:C${end}`).values=summary.cases;
s.getRange(`A5:C${end}`).format.font={name:'Arial',size:10};s.getRange(`A5:C${end}`).format.wrapText=true;s.getRange(`A5:C${end}`).format.verticalAlignment='top';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};s.getRange('A5:C5').format.horizontalAlignment='center';s.getRange('A5:C5').format.rowHeight=26;
[47,19,118].forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
for(let i=6;i<=end;i++){
 s.getRange(`A${i}:C${i}`).format.rowHeight=40;if(i%2===0)s.getRange(`A${i}:C${i}`).format.fill='#F5F0E7';
 const status=summary.cases[i-6][1];s.getRange(`B${i}`).format.fill=status==='FAIL'?'#FCE2DF':status==='GAP'?'#FFF0CC':status==='PASS'?'#E1EFE5':'#EAEAEA';
}
s.freezePanes.freezeRows(5);w.recalculate();
const out=path.join(base,'outputs');await fs.mkdir(out,{recursive:true});await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Local_Live_E2E.xlsx'));
const preview=await w.render({sheetName:'Local E2E',range:`A2:C${end}`,scale:1});await fs.writeFile(path.join(base,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
await fs.writeFile(path.join(base,'workbook-inspection.ndjson'),(await w.inspect({kind:'sheet',include:'id,name',maxChars:1000})).ndjson);
process.stdout.write('[LOCAL-E2E][INFO] : Excel report exported and rendered\n');
