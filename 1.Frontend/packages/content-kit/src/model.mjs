/** Universal content contracts. No React, browser, persistence or provider dependency. */
export class ContentError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export const fail = (condition, code, status = 400) => { if (!condition) throw new ContentError(code, status); };
export const clone = value => structuredClone(value);
export const formats = Object.freeze({'4:5': {width: 1080, height: 1350}, '9:16': {width: 1080, height: 1920}});
export const languages = Object.freeze(['id', 'ms', 'en']);
export const providers = Object.freeze(['instagram', 'facebook', 'threads', 'tiktok']);
export function text(value, max, name, optional = false) {
  fail(typeof value === 'string' && value.length <= max && (optional || value.trim().length > 0), `INVALID_${name}`);
  return value.trim();
}
export function identifier(value) { fail(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value), 'INVALID_ID'); return value; }
export function scopeKey(scope) {
  identifier(scope.tenant_key);
  fail(['company', 'personal'].includes(scope.kind), 'INVALID_SCOPE');
  if (scope.kind === 'company') fail(Number.isSafeInteger(scope.company_id) && scope.company_id > 0, 'INVALID_COMPANY');
  else identifier(scope.user_id);
  return `${scope.tenant_key}:${scope.kind}:${scope.kind === 'company' ? scope.company_id : scope.user_id}`;
}
export function validateBrand(brand) {
  text(brand.name, 70, 'BRAND'); text(brand.handle, 60, 'HANDLE', true); text(brand.tagline, 120, 'TAGLINE', true);
  fail(/^#[\da-fA-F]{6}$/.test(brand.color), 'INVALID_COLOR');
  fail(typeof brand.watermark === 'boolean' && typeof brand.closing === 'boolean', 'INVALID_BRAND_OPTIONS');
  // Raster-only, bounded self-contained logo. No external tracking URL or SVG script execution.
  fail(!brand.logo || typeof brand.logo === 'string' && brand.logo.length <= 400000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(brand.logo), 'INVALID_LOGO');
  return brand;
}
export const defaultBrand = () => ({name: 'Cineva', handle: '@cineva', tagline: 'Cerita yang layak dibagikan.', color: '#966b3b', logo: '', watermark: true, closing: false});
export function validateDocument(doc) {
  identifier(doc.id); text(doc.title, 100, 'TITLE');
  fail(Number.isSafeInteger(doc.revision) && doc.revision >= 1 && doc.schema_version === 1, 'INVALID_REVISION');
  fail(Object.hasOwn(formats, doc.format) && languages.includes(doc.language), 'INVALID_FORMAT_LANGUAGE');
  fail(['draft', 'in_review', 'revision_requested', 'approved'].includes(doc.status), 'INVALID_STATUS');
  identifier(doc.templateId); validateBrand(doc.brand);
  fail(Array.isArray(doc.slides) && doc.slides.length > 0 && doc.slides.length <= 10, 'INVALID_SLIDES');
  const ids = new Set();
  for (const slide of doc.slides) {
    identifier(slide.id); fail(!ids.has(slide.id), 'DUPLICATE_SLIDE'); ids.add(slide.id);
    text(slide.title, 95, 'SLIDE_TITLE'); text(slide.body, 420, 'SLIDE_BODY', true);
    fail(!slide.image||typeof slide.image==='string'&&slide.image.length<=1500000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(slide.image),'INVALID_SLIDE_IMAGE');
  }
  text(doc.caption, 2200, 'CAPTION', true); text(doc.hashtags, 400, 'HASHTAGS', true);
  fail(Array.isArray(doc.history) && doc.history.length <= 200, 'INVALID_HISTORY');
  if (doc.source) {text(doc.source.text, 20000, 'SOURCE_TEXT', true);text(doc.source.url, 2048, 'SOURCE_URL', true);}
  return doc;
}
export function createDocument({id, title = 'Cerita baru', count = 3, format = '4:5', language = 'id', templateId = 'editorial', brand = defaultBrand()}, at = new Date().toISOString()) {
  fail(Number.isSafeInteger(count) && count >= 1 && count <= 10, 'INVALID_SLIDES');
  return validateDocument({schema_version: 1, id, revision: 1, title, format, language, templateId, brand: clone(brand),
    status: 'draft', slides: Array.from({length: count}, (_, i) => ({id: `slide-${i+1}`, title: i === 0 ? title : `Bagian ${i+1}`, body: 'Tulis cerita, fakta, atau pesan utama di sini.'})),
    caption: '', hashtags: '', source: {kind: 'manual', text: '', url: ''}, history: [{action: 'created', at}], updatedAt: at});
}
/** Server recomputes revisions/status/history. Editable fields cannot inject approval. */
export function editDocument(current, input, expectedRevision, at = new Date().toISOString()) {
  fail(current.revision === expectedRevision, 'REVISION_CONFLICT', 409);
  const next = clone(current);
  for (const key of ['title', 'format', 'language', 'templateId', 'brand', 'slides', 'caption', 'hashtags', 'source']) if (Object.hasOwn(input, key)) next[key] = clone(input[key]);
  next.revision++; next.status = 'draft'; delete next.approval;
  next.history.push({action: 'edited', at}); next.updatedAt = at;
  return validateDocument(next);
}
/** Workflow host can replace this transition port with its configured HOTS workflow. */
export function reviewDocument(current, action, actor, expectedRevision, note = '', at = new Date().toISOString()) {
  fail(current.revision === expectedRevision, 'REVISION_CONFLICT', 409);
  fail(current.status === 'draft' && action === 'submit' || current.status === 'revision_requested' && action === 'submit' || current.status === 'in_review' && ['approve', 'revise'].includes(action), 'INVALID_TRANSITION', 409);
  if (action !== 'submit') fail(actor.canApprove === true, 'APPROVAL_FORBIDDEN', 403);
  if (action === 'revise') text(note, 1000, 'REVISION_REASON');
  const next = clone(current); next.status = action === 'submit' ? 'in_review' : action === 'approve' ? 'approved' : 'revision_requested';
  next.revision++; next.updatedAt = at;
  next.history.push({action, at, actor: identifier(actor.id), note: text(note, 1000, 'NOTE', true)});
  if (action === 'approve') next.approval = {revision: next.revision, actor: actor.id, at};
  return validateDocument(next);
}
