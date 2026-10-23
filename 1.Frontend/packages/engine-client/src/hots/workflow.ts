/**
 * @hots/engine-client — Workflow Engine admin client
 * Head: src/index.ts
 * Source: HOTS/src/api/workflowAdmin.js (2026-10-06). Same endpoints/payloads.
 * Changes: shared cookie http instead of its own axios; DEBUG console logging removed;
 * errors are EngineApiError (status/code/message) instead of `{ ok:false, status, message }`.
 * Note: like the original, functions resolve to the response body (not unwrapped) — use `raw`.
 */
import type { AxiosInstance } from 'axios';
import { createEngineCall } from '../core/request';

export function createWorkflowClient(http: AxiosInstance, basePath = '/workflow-engine') {
  const call = createEngineCall(http, basePath, 'WORKFLOW_API_ERROR');
  const raw = { raw: true };
  return {
    getWorkflow: (serviceId: number) => call<any>('get', `/${serviceId}`, raw),
    addWorkflow: (payload: unknown) => call<any>('post', '/add', { ...raw, data: payload }),
    updateWorkflow: (workflowId: number, payload: unknown) => call<any>('put', `/${workflowId}`, { ...raw, data: payload }),
    deleteWorkflow: (workflowId: number, serviceId: number) => call<any>('delete', `/${workflowId}`, { ...raw, params: { service_id: serviceId } }),
    getParams: (workflowId: number, serviceId: number) => call<any>('get', `/params/${workflowId}`, { ...raw, params: { service_id: serviceId } }),
    saveParam: (workflowId: number, payload: unknown) => call<any>('post', `/params/${workflowId}`, { ...raw, data: payload }),
  };
}

export type WorkflowClient = ReturnType<typeof createWorkflowClient>;
