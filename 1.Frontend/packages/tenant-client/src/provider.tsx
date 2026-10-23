import {createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode} from 'react';
import {validateBrand, assertOwner, type BrandConfig} from '@hots/tenant-contracts';
import type {TenantClient} from './client.mjs';
const Context = createContext<TenantClient | null>(null);
export function TenantProvider({client, children}: {client: TenantClient; children: ReactNode}) { return <Context.Provider value={client}>{children}</Context.Provider>; }
export function useTenantClient() { const value = useContext(Context); if (!value) throw new Error('TenantProvider required'); return value; }
export function useActiveWorkspace() { const client = useTenantClient(); return useSyncExternalStore(client.subscribe, client.snapshot, () => null); }
export function TenantBrand({config, children}: {config: BrandConfig; children: ReactNode}) {
 const workspace = useActiveWorkspace();
 useLayoutEffect(() => {
  if (!workspace) return;
  const brand = validateBrand(config); assertOwner(workspace.context, brand);
  const root = document.documentElement;
  const previous = Object.fromEntries(Object.keys(brand.tokens).map(key => [key, root.style.getPropertyValue(`--${key}`)]));
  for (const [key, value] of Object.entries(brand.tokens)) root.style.setProperty(`--${key}`, value);
  return () => { for (const [key, value] of Object.entries(previous)) { if (value) root.style.setProperty(`--${key}`, value); else root.style.removeProperty(`--${key}`); } };
 }, [config, workspace]);
 return <>{children}</>;
}
