import type { ExcelAccount, ExcelField } from './liveSource';
const instagramFollowers = (field: ExcelField) => /^FOLLOWERS(?: INSTAGRAM)?$/.test(field.label.trim().toUpperCase());
export function followerCount(value: ExcelField['value']): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^\d+$/.test(text) && !/^\d{1,3}(?:[.,]\d{3})+$/.test(text)) return null;
  const count = Number(text.replace(/[.,]/g, ''));
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}
export function isNicheFromFollowers(field: ExcelField): boolean {
  return instagramFollowers(field) && typeof field.value === 'string' && /[a-zA-Z]/.test(field.value)
    && !/[\d:@]|https?:|^\s*(?:n\/?a|unknown|null|none|belum tersedia)\s*$/i.test(field.value);
}
/** User-confirmed mapping: generic FOLLOWERS means Instagram; category text belongs to niche. */
export function mapCreatorProfile(account: ExcelAccount) {
  const fields = account.sections.flatMap(section => section.fields);
  const countSource = fields.find(field => instagramFollowers(field) && followerCount(field.value) !== null);
  const roster = account.sections[0]?.fields ?? [];
  const nicheSources = roster.filter(field => isNicheFromFollowers(field) || /^(NICHE|KATEGORI KONTEN|CONTENT NICHE)$/i.test(field.label.trim()));
  const niches = [...new Set(nicheSources.flatMap(field => typeof field.value === 'string' ? field.value.split(/[,;/|&]+/).map(value => value.trim()).filter(Boolean) : []))];
  return { instagramFollowers: countSource ? followerCount(countSource.value) : null, followerCell: countSource?.cell, niches, nicheCells: nicheSources.map(field => field.cell) };
}
