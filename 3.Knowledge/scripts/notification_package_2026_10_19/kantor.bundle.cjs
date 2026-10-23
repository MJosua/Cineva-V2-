"use strict";
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

// ../../Kantor/1.Frontend/packages/app-core/test/notifications.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"), 1);

// ../../Kantor/1.Frontend/packages/app-core/src/notifications.ts
function createNotificationClient({ http, routes, decode }) {
  return {
    async list() {
      const rows = decode.list(await http.get(routes.list));
      if (!Array.isArray(rows)) throw new TypeError("Invalid notification list.");
      return structuredClone(rows);
    },
    async unreadCount() {
      const count = decode.unread(await http.get(routes.unread));
      if (!Number.isSafeInteger(count) || count < 0) throw new TypeError("Invalid unread count.");
      return count;
    },
    async markRead(id) {
      if (typeof id !== "string" || !id.trim()) throw new TypeError("Notification ID required.");
      decode.acknowledge(await http.post(routes.read(id), {}));
    },
    async markAllRead() {
      decode.acknowledge(await http.post(routes.readAll, {}));
    }
  };
}
function subscribeNotificationEvents(source, events, onEvent, onError) {
  const listeners = [.../* @__PURE__ */ new Set(["message", ...events])].map((name) => {
    const handler = (event) => {
      try {
        onEvent(name, JSON.parse(event.data));
      } catch (error) {
        onError?.(error);
      }
    };
    source.addEventListener(name, handler);
    return { name, handler };
  });
  return () => listeners.forEach(({ name, handler }) => source.removeEventListener(name, handler));
}

// ../../Kantor/1.Frontend/packages/app-core/test/notifications.test.ts
(0, import_node_test.test)("Notification client uses injected routes, decoders and encoded IDs without auth/storage defaults", async () => {
  const calls = [], rows = [{ id: "dummy" }];
  const client = createNotificationClient({
    http: { get: async (path) => {
      calls.push(path);
      return path === "/count" ? 2 : rows;
    }, post: async (path, body) => {
      calls.push([path, body]);
      return true;
    } },
    routes: { list: "/list", unread: "/count", read: (id) => "/read/" + encodeURIComponent(id), readAll: "/all" },
    decode: { list: (value) => value, unread: (value) => value, acknowledge: (value) => {
      import_strict.default.equal(value, true);
    } }
  });
  const result = await client.list();
  result[0].id = "changed";
  import_strict.default.equal(rows[0].id, "dummy");
  import_strict.default.equal(await client.unreadCount(), 2);
  await client.markRead("a/b");
  await client.markAllRead();
  import_strict.default.deepEqual(calls, ["/list", "/count", ["/read/a%2Fb", {}], ["/all", {}]]);
});
(0, import_node_test.test)("Client rejects malformed counts/lists and propagates failed writes without optimistic success", async () => {
  const client = createNotificationClient({ http: { get: async () => null, post: async () => {
    throw new Error("dummy failure");
  } }, routes: { list: "/", unread: "/", read: (id) => id, readAll: "/" }, decode: { list: (value) => value, unread: () => -1, acknowledge() {
  } } });
  await import_strict.default.rejects(client.list());
  await import_strict.default.rejects(client.unreadCount());
  await import_strict.default.rejects(client.markRead(""));
  await import_strict.default.rejects(client.markAllRead(), /dummy failure/);
});
(0, import_node_test.test)("Named SSE subscription preserves other listeners, deduplicates and cleans up", () => {
  const source = new EventTarget(), received = [], errors = [];
  let independent = 0;
  source.addEventListener("new_comment", () => independent++);
  const stop = subscribeNotificationEvents(source, ["new_comment", "new_comment"], (name, payload) => received.push([name, payload]), (e) => errors.push(e));
  source.dispatchEvent(new MessageEvent("new_comment", { data: '{"id":1}' }));
  source.dispatchEvent(new MessageEvent("message", { data: "invalid" }));
  stop();
  stop();
  source.dispatchEvent(new MessageEvent("new_comment", { data: '{"id":2}' }));
  import_strict.default.deepEqual(received, [["new_comment", { id: 1 }]]);
  import_strict.default.equal(independent, 2);
  import_strict.default.equal(errors.length, 1);
});
