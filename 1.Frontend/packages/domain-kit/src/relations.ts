import { safePath, safeRead, type Issue } from './validation.ts';
export interface RelationConfig {
  collections: Record<string, { idField?: string }>;
  references: readonly { from: string; field: string; to: string; targetField?: string; optional?: boolean; scope?: { sourceField: string; targetField: string } }[];
}
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const scalar = (value: unknown): value is string | number => typeof value === 'string' ? value.trim().length > 0 : typeof value === 'number' && Number.isSafeInteger(value);
const own = (value: unknown, key: string) => safeRead(value, key).value;
export function validateRelations(collections: Record<string, readonly object[]>, config: RelationConfig): Issue[] {
  const issues: Issue[] = [], add = (code: string, path: string, message: string) => { issues.push({ code, path, message }); };
  if (!record(collections) || !record(config) || !record(config.collections) || !Array.isArray(config.references))
    return [{ code: 'invalid_relation_config', path: '', message: 'Collections and relation configuration must be objects with a references array.' }];
  const names = Object.keys(config.collections), rows = new Map<string, readonly Record<string, unknown>[]>();
  for (const name of Object.keys(collections)) if (!names.includes(name)) add('unknown_collection', name, 'Collection is not declared in configuration.');
  for (const name of names) {
    const spec = own(config.collections, name), idField = record(spec) ? own(spec, 'idField') ?? 'id' : undefined;
    if (!safePath(name) || name.includes('.') || !record(spec) || !safePath(idField)) { add('invalid_collection_config', name, 'Collection name and ID field must be safe paths.'); continue; }
    const values = own(collections, name);
    if (!Array.isArray(values)) { add('invalid_collection', name, 'Expected a collection array.'); continue; }
    const accepted: Record<string, unknown>[] = [], ids = new Set<string | number>();
    values.forEach((value, index) => {
      const path = `${name}.${index}`;
      if (!record(value)) { add('invalid_row', path, 'Expected an object row.'); return; }
      accepted.push(value);
      const id = safeRead(value, idField).value;
      if (!scalar(id)) add('invalid_id', `${path}.${idField}`, 'ID must be a non-empty string or safe integer.');
      else if (ids.has(id)) add('duplicate_id', `${path}.${idField}`, 'ID must be unique within its collection.');
      else ids.add(id);
    });
    rows.set(name, accepted);
  }
  config.references.forEach((reference, refIndex) => {
    const path = `references.${refIndex}`;
    if (!record(reference) || !safePath(reference.from) || !safePath(reference.to) || !safePath(reference.field) ||
        !rows.has(reference.from) || !rows.has(reference.to) ||
        (reference.targetField !== undefined && !safePath(reference.targetField)) ||
        (reference.optional !== undefined && typeof reference.optional !== 'boolean') ||
        (reference.scope !== undefined && (!record(reference.scope) || !safePath(reference.scope.sourceField) || !safePath(reference.scope.targetField)))) {
      add('invalid_reference_config', path, 'Reference must use declared collections and safe field paths.'); return;
    }
    const from = reference.from, to = reference.to, field = reference.field;
    const targetField = reference.targetField ?? own(own(config.collections, to), 'idField') ?? 'id';
    const scopeConfig = reference.scope;
    const sourceScopeField = scopeConfig && record(scopeConfig) ? scopeConfig.sourceField : undefined;
    const targetScopeField = scopeConfig && record(scopeConfig) ? scopeConfig.targetField : undefined;
    if (!safePath(targetField) || (scopeConfig !== undefined && (!safePath(sourceScopeField) || !safePath(targetScopeField)))) {
      add('invalid_reference_config', path, 'Reference target and scope fields must be safe paths.'); return;
    }
    for (const [index, source] of rows.get(from)!.entries()) {
      const sourcePath = `${from}.${index}.${field}`, value = safeRead(source, field).value;
      if (reference.optional && (value === undefined || value === null || value === '')) continue;
      if (!scalar(value)) { add('invalid_reference', sourcePath, 'Reference must contain a scalar ID.'); continue; }
      const scope = typeof sourceScopeField === 'string' ? safeRead(source, sourceScopeField).value : undefined;
      if (scopeConfig && !scalar(scope)) { add('invalid_scope', `${from}.${index}.${sourceScopeField}`, 'Reference scope must contain a scalar ID.'); continue; }
      const matches = rows.get(to)!.filter(target => safeRead(target, targetField).value === value &&
        (typeof targetScopeField !== 'string' || safeRead(target, targetScopeField).value === scope));
      if (!matches.length) add('foreign_reference', sourcePath, 'Referenced row does not exist within the configured scope.');
      else if (matches.length > 1) add('ambiguous_reference', sourcePath, 'Reference matches multiple target rows.');
    }
  });
  return issues;
}
