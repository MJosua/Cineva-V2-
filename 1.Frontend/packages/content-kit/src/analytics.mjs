import {fail} from './model.mjs';
export const metricNames=['views','likes','comments','shares','saves','reposts','followers'];
export function validateMetrics(metrics) {for(const key of metricNames) fail(metrics[key]===null||Number.isSafeInteger(metrics[key])&&metrics[key]>=0,'INVALID_METRIC');return metrics;}
export function engagement(metrics) {
  const keys=['likes','comments','shares','saves','reposts'];
  if(!metrics.views||keys.some(k=>metrics[k]===null))return null;
  return keys.reduce((s,k)=>s+metrics[k],0)/metrics.views;
}
/** Latest lifetime observation per target, filtered by post date. Never sum daily lifetime snapshots. */
export function analytics(targets,snapshots,{from,to,provider='all',accountId='all'}={}) {
  const selected=targets.filter(t=>t.status==='published'&&(!from||t.publishedAt>=from)&&(!to||t.publishedAt<=to)&&(provider==='all'||t.provider===provider)&&(accountId==='all'||t.accountId===accountId));
  const rows=selected.map(target=>{const snapshot=snapshots.filter(s=>s.targetId===target.id).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))[0];return {...target,metrics:snapshot?.metrics??null,capturedAt:snapshot?.capturedAt??null,engagement:snapshot?engagement(snapshot.metrics):null};});
  const sum=key=>rows.length&&rows.every(r=>r.metrics?.[key]!=null)?rows.reduce((s,r)=>s+r.metrics[key],0):null;
  const metrics=Object.fromEntries(metricNames.map(k=>[k,k==='followers'?null:sum(k)]));
  const templates=[...new Set(rows.map(r=>r.templateId))].map(id=>{const posts=rows.filter(r=>r.templateId===id),known=posts.filter(r=>r.engagement!==null);return {templateId:id,posts:posts.length,measured:known.length,engagement:known.length===posts.length&&known.length?known.reduce((s,r)=>s+r.engagement*r.metrics.views,0)/known.reduce((s,r)=>s+r.metrics.views,0):null};});
  return {rows,metrics,engagement:engagement(metrics),posts:rows.length,measured:rows.filter(r=>r.metrics).length,templates,definition:'(likes+comments+shares+saves+reposts)/views',followersReason:'Account followers require separate account snapshots; not attributed to posts.'};
}
export function insightSummary(result) {
  if(!result.measured)return {kind:'insufficient_data',text:'Belum ada metrik terukur. Sinkronkan akun yang mendukung insight.',sample:0};
  const ranked=result.templates.filter(t=>t.engagement!==null).sort((a,b)=>b.engagement-a.engagement);
  return {kind:'observation',sample:result.measured,text:ranked.length?`Template ${ranked[0].templateId} memiliki ER berbasis views tertinggi dalam filter ini (${ranked[0].posts} post). Ini observasi, bukan jaminan performa.`:'Metrik belum lengkap untuk membandingkan engagement. Nilai yang tidak tersedia tidak dianggap nol.'};
}
