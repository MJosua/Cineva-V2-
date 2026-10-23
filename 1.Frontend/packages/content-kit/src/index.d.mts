export type Scope={tenant_key:string;kind:'company';company_id:number}|{tenant_key:string;kind:'personal';user_id:string};
export interface BrandKit {name:string;handle:string;tagline:string;color:string;logo:string;watermark:boolean;closing:boolean}
export interface Slide {id:string;title:string;body:string;image?:string}
export interface ContentDocument {schema_version:1;id:string;revision:number;title:string;format:'4:5'|'9:16';language:'id'|'ms'|'en';templateId:string;brand:BrandKit;slides:Slide[];caption:string;hashtags:string;status:'draft'|'in_review'|'revision_requested'|'approved';source:{kind:string;text:string;url:string};history:{action:string;at:string;actor?:string;note?:string}[];updatedAt:string;approval?:{revision:number;actor:string;at:string}}
export interface TemplateDefinition {id:string;name:string;category:string;background:string;accent:string;layout:string;version:number}
export interface RenderManifest {schema_version:number;documentId:string;revision:number;templateId:string;templateVersion:number;format:string;width:number;height:number;rendererVersion:string;font:string;slides:string[]}
export class ContentError extends Error {code:string;status:number;constructor(code:string,status?:number)}
export function fail(condition:unknown,code:string,status?:number):asserts condition;
export function clone<T>(value:T):T;
export function identifier(value:unknown):string;
export function scopeKey(scope:Scope):string;
export function text(value:unknown,max:number,name:string,optional?:boolean):string;
export const formats:Record<ContentDocument['format'],{width:number;height:number}>;
export const languages:readonly string[];
export const providers:readonly string[];
export const templates:readonly TemplateDefinition[];
export function findTemplate(id:string):TemplateDefinition;
export function filterTemplates(input?:{query?:string;category?:string},catalog?:readonly TemplateDefinition[]):TemplateDefinition[];
export function defaultBrand():BrandKit;
export function validateBrand(brand:BrandKit):BrandKit;
export function validateDocument(doc:ContentDocument):ContentDocument;
export function createDocument(input:{id:string;title?:string;count?:number;format?:ContentDocument['format'];language?:ContentDocument['language'];templateId?:string;brand?:BrandKit},at?:string):ContentDocument;
export function editDocument(current:ContentDocument,input:Partial<ContentDocument>,expectedRevision:number,at?:string):ContentDocument;
export function reviewDocument(current:ContentDocument,action:string,actor:{id:string;canApprove?:boolean},expectedRevision:number,note?:string,at?:string):ContentDocument;
export function renderSlide(doc:ContentDocument,index:number):string;
export function renderManifest(doc:ContentDocument):RenderManifest;
export type Metrics=Record<'views'|'likes'|'comments'|'shares'|'saves'|'reposts'|'followers',number|null>;
export interface PublishTarget {id:string;documentId:string;revision:number;provider:string;accountId:string;format:string;status:string;scheduledAt:string;templateId:string;title:string;publishedAt?:string;error?:string;postId?:string;url?:string}
export interface MetricSnapshot {id:string;targetId:string;capturedAt:string;metrics:Metrics;source:string}
export interface AnalyticsResult {rows:(PublishTarget&{metrics:Metrics|null;capturedAt:string|null;engagement:number|null})[];metrics:Metrics;engagement:number|null;posts:number;measured:number;templates:{templateId:string;posts:number;measured:number;engagement:number|null}[];definition:string;followersReason:string}
export const metricNames:string[];
export function validateMetrics(metrics:Metrics):Metrics;
export function engagement(metrics:Metrics):number|null;
export function analytics(targets:PublishTarget[],snapshots:MetricSnapshot[],filter?:{from?:string;to?:string;provider?:string;accountId?:string}):AnalyticsResult;
export function insightSummary(result:AnalyticsResult):{kind:string;text:string;sample:number};
