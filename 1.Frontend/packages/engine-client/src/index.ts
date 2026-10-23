/**
 * @hots/engine-client — HEAD: one typed client per Integrated-API engine, all on the shared
 * injected Axios client (standard app-core cookie factory or an app-owned compatible transport).
 *
 *   core/request.ts   createEngineCall + EngineApiError (envelope unwrap, error normalisation)
 *   form/             Form Engine (public, admin, CMS media)          ← form/src/formApi.ts
 *   event/            Event Engine (campaigns, submissions, pools…)  ← Event/src/services/eventEngineApi.js
 *   hots/workflow.ts  Workflow Engine admin                          ← HOTS/src/api/workflowAdmin.js
 *   hots/trigger.ts   Trigger functions                              ← HOTS/src/hooks/useTriggerFunction.ts
 *   hots/prefs.ts     User preferences                               ← HOTS/src/hooks/usePreferences.ts
 *
 * Usage:
 *   const { http } = useHotsCore();
 *   const engines = createEngineClient(http, { form: { assetOrigin: config.baseUrl } });
 *   await engines.event.getCampaigns();
 */
import type { AxiosInstance } from 'axios';
import { createFormClient, type FormClientOptions } from './form';
import { createEventClient } from './event';
import { createWorkflowClient } from './hots/workflow';
import { createTriggerClient } from './hots/trigger';
import { createPrefsClient } from './hots/prefs';

export * from './core/request';
export * from './form';
export * from './event';
export * from './hots/workflow';
export * from './hots/trigger';
export * from './hots/prefs';
export * from './content';

export interface EngineClientOptions {
  form?: FormClientOptions;
  eventPath?: string;
  workflowPath?: string;
  triggerPath?: string;
  prefsPath?: string;
}

export function createEngineClient(http: AxiosInstance, options: EngineClientOptions = {}) {
  return {
    form: createFormClient(http, options.form),
    event: createEventClient(http, options.eventPath),
    workflow: createWorkflowClient(http, options.workflowPath),
    trigger: createTriggerClient(http, options.triggerPath),
    prefs: createPrefsClient(http, options.prefsPath),
  };
}

export type EngineClient = ReturnType<typeof createEngineClient>;
