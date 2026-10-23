// 1.Frontend/packages/content-kit/src/model.mjs
var ContentError = class extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
};
var fail = (condition, code, status = 400) => {
  if (!condition) throw new ContentError(code, status);
};
var clone = (value) => structuredClone(value);
var formats = Object.freeze({ "4:5": { width: 1080, height: 1350 }, "9:16": { width: 1080, height: 1920 } });
var languages = Object.freeze(["id", "ms", "en"]);
var providers = Object.freeze(["instagram", "facebook", "threads", "tiktok"]);
function text(value, max, name, optional = false) {
  fail(typeof value === "string" && value.length <= max && (optional || value.trim().length > 0), `INVALID_${name}`);
  return value.trim();
}
function identifier(value) {
  fail(typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value), "INVALID_ID");
  return value;
}
function validateBrand(brand) {
  text(brand.name, 70, "BRAND");
  text(brand.handle, 60, "HANDLE", true);
  text(brand.tagline, 120, "TAGLINE", true);
  fail(/^#[\da-fA-F]{6}$/.test(brand.color), "INVALID_COLOR");
  fail(typeof brand.watermark === "boolean" && typeof brand.closing === "boolean", "INVALID_BRAND_OPTIONS");
  fail(!brand.logo || typeof brand.logo === "string" && brand.logo.length <= 4e5 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(brand.logo), "INVALID_LOGO");
  return brand;
}
var defaultBrand = () => ({ name: "Cineva", handle: "@cineva", tagline: "Cerita yang layak dibagikan.", color: "#966b3b", logo: "", watermark: true, closing: false });
function validateDocument(doc) {
  identifier(doc.id);
  text(doc.title, 100, "TITLE");
  fail(Number.isSafeInteger(doc.revision) && doc.revision >= 1 && doc.schema_version === 1, "INVALID_REVISION");
  fail(Object.hasOwn(formats, doc.format) && languages.includes(doc.language), "INVALID_FORMAT_LANGUAGE");
  fail(["draft", "in_review", "revision_requested", "approved"].includes(doc.status), "INVALID_STATUS");
  identifier(doc.templateId);
  validateBrand(doc.brand);
  fail(Array.isArray(doc.slides) && doc.slides.length > 0 && doc.slides.length <= 10, "INVALID_SLIDES");
  const ids = /* @__PURE__ */ new Set();
  for (const slide of doc.slides) {
    identifier(slide.id);
    fail(!ids.has(slide.id), "DUPLICATE_SLIDE");
    ids.add(slide.id);
    text(slide.title, 95, "SLIDE_TITLE");
    text(slide.body, 420, "SLIDE_BODY", true);
    fail(!slide.image || typeof slide.image === "string" && slide.image.length <= 15e5 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(slide.image), "INVALID_SLIDE_IMAGE");
  }
  text(doc.caption, 2200, "CAPTION", true);
  text(doc.hashtags, 400, "HASHTAGS", true);
  fail(Array.isArray(doc.history) && doc.history.length <= 200, "INVALID_HISTORY");
  if (doc.source) {
    text(doc.source.text, 2e4, "SOURCE_TEXT", true);
    text(doc.source.url, 2048, "SOURCE_URL", true);
  }
  return doc;
}
function createDocument({ id, title = "Cerita baru", count = 3, format = "4:5", language = "id", templateId = "editorial", brand = defaultBrand() }, at = (/* @__PURE__ */ new Date()).toISOString()) {
  fail(Number.isSafeInteger(count) && count >= 1 && count <= 10, "INVALID_SLIDES");
  return validateDocument({
    schema_version: 1,
    id,
    revision: 1,
    title,
    format,
    language,
    templateId,
    brand: clone(brand),
    status: "draft",
    slides: Array.from({ length: count }, (_, i) => ({ id: `slide-${i + 1}`, title: i === 0 ? title : `Bagian ${i + 1}`, body: "Tulis cerita, fakta, atau pesan utama di sini." })),
    caption: "",
    hashtags: "",
    source: { kind: "manual", text: "", url: "" },
    history: [{ action: "created", at }],
    updatedAt: at
  });
}
function reviewDocument(current, action, actor, expectedRevision, note = "", at = (/* @__PURE__ */ new Date()).toISOString()) {
  fail(current.revision === expectedRevision, "REVISION_CONFLICT", 409);
  fail(current.status === "draft" && action === "submit" || current.status === "revision_requested" && action === "submit" || current.status === "in_review" && ["approve", "revise"].includes(action), "INVALID_TRANSITION", 409);
  if (action !== "submit") fail(actor.canApprove === true, "APPROVAL_FORBIDDEN", 403);
  if (action === "revise") text(note, 1e3, "REVISION_REASON");
  const next = clone(current);
  next.status = action === "submit" ? "in_review" : action === "approve" ? "approved" : "revision_requested";
  next.revision++;
  next.updatedAt = at;
  next.history.push({ action, at, actor: identifier(actor.id), note: text(note, 1e3, "NOTE", true) });
  if (action === "approve") next.approval = { revision: next.revision, actor: actor.id, at };
  return validateDocument(next);
}

// 1.Frontend/packages/content-kit/src/templates.mjs
var items = [
  ["editorial", "Editorial", "Berita", "#152332", "#e8bc75", "stack"],
  ["golden", "Golden Hour", "Bersih", "#f5f0e7", "#936334", "clean"],
  ["impact", "Impact", "Tegas", "#201c1a", "#ffc868", "headline"],
  ["midnight", "Midnight", "Gelap", "#122034", "#77c9bd", "quote"],
  ["terracotta", "Terracotta", "Sosial", "#6e392c", "#ffe3bd", "stack"],
  ["minimal", "Minimal", "Bersih", "#ffffff", "#765333", "clean"],
  ["studio", "Studio Note", "Sosial", "#323d36", "#e4d2a6", "quote"],
  ["signal", "Signal", "Berita", "#212329", "#e1c160", "headline"]
];
var templates = Object.freeze(items.map(([id, name, category, background, accent, layout]) => Object.freeze({ id, name, category, background, accent, layout, version: 1 })));

// 1.Frontend/HOTS/src/features/content-studio/offline/seed.ts
function createPortableSeed(now = /* @__PURE__ */ new Date()) {
  const at = now.toISOString(), day = 864e5, brand = { ...defaultBrand(), name: "Cineva", handle: "@cineva.demo", tagline: "Cerita brand Anda, lebih terarah.", color: "#b58a36" };
  function doc(id, title, phase, templateId = "golden") {
    let d = createDocument({ id, title, count: 3, brand, templateId }, at);
    d.slides = [{ id: "slide-1", title, body: "Mulai dari pesan yang jelas. Pilih satu tujuan untuk setiap konten." }, { id: "slide-2", title: "Bangun cerita yang mudah diikuti", body: "Gunakan visual yang konsisten, isi ringkas, dan contoh yang relevan." }, { id: "slide-3", title: "Ajak audiens mengambil langkah", body: "Tutup dengan ajakan yang spesifik. Evaluasi hasilnya sebelum membuat konten berikutnya." }];
    d.caption = "Konten yang konsisten dimulai dari cerita yang terarah. Ini adalah contoh sintetis untuk demo Cineva.";
    d.hashtags = "#CinevaDemo #ContentStudio";
    if (phase !== "draft") d = reviewDocument(d, "submit", { id: "demo-creator" }, 1, "", at);
    if (phase === "approved") d = reviewDocument(d, "approve", { id: "demo-reviewer", canApprove: true }, 2, "Contoh persetujuan QC untuk demo.", at);
    return d;
  }
  function state(role) {
    const prefix = `${role}-demo`, documents = [doc(`${prefix}-draft`, "3 langkah konten yang konsisten", "draft"), doc(`${prefix}-review`, "Cerita brand yang layak dibagikan", "in_review", "editorial"), doc(`${prefix}-ready`, "Rencana konten minggu ini", "approved", "impact"), doc(`${prefix}-published`, "Ide kecil, cerita yang berarti", "approved", "golden")];
    const accounts = providers.map((provider) => ({ id: `demo-${provider}`, provider, name: `Cineva Demo \xB7 ${provider}`, active: true, formats: ["feed", "carousel"] }));
    const targets = providers.map((provider, i) => ({ id: `${prefix}-post-${i}`, documentId: documents[3].id, revision: documents[3].revision, provider, accountId: `demo-${provider}`, format: "carousel", status: "published", scheduledAt: new Date(+now - (i + 1) * day).toISOString(), publishedAt: new Date(+now - (i + 1) * day).toISOString(), templateId: "golden", title: documents[3].title, postId: `DEMO-${provider}` }));
    targets.push({ id: `${prefix}-scheduled`, documentId: documents[2].id, revision: documents[2].revision, provider: "instagram", accountId: "demo-instagram", format: "carousel", status: "scheduled", scheduledAt: new Date(+now + 2 * 36e5).toISOString(), publishedAt: void 0, templateId: "impact", title: documents[2].title, postId: void 0 });
    const snapshots = targets.filter((t) => t.status === "published").map((target, i) => ({ id: `${prefix}-metric-${i}`, targetId: target.id, capturedAt: at, source: "synthetic-portable-demo", metrics: { views: [1240, 980, 720, 460][i], likes: [48, 36, 25, 18][i], comments: [8, 5, 4, 2][i], shares: [6, 4, 3, 2][i], saves: [10, 7, 5, 3][i], reposts: 0, followers: null } }));
    return { schema_version: 1, revision: 0, brand: structuredClone(brand), documents, accounts, targets, snapshots, usage: { generation: 0, render: 0, publish: 5 }, settings: { defaultTemplate: "golden", favoriteTemplates: ["golden", "editorial"] }, templates, plan: { generation: 50, render: 100, publish: 100, removeWatermark: true }, capabilities: providers.map((provider) => ({ provider, formats: ["feed", "carousel"], audio: provider === "tiktok" })), mode: "preview" };
  }
  return { schema_version: 1, createdAt: at, workspaces: { hq: state("hq"), creator: state("creator") } };
}
export {
  createPortableSeed
};
