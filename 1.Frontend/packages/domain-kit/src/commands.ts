import type { DomainEvent } from './events.ts';

export type RuntimeClone = <T>(value: T) => T;
/** ES2020 types, with a host structuredClone implementation (or injected clone). */
export const cloneRuntimeValue: RuntimeClone = <T>(value: T): T => {
  const clone = (globalThis as unknown as { structuredClone?: RuntimeClone }).structuredClone;
  if (!clone) throw new Error('A structuredClone implementation or injected clone is required.');
  return clone(value);
};
export interface CommandDefinition<S, C, I> {
  authorize(context: C, input: I, state: S): boolean;
  validate?(input: I, state: S, context: C): void;
  execute(state: S, input: I, context: C): S;
  protect?(before: S, after: S, context: C): void;
  result?(state: S, input: I, context: C): unknown;
  events?(before: S, after: S, input: I, context: C): DomainEvent[];
}
export interface CommandRequest<S, C> {
  state: S; input: unknown; context: C; expectedRevision?: number; revision?: number;
}
export interface CommandReceipt<S> { state: S; result: unknown; events: DomainEvent[] }
function synchronous<T>(value: T, phase: string): T {
  if (value && (typeof value === 'object' || typeof value === 'function') && typeof (value as { then?: unknown }).then === 'function') {
    void Promise.resolve(value).catch(() => undefined);
    throw new Error(`${phase} must be synchronous. Use an async host transaction adapter instead.`);
  }
  return value;
}
export function createCommandRegistry<S, C>(options: { clone?: RuntimeClone; getRevision?: (state: S) => number } = {}) {
  const clone = options.clone ?? cloneRuntimeValue;
  const definitions = new Map<string, CommandDefinition<S, C, unknown>>();
  const executeDetailed = (name: string, request: CommandRequest<S, C>): CommandReceipt<S> => {
    const definition = definitions.get(name);
    if (!definition) throw new Error(`Unknown command: ${name}`);
    const baseline = clone(request.state), input = clone(request.input), context = clone(request.context);
    if (request.expectedRevision !== undefined) {
      const actual = options.getRevision ? synchronous(options.getRevision(clone(baseline)), 'Revision policy') : request.revision;
      if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0 || !Number.isSafeInteger(actual) || actual! < 0 || actual !== request.expectedRevision)
        throw new Error('Command revision conflict or missing actual revision.');
    }
    if (synchronous(definition.authorize(clone(context), clone(input), clone(baseline)), 'Authorization policy') !== true) throw new Error(`Command denied: ${name}`);
    synchronous(definition.validate?.(clone(input), clone(baseline), clone(context)), 'Validation policy');
    const state = clone(synchronous(definition.execute(clone(baseline), clone(input), clone(context)), 'Command reducer'));
    synchronous(definition.protect?.(clone(baseline), clone(state), clone(context)), 'Protection policy');
    const result = definition.result ? clone(synchronous(definition.result(clone(state), clone(input), clone(context)), 'Result policy')) : undefined;
    const events = definition.events ? clone(synchronous(definition.events(clone(baseline), clone(state), clone(input), clone(context)), 'Event policy')) : [];
    return { state, result, events };
  };
  return {
    register<I>(name: string, definition: CommandDefinition<S, C, I>) {
      if (!name.trim() || definitions.has(name)) throw new Error(`Empty or duplicate command: ${name}`);
      if (typeof definition.authorize !== 'function' || typeof definition.execute !== 'function') throw new Error('Command requires authorization and execution policy.');
      definitions.set(name, { ...definition } as CommandDefinition<S, C, unknown>);
    },
    names: () => [...definitions.keys()],
    executeDetailed,
    execute: (name: string, request: CommandRequest<S, C>): S => executeDetailed(name, request).state,
  };
}

function jsonValue(value: unknown, depth = 0, active = new Set<object>()): boolean {
  if (depth > 64) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || active.has(value) || Object.getOwnPropertySymbols(value).length) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
  active.add(value);
  const valid = Object.entries(Object.getOwnPropertyDescriptors(value)).every(([key, descriptor]) =>
    (Array.isArray(value) && key === 'length') || ('value' in descriptor && jsonValue(descriptor.value, depth + 1, active)));
  active.delete(value); return valid;
}
/** A proposal gateway only: no model invocation, eval, SQL, or authorization bypass. */
export function createAIGateway<S, C>(registry: ReturnType<typeof createCommandRegistry<S, C>>, allowedCommands: readonly string[]) {
  const allowed = new Set(allowedCommands);
  return {
    execute(proposal: unknown, request: Omit<CommandRequest<S, C>, 'input'>): S {
      const parsed: unknown = typeof proposal === 'string' ? JSON.parse(proposal) : proposal;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !jsonValue(parsed)) throw new Error('AI proposal must be JSON data.');
      const record = parsed as Record<string, unknown>;
      if (Object.keys(record).some(key => !['command', 'input'].includes(key)) || typeof record.command !== 'string' || !allowed.has(record.command) || !Object.prototype.hasOwnProperty.call(record, 'input'))
        throw new Error('AI command is not allowlisted or has an invalid envelope.');
      return registry.execute(record.command, { ...request, input: record.input });
    },
  };
}
