import type { WorkflowClient } from '@hots/engine-client';

/** Compatibility for legacy pages that read result.data rather than the raw engine body. */
export function createLegacyWorkflowApi(workflow: WorkflowClient) {
  const response = async (operation: () => Promise<unknown>) => {
    try { return { data: await operation() }; }
    catch (error) { (error as { ok?: boolean }).ok = false; throw error; }
  };
  return {
    getWorkflow: (serviceId: number) => response(() => workflow.getWorkflow(serviceId)),
    addWorkflow: (payload: unknown) => response(() => workflow.addWorkflow(payload)),
    updateWorkflow: (workflowId: number, payload: unknown) => response(() => workflow.updateWorkflow(workflowId, payload)),
    deleteWorkflow: (workflowId: number, serviceId?: number) => response(() => workflow.deleteWorkflow(workflowId, serviceId!)),
    getParams: (workflowId: number, serviceId?: number) => response(() => workflow.getParams(workflowId, serviceId!)),
    saveParam: (workflowId: number, payload: unknown) => response(() => workflow.saveParam(workflowId, payload)),
  };
}
