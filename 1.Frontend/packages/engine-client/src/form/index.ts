/**
 * @hots/engine-client — Form Engine client (public + admin + CMS media)
 * Head: src/index.ts
 * Source: form/src/formApi.ts lines 34–48 and 251–324 (2026-10-06). Same endpoints and return shapes.
 * Changes: cookie auth via shared http (login/keeplogin/localStorage removed), base URLs injected.
 */
import type { AxiosInstance } from 'axios';
import type { DynamicFormSchema, FormMediaItem, FormOption, FormUploadValue, FormValues } from '@hots/dynamic-form';
import { createEngineCall, EngineApiError, fileForm } from '../core/request';
import type { CmsMediaItem, CmsTempUpload, FormAccess, FormResponseSummary, ManagedForm, PaginatedFormResponses, UserSearchResult } from './types';

export type * from './types';

export interface FormClientOptions {
  /** Absolute API origin used to resolve relative asset paths ('' = same origin). */
  assetOrigin?: string;
  basePath?: string; // default '/api/form-engine'
  cmsPath?: string; // default '/cms'
}

const ASSET_PATH = /^\/(?:api|cms|public|files|image|aset)(?:\/|$)/;

export function createFormClient(http: AxiosInstance, options: FormClientOptions = {}) {
  const { assetOrigin = '', basePath = '/api/form-engine', cmsPath = '/cms' } = options;
  const call = createEngineCall(http, basePath, 'FORM_API_ERROR');
  const cms = createEngineCall(http, cmsPath, 'FORM_API_ERROR');
  const enc = encodeURIComponent;

  const resolveAssetUrl = (value: string): string =>
    assetOrigin && ASSET_PATH.test(value) ? `${assetOrigin.replace(/\/+$/, '')}${value}` : value;

  const resolveAssetUrls = <T>(value: T): T => {
    if (typeof value === 'string') return resolveAssetUrl(value) as T;
    if (Array.isArray(value)) return value.map((v) => resolveAssetUrls(v)) as T;
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolveAssetUrls(v)])) as T;
    }
    return value;
  };

  const expectArray = <T>(value: unknown, resource: string): T[] => {
    if (Array.isArray(value)) return value as T[];
    throw new EngineApiError(502, 'FORM_API_RESPONSE_INVALID', `${resource} returned an invalid response.`);
  };

  const publicApi = {
    getForm: (slug: string) =>
      call<{ schema: DynamicFormSchema; access_mode: 'public' | 'authenticated'; schema_version: number }>('get', `/public/forms/${enc(slug)}`)
        .then((form) => ({ ...form, schema: resolveAssetUrls(form.schema) })),
    getSystemVariable: (variable: string) => {
      const key = variable.match(/^\$\{([^}]+)\}$/)?.[1] ?? variable;
      return call<{ key: string; options: FormOption[] }>('get', `/public/variables/${enc(key)}`).then((r) => r.options);
    },
    submit: (slug: string, values: FormValues) =>
      call<{ response_uuid: string; submitted_at: string }>('post', `/public/forms/${enc(slug)}/responses`, { data: { values } }),
    upload: (slug: string, file: File) => call<FormUploadValue>('post', `/public/forms/${enc(slug)}/uploads`, { data: fileForm(file) }),
  };

  const adminApi = {
    list: () => call<unknown>('get', '/admin/forms').then((v) => expectArray<ManagedForm>(v, 'Form list')),
    get: (formId: number) => call<ManagedForm>('get', `/admin/forms/${formId}`),
    create: (payload: { title: string; description?: string; slug: string; access_mode: string; schema: DynamicFormSchema; settings?: Record<string, unknown> }) =>
      call<ManagedForm>('post', '/admin/forms', { data: payload }),
    update: (formId: number, payload: { slug: string; status: string; access_mode: string; schema: DynamicFormSchema; settings?: Record<string, unknown> }) =>
      call<ManagedForm>('put', `/admin/forms/${formId}`, { data: payload }),
    listAccess: (formId: number) => call<FormAccess[]>('get', `/admin/forms/${formId}/access`),
    addAccess: (formId: number, userId: number, role: 'editor' | 'viewer') =>
      call<FormAccess[]>('post', `/admin/forms/${formId}/access`, { data: { user_id: userId, role } }),
    removeAccess: (formId: number, userId: number) => call<FormAccess[]>('delete', `/admin/forms/${formId}/access/${userId}`),
    searchUsers: (query: string) => call<UserSearchResult[]>('get', '/admin/users/search', { params: { q: query } }),
    uploadFormAsset: async (formId: number, file: File): Promise<FormMediaItem> => {
      const asset = await call<FormUploadValue>('post', `/admin/forms/${formId}/assets`, { data: fileForm(file) });
      return { id: asset.upload_token, name: asset.name, url: asset.url || '', mimeType: asset.mime_type || file.type };
    },
    responses: (formId: number, opts: { page?: number; pageSize?: number; search?: string } = {}) =>
      call<PaginatedFormResponses>('get', `/admin/forms/${formId}/responses`, {
        params: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 25, search: opts.search?.trim() },
      }),
    responseSummary: (formId: number) => call<FormResponseSummary>('get', `/admin/forms/${formId}/summary`),
    fileBlob: (formId: number, uploadToken: string) =>
      http.get<Blob>(`${basePath}/admin/forms/${formId}/files/${enc(uploadToken)}`, { responseType: 'blob' }).then((r) => r.data),
  };

  /** CMS media library — implements the dynamic-form media adapter (listImages / uploadImage / resolveUrl). */
  const mediaApi = {
    listImages: (search = '') =>
      cms<CmsMediaItem[]>('get', '/admin/media/list', { params: { limit: 100, mime_type: 'image', search: search.trim() } }).then((items) =>
        items.map((i): FormMediaItem => ({ id: i.media_id, name: i.file_name, url: i.file_url, mimeType: i.mime_type })),
      ),
    uploadImage: async (file: File): Promise<FormMediaItem> => {
      const uploads = await cms<CmsTempUpload[]>('post', '/admin/media/upload-temp', {
        params: { type: 'media', context: 'formengine-banner' },
        data: fileForm(file, 'file', { type: 'media' }),
      });
      const uploaded = uploads[0];
      if (!uploaded?.upload_id) throw new EngineApiError(500, 'FORM_MEDIA_UPLOAD_INVALID', 'The media upload did not return a temporary file ID.');
      const finalized = await cms<CmsMediaItem>('post', '/admin/media/finalize', {
        data: { upload_id: uploaded.upload_id, folder: 'formengine/banners', tags: ['formengine', 'banner'], file_name: file.name },
      });
      return { id: finalized.media_id, name: finalized.file_name, url: finalized.file_url, mimeType: finalized.mime_type || file.type };
    },
    resolveUrl: resolveAssetUrl,
  };

  return { public: publicApi, admin: adminApi, media: mediaApi, resolveAssetUrl, resolveAssetUrls };
}

export type FormClient = ReturnType<typeof createFormClient>;
