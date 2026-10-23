import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRegistry, createAIGateway, cloneRuntimeValue } from '../src/commands.ts';
import { createEventBus, drainOutbox, EventDeliveryError, executeTransactionalCommand, type DomainEvent, type TransactionalCommandPort } from '../src/events.ts';
import { createModuleRegistry, mergeConfiguration } from '../src/configuration.ts';
import { createProjectionRegistry, projectReadModel } from '../src/projections.ts';

test('Command allowlist authorizes and validates before reduction, isolating every phase', () => {
  type State = { id: string; count: number };
  const registry = createCommandRegistry<State, { permitted: boolean }>();
  registry.register<{ count: number }>('stock.adjust', {
    authorize(context, input, state) { const permitted = context.permitted; context.permitted = false; state.count = 999; input.count = 999; return permitted; },
    validate(input, state) { if (!Number.isSafeInteger(input.count)) throw new Error('Invalid count'); state.count = 888; },
    execute(state, input, context) { assert.equal(context.permitted, true); state.count += input.count; return state; },
    protect(before, after) { if (before.id !== after.id) throw new Error('Identity changed'); },
  });
  const original = { id: 'stock', count: 3 }, input = { count: 2 }, context = { permitted: true };
  const result = registry.execute('stock.adjust', { state: original, input, context });
  assert.equal(result.count, 5); assert.deepEqual(original, { id: 'stock', count: 3 });
  assert.deepEqual(input, { count: 2 }); assert.deepEqual(context, { permitted: true });
  assert.throws(() => registry.execute('unknown', { state: original, input, context }));
  assert.throws(() => registry.execute('stock.adjust', { state: original, input, context: { permitted: false } }));
  assert.throws(() => registry.execute('stock.adjust', { state: original, input: { count: NaN }, context }));
  assert.throws(() => registry.register('stock.adjust', { authorize: () => true, execute: state => state }));
});

test('Reducer/protection failure never alters original state and expected revisions fail closed', () => {
  const registry = createCommandRegistry<{ id: string; revision: number }, null>({ getRevision(state) { const revision = state.revision; state.revision = 99; return revision; } });
  registry.register('identity.replace', { authorize: () => true, execute(state) { state.id = 'other'; return state; }, protect(before, after) { if (before.id !== after.id) throw new Error('Protected ID'); } });
  registry.register('fail', { authorize: () => true, execute(state) { state.id = 'mutated'; throw new Error('Reducer failed'); } });
  const state = { id: 'fixed', revision: 2 };
  assert.throws(() => registry.execute('identity.replace', { state, input: null, context: null, expectedRevision: 2 }), /Protected ID/);
  assert.throws(() => registry.execute('fail', { state, input: null, context: null }), /Reducer failed/);
  assert.throws(() => registry.execute('fail', { state, input: null, context: null, expectedRevision: 1 }), /revision/);
  assert.deepEqual(state, { id: 'fixed', revision: 2 });
  const withoutRevision = createCommandRegistry<number, null>();
  withoutRevision.register('noop', { authorize: () => true, execute: value => value });
  assert.throws(() => withoutRevision.execute('noop', { state: 1, input: null, context: null, expectedRevision: 0 }), /revision/);
  assert.throws(() => withoutRevision.execute('noop', { state: 1, input: null, context: null, expectedRevision: NaN, revision: NaN }), /revision/);
  let reduced = false;
  withoutRevision.register('async.validation', { authorize: () => true, validate: async () => { throw new Error('Async validation cannot be awaited by sync registry'); }, execute: state => { reduced = true; return state; } });
  assert.throws(() => withoutRevision.execute('async.validation', { state: 1, input: null, context: null }), /synchronous/);
  assert.equal(reduced, false);
});

test('Unrelated library and warehouse adapters reuse commands without domain defaults', () => {
  const library = createCommandRegistry<{ available: number }, { role: string }>();
  library.register('book.borrow', { authorize: context => context.role === 'reader', validate(_input, state) { if (state.available < 1) throw new Error('Unavailable'); }, execute: state => ({ available: state.available - 1 }) });
  assert.deepEqual(library.execute('book.borrow', { state: { available: 1 }, context: { role: 'reader' }, input: {} }), { available: 0 });
  const warehouse = createCommandRegistry<{ units: number }, { role: string }>();
  warehouse.register<{ units: number }>('stock.receive', { authorize: context => context.role === 'receiver', validate(input) { if (input.units <= 0) throw new Error('Invalid units'); }, execute: (state, input) => ({ units: state.units + input.units }) });
  assert.deepEqual(warehouse.execute('stock.receive', { state: { units: 4 }, input: { units: 3 }, context: { role: 'receiver' } }), { units: 7 });
});

test('AI gateway permits only JSON command proposals and still enforces command policy', () => {
  const registry = createCommandRegistry<number, { allowed: boolean }>();
  registry.register<number>('counter.add', { authorize: context => context.allowed, validate(input) { if (!Number.isSafeInteger(input)) throw new Error('Integer required'); }, execute: (state, input) => state + input });
  const gateway = createAIGateway(registry, ['counter.add']);
  const request = { state: 2, context: { allowed: true } };
  assert.equal(gateway.execute('{"command":"counter.add","input":3}', request), 5);
  assert.throws(() => gateway.execute({ command: 'counter.add', input: () => 3 }, request));
  assert.throws(() => gateway.execute({ command: 'counter.add', input: 3, sql: 'ignored?' }, request));
  assert.throws(() => gateway.execute({ command: 'unknown', input: 3 }, request));
  assert.throws(() => gateway.execute({ command: 'counter.add', input: 3 }, { ...request, context: { allowed: false } }));
  const cyclic: { self?: unknown } = {}; cyclic.self = cyclic;
  assert.throws(() => gateway.execute({ command: 'counter.add', input: cyclic }, request), /JSON/);
  let deep: unknown = 1; for (let index = 0; index < 66; index++) deep = { child: deep };
  assert.throws(() => gateway.execute({ command: 'counter.add', input: deep }, request), /JSON/);
});

test('Exact module versions resolve dependencies and snapshot configuration without aliasing', () => {
  const registry = createModuleRegistry();
  registry.register({ id: 'core', version: '1.0.0', capabilities: ['commands', 'events'] });
  registry.register({ id: 'library', version: '2.0.0', dependencies: { core: '1.0.0' }, capabilities: ['borrow'] });
  registry.register({ id: 'warehouse', version: '3.0.0', dependencies: { core: '1.0.0' } });
  const config = { labels: { status: 'Ready' }, enabled: ['borrow'] }, snapshot = registry.snapshot('library', '2.0.0', config);
  config.labels.status = 'Changed'; assert.equal(snapshot.configuration.labels.status, 'Ready');
  assert.equal(snapshot.dependencies[0].id, 'core');
  assert.deepEqual(snapshot.capabilities, ['borrow']);
  assert.deepEqual(snapshot.dependencies[0].capabilities, ['commands', 'events']);
  assert.throws(() => registry.register({ id: 'bad-caps', version: '1', capabilities: ['read', 'read'] }));
  assert.throws(() => registry.register({ id: 'empty-caps', version: '1', capabilities: [''] }));
  assert.throws(() => registry.register({ id: 'core', version: '1.0.0' }));
  registry.register({ id: 'broken', version: '1', dependencies: { absent: '1' } });
  assert.throws(() => registry.snapshot('broken', '1', {}));
  registry.register({ id: 'cycle', version: '1', dependencies: { cycle: '1' } });
  assert.throws(() => registry.snapshot('cycle', '1', {}), /Circular/);
  const merged = mergeConfiguration({ labels: { status: 'Ready', owner: 'User' }, enabled: ['borrow'] }, { labels: { status: 'Open', owner: 'User' }, enabled: ['return'] });
  assert.deepEqual(merged, { labels: { status: 'Open', owner: 'User' }, enabled: ['return'] });
  assert.throws(() => mergeConfiguration({}, JSON.parse('{"__proto__":{"polluted":true}}')));
});

test('Read projections authorize, redact and detach both selector input and consumer output', () => {
  const projections = createProjectionRegistry<{ owner: string; public: { title: string }; secret: string }, { id: string }>();
  projections.register('own.summary', { authorize: (context, source) => context.id === source.owner, select: source => source.public });
  const source = { owner: 'user-1', public: { title: 'Book' }, secret: 'internal' };
  const result = projections.read<{ title: string }>('own.summary', source, { id: 'user-1' });
  result.title = 'Changed'; assert.equal(source.public.title, 'Book'); assert.equal('secret' in result, false);
  assert.throws(() => projections.read('own.summary', source, { id: 'user-2' }));
  assert.throws(() => projections.read('missing', source, { id: 'user-1' }));
  projectReadModel(source, null, { authorize: () => true, select(value) { value.secret = 'changed'; return value.public; } });
  assert.equal(source.secret, 'internal');
});

const event = (id = 'event-1'): DomainEvent<{ count: number }> => ({ id, type: 'counter.changed', occurredAt: '2026-10-19T10:00:00Z', payload: { count: 1 } });
test('Event subscriptions isolate payloads, expose errors and support unsubscribe', async () => {
  const bus = createEventBus(), seen: number[] = [];
  const unsubscribe = bus.subscribe('counter.changed', incoming => { (incoming.payload as { count: number }).count = 99; });
  bus.subscribe('counter.changed', incoming => { seen.push((incoming.payload as { count: number }).count); });
  const original = event(); await bus.publish(original); unsubscribe(); await bus.publish(original);
  assert.deepEqual(seen, [1, 1]); assert.equal(original.payload.count, 1);
  bus.subscribe('counter.changed', () => { throw new Error('Subscriber failed'); });
  await assert.rejects(() => bus.publish(original), EventDeliveryError);
});

test('Host transaction rollback discards state/outbox and retry dispatch starts after commit', async () => {
  type Stored = { count: number; events: DomainEvent[] };
  let durable: Stored = { count: 0, events: [] }, appendFails = true, committed = false;
  const port: TransactionalCommandPort<Stored, { count: number }> = {
    async runInTransaction<T>(work: (transaction: Stored) => Promise<T>) { const transaction = cloneRuntimeValue(durable); const result = await work(transaction); durable = transaction; committed = true; return result; },
    async persist(transaction, state) { transaction.count = state.count; },
    async appendOutbox(transaction, events) { if (appendFails) throw new Error('Outbox failed'); transaction.events.push(...cloneRuntimeValue(events)); },
  };
  const execute = () => ({ state: { count: 1 }, result: 'ok', events: [event()] });
  await assert.rejects(() => executeTransactionalCommand(port, execute), /Outbox failed/);
  assert.deepEqual(durable, { count: 0, events: [] }); assert.equal(committed, false);
  appendFails = false; await executeTransactionalCommand(port, execute);
  assert.equal(durable.count, 1); assert.equal(durable.events.length, 1);
  let dispatchFails = true; const delivered = new Set<string>(), failed: string[] = [];
  const outbox = { async pending() { return durable.events.filter(item => !delivered.has(item.id)); }, async markDelivered(id: string) { delivered.add(id); }, async markFailed(id: string) { failed.push(id); } };
  const dispatch = async () => { assert.equal(committed, true); if (dispatchFails) throw new Error('Transport failed'); };
  assert.equal((await drainOutbox(outbox, dispatch)).failed.length, 1); assert.equal(delivered.size, 0);
  dispatchFails = false; assert.deepEqual((await drainOutbox(outbox, dispatch)).delivered, ['event-1']);
  assert.equal(failed.length, 1); assert.equal((await drainOutbox(outbox, dispatch)).delivered.length, 0);
});
