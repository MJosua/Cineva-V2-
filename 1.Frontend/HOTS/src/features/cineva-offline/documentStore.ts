import { createAppStorage } from '@hots/app-core';
import type { DemoData } from './model';
import { validateData } from './validation';
export function documentStore(id: string) {
  const port = createAppStorage(`cineva_client_demo_${id}`);
  return {
    load(seed: DemoData) { const saved = port.get<DemoData>('document'); if (saved) validateData(saved); return structuredClone(saved ?? seed); },
    save(data: DemoData) {
      validateData(data); const before = port.get<DemoData>('document'); port.set('document', data);
      if (JSON.stringify(port.get('document')) !== JSON.stringify(data)) {
        if (before) port.set('document', before); else port.remove('document');
        return false;
      }
      return true;
    },
  };
}
