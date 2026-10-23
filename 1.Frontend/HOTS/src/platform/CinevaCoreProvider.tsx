import { HotsCoreProvider } from '@hots/app-core';
import type { ReactNode } from 'react';
import { API_URL } from '@/config/sourceConfig';
import { cinevaHttp } from './clients';

export function CinevaCoreProvider({ children }: { children: ReactNode }) {
  return <HotsCoreProvider appKey="cineva" config={{ baseUrl: String(API_URL) }} http={cinevaHttp}>{children}</HotsCoreProvider>;
}
