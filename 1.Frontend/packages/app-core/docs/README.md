---
app: @hots/app-core
purpose: Shared package @hots/app-core: provider, cookie http + CSRF, SSE, formatting, storage, media URL, file download and endpoint failover
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: [par_data_changed]
depends_on: []
must_not: ["write:*"]
---

# @hots/app-core

Environment, HTTP, SSE, formatting and storage foundation for every new program.

- **Version:** 0.5.0 · **Cineva status:** provider consumed with an app-owned compatibility transport; default cookie HTTP/SSE migration remains pending · **Peer deps:** react, react-dom, axios

## Install
```json
"@hots/app-core": "file:../packages/app-core"
```

## Usage
```tsx
// main.tsx — pick a healthy backend before rendering (2 A-records, one may hang ~18 s)
const base = await resolveApiBase({ candidates: [import.meta.env.VITE_API_URL, ...FALLBACK_URLS], skip: import.meta.env.DEV });

import { HotsCoreProvider, configFromEnv, resolveApiBase, useHotsCore, unwrap, listParams } from '@hots/app-core';

const config = configFromEnv(import.meta.env, { baseUrl: base, onUnauthorized: () => showSessionExpired() });

<HotsCoreProvider appKey="mapit" config={config}>
  <App />
</HotsCoreProvider>

// inside a component
const { http } = useHotsCore();
const res = await http.get('/api/mapit/stores', { params: listParams({ page: 1, limit: 50 }) });
const { data, pagination } = unwrap<Store[]>(res.data);
```

## Rules enforced
- Cookie-only auth: never sets `Authorization: Bearer`, never stores tokens. `createAppStorage` throws on token-like keys.
- CSRF: on POST/PUT/PATCH/DELETE copies the readable `csrf_token` cookie into `X-CSRF-Token` (backend middleware required).
- SSE: `useSSE({ mode: 'cookie' | 'ticket' })` — the login token is never placed in the URL.
- Pagination: `listParams` clamps `limit` to 100.

## Backend contract still to implement (Integrated-API)
| Item | Contract |
|---|---|
| CSRF | Set readable cookie `csrf_token`; verify `X-CSRF-Token` + `Origin` allowlist on mutating requests |
| SSE ticket | `POST /sse/ticket` → `{ success, data: { ticket, expires_in } }`; ticket single-use, TTL 30–60s |
| Envelope | `{ success, data, message, pagination: { page, limit, total }, errors? }` |

See [API](./API.md) · [CHANGELOG](./CHANGELOG.md) · [DECISIONS](./DECISIONS/).
