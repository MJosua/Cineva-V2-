import type { Actor, Inquiry } from '../cineva-inquiries/domain';
import type { InquiryRepository } from '../cineva-inquiries/repository';
import { changeSupport } from './assignment';
export interface SupportProvider { reply(brief: Inquiry['brief'], text: string): Promise<string> }
export const dummySupportProvider: SupportProvider = {
  async reply(brief) { return `Simulasi AI: brief ${String(brief.title)} diterima. Pastikan lokasi, jadwal dan deliverable sudah lengkap. Quote merupakan estimasi; pilih Bantuan manusia untuk berbicara dengan CS.`; },
};
export function handover(row: Inquiry, actor: Actor = { id: row.owner, product: row.owner === row.destination ? 'hq' : 'creator' }): Inquiry {
  return changeSupport(row, actor, 'waiting');
}
export function claim(row: Inquiry, actor: Actor): Inquiry {
  if (actor.product !== 'hq' || row.destination !== actor.id || row.support !== 'waiting') throw new Error('Percakapan belum menunggu agen HQ ini.');
  return changeSupport(row, actor, 'human', { agent: `${actor.id}-agent` });
}
export async function sendSupport(repo: InquiryRepository, id: string, actor: Actor, text: string, provider = dummySupportProvider, messageId = crypto.randomUUID()) {
  const cleaned = text.trim(); if (!cleaned || cleaned.length > 2000) throw new Error('Pesan wajib 1–2.000 karakter.');
  const row = repo.update(id, actor, current => {
    const previous = current.messages.find(message => message.id === messageId);
    if (previous) {
      if (previous.actor !== actor.id || previous.text !== cleaned) throw new Error('ID pesan sudah digunakan untuk isi lain.');
      return current;
    }
    if (current.support === 'resolved') throw new Error('Buka kembali percakapan terlebih dahulu.');
    if (actor.product === 'hq' && current.support !== 'human') throw new Error('Ambil percakapan sebagai agen terlebih dahulu.');
    return { ...current, messages: [...current.messages, { id: messageId, actor: actor.id, text: cleaned }] };
  });
  if (actor.product === 'hq' || row.support !== 'ai' || row.messages.some(message => message.id === `${messageId}-ai`)) return;
  const reply = await provider.reply(row.brief, cleaned);
  repo.update(id, actor, current => {
    if (current.support !== 'ai' || current.messages.at(-1)?.id !== messageId || (current.supportEvents?.length ?? 0) !== (row.supportEvents?.length ?? 0)) return current;
    if (!reply.trim() || reply.length > 4000) throw new Error('Respons provider tidak valid.');
    return { ...current, messages: [...current.messages, { id: `${messageId}-ai`, actor: 'AI dummy', text: reply }] };
  });
}
