---
app: @hots/engine-client
purpose: Shared package @hots/engine-client: typed clients for the form, event, workflow, trigger and prefs engines on app-core http
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
listens: []
depends_on: ["@hots/app-core", "@hots/dynamic-form"]
must_not: ["write:*"]
---

# @hots/engine-client

One typed client per Integrated-API engine, collected from the apps that already had them. Clients accept an injected Axios instance. The standard app-core factory is cookie-only; Cineva injects its existing app-owned compatibility transport. This package does not read tokens or storage.

- **Version:** 0.2.0-cineva.1 · **Upstream:** 0.2.0 · **Local contract fixes:** 2026-10-18

Trigger list accepts `TriggerFunctionFilter`: category, function_type, search, is_active (boolean or 'true'/'false'). Deprecated `type` maps to function_type; explicit function_type wins. Active values serialize to the controller's literal true/false strings. `categories()` returns `TriggerFunctionCategory[]` containing category/count objects. Consumers use the canonical types without double casts.

## Usage
```ts
import { useHotsCore } from '@hots/app-core';
import { createEngineClient } from '@hots/engine-client';

const { http, config } = useHotsCore();
const engines = createEngineClient(http, { form: { assetOrigin: config.baseUrl } });

await engines.event.getCampaigns();
await engines.form.public.getForm('survey-2026');
await engines.trigger.execute('get_ticket_summary', { ticketId: 123 });
```
Each client can also be created alone: `createEventClient(http)`, `createFormClient(http, opts)`, `createWorkflowClient(http)`, `createTriggerClient(http)`, `createPrefsClient(http)`.

## Where each client came from
| Client | Default base path | Source | Notes |
|---|---|---|---|
| `form` (`public`, `admin`, `media`) | `/api/form-engine`, `/cms` | `form/src/formApi.ts` | Same endpoints/shapes. `media` implements the dynamic-form media adapter. Login/keeplogin and localStorage removed (cookie session). |
| `event` | `/api/event-engine` | `Event/src/services/eventEngineApi.js` (949 lines) | Split into `campaigns`, `submissions`, `pools`, `winnersAndTeam`. Same function names. Mocks removed. CSV/XLSX exports use `downloadFile`. |
| `workflow` | `/workflow-engine` | `HOTS/src/api/workflowAdmin.js` | Resolves to the response body like the original; debug logging removed. |
| `trigger` | `/hots_settings/trigger-functions` | `HOTS/src/hooks/useTriggerFunction.ts` | Calls pulled out of the React hooks. |
| `prefs` | `/hotsprefs` | `HOTS/src/hooks/usePreferences.ts` | Same store as table-engine saved views. |

## Errors
Every client throws `EngineApiError { status, code, message, details }`. `401` → `code: 'SESSION_EXPIRED'` (the app shows its session UI via `app-core` `onUnauthorized`).

## Behavior differences to know
- **Auth:** determined by the injected transport. The standard cookie factory and Cineva's compatibility adapter have different backend prerequisites; changing this client does not migrate sessions.
- **Envelope:** `{ success, data }` is unwrapped; `success:false` becomes an error. `workflow`, `trigger.execute` and `prefs` return the raw body (as their originals did).

## Not collected yet (no clean client exists in any app)
Report-table engine, document engine (render/snapshot), ticket/assignment (`/engine/ticket`, `/engine/assignment`, …): in HOTS these calls are inline inside pages/widgets. They need to be written as new clients from the backend routes (`2.Backend/Integrated-API/APP_MAP.md`).

## Structure
```
src/
  index.ts             HEAD — createEngineClient + re-exports
  core/request.ts      createEngineCall, EngineApiError, fileForm
  form/                index.ts (client), types.ts
  event/               index.ts (head), campaigns.ts, submissions.ts, pools.ts, winnersAndTeam.ts, types.ts
  hots/                workflow.ts, trigger.ts, prefs.ts
```
