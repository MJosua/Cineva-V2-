import React, { createContext, useContext, useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import type { HotsCoreConfig } from './config';
import { createHttpClient } from './http';
import { createAppStorage } from './storage';

export interface HotsCoreValue {
  config: HotsCoreConfig;
  http: AxiosInstance;
  storage: ReturnType<typeof createAppStorage>;
  appKey: string;
}

const HotsCoreContext = createContext<HotsCoreValue | null>(null);

export interface HotsCoreProviderProps {
  /** Short app id used for storage prefixes, e.g. 'hots', 'mapit', 'event'. */
  appKey: string;
  config: HotsCoreConfig;
  /** Optional pre-built client (e.g. an app's existing axios instance during migration). */
  http?: AxiosInstance;
  children: React.ReactNode;
}

export function HotsCoreProvider({ appKey, config, http, children }: HotsCoreProviderProps) {
  const value = useMemo<HotsCoreValue>(
    () => ({ config, appKey, http: http ?? createHttpClient(config), storage: createAppStorage(appKey) }),
    [config, appKey, http],
  );
  return <HotsCoreContext.Provider value={value}>{children}</HotsCoreContext.Provider>;
}

/** Throws when used outside the provider. */
export function useHotsCore(): HotsCoreValue {
  const ctx = useContext(HotsCoreContext);
  if (!ctx) throw new Error('useHotsCore must be used inside <HotsCoreProvider>');
  return ctx;
}

/** Returns null outside the provider — for packages that work with or without it. */
export function useOptionalHotsCore(): HotsCoreValue | null {
  return useContext(HotsCoreContext);
}
