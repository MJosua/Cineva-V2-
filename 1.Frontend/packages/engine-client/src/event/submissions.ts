/**
 * @hots/engine-client — Event Engine: submissions, stats, approval, exports
 * Head: src/event/index.ts
 * Source: Event/src/services/eventEngineApi.js lines 426–577 and 817–835 (2026-10-06).
 * Exports now use @hots/app-core `downloadFile` (cookie auth) instead of a localStorage token.
 */
import type { AxiosInstance } from 'axios';
import { downloadFile } from '@hots/app-core';
import type { EngineCall } from '../core/request';
import type { ListOptions } from './types';

export function createSubmissionApi(call: EngineCall, http: AxiosInstance, basePath: string) {
  const getSubmissionsByEvent = (slug: string, options: ListOptions & { status?: string; includeMeta?: boolean } = {}) =>
    call<any>('get', `/admin/campaigns/${slug}/submissions`, {
      params: {
        status: options.status && options.status !== 'all' ? options.status : undefined,
        search: options.search,
        start_date: options.startDate ?? options.start_date,
        end_date: options.endDate ?? options.end_date,
        limit: options.limit,
        offset: options.offset,
      },
    }).then((d) => (options.includeMeta ? d : d && d.submissions !== undefined ? d.submissions : d));

  const getSubmissionStats = (slug: string) => call<any>('get', `/admin/campaigns/${slug}/submissions/stats`);
  const getDailySubmissionStats = (slug: string, days = 30) => call<any[]>('get', `/admin/campaigns/${slug}/submissions/daily`, { params: { days } });

  const updateSubmissionStatus = (submissionId: number, status: string, rejectionReason: string | null = null) =>
    call<any>('patch', `/admin/submissions/${submissionId}`, { data: { status, rejection_reason: rejectionReason } });

  const exportSubmissions = (slug: string) =>
    downloadFile(http, `${basePath}/admin/campaigns/${slug}/submissions/export`, { fallbackName: `submissions_${slug}_${Date.now()}.xlsx` });

  return { getSubmissionsByEvent, getSubmissionStats, getDailySubmissionStats, updateSubmissionStatus, exportSubmissions };
}
