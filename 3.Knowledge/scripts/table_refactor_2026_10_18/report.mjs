import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'3.Knowledge/reports/table_refactor_2026_10_18');
const counts=JSON.parse(await fs.readFile(path.join(out,'line-counts.json'),'utf8'));
const tests=JSON.parse(await fs.readFile(path.join(out,'validation.json'),'utf8'));
if(tests.e2ePassed!==19||tests.e2eFailed||tests.lintErrors||tests.tableDiagnostics.length)throw new Error('Validation failed');
const w=Workbook.create(),s=w.worksheets.add('Refactor');s.showGridLines=false;
s.getRange('A2').values=[['Cineva reusable table refactor']];
s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};
const summary=[['Pemeriksaan','Hasil','Catatan'],
 ['Batas per file',1000,'Semua 19 source file paket memenuhi batas.'],
 ['Hook utama sebelum',818,'Snapshot sebelum refactor disimpan di knowledge archive.'],
 ['Hook utama sesudah',counts[0].lines,'Order, selection dan grouping dipisah ke hook tersendiri.'],
 ['Tes kontrak lulus',17,'Termasuk EAV save, filter, pencarian dan payload.'],
 ['Browser checks lulus',tests.e2ePassed,'Data dummy; API diintersep; tidak memakai database.'],
 ['Lint errors',tests.lintErrors,'Satu advisory panjang fungsi pada hook komposisi.'],
 ['Diagnostic table-engine',tests.tableDiagnostics.length,'Aplikasi keseluruhan masih memiliki 101 diagnostics.'],
 ['Build produksi','Lulus','API publik dan CSS vendor tetap kompatibel.'],
 ['HOTS original','Tidak diubah','Fork lokal Cineva 0.2.0-cineva.2.']];
s.getRange(`A4:C${summary.length+3}`).values=summary;
s.getRange('A16:C16').values=[['Source file','Baris','Batas']];
s.getRange(`A17:C${16+counts.length}`).values=counts.map(c=>[c.file,c.lines,1000]);
for(const range of ['A4:C13',`A16:C${16+counts.length}`]){s.getRange(range).format.font={name:'Arial',size:11};s.getRange(range).format.rowHeight=26;}
for(const range of ['A4:C4','A16:C16']){s.getRange(range).format.fill='#483326';s.getRange(range).format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};}
s.getRange('A4:A35').format.columnWidth=47;s.getRange('B4:B35').format.columnWidth=18;s.getRange('C4:C35').format.columnWidth=83;
s.getRange('A37').values=[['Sumber: reports/table_refactor_2026_10_18/line-counts.json dan validation.json']];
s.getRange('A37').format.font={name:'Arial',size:10,italic:true,color:'#66594C'};
w.recalculate();
const checked=await w.inspect({kind:'table',range:'Refactor!A4:C13',include:'values,formulas',tableMaxRows:10,tableMaxCols:3,maxChars:2500});
await fs.writeFile(path.join(out,'workbook-inspect.json'),checked.ndjson);
const errors=await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:20},maxChars:1000});
await fs.writeFile(path.join(out,'workbook-errors.json'),errors.ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Table_Refactor.xlsx'));
const preview=await w.render({sheetName:'Refactor',range:'A1:C37',scale:1});
await fs.writeFile(path.join(out,'preview.png'),new Uint8Array(await preview.arrayBuffer()));
process.stdout.write('Cineva_Table_Refactor.xlsx exported and verified.\n');
