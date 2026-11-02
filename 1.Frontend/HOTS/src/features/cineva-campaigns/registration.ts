import type { Actor } from '../cineva-inquiries/domain';
import type { StoragePort } from '../cineva-inquiries/repository';
import { findDuplicateRegistrations, normalizeWhatsapp, type DuplicateMatch } from '../cineva-services/policies.ts';
import { meetsAgeRule, type CampaignJobRules } from './model.ts';

/**
 * Pendaftaran creator per campaign, mengikuti kolom sheet progress client (IC 100): nama, domisili, umur, akun IG/TikTok + followers + niche,
 * gender, WhatsApp, pekerjaan, status screening (ACC/Ditolak) dan PIC screening. Cek ganda memakai `findDuplicateRegistrations` (batch J),
 * syarat usia memakai `jobRules.minAge`. Data creator disimpan tanpa batas waktu dan akun/followers boleh diperbarui (batch J).
 */
export type RegistrationStatus = 'baru' | 'acc' | 'ditolak';
export interface SocialAccount { platform: 'Instagram' | 'TikTok'; username: string; followers: number | null; niche: string }
export interface CreatorRegistration {
  id: string; campaignId: string; submittedBy: string; submittedAt: string;
  name: string; city: string; age: number; gender: 'Pria' | 'Wanita'; whatsapp: string; occupation: string;
  accounts: SocialAccount[]; status: RegistrationStatus; pic?: string; note?: string; updatedAt?: string;
}
export type RegistrationInput = Omit<CreatorRegistration, 'id' | 'campaignId' | 'submittedBy' | 'submittedAt' | 'status' | 'pic' | 'note' | 'updatedAt'>;
export const statusLabels: Record<RegistrationStatus, string> = { baru: 'Baru', acc: 'ACC', ditolak: 'Ditolak' };

export function validateRegistration(input: RegistrationInput, rules?: CampaignJobRules): RegistrationInput {
  const name = input.name.trim(), city = input.city.trim(), occupation = input.occupation.trim();
  if (!name || name.length > 120) throw new Error('Nama lengkap wajib diisi.');
  if (!city) throw new Error('Domisili wajib diisi.');
  if (!Number.isSafeInteger(input.age) || input.age < 13 || input.age > 100) throw new Error('Umur harus angka 13 sampai 100.');
  if (!meetsAgeRule(input.age, rules)) throw new Error(`Campaign ini mensyaratkan usia minimal ${rules?.minAge} tahun.`);
  if (!['Pria', 'Wanita'].includes(input.gender)) throw new Error('Pilih gender.');
  if (!normalizeWhatsapp(input.whatsapp)) throw new Error('Nomor WhatsApp tidak valid.');
  const accounts = input.accounts.map(item => ({ ...item, username: item.username.trim().replace(/^@/, ''), niche: item.niche.trim() })).filter(item => item.username);
  if (!accounts.length) throw new Error('Isi minimal satu akun Instagram atau TikTok.');
  if (accounts.some(item => !['Instagram', 'TikTok'].includes(item.platform) || !/^[\w.]{1,60}$/.test(item.username) || (item.followers !== null && (!Number.isSafeInteger(item.followers) || item.followers < 0))))
    throw new Error('Username hanya huruf, angka, titik atau garis bawah; followers angka bulat.');
  return { ...input, name, city, occupation, whatsapp: normalizeWhatsapp(input.whatsapp), accounts };
}
export const duplicatesOf = (rows: CreatorRegistration[]): DuplicateMatch[] =>
  findDuplicateRegistrations(rows.map(row => ({ id: row.id, name: row.name, whatsapp: row.whatsapp, accounts: row.accounts })));

/** Data contoh sintetis berpola sheet progress IC 100 (60 pendaftar, 25 ACC); termasuk satu pasangan ganda untuk demo cek duplikat. */
export function registrationSeed(): CreatorRegistration[] {
  const niches = ['Lifestyle, Fashion', 'Lifestyle', 'Lifestyle, Foodies', 'Vapers, Lifestyle'], cities = ['Bandung', 'Yogyakarta', 'Jakarta', 'Tangerang Selatan', 'Bogor', 'Cimahi'];
  const rows: CreatorRegistration[] = Array.from({ length: 12 }, (_, i) => ({
    id: `reg-ic100-${i + 1}`, campaignId: 'campaign-ic100', submittedBy: 'publik', submittedAt: `2026-10-0${1 + (i % 6)}T09:00:00.000Z`,
    name: `Pendaftar IC ${String(i + 1).padStart(2, '0')}`, city: cities[i % cities.length], age: 20 + (i * 3) % 15, gender: i % 2 ? 'Pria' : 'Wanita',
    whatsapp: `62812000${String(1000 + i)}`, occupation: ['Freelance', 'Mahasiswa', 'Karyawan', 'Content creator'][i % 4],
    accounts: [{ platform: 'Instagram', username: `pendaftar_ic_${i + 1}`, followers: 300 + i * 410, niche: niches[i % 4] }, { platform: 'TikTok', username: `pendaftar.ic${i + 1}`, followers: 90 + i * 620, niche: niches[(i + 1) % 4] }],
    status: i < 5 ? 'acc' : i < 9 ? 'ditolak' : 'baru', pic: i < 9 ? (i % 2 ? 'PIC A' : 'PIC B') : undefined,
  }));
  rows.push({ ...rows[2], id: 'reg-ic100-13', name: 'Pendaftar IC 03 (daftar ulang)', submittedAt: '2026-10-06T10:00:00.000Z', status: 'baru', pic: undefined });
  return rows;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export function createRegistrationRepository(storage: StoragePort) {
  const key = 'registrations', listeners = new Set<() => void>();
  const read = (): CreatorRegistration[] => { const saved = storage.get<CreatorRegistration[]>(key); return clone(Array.isArray(saved) ? saved : registrationSeed()); };
  const write = (rows: CreatorRegistration[]) => { storage.set(key, rows); listeners.forEach(listener => listener()); };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** HQ melihat semua pendaftar campaign; Creator hanya pendaftarannya sendiri. */
    list(actor: Actor, campaignId: string) { return read().filter(row => row.campaignId === campaignId && (actor.product === 'hq' || row.submittedBy === actor.id)); },
    submit(actor: Actor, campaignId: string, input: RegistrationInput, rules: CampaignJobRules | undefined, now: string) {
      const clean = validateRegistration(input, rules), rows = read();
      if (actor.product === 'creator' && rows.some(row => row.campaignId === campaignId && row.submittedBy === actor.id)) throw new Error('Anda sudah mendaftar campaign ini; perbarui data pendaftaran yang ada.');
      const row: CreatorRegistration = { ...clean, id: `reg-${crypto.randomUUID()}`, campaignId, submittedBy: actor.product === 'creator' ? actor.id : `${actor.id} (input HQ)`, submittedAt: new Date(now).toISOString(), status: 'baru' };
      write([...rows, row]);
      return { row, duplicates: duplicatesOf(read().filter(item => item.campaignId === campaignId)).filter(match => match.ids.includes(row.id)) };
    },
    /** Akun dan followers boleh diperbarui kapan saja (batch J: data disimpan selamanya tetapi fleksibel). */
    updateAccounts(actor: Actor, id: string, accounts: SocialAccount[], now: string) {
      const rows = read(), row = rows.find(item => item.id === id);
      if (!row || !(actor.product === 'hq' || row.submittedBy === actor.id)) throw new Error('Pendaftaran tidak tersedia.');
      const clean = validateRegistration({ ...row, accounts });
      write(rows.map(item => item.id === id ? { ...item, accounts: clean.accounts, updatedAt: new Date(now).toISOString() } : item));
    },
    decide(actor: Actor, id: string, status: Exclude<RegistrationStatus, 'baru'>, pic: string, note: string, now: string) {
      if (actor.product !== 'hq') throw new Error('Screening pendaftar dilakukan HQ.');
      if (!pic.trim()) throw new Error('Isi nama PIC screening.');
      const rows = read(); if (!rows.some(item => item.id === id)) throw new Error('Pendaftaran tidak ditemukan.');
      write(rows.map(item => item.id === id ? { ...item, status, pic: pic.trim(), note: note.trim().slice(0, 500), updatedAt: new Date(now).toISOString() } : item));
    },
  };
}
export type RegistrationRepository = ReturnType<typeof createRegistrationRepository>;
