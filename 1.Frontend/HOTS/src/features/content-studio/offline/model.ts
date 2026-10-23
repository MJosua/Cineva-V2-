import {validateDocument,validateBrand,validateMetrics,providers,templates,findTemplate,renderManifest,fail} from '@hots/content-kit';
import type {ContentState} from '../types';
export interface PortableStudio {schema_version:1;createdAt:string;workspaces:{hq:ContentState;creator:ContentState}}
/** Offline envelope only; no company IDs, tokens, real account credentials or DB mappings. */
export function validatePortable(value:unknown):PortableStudio{
  fail(value!==null&&typeof value==='object','INVALID_DEMO_FILE');const data=value as PortableStudio;
  fail(data.schema_version===1&&Number.isFinite(Date.parse(data.createdAt))&&data.workspaces,'INVALID_DEMO_FILE');
  for(const role of ['hq','creator'] as const){const s=data.workspaces[role];fail(s?.schema_version===1&&Array.isArray(s.documents)&&s.documents.length<=100&&Array.isArray(s.accounts)&&Array.isArray(s.targets)&&s.targets.length<=500&&Array.isArray(s.snapshots)&&s.snapshots.length<=5000,'INVALID_DEMO_WORKSPACE');
    validateBrand(s.brand);const ids=new Set<string>();for(const doc of s.documents){validateDocument(doc);findTemplate(doc.templateId);renderManifest(doc);fail(!ids.has(doc.id),'DUPLICATE_DOCUMENT');ids.add(doc.id);}
    const accounts=new Set<string>();for(const a of s.accounts){fail(typeof a.id==='string'&&!accounts.has(a.id)&&providers.includes(a.provider)&&typeof a.name==='string'&&a.name.length<=100&&typeof a.active==='boolean'&&Array.isArray(a.formats)&&a.formats.every(f=>['feed','carousel','story'].includes(f)),'INVALID_DEMO_ACCOUNT');accounts.add(a.id);}
    const targetIds=new Set<string>();for(const target of s.targets){fail(typeof target.id==='string'&&!targetIds.has(target.id)&&ids.has(target.documentId)&&accounts.has(target.accountId)&&providers.includes(target.provider)&&['scheduled','queued','publishing','published','failed','unknown','cancelled'].includes(target.status)&&Number.isFinite(Date.parse(target.scheduledAt)),'INVALID_DEMO_TARGET');if(target.publishedAt)fail(Number.isFinite(Date.parse(target.publishedAt)),'INVALID_DEMO_TARGET');targetIds.add(target.id);}
    for(const snapshot of s.snapshots){fail(targetIds.has(snapshot.targetId)&&Number.isFinite(Date.parse(snapshot.capturedAt)),'INVALID_DEMO_METRIC');validateMetrics(snapshot.metrics);}
    fail(s.settings&&templates.some(t=>t.id===s.settings.defaultTemplate)&&Array.isArray(s.settings.favoriteTemplates)&&s.settings.favoriteTemplates.every(id=>templates.some(t=>t.id===id)),'INVALID_DEMO_SETTINGS');
    fail(s.usage&&s.plan&&['generation','render','publish'].every(k=>Number.isSafeInteger(s.usage[k as keyof typeof s.usage])&&s.usage[k as keyof typeof s.usage]>=0&&Number.isSafeInteger(s.plan[k as 'generation'|'render'|'publish'])&&s.plan[k as 'generation'|'render'|'publish']>=0),'INVALID_DEMO_USAGE');
  }
  return data;
}
export const safeJson=(data:PortableStudio)=>JSON.stringify(validatePortable(data)).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
