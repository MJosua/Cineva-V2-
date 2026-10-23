/** Portable document fixture, not physical DB DDL. HOTS ticket EAV stays intact. */
export interface DemoEvent {
  id: string; title: string; kind: 'milestone' | 'visit'; startDate: string | null; endDate: string | null;
  allDay: true; rawDate: string; sourceCell: string; requiresReview: boolean; note: string;
}
export interface DemoData {
  version: 1; datasetId: string; editedAt: string | null;
  user: { id: string; name: string; instagram: string; followers: number | null; niches: string[]; phone: string; address: string };
  campaign: { id: string; title: string; brand: string; brief: string; objective: string; audience: string; messaging: string; sow: string; overviewPeriod: string; feeAmount: number; barterValue: number; productRetailValue: number; paymentStatus: string; paidAmount: number | null; selectedProduct: string };
  insights: { likes: number | null; comments: number | null; shares: number | null; saves: number | null; reposts: number | null; views: number | null; sourceCategory: string };
  deliverables: { id: string; title: string; platform: string; sourceUrl: string; status: string }[];
  events: DemoEvent[];
  payments: { id: string; amount: number; paidAt: string; evidence: string }[];
  source: { file: string; sheet: string; rosterRow: number; insightRow: number; sha256: string };
  notes: string[]; rawSource: unknown[];
  collections: {
    workspaces: { id: string; name: string; product: 'hq' | 'creator' }[];
    brands: { id: string; name: string; contact: string }[];
    batches: { id: string; campaignId: string; name: string }[];
    tickets: { id: string; module: 'hots:cineva'; status: string; fields: { cstm_col: string; lbl_col: string; value: string | number | null }[] }[];
    assignments: { id: string; ticketId: string; campaignId: string; batchId: string; userId: string }[];
  };
}
