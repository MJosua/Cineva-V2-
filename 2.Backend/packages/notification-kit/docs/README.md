# @hots/notification-kit 0.1.0-cineva.1

Local CommonJS package for Node >=18. Additive extraction of HOTS notification/SSE responsibilities through adapters; no SQL, Express, credentials, vendor event names, implicit clock, environment reads or logging. Source reference: Cineva `core/sse-manager.js` and HOTS Kantor `app/infrastructure/realtime/sse-manager.js`, inspected 19 October 2026. No backend Kantor file was changed.

## Transport

`createSSEWriter({maxQueuedFrames=128,onError?})` exposes `write(response,event,payload):boolean` and `dispose(response)`. A true result means accepted by the server buffer/queue, not received by a browser. A false Node `response.write` result is backpressure: that frame was already accepted and is never sent twice. Later frames wait for `drain`. Queue overflow destroys that slow connection; close/error/dispose release listeners and pending frames. Hosts should provide an SSE-compatible error logger through `onError`; the package does not log or broadcast logs itself. Queue bounds count frames, not bytes; hosts must bound payload sizes.

`createSSEHub(options)` exposes `connect({tenantId,userId},response)` returning disconnect, `send(scope,event,payload)` returning `{accepted,failed}`, and `stats()`. Both scope values are nonempty strings, encoded as a tuple rather than delimiter concatenation. A response cannot register in two scopes. There is no global broadcast API in this scoped hub. The host authenticates the request, derives scope from trusted claims and establishes SSE headers/heartbeat/CORS before connecting. Never treat a query-provided tenant or user ID as authorization.

Only one writer should own application frames for a response. Heartbeat writes performed independently by a legacy route are not coordinated with this queue. Replay IDs, durable delivery, cross-process PM2 routing and shared pub/sub are not implemented. A disconnected client must reload authoritative inbox state; process memory alone does not span workers.

## Notification engine

`createNotificationEngine({repository,transport,authorize,id,clock,format,clone?})` exposes `publish`, `list`, `unreadCount`, `markRead`, `markAllRead`. Every operation requires context plus explicit scope. Policies, IDs, clocks and message formatting are injected. List supports limit 1–200 and offset; hosts should choose their platform default/maximum (Kantor transactional policy is <=100).

Repository contract:

```js
repository.transaction(async tx => tx.insert(notification));
repository.transaction(async tx => tx.markRead(scope, id));
repository.transaction(async tx => tx.markAllRead(scope));
repository.list(scope, { limit, offset });
repository.unreadCount(scope);
```

The transaction adapter must begin/commit/rollback and resolve only after commit. All repository lookups and writes must filter the full trusted tenant/user scope. A publish serializes content before inserting; it sends realtime only after the transaction resolves. Offline users retain the stored inbox entry. Delivery exceptions return an explicit failed receipt and do not erase committed state. The engine does not create a durable outbox or automatically retry after process failure. It is not a replacement for `domain-kit` outbox ports or an exactly-once delivery guarantee.

## Cineva adoption

`2.Backend/Integrated-API/core/sse-manager.js` consumes the package writer for user messages, legacy broadcasts and filtered admin logs. Existing singleton methods, notification policies, data envelopes and persistence controller remain available. The new generic repository engine is exercised with a synthetic in-memory transaction adapter; it is not connected to a new physical DB schema. Legacy persistence and auth are not certified or migrated by this change.

Frontend counterpart: `@hots/app-core/notifications` and `/sse`. Cineva `NotificationBell` uses the parameterized inbox client through `hooks/notificationAdapter.ts`; the existing SSE hook forwards named notification events through a host signal. Cookie/ticket auth migration is a separate integration; the legacy host auth adapter is retained.

Tests: `npm.cmd run test:notifications` and `test:notifications:e2e` at the Cineva root. They use synthetic data, mock legacy controller dependencies and loopback HTTP/SSE only. No database is opened.
