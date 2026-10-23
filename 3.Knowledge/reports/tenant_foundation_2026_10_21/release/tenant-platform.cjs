"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// 1.Frontend/packages/tenant-contracts/src/index.cjs
var require_src = __commonJS({
  "1.Frontend/packages/tenant-contracts/src/index.cjs"(exports2, module2) {
    "use strict";
    var CONTRACT_VERSION = 1;
    var TenantError = class extends Error {
      constructor(code, status = 403) {
        super(code);
        this.name = "TenantError";
        this.code = code;
        this.status = status;
      }
    };
    function requiredString(value, name, max = 200) {
      if (typeof value !== "string" || !value || value !== value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new TenantError(`INVALID_${name}`, 400);
      return value;
    }
    function tenantKey(value) {
      requiredString(value, "TENANT_KEY", 64);
      if (!/^[a-z][a-z0-9_-]*$/.test(value)) throw new TenantError("INVALID_TENANT_KEY", 400);
      return value;
    }
    function companyId(value) {
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new TenantError("INVALID_COMPANY_ID", 400);
      return value;
    }
    function normalizeContext(input) {
      if (!input || input.schema_version !== CONTRACT_VERSION) throw new TenantError("INVALID_CONTEXT_VERSION", 400);
      return Object.freeze({
        schema_version: CONTRACT_VERSION,
        tenant_key: tenantKey(input.tenant_key),
        company_id: companyId(input.company_id),
        user_id: requiredString(input.user_id, "USER_ID"),
        membership_version: requiredString(input.membership_version, "MEMBERSHIP_VERSION")
      });
    }
    function contextKey(context, ...parts) {
      const c = normalizeContext(context);
      if (parts.some((p) => typeof p !== "string" || p.length > 500)) throw new TenantError("INVALID_CACHE_KEY", 400);
      return JSON.stringify([c.schema_version, c.tenant_key, c.company_id, c.user_id, c.membership_version, ...parts]);
    }
    var TOKENS = /* @__PURE__ */ new Set(["primary", "primary-foreground", "background", "foreground", "card", "card-foreground", "sidebar-background", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground", "ring"]);
    function validateBrand(input) {
      if (!input || input.schema_version !== 1 || !Number.isSafeInteger(input.revision) || input.revision <= 0) throw new TenantError("INVALID_BRAND_VERSION", 400);
      const brand = input.brand;
      if (!brand || !input.tokens || typeof input.tokens !== "object" || Array.isArray(input.tokens)) throw new TenantError("INVALID_BRAND", 400);
      const tokens = {};
      for (const [key, value] of Object.entries(input.tokens)) {
        if (!TOKENS.has(key) || typeof value !== "string" || !/^\d{1,3}(?:\.\d+)? \d{1,3}(?:\.\d+)?% \d{1,3}(?:\.\d+)?%$/.test(value)) throw new TenantError("INVALID_BRAND_TOKEN", 400);
        const [h, s, l] = value.split(" ").map((v) => Number(v.replace("%", "")));
        if (h > 360 || s > 100 || l > 100) throw new TenantError("INVALID_BRAND_TOKEN", 400);
        tokens[key] = value;
      }
      let asset;
      if (input.asset != null) {
        const a = input.asset;
        if (a.tenant_key !== input.tenant_key || a.company_id !== input.company_id || a.asset_id !== brand.logo_asset_id || !["image/png", "image/jpeg", "image/webp"].includes(a.mime_type)) throw new TenantError("INVALID_BRAND_ASSET", 400);
        let url;
        try {
          url = new URL(a.url);
        } catch {
          throw new TenantError("INVALID_BRAND_ASSET", 400);
        }
        if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new TenantError("INVALID_BRAND_ASSET", 400);
        asset = Object.freeze({ asset_id: requiredString(a.asset_id, "ASSET_ID"), tenant_key: tenantKey(a.tenant_key), company_id: companyId(a.company_id), url: url.href, mime_type: a.mime_type });
      }
      return Object.freeze({ schema_version: 1, revision: input.revision, tenant_key: tenantKey(input.tenant_key), company_id: companyId(input.company_id), brand: Object.freeze({ display_name: requiredString(brand.display_name, "BRAND_NAME", 100), logo_asset_id: brand.logo_asset_id == null ? null : requiredString(brand.logo_asset_id, "ASSET_ID") }), tokens: Object.freeze(tokens), ...asset ? { asset } : {} });
    }
    function assertOwner(context, resource) {
      const c = normalizeContext(context);
      if (!resource || resource.tenant_key !== c.tenant_key || resource.company_id !== c.company_id) throw new TenantError("RESOURCE_NOT_FOUND", 404);
      return resource;
    }
    module2.exports = { CONTRACT_VERSION, TenantError, requiredString, tenantKey, companyId, normalizeContext, contextKey, validateBrand, assertOwner };
  }
});

// 2.Backend/packages/tenant-server/src/invitations.js
var require_invitations = __commonJS({
  "2.Backend/packages/tenant-server/src/invitations.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, requiredString } = require_src();
    function createInvitationService({ authorizeContext, resolvePrincipal, resolveRole, unitOfWork, invites, grantMembership, clock = Date.now }) {
      for (const fn of [authorizeContext, resolvePrincipal, resolveRole, unitOfWork?.run, invites?.insert, invites?.lockByHash, invites?.markAccepted, grantMembership]) if (typeof fn !== "function") throw new Error("Invitation transaction, policy and persistence adapters required");
      const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");
      return {
        async issue(context, { invitee_user_id, role_key }) {
          await authorizeContext(context, "memberships.invite");
          requiredString(invitee_user_id, "INVITEE_USER_ID");
          requiredString(role_key, "ROLE_KEY");
          const role = await resolveRole(context, role_key);
          if (!role || !Array.isArray(role.permissions) || role.permissions.some((p) => typeof p !== "string" || !p || p === "*")) throw new TenantError("ROLE_NOT_DELEGATABLE");
          const token = crypto.randomBytes(32).toString("base64url");
          const invitation = { tenant_key: context.tenant_key, company_id: context.company_id, invitee_user_id, role_key, permissions: [...role.permissions], token_hash: hash(token), expires_at: clock() + 24 * 60 * 60 * 1e3, issued_by: context.user_id };
          await unitOfWork.run((connection) => invites.insert(connection, invitation));
          return { token, expires_at: invitation.expires_at };
        },
        async accept(req, token) {
          if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new TenantError("INVALID_INVITATION", 400);
          const principal = await resolvePrincipal(req);
          return unitOfWork.run(async (connection) => {
            const invitation = await invites.lockByHash(connection, hash(token));
            if (!invitation || invitation.accepted_at || invitation.revoked_at || !Number.isFinite(invitation.expires_at) || invitation.expires_at <= clock() || invitation.invitee_user_id !== principal.identity.user_id || invitation.tenant_key !== principal.tenant_key) throw new TenantError("INVALID_INVITATION");
            const role = await resolveRole({ tenant_key: invitation.tenant_key, company_id: invitation.company_id, user_id: invitation.issued_by }, invitation.role_key);
            if (!role || !Array.isArray(role.permissions) || role.permissions.some((p) => typeof p !== "string" || !p || p === "*")) throw new TenantError("ROLE_NOT_DELEGATABLE");
            const membership = await grantMembership(connection, { ...invitation, permissions: [...role.permissions] }, { current_role: role });
            if (!membership || membership.tenant_key !== invitation.tenant_key || membership.company_id !== invitation.company_id) throw new TenantError("INVALID_MEMBERSHIP");
            if (membership.user_id !== principal.identity.user_id) throw new TenantError("INVALID_MEMBERSHIP");
            await invites.markAccepted(connection, invitation.token_hash, clock());
            return { tenant_key: membership.tenant_key, company_id: membership.company_id };
          });
        }
      };
    }
    module2.exports = { createInvitationService };
  }
});

// 2.Backend/packages/tenant-server/src/index.js
var require_src2 = __commonJS({
  "2.Backend/packages/tenant-server/src/index.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, requiredString, tenantKey, companyId, normalizeContext, assertOwner, validateBrand } = require_src();
    function createTenantEngine({ resolveIdentity, resolveTenant, memberships, contextStore, branding, clock = Date.now, contextTtlMs = 15 * 60 * 1e3 }) {
      if (!Number.isSafeInteger(contextTtlMs) || contextTtlMs <= 0) throw new Error("Finite positive context TTL required");
      for (const fn of [resolveIdentity, resolveTenant, memberships?.list, memberships?.get, contextStore?.put, contextStore?.get]) if (typeof fn !== "function") throw new Error("Trusted identity, tenant, membership and context adapters required");
      const issued = /* @__PURE__ */ new WeakMap();
      async function principal(req) {
        const identity = await resolveIdentity(req);
        if (!identity || identity.active !== true) throw new TenantError("AUTHENTICATION_REQUIRED", 401);
        requiredString(identity.user_id, "USER_ID");
        requiredString(identity.session_id, "SESSION_ID");
        return { identity, tenant_key: tenantKey(await resolveTenant(req)) };
      }
      function activeMembership(member, actor, company) {
        if (!member || member.active !== true || member.user_id !== actor.identity.user_id || member.tenant_key !== actor.tenant_key || member.company_id !== company || member.expires_at != null && (!Number.isFinite(member.expires_at) || member.expires_at <= clock())) throw new TenantError("MEMBERSHIP_REQUIRED");
        requiredString(member.version, "MEMBERSHIP_VERSION");
        if (!Array.isArray(member.permissions) || member.permissions.some((p) => typeof p !== "string" || !p || p === "*")) throw new TenantError("INVALID_MEMBERSHIP");
        return member;
      }
      async function bootstrap(req) {
        const actor = await principal(req), rows = await memberships.list(actor.identity.user_id, actor.tenant_key);
        const companies = [];
        for (const member of rows) {
          if (member.active !== true || member.expires_at != null && member.expires_at <= clock()) continue;
          activeMembership(member, actor, companyId(member.company_id));
          companies.push({ company_id: member.company_id, company_name: requiredString(member.company_name, "COMPANY_NAME") });
        }
        return { user_id: actor.identity.user_id, tenant_key: actor.tenant_key, companies };
      }
      async function select(req, requestedCompany) {
        const actor = await principal(req), id = companyId(requestedCompany);
        const member = activeMembership(await memberships.get(actor.identity.user_id, actor.tenant_key, id), actor, id);
        const context = normalizeContext({ schema_version: 1, tenant_key: actor.tenant_key, company_id: id, user_id: actor.identity.user_id, membership_version: member.version });
        const context_id = crypto.randomBytes(32).toString("base64url");
        await contextStore.put(context_id, { context, session_id: actor.identity.session_id, expires_at: clock() + contextTtlMs });
        return { context_id, context };
      }
      async function authorize(req, contextId, permission) {
        const actor = await principal(req);
        if (typeof contextId !== "string" || !/^[a-zA-Z0-9_-]{43}$/.test(contextId)) throw new TenantError("CONTEXT_REQUIRED");
        const stored = await contextStore.get(contextId);
        if (!stored || stored.expires_at <= clock() || stored.session_id !== actor.identity.session_id || stored.context.user_id !== actor.identity.user_id || stored.context.tenant_key !== actor.tenant_key) throw new TenantError("CONTEXT_EXPIRED");
        const context = normalizeContext(stored.context);
        const member = activeMembership(await memberships.get(context.user_id, context.tenant_key, context.company_id), actor, context.company_id);
        if (member.version !== context.membership_version) throw new TenantError("MEMBERSHIP_CHANGED");
        if (!member.permissions.includes(permission)) throw new TenantError("PERMISSION_DENIED");
        issued.set(context, { permissions: new Set(member.permissions), req, contextId });
        return context;
      }
      function assertContext(context, permission) {
        if (!issued.has(context)) throw new TenantError("UNVERIFIED_CONTEXT");
        if (!issued.get(context).permissions.has(permission)) throw new TenantError("PERMISSION_DENIED");
      }
      async function revalidate(context, permission) {
        assertContext(context, permission);
        const { req, contextId } = issued.get(context);
        await authorize(req, contextId, permission);
      }
      async function brand(context) {
        await revalidate(context, "brand.read");
        if (!branding?.get) throw new TenantError("BRANDING_NOT_CONFIGURED", 503);
        const result = validateBrand({ ...await branding.get(context), asset: void 0 });
        assertOwner(context, result);
        if (result.brand.logo_asset_id) {
          if (!branding.canReadAsset || !await branding.canReadAsset(context, result.brand.logo_asset_id) || !branding.resolveAsset) throw new TenantError("INVALID_BRAND_ASSET");
          const asset = await branding.resolveAsset(context, result.brand.logo_asset_id);
          if (!asset) throw new TenantError("INVALID_BRAND_ASSET");
          return validateBrand({ ...result, asset });
        }
        return result;
      }
      function repository(adapter) {
        if (!adapter?.get) throw new Error("Scoped repository adapter required");
        return {
          async get(context, id) {
            await revalidate(context, "resources.read");
            const row = await adapter.get(context, id);
            assertOwner(context, row);
            return row;
          },
          async list(context, query) {
            await revalidate(context, "resources.read");
            const result = await adapter.list(context, query);
            if (!result || !Array.isArray(result.rows) || !Number.isSafeInteger(result.total) || result.total < result.rows.length) throw new TenantError("INVALID_REPOSITORY_RESULT", 500);
            for (const row of result.rows) assertOwner(context, row);
            return result;
          },
          async update(context, id, patch, unitOfWork) {
            await revalidate(context, "resources.write");
            if (!unitOfWork?.run || !adapter.update || !adapter.getForUpdate) throw new TenantError("TRANSACTION_ADAPTER_REQUIRED", 503);
            const clean = { ...patch };
            if (["tenant_key", "company_id", "user_id", "id"].some((key) => Object.hasOwn(clean, key))) throw new TenantError("OWNER_CHANGE_FORBIDDEN");
            return unitOfWork.run(async (connection) => {
              assertOwner(context, await adapter.getForUpdate(connection, context, id));
              const result = await adapter.update(connection, context, id, clean);
              assertOwner(context, result);
              await revalidate(context, "resources.write");
              return result;
            });
          }
        };
      }
      return {
        bootstrap,
        select,
        authorize,
        brand,
        repository,
        invitations(adapters) {
          return require_invitations().createInvitationService({ ...adapters, authorizeContext: revalidate, resolvePrincipal: principal });
        }
      };
    }
    function createRegistrationService({ unitOfWork, users, resolveRegistrationIdentity }) {
      if (!unitOfWork?.run || !users?.createPersonalClient || typeof resolveRegistrationIdentity !== "function") throw new Error("Registration persistence and identity verification adapters required");
      return { async register(input) {
        const identity = await resolveRegistrationIdentity(input);
        if (!identity || identity.verified !== true) throw new TenantError("VERIFIED_IDENTITY_REQUIRED", 401);
        requiredString(identity.issuer, "ISSUER");
        requiredString(identity.subject, "SUBJECT");
        return unitOfWork.run(async (connection) => {
          const account = await users.createPersonalClient(connection, { issuer: identity.issuer, subject: identity.subject, active: true, account_type: "client" });
          return { user_id: requiredString(account.user_id, "USER_ID"), active: true, account_type: "client", companies: [] };
        });
      } };
    }
    module2.exports = { createTenantEngine, createRegistrationService, TenantError };
  }
});

// 2.Backend/packages/tenant-server/src/oidc.js
var require_oidc = __commonJS({
  "2.Backend/packages/tenant-server/src/oidc.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, requiredString } = require_src();
    function createOidcBridge({ config, transactions, verifyIdToken, fetchImpl = fetch, clock = Date.now }) {
      for (const key of ["issuer", "authorization_endpoint", "token_endpoint", "redirect_uri"]) {
        const url = new URL(config[key]);
        if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new Error("OIDC requires explicit HTTPS URLs");
      }
      if (new URL(config.authorization_endpoint).origin !== new URL(config.issuer).origin || new URL(config.token_endpoint).origin !== new URL(config.issuer).origin) throw new Error("Unexpected IdP endpoint origin");
      requiredString(config.client_id, "CLIENT_ID");
      requiredString(config.client_secret, "CLIENT_SECRET", 4096);
      if (!transactions?.put || !transactions?.consume || typeof verifyIdToken !== "function") throw new Error("Atomic transaction store and cryptographic verifier required");
      const random = () => crypto.randomBytes(32).toString("base64url");
      return {
        async begin(sessionBinding, returnTo = "/") {
          requiredString(sessionBinding, "SESSION_BINDING");
          if (typeof returnTo !== "string" || !/^\/(?!\/)/.test(returnTo) || /[\\\u0000-\u001f]/.test(returnTo)) throw new TenantError("INVALID_RETURN_PATH", 400);
          const state = random(), verifier = random(), nonce = random();
          await transactions.put(state, { sessionBinding, verifier, nonce, returnTo, expires_at: clock() + 5 * 60 * 1e3 });
          const url = new URL(config.authorization_endpoint);
          Object.entries({ client_id: config.client_id, response_type: "code", scope: "openid profile email", redirect_uri: config.redirect_uri, state, nonce, code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).forEach(([key, value]) => url.searchParams.set(key, value));
          return url.href;
        },
        async finish({ code, state, sessionBinding }) {
          requiredString(code, "AUTHORIZATION_CODE", 4096);
          requiredString(state, "OIDC_STATE");
          requiredString(sessionBinding, "SESSION_BINDING");
          const tx = await transactions.consume(state);
          if (!tx || tx.expires_at <= clock() || tx.sessionBinding !== sessionBinding) throw new TenantError("INVALID_OIDC_TRANSACTION", 401);
          const response = await fetchImpl(config.token_endpoint, { method: "POST", redirect: "error", signal: AbortSignal.timeout(1e4), headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${encodeURIComponent(config.client_id)}:${encodeURIComponent(config.client_secret)}`).toString("base64")}` }, body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: tx.verifier, redirect_uri: config.redirect_uri }) });
          if (!response.ok) throw new TenantError("OIDC_EXCHANGE_FAILED", 401);
          const tokens = await response.json();
          if (typeof tokens.id_token !== "string") throw new TenantError("OIDC_ID_TOKEN_REQUIRED", 401);
          let claims;
          try {
            claims = await verifyIdToken(tokens.id_token, { issuer: config.issuer, audience: config.client_id, algorithms: ["RS256"] });
          } catch {
            throw new TenantError("OIDC_ID_TOKEN_INVALID", 401);
          }
          if (!claims || typeof claims !== "object") throw new TenantError("OIDC_ID_TOKEN_INVALID", 401);
          const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
          if (claims.iss !== config.issuer || !audiences.includes(config.client_id) || audiences.length > 1 && claims.azp !== config.client_id || claims.azp != null && claims.azp !== config.client_id || claims.nonce !== tx.nonce || !Number.isFinite(claims.exp) || claims.exp * 1e3 <= clock() || !Number.isFinite(claims.iat) || claims.iat * 1e3 > clock() + 5e3) throw new TenantError("INVALID_ID_TOKEN_CLAIMS", 401);
          return { identity: { issuer: config.issuer, subject: requiredString(claims.sub, "SUBJECT"), verified: true }, returnTo: tx.returnTo };
        }
      };
    }
    module2.exports = { createOidcBridge };
  }
});

// 2.Backend/packages/tenant-server/src/session.js
var require_session = __commonJS({
  "2.Backend/packages/tenant-server/src/session.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, requiredString } = require_src();
    function readCookie(req, name) {
      const matches = String(req.headers?.cookie || "").split(";").map((v) => v.trim()).filter((v) => v.startsWith(`${name}=`));
      if (matches.length !== 1) return null;
      try {
        return decodeURIComponent(matches[0].slice(name.length + 1));
      } catch {
        return null;
      }
    }
    function setCookie(res, cookie) {
      const previous = res.getHeader("Set-Cookie");
      res.setHeader("Set-Cookie", [...Array.isArray(previous) ? previous : previous ? [previous] : [], cookie]);
    }
    function createAppSessionManager({ store, resolveUser, origin, cookieName = "__Host-cineva_session", csrfCookieName = "cineva_csrf", ttlMs = 8 * 60 * 60 * 1e3, clock = Date.now }) {
      if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new Error("Finite positive session TTL required");
      if (new URL(origin).origin !== origin || !origin.startsWith("https://")) throw new Error("Explicit HTTPS app origin required");
      if (!/^__Host-[a-z0-9_-]+$/i.test(cookieName) || !/^[a-z0-9_-]+$/i.test(csrfCookieName)) throw new Error("Invalid application cookie names");
      if (!store?.get || !store?.put || !store?.delete || typeof resolveUser !== "function") throw new Error("Persistent session store and active user resolver required");
      const options = "; Path=/; Secure; SameSite=Lax";
      async function read(req) {
        const sid = readCookie(req, cookieName);
        if (!sid || !/^[A-Za-z0-9_-]{43}$/.test(sid)) throw new TenantError("AUTHENTICATION_REQUIRED", 401);
        const session = await store.get(sid);
        if (!session || session.expires_at <= clock()) throw new TenantError("SESSION_EXPIRED", 401);
        const user = await resolveUser(session.user_id);
        if (!user || user.active !== true || user.user_id !== session.user_id) throw new TenantError("ACCOUNT_INACTIVE", 401);
        return { session, sid };
      }
      return {
        async issue(res, userId) {
          requiredString(userId, "USER_ID");
          const user = await resolveUser(userId);
          if (!user || user.active !== true || user.user_id !== userId) throw new TenantError("ACCOUNT_INACTIVE", 401);
          const sid = crypto.randomBytes(32).toString("base64url"), csrf = crypto.randomBytes(32).toString("base64url");
          await store.put(sid, { user_id: userId, csrf, expires_at: clock() + ttlMs });
          setCookie(res, `${cookieName}=${sid}${options}; HttpOnly; Max-Age=${Math.floor(ttlMs / 1e3)}`);
          setCookie(res, `${csrfCookieName}=${csrf}${options}; Max-Age=${Math.floor(ttlMs / 1e3)}`);
        },
        async resolveIdentity(req) {
          const { session, sid } = await read(req);
          return { user_id: session.user_id, session_id: sid, active: true };
        },
        async assertMutation(req) {
          if (req.headers.origin !== origin) throw new TenantError("INVALID_ORIGIN");
          const { session } = await read(req), token = req.headers["x-csrf-token"];
          if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf))) throw new TenantError("INVALID_CSRF");
        },
        async revoke(req, res) {
          await this.assertMutation(req);
          const { sid } = await read(req);
          await store.delete(sid);
          setCookie(res, `${cookieName}=${options}; HttpOnly; Max-Age=0`);
          setCookie(res, `${csrfCookieName}=${options}; Max-Age=0`);
        }
      };
    }
    module2.exports = { createAppSessionManager, readCookie, setCookie };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/errors.js
var require_errors = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/errors.js"(exports2, module2) {
    var TxError = class extends Error {
      constructor(code, message, { status = 400, details } = {}) {
        super(message);
        this.name = "TxError";
        this.code = code;
        this.status = status;
        this.details = details;
      }
    };
    var TX_ERRORS = {
      VALIDATION: "TX_VALIDATION",
      UNKNOWN_TYPE: "TX_UNKNOWN_TYPE",
      NOT_FOUND: "TX_NOT_FOUND",
      CONFLICT: "TX_CONFLICT",
      INSUFFICIENT_STOCK: "TX_INSUFFICIENT_STOCK",
      BUSY: "TX_BUSY",
      RULE_VIOLATION: "TX_RULE_VIOLATION"
    };
    var validation = (message, details) => new TxError(TX_ERRORS.VALIDATION, message, { status: 400, details });
    var notFound = (message, details) => new TxError(TX_ERRORS.NOT_FOUND, message, { status: 404, details });
    var conflict = (message, details) => new TxError(TX_ERRORS.CONFLICT, message, { status: 409, details });
    var busy = (message, details) => new TxError(TX_ERRORS.BUSY, message, { status: 503, details });
    var ruleViolation = (message, details) => new TxError(TX_ERRORS.RULE_VIOLATION, message, { status: 422, details });
    var insufficientStock = (message, details) => new TxError(TX_ERRORS.INSUFFICIENT_STOCK, message, { status: 409, details });
    var RETRYABLE_DB_CODES = /* @__PURE__ */ new Set(["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"]);
    var isRetryable = (err) => Boolean(err && RETRYABLE_DB_CODES.has(err.code));
    var isDuplicate = (err) => Boolean(err && err.code === "ER_DUP_ENTRY");
    module2.exports = { TxError, TX_ERRORS, validation, notFound, conflict, busy, ruleViolation, insufficientStock, isRetryable, isDuplicate };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/engine.js
var require_engine = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/engine.js"(exports2, module2) {
    var { TxError, TX_ERRORS, validation, isRetryable, isDuplicate } = require_errors();
    function createTransactionEngine({ adapter, idempotency, outbox, logger = console, maxRetries = 2, now = () => /* @__PURE__ */ new Date() } = {}) {
      if (!adapter || typeof adapter.acquire !== "function") throw new Error("transaction-kit: adapter with acquire() is required");
      const types = /* @__PURE__ */ new Map();
      function registerType(type) {
        if (!type || !type.name) throw new Error("transaction-kit: type.name is required");
        if (typeof type.execute !== "function") throw new Error(`transaction-kit: type ${type.name} needs execute()`);
        types.set(type.name, type);
        return type;
      }
      async function run(typeName, input = {}, opts = {}) {
        const type = types.get(typeName);
        if (!type) throw new TxError(TX_ERRORS.UNKNOWN_TYPE, `Unknown transaction type: ${typeName}. Available: ${[...types.keys()].join(", ")}`);
        const ctx = { actor: opts.actor || null, now: now(), meta: opts.meta || {}, typeName };
        if (type.check) await type.check(input, ctx);
        const key = opts.idempotencyKey || (type.idempotencyKey ? type.idempotencyKey(input, ctx) : null);
        if (key && !idempotency) throw validation("Idempotency key given but no idempotency store configured");
        for (let attempt = 0; ; attempt += 1) {
          const conn = await adapter.acquire();
          let open = false;
          try {
            await conn.begin();
            open = true;
            if (key) {
              const stored = await idempotency.find(conn, key);
              if (stored !== void 0) {
                await conn.commit();
                open = false;
                return { ok: true, replayed: true, idempotencyKey: key, result: stored, events: [] };
              }
            }
            const out = await type.execute(conn, input, ctx) || {};
            const events = (out.events || []).map((e) => ({ ...e, tx_type: typeName }));
            const published = outbox && events.length ? await outbox.publish(conn, events) : [];
            if (key) await idempotency.save(conn, key, typeName, out.result);
            await conn.commit();
            open = false;
            if (type.afterCommit) {
              try {
                await type.afterCommit(out.result, input, ctx);
              } catch (err) {
                logger.warn && logger.warn(`[transaction-kit] afterCommit(${typeName}) failed: ${err.message}`);
              }
            }
            return { ok: true, replayed: false, idempotencyKey: key, result: out.result, events: published };
          } catch (err) {
            if (open) await safeRollback(conn, logger);
            open = false;
            if (key && isDuplicate(err)) {
              const stored = await readStored(adapter, idempotency, key);
              if (stored !== void 0) return { ok: true, replayed: true, idempotencyKey: key, result: stored, events: [] };
            }
            if (isRetryable(err) && attempt < maxRetries) continue;
            throw err;
          } finally {
            try {
              conn.release();
            } catch (_) {
            }
          }
        }
      }
      return { registerType, run, listTypes: () => [...types.keys()], getType: (n) => types.get(n) };
    }
    async function safeRollback(conn, logger) {
      try {
        await conn.rollback();
      } catch (err) {
        logger.error && logger.error(`[transaction-kit] rollback failed: ${err.message}`);
      }
    }
    async function readStored(adapter, idempotency, key) {
      const conn = await adapter.acquire();
      try {
        await conn.begin();
        const stored = await idempotency.find(conn, key);
        await conn.commit();
        return stored;
      } catch (_) {
        await safeRollback(conn, {});
        return void 0;
      } finally {
        conn.release();
      }
    }
    module2.exports = { createTransactionEngine };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/mysqlAdapter.js
var require_mysqlAdapter = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/mysqlAdapter.js"(exports2, module2) {
    function createMysqlAdapter(pool) {
      const promisePool = typeof pool.promise === "function" ? pool.promise() : pool;
      return {
        kind: "mysql",
        async acquire() {
          const conn = await promisePool.getConnection();
          return {
            raw: conn,
            query: (sql, params) => conn.query(sql, params),
            begin: () => conn.beginTransaction(),
            commit: () => conn.commit(),
            rollback: () => conn.rollback(),
            release: () => conn.release()
          };
        }
      };
    }
    module2.exports = { createMysqlAdapter };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/locks.js
var require_locks = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/locks.js"(exports2, module2) {
    var { busy } = require_errors();
    async function withNamedLock(conn, name, fn, { timeoutSeconds = 10, busyMessage } = {}) {
      const [rows] = await conn.query("SELECT GET_LOCK(?, ?) AS acquired", [name, timeoutSeconds]);
      if (Number(rows[0] && rows[0].acquired) !== 1) {
        throw busy(busyMessage || `Resource "${name}" is busy, please retry.`, { lock: name });
      }
      try {
        return await fn();
      } finally {
        try {
          await conn.query("SELECT RELEASE_LOCK(?)", [name]);
        } catch (_) {
        }
      }
    }
    async function selectForUpdate(conn, sql, params) {
      const [rows] = await conn.query(`${sql.trim().replace(/;$/, "")} FOR UPDATE`, params);
      return rows;
    }
    module2.exports = { withNamedLock, selectForUpdate };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/idempotency.js
var require_idempotency = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/idempotency.js"(exports2, module2) {
    function createIdempotencyStore({ table = "hots.tx_idempotency" } = {}) {
      assertIdentifier(table);
      return {
        async find(conn, key) {
          const [rows] = await conn.query(`SELECT result_json FROM ${table} WHERE idem_key = ? FOR UPDATE`, [key]);
          if (!rows.length) return void 0;
          const raw = rows[0].result_json;
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        },
        async save(conn, key, txType, result) {
          await conn.query(`INSERT INTO ${table} (idem_key, tx_type, result_json, created_at) VALUES (?, ?, ?, NOW())`, [
            key,
            txType,
            JSON.stringify(result === void 0 ? null : result)
          ]);
        }
      };
    }
    function assertIdentifier(name) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(name)) throw new Error(`Invalid SQL identifier: ${name}`);
    }
    module2.exports = { createIdempotencyStore, assertIdentifier };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/outbox.js
var require_outbox = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/outbox.js"(exports2, module2) {
    var { assertIdentifier } = require_idempotency();
    var { isDuplicate } = require_errors();
    function createOutbox({ table = "hots.trigger_outbox" } = {}) {
      assertIdentifier(table);
      async function publish(conn, events) {
        const saved = [];
        for (const event of events || []) {
          const version = event.version || event.event_version || 1;
          const ref = event.ticket_id != null ? event.ticket_id : event.ref_id;
          const key = event.idempotency_key || `${event.event_type}_${ref}_v${version}`;
          try {
            const [result] = await conn.query(
              `INSERT INTO ${table} (event_type, event_version, ticket_id, service_id, payload, status, idempotency_key, created_at)
           VALUES (?, ?, ?, ?, ?, 'PENDING', ?, NOW())`,
              [event.event_type, version, ref != null ? String(ref) : null, event.service_id || null, JSON.stringify(event), key]
            );
            saved.push({ id: result.insertId, idempotency_key: key, duplicate: false });
          } catch (err) {
            if (!isDuplicate(err)) throw err;
            saved.push({ id: null, idempotency_key: key, duplicate: true });
          }
        }
        return saved;
      }
      async function claimAtomic(conn, id) {
        const [result] = await conn.query(
          `UPDATE ${table} SET status = 'PROCESSING', processing_started_at = NOW(), updated_at = NOW() WHERE id = ? AND status = 'PENDING'`,
          [id]
        );
        return result.affectedRows === 1;
      }
      async function claimBatch(conn, limit = 10) {
        const [rows] = await conn.query(`SELECT id FROM ${table} WHERE status = 'PENDING' ORDER BY id ASC LIMIT ? FOR UPDATE SKIP LOCKED`, [limit]);
        if (!rows.length) return [];
        const ids = rows.map((r) => r.id);
        await conn.query(`UPDATE ${table} SET status = 'PROCESSING', processing_started_at = NOW(), updated_at = NOW() WHERE id IN (?)`, [ids]);
        return ids;
      }
      async function markDone(conn, id) {
        await conn.query(`UPDATE ${table} SET status = 'DONE', updated_at = NOW() WHERE id = ?`, [id]);
      }
      async function markFailed(conn, id, error) {
        await conn.query(
          `UPDATE ${table} SET status = IF(COALESCE(retry_count,0) + 1 >= COALESCE(max_retry,3), 'DEAD', 'PENDING'),
         retry_count = COALESCE(retry_count,0) + 1, error_log = ?, updated_at = NOW() WHERE id = ?`,
          [JSON.stringify({ message: String(error && error.message ? error.message : error) }), id]
        );
      }
      return { publish, claimAtomic, claimBatch, markDone, markFailed };
    }
    module2.exports = { createOutbox };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/sequence.js
var require_sequence = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/sequence.js"(exports2, module2) {
    var { withNamedLock } = require_locks();
    async function nextSequence(conn, { lockName, currentMax, format = (n) => String(n), timeoutSeconds = 10, busyMessage }) {
      return withNamedLock(
        conn,
        lockName,
        async () => {
          const max = Number(await currentMax(conn)) || 0;
          const next = max + 1;
          return { next, value: format(next) };
        },
        { timeoutSeconds, busyMessage }
      );
    }
    module2.exports = { nextSequence };
  }
});

// 2.Backend/packages/transaction-kit/src/kernel/problem.js
var require_problem = __commonJS({
  "2.Backend/packages/transaction-kit/src/kernel/problem.js"(exports2, module2) {
    var { TxError, TX_ERRORS } = require_errors();
    var TITLES = {
      [TX_ERRORS.VALIDATION]: "Validation failed",
      [TX_ERRORS.UNKNOWN_TYPE]: "Unknown transaction type",
      [TX_ERRORS.NOT_FOUND]: "Not found",
      [TX_ERRORS.CONFLICT]: "Conflict",
      [TX_ERRORS.INSUFFICIENT_STOCK]: "Insufficient stock",
      [TX_ERRORS.BUSY]: "Resource busy",
      [TX_ERRORS.RULE_VIOLATION]: "Business rule violated"
    };
    var toSlug = (code) => String(code).toLowerCase().replace(/^tx_/, "").replace(/_/g, "-");
    function toProblemDetails(err, { instance, traceId, typeBase = "https://hots.indofoodinternational.com/problems/" } = {}) {
      const known = err instanceof TxError || err && typeof err.code === "string" && Number.isInteger(err.status) && err.status >= 400 && err.status < 600;
      const status = known ? err.status : 500;
      const code = known ? err.code : "INTERNAL_ERROR";
      const title = TITLES[code] || (known ? "Request failed" : "Internal server error");
      const detail = known ? err.message : "An unexpected error occurred. Quote the trace id when reporting it.";
      const body = {
        type: `${typeBase}${toSlug(code)}`,
        title,
        status,
        detail,
        ...instance ? { instance } : {},
        code,
        ...known && Array.isArray(err.details?.errors) ? { errors: err.details.errors } : {},
        ...known && err.details && !Array.isArray(err.details?.errors) ? { details: err.details } : {},
        ...traceId ? { trace_id: traceId } : {},
        success: false,
        message: detail
      };
      return { status, headers: { "Content-Type": "application/problem+json" }, body };
    }
    function sendProblem(res, err, options = {}) {
      const { status, headers, body } = toProblemDetails(err, options);
      return res.status(status).set(headers).send(JSON.stringify(body));
    }
    module2.exports = { toProblemDetails, sendProblem };
  }
});

// 2.Backend/packages/transaction-kit/src/ledger/stockLedger.js
var require_stockLedger = __commonJS({
  "2.Backend/packages/transaction-kit/src/ledger/stockLedger.js"(exports2, module2) {
    var { validation, notFound, insufficientStock } = require_errors();
    var OPERATIONS = ["receive", "issue", "adjust", "transfer"];
    function checkMovementInput({ operation, items }) {
      if (!OPERATIONS.includes(operation)) throw validation(`operation must be one of: ${OPERATIONS.join(", ")}`);
      if (!Array.isArray(items) || items.length === 0) throw validation("items must be a non-empty array");
      items.forEach((item, i) => {
        const qty = Number(item.quantity);
        if (item.id == null) throw validation(`items[${i}].id is required`);
        if (!Number.isFinite(qty) || qty < 0 || operation !== "adjust" && qty === 0) throw validation(`items[${i}].quantity is invalid`);
        if (operation === "transfer") {
          if (item.from_location_id == null || item.to_location_id == null) throw validation(`items[${i}] transfer needs from_location_id and to_location_id`);
          if (String(item.from_location_id) === String(item.to_location_id)) throw validation(`items[${i}] transfer locations must differ`);
        } else if (item.location_id == null) {
          throw validation(`items[${i}].location_id is required`);
        }
      });
    }
    function createStockLedger({ store }) {
      if (!store) throw new Error("stockLedger: store is required");
      async function post(conn, input, { transactionId, allowNegative = false } = {}) {
        checkMovementInput(input);
        const { operation, items, user_id = null, notes = null } = input;
        const txId = transactionId || `INV-${operation.toUpperCase()}-${Date.now()}`;
        const ids = [...new Set(items.map((i) => String(i.id)))].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
        const locked = await store.lockItems(conn, ids);
        const movements = [];
        const touched = /* @__PURE__ */ new Map();
        for (const line of items) {
          const item = locked.get(String(line.id));
          if (!item) throw notFound(`Item ${line.id} not found`, { id: line.id });
          const qty = Number(line.quantity);
          const mayGoNegative = typeof allowNegative === "function" ? allowNegative(item, input) : Boolean(allowNegative);
          const get = (loc) => Number(item.stocks[String(loc)] || 0);
          const set = (loc, value) => {
            item.stocks[String(loc)] = value;
          };
          const ensureAvailable = (loc) => {
            if (!mayGoNegative && get(loc) < qty) {
              throw insufficientStock(`Insufficient stock for ${item.label || item.id} at location ${loc}. Available: ${get(loc)}, Requested: ${qty}`, {
                id: item.id,
                location_id: loc,
                available: get(loc),
                requested: qty
              });
            }
          };
          const move = (loc, op) => movements.push({ transaction_id: txId, item_id: item.id, location_id: loc, operation: op, quantity: qty, snapshot: get(loc), user_id, notes });
          if (operation === "receive") {
            set(line.location_id, get(line.location_id) + qty);
            move(line.location_id, "receive");
          } else if (operation === "issue") {
            ensureAvailable(line.location_id);
            set(line.location_id, get(line.location_id) - qty);
            move(line.location_id, "issue");
          } else if (operation === "adjust") {
            set(line.location_id, qty);
            move(line.location_id, "adjust");
          } else {
            ensureAvailable(line.from_location_id);
            set(line.from_location_id, get(line.from_location_id) - qty);
            move(line.from_location_id, "transfer_out");
            set(line.to_location_id, get(line.to_location_id) + qty);
            move(line.to_location_id, "transfer_in");
          }
          touched.set(String(item.id), item);
        }
        for (const item of touched.values()) await store.saveItem(conn, item);
        await store.appendMovements(conn, movements);
        return {
          transaction_id: txId,
          operation,
          items: [...touched.values()].map((i) => ({ id: i.id, stocks: { ...i.stocks }, total_stock: sum(i.stocks) })),
          movements: movements.length
        };
      }
      return { post };
    }
    var sum = (stocks) => Object.values(stocks).reduce((t, v) => t + (Number(v) || 0), 0);
    module2.exports = { createStockLedger, checkMovementInput, OPERATIONS };
  }
});

// 2.Backend/packages/transaction-kit/src/stores/hotsResourceStore.js
var require_hotsResourceStore = __commonJS({
  "2.Backend/packages/transaction-kit/src/stores/hotsResourceStore.js"(exports2, module2) {
    var { assertIdentifier } = require_idempotency();
    function createHotsResourceStore({ itemTable = "hots.resource_m_data", logTable = "hots.resource_t_log", category = null } = {}) {
      assertIdentifier(itemTable);
      assertIdentifier(logTable);
      return {
        async lockItems(conn, ids) {
          if (!ids.length) return /* @__PURE__ */ new Map();
          const where = category ? "id IN (?) AND resource_category = ?" : "id IN (?)";
          const params = category ? [ids, category] : [ids];
          const [rows] = await conn.query(`SELECT id, resource_label, attributes FROM ${itemTable} WHERE ${where} ORDER BY id FOR UPDATE`, params);
          const map = /* @__PURE__ */ new Map();
          for (const row of rows) {
            const attributes = typeof row.attributes === "string" ? JSON.parse(row.attributes || "{}") : row.attributes || {};
            const stocks = { ...attributes.stocks || {} };
            if (attributes.current_stock !== void 0 && Object.keys(stocks).length === 0) stocks.DEFAULT = Number(attributes.current_stock) || 0;
            map.set(String(row.id), { id: row.id, label: row.resource_label, stocks, attributes });
          }
          return map;
        },
        async saveItem(conn, item) {
          const attributes = { ...item.attributes, stocks: item.stocks };
          delete attributes.current_stock;
          attributes.total_stock = Object.values(item.stocks).reduce((t, v) => t + (Number(v) || 0), 0);
          await conn.query(`UPDATE ${itemTable} SET attributes = ? WHERE id = ?`, [JSON.stringify(attributes), item.id]);
        },
        async appendMovements(conn, rows) {
          if (!rows.length) return;
          await conn.query(
            `INSERT INTO ${logTable} (transaction_id, resource_id, location_id, operation, quantity, current_stock_snapshot, user_id, notes, created_at) VALUES ?`,
            [rows.map((r) => [r.transaction_id, r.item_id, numericOrNull(r.location_id), r.operation, r.quantity, r.snapshot, r.user_id, r.notes, /* @__PURE__ */ new Date()])]
          );
        }
      };
    }
    var numericOrNull = (v) => v == null || Number.isNaN(Number(v)) ? null : Number(v);
    module2.exports = { createHotsResourceStore };
  }
});

// 2.Backend/packages/transaction-kit/src/stores/memory.js
var require_memory = __commonJS({
  "2.Backend/packages/transaction-kit/src/stores/memory.js"(exports2, module2) {
    function createMemoryDb(seed = {}) {
      const tables = /* @__PURE__ */ new Map();
      const lockOwners = /* @__PURE__ */ new Map();
      const waiters = /* @__PURE__ */ new Map();
      let nextConnId = 1;
      let autoId = 1e3;
      for (const [name, rows] of Object.entries(seed)) {
        const t = table(name);
        for (const [k, v] of Object.entries(rows)) t.set(String(k), clone(v));
      }
      function table(name) {
        if (!tables.has(name)) tables.set(name, /* @__PURE__ */ new Map());
        return tables.get(name);
      }
      async function acquireLock(key, connId) {
        while (lockOwners.has(key) && lockOwners.get(key) !== connId) {
          await new Promise((resolve) => {
            if (!waiters.has(key)) waiters.set(key, []);
            waiters.get(key).push(resolve);
          });
        }
        lockOwners.set(key, connId);
      }
      function releaseLocks(connId) {
        for (const [key, owner] of [...lockOwners]) {
          if (owner !== connId) continue;
          lockOwners.delete(key);
          const queue = waiters.get(key) || [];
          waiters.delete(key);
          queue.forEach((wake) => wake());
        }
      }
      const adapter = {
        kind: "memory",
        async acquire() {
          const id = nextConnId++;
          let undo = [];
          const mem = {
            /** Lock a row (waits if another transaction holds it) and return a copy. */
            async lock(tableName, key) {
              await acquireLock(`${tableName}:${key}`, id);
              const row = table(tableName).get(String(key));
              return row ? clone(row) : null;
            },
            read(tableName, key) {
              const row = table(tableName).get(String(key));
              return row ? clone(row) : null;
            },
            rows(tableName) {
              return [...table(tableName).values()].map(clone);
            },
            async write(tableName, key, row) {
              const k = String(key);
              await acquireLock(`${tableName}:${k}`, id);
              const t = table(tableName);
              const before = t.has(k) ? clone(t.get(k)) : void 0;
              undo.push(() => before === void 0 ? t.delete(k) : t.set(k, before));
              t.set(k, clone(row));
            },
            async insertUnique(tableName, key, row) {
              const k = String(key);
              await acquireLock(`${tableName}:${k}`, id);
              if (table(tableName).has(k)) {
                const err = new Error(`Duplicate entry '${k}' for ${tableName}`);
                err.code = "ER_DUP_ENTRY";
                throw err;
              }
              await mem.write(tableName, k, row);
            },
            nextId: () => autoId++
          };
          return {
            mem,
            query() {
              throw new Error("memory adapter has no SQL; use memory stores/repos");
            },
            async begin() {
              undo = [];
            },
            async commit() {
              undo = [];
              releaseLocks(id);
            },
            async rollback() {
              for (const fn of undo.reverse()) fn();
              undo = [];
              releaseLocks(id);
            },
            release() {
              releaseLocks(id);
            }
          };
        }
      };
      return { adapter, table: (n) => [...table(n).values()].map(clone), get: (n, k) => clone(table(n).get(String(k))) };
    }
    var memoryIdempotency = () => ({
      async find(conn, key) {
        const row = await conn.mem.lock("tx_idempotency", key);
        return row ? row.result : void 0;
      },
      async save(conn, key, txType, result) {
        await conn.mem.insertUnique("tx_idempotency", key, { tx_type: txType, result: result === void 0 ? null : result });
      }
    });
    var memoryOutbox = () => ({
      async publish(conn, events) {
        const saved = [];
        for (const e of events) {
          const key = e.idempotency_key || `${e.event_type}_${e.ticket_id ?? e.ref_id}_v${e.version || 1}`;
          try {
            await conn.mem.insertUnique("outbox", key, { ...e, status: "PENDING", idempotency_key: key });
            saved.push({ idempotency_key: key, duplicate: false });
          } catch (err) {
            if (err.code !== "ER_DUP_ENTRY") throw err;
            saved.push({ idempotency_key: key, duplicate: true });
          }
        }
        return saved;
      }
    });
    var memoryStockStore = () => ({
      async lockItems(conn, ids) {
        const map = /* @__PURE__ */ new Map();
        for (const id of ids) {
          const row = await conn.mem.lock("items", id);
          if (row) map.set(String(id), { ...row, stocks: { ...row.stocks || {} } });
        }
        return map;
      },
      async saveItem(conn, item) {
        await conn.mem.write("items", item.id, { id: item.id, label: item.label, stocks: item.stocks });
      },
      async appendMovements(conn, rows) {
        for (const r of rows) await conn.mem.write("movements", conn.mem.nextId(), r);
      }
    });
    var memoryFormRepo = () => ({
      lockForm: (conn, slug) => conn.mem.lock("forms", slug),
      countResponses: async (conn, formId) => conn.mem.rows("responses").filter((r) => r.form_id === formId).length,
      hasUserResponse: async (conn, formId, userId) => conn.mem.rows("responses").some((r) => r.form_id === formId && r.respondent_user_id === userId),
      async insertResponse(conn, r) {
        const id = conn.mem.nextId();
        await conn.mem.insertUnique("responses", r.response_uuid, { ...r, response_id: id });
        return id;
      }
    });
    var memoryCouponRepo = () => ({
      lockCoupon: async (conn, field, code) => {
        const c = conn.mem.rows("coupons").find((row) => String(row[field]) === String(code));
        return c ? conn.mem.lock("coupons", c.id) : null;
      },
      async insertSubmission(conn, coupon, user) {
        const id = conn.mem.nextId();
        await conn.mem.write("submissions", id, { id, coupon_id: coupon.id, email: user.email || null });
        return id;
      },
      async insertAnswers(conn, submissionId, formId, answers) {
        await conn.mem.write("answers", submissionId, { submissionId, formId, answers });
      },
      async markRedeemed(conn, couponId, info) {
        const c = await conn.mem.lock("coupons", couponId);
        await conn.mem.write("coupons", couponId, { ...c, status: 1, redeemed_by: info.by });
      }
    });
    var memoryOrderRepo = ({ failOnLine = null } = {}) => ({
      async insertHeader(conn, h) {
        await conn.mem.insertUnique("orders", h.order_id, h);
      },
      async insertLines(conn, orderId, companyId, userId, lines) {
        for (const l of lines) {
          if (failOnLine && l.detail_id === failOnLine) throw new Error(`simulated DB failure on line ${l.detail_id}`);
          await conn.mem.write("order_lines", `${orderId}:${l.detail_id}`, { order_id: orderId, ...l });
        }
      }
    });
    var clone = (v) => v === void 0 ? void 0 : JSON.parse(JSON.stringify(v));
    module2.exports = { createMemoryDb, memoryIdempotency, memoryOutbox, memoryStockStore, memoryFormRepo, memoryCouponRepo, memoryOrderRepo };
  }
});

// 2.Backend/packages/transaction-kit/src/types/hots/inventoryMovement.js
var require_inventoryMovement = __commonJS({
  "2.Backend/packages/transaction-kit/src/types/hots/inventoryMovement.js"(exports2, module2) {
    var { validation } = require_errors();
    var { checkMovementInput } = require_stockLedger();
    function createInventoryMovementType({ ledger, name = "hots.inventory", allowNegativeServiceIds = [19], eventType = "inventory_moved" } = {}) {
      if (!ledger) throw new Error(`${name}: ledger is required`);
      const negativeAllowed = new Set(allowNegativeServiceIds.map(Number));
      return {
        name,
        check(input) {
          if (!input.user_id) throw validation("user_id is required");
          checkMovementInput(input);
        },
        idempotencyKey: (input) => input.request_id ? `${name}:${input.request_id}` : null,
        async execute(conn, input) {
          const transactionId = input.ticket_id ? `INV-${input.operation.toUpperCase()}-${input.ticket_id}` : void 0;
          const result = await ledger.post(conn, input, {
            transactionId,
            allowNegative: input.force_allow_out_of_stock === true || negativeAllowed.has(Number(input.service_id))
          });
          return {
            result,
            events: [{ event_type: eventType, ticket_id: input.ticket_id ?? result.transaction_id, service_id: input.service_id ?? null, transaction_id: result.transaction_id, operation: input.operation }]
          };
        }
      };
    }
    module2.exports = { createInventoryMovementType };
  }
});

// 2.Backend/packages/transaction-kit/src/types/hots/posmIssue.js
var require_posmIssue = __commonJS({
  "2.Backend/packages/transaction-kit/src/types/hots/posmIssue.js"(exports2, module2) {
    var { validation, notFound } = require_errors();
    var { assertIdentifier } = require_idempotency();
    function createPosmIssueType({
      ledger,
      name = "hots.posm_issue",
      serviceId = 14,
      defaultLocationId = "DEFAULT",
      allowNegative = false,
      /** async (conn, skus[]) → Map<sku, id>; default reads hots.resource_m_data (category 'posm'). */
      resolveItemIds = mysqlResolveItemIds({}),
      eventType = "posm_stock_deducted"
    } = {}) {
      if (!ledger) throw new Error(`${name}: ledger is required`);
      const lineQty = (l) => Number(l.quantity ?? l.qty ?? l.requested_qty ?? 0);
      return {
        name,
        check(input) {
          if (!input.ticket_id) throw validation("ticket_id is required");
          if (!input.user_id) throw validation("user_id is required");
          if (!Array.isArray(input.items) || input.items.length === 0) throw validation("items must be a non-empty array");
          input.items.forEach((l, i) => {
            if (l.id == null && !(l.sku || l.resource_key)) throw validation(`items[${i}] needs id or sku`);
            if (!(lineQty(l) > 0)) throw validation(`items[${i}] quantity must be > 0`);
          });
        },
        idempotencyKey: (input) => `${name}:${input.ticket_id}`,
        async execute(conn, input) {
          const skus = input.items.filter((l) => l.id == null).map((l) => String(l.sku || l.resource_key));
          const idBySku = skus.length ? await resolveItemIds(conn, skus) : /* @__PURE__ */ new Map();
          const items = input.items.map((l) => {
            const id = l.id ?? idBySku.get(String(l.sku || l.resource_key));
            if (id == null) throw notFound(`POSM item ${l.sku || l.resource_key} not found`);
            return { id, quantity: lineQty(l), location_id: l.location_id ?? defaultLocationId };
          });
          const result = await ledger.post(
            conn,
            { operation: "issue", items, user_id: input.user_id, notes: `POSM request ${input.ticket_id}` },
            { transactionId: `POSM-ISSUE-${input.ticket_id}`, allowNegative }
          );
          return { result, events: [{ event_type: eventType, ticket_id: input.ticket_id, service_id: serviceId, transaction_id: result.transaction_id }] };
        }
      };
    }
    function mysqlResolveItemIds({ table = "hots.resource_m_data", category = "posm" }) {
      assertIdentifier(table);
      return async (conn, skus) => {
        const [rows] = await conn.query(`SELECT id, resource_key FROM ${table} WHERE resource_category = ? AND resource_key IN (?)`, [category, skus]);
        return new Map(rows.map((r) => [String(r.resource_key), r.id]));
      };
    }
    module2.exports = { createPosmIssueType, mysqlResolveItemIds };
  }
});

// 2.Backend/packages/transaction-kit/src/types/form/formSubmission.js
var require_formSubmission = __commonJS({
  "2.Backend/packages/transaction-kit/src/types/form/formSubmission.js"(exports2, module2) {
    var { validation, notFound, conflict, ruleViolation } = require_errors();
    var { assertIdentifier } = require_idempotency();
    function createFormSubmissionType({ repo = mysqlFormRepo(), name = "form.submit", eventType = "form_submitted" } = {}) {
      return {
        name,
        check(input) {
          if (!input.slug) throw validation("slug is required");
          if (!/^[0-9a-f-]{36}$/i.test(String(input.submission_id || ""))) throw validation("submission_id must be a UUID");
          if (!input.values || typeof input.values !== "object") throw validation("values is required");
        },
        idempotencyKey: (input) => `${name}:${input.submission_id}`,
        async execute(conn, input) {
          const form = await repo.lockForm(conn, input.slug);
          if (!form) throw notFound(`Form ${input.slug} not found`);
          if (form.status !== "published") throw ruleViolation(`Form ${input.slug} is ${form.status}`, { status: form.status });
          if (form.access_mode === "authenticated" && !input.user_id) throw ruleViolation("Login required", { code: "FORM_LOGIN_REQUIRED" });
          const settings = parseJson(form.settings_json);
          if (Number(settings.max_responses) > 0) {
            const count = await repo.countResponses(conn, form.form_id);
            if (count >= Number(settings.max_responses)) throw ruleViolation("This form has reached its response limit", { limit: Number(settings.max_responses) });
          }
          if (settings.one_response_per_user && input.user_id && await repo.hasUserResponse(conn, form.form_id, input.user_id)) {
            throw conflict("You have already submitted this form");
          }
          const response = {
            response_uuid: input.submission_id,
            form_id: form.form_id,
            service_id: form.service_id,
            schema_version: form.schema_version,
            schema_snapshot: input.schema_snapshot ?? null,
            response_snapshot: input.values,
            respondent_user_id: input.user_id ?? null,
            submission_meta_json: input.meta ?? null
          };
          const responseId = await repo.insertResponse(conn, response);
          return {
            result: { response_id: responseId, response_uuid: input.submission_id, form_id: form.form_id },
            events: [{ event_type: eventType, ref_id: input.submission_id, service_id: form.service_id, form_id: form.form_id, idempotency_key: `${eventType}_${input.submission_id}` }]
          };
        }
      };
    }
    function mysqlFormRepo({ formTable = "hots.form_m_definition", responseTable = "hots.form_t_response" } = {}) {
      [formTable, responseTable].forEach(assertIdentifier);
      return {
        async lockForm(conn, slug) {
          const [rows] = await conn.query(`SELECT form_id, service_id, status, access_mode, schema_version, settings_json FROM ${formTable} WHERE slug = ? FOR UPDATE`, [slug]);
          return rows[0] || null;
        },
        async countResponses(conn, formId) {
          const [rows] = await conn.query(`SELECT COUNT(*) AS n FROM ${responseTable} WHERE form_id = ?`, [formId]);
          return Number(rows[0].n);
        },
        async hasUserResponse(conn, formId, userId) {
          const [rows] = await conn.query(`SELECT 1 FROM ${responseTable} WHERE form_id = ? AND respondent_user_id = ? LIMIT 1`, [formId, userId]);
          return rows.length > 0;
        },
        async insertResponse(conn, r) {
          const [res] = await conn.query(
            `INSERT INTO ${responseTable} (response_uuid, form_id, service_id, schema_version, schema_snapshot, response_snapshot, respondent_user_id, submission_meta_json, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [r.response_uuid, r.form_id, r.service_id, r.schema_version, JSON.stringify(r.schema_snapshot ?? {}), JSON.stringify(r.response_snapshot), r.respondent_user_id, r.submission_meta_json ? JSON.stringify(r.submission_meta_json) : null]
          );
          return res.insertId;
        }
      };
    }
    var parseJson = (v) => typeof v === "string" ? JSON.parse(v || "{}") : v || {};
    module2.exports = { createFormSubmissionType, mysqlFormRepo };
  }
});

// 2.Backend/packages/transaction-kit/src/types/event/couponClaim.js
var require_couponClaim = __commonJS({
  "2.Backend/packages/transaction-kit/src/types/event/couponClaim.js"(exports2, module2) {
    var { validation, notFound, conflict, ruleViolation } = require_errors();
    var { assertIdentifier } = require_idempotency();
    function createCouponClaimType({ repo = mysqlCouponRepo(), name = "event.coupon_claim", lookupBy = "public_hash", eventType = "coupon_redeemed" } = {}) {
      if (!["public_hash", "coupon_code"].includes(lookupBy)) throw new Error(`${name}: lookupBy must be public_hash or coupon_code`);
      return {
        name,
        check(input) {
          if (!input.code) throw validation("code is required");
        },
        idempotencyKey: (input) => input.request_id ? `${name}:${input.request_id}` : null,
        async execute(conn, input, ctx) {
          const coupon = await repo.lockCoupon(conn, lookupBy, input.code);
          if (!coupon) throw notFound("Coupon not found", { status: "not_found" });
          if (Number(coupon.status) === 1) throw conflict("Coupon already redeemed", { status: "already_redeemed" });
          if (coupon.expires_at && new Date(coupon.expires_at) < ctx.now) throw ruleViolation("Coupon expired", { status: "expired" });
          const user = input.user || {};
          const submissionId = await repo.insertSubmission(conn, coupon, user, input.ip ?? null);
          if (input.answers && Object.keys(input.answers).length) await repo.insertAnswers(conn, submissionId, coupon.form_id, input.answers);
          await repo.markRedeemed(conn, coupon.id, { by: user.name || user.email || null, at: ctx.now, ip: input.ip ?? null, ua: input.user_agent ?? null });
          return {
            result: { status: "redeemed", coupon_id: coupon.id, submission_id: submissionId, redeemed_at: ctx.now.toISOString() },
            events: [{ event_type: eventType, ref_id: coupon.id, event_id: coupon.event_id, submission_id: submissionId, idempotency_key: `${eventType}_${coupon.id}` }]
          };
        }
      };
    }
    function mysqlCouponRepo({ couponTable = "t_coupons", submissionTable = "t_cstm_form_submissions", detailTable = "t_cstm_form_details" } = {}) {
      [couponTable, submissionTable, detailTable].forEach(assertIdentifier);
      return {
        async lockCoupon(conn, field, code) {
          const [rows] = await conn.query(`SELECT * FROM ${couponTable} WHERE ${field === "coupon_code" ? "coupon_code" : "public_hash"} = ? FOR UPDATE`, [code]);
          return rows[0] || null;
        },
        async insertSubmission(conn, coupon, user, ip) {
          const [res] = await conn.query(
            `INSERT INTO ${submissionTable} (form_id, coupon_id, submitted_by, submitted_email, submitted_phone, submitted_ip, country) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [coupon.form_id, coupon.id, user.name || null, user.email || null, user.phone || null, ip, coupon.country]
          );
          return res.insertId;
        },
        async insertAnswers(conn, submissionId, formId, answers) {
          const rows = Object.entries(answers).map(([k, v]) => [submissionId, formId, k, String(v)]);
          await conn.query(`INSERT INTO ${detailTable} (submission_id, form_id, cstm_key, cstm_val) VALUES ?`, [rows]);
        },
        async markRedeemed(conn, couponId, { by, at, ip, ua }) {
          await conn.query(`UPDATE ${couponTable} SET status = 1, redeemed_by = ?, redeemed_at = ?, redeemed_ip = ?, redeemed_ua = ? WHERE id = ?`, [by, at, ip, ua, couponId]);
        }
      };
    }
    module2.exports = { createCouponClaimType, mysqlCouponRepo };
  }
});

// 2.Backend/packages/transaction-kit/src/types/eorder/orderSubmit.js
var require_orderSubmit = __commonJS({
  "2.Backend/packages/transaction-kit/src/types/eorder/orderSubmit.js"(exports2, module2) {
    var { validation, ruleViolation } = require_errors();
    var { assertIdentifier } = require_idempotency();
    function createOrderSubmitType({
      repo = mysqlOrderRepo(),
      name = "eorder.order_submit",
      /** async (conn, input) → { ok: true } | { ok: false, reason, details } */
      validateLoad = null,
      /** 'client' | async (conn, input) → order_id */
      orderIdStrategy = "client",
      eventType = "order_received"
    } = {}) {
      return {
        name,
        check(input) {
          if (!input.company_id) throw validation("company_id is required");
          if (!input.user_id) throw validation("user_id is required");
          if (!input.header || typeof input.header !== "object") throw validation("header is required");
          if (!Array.isArray(input.lines) || input.lines.length === 0) throw validation("lines must be a non-empty array");
          if (orderIdStrategy === "client" && !input.order_id) throw validation("order_id is required (orderIdStrategy = client)");
          input.lines.forEach((l, i) => {
            if (!l.detail_id) throw validation(`lines[${i}].detail_id is required`);
          });
        },
        idempotencyKey: (input) => input.request_id ? `${name}:${input.request_id}` : null,
        async execute(conn, input) {
          if (validateLoad) {
            const verdict = await validateLoad(conn, input);
            if (!verdict || verdict.ok !== true) throw ruleViolation(verdict?.reason || "Container load rules failed", verdict?.details);
          }
          const orderId = orderIdStrategy === "client" ? input.order_id : await orderIdStrategy(conn, input);
          await repo.insertHeader(conn, { ...input.header, order_id: orderId, company_id: input.company_id, created_by: input.user_id });
          await repo.insertLines(conn, orderId, input.company_id, input.user_id, input.lines);
          return {
            result: { order_id: orderId, lines: input.lines.length },
            events: [{ event_type: eventType, ref_id: orderId, company_id: input.company_id, user_id: input.user_id, idempotency_key: `${eventType}_${orderId}` }]
          };
        }
      };
    }
    var HEADER_COLUMNS = ["order_id", "company_id", "delv_week", "delv_week_desc", "delv_year", "po_buyer", "stuffing_date", "port_shipment", "ship_to", "po_url", "created_by", "tolling_id", "po_buyer_pcl", "final_dest"];
    var LINE_COLUMNS = ["cont_size", "cont_qty", "sku1", "sku2", "sku3", "qty1", "qty2", "qty3", "price1", "price2", "price3", "remarks", "bulk", "delv_week", "delv_year"];
    function mysqlOrderRepo({ headerTable = "m_order", lineTable = "m_order_dtl", initialStatus = 0 } = {}) {
      [headerTable, lineTable].forEach(assertIdentifier);
      return {
        async insertHeader(conn, h) {
          const values = HEADER_COLUMNS.map((c) => h[c] === void 0 ? null : h[c]);
          await conn.query(
            `INSERT INTO ${headerTable} (${HEADER_COLUMNS.join(", ")}, po_date, status, is_active) VALUES (${HEADER_COLUMNS.map(() => "?").join(", ")}, NOW(), ?, 1)`,
            [...values, initialStatus]
          );
        },
        async insertLines(conn, orderId, companyId, userId, lines) {
          const rows = lines.map((l) => [orderId, companyId, userId, l.detail_id, ...LINE_COLUMNS.map((c) => l[c] === void 0 ? null : l[c]), 1]);
          await conn.query(`INSERT INTO ${lineTable} (order_id, company_id, created_by, detail_id, ${LINE_COLUMNS.join(", ")}, is_active) VALUES ?`, [rows]);
        }
      };
    }
    module2.exports = { createOrderSubmitType, mysqlOrderRepo, HEADER_COLUMNS, LINE_COLUMNS };
  }
});

// 2.Backend/packages/transaction-kit/src/index.js
var require_src3 = __commonJS({
  "2.Backend/packages/transaction-kit/src/index.js"(exports2, module2) {
    var { createTransactionEngine } = require_engine();
    var { createMysqlAdapter } = require_mysqlAdapter();
    var { withNamedLock, selectForUpdate } = require_locks();
    var { createIdempotencyStore } = require_idempotency();
    var { createOutbox } = require_outbox();
    var { nextSequence } = require_sequence();
    var errors = require_errors();
    var { toProblemDetails, sendProblem } = require_problem();
    var { createStockLedger, checkMovementInput, OPERATIONS } = require_stockLedger();
    var { createHotsResourceStore } = require_hotsResourceStore();
    var memory = require_memory();
    var { createInventoryMovementType } = require_inventoryMovement();
    var { createPosmIssueType, mysqlResolveItemIds } = require_posmIssue();
    var { createFormSubmissionType, mysqlFormRepo } = require_formSubmission();
    var { createCouponClaimType, mysqlCouponRepo } = require_couponClaim();
    var { createOrderSubmitType, mysqlOrderRepo } = require_orderSubmit();
    module2.exports = {
      // kernel
      createTransactionEngine,
      createMysqlAdapter,
      withNamedLock,
      selectForUpdate,
      createIdempotencyStore,
      createOutbox,
      nextSequence,
      ...errors,
      toProblemDetails,
      sendProblem,
      // ledger + stores
      createStockLedger,
      checkMovementInput,
      STOCK_OPERATIONS: OPERATIONS,
      createHotsResourceStore,
      memory,
      // program types
      createInventoryMovementType,
      createPosmIssueType,
      mysqlResolveItemIds,
      createFormSubmissionType,
      mysqlFormRepo,
      createCouponClaimType,
      mysqlCouponRepo,
      createOrderSubmitType,
      mysqlOrderRepo
    };
  }
});

// 2.Backend/packages/tenant-server/src/transaction.js
var require_transaction = __commonJS({
  "2.Backend/packages/tenant-server/src/transaction.js"(exports2, module2) {
    "use strict";
    var { createTransactionEngine } = require_src3();
    function createUnitOfWork({ adapter, logger }) {
      if (!logger || typeof logger.warn !== "function") throw new Error("SSE-compatible logger required");
      const engine = createTransactionEngine({ adapter, logger, maxRetries: 0 });
      engine.registerType({ name: "tenant.operation", async execute(connection, input) {
        return { result: await input.execute(connection.raw || connection) };
      } });
      return { async run(execute) {
        return (await engine.run("tenant.operation", { execute })).result;
      } };
    }
    module2.exports = { createUnitOfWork };
  }
});

// 2.Backend/packages/tenant-server/src/mysqlMemberships.js
var require_mysqlMemberships = __commonJS({
  "2.Backend/packages/tenant-server/src/mysqlMemberships.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, tenantKey, companyId } = require_src();
    function createMysqlMemberships({ query, programs, rolePermissions = () => [] }) {
      if (typeof query !== "function" || !programs) throw new Error("Query adapter and explicit tenant/program mappings required");
      async function list(userId, key) {
        tenantKey(key);
        const program = programs[key];
        if (!program || !Number.isSafeInteger(program.program_id) || program.program_id <= 0 || typeof program.permission_module !== "string") throw new TenantError("TENANT_NOT_CONFIGURED", 503);
        if (typeof userId !== "string" || !/^[1-9]\d*$/.test(userId) || !Number.isSafeInteger(Number(userId)) || Number(userId) > 2147483647) throw new TenantError("INVALID_USER_ID", 401);
        const rows = await query(`SELECT a.access_id, a.user_id, a.company_id, a.role_id, a.granted_at,
      c.company_name, p.id AS permission_id, p.permission_key, p.updated_at AS permission_updated_at
      FROM user_t_program_access a
      JOIN user u ON u.user_id = a.user_id AND u.active = 1
      JOIN m_company c ON c.company_id = a.company_id AND c.is_active = 1
      LEFT JOIN user_permission p ON p.user_id = a.user_id AND p.company_id = a.company_id
        AND p.module_key = ? AND p.active = 1
      WHERE a.user_id = ? AND a.program_id = ? AND a.is_active = 1 AND a.revoked_at IS NULL
      ORDER BY a.company_id, a.access_id, p.id LIMIT 2001`, [program.permission_module, Number(userId), program.program_id]);
        if (!Array.isArray(rows) || rows.length >= 2001) throw new TenantError("MEMBERSHIP_RESULT_TOO_LARGE", 503);
        const groups = /* @__PURE__ */ new Map();
        for (const row of rows) {
          const id = companyId(row.company_id);
          let group = groups.get(id);
          if (group && group.access_id !== row.access_id) throw new TenantError("AMBIGUOUS_MEMBERSHIP", 503);
          if (!group) {
            group = { access_id: row.access_id, rows: [] };
            groups.set(id, group);
          }
          group.rows.push(row);
        }
        return [...groups.values()].map(({ rows: group }) => {
          const row = group[0], role = rolePermissions({ tenant_key: key, company_id: row.company_id, role_id: row.role_id });
          if (!Array.isArray(role)) throw new TenantError("INVALID_ROLE_POLICY", 503);
          const permissions = [.../* @__PURE__ */ new Set([...role, ...group.filter((r) => r.permission_key != null).map((r) => r.permission_key)])].sort();
          const version = crypto.createHash("sha256").update(JSON.stringify({ group, role })).digest("hex");
          return { user_id: userId, tenant_key: key, company_id: row.company_id, company_name: row.company_name, active: true, permissions, version };
        });
      }
      return { list, async get(userId, key, id) {
        companyId(id);
        return (await list(userId, key)).find((m) => m.company_id === id) || null;
      } };
    }
    module2.exports = { createMysqlMemberships };
  }
});

// 2.Backend/packages/tenant-server/src/registry.js
var require_registry = __commonJS({
  "2.Backend/packages/tenant-server/src/registry.js"(exports2, module2) {
    "use strict";
    var { TenantError, tenantKey } = require_src();
    function httpsOrigin(value) {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.origin !== value || url.username || url.password) throw new Error("Canonical HTTPS origin required");
      return value;
    }
    function createProgramRegistry(config) {
      if (config?.schema_version !== 1 || !Array.isArray(config.programs)) throw new Error("Registry version 1 required");
      const entries = /* @__PURE__ */ new Map(), ids = /* @__PURE__ */ new Set(), modules = /* @__PURE__ */ new Set(), mounts = /* @__PURE__ */ new Set();
      for (const row of config.programs) {
        const key = tenantKey(row.tenant_key);
        const apiBasePath = row.api_base_path || "/api/tenant/v1";
        if (entries.has(key) || typeof row.enabled !== "boolean") throw new Error("Unique program and explicit enabled flag required");
        if (row.enabled) {
          if (!Number.isSafeInteger(row.program_id) || row.program_id <= 0 || ids.has(row.program_id)) throw new Error("Unique physical program ID required");
          if (typeof row.permission_module !== "string" || !/^[a-z][a-z0-9_.-]{0,79}$/.test(row.permission_module) || modules.has(row.permission_module)) throw new Error("Unique permission namespace required");
          httpsOrigin(row.origin);
          if (!/^\/api(?:\/[a-z0-9_-]+)+$/i.test(apiBasePath)) throw new Error("Canonical API base path required");
          const mount = JSON.stringify([row.origin, apiBasePath]);
          if (mounts.has(mount)) throw new Error("Unique server program mount required");
          if (typeof row.workspace_path !== "string" || !/^\/(?!\/)/.test(row.workspace_path) || /[\\\u0000-\u0020?#]/.test(row.workspace_path)) throw new Error("Local workspace path required");
          ids.add(row.program_id);
          modules.add(row.permission_module);
          mounts.add(mount);
        }
        entries.set(key, Object.freeze({ tenant_key: key, enabled: row.enabled, program_id: row.program_id, permission_module: row.permission_module, origin: row.origin, api_base_path: apiBasePath, workspace_path: row.workspace_path }));
      }
      function get(key) {
        const row = entries.get(tenantKey(key));
        if (!row?.enabled) throw new TenantError("TENANT_NOT_CONFIGURED", 503);
        return row;
      }
      return Object.freeze({
        get,
        bind(key) {
          const row = get(key);
          return Object.freeze({ program: row, programs: Object.freeze({ [key]: Object.freeze({ program_id: row.program_id, permission_module: row.permission_module }) }), resolveTenant: () => key });
        },
        status: () => [...entries.values()].map((row) => ({ tenant_key: row.tenant_key, enabled: row.enabled }))
      });
    }
    module2.exports = { createProgramRegistry };
  }
});

// 2.Backend/packages/tenant-server/src/mysqlStores.js
var require_mysqlStores = __commonJS({
  "2.Backend/packages/tenant-server/src/mysqlStores.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { tenantKey } = require_src();
    function createMysqlRuntimeStore({ appKey, kind, query, unitOfWork, clock = Date.now }) {
      tenantKey(appKey);
      if (!["session", "context", "login"].includes(kind) || typeof query !== "function" || !unitOfWork?.run) throw new Error("Explicit store namespace, query and transactional UoW required");
      function params(key) {
        if (typeof key !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(key)) throw new Error("Opaque 256-bit key required");
        return [appKey, kind, crypto.createHash("sha256").update(key).digest("hex")];
      }
      function value(row) {
        if (!row) return null;
        const parsed = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
        if (!parsed || !Number.isSafeInteger(parsed.expires_at) || parsed.expires_at <= clock()) return null;
        return parsed;
      }
      return {
        async put(key, record) {
          const scope = params(key);
          if (!record || !Number.isSafeInteger(record.expires_at) || record.expires_at <= clock()) throw new Error("Future absolute expiry required");
          const payload = JSON.stringify(record);
          return unitOfWork.run(async (connection) => {
            await connection.execute("INSERT INTO t_tenant_runtime_store (app_key, store_kind, key_hash, payload, expires_at) VALUES (?, ?, ?, ?, ?)", [...scope, payload, record.expires_at]);
          });
        },
        async get(key) {
          const rows = await query("SELECT payload FROM t_tenant_runtime_store WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1 AND expires_at > ? LIMIT 1", [...params(key), clock()]);
          return value(rows[0]);
        },
        async delete(key) {
          return unitOfWork.run(async (connection) => {
            await connection.execute("UPDATE t_tenant_runtime_store SET is_active = 0 WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1", params(key));
          });
        },
        async consume(key) {
          const scope = params(key);
          return unitOfWork.run(async (connection) => {
            const [rows] = await connection.execute("SELECT payload FROM t_tenant_runtime_store WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1 AND expires_at > ? LIMIT 1 FOR UPDATE", [...scope, clock()]);
            if (!rows.length) return null;
            await connection.execute("UPDATE t_tenant_runtime_store SET is_active = 0 WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1", scope);
            return value(rows[0]);
          });
        }
      };
    }
    module2.exports = { createMysqlRuntimeStore };
  }
});

// 2.Backend/packages/tenant-server/src/mysqlTickets.js
var require_mysqlTickets = __commonJS({
  "2.Backend/packages/tenant-server/src/mysqlTickets.js"(exports2, module2) {
    "use strict";
    var { TenantError, companyId } = require_src();
    function createMysqlTicketReads({ query, registry }) {
      if (typeof query !== "function" || !registry?.get) throw new Error("Query and verified program registry required");
      const from = " FROM t_ticket t JOIN t_tenant_ticket_owner o ON o.ticket_id = t.ticket_id AND o.company_id = t.company_id WHERE o.program_id = ? AND o.company_id = ?";
      const projection = "SELECT ? AS tenant_key, o.company_id, t.ticket_id, t.title, t.status_id, t.service_id";
      const scope = (context) => [registry.get(context.tenant_key).program_id, companyId(context.company_id)];
      return {
        async get(context, id) {
          if (typeof id !== "string" || !id || id.length > 36) throw new TenantError("INVALID_TICKET_ID", 400);
          const rows = await query(projection + from + " AND t.ticket_id = ? LIMIT 1", [context.tenant_key, ...scope(context), id]);
          if (!rows.length) throw new TenantError("TICKET_NOT_FOUND", 404);
          return rows[0];
        },
        async list(context, { limit = 25, offset = 0 } = {}) {
          if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 1e5) throw new TenantError("INVALID_PAGINATION", 400);
          const binding = scope(context);
          const totals = await query("SELECT COUNT(*) AS total" + from, binding);
          const rows = await query(projection + from + " ORDER BY t.ticket_id LIMIT ? OFFSET ?", [context.tenant_key, ...binding, limit, offset]);
          return { rows, total: Number(totals[0].total) };
        }
      };
    }
    module2.exports = { createMysqlTicketReads };
  }
});

// 2.Backend/packages/tenant-server/src/companyScope.js
var require_companyScope = __commonJS({
  "2.Backend/packages/tenant-server/src/companyScope.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var { TenantError, companyId } = require_src();
    function resolveCompanyScopes({ userId, tenantKey, companies, relations, grants }) {
      const catalog = new Map(companies.map((c) => [companyId(c.company_id), c])), parent = /* @__PURE__ */ new Map(), children = /* @__PURE__ */ new Map();
      for (const edge of relations) {
        const from = companyId(edge.parent_company_id), to = companyId(edge.child_company_id);
        if (!catalog.has(from) || !catalog.has(to) || from === to || parent.has(to)) throw new TenantError("INVALID_COMPANY_HIERARCHY", 503);
        parent.set(to, from);
        children.set(from, [...children.get(from) || [], to]);
      }
      for (const id of catalog.keys()) {
        const seen = /* @__PURE__ */ new Set();
        let cursor = id;
        while (cursor !== void 0) {
          if (seen.has(cursor)) throw new TenantError("INVALID_COMPANY_HIERARCHY", 503);
          seen.add(cursor);
          cursor = parent.get(cursor);
        }
      }
      const effective = /* @__PURE__ */ new Map();
      for (const grant of grants) {
        if (String(grant.user_id) !== userId || grant.tenant_key !== tenantKey || grant.active !== true) continue;
        if (!Array.isArray(grant.permissions) || grant.permissions.some((p) => typeof p !== "string" || !p || p === "*")) throw new TenantError("INVALID_SCOPE_GRANT", 503);
        const stack = [companyId(grant.root_company_id)];
        while (stack.length) {
          const id = stack.pop(), company = catalog.get(id);
          if (!company || company.is_active !== 1) continue;
          const permissions = effective.get(id) || /* @__PURE__ */ new Set();
          grant.permissions.forEach((p) => permissions.add(p));
          effective.set(id, permissions);
          if (grant.include_descendants === true) stack.push(...children.get(id) || []);
        }
      }
      const version = crypto.createHash("sha256").update(JSON.stringify({ companies, relations, grants })).digest("hex");
      return [...effective].sort(([a], [b]) => a - b).map(([id, permissions]) => ({ user_id: userId, tenant_key: tenantKey, company_id: id, company_name: catalog.get(id).company_name, active: true, permissions: [...permissions].sort(), version }));
    }
    module2.exports = { resolveCompanyScopes };
  }
});

// 2.Backend/packages/tenant-server/src/mysqlCompanyScopes.js
var require_mysqlCompanyScopes = __commonJS({
  "2.Backend/packages/tenant-server/src/mysqlCompanyScopes.js"(exports2, module2) {
    "use strict";
    var { TenantError, tenantKey, companyId } = require_src();
    var { resolveCompanyScopes } = require_companyScope();
    function createMysqlCompanyScopes({ query, programs }) {
      if (typeof query !== "function" || !programs) throw new Error("Query and explicit program mappings required");
      async function list(userId, key) {
        tenantKey(key);
        const program = programs[key];
        if (!program || !Number.isSafeInteger(program.program_id) || program.program_id <= 0) throw new TenantError("TENANT_NOT_CONFIGURED", 503);
        if (typeof userId !== "string" || !/^[1-9]\d*$/.test(userId) || !Number.isSafeInteger(Number(userId)) || Number(userId) > 2147483647) throw new TenantError("INVALID_USER_ID", 401);
        const grants = await query("SELECT g.* FROM t_tenant_company_grant g JOIN user u ON u.user_id=g.user_id AND u.active=1 WHERE g.user_id=? AND g.program_id=? AND g.is_active=1 ORDER BY g.grant_id LIMIT 2001", [Number(userId), program.program_id]);
        if (grants.length >= 2001) throw new TenantError("SCOPE_RESULT_TOO_LARGE", 503);
        if (!grants.length) return [];
        const companies = await query("SELECT company_id,company_name,is_active FROM m_company ORDER BY company_id LIMIT 2001", []);
        const relations = await query("SELECT parent_company_id,child_company_id FROM t_tenant_company_relation WHERE is_active=1 ORDER BY child_company_id LIMIT 2001", []);
        if (companies.length >= 2001 || relations.length >= 2001) throw new TenantError("SCOPE_RESULT_TOO_LARGE", 503);
        return resolveCompanyScopes({ userId, tenantKey: key, companies, relations, grants: grants.map((g) => ({ ...g, tenant_key: key, active: g.is_active === 1, include_descendants: g.include_descendants === 1, permissions: typeof g.permissions === "string" ? JSON.parse(g.permissions) : g.permissions })) });
      }
      return { list, async get(userId, key, id) {
        companyId(id);
        return (await list(userId, key)).find((m) => m.company_id === id) || null;
      } };
    }
    module2.exports = { createMysqlCompanyScopes };
  }
});

// 2.Backend/Integrated-API/app/modules/tenant-platform/routes.js
var require_routes = __commonJS({
  "2.Backend/Integrated-API/app/modules/tenant-platform/routes.js"(exports2, module2) {
    "use strict";
    var { TenantError } = require_src2();
    var crypto = require("node:crypto");
    var { readCookie, setCookie } = require_session();
    function createTenantRouter({ Router, runtime = null, logger }) {
      const router = Router();
      router.use((_req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        next();
      });
      const handle = (action) => async (req, res) => {
        try {
          if (!runtime) throw new TenantError("TENANT_PLATFORM_NOT_CONFIGURED", 503);
          const data = await action(req, runtime, res);
          if (!res.headersSent) res.json({ success: true, data });
        } catch (error) {
          if (!(error instanceof TenantError)) logger?.error?.("[TENANT][ERROR] : request_failed");
          const status = error instanceof TenantError ? error.status : 500;
          res.status(status).json({ success: false, error: { code: error instanceof TenantError ? error.code : "TENANT_PLATFORM_ERROR" } });
        }
      };
      router.get("/sso/start", handle(async (_req, r, res) => {
        if (!r.oidc) throw new TenantError("SSO_NOT_CONFIGURED", 503);
        const binding = crypto.randomBytes(32).toString("base64url");
        const url = await r.oidc.begin(binding, r.program?.workspace_path || "/hots/platform/workspaces");
        const cookie = r.program ? `__Host-${r.program.tenant_key}_login` : "__Host-cineva_login";
        setCookie(res, `${cookie}=${binding}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`);
        res.redirect(303, url);
      }));
      router.get("/sso/callback", handle(async (req, r, res) => {
        if (!r.oidc || !r.sessions || !r.identityService?.resolveOrRegister) throw new TenantError("SSO_NOT_CONFIGURED", 503);
        const cookie = r.program ? `__Host-${r.program.tenant_key}_login` : "__Host-cineva_login";
        const result = await r.oidc.finish({ code: req.query.code, state: req.query.state, sessionBinding: readCookie(req, cookie) });
        const user = await r.identityService.resolveOrRegister(result.identity);
        await r.sessions.issue(res, user.user_id);
        setCookie(res, `${cookie}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
        res.redirect(303, result.returnTo);
      }));
      router.post("/logout", handle(async (req, r, res) => {
        if (!r.sessions) throw new TenantError("SESSION_NOT_CONFIGURED", 503);
        await r.sessions.revoke(req, res);
        return { signed_out: true };
      }));
      router.post("/invitations", handle(async (req, r) => {
        if (!r.invitations || !r.assertMutation) throw new TenantError("INVITATIONS_NOT_CONFIGURED", 503);
        await r.assertMutation(req);
        const context = await r.engine.authorize(req, req.headers["x-workspace-context"], "memberships.invite");
        return r.invitations.issue(context, { invitee_user_id: req.body?.invitee_user_id, role_key: req.body?.role_key });
      }));
      router.post("/invitations/accept", handle(async (req, r) => {
        if (!r.invitations || !r.assertMutation) throw new TenantError("INVITATIONS_NOT_CONFIGURED", 503);
        await r.assertMutation(req);
        return r.invitations.accept(req, req.body?.token);
      }));
      router.get("/bootstrap", handle((req, r) => r.engine.bootstrap(req)));
      router.get("/tickets", handle(async (req, r) => {
        if (!r.tickets) throw new TenantError("TICKET_PILOT_NOT_CONFIGURED", 503);
        const context = await r.engine.authorize(req, req.headers["x-workspace-context"], "resources.read");
        return { context, ...await r.tickets.list(context, { limit: req.query.limit === void 0 ? 25 : Number(req.query.limit), offset: req.query.offset === void 0 ? 0 : Number(req.query.offset) }) };
      }));
      router.get("/tickets/:id", handle(async (req, r) => {
        if (!r.tickets) throw new TenantError("TICKET_PILOT_NOT_CONFIGURED", 503);
        const context = await r.engine.authorize(req, req.headers["x-workspace-context"], "resources.read");
        return { context, ticket: await r.tickets.get(context, req.params.id) };
      }));
      router.post("/context", handle(async (req, r) => {
        if (!r.assertMutation) throw new TenantError("CSRF_ADAPTER_REQUIRED", 503);
        await r.assertMutation(req);
        return r.engine.select(req, req.body?.company_id);
      }));
      router.get("/brand", handle(async (req, r) => {
        const context = await r.engine.authorize(req, req.headers["x-workspace-context"], "brand.read");
        return { context, brand: await r.engine.brand(context) };
      }));
      return router;
    }
    module2.exports = { createTenantRouter };
  }
});

// 2.Backend/Integrated-API/app/modules/tenant-platform/runtime.js
var require_runtime = __commonJS({
  "2.Backend/Integrated-API/app/modules/tenant-platform/runtime.js"(exports2, module2) {
    "use strict";
    var { createTenantEngine } = require_src2();
    var { createMysqlMemberships } = require_mysqlMemberships();
    var { createProgramRegistry } = require_registry();
    var { createMysqlTicketReads } = require_mysqlTickets();
    var { createMysqlCompanyScopes } = require_mysqlCompanyScopes();
    function createTenantRuntime({ query, programs, rolePermissions, resolveIdentity, resolveTenant, contextStore, branding, assertMutation, oidc, sessions, identityService, memberships: suppliedMemberships }) {
      if (typeof assertMutation !== "function") throw new Error("Cookie/Origin/CSRF verification adapter required");
      const memberships = suppliedMemberships || createMysqlMemberships({ query, programs, rolePermissions });
      return { engine: createTenantEngine({ memberships, resolveIdentity, resolveTenant, contextStore, branding }), assertMutation, oidc, sessions, identityService };
    }
    module2.exports = { createTenantRuntime };
    function createRegisteredTenantRuntime({ registry, tenantKey, ticketPilot = false, membershipMode = "legacy", ...adapters }) {
      if (typeof ticketPilot !== "boolean") throw new Error("Explicit ticket pilot flag required");
      const programs = createProgramRegistry(registry), bound = programs.bind(tenantKey);
      if (!["legacy", "hierarchy"].includes(membershipMode)) throw new Error("Explicit membership mode required");
      const memberships = membershipMode === "hierarchy" ? createMysqlCompanyScopes({ query: adapters.query, programs: bound.programs }) : void 0;
      const runtime = createTenantRuntime({ ...adapters, memberships, programs: bound.programs, resolveTenant: bound.resolveTenant });
      return { ...runtime, program: bound.program, tickets: ticketPilot ? runtime.engine.repository(createMysqlTicketReads({ query: adapters.query, registry: programs })) : null };
    }
    module2.exports.createRegisteredTenantRuntime = createRegisteredTenantRuntime;
  }
});

// 2.Backend/Integrated-API/app/modules/tenant-platform/persistentRuntime.js
var require_persistentRuntime = __commonJS({
  "2.Backend/Integrated-API/app/modules/tenant-platform/persistentRuntime.js"(exports2, module2) {
    "use strict";
    var { createProgramRegistry } = require_registry();
    var { createMysqlRuntimeStore } = require_mysqlStores();
    var { createAppSessionManager } = require_session();
    var { createOidcBridge } = require_oidc();
    var { createRegisteredTenantRuntime } = require_runtime();
    function createPersistentTenantRuntime({ registry, tenantKey, query, unitOfWork, oidcConfig, verifyIdToken, resolveUser, identityService, branding, ticketPilot = false }) {
      const program = createProgramRegistry(registry).get(tenantKey);
      if (oidcConfig?.redirect_uri !== program.origin + program.api_base_path + "/sso/callback") throw new Error("Callback must match bound program origin and API mount");
      if (typeof identityService?.resolveOrRegister !== "function") throw new Error("Trusted canonical identity adapter required");
      const store = (kind) => createMysqlRuntimeStore({ appKey: tenantKey, kind, query, unitOfWork });
      const sessions = createAppSessionManager({ store: store("session"), resolveUser, origin: program.origin, cookieName: `__Host-${tenantKey}_session`, csrfCookieName: `${tenantKey}_csrf` });
      const oidc = createOidcBridge({ config: oidcConfig, transactions: store("login"), verifyIdToken });
      return createRegisteredTenantRuntime({ registry, tenantKey, query, membershipMode: "hierarchy", ticketPilot, contextStore: store("context"), branding, oidc, sessions, identityService, resolveIdentity: (req) => sessions.resolveIdentity(req), assertMutation: (req) => sessions.assertMutation(req) });
    }
    module2.exports = { createPersistentTenantRuntime };
  }
});

// 2.Backend/Integrated-API/app/modules/tenant-platform/release.js
module.exports = {
  ...require_src2(),
  ...require_oidc(),
  ...require_session(),
  ...require_transaction(),
  ...require_mysqlMemberships(),
  ...require_registry(),
  ...require_mysqlStores(),
  ...require_mysqlTickets(),
  ...require_companyScope(),
  ...require_mysqlCompanyScopes(),
  ...require_routes(),
  ...require_runtime(),
  ...require_persistentRuntime()
};
