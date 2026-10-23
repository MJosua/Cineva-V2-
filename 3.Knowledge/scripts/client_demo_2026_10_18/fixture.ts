import type { DemoData } from '../../../1.Frontend/HOTS/src/features/cineva-offline/model';

/** Completely synthetic portable fixture. Never contains workbook rows or accounts. */
export function syntheticData(): DemoData {
  return {
    version: 1, datasetId: 'synthetic-cineva-demo', editedAt: null,
    user: { id: 'creator-demo', name: 'Kreator Simulasi', instagram: '@creator_simulasi', followers: 1500, niches: ['Lifestyle'], phone: 'DUMMY', address: 'Studio dummy' },
    campaign: { id: 'campaign-demo', title: 'Campaign Simulasi', brand: 'Brand Dummy', brief: 'Brief sintetis', objective: 'Pengenalan produk', audience: 'Audiens simulasi', messaging: 'Cerita produk dummy', sow: 'Satu video simulasi', overviewPeriod: 'Oktober 2026', feeAmount: 300000, barterValue: 150000, productRetailValue: 125000, paymentStatus: 'Belum diverifikasi', paidAmount: null, selectedProduct: 'Produk dummy A' },
    insights: { likes: 20, comments: 5, shares: 3, saves: 2, reposts: 0, views: 500, sourceCategory: 'Kategori sumber dummy' },
    deliverables: [{ id: 'deliverable-demo', title: 'Video dummy', platform: 'Instagram', sourceUrl: 'https://example.invalid/draft-demo', status: 'Draft' }],
    events: [
      { id: 'milestone-demo', title: 'Draft konten', kind: 'milestone', startDate: '2026-10-24', endDate: '2026-10-24', allDay: true, rawDate: '24 Oktober 2026', sourceCell: 'S24', requiresReview: false, note: 'Tanggal fixture' },
      { id: 'visit-demo', title: 'Visit studio', kind: 'visit', startDate: '2026-10-25', endDate: '2026-10-26', allDay: true, rawDate: '25–26 Oktober 2026', sourceCell: 'T24', requiresReview: false, note: '' },
      { id: 'ambiguous-demo', title: 'Deadline perlu review', kind: 'milestone', startDate: null, endDate: null, allDay: true, rawDate: 'minggu depan / tahun belum jelas', sourceCell: 'T25', requiresReview: true, note: 'Jangan menebak tanggal sumber.' },
    ],
    payments: [],
    source: { file: 'synthetic.xlsx', sheet: 'Fixture', rosterRow: 1, insightRow: 2, sha256: 'a'.repeat(64) },
    notes: ['Fixture khusus tes; bukan data client.'], rawSource: [{ label: 'Catatan dummy', value: 'Sumber sintetis' }],
    collections: {
      workspaces: [{ id: 'hq-demo', name: 'HQ Dummy', product: 'hq' }, { id: 'creator-demo', name: 'Creator Dummy', product: 'creator' }],
      brands: [{ id: 'brand-demo', name: 'Brand Dummy', contact: 'PIC dummy' }],
      batches: [{ id: 'batch-demo', campaignId: 'campaign-demo', name: 'Batch dummy' }],
      tickets: [{ id: 'ticket-demo', module: 'hots:cineva', status: 'running', fields: [{ cstm_col: 'title', lbl_col: 'Judul', value: 'Assignment dummy' }, { cstm_col: 'fee_amount', lbl_col: 'Fee', value: 300000 }] }],
      assignments: [{ id: 'assignment-demo', ticketId: 'ticket-demo', campaignId: 'campaign-demo', batchId: 'batch-demo', userId: 'creator-demo' }],
    },
  };
}
