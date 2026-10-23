import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root='D:/Project/Cineva-V2-',out=`${root}/outputs/content_studio_plan_2026_10_22`;
const e=JSON.parse(await fs.readFile(`${root}/3.Knowledge/reports/content_studio_plan_2026_10_22/package-evidence.json`,'utf8'));
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
function sheet(name,title,context,headers,rows,widths){
 const s=wb.worksheets.add(name);s.showGridLines=false;
 const last=String.fromCharCode(64+headers.length),end=6+rows.length;
 s.getRange('A2').values=[[title]];s.getRange('A3').values=[[context]];
 s.getRange(`A6:${last}6`).values=[headers];s.getRange(`A7:${last}${end}`).values=rows;
 s.getRange(`A2:${last}${end}`).format.font={name:'Arial',size:11};
 s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#654431'};
 s.getRange(`A6:${last}6`).format={fill:'#654431',font:{bold:true,color:'#FFFFFF'},rowHeight:32};
 s.getRange(`A7:${last}${end}`).format.wrapText=true;s.getRange(`A7:${last}${end}`).format.rowHeight=78;
 for(let i=0;i<widths.length;i++){const c=String.fromCharCode(65+i);s.getRange(`${c}:${c}`).format.columnWidth=widths[i];}
 s.freezePanes.freezeRows(6);return s;
}
const phases=[
 ['P0','Kontrak, schema, scope dan baseline','Tidak ada','tenant-*; domain-kit; transaction-kit','Package delta, OpenAPI, scope company/personal, physical schema authoritative','Cross-context API/media/worker/SSE ditolak; EAV terjaga; migration plan sebelum SQL'],
 ['P1','Editor, template, brand kit, render','P0 kontrak','ui-kit; dynamic-form; content core baru','Visual editor, 6–10 desain awal, galeri 64+ kapasitas, 4:5/9:16, logo/watermark/closing','Output pixel benar, teks tidak terpotong, preview/export sama, save/version/reload'],
 ['P2','AI dari link, teks dan ide','P1 model konten','domain-kit proposal; AI/extractor adapter baru','Source extraction, provenance, schema-validated draft, model nyata, fallback link unsupported','Malformed/timeout/cancel/quota aman; AI tidak publish otomatis; retry tidak double-charge'],
 ['P3','QC, kalender, durable scheduler','P0 server + P1 revision','Workflow existing; transaction-kit; app-core/notification-kit','Week/month/list; immutable approved version; per-target status; lease/recovery/reconcile','Restart/2 workers/cancel race/rollback/timezone; unknown tidak blind retry'],
 ['P4','Empat konektor sosial live','P3 + developer apps/akun test','Social-publishing module; engine-client extension','Instagram kandidat pertama, lalu Facebook/Threads/TikTok; capabilities per akun/format','Consent → post ID → inspeksi live tiap provider; revoke/token expiry/rate-limit diuji'],
 ['P5','Analytics dan AI insight','P4 post IDs + metric permission','Social-insights module; ui-kit/chart; table-engine','Period/account/platform filters, raw snapshots, top post/template, evidence-linked insight','Angka reconcile, unsupported null, snapshot tidak double-count, sample/periode jelas'],
 ['P6','Kuota, team dan release','P1–P5 full parity','Entitlement adapter; tenant-*; transaction-kit','Server quota ledger, audit, worker deployment, canary, rollback, package bundle','End-to-end nyata dan regression campaign/marketplace/payout/booking; no Kantor dependency'],
];
sheet('Tahapan','Rencana implementasi Cineva Content Studio','22 Oktober 2026. Rencana, belum implementasi. Package existing belum full parity.', ['Tahap','Hasil','Dependency','Fondasi HOTS / tambahan','Lingkup implementasi','Acceptance gate'],phases,[10,34,30,44,58,64]);
const requirements=[
 ['R01','1','AI carousel dari link/teks/ide','P2','domain-kit + content-studio/AI adapter','Belum ada inference konten','Live model + draft validation + fallback tiap source'],
 ['R02','1','Slide count, bahasa, rasio','P1/P2','Content core/renderer + form/ui-kit','Renderer konten baru diperlukan','Dimensi/order benar; bahasa/length constraints'],
 ['R03','2,7','Template gallery/filter/default','P1','ui-kit + katalog content-studio','Slider UI bukan desain template','64 fixture filterable; jumlah desain actual eksplisit'],
 ['R04','3,6','Kalender week/month/list','P3','ui-kit composition + publishing module','DayPicker/scheduling-kit bukan scheduler','Per-target status, timezone, reschedule/cancel'],
 ['R05','4','Output sosial nyata','P1/P4','Renderer + provider connector','Tidak dibuktikan oleh screenshot client','File render dan post pada akun test nyata'],
 ['R06','5','Multi-platform/multi-account','P4','tenant-* + social provider registry','OAuth/provider adapters baru','Empat provider lulus gate masing-masing'],
 ['R07','3,5,6','Publish now/scheduled/status gagal','P3/P4','transaction-kit + durable worker extension','Outbox bukan delayed queue lengkap','Restart/race/reconcile/partial-success'],
 ['R08','5','Feed/story/caption/hashtag/audio','P1/P4','Form options + capability adapter','Bergantung format/akun/API provider','Unsupported eksplisit; audio sesuai API, tanpa janji FYP'],
 ['R09','8','Brand kit logo/watermark/penutup','P1','content core + ui-kit + entitlement','Theme aplikasi bukan brand kit output','Preview/export sama; policy brand/provider'],
 ['R10','9','Views/interactions/ER/followers','P5','Insights collector + metric contract','Existing snapshot manual dummy','Raw→dashboard reconcile; unsupported null'],
 ['R11','9,10','Tren/top post/template ranking','P5','Projection + table-engine/ui-kit chart','Agregasi dan attribution baru','Periode/sample/denominator benar'],
 ['R12','10','AI insight jam/hari/template','P5','Evidence insight adapter','Assistant job bukan analisis sosial','Sumber/periode/sample dapat ditelusuri'],
 ['R13','1,8','Paket/kuota/team','P0/P6','tenant-* + entitlement/usage ledger','Starter/Pro existing simulasi job','Server enforcement dan quota concurrency'],
 ['R14','3,5','Draft/revisi/QC/history','P3','Workflow existing + domain revision adapter','Dummy guards perlu backend persistence','Approved revision locked dan regresi'],
];
sheet('Cakupan','Cakupan fitur referensi client','14 requirement utama. Tutorial/afiliasi/API-MCP perlu requirement detail tersendiri.', ['ID','Gambar','Requirement','Tahap','Package / pemilik','Gap existing','Bukti wajib sebelum selesai'],requirements,[10,10,36,13,48,49,57]);
const decisions={
 'dynamic-form':'Reuse forms; reconcile upstream whitelist and local unique IDs.',
 'service-form-runtime':'Reuse normalization; verify actual submit integration.',
 'ui-kit':'Reuse controls/chart; slider and date picker are not content/scheduler engines.',
 'app-core':'Reuse HTTP/SSE/media URLs; server owns social tokens.',
 'table-engine':'Review upstream 0.3.0 actions versus local split/refactor; no wholesale overwrite.',
 'engine-client':'Add optional content/social clients; preserve legacy envelopes.',
 'domain-kit':'Reuse sync command/proposal/schema guards; inference is new server adapter.',
 'scheduling-kit':'Keep pure resource availability; separate publishing scheduler.',
 'page-engine':'Layout/CSS only; content renderer still needed.',
 'workflow-policy-kit':'Timeout policy only; reuse backend workflow for editorial QC.',
 'tenant-contracts':'Reuse canonical scope; keep program/company semantics.',
 'tenant-client':'Cineva local package; not an upstream release.',
 'transaction-kit':'Reuse kernel; add delayed scheduling/lease/recovery via adapter; schema gates.',
 'tenant-server':'Review differences before adoption; real endpoint/worker scope acceptance required.',
 'notification-kit':'Cineva local extraction; SSE progress, not execution scheduler.',
 'submission-kit':'Not selected: Event public submission is not editorial review.',
};
const versions=e.packages.map(p=>[p.local?.name??p.reference.name,p.local?.version??'Tidak ada',p.reference?.version??'Tidak ada',p.sourceParity===null?'Satu sisi tidak tersedia':p.sourceParity?'Sama':'Berbeda',p.differentFiles.length,decisions[p.location.split('/').at(-1)],p.location]);
const v=sheet('Package','Package HOTS dan keputusan pemakaian','Metadata dan hash src aktual dibaca 22 Oktober. Source parity bukan bukti runtime.', ['Package','Cineva','HOTS reference','Source parity','Delta files','Keputusan','Lokasi sumber'],versions,[31,24,22,29,13,78,62]);
v.getRange(`E7:E${6+versions.length}`).setNumberFormat('0');
const noteRow=9+versions.length;
v.getRange(`A${noteRow}:D${noteRow}`).values=[['Verifikasi lokal','Lulus','Gagal','Batas']];
v.getRange(`A${noteRow+1}:D${noteRow+3}`).values=e.validation.map(t=>[t.suite,t.passed,t.failed,t.scope]);
v.getRange(`A${noteRow+4}`).values=[['Sumber detail: knowledge architecture/content_studio_implementation_plan_2026_10_22.md dan package-evidence.json.']];
v.getRange(`A${noteRow+1}:D${noteRow+3}`).format.wrapText=true;v.getRange(`A${noteRow+1}:D${noteRow+3}`).format.rowHeight=64;
wb.recalculate();
const inspected=await wb.inspect({kind:'table',range:'Cakupan!A6:D20',include:'values,formulas',tableMaxRows:15,maxChars:2800});
await fs.writeFile(`${out}/verification.ndjson`,inspected.ndjson);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},summary:'Formula error scan'});
await fs.writeFile(`${out}/error-scan.ndjson`,errors.ndjson);
const file=await SpreadsheetFile.exportXlsx(wb);await file.save(`${out}/Cineva_Content_Studio_Implementation_Plan.xlsx`);
for(const [name,range] of [['Tahapan','A6:F9'],['Cakupan','A6:G10'],['Package','A6:F10']]){
 const preview=await wb.render({sheetName:name,range,scale:1,format:'png'});await fs.writeFile(`${out}/${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
console.log(JSON.stringify({phases:phases.length,requirements:requirements.length,packages:versions.length,tests:e.validation.reduce((a,b)=>a+b.passed,0),output:`${out}/Cineva_Content_Studio_Implementation_Plan.xlsx`,errors:errors.ndjson}));
