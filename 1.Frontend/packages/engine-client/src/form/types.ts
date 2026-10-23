/**
 * @hots/engine-client — Form Engine types
 * Head: src/form/index.ts
 * Source: form/src/formApi.ts lines 50–134 (2026-10-06), verbatim interfaces.
 */
import type { DynamicFormSchema, FormValues } from '@hots/dynamic-form';

export interface ManagedForm {
  form_id: number;
  service_id: number;
  slug: string;
  status: 'draft' | 'published' | 'closed';
  access_mode: 'public' | 'authenticated';
  schema_version: number;
  service_name: string;
  service_description?: string;
  form_json?: DynamicFormSchema;
  settings_json?: Record<string, unknown>;
  user_role: 'owner' | 'editor' | 'viewer';
  response_count?: number;
  updated_at?: string;
}

export interface FormAccess {
  access_id: number;
  user_id: number;
  role: 'owner' | 'editor' | 'viewer';
  firstname?: string;
  lastname?: string;
  uid?: string;
  email?: string;
}

export interface FormResponse {
  response_id: number;
  response_uuid: string;
  schema_version: number;
  response_snapshot: FormValues;
  respondent_user_id?: number | null;
  respondent_name?: string | null;
  submitted_at: string;
}

export interface PaginatedFormResponses {
  items: FormResponse[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface FormResponseSummary {
  total: number;
  authenticated_respondents: number;
  first_submitted_at?: string | null;
  latest_submitted_at?: string | null;
  daily: { date: string; count: number }[];
  groups?: { key: string; label: string; type?: string; field_keys: string[] }[];
  fields: {
    key: string;
    label: string;
    field_type?: string | null;
    group_key?: string;
    answer_count: number;
    values: { value: string; display_value?: string; count: number }[];
  }[];
}

export interface UserSearchResult {
  user_id: number;
  firstname?: string;
  lastname?: string;
  uid?: string;
  email?: string;
}

export interface CmsMediaItem {
  media_id: number;
  file_name: string;
  file_url: string;
  mime_type?: string;
}

export interface CmsTempUpload {
  upload_id: number;
  original_name?: string;
  name?: string;
  mimetype?: string;
}
