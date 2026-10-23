export interface TenantContext { readonly schema_version: 1; readonly tenant_key: string; readonly company_id: number; readonly user_id: string; readonly membership_version: string; }
export interface BrandConfig { readonly schema_version: 1; readonly revision: number; readonly tenant_key: string; readonly company_id: number; readonly brand: { readonly display_name: string; readonly logo_asset_id: string | null }; readonly tokens: Readonly<Record<string, string>>; readonly asset?: {readonly asset_id: string; readonly tenant_key: string; readonly company_id: number; readonly url: string; readonly mime_type: string}; }
export const CONTRACT_VERSION: 1;
export class TenantError extends Error { code: string; status: number; constructor(code: string, status?: number); }
export function requiredString(value: unknown, name: string, max?: number): string;
export function tenantKey(value: unknown): string;
export function companyId(value: unknown): number;
export function normalizeContext(value: unknown): TenantContext;
export function contextKey(context: TenantContext, ...parts: string[]): string;
export function validateBrand(value: unknown): BrandConfig;
export function assertOwner<T>(context: TenantContext, resource: T): T;
