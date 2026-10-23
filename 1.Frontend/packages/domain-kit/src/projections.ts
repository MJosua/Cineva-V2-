import { cloneRuntimeValue, type RuntimeClone } from './commands.ts';

export interface ProjectionDefinition<S, C, R> {
  authorize(context: C, source: S): boolean;
  select(source: S, context: C): R;
}
/** Host supplies ownership and field-redaction policy; neither input nor output aliases source. */
export function createProjectionRegistry<S, C>(clone: RuntimeClone = cloneRuntimeValue) {
  const definitions = new Map<string, ProjectionDefinition<S, C, unknown>>();
  return {
    register<R>(name: string, definition: ProjectionDefinition<S, C, R>) {
      if (!name.trim() || definitions.has(name)) throw new Error('Empty or duplicate projection.');
      if (typeof definition.authorize !== 'function' || typeof definition.select !== 'function') throw new Error('Projection requires authorization and selector.');
      definitions.set(name, { ...definition } as ProjectionDefinition<S, C, unknown>);
    },
    read<R = unknown>(name: string, source: S, context: C): R {
      const definition = definitions.get(name);
      if (!definition) throw new Error(`Unknown projection: ${name}`);
      if (definition.authorize(clone(context), clone(source)) !== true) throw new Error(`Projection denied: ${name}`);
      return clone(definition.select(clone(source), clone(context))) as R;
    },
  };
}
export function projectReadModel<S, C, R>(source: S, context: C, definition: ProjectionDefinition<S, C, R>, clone: RuntimeClone = cloneRuntimeValue): R {
  if (definition.authorize(clone(context), clone(source)) !== true) throw new Error('Projection denied.');
  return clone(definition.select(clone(source), clone(context)));
}
