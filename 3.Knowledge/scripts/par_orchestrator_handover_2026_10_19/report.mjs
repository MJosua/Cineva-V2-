import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const out = new URL('../../handover/', import.meta.url);
const wb = Workbook.create();
const s = wb.worksheets.add('Trial readiness');
s.showGridLines = false;
s.getRange('A2').values = [['PAR orchestrator trial handover']];
s.getRange('A3').values = [['19 October 2026. Source audit only. No dispatch or Kantor changes.']];
const rows = [
 ['Item','Owner','Current evidence','Next action'],
 ['PAR heading','Claude','Requirement prepared','Trace title; render Payment for <title>:'],
 ['Long title','Claude','Not tested','Verify wrapping and row/page height'],
 ['Independent review','Codex','Prompt prepared','Review exact commit and rendered output'],
 ['Board assignment','Kantor','Create/start UI exists in source','Verify in live browser'],
 ['Feedback to worker','Kantor','Comments omitted from workflow task','Connect findings, replies and fixes'],
 ['Re-review','Kantor','Board config has only two turns','Reuse coordinator continuation'],
 ['Done action','Human','Calls mergeSession in source','Inspect evidence before integration'],
 ['Reverse experiment','User','User will initiate separately','Same baseline; isolated branches'],
 ['Live provider trial','Kantor','Not run','Verify auth and capture real turns'],
 ['Title mapping','Kantor','Not verified','Trace form/EAV/snapshot/preparer'],
];
s.getRange('A5:D15').values = rows;
s.getRange('A2:D15').format.font = {name:'Arial',size:11,color:'#202020'};
s.getRange('A2').format.font = {name:'Arial',size:15,bold:true};
s.getRange('A3:D3').format.font = {name:'Arial',size:10,color:'#555555'};
s.getRange('A5:D5').format = {fill:'#58452D',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:26};
s.getRange('A6:D15').format.wrapText = true;
s.getRange('A6:D15').format.rowHeight = 44;
s.getRange('A2:A15').format.columnWidth = 25;
s.getRange('B2:B15').format.columnWidth = 15;
s.getRange('C2:C15').format.columnWidth = 43;
s.getRange('D2:D15').format.columnWidth = 49;
s.getRange('A17').values = [['Sources: handover Markdown contains exact source paths, findings and full prompts.']];
s.getRange('A18').values = [['BoardView.jsx; src/board.js; par-renderer.js:419. Runtime remains unverified.']];
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Trial readiness!A5:D15',tableMaxRows:12,tableMaxCols:4,maxChars:1600})).ndjson);
const png = await wb.render({sheetName:s.name,range:'A1:D18',scale:1,format:'png'});
await fs.writeFile(new URL('KANTOR_PAR_ORCHESTRATOR_TEST_2026_10_19.png',out),new Uint8Array(await png.arrayBuffer()));
await (await SpreadsheetFile.exportXlsx(wb)).save(new URL('KANTOR_PAR_ORCHESTRATOR_TEST_2026_10_19.xlsx',out).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
