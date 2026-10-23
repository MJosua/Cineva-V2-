import type { Campaign } from './model';
export function campaignSeed(): Campaign[] {
  return ['hq-1', 'hq-2'].map((ownerId, index) => ({
    id: `campaign-demo-${index + 1}`, ownerId, title: `Campaign Studio Dummy ${index + 1}`, brand: `Brand Simulasi ${index + 1}`,
    objective: 'Mengenalkan produk simulasi', audience: 'Audiens konten kreatif', messaging: 'Cerita sederhana dari pengalaman kreator',
    brief: 'Semua nama, akun dan transaksi merupakan fixture sintetis.',
    milestones: [{ id: 'listing', title: 'Listing talent', deadline: '2026-10-20' }, { id: 'draft', title: 'Draft konten', deadline: '2026-10-24' }, { id: 'posting', title: 'Posting / ACC', deadline: '2026-10-27' }],
    batches: [{ id: 'batch-1', name: 'Batch pembuka' }],
    products: [{ id: 'sku-demo', name: 'Produk Studio Dummy', variant: 'Demo', referenceValue: 125000 }],
    assignments: ['creator-1', 'creator-2'].map((creatorId, i) => ({ id: `assignment-${index + 1}-${i + 1}`, batchId: 'batch-1', creatorId, creatorName: `Kreator Dummy ${i + 1}`,
      socialProfiles: [{ platform: 'Instagram', handle: `@creator_dummy_${i + 1}`, followers: i ? null : 1200, capturedAt: '2026-10-18' }],
      deliverables: [{ id: 'output-1', title: 'Video ulasan dummy', platform: 'Instagram', postingRequired: true, deadline: '2026-10-27' }, { id: 'output-2', title: 'Konten untuk brand', platform: 'Brand asset', postingRequired: false, deadline: '2026-10-27' }],
    })),
  }));
}
