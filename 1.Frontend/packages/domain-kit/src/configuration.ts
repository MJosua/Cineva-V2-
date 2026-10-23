import { cloneRuntimeValue, type RuntimeClone } from './commands.ts';

export interface ModuleManifest { id: string; version: string; dependencies?: Record<string, string>; capabilities?: string[] }
export interface ConfigurationSnapshot<T = unknown> { moduleId: string; moduleVersion: string; capabilities?: string[]; configuration: T; dependencies: ModuleManifest[] }
/** Exact version registry; dependency ranges and migrations belong to host adapters. */
export function createModuleRegistry(clone: RuntimeClone = cloneRuntimeValue) {
  const modules = new Map<string, Map<string, ModuleManifest>>();
  const get = (id: string, version: string) => {
    const manifest = modules.get(id)?.get(version);
    if (!manifest) throw new Error(`Missing module dependency: ${id}@${version}`);
    return clone(manifest);
  };
  return {
    register(manifest: ModuleManifest) {
      if (!manifest.id.trim() || !manifest.version.trim()) throw new Error('Module ID and stable version are required.');
      if (modules.get(manifest.id)?.has(manifest.version)) throw new Error(`Duplicate module version: ${manifest.id}@${manifest.version}`);
      if (manifest.capabilities && (manifest.capabilities.some(value => typeof value !== 'string' || !value.trim()) || new Set(manifest.capabilities).size !== manifest.capabilities.length)) throw new Error('Capabilities must be unique non-empty strings.');
      if (Object.entries(manifest.dependencies ?? {}).some(([id, version]) => !id.trim() || !version.trim())) throw new Error('Dependency ID and exact version are required.');
      const versions = modules.get(manifest.id) ?? new Map<string, ModuleManifest>(); versions.set(manifest.version, clone(manifest)); modules.set(manifest.id, versions);
    },
    get,
    snapshot<T>(id: string, version: string, configuration: T, validate?: (configuration: T) => void): ConfigurationSnapshot<T> {
      const dependencies: ModuleManifest[] = [], visited = new Set<string>(), active = new Set<string>();
      const visit = (moduleId: string, moduleVersion: string) => {
        const key = JSON.stringify([moduleId, moduleVersion]);
        if (active.has(key)) throw new Error(`Circular module dependency: ${moduleId}@${moduleVersion}`);
        if (visited.has(key)) return;
        const module = get(moduleId, moduleVersion); active.add(key);
        for (const [dependencyId, dependencyVersion] of Object.entries(module.dependencies ?? {})) visit(dependencyId, dependencyVersion);
        active.delete(key); visited.add(key); if (moduleId !== id || moduleVersion !== version) dependencies.push(module);
      };
      visit(id, version); validate?.(clone(configuration));
      const manifest = get(id, version);
      return { moduleId: id, moduleVersion: version, ...(manifest.capabilities ? { capabilities: manifest.capabilities } : {}), configuration: clone(configuration), dependencies };
    },
  };
}

/** Plain configuration data only, with arrays replaced rather than concatenated. */
export function mergeConfiguration<T extends Record<string, unknown>>(base: T, override: Partial<T>, clone: RuntimeClone = cloneRuntimeValue): T {
  const plain = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
  const merge = (left: Record<string, unknown>, right: Record<string, unknown>): Record<string, unknown> => {
    const result = clone(left);
    for (const [key, value] of Object.entries(right)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Unsafe configuration key.');
      result[key] = plain(value) && plain(left[key]) ? merge(left[key], value) : clone(value);
    }
    return result;
  };
  return merge(base, override) as T;
}
