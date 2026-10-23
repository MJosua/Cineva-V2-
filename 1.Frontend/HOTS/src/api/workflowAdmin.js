import { cinevaEngines } from '@/platform/clients';
import { createLegacyWorkflowApi } from '@/platform/workflowAdapter';
export const { getWorkflow, addWorkflow, updateWorkflow, deleteWorkflow, getParams, saveParam } = createLegacyWorkflowApi(cinevaEngines.workflow);
