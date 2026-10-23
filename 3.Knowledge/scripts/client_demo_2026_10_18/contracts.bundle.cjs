var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// 3.Knowledge/scripts/client_demo_2026_10_18/contracts.test.ts
var import_node_test = __toESM(require("node:test"));
var import_strict = __toESM(require("node:assert/strict"));

// 1.Frontend/packages/domain-kit/src/validation.ts
var forbidden = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
function safePath(path) {
  return typeof path === "string" && path.length > 0 && path.split(".").every((part) => /^[A-Za-z0-9_$-]+$/.test(part) && !forbidden.has(part));
}
function safeRead(data, path) {
  if (!safePath(path)) return { found: false };
  let value = data;
  try {
    for (const part of path.split(".")) {
      if (value === null || typeof value !== "object") return { found: false };
      const descriptor = Object.getOwnPropertyDescriptor(value, part);
      if (!descriptor || !("value" in descriptor)) return { found: false };
      value = descriptor.value;
    }
  } catch {
    return { found: false };
  }
  return { found: true, value };
}
function createRules(rules, options = {}) {
  const config = Array.isArray(rules) ? rules.map((rule) => ({ ...rule })) : null;
  const clone = options.clone ?? ((value) => {
    const runtime = globalThis;
    if (typeof runtime.structuredClone !== "function") throw new Error("A data clone is required.");
    return runtime.structuredClone(value);
  });
  return (data) => {
    if (!config) return [{ code: "invalid_rules", path: "", message: "Rules must be an array." }];
    const issues = [];
    for (const rule of config) {
      if (!rule || typeof rule.code !== "string" || !rule.code || typeof rule.message !== "string" || typeof rule.check !== "function" || rule.path !== void 0 && !safePath(rule.path)) {
        issues.push({ code: "invalid_rule", path: "", message: "Invalid validation rule configuration." });
        continue;
      }
      let valid = false;
      let isolated;
      try {
        isolated = clone(data);
      } catch {
        issues.push({ code: "rule_clone_failed", path: rule.path ?? "", message: "Validation input could not be isolated." });
        continue;
      }
      try {
        valid = rule.check(isolated) === true;
      } catch {
        valid = false;
      }
      if (!valid) issues.push({ code: rule.code, path: rule.path ?? "", message: rule.message });
    }
    return issues;
  };
}
var RuleValidationError = class extends Error {
  issues;
  constructor(issues) {
    super(issues.map((issue) => `${issue.path ? issue.path + ": " : ""}${issue.message}`).join("\n"));
    this.name = "RuleValidationError";
    this.issues = issues.map((issue) => ({ ...issue }));
  }
};
function assertRules(issues) {
  if (!Array.isArray(issues) || issues.some((issue) => !issue || typeof issue.code !== "string" || typeof issue.path !== "string" || typeof issue.message !== "string"))
    throw new RuleValidationError([{ code: "invalid_issues", path: "", message: "Issues must be an array of structured validation issues." }]);
  if (issues.length) throw new RuleValidationError(issues);
}

// 1.Frontend/packages/domain-kit/src/relations.ts
var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var scalar = (value) => typeof value === "string" ? value.trim().length > 0 : typeof value === "number" && Number.isSafeInteger(value);
var own = (value, key) => safeRead(value, key).value;
function validateRelations(collections, config) {
  const issues = [], add = (code, path, message) => {
    issues.push({ code, path, message });
  };
  if (!record(collections) || !record(config) || !record(config.collections) || !Array.isArray(config.references))
    return [{ code: "invalid_relation_config", path: "", message: "Collections and relation configuration must be objects with a references array." }];
  const names = Object.keys(config.collections), rows = /* @__PURE__ */ new Map();
  for (const name of Object.keys(collections)) if (!names.includes(name)) add("unknown_collection", name, "Collection is not declared in configuration.");
  for (const name of names) {
    const spec = own(config.collections, name), idField = record(spec) ? own(spec, "idField") ?? "id" : void 0;
    if (!safePath(name) || name.includes(".") || !record(spec) || !safePath(idField)) {
      add("invalid_collection_config", name, "Collection name and ID field must be safe paths.");
      continue;
    }
    const values = own(collections, name);
    if (!Array.isArray(values)) {
      add("invalid_collection", name, "Expected a collection array.");
      continue;
    }
    const accepted = [], ids = /* @__PURE__ */ new Set();
    values.forEach((value, index) => {
      const path = `${name}.${index}`;
      if (!record(value)) {
        add("invalid_row", path, "Expected an object row.");
        return;
      }
      accepted.push(value);
      const id = safeRead(value, idField).value;
      if (!scalar(id)) add("invalid_id", `${path}.${idField}`, "ID must be a non-empty string or safe integer.");
      else if (ids.has(id)) add("duplicate_id", `${path}.${idField}`, "ID must be unique within its collection.");
      else ids.add(id);
    });
    rows.set(name, accepted);
  }
  config.references.forEach((reference, refIndex) => {
    const path = `references.${refIndex}`;
    if (!record(reference) || !safePath(reference.from) || !safePath(reference.to) || !safePath(reference.field) || !rows.has(reference.from) || !rows.has(reference.to) || reference.targetField !== void 0 && !safePath(reference.targetField) || reference.optional !== void 0 && typeof reference.optional !== "boolean" || reference.scope !== void 0 && (!record(reference.scope) || !safePath(reference.scope.sourceField) || !safePath(reference.scope.targetField))) {
      add("invalid_reference_config", path, "Reference must use declared collections and safe field paths.");
      return;
    }
    const from = reference.from, to = reference.to, field = reference.field;
    const targetField = reference.targetField ?? own(own(config.collections, to), "idField") ?? "id";
    const scopeConfig = reference.scope;
    const sourceScopeField = scopeConfig && record(scopeConfig) ? scopeConfig.sourceField : void 0;
    const targetScopeField = scopeConfig && record(scopeConfig) ? scopeConfig.targetField : void 0;
    if (!safePath(targetField) || scopeConfig !== void 0 && (!safePath(sourceScopeField) || !safePath(targetScopeField))) {
      add("invalid_reference_config", path, "Reference target and scope fields must be safe paths.");
      return;
    }
    for (const [index, source] of rows.get(from).entries()) {
      const sourcePath = `${from}.${index}.${field}`, value = safeRead(source, field).value;
      if (reference.optional && (value === void 0 || value === null || value === "")) continue;
      if (!scalar(value)) {
        add("invalid_reference", sourcePath, "Reference must contain a scalar ID.");
        continue;
      }
      const scope = typeof sourceScopeField === "string" ? safeRead(source, sourceScopeField).value : void 0;
      if (scopeConfig && !scalar(scope)) {
        add("invalid_scope", `${from}.${index}.${sourceScopeField}`, "Reference scope must contain a scalar ID.");
        continue;
      }
      const matches = rows.get(to).filter((target) => safeRead(target, targetField).value === value && (typeof targetScopeField !== "string" || safeRead(target, targetScopeField).value === scope));
      if (!matches.length) add("foreign_reference", sourcePath, "Referenced row does not exist within the configured scope.");
      else if (matches.length > 1) add("ambiguous_reference", sourcePath, "Reference matches multiple target rows.");
    }
  });
  return issues;
}

// 1.Frontend/packages/domain-kit/src/attributes.ts
function validateAttribute(value, config) {
  const invalid = (code, message) => [{ code, path: config?.path ?? "", message }];
  if (!config || !["integer", "number", "text", "tag", "date", "money"].includes(config.type) || config.path !== void 0 && !safePath(config.path) || [config.min, config.max].some((bound) => bound !== void 0 && !Number.isFinite(bound)) || config.min !== void 0 && config.max !== void 0 && config.min > config.max || config.allowed !== void 0 && (!Array.isArray(config.allowed) || !config.allowed.every((tag) => typeof tag === "string")))
    return [{ code: "invalid_attribute_config", path: "", message: "Invalid attribute configuration." }];
  if (value === null || value === void 0 || value === "") return config.required ? invalid("required", "Value is required.") : [];
  if (["integer", "number", "money"].includes(config.type)) {
    if (typeof value !== "number" || !Number.isFinite(value) || config.type !== "number" && !Number.isSafeInteger(value)) return invalid("invalid_number", "Expected a finite number in the configured numeric format.");
    if (config.min !== void 0 && value < config.min || config.max !== void 0 && value > config.max) return invalid("out_of_range", "Number is outside the configured bounds.");
  } else {
    if (typeof value !== "string" || !value.trim()) return invalid("invalid_text", "Expected non-empty text.");
    if (config.min !== void 0 && value.length < config.min || config.max !== void 0 && value.length > config.max) return invalid("out_of_range", "Text length is outside the configured bounds.");
    if (config.type === "date") {
      const date = /* @__PURE__ */ new Date(value + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return invalid("invalid_date", "Expected a valid YYYY-MM-DD calendar date.");
    }
    if (config.allowed && !config.allowed.includes(value)) return invalid("invalid_choice", "Value is not in the configured choices.");
  }
  return [];
}

// 1.Frontend/HOTS/src/features/cineva-offline/domainAdapter.ts
var nonNegativeInteger = (value) => validateAttribute(value, { type: "integer", required: true, min: 0 }).length === 0;
var calendarDate = (value) => validateAttribute(value, { type: "date", required: true }).length === 0;
var cashRules = createRules([{
  code: "cash_exceeds_fee",
  message: "Kas tercatat melebihi fee; nominal fee tidak boleh kurang dari pembayaran.",
  check: (data) => {
    const total = data.payments.reduce((sum, payment) => sum + payment.amount, data.campaign.paidAmount ?? 0);
    return Number.isSafeInteger(total) && total <= data.campaign.feeAmount;
  }
}]);
var validateCash = (data) => assertRules(cashRules(data));
function validateDocumentRelations(data) {
  const { workspaces, brands, batches, tickets, assignments } = data.collections;
  const collections = { users: [data.user], campaigns: [data.campaign], workspaces, brands, batches, tickets, assignments, events: data.events, payments: data.payments, deliverables: data.deliverables };
  return validateRelations(collections, {
    collections: Object.fromEntries(Object.keys(collections).map((name) => [name, { idField: "id" }])),
    references: [
      { from: "batches", field: "campaignId", to: "campaigns" },
      { from: "assignments", field: "userId", to: "users" },
      { from: "assignments", field: "campaignId", to: "campaigns" },
      { from: "assignments", field: "ticketId", to: "tickets" },
      { from: "assignments", field: "batchId", to: "batches", scope: { sourceField: "campaignId", targetField: "campaignId" } }
    ]
  });
}

// 1.Frontend/HOTS/src/features/cineva-offline/validation.ts
function validDate(value) {
  return calendarDate(value);
}
function validateData(value) {
  if (!value || typeof value !== "object") throw new Error("Dokumen JSON tidak valid.");
  const data = value;
  if (data.version !== 1 || !data.datasetId || !data.user?.id || !data.user.name?.trim() || !data.campaign?.id || !data.campaign.title?.trim()) throw new Error("Versi, user dan campaign wajib valid.");
  if (![data.user.instagram, data.user.phone, data.user.address, data.campaign.brand, data.campaign.brief, data.campaign.objective, data.campaign.audience, data.campaign.messaging, data.campaign.sow, data.campaign.overviewPeriod, data.campaign.paymentStatus, data.campaign.selectedProduct].every((item) => typeof item === "string")) throw new Error("Field profil/campaign harus teks.");
  if (data.user.followers !== null && !nonNegativeInteger(data.user.followers)) throw new Error("Jumlah followers harus angka bulat non-negatif.");
  if (!Array.isArray(data.user.niches) || data.user.niches.some((item) => typeof item !== "string")) throw new Error("Niche harus daftar teks.");
  if (![data.campaign.feeAmount, data.campaign.barterValue, data.campaign.productRetailValue].every(nonNegativeInteger) || data.campaign.paidAmount !== null && !nonNegativeInteger(data.campaign.paidAmount)) throw new Error("Nominal harus rupiah bulat non-negatif.");
  if (![data.events, data.payments, data.deliverables, data.notes, data.rawSource].every(Array.isArray) || !data.insights || !data.source?.file || !data.collections) throw new Error("Koleksi dokumen belum lengkap.");
  const unique = (rows) => rows.every((row) => typeof row.id === "string" && row.id.trim()) && new Set(rows.map((row) => row.id)).size === rows.length;
  for (const rows of [data.events, data.payments, data.deliverables, data.collections.workspaces, data.collections.brands, data.collections.batches, data.collections.tickets, data.collections.assignments]) if (!Array.isArray(rows) || !unique(rows)) throw new Error("ID setiap koleksi wajib unik.");
  for (const event of data.events) {
    if (!event.title?.trim() || !["visit", "milestone"].includes(event.kind) || event.allDay !== true || typeof event.requiresReview !== "boolean" || typeof event.note !== "string" || typeof event.rawDate !== "string" || typeof event.sourceCell !== "string") throw new Error("Jadwal tidak valid.");
    if (event.startDate !== null && !validDate(event.startDate) || event.endDate !== null && !validDate(event.endDate) || event.endDate && (!event.startDate || event.endDate < event.startDate)) throw new Error("Tanggal atau rentang jadwal tidak valid.");
    if (!event.startDate && !event.requiresReview) throw new Error("Jadwal tanpa tanggal harus ditandai perlu review.");
  }
  for (const payment of data.payments) if (!nonNegativeInteger(payment.amount) || payment.amount <= 0 || !validDate(payment.paidAt) || !payment.evidence?.trim()) throw new Error("Pembayaran simulasi memerlukan nominal, tanggal dan bukti.");
  validateCash(data);
  for (const key of ["likes", "comments", "shares", "saves", "reposts", "views"]) if (data.insights[key] !== null && !nonNegativeInteger(data.insights[key])) throw new Error("Metrik harus angka bulat non-negatif atau null.");
  for (const output of data.deliverables) if (![output.title, output.platform, output.sourceUrl, output.status].every((item) => typeof item === "string") || !output.title.trim()) throw new Error("Deliverable tidak valid.");
  if (typeof data.insights.sourceCategory !== "string" || data.notes.some((note) => typeof note !== "string")) throw new Error("Catatan dan kategori sumber harus teks.");
  const collections = data.collections;
  if (validateDocumentRelations(data).length) throw new Error("Relasi assignment/ticket/campaign/batch tidak valid.");
  for (const ticket of collections.tickets) if (ticket.module !== "hots:cineva" || !Array.isArray(ticket.fields) || ticket.fields.some((field) => !field.cstm_col || !field.lbl_col || !["string", "number"].includes(typeof field.value) && field.value !== null)) throw new Error("Kontrak EAV ticket wajib cstm_col, lbl_col, value.");
}

// 3.Knowledge/scripts/client_demo_2026_10_18/fixture.ts
function syntheticData() {
  return {
    version: 1,
    datasetId: "synthetic-cineva-demo",
    editedAt: null,
    user: { id: "creator-demo", name: "Kreator Simulasi", instagram: "@creator_simulasi", followers: 1500, niches: ["Lifestyle"], phone: "DUMMY", address: "Studio dummy" },
    campaign: { id: "campaign-demo", title: "Campaign Simulasi", brand: "Brand Dummy", brief: "Brief sintetis", objective: "Pengenalan produk", audience: "Audiens simulasi", messaging: "Cerita produk dummy", sow: "Satu video simulasi", overviewPeriod: "Oktober 2026", feeAmount: 3e5, barterValue: 15e4, productRetailValue: 125e3, paymentStatus: "Belum diverifikasi", paidAmount: null, selectedProduct: "Produk dummy A" },
    insights: { likes: 20, comments: 5, shares: 3, saves: 2, reposts: 0, views: 500, sourceCategory: "Kategori sumber dummy" },
    deliverables: [{ id: "deliverable-demo", title: "Video dummy", platform: "Instagram", sourceUrl: "https://example.invalid/draft-demo", status: "Draft" }],
    events: [
      { id: "milestone-demo", title: "Draft konten", kind: "milestone", startDate: "2026-10-24", endDate: "2026-10-24", allDay: true, rawDate: "24 Oktober 2026", sourceCell: "S24", requiresReview: false, note: "Tanggal fixture" },
      { id: "visit-demo", title: "Visit studio", kind: "visit", startDate: "2026-10-25", endDate: "2026-10-26", allDay: true, rawDate: "25\u201326 Oktober 2026", sourceCell: "T24", requiresReview: false, note: "" },
      { id: "ambiguous-demo", title: "Deadline perlu review", kind: "milestone", startDate: null, endDate: null, allDay: true, rawDate: "minggu depan / tahun belum jelas", sourceCell: "T25", requiresReview: true, note: "Jangan menebak tanggal sumber." }
    ],
    payments: [],
    source: { file: "synthetic.xlsx", sheet: "Fixture", rosterRow: 1, insightRow: 2, sha256: "a".repeat(64) },
    notes: ["Fixture khusus tes; bukan data client."],
    rawSource: [{ label: "Catatan dummy", value: "Sumber sintetis" }],
    collections: {
      workspaces: [{ id: "hq-demo", name: "HQ Dummy", product: "hq" }, { id: "creator-demo", name: "Creator Dummy", product: "creator" }],
      brands: [{ id: "brand-demo", name: "Brand Dummy", contact: "PIC dummy" }],
      batches: [{ id: "batch-demo", campaignId: "campaign-demo", name: "Batch dummy" }],
      tickets: [{ id: "ticket-demo", module: "hots:cineva", status: "running", fields: [{ cstm_col: "title", lbl_col: "Judul", value: "Assignment dummy" }, { cstm_col: "fee_amount", lbl_col: "Fee", value: 3e5 }] }],
      assignments: [{ id: "assignment-demo", ticketId: "ticket-demo", campaignId: "campaign-demo", batchId: "batch-demo", userId: "creator-demo" }]
    }
  };
}

// 3.Knowledge/scripts/client_demo_2026_10_18/contracts.test.ts
(0, import_node_test.default)("Complete synthetic portable document retains HOTS EAV and unresolved source values", () => {
  const data = syntheticData();
  validateData(data);
  import_strict.default.equal(data.campaign.paidAmount, null);
  import_strict.default.equal(data.events[2].startDate, null);
  import_strict.default.equal(data.events[2].requiresReview, true);
  import_strict.default.equal(data.events[2].rawDate, "minggu depan / tahun belum jelas");
  import_strict.default.equal(data.collections.tickets[0].fields[1].cstm_col, "fee_amount");
});
(0, import_node_test.default)("Fee and followers reject negative, fractional and nonfinite quantities", () => {
  for (const value of [-1, 1.5, NaN, Infinity]) {
    const fee = syntheticData();
    fee.campaign.feeAmount = value;
    import_strict.default.throws(() => validateData(fee));
    const followers = syntheticData();
    followers.user.followers = value;
    import_strict.default.throws(() => validateData(followers));
  }
  const unknown = syntheticData();
  unknown.user.followers = null;
  validateData(unknown);
});
(0, import_node_test.default)("Partial payments remain separate from source paid amount and cannot exceed fee", () => {
  const data = syntheticData();
  data.payments.push({ id: "payment-1", amount: 1e5, paidAt: "2026-10-25", evidence: "Dummy evidence" });
  validateData(data);
  import_strict.default.equal(data.campaign.paidAmount, null);
  data.payments.push({ id: "payment-2", amount: 200001, paidAt: "2026-10-26", evidence: "Dummy evidence two" });
  import_strict.default.throws(() => validateData(data));
});
(0, import_node_test.default)("Calendar rejects invalid, reversed and end-without-start dates without guessing ambiguous text", () => {
  const invalid = syntheticData();
  invalid.events[0].startDate = "2026-02-31";
  import_strict.default.throws(() => validateData(invalid));
  const reversed = syntheticData();
  reversed.events[1].endDate = "2026-10-24";
  import_strict.default.throws(() => validateData(reversed));
  const noStart = syntheticData();
  noStart.events[2].endDate = "2026-10-24";
  import_strict.default.throws(() => validateData(noStart));
  const payment = syntheticData();
  payment.payments.push({ id: "p", amount: 1, paidAt: "2026-99-31", evidence: "Dummy" });
  import_strict.default.throws(() => validateData(payment));
});
(0, import_node_test.default)("Assignments reject foreign ticket, campaign, batch and user references", () => {
  for (const field of ["ticketId", "campaignId", "batchId", "userId"]) {
    const data = syntheticData();
    data.collections.assignments[0][field] = "foreign";
    import_strict.default.throws(() => validateData(data));
  }
  const batch = syntheticData();
  batch.collections.batches[0].campaignId = "foreign";
  import_strict.default.throws(() => validateData(batch));
});
(0, import_node_test.default)("Duplicate IDs are rejected in operational collections and editable arrays", () => {
  for (const field of ["events", "deliverables"]) {
    const data = syntheticData();
    data[field].push(structuredClone(data[field][0]));
    import_strict.default.throws(() => validateData(data));
  }
  for (const field of ["workspaces", "brands", "batches", "tickets", "assignments"]) {
    const data = syntheticData();
    data.collections[field].push(structuredClone(data.collections[field][0]));
    import_strict.default.throws(() => validateData(data));
  }
});
(0, import_node_test.default)("Source-like script text stays valid literal content; validation never interprets it", () => {
  const data = syntheticData(), text = "<script>globalThis.syntheticShouldNeverRun = true</script>";
  data.campaign.brief = text;
  data.notes.push(text);
  data.rawSource.push({ value: text });
  validateData(data);
  import_strict.default.equal(data.campaign.brief, text);
  import_strict.default.equal(globalThis.syntheticShouldNeverRun, void 0);
});
