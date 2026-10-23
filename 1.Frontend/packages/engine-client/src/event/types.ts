/**
 * @hots/engine-client — Event Engine types
 * Head: src/event/index.ts
 * Shapes follow EVENT_t_* / EVENT_m_* columns as returned by /api/event-engine (kept loose on purpose).
 */

export interface Campaign {
  campaign_id?: number;
  slug: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | string;
  settings_config?: Record<string, unknown>;
  theme_config?: Record<string, unknown>;
  blocks?: unknown[];
  pages?: Record<string, unknown>;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ListOptions {
  search?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
