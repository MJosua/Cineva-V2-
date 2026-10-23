import { cloneRuntimeValue, type RuntimeClone, type CommandReceipt } from './commands.ts';

export interface DomainEvent<P = unknown> { id: string; type: string; occurredAt: string; payload: P }
export type EventHandler = (event: DomainEvent) => void | Promise<void>;
export class EventDeliveryError extends Error {
  readonly failures: { eventId: string; error: unknown }[];
  constructor(failures: { eventId: string; error: unknown }[]) {
    super('One or more event handlers failed.'); this.name = 'EventDeliveryError'; this.failures = failures;
  }
}
export function createEventBus(clone: RuntimeClone = cloneRuntimeValue) {
  const subscriptions = new Map<string, Set<EventHandler>>();
  return {
    subscribe(type: string, handler: EventHandler) {
      if (!type.trim()) throw new Error('Event type is required.');
      const handlers = subscriptions.get(type) ?? new Set<EventHandler>(); handlers.add(handler); subscriptions.set(type, handlers);
      return () => { handlers.delete(handler); if (!handlers.size) subscriptions.delete(type); };
    },
    async publish(event: DomainEvent) {
      if (!event.id.trim() || !event.type.trim() || !Number.isFinite(Date.parse(event.occurredAt))) throw new Error('Event ID, type and timestamp are required.');
      const failures: { eventId: string; error: unknown }[] = [];
      for (const handler of [...(subscriptions.get(event.type) ?? [])]) {
        try { await handler(clone(event)); } catch (error) { failures.push({ eventId: event.id, error }); }
      }
      if (failures.length) throw new EventDeliveryError(failures);
    },
  };
}
export interface OutboxPort {
  pending(): Promise<DomainEvent[]>;
  markDelivered(id: string): Promise<void>;
  markFailed(id: string, error: unknown): Promise<void>;
}
/** Explicit retry port; dispatch occurs only after the host transaction has committed. */
export async function drainOutbox(port: OutboxPort, dispatch: EventHandler, clone: RuntimeClone = cloneRuntimeValue) {
  const report: { delivered: string[]; failed: { id: string; error: unknown }[] } = { delivered: [], failed: [] };
  for (const event of await port.pending()) {
    try { await dispatch(clone(event)); await port.markDelivered(event.id); report.delivered.push(event.id); }
    catch (error) { await port.markFailed(event.id, error); report.failed.push({ id: event.id, error }); }
  }
  return report;
}
export interface TransactionalCommandPort<Tx, S> {
  runInTransaction<T>(work: (transaction: Tx) => Promise<T>): Promise<T>;
  persist(transaction: Tx, state: S): Promise<void>;
  appendOutbox(transaction: Tx, events: DomainEvent[]): Promise<void>;
}
/** Host owns atomic commit/rollback; this helper never dispatches inside the transaction. */
export async function executeTransactionalCommand<Tx, S>(port: TransactionalCommandPort<Tx, S>, execute: (transaction: Tx) => CommandReceipt<S> | Promise<CommandReceipt<S>>): Promise<CommandReceipt<S>> {
  return port.runInTransaction(async transaction => {
    const receipt = await execute(transaction);
    await port.persist(transaction, receipt.state);
    await port.appendOutbox(transaction, receipt.events);
    return receipt;
  });
}
