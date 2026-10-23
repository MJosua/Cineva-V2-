# Modular notification client and SSE

Added in upstream HOTS app-core 0.6.0; Cineva fork 0.6.0-cineva.1. All existing root exports and SSE options remain available. New subpaths `@hots/app-core/notifications` and `@hots/app-core/sse` permit focused imports without using the root barrel. The original `connectSSE`/`useSSE` cookie/ticket contract is unchanged.

`createNotificationClient<T>({http,routes,decode})` provides list, unreadCount, markRead and markAllRead. The HTTP port exposes get(path) and post(path,body); the host supplies authentication and decoders for its API envelope. Routes are explicit: list/unread/read(id)/readAll. IDs must be nonempty strings; the host read-route mapper should URL-encode them. List output is cloned, unread counts must be nonnegative safe integers, and failed requests/acknowledgements propagate before UI state changes.

```ts
import { createNotificationClient } from '@hots/app-core/notifications';
const inbox = createNotificationClient({
  http: authenticatedHostPort,
  routes: { list: '/inbox', unread: '/inbox/count',
    read: id => '/inbox/' + encodeURIComponent(id) + '/read', readAll: '/inbox/read-all' },
  decode: hostEnvelopeDecoders,
});
```

`subscribeNotificationEvents(source,eventNames,onEvent,onError?)` attaches listeners for deduplicated named events and `message`, parses JSON, and returns cleanup. It never replaces `onmessage` or other listeners. Named SSE events do not arrive through `onmessage`. Invalid JSON or consumer exceptions go to optional onError. It does not open a connection or add authentication itself; use a host-owned source or `connectSSE`/`useSSE` as appropriate.

No event names, token storage keys, business routes, UI styling, payload fields or database columns are fixed in this package. These APIs require host authorization/tenant isolation and a compatible backend. They do not establish production integration merely by being imported.

Tests: Node 24+ can run `npm.cmd run test:notifications` in this package (native TypeScript stripping); existing TypeScript/bundler consumers remain supported.
