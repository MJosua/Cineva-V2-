# Policy-driven runtime contracts

These optional pure TypeScript helpers have no React, vendor, DB, provider or runtime logging dependency. They compose host HOTS adapters; they do not replace ticket/EAV/workflow/auth services. All state and policies are supplied by consumers. ES2020 source requires a host `structuredClone`, or an injected generic `clone` function with equivalent isolation semantics.

## Commands and AI proposals

```ts
const commands = createCommandRegistry<Document, Context>();
commands.register<{ next: Document }>('document.update', {
  authorize: (context) => context.canEdit,
  validate: (input) => validateDocument(input.next),
  execute: (_current, input) => input.next,
  protect: (before, after) => assertStableIdentity(before, after),
});
const next = commands.execute('document.update', {
  state: document, input: { next: edited }, context,
  expectedRevision: currentRevision, revision: currentRevision,
});
```

`register` returns void and rejects duplicate/empty names. `execute` returns state; `executeDetailed` returns `{state,result,events}` using optional definition `result`/`events` callbacks. Unknown commands are denied. Authorization must explicitly return `true`. Validation, authorization, reducer and protection errors propagate. Command hooks must be synchronous: returned promises/thenables are rejected explicitly before proceeding. Every phase receives separate cloned inputs/state/context so a failed or mutating policy cannot alter the caller's original state, or contaminate the next phase. The returned state/result/events are detached. Host closures and external effects inside policies cannot be rolled back by cloning and must be avoided.

When `expectedRevision` is present, an actual non-negative safe integer must be provided via `revision` or `getRevision(state)`. Missing/stale/invalid revisions fail closed. Hosts must compare actual persisted revisions atomically on write; a local equality check alone is not concurrency control. Protection hooks enforce host identity/ownership/history invariants. No permissive authorization is supplied by default. Explicit `true` policies are appropriate only for deliberately unrestricted local/demo adapters, never a server authorization default.

`createAIGateway(registry, ['command.name'])` accepts only JSON `{command,input}` proposals, optionally as a JSON string. It rejects non-allowlisted actions and extra envelope keys, then uses the same validation/authorization pipeline. It does not call an LLM, execute scripts, invoke arbitrary reducers from strings, generate SQL, or bypass tenant policy. The host must validate each command's input shape; allowlisting does not validate business parameters.

## Events and transaction/outbox ports

`DomainEvent` contains caller-generated `id`, `type`, ISO-compatible `occurredAt` and `payload`. `createEventBus().subscribe(type, handler)` returns an unsubscribe callback. `publish` delivers separate payload copies to matching handlers and exposes `EventDeliveryError.failures` after attempting all subscribed handlers. It does not persist delivery, and handler retry may repeat already successful side effects.

`executeTransactionalCommand(port, execute)` calls the host's `runInTransaction`, then executes the command, persists state and appends outbox events within that transaction. The host must implement real atomic commit + rollback for both persistence and outbox. The helper never dispatches events inside the transaction. A thrown reducer/persist/outbox/commit error propagates. Tests use an isolated in-memory copy/commit adapter, not a database.

After a successful commit, a host worker may call `drainOutbox(port, dispatch)`. The explicit port supplies pending events, delivery acknowledgement and failure recording. The returned `{delivered,failed}` report includes original errors. Failed acknowledgement can cause repeated delivery: consumers need idempotency and host-managed retry/backoff/claims. These interfaces do not promise durable storage, atomic resource allocation, tenant enforcement or exactly-once delivery.

## Configuration and projections

`createModuleRegistry` registers immutable manifest copies by exact `id` + `version`; duplicate pairs are rejected. Optional `capabilities` lists unique non-empty capability names and is preserved in dependency snapshots. `snapshot(id,version,config,validate?)` resolves registered exact dependencies, rejects missing/circular dependencies, validates a detached config copy and returns a detached configuration snapshot. Versions are opaque exact strings; semver range resolution and migrations are intentionally host concerns. No config evaluation is performed. `mergeConfiguration` recursively merges plain objects, replaces arrays, detaches values and rejects unsafe override keys.

`createProjectionRegistry` registers named authorization + selector pairs; `read` rejects unknown/unauthorized views and returns detached selector output. `projectReadModel` provides the same isolation without registration. Hosts must implement explicit field redaction and ownership policies: cloning alone is not privacy. These are read models, not a persistence/cache/SSE transport.

Runtime tests exercise unrelated library and warehouse policies, command isolation, revision errors, AI allowlists, dependency snapshots, projection redaction, event failures, transaction rollback and explicit post-commit retry. No real personal data, providers or production DB are used.
