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

// 1.Frontend/packages/domain-kit/test/domain.test.ts
var import_node_test = __toESM(require("node:test"), 1);
var import_strict = __toESM(require("node:assert/strict"), 1);

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

// 1.Frontend/packages/domain-kit/test/domain.test.ts
(0, import_node_test.default)("Hotel reservations require a room in the same hotel and reject foreign IDs", () => {
  const collections = { rooms: [{ id: "room-a", hotel: "a", number: "101" }, { id: "room-b", hotel: "b", number: "101" }], reservations: [{ id: "stay", room: "101", hotel: "a" }] };
  const config = { collections: { rooms: {}, reservations: {} }, references: [{ from: "reservations", field: "room", to: "rooms", targetField: "number", scope: { sourceField: "hotel", targetField: "hotel" } }] };
  const before = JSON.stringify(collections);
  import_strict.default.deepEqual(validateRelations(collections, config), []);
  import_strict.default.equal(JSON.stringify(collections), before);
  collections.reservations[0].hotel = "c";
  import_strict.default.equal(validateRelations(collections, config)[0].code, "foreign_reference");
});
(0, import_node_test.default)("Orders reject duplicate identifiers, invalid scalar IDs, ambiguity and unknown configuration", () => {
  const config = { collections: { products: {}, orders: {} }, references: [{ from: "orders", field: "sku", to: "products", targetField: "sku" }] };
  const data = { products: [{ id: 1, sku: "x" }, { id: 1, sku: "x" }], orders: [{ id: "o", sku: "x" }] };
  import_strict.default.deepEqual(validateRelations(data, config).map((issue) => issue.code), ["duplicate_id", "ambiguous_reference"]);
  import_strict.default.ok(validateRelations({ products: [{ id: {} }], orders: [] }, config).some((issue) => issue.code === "invalid_id"));
  import_strict.default.ok(validateRelations({ ...data, undeclared: [] }, config).some((issue) => issue.code === "unknown_collection"));
  import_strict.default.ok(validateRelations(data, { ...config, references: [{ from: "orders", field: "__proto__.id", to: "products" }] }).some((issue) => issue.code === "invalid_reference_config"));
  import_strict.default.ok(validateRelations(null, config).length);
  import_strict.default.ok(validateRelations(data, null).length);
});
(0, import_node_test.default)("Optional references allow absent values but reject supplied foreign values", () => {
  const config = { collections: { guests: {}, stays: {} }, references: [{ from: "stays", field: "guestId", to: "guests", optional: true }] };
  import_strict.default.deepEqual(validateRelations({ guests: [], stays: [{ id: 1 }] }, config), []);
  import_strict.default.ok(validateRelations({ guests: [], stays: [{ id: 1, guestId: "missing" }] }, config).length);
});
(0, import_node_test.default)("Safe paths never traverse inherited, prototype or getter properties", () => {
  let getterCalls = 0;
  const data = /* @__PURE__ */ Object.create({ inherited: 42 });
  Object.defineProperty(data, "secret", { get: () => {
    getterCalls++;
    return 1;
  } });
  import_strict.default.equal(safeRead(data, "inherited").found, false);
  import_strict.default.equal(safeRead(data, "secret").found, false);
  import_strict.default.equal(safeRead(data, "constructor.prototype").found, false);
  import_strict.default.equal(getterCalls, 0);
});
(0, import_node_test.default)("Rule pipeline accumulates business failures, fails closed on exceptions and asserts structured issues", () => {
  const validate = createRules([
    { code: "overpaid", path: "paid", message: "Paid exceeds order total.", check: (value) => value.paid <= value.total },
    { code: "bad_source", message: "Source failed.", check: () => {
      throw new Error();
    } }
  ]);
  const issues = validate({ total: 100, paid: 101 });
  import_strict.default.deepEqual(issues.map((issue) => issue.code), ["overpaid", "bad_source"]);
  import_strict.default.throws(() => assertRules(issues));
  import_strict.default.doesNotThrow(() => assertRules([]));
  import_strict.default.equal(createRules([{ code: "x", path: "__proto__.x", message: "Bad path", check: () => true }])({})[0].code, "invalid_rule");
});
(0, import_node_test.default)("Typed attributes distinguish integer money, fractions, tags and actual calendar dates", () => {
  import_strict.default.deepEqual(validateAttribute(1250, { type: "money", min: 0 }), []);
  import_strict.default.ok(validateAttribute(12.5, { type: "money" }).length);
  import_strict.default.ok(validateAttribute("12", { type: "integer" }).length);
  import_strict.default.ok(validateAttribute(Infinity, { type: "number" }).length);
  import_strict.default.deepEqual(validateAttribute(1.25, { type: "number" }), []);
  import_strict.default.ok(validateAttribute("2026-02-31", { type: "date" }).length);
  import_strict.default.deepEqual(validateAttribute("2028-02-29", { type: "date" }), []);
  import_strict.default.ok(validateAttribute("closed", { type: "tag", allowed: ["open"] }).length);
  import_strict.default.ok(validateAttribute(null, { type: "text", required: true }).length);
  import_strict.default.deepEqual(validateAttribute("<script>plain text</script>", { type: "text" }), []);
  import_strict.default.ok(validateAttribute(1, { type: "integer", min: 3, max: 1 }).length);
});
(0, import_node_test.default)("Each rule receives an isolated document even when previous checks mutate or throw", () => {
  const data = { order: { total: 100 }, items: ["room"] };
  const rules = [
    { code: "mutated", message: "Mutation fails", check: (value) => {
      value.order.total = 999;
      value.items.push("extra");
      throw new Error();
    } },
    { code: "unchanged", message: "Original expected", check: (value) => value.order.total === 100 && value.items.length === 1 }
  ];
  const validate = createRules(rules);
  rules[0].code = "changed_config";
  rules.reverse();
  import_strict.default.deepEqual(validate(data).map((issue) => issue.code), ["mutated"]);
  import_strict.default.deepEqual(data, { order: { total: 100 }, items: ["room"] });
});
(0, import_node_test.default)("Uncloneable inputs and failing custom clone fail closed without executing checks", () => {
  let executed = false;
  const rule = { code: "checked", message: "Check", check: () => {
    executed = true;
    return true;
  } };
  import_strict.default.equal(createRules([rule])({ callback: () => true })[0].code, "rule_clone_failed");
  import_strict.default.equal(createRules([rule], { clone: () => {
    throw new Error();
  } })({})[0].code, "rule_clone_failed");
  import_strict.default.equal(executed, false);
});

// 1.Frontend/packages/domain-kit/test/runtime.test.ts
var import_node_test2 = __toESM(require("node:test"), 1);
var import_strict2 = __toESM(require("node:assert/strict"), 1);

// 1.Frontend/packages/domain-kit/src/commands.ts
var cloneRuntimeValue = (value) => {
  const clone = globalThis.structuredClone;
  if (!clone) throw new Error("A structuredClone implementation or injected clone is required.");
  return clone(value);
};
function synchronous(value, phase) {
  if (value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function") {
    void Promise.resolve(value).catch(() => void 0);
    throw new Error(`${phase} must be synchronous. Use an async host transaction adapter instead.`);
  }
  return value;
}
function createCommandRegistry(options = {}) {
  const clone = options.clone ?? cloneRuntimeValue;
  const definitions = /* @__PURE__ */ new Map();
  const executeDetailed = (name, request) => {
    const definition = definitions.get(name);
    if (!definition) throw new Error(`Unknown command: ${name}`);
    const baseline = clone(request.state), input2 = clone(request.input), context = clone(request.context);
    if (request.expectedRevision !== void 0) {
      const actual = options.getRevision ? synchronous(options.getRevision(clone(baseline)), "Revision policy") : request.revision;
      if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0 || !Number.isSafeInteger(actual) || actual < 0 || actual !== request.expectedRevision)
        throw new Error("Command revision conflict or missing actual revision.");
    }
    if (synchronous(definition.authorize(clone(context), clone(input2), clone(baseline)), "Authorization policy") !== true) throw new Error(`Command denied: ${name}`);
    synchronous(definition.validate?.(clone(input2), clone(baseline), clone(context)), "Validation policy");
    const state = clone(synchronous(definition.execute(clone(baseline), clone(input2), clone(context)), "Command reducer"));
    synchronous(definition.protect?.(clone(baseline), clone(state), clone(context)), "Protection policy");
    const result = definition.result ? clone(synchronous(definition.result(clone(state), clone(input2), clone(context)), "Result policy")) : void 0;
    const events = definition.events ? clone(synchronous(definition.events(clone(baseline), clone(state), clone(input2), clone(context)), "Event policy")) : [];
    return { state, result, events };
  };
  return {
    register(name, definition) {
      if (!name.trim() || definitions.has(name)) throw new Error(`Empty or duplicate command: ${name}`);
      if (typeof definition.authorize !== "function" || typeof definition.execute !== "function") throw new Error("Command requires authorization and execution policy.");
      definitions.set(name, { ...definition });
    },
    names: () => [...definitions.keys()],
    executeDetailed,
    execute: (name, request) => executeDetailed(name, request).state
  };
}
function jsonValue(value, depth = 0, active = /* @__PURE__ */ new Set()) {
  if (depth > 64) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || active.has(value) || Object.getOwnPropertySymbols(value).length) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
  active.add(value);
  const valid = Object.entries(Object.getOwnPropertyDescriptors(value)).every(([key, descriptor]) => Array.isArray(value) && key === "length" || "value" in descriptor && jsonValue(descriptor.value, depth + 1, active));
  active.delete(value);
  return valid;
}
function createAIGateway(registry, allowedCommands) {
  const allowed = new Set(allowedCommands);
  return {
    execute(proposal, request) {
      const parsed = typeof proposal === "string" ? JSON.parse(proposal) : proposal;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !jsonValue(parsed)) throw new Error("AI proposal must be JSON data.");
      const record2 = parsed;
      if (Object.keys(record2).some((key) => !["command", "input"].includes(key)) || typeof record2.command !== "string" || !allowed.has(record2.command) || !Object.prototype.hasOwnProperty.call(record2, "input"))
        throw new Error("AI command is not allowlisted or has an invalid envelope.");
      return registry.execute(record2.command, { ...request, input: record2.input });
    }
  };
}

// 1.Frontend/packages/domain-kit/src/events.ts
var EventDeliveryError = class extends Error {
  failures;
  constructor(failures) {
    super("One or more event handlers failed.");
    this.name = "EventDeliveryError";
    this.failures = failures;
  }
};
function createEventBus(clone = cloneRuntimeValue) {
  const subscriptions = /* @__PURE__ */ new Map();
  return {
    subscribe(type, handler) {
      if (!type.trim()) throw new Error("Event type is required.");
      const handlers = subscriptions.get(type) ?? /* @__PURE__ */ new Set();
      handlers.add(handler);
      subscriptions.set(type, handlers);
      return () => {
        handlers.delete(handler);
        if (!handlers.size) subscriptions.delete(type);
      };
    },
    async publish(event2) {
      if (!event2.id.trim() || !event2.type.trim() || !Number.isFinite(Date.parse(event2.occurredAt))) throw new Error("Event ID, type and timestamp are required.");
      const failures = [];
      for (const handler of [...subscriptions.get(event2.type) ?? []]) {
        try {
          await handler(clone(event2));
        } catch (error) {
          failures.push({ eventId: event2.id, error });
        }
      }
      if (failures.length) throw new EventDeliveryError(failures);
    }
  };
}
async function drainOutbox(port, dispatch, clone = cloneRuntimeValue) {
  const report = { delivered: [], failed: [] };
  for (const event2 of await port.pending()) {
    try {
      await dispatch(clone(event2));
      await port.markDelivered(event2.id);
      report.delivered.push(event2.id);
    } catch (error) {
      await port.markFailed(event2.id, error);
      report.failed.push({ id: event2.id, error });
    }
  }
  return report;
}
async function executeTransactionalCommand(port, execute) {
  return port.runInTransaction(async (transaction) => {
    const receipt = await execute(transaction);
    await port.persist(transaction, receipt.state);
    await port.appendOutbox(transaction, receipt.events);
    return receipt;
  });
}

// 1.Frontend/packages/domain-kit/src/configuration.ts
function createModuleRegistry(clone = cloneRuntimeValue) {
  const modules = /* @__PURE__ */ new Map();
  const get = (id, version) => {
    const manifest = modules.get(id)?.get(version);
    if (!manifest) throw new Error(`Missing module dependency: ${id}@${version}`);
    return clone(manifest);
  };
  return {
    register(manifest) {
      if (!manifest.id.trim() || !manifest.version.trim()) throw new Error("Module ID and stable version are required.");
      if (modules.get(manifest.id)?.has(manifest.version)) throw new Error(`Duplicate module version: ${manifest.id}@${manifest.version}`);
      if (manifest.capabilities && (manifest.capabilities.some((value) => typeof value !== "string" || !value.trim()) || new Set(manifest.capabilities).size !== manifest.capabilities.length)) throw new Error("Capabilities must be unique non-empty strings.");
      if (Object.entries(manifest.dependencies ?? {}).some(([id, version]) => !id.trim() || !version.trim())) throw new Error("Dependency ID and exact version are required.");
      const versions = modules.get(manifest.id) ?? /* @__PURE__ */ new Map();
      versions.set(manifest.version, clone(manifest));
      modules.set(manifest.id, versions);
    },
    get,
    snapshot(id, version, configuration, validate) {
      const dependencies = [], visited = /* @__PURE__ */ new Set(), active = /* @__PURE__ */ new Set();
      const visit = (moduleId, moduleVersion) => {
        const key = JSON.stringify([moduleId, moduleVersion]);
        if (active.has(key)) throw new Error(`Circular module dependency: ${moduleId}@${moduleVersion}`);
        if (visited.has(key)) return;
        const module2 = get(moduleId, moduleVersion);
        active.add(key);
        for (const [dependencyId, dependencyVersion] of Object.entries(module2.dependencies ?? {})) visit(dependencyId, dependencyVersion);
        active.delete(key);
        visited.add(key);
        if (moduleId !== id || moduleVersion !== version) dependencies.push(module2);
      };
      visit(id, version);
      validate?.(clone(configuration));
      const manifest = get(id, version);
      return { moduleId: id, moduleVersion: version, ...manifest.capabilities ? { capabilities: manifest.capabilities } : {}, configuration: clone(configuration), dependencies };
    }
  };
}
function mergeConfiguration(base, override, clone = cloneRuntimeValue) {
  const plain = (value) => !!value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
  const merge = (left, right) => {
    const result = clone(left);
    for (const [key, value] of Object.entries(right)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe configuration key.");
      result[key] = plain(value) && plain(left[key]) ? merge(left[key], value) : clone(value);
    }
    return result;
  };
  return merge(base, override);
}

// 1.Frontend/packages/domain-kit/src/projections.ts
function createProjectionRegistry(clone = cloneRuntimeValue) {
  const definitions = /* @__PURE__ */ new Map();
  return {
    register(name, definition) {
      if (!name.trim() || definitions.has(name)) throw new Error("Empty or duplicate projection.");
      if (typeof definition.authorize !== "function" || typeof definition.select !== "function") throw new Error("Projection requires authorization and selector.");
      definitions.set(name, { ...definition });
    },
    read(name, source, context) {
      const definition = definitions.get(name);
      if (!definition) throw new Error(`Unknown projection: ${name}`);
      if (definition.authorize(clone(context), clone(source)) !== true) throw new Error(`Projection denied: ${name}`);
      return clone(definition.select(clone(source), clone(context)));
    }
  };
}
function projectReadModel(source, context, definition, clone = cloneRuntimeValue) {
  if (definition.authorize(clone(context), clone(source)) !== true) throw new Error("Projection denied.");
  return clone(definition.select(clone(source), clone(context)));
}

// 1.Frontend/packages/domain-kit/test/runtime.test.ts
(0, import_node_test2.default)("Command allowlist authorizes and validates before reduction, isolating every phase", () => {
  const registry = createCommandRegistry();
  registry.register("stock.adjust", {
    authorize(context2, input3, state) {
      const permitted = context2.permitted;
      context2.permitted = false;
      state.count = 999;
      input3.count = 999;
      return permitted;
    },
    validate(input3, state) {
      if (!Number.isSafeInteger(input3.count)) throw new Error("Invalid count");
      state.count = 888;
    },
    execute(state, input3, context2) {
      import_strict2.default.equal(context2.permitted, true);
      state.count += input3.count;
      return state;
    },
    protect(before, after) {
      if (before.id !== after.id) throw new Error("Identity changed");
    }
  });
  const original = { id: "stock", count: 3 }, input2 = { count: 2 }, context = { permitted: true };
  const result = registry.execute("stock.adjust", { state: original, input: input2, context });
  import_strict2.default.equal(result.count, 5);
  import_strict2.default.deepEqual(original, { id: "stock", count: 3 });
  import_strict2.default.deepEqual(input2, { count: 2 });
  import_strict2.default.deepEqual(context, { permitted: true });
  import_strict2.default.throws(() => registry.execute("unknown", { state: original, input: input2, context }));
  import_strict2.default.throws(() => registry.execute("stock.adjust", { state: original, input: input2, context: { permitted: false } }));
  import_strict2.default.throws(() => registry.execute("stock.adjust", { state: original, input: { count: NaN }, context }));
  import_strict2.default.throws(() => registry.register("stock.adjust", { authorize: () => true, execute: (state) => state }));
});
(0, import_node_test2.default)("Reducer/protection failure never alters original state and expected revisions fail closed", () => {
  const registry = createCommandRegistry({ getRevision(state2) {
    const revision = state2.revision;
    state2.revision = 99;
    return revision;
  } });
  registry.register("identity.replace", { authorize: () => true, execute(state2) {
    state2.id = "other";
    return state2;
  }, protect(before, after) {
    if (before.id !== after.id) throw new Error("Protected ID");
  } });
  registry.register("fail", { authorize: () => true, execute(state2) {
    state2.id = "mutated";
    throw new Error("Reducer failed");
  } });
  const state = { id: "fixed", revision: 2 };
  import_strict2.default.throws(() => registry.execute("identity.replace", { state, input: null, context: null, expectedRevision: 2 }), /Protected ID/);
  import_strict2.default.throws(() => registry.execute("fail", { state, input: null, context: null }), /Reducer failed/);
  import_strict2.default.throws(() => registry.execute("fail", { state, input: null, context: null, expectedRevision: 1 }), /revision/);
  import_strict2.default.deepEqual(state, { id: "fixed", revision: 2 });
  const withoutRevision = createCommandRegistry();
  withoutRevision.register("noop", { authorize: () => true, execute: (value) => value });
  import_strict2.default.throws(() => withoutRevision.execute("noop", { state: 1, input: null, context: null, expectedRevision: 0 }), /revision/);
  import_strict2.default.throws(() => withoutRevision.execute("noop", { state: 1, input: null, context: null, expectedRevision: NaN, revision: NaN }), /revision/);
  let reduced = false;
  withoutRevision.register("async.validation", { authorize: () => true, validate: async () => {
    throw new Error("Async validation cannot be awaited by sync registry");
  }, execute: (state2) => {
    reduced = true;
    return state2;
  } });
  import_strict2.default.throws(() => withoutRevision.execute("async.validation", { state: 1, input: null, context: null }), /synchronous/);
  import_strict2.default.equal(reduced, false);
});
(0, import_node_test2.default)("Unrelated library and warehouse adapters reuse commands without domain defaults", () => {
  const library = createCommandRegistry();
  library.register("book.borrow", { authorize: (context) => context.role === "reader", validate(_input, state) {
    if (state.available < 1) throw new Error("Unavailable");
  }, execute: (state) => ({ available: state.available - 1 }) });
  import_strict2.default.deepEqual(library.execute("book.borrow", { state: { available: 1 }, context: { role: "reader" }, input: {} }), { available: 0 });
  const warehouse = createCommandRegistry();
  warehouse.register("stock.receive", { authorize: (context) => context.role === "receiver", validate(input2) {
    if (input2.units <= 0) throw new Error("Invalid units");
  }, execute: (state, input2) => ({ units: state.units + input2.units }) });
  import_strict2.default.deepEqual(warehouse.execute("stock.receive", { state: { units: 4 }, input: { units: 3 }, context: { role: "receiver" } }), { units: 7 });
});
(0, import_node_test2.default)("AI gateway permits only JSON command proposals and still enforces command policy", () => {
  const registry = createCommandRegistry();
  registry.register("counter.add", { authorize: (context) => context.allowed, validate(input2) {
    if (!Number.isSafeInteger(input2)) throw new Error("Integer required");
  }, execute: (state, input2) => state + input2 });
  const gateway = createAIGateway(registry, ["counter.add"]);
  const request = { state: 2, context: { allowed: true } };
  import_strict2.default.equal(gateway.execute('{"command":"counter.add","input":3}', request), 5);
  import_strict2.default.throws(() => gateway.execute({ command: "counter.add", input: () => 3 }, request));
  import_strict2.default.throws(() => gateway.execute({ command: "counter.add", input: 3, sql: "ignored?" }, request));
  import_strict2.default.throws(() => gateway.execute({ command: "unknown", input: 3 }, request));
  import_strict2.default.throws(() => gateway.execute({ command: "counter.add", input: 3 }, { ...request, context: { allowed: false } }));
  const cyclic = {};
  cyclic.self = cyclic;
  import_strict2.default.throws(() => gateway.execute({ command: "counter.add", input: cyclic }, request), /JSON/);
  let deep = 1;
  for (let index = 0; index < 66; index++) deep = { child: deep };
  import_strict2.default.throws(() => gateway.execute({ command: "counter.add", input: deep }, request), /JSON/);
});
(0, import_node_test2.default)("Exact module versions resolve dependencies and snapshot configuration without aliasing", () => {
  const registry = createModuleRegistry();
  registry.register({ id: "core", version: "1.0.0", capabilities: ["commands", "events"] });
  registry.register({ id: "library", version: "2.0.0", dependencies: { core: "1.0.0" }, capabilities: ["borrow"] });
  registry.register({ id: "warehouse", version: "3.0.0", dependencies: { core: "1.0.0" } });
  const config = { labels: { status: "Ready" }, enabled: ["borrow"] }, snapshot = registry.snapshot("library", "2.0.0", config);
  config.labels.status = "Changed";
  import_strict2.default.equal(snapshot.configuration.labels.status, "Ready");
  import_strict2.default.equal(snapshot.dependencies[0].id, "core");
  import_strict2.default.deepEqual(snapshot.capabilities, ["borrow"]);
  import_strict2.default.deepEqual(snapshot.dependencies[0].capabilities, ["commands", "events"]);
  import_strict2.default.throws(() => registry.register({ id: "bad-caps", version: "1", capabilities: ["read", "read"] }));
  import_strict2.default.throws(() => registry.register({ id: "empty-caps", version: "1", capabilities: [""] }));
  import_strict2.default.throws(() => registry.register({ id: "core", version: "1.0.0" }));
  registry.register({ id: "broken", version: "1", dependencies: { absent: "1" } });
  import_strict2.default.throws(() => registry.snapshot("broken", "1", {}));
  registry.register({ id: "cycle", version: "1", dependencies: { cycle: "1" } });
  import_strict2.default.throws(() => registry.snapshot("cycle", "1", {}), /Circular/);
  const merged = mergeConfiguration({ labels: { status: "Ready", owner: "User" }, enabled: ["borrow"] }, { labels: { status: "Open", owner: "User" }, enabled: ["return"] });
  import_strict2.default.deepEqual(merged, { labels: { status: "Open", owner: "User" }, enabled: ["return"] });
  import_strict2.default.throws(() => mergeConfiguration({}, JSON.parse('{"__proto__":{"polluted":true}}')));
});
(0, import_node_test2.default)("Read projections authorize, redact and detach both selector input and consumer output", () => {
  const projections = createProjectionRegistry();
  projections.register("own.summary", { authorize: (context, source2) => context.id === source2.owner, select: (source2) => source2.public });
  const source = { owner: "user-1", public: { title: "Book" }, secret: "internal" };
  const result = projections.read("own.summary", source, { id: "user-1" });
  result.title = "Changed";
  import_strict2.default.equal(source.public.title, "Book");
  import_strict2.default.equal("secret" in result, false);
  import_strict2.default.throws(() => projections.read("own.summary", source, { id: "user-2" }));
  import_strict2.default.throws(() => projections.read("missing", source, { id: "user-1" }));
  projectReadModel(source, null, { authorize: () => true, select(value) {
    value.secret = "changed";
    return value.public;
  } });
  import_strict2.default.equal(source.secret, "internal");
});
var event = (id = "event-1") => ({ id, type: "counter.changed", occurredAt: "2026-10-19T10:00:00Z", payload: { count: 1 } });
(0, import_node_test2.default)("Event subscriptions isolate payloads, expose errors and support unsubscribe", async () => {
  const bus = createEventBus(), seen = [];
  const unsubscribe = bus.subscribe("counter.changed", (incoming) => {
    incoming.payload.count = 99;
  });
  bus.subscribe("counter.changed", (incoming) => {
    seen.push(incoming.payload.count);
  });
  const original = event();
  await bus.publish(original);
  unsubscribe();
  await bus.publish(original);
  import_strict2.default.deepEqual(seen, [1, 1]);
  import_strict2.default.equal(original.payload.count, 1);
  bus.subscribe("counter.changed", () => {
    throw new Error("Subscriber failed");
  });
  await import_strict2.default.rejects(() => bus.publish(original), EventDeliveryError);
});
(0, import_node_test2.default)("Host transaction rollback discards state/outbox and retry dispatch starts after commit", async () => {
  let durable = { count: 0, events: [] }, appendFails = true, committed = false;
  const port = {
    async runInTransaction(work) {
      const transaction = cloneRuntimeValue(durable);
      const result = await work(transaction);
      durable = transaction;
      committed = true;
      return result;
    },
    async persist(transaction, state) {
      transaction.count = state.count;
    },
    async appendOutbox(transaction, events) {
      if (appendFails) throw new Error("Outbox failed");
      transaction.events.push(...cloneRuntimeValue(events));
    }
  };
  const execute = () => ({ state: { count: 1 }, result: "ok", events: [event()] });
  await import_strict2.default.rejects(() => executeTransactionalCommand(port, execute), /Outbox failed/);
  import_strict2.default.deepEqual(durable, { count: 0, events: [] });
  import_strict2.default.equal(committed, false);
  appendFails = false;
  await executeTransactionalCommand(port, execute);
  import_strict2.default.equal(durable.count, 1);
  import_strict2.default.equal(durable.events.length, 1);
  let dispatchFails = true;
  const delivered = /* @__PURE__ */ new Set(), failed = [];
  const outbox = { async pending() {
    return durable.events.filter((item) => !delivered.has(item.id));
  }, async markDelivered(id) {
    delivered.add(id);
  }, async markFailed(id) {
    failed.push(id);
  } };
  const dispatch = async () => {
    import_strict2.default.equal(committed, true);
    if (dispatchFails) throw new Error("Transport failed");
  };
  import_strict2.default.equal((await drainOutbox(outbox, dispatch)).failed.length, 1);
  import_strict2.default.equal(delivered.size, 0);
  dispatchFails = false;
  import_strict2.default.deepEqual((await drainOutbox(outbox, dispatch)).delivered, ["event-1"]);
  import_strict2.default.equal(failed.length, 1);
  import_strict2.default.equal((await drainOutbox(outbox, dispatch)).delivered.length, 0);
});

// 1.Frontend/packages/scheduling-kit/test/scheduling.test.ts
var import_node_test3 = __toESM(require("node:test"), 1);
var import_strict3 = __toESM(require("node:assert/strict"), 1);

// 1.Frontend/packages/scheduling-kit/src/availability.ts
var validInterval = (value) => Boolean(value && Number.isFinite(value.start) && Number.isFinite(value.end) && value.start < value.end);
var validId = (value) => typeof value === "string" && value.trim().length > 0;
var positiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
var overlap = (left, right) => left.start < right.end && left.end > right.start;
function intervalsOverlap(left, right) {
  if (!validInterval(left) || !validInterval(right)) throw new RangeError("Intervals require finite start < end.");
  return overlap(left, right);
}
function isActiveReservation(reservation2, now) {
  return reservation2.status === "confirmed" || reservation2.status === "hold" && (reservation2.expiresAt === void 0 || reservation2.expiresAt > now);
}
function checkAvailability(input2) {
  const issues = [];
  if (!input2 || !Array.isArray(input2.resources) || !Array.isArray(input2.reservations) || !Array.isArray(input2.requests))
    return [{ code: "INVALID_INPUT", message: "Resources, reservations and requests must be arrays." }];
  const before = input2.bufferBefore ?? 0, after = input2.bufferAfter ?? 0;
  if (!Number.isFinite(input2.now) || ![before, after].every((value) => Number.isFinite(value) && value >= 0))
    issues.push({ code: "INVALID_INPUT", message: "Current time and non-negative buffers must be finite." });
  const resourceIds = /* @__PURE__ */ new Set(), reservationIds = /* @__PURE__ */ new Set();
  for (const resource of input2.resources) {
    if (!resource || !validId(resource.id) || !positiveInteger(resource.capacity)) {
      issues.push({ code: "INVALID_INPUT", message: "Each resource requires an ID and positive integer capacity." });
      continue;
    }
    if (resourceIds.has(resource.id)) issues.push({ code: "DUPLICATE_ID", resourceId: resource.id, message: "Resource IDs must be unique." });
    resourceIds.add(resource.id);
    if (resource.blackouts !== void 0 && (!Array.isArray(resource.blackouts) || resource.blackouts.some((value) => !validInterval(value))))
      issues.push({ code: "INVALID_INPUT", resourceId: resource.id, message: "Blackouts require finite start < end." });
  }
  for (const reservation2 of input2.reservations) {
    if (!reservation2 || !validId(reservation2.id) || !validId(reservation2.resourceId) || !validInterval(reservation2) || !positiveInteger(reservation2.quantity) || !["hold", "confirmed", "cancelled"].includes(reservation2.status) || reservation2.expiresAt !== void 0 && !Number.isFinite(reservation2.expiresAt)) {
      issues.push({ code: "INVALID_INPUT", message: "Reservation ID, resource, interval, quantity, status or expiry is invalid." });
      continue;
    }
    if (reservationIds.has(reservation2.id)) issues.push({ code: "DUPLICATE_ID", reservationId: reservation2.id, message: "Reservation IDs must be unique." });
    reservationIds.add(reservation2.id);
    if (!resourceIds.has(reservation2.resourceId)) issues.push({ code: "UNKNOWN_RESOURCE", reservationId: reservation2.id, resourceId: reservation2.resourceId, message: "Reservation resource does not exist." });
  }
  input2.requests.forEach((request, requestIndex) => {
    if (!request || !validId(request.resourceId) || !validInterval(request) || !positiveInteger(request.quantity)) {
      issues.push({ code: "INVALID_INPUT", requestIndex, message: "Requests require a resource, finite start < end and positive integer quantity." });
      return;
    }
    if (!resourceIds.has(request.resourceId)) issues.push({ code: "UNKNOWN_RESOURCE", requestIndex, resourceId: request.resourceId, message: "Requested resource does not exist." });
  });
  if (issues.length) return issues;
  const expand = (interval) => ({ start: interval.start - before, end: interval.end + after });
  const requests = input2.requests.map(expand);
  const active = input2.reservations.filter((row) => row.id !== input2.excludeReservationId && isActiveReservation(row, input2.now));
  if ([...requests, ...active.map(expand)].some((value) => !validInterval(value)))
    return [{ code: "INVALID_INPUT", message: "Buffer expansion exceeds finite interval bounds." }];
  for (const resource of input2.resources) {
    const candidateIndices = input2.requests.map((row, index2) => row.resourceId === resource.id ? index2 : -1).filter((index2) => index2 >= 0);
    if (!candidateIndices.length) continue;
    for (const requestIndex of candidateIndices) {
      const blackout = resource.blackouts?.find((interval) => overlap(interval, requests[requestIndex]));
      if (blackout) issues.push({ code: "BLACKOUT", resourceId: resource.id, requestIndex, start: blackout.start, end: blackout.end, message: "Requested interval intersects resource unavailability." });
    }
    const events = [];
    const add = (interval, quantity, candidate) => {
      events.push({ at: interval.start, delta: BigInt(quantity), candidates: candidate ? 1 : 0 });
      events.push({ at: interval.end, delta: -BigInt(quantity), candidates: candidate ? -1 : 0 });
    };
    for (const reservation2 of active) if (reservation2.resourceId === resource.id) add(expand(reservation2), reservation2.quantity, false);
    for (const index2 of candidateIndices) add(requests[index2], input2.requests[index2].quantity, true);
    events.sort((left, right) => left.at - right.at);
    let load = BigInt(0), candidates = 0, index = 0;
    while (index < events.length) {
      const at = events[index].at;
      while (index < events.length && events[index].at === at) {
        load += events[index].delta;
        candidates += events[index].candidates;
        index++;
      }
      if (index < events.length && events[index].at > at && candidates > 0 && load > BigInt(resource.capacity)) {
        issues.push({
          code: "CAPACITY_EXCEEDED",
          resourceId: resource.id,
          start: at,
          end: events[index].at,
          requestIndex: candidateIndices.find((candidate) => overlap(requests[candidate], { start: at, end: events[index].at })),
          message: "Concurrent requested quantity exceeds resource capacity."
        });
        break;
      }
    }
  }
  return issues;
}

// 1.Frontend/packages/scheduling-kit/src/stay.ts
var dayMilliseconds = 864e5;
function ordinal(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Stay dates require YYYY-MM-DD.");
  const epoch = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== value) throw new RangeError("Stay date does not exist.");
  return epoch / dayMilliseconds;
}
function stayInterval(checkIn, checkOut) {
  const start = ordinal(checkIn), end = ordinal(checkOut);
  if (end <= start) throw new RangeError("Checkout must be after check-in.");
  return { start, end, nights: end - start };
}

// 1.Frontend/packages/scheduling-kit/test/scheduling.test.ts
var reservation = (id, start, end, overrides = {}) => ({ id, resourceId: "resource", start, end, quantity: 1, status: "confirmed", ...overrides });
function input(overrides = {}) {
  return { resources: [{ id: "resource", capacity: 1 }], reservations: [], requests: [{ resourceId: "resource", start: 10, end: 20, quantity: 1 }], now: 0, ...overrides };
}
(0, import_node_test3.default)("Half-open intervals allow adjacent meetings but detect contained and cross-window overlap", () => {
  import_strict3.default.equal(intervalsOverlap({ start: 0, end: 10 }, { start: 10, end: 20 }), false);
  import_strict3.default.equal(intervalsOverlap({ start: 0, end: 10 }, { start: 9, end: 20 }), true);
  import_strict3.default.equal(intervalsOverlap({ start: 0, end: 20 }, { start: 5, end: 8 }), true);
  import_strict3.default.equal(intervalsOverlap({ start: -10, end: -1 }, { start: -5, end: 2 }), true);
});
(0, import_node_test3.default)("Meeting availability rejects overlap and permits adjacency", () => {
  import_strict3.default.deepEqual(checkAvailability(input({ reservations: [reservation("previous", 0, 10)] })), []);
  import_strict3.default.equal(checkAvailability(input({ reservations: [reservation("previous", 9, 11)] }))[0].code, "CAPACITY_EXCEEDED");
});
(0, import_node_test3.default)("Crew and gear candidate allocations are checked together without mutating any input", () => {
  const value = input({
    resources: [{ id: "crew", capacity: 1 }, { id: "gear", capacity: 1 }],
    reservations: [reservation("gear-busy", 10, 20, { resourceId: "gear" })],
    requests: [{ resourceId: "crew", start: 10, end: 20, quantity: 1 }, { resourceId: "gear", start: 10, end: 20, quantity: 1 }]
  });
  const before = structuredClone(value), issues = checkAvailability(value);
  import_strict3.default.equal(issues.length, 1);
  import_strict3.default.equal(issues[0].resourceId, "gear");
  import_strict3.default.deepEqual(value, before);
});
(0, import_node_test3.default)("Hotel type inventory counts concurrent rooms rather than summing disjoint reservations", () => {
  const value = input({ resources: [{ id: "resource", capacity: 2 }], reservations: [reservation("first", 10, 15), reservation("second", 15, 20)] });
  import_strict3.default.deepEqual(checkAvailability(value), []);
  value.reservations.push(reservation("cross-window", 14, 16));
  import_strict3.default.equal(checkAvailability(value)[0].code, "CAPACITY_EXCEEDED");
});
(0, import_node_test3.default)("Overlapping candidate requests consume capacity collectively", () => {
  import_strict3.default.equal(checkAvailability(input({ requests: [{ resourceId: "resource", start: 10, end: 20, quantity: 1 }, { resourceId: "resource", start: 15, end: 25, quantity: 1 }] }))[0].code, "CAPACITY_EXCEEDED");
  import_strict3.default.deepEqual(checkAvailability(input({ requests: [{ resourceId: "resource", start: 10, end: 20, quantity: 1 }, { resourceId: "resource", start: 20, end: 25, quantity: 1 }] })), []);
});
(0, import_node_test3.default)("Existing overcapacity outside requested windows does not reject unrelated availability", () => {
  import_strict3.default.deepEqual(checkAvailability(input({ reservations: [reservation("one", 0, 5), reservation("two", 0, 5)] })), []);
});
(0, import_node_test3.default)("Expired holds release at exact expiry while confirmed reservations keep occupying", () => {
  import_strict3.default.deepEqual(checkAvailability(input({ now: 5, reservations: [reservation("hold", 10, 20, { status: "hold", expiresAt: 5 })] })), []);
  import_strict3.default.equal(checkAvailability(input({ now: 4, reservations: [reservation("hold", 10, 20, { status: "hold", expiresAt: 5 })] }))[0].code, "CAPACITY_EXCEEDED");
  import_strict3.default.equal(checkAvailability(input({ now: 5, reservations: [reservation("hold", 10, 20, { status: "hold" })] }))[0].code, "CAPACITY_EXCEEDED");
  import_strict3.default.equal(checkAvailability(input({ now: 5, reservations: [reservation("confirmed", 10, 20, { expiresAt: 1 })] }))[0].code, "CAPACITY_EXCEEDED");
});
(0, import_node_test3.default)("Cancellation releases capacity and update exclusion omits only the named reservation", () => {
  import_strict3.default.deepEqual(checkAvailability(input({ reservations: [reservation("cancelled", 10, 20, { status: "cancelled" })] })), []);
  import_strict3.default.deepEqual(checkAvailability(input({ reservations: [reservation("editing", 10, 20)], excludeReservationId: "editing" })), []);
  import_strict3.default.equal(checkAvailability(input({ reservations: [reservation("editing", 10, 20), reservation("other", 10, 20)], excludeReservationId: "editing" }))[0].code, "CAPACITY_EXCEEDED");
});
(0, import_node_test3.default)("Blackouts reject overlap but allow adjacency, including buffered preparation", () => {
  const resources = [{ id: "resource", capacity: 1, blackouts: [{ start: 0, end: 10 }] }];
  import_strict3.default.deepEqual(checkAvailability(input({ resources })), []);
  import_strict3.default.equal(checkAvailability(input({ resources, bufferBefore: 1 }))[0].code, "BLACKOUT");
});
(0, import_node_test3.default)("Buffers expand existing and requested occupied intervals with exact gap adjacency", () => {
  const reservations = [reservation("previous", 0, 8)];
  import_strict3.default.deepEqual(checkAvailability(input({ reservations, bufferBefore: 1, bufferAfter: 1 })), []);
  import_strict3.default.equal(checkAvailability(input({ reservations, bufferBefore: 2, bufferAfter: 1 }))[0].code, "CAPACITY_EXCEEDED");
});
(0, import_node_test3.default)("Strict date-only hotel stays use ordinal days and exclusive checkout through leap/month/year changes", () => {
  const stay = stayInterval("2028-02-28", "2028-03-01");
  import_strict3.default.equal(stay.nights, 2);
  import_strict3.default.equal(stay.end - stay.start, 2);
  const first = stayInterval("2026-12-31", "2027-01-02"), next = stayInterval("2027-01-02", "2027-01-04");
  import_strict3.default.equal(first.nights, 2);
  import_strict3.default.equal(intervalsOverlap(first, next), false);
  import_strict3.default.deepEqual(checkAvailability(input({ reservations: [reservation("stay", first.start, first.end)], requests: [{ resourceId: "resource", start: next.start, end: next.end, quantity: 1 }] })), []);
});
(0, import_node_test3.default)("Invalid hotel dates, equal/reverse checkout and non date-only values are rejected", () => {
  for (const [checkIn, checkOut] of [["2026-02-29", "2026-03-02"], ["2026-02-31", "2026-03-02"], ["2026-13-01", "2027-01-02"], ["2026-10-01", "2026-10-01"], ["2026-10-02", "2026-10-01"], ["2026-1-01", "2026-10-02"], ["2026-10-01T00:00:00Z", "2026-10-02"]])
    import_strict3.default.throws(() => stayInterval(checkIn, checkOut), RangeError);
});
(0, import_node_test3.default)("Duplicate resource and reservation IDs are rejected even when reservations are excluded", () => {
  import_strict3.default.equal(checkAvailability(input({ resources: [{ id: "resource", capacity: 1 }, { id: "resource", capacity: 2 }] }))[0].code, "DUPLICATE_ID");
  import_strict3.default.equal(checkAvailability(input({ reservations: [reservation("same", 1, 2), reservation("same", 3, 4)], excludeReservationId: "same" }))[0].code, "DUPLICATE_ID");
});
(0, import_node_test3.default)("Quantity and capacity require positive safe integers; unknown resources are rejected", () => {
  for (const quantity of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    import_strict3.default.equal(checkAvailability(input({ requests: [{ resourceId: "resource", start: 10, end: 20, quantity }] }))[0].code, "INVALID_INPUT");
    import_strict3.default.equal(checkAvailability(input({ resources: [{ id: "resource", capacity: quantity }] }))[0].code, "INVALID_INPUT");
  }
  import_strict3.default.equal(checkAvailability(input({ requests: [{ resourceId: "missing", start: 10, end: 20, quantity: 1 }] }))[0].code, "UNKNOWN_RESOURCE");
  import_strict3.default.equal(checkAvailability(input({ reservations: [reservation("missing", 0, 1, { resourceId: "missing" })] }))[0].code, "UNKNOWN_RESOURCE");
});
(0, import_node_test3.default)("Invalid intervals, expiry, clock, blackouts and buffers return validation issues", () => {
  for (const interval of [{ start: 0, end: 0 }, { start: 1, end: 0 }, { start: NaN, end: 2 }, { start: 0, end: Infinity }]) {
    import_strict3.default.throws(() => intervalsOverlap(interval, { start: 0, end: 1 }), RangeError);
    import_strict3.default.equal(checkAvailability(input({ requests: [{ ...interval, quantity: 1, resourceId: "resource" }] }))[0].code, "INVALID_INPUT");
  }
  for (const value of [input({ now: NaN }), input({ bufferAfter: -1 }), input({ bufferBefore: Infinity }), input({ reservations: [reservation("bad", 0, 1, { expiresAt: NaN })] }), input({ resources: [{ id: "resource", capacity: 1, blackouts: [{ start: 2, end: 1 }] }] })])
    import_strict3.default.equal(checkAvailability(value)[0].code, "INVALID_INPUT");
});
(0, import_node_test3.default)("Buffer numeric overflow is rejected and high integer capacities remain exact", () => {
  import_strict3.default.equal(checkAvailability(input({ requests: [{ resourceId: "resource", start: 1e308, end: 11e307, quantity: 1 }], bufferAfter: 1e308 }))[0].code, "INVALID_INPUT");
  import_strict3.default.equal(checkAvailability(input({ resources: [{ id: "resource", capacity: Number.MAX_SAFE_INTEGER }], reservations: [reservation("large", 10, 20, { quantity: Number.MAX_SAFE_INTEGER - 1 })], requests: [{ resourceId: "resource", start: 10, end: 20, quantity: 2 }] }))[0].code, "CAPACITY_EXCEEDED");
});

// 3.Knowledge/scripts/generic_packages_2026_10_19/commands-consumer.test.ts
var import_node_test4 = __toESM(require("node:test"));
var import_strict4 = __toESM(require("node:assert/strict"));

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
  for (const event2 of data.events) {
    if (!event2.title?.trim() || !["visit", "milestone"].includes(event2.kind) || event2.allDay !== true || typeof event2.requiresReview !== "boolean" || typeof event2.note !== "string" || typeof event2.rawDate !== "string" || typeof event2.sourceCell !== "string") throw new Error("Jadwal tidak valid.");
    if (event2.startDate !== null && !validDate(event2.startDate) || event2.endDate !== null && !validDate(event2.endDate) || event2.endDate && (!event2.startDate || event2.endDate < event2.startDate)) throw new Error("Tanggal atau rentang jadwal tidak valid.");
    if (!event2.startDate && !event2.requiresReview) throw new Error("Jadwal tanpa tanggal harus ditandai perlu review.");
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
function syncTicketFields(data) {
  const next = structuredClone(data);
  const values = { campaign_id: next.campaign.id, fee_amount: next.campaign.feeAmount, paid_amount: next.campaign.paidAmount === null && !next.payments.length ? null : (next.campaign.paidAmount ?? 0) + next.payments.reduce((sum, row) => sum + row.amount, 0), payment_status: next.campaign.paymentStatus };
  next.collections.workspaces = next.collections.workspaces.map((workspace2) => workspace2.id === next.user.id ? { ...workspace2, name: next.user.name } : workspace2);
  next.collections.tickets = next.collections.tickets.map((ticket) => ({ ...ticket, fields: ticket.fields.map((field) => Object.prototype.hasOwnProperty.call(values, field.cstm_col) ? { ...field, value: values[field.cstm_col] } : field) }));
  return next;
}

// 1.Frontend/HOTS/src/features/cineva-offline/commands.ts
function createOfflineCommandRegistry() {
  const commands = createCommandRegistry();
  commands.register("document.update", {
    authorize: (context) => context.mode === "offline-demo" && context.canEdit === true,
    validate: (input2) => validateData(input2.next),
    execute: (_current, input2) => syncTicketFields(input2.next)
  });
  return commands;
}

// 3.Knowledge/scripts/generic_packages_2026_10_19/commands-consumer.test.ts
(0, import_node_test4.default)("Offline adapter authorizes explicitly and rejects invalid/stale documents without altering originals", () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), next = syntheticData();
  next.user.name = "Edited synthetic Creator";
  const request = { state, input: { next }, context: { mode: "offline-demo", canEdit: true }, expectedRevision: 2, revision: 2 };
  import_strict4.default.throws(() => commands.execute("document.update", { ...request, context: { ...request.context, canEdit: false } }), /denied/);
  import_strict4.default.throws(() => commands.execute("document.update", { ...request, expectedRevision: 1 }), /revision/);
  import_strict4.default.throws(() => commands.execute("document.update", { ...request, revision: void 0 }), /revision/);
  const invalid = syntheticData();
  invalid.campaign.feeAmount = -1;
  import_strict4.default.throws(() => commands.execute("document.update", { ...request, input: { next: invalid } }));
  import_strict4.default.equal(state.user.name, "Kreator Simulasi");
  import_strict4.default.equal(state.campaign.feeAmount, 3e5);
});
(0, import_node_test4.default)("Offline adapter returns detached valid documents and synchronizes existing EAV fields", () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), proposed = syntheticData();
  proposed.user.name = "Edited synthetic Creator";
  proposed.campaign.feeAmount = 4e5;
  proposed.payments = [{ id: "dummy-payment", amount: 1e5, paidAt: "2026-10-19", evidence: "Synthetic proof" }];
  proposed.collections.tickets[0].fields.push({ cstm_col: "paid_amount", lbl_col: "Paid", value: null });
  const result = commands.execute("document.update", { state, input: { next: proposed }, context: { mode: "offline-demo", canEdit: true }, expectedRevision: 0, revision: 0 });
  import_strict4.default.equal(result.collections.tickets[0].fields.find((field) => field.cstm_col === "fee_amount")?.value, 4e5);
  import_strict4.default.equal(result.collections.tickets[0].fields.find((field) => field.cstm_col === "paid_amount")?.value, 1e5);
  result.user.name = "Detached result";
  import_strict4.default.equal(proposed.user.name, "Edited synthetic Creator");
  import_strict4.default.equal(state.user.name, "Kreator Simulasi");
});
(0, import_node_test4.default)("Offline adapter preserves valid replacement document imports and keeps namespace policy in host", () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), next = syntheticData();
  next.datasetId = "different-valid-import";
  const result = commands.execute("document.update", { state, input: { next }, context: { mode: "offline-demo", canEdit: true } });
  import_strict4.default.equal(result.datasetId, "different-valid-import");
  import_strict4.default.equal(state.datasetId, "synthetic-cineva-demo");
});

// 3.Knowledge/scripts/generic_packages_2026_10_19/scheduling-consumer.test.ts
var import_node_test5 = __toESM(require("node:test"));
var import_strict5 = __toESM(require("node:assert/strict"));

// 1.Frontend/HOTS/src/features/cineva-shared/scheduling.ts
function findResourceConflict(draft2, workspace2, excludeId) {
  const ids = [...new Set(draft2.resourceIds)];
  if (!ids.length) return void 0;
  const start = (/* @__PURE__ */ new Date(draft2.scheduledAt + "+07:00")).getTime(), end = start + draft2.durationHours * 36e5;
  const resources = ids.map((id) => ({ id, capacity: 1 }));
  const requests = ids.map((resourceId) => ({ resourceId, start, end, quantity: 1 }));
  const policyConflict = (issues) => {
    const invalid = issues.find((issue) => issue.code !== "CAPACITY_EXCEEDED");
    if (invalid) throw new Error(`Jadwal resource tidak valid: ${invalid.message}`);
    return issues.some((issue) => issue.code === "CAPACITY_EXCEEDED");
  };
  policyConflict(checkAvailability({ resources, reservations: [], requests, now: 0 }));
  return workspace2.jobs.find((job2, index) => {
    if (job2.archived || job2.id === excludeId) return false;
    const resourceIds = [...new Set(job2.resourceIds)].filter((id) => ids.includes(id));
    if (!resourceIds.length) return false;
    const jobStart = (/* @__PURE__ */ new Date(job2.scheduledAt + "+07:00")).getTime(), jobEnd = jobStart + job2.durationHours * 36e5;
    if (!Number.isFinite(jobStart) || !Number.isFinite(jobEnd) || jobEnd <= jobStart) return false;
    const reservations = resourceIds.map((resourceId, resourceIndex) => ({
      id: `${index}:${resourceIndex}`,
      resourceId,
      start: jobStart,
      end: jobEnd,
      quantity: 1,
      status: "confirmed"
    }));
    return policyConflict(checkAvailability({ resources, reservations, requests, now: 0 }));
  });
}

// 1.Frontend/HOTS/src/features/cineva-shared/model.ts
var jobDate = (value) => /* @__PURE__ */ new Date(value + "+07:00");
function validateDraft(draft2, workspace2, excludeId) {
  if (!draft2.title.trim() || !workspace2.clients.some((c) => c.id === draft2.clientId))
    throw new Error("Judul dan client wajib diisi.");
  if (!["Campaign", "Production", "Content Shoot"].includes(draft2.type))
    throw new Error("Jenis project tidak valid.");
  if (!draft2.platform.trim() || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft2.scheduledAt) || !Number.isFinite(jobDate(draft2.scheduledAt).getTime()) || jobDate(draft2.scheduledAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) !== draft2.scheduledAt.slice(0, 10))
    throw new Error("Platform dan jadwal wajib valid.");
  if (![draft2.fee, draft2.barter].every((n) => Number.isSafeInteger(n) && n >= 0) || !Number.isFinite(draft2.durationHours) || draft2.durationHours <= 0 || draft2.durationHours > 24)
    throw new Error("Nominal harus rupiah bulat positif dan durasi 1\u201324 jam.");
  if (draft2.resourceIds.some((id) => !workspace2.resources.some((r) => r.id === id)))
    throw new Error("Resource tidak ditemukan di workspace ini.");
  const clash = findResourceConflict(draft2, workspace2, excludeId);
  if (clash)
    throw new Error(`Jadwal resource bertabrakan dengan ${clash.title}.`);
}

// 3.Knowledge/scripts/generic_packages_2026_10_19/scheduling-consumer.test.ts
function draft(overrides = {}) {
  return { title: "Shoot dummy", brief: "", clientId: "client", type: "Production", platform: "Instagram", scheduledAt: "2026-10-20T10:00", durationHours: 2, fee: 0, barter: 0, resourceIds: ["crew"], ...overrides };
}
function job(id, overrides = {}) {
  return { ...draft(), id, ticketId: `DUMMY-${id}`, paid: 0, status: "running", archived: false, deliverables: [], ...overrides };
}
function workspace(jobs = []) {
  return {
    product: "hq",
    clients: [{ id: "client", name: "Client dummy", contact: "", email: "" }],
    resources: [{ id: "crew", name: "Crew dummy", kind: "crew" }, { id: "gear", name: "Gear dummy", kind: "gear" }],
    jobs,
    plan: "starter"
  };
}
(0, import_node_test5.default)("Cineva adapter preserves exact original clash message and first job ordering", () => {
  const rows = [job("first", { title: "First title", scheduledAt: "2026-10-20T11:00" }), job("second", { title: "Earlier overlap", scheduledAt: "2026-10-20T09:00" })];
  import_strict5.default.throws(() => validateDraft(draft(), workspace(rows)), { message: "Jadwal resource bertabrakan dengan First title." });
  import_strict5.default.equal(findResourceConflict(draft(), workspace(rows))?.id, "first");
});
(0, import_node_test5.default)("Cineva crew/gear allocations allow adjacent slots and reject contained overlap", () => {
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("previous", { scheduledAt: "2026-10-20T08:00" })])));
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("next", { scheduledAt: "2026-10-20T12:00" })])));
  import_strict5.default.throws(() => validateDraft(draft({ resourceIds: ["crew", "gear"] }), workspace([job("gear-busy", { resourceIds: ["gear"], scheduledAt: "2026-10-20T10:30", durationHours: 0.5 })])), /bertabrakan/);
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("different", { resourceIds: ["gear"] })])));
});
(0, import_node_test5.default)("Archive and excluded updates release allocations; done but unarchived retains legacy occupancy", () => {
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("old", { archived: true })])));
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("editing")]), "editing"));
  import_strict5.default.throws(() => validateDraft(draft(), workspace([job("done", { status: "done" })])), /bertabrakan/);
});
(0, import_node_test5.default)("Repeated resource IDs and unrelated malformed legacy rows retain old draft compatibility", () => {
  import_strict5.default.doesNotThrow(() => validateDraft(draft({ resourceIds: ["crew", "crew"] }), workspace()));
  import_strict5.default.throws(() => validateDraft(draft(), workspace([job("repeat", { resourceIds: ["crew", "crew"] })])), /bertabrakan/);
  import_strict5.default.doesNotThrow(() => validateDraft(draft(), workspace([job("invalid-date", { scheduledAt: "unknown" })])));
  import_strict5.default.doesNotThrow(() => validateDraft(draft({ resourceIds: [] }), workspace([job("busy")])));
});
(0, import_node_test5.default)("Existing draft errors retain validation order before generic scheduling policy", () => {
  import_strict5.default.throws(() => validateDraft(draft({ title: "" }), workspace([job("busy")])), { message: "Judul dan client wajib diisi." });
  import_strict5.default.throws(() => validateDraft(draft({ resourceIds: ["missing"] }), workspace()), { message: "Resource tidak ditemukan di workspace ini." });
  import_strict5.default.throws(() => validateDraft(draft({ scheduledAt: "invalid" }), workspace()), { message: "Platform dan jadwal wajib valid." });
});
(0, import_node_test5.default)("Adapter fails closed when generic policy receives malformed requested intervals", () => {
  import_strict5.default.throws(() => findResourceConflict(draft({ scheduledAt: "invalid" }), workspace()), /Jadwal resource tidak valid/);
  import_strict5.default.throws(() => findResourceConflict(draft({ durationHours: Infinity }), workspace()), /Jadwal resource tidak valid/);
});

// 3.Knowledge/scripts/generic_packages_2026_10_19/validation-consumer.test.ts
var import_node_test6 = __toESM(require("node:test"));
var import_strict6 = __toESM(require("node:assert/strict"));
(0, import_node_test6.default)("Offline consumer uses generic attributes and preserves source null/EAV contract", () => {
  const data = syntheticData(), original = structuredClone(data);
  validateData(data);
  import_strict6.default.deepEqual(data, original);
  import_strict6.default.equal(syncTicketFields(data).campaign.paidAmount, null);
  for (const invalid of [-1, 0.5, "100"]) {
    const next = syntheticData();
    next.user.followers = invalid;
    import_strict6.default.throws(() => validateData(next), /followers/);
  }
  const badDate = syntheticData();
  badDate.events[0].startDate = "2026-02-31";
  import_strict6.default.throws(() => validateData(badDate), /Tanggal/);
});
(0, import_node_test6.default)("Offline consumer rejects dangling batches even without an assignment referencing them", () => {
  const data = syntheticData();
  data.collections.batches.push({ id: "unused-dangling", name: "Invalid batch", campaignId: "foreign" });
  import_strict6.default.throws(() => validateData(data), /Relasi/);
  const numeric = syntheticData();
  numeric.collections.tickets[0].id = 1;
  import_strict6.default.throws(() => validateData(numeric), /ID setiap koleksi/);
  const invalidEAV = syntheticData();
  invalidEAV.collections.tickets[0].fields[0].lbl_col = "";
  import_strict6.default.throws(() => validateData(invalidEAV), /Kontrak EAV/);
});
(0, import_node_test6.default)("Offline cash policy retains Indonesian error and counts source payment plus new payments", () => {
  const data = syntheticData();
  data.campaign.paidAmount = 1e5;
  data.payments.push({ id: "new", amount: 200001, paidAt: "2026-10-25", evidence: "Synthetic proof" });
  import_strict6.default.throws(() => validateData(data), { message: "Kas tercatat melebihi fee; nominal fee tidak boleh kurang dari pembayaran." });
  data.payments[0].amount = 2e5;
  validateData(data);
  import_strict6.default.equal(data.campaign.paidAmount, 1e5);
});
