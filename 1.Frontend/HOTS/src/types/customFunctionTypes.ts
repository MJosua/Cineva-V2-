
export interface CustomFunction {
  id: number;
  name: string;
  type: 'document_generation' | 'excel_processing' | 'email_notification' | 'api_integration' | 'custom';
  handler: string;
  config: any;
  is_active: boolean;
  created_date: string;
}

export interface ServiceCustomFunction {
  id: number;
  service_id: number;
  function_id: number;
  trigger_event: 'on_created' | 'on_approved' | 'on_step_approved' | 'on_rejected' | 'on_final_approved' | 'on_trigger';
  execution_order: number;
  is_active: boolean;
  config: any;
}

export interface CustomFunctionLog {
  id: number;
  ticket_id: number;
  service_id: number;
  function_name: string;
  trigger_event: string;
  status: 'success' | 'failed' | 'pending';
  result_data: any;
  error_message?: string;
  execution_time: string;
  created_by: number;
}

export interface GeneratedDocument {
  id: number;
  ticket_id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  generated_date: string;
  template_used: string;
}

export interface FunctionTemplate {
  id: number;
  template_name: string;
  template_type: 'email' | 'document' | 'excel';
  template_content: string;
  variables: string[];
  is_active: boolean;
  created_date: string;
}

export interface CustomFunctionState {
  functions: CustomFunction[];
  serviceFunctions: ServiceCustomFunction[];
  functionLogs: CustomFunctionLog[];
  generatedDocuments: GeneratedDocument[];
  templates: FunctionTemplate[];
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
}
