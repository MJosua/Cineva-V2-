import type {
  DynamicFormRegistry,
  DynamicFormProps,
  DynamicFormSchema,
  FormOption,
  FormUploadValue,
  FormValues,
} from "@hots/dynamic-form";
import type { ReactNode } from "react";

export type ServiceFormService = {
  service_id: number | string;
  service_name: string;
  nav_link?: string;
  category_id?: number | string;
  category_name?: string;
  active?: number | string;
  form_json?: unknown;
  workflow_json?: unknown;
  config_json?: unknown;
  [key: string]: unknown;
};

export type ServiceFormContext = {
  moduleCode?: string;
  moduleName?: string;
  companyId?: number | string;
  companyCode?: string;
  countryId?: number | string;
  countryCode?: string;
  userId?: number | string;
  uid?: string;
  userData?: Record<string, unknown>;
  roleId?: number | string;
  departmentId?: number | string;
  employeeId?: number | string;
  [key: string]: unknown;
};

export type ServiceFormSubmitPayload = {
  service: ServiceFormService;
  schema: DynamicFormSchema;
  values: FormValues;
  context: ServiceFormContext;
};

export type ServiceFormAdapters = {
  loadService: (servicePath: string, context: ServiceFormContext) => Promise<ServiceFormService>;
  resolveSystemVariable?: (variable: string, context: ServiceFormContext, values: FormValues) => Promise<FormOption[]>;
  resolveFieldOptions?: (field: unknown, context: ServiceFormContext, values: FormValues, query?: string) => Promise<FormOption[]>;
  resolveGlobalValues?: (service: ServiceFormService, context: ServiceFormContext) => Promise<FormValues>;
  uploadFile?: (file: File, args: { service: ServiceFormService; context: ServiceFormContext; field: unknown }) => Promise<FormUploadValue>;
  submit: (payload: ServiceFormSubmitPayload) => Promise<unknown>;
  onWorkflowResolved?: (service: ServiceFormService, context: ServiceFormContext) => void;
};

export type ServiceFormRuntimeProps = {
  servicePath: string;
  context?: ServiceFormContext;
  adapters: ServiceFormAdapters;
  registry?: DynamicFormRegistry;
  submitLabel?: string;
  formKey?: string | number;
  initialValuesOverride?: FormValues;
  secondaryAction?: DynamicFormProps["secondaryAction"];
  sectionHeaderAction?: DynamicFormProps["sectionHeaderAction"];
  extraSubmitValues?: FormValues | (() => FormValues);
  beforeForm?: ReactNode;
  toolbarAction?: ReactNode;
  footer?: ReactNode;
  onValuesChange?: (values: FormValues) => void;
  onSubmitted?: (result: unknown, payload: ServiceFormSubmitPayload) => void;
  onBack?: () => void;
};
