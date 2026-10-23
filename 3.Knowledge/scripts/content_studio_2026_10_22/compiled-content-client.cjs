"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// 1.Frontend/packages/engine-client/src/content.ts
var content_exports = {};
__export(content_exports, {
  createContentClient: () => createContentClient
});
module.exports = __toCommonJS(content_exports);

// 1.Frontend/packages/engine-client/src/core/request.ts
var EngineApiError = class extends Error {
  constructor(status, code, message, details, extra = {}) {
    super(message);
    this.name = "EngineApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = extra.traceId;
    this.errors = extra.errors;
  }
};
function cleanParams(params) {
  if (!params) return void 0;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== void 0 && v !== null && v !== ""));
}
function createEngineCall(http, basePath, errorCode = "ENGINE_API_ERROR") {
  const base = basePath.replace(/\/+$/, "");
  return async (method, path, options = {}) => {
    try {
      const res = await http.request({
        method,
        url: `${base}${path}`,
        data: options.data,
        params: cleanParams(options.params),
        headers: options.headers,
        ...options.config
      });
      const body = res.data;
      if (body && typeof body === "object" && body.success === false) {
        const b = body;
        throw new EngineApiError(res.status, b.error?.code || b.code || errorCode, b.error?.message || b.detail || b.message || "Request failed", b.error?.details ?? b.details, {
          traceId: b.trace_id,
          errors: Array.isArray(b.errors) ? b.errors : void 0
        });
      }
      if (options.raw) return body;
      return body && typeof body === "object" && "data" in body ? body.data : body;
    } catch (err) {
      if (err instanceof EngineApiError) throw err;
      const status = err?.response?.status ?? 0;
      const body = err?.response?.data ?? {};
      throw new EngineApiError(
        status,
        body.error?.code || body.code || (status === 401 ? "SESSION_EXPIRED" : errorCode),
        body.error?.message || body.detail || body.message || body.title || err?.message || `Request failed (${status})`,
        body.error?.details ?? body.details,
        { traceId: body.trace_id ?? err?.response?.headers?.["x-request-id"], errors: Array.isArray(body.errors) ? body.errors : void 0 }
      );
    }
  };
}

// 1.Frontend/packages/engine-client/src/content.ts
function createContentClient(http, { context, basePath = "/api/content/v1" }) {
  if (!/^\/api(?:\/[a-z0-9_-]+)+$/i.test(basePath)) throw new Error("Invalid content API path");
  const call = createEngineCall(http, basePath);
  async function request(path, body) {
    const before = context();
    if (!before) throw new EngineApiError(403, "CONTENT_CONTEXT_REQUIRED", "Pilih workspace terlebih dahulu.");
    const result = await call(body === void 0 ? "get" : "post", path, { data: body, headers: { "X-Workspace-Context": before } });
    if (context() !== before) throw new EngineApiError(409, "STALE_CONTENT_CONTEXT", "Workspace berubah. Muat ulang data.");
    return result;
  }
  return { creatorInfo: (accountId) => request("/accounts/creator-info", { accountId }), read: () => request("/workspace"), command: (body) => request("/commands", body), generate: (body) => request("/generate", body), render: (body) => request("/render", body), insight: (body) => request("/insights/ai", body), sync: () => request("/insights/sync", {}), reconcile: (targetId) => request("/reconcile", { targetId }), begin: (provider, binding) => request("/accounts/begin", { provider, binding }), finish: (body) => request("/accounts/finish", body) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createContentClient
});
