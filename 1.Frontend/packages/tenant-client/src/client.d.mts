import type {TenantContext, BrandConfig} from '@hots/tenant-contracts';
export interface ActiveWorkspace { context: TenantContext; context_id: string; }
export interface TenantTransportOptions { method: string; body?: unknown; signal?: AbortSignal; context_id?: string; }
export interface TenantBootstrap { user_id: string; tenant_key: string; companies: {company_id: number; company_name: string}[]; }
export interface TenantClient {
 snapshot(): ActiveWorkspace | null;
 subscribe(listener: () => void): () => void;
 bootstrap(): Promise<TenantBootstrap>;
 selectCompany(company_id: number): Promise<ActiveWorkspace>;
 acceptInvitation(token: string): Promise<{tenant_key: string; company_id: number}>;
 request(path: string, options?: {cache?: boolean}): Promise<any>;
 brand(): Promise<BrandConfig>;
 addSubscription(close: () => void): () => void;
 clear(): void;
 dispose(): void;
}
export function createTenantClient(options: {transport: (path: string, options: TenantTransportOptions) => Promise<any>; onDisposeError?: (error: unknown) => void}): TenantClient;
