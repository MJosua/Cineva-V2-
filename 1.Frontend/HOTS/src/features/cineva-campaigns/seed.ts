import type { Campaign } from './model';

/**
 * Campaign contoh dari data client (assessment + progress Vape Liquid IC 100, 2 Nov 2026). Data brand, produk, SOW, fee dan timeline asli;
 * nama, akun, WhatsApp dan alamat kreator disamarkan karena demo dibagikan ke client (UU PDP). Angka views dari dashboard engagement sheet.
 * creatorId bergantian ke dua akun Creator demo karena validasi hanya mengenal creator-1/creator-2.
 */
const ic100Talent: Array<[string, number, string, string]> = [
  ['Kreator IC-01', 1229, 'Lifestyle', 'Fresh Lemon'], ['Kreator IC-02', 1402, 'Lifestyle', 'Fresh Lemon'],
  ['Kreator IC-03', 941, 'Lifestyle', 'Strawberry (Smooth Berry)'], ['Kreator IC-04', 1158, 'Lifestyle, Beauty, Foodies', 'Strawberry (Smooth Berry)'],
  ['Kreator IC-05', 2631, 'Lifestyle, Reviewer, Art', 'Grape Burst'], ['Kreator IC-06', 1030, 'Lifestyle', 'Red Apple'],
  ['Kreator IC-07', 682, 'Lifestyle, Foodies', 'Mango'], ['Kreator IC-08', 2871, 'Lifestyle, Fashion', 'Fresh Lemon'],
];
function ic100Campaign(): Campaign {
  const products = ['Fresh Lemon', 'Strawberry (Smooth Berry)', 'Grape Burst', 'Red Apple', 'Mango']
    .map((name, i) => ({ id: `ic100-${i + 1}`, name, variant: 'Saltnic 30mg 30ml', referenceValue: 110_000 }));
  return {
    id: 'campaign-ic100', ownerId: 'hq-1', title: 'Campaign Vape Liquid IC 100', brand: 'Vape Liquid IC 100',
    objective: 'Liquid ramah di cartridge, anti cepat gosong; rasa buah natural dan dinginnya me-recharge mood.',
    audience: 'Anak muda, vaper', messaging: 'Filosofi #ISEENOLIMIT: nikmati liquid IC 100 setiap momen tanpa batas.',
    brief: 'Kategori creator: fashion, OOTD, lifestyle, place to go, vaper/pod. Platform Instagram dan TikTok. Benefit: 1 pcs liquid (nilai Rp110.000) + fee Rp100.000. SOW: 1x Reels/TikTok (owning) + 1x checkout produk (dibayar brand). Budget marketing Rp30.000 per creator.',
    milestones: [{ id: 'drafting', title: 'Draft konten', deadline: '2026-10-20' }, { id: 'posting', title: 'Posting', deadline: '2026-10-22' }, { id: 'insight', title: 'Insight H+7', deadline: '2026-10-29' }],
    batches: [{ id: 'ic100-b1', name: 'Talent terpilih' }], products,
    jobRules: { sowFee: 100_000, storylineApprovalRequired: true },
    stagePlan: { templateId: 'kol-produk-ic100', startDate: '2026-10-07', holidays: [], extensions: [] },
    assignments: ic100Talent.map(([creatorName, views, niche, product], i) => ({
      id: `ic100-a${i + 1}`, batchId: 'ic100-b1', creatorId: i % 2 ? 'creator-2' : 'creator-1', creatorName,
      socialProfiles: [{ platform: 'Instagram', handle: `@kreator_ic_${String(i + 1).padStart(2, '0')}`, followers: null, capturedAt: '2026-10-29' }],
      deliverables: [{ id: 'reels', title: `1x Reels/TikTok owning · ${product} · niche ${niche} · ${views} views (insight)`, platform: 'Instagram', postingRequired: true, deadline: '2026-10-22' },
        { id: 'checkout', title: '1x checkout produk (dibayar brand)', platform: 'Brand asset', postingRequired: false, deadline: '2026-10-10' }],
    })),
  };
}

export function campaignSeed(): Campaign[] {
  return [ic100Campaign(), ...['hq-1', 'hq-2'].map((ownerId, index) => ({
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
  }))];
}
