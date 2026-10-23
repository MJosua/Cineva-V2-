import { demoClock, type JobDraft, type Workspace } from './model';
/** Deterministic dummy adapter, NOT local LLM inference. No SQL or tenant authority. */
export function draftFromPrompt(text: string, workspace: Workspace, clock = demoClock): JobDraft {
    const normalized = text.toLowerCase();
    const client = workspace.clients.find(c => normalized.includes(c.name.replace(/ \(Dummy\)/, '').toLowerCase()));
    const hour = normalized.match(/(?:jam|at)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    const fee = normalized.match(/(?:fee|bayaran|senilai)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|juta)?/) ?? normalized.match(/(?:for)\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|juta)?\s*fee/);
    const explicitDate = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
    if (!client || !hour || !fee || (!explicitDate && !/besok|tomorrow/.test(normalized)))
        throw new Error('Lengkapi client, tanggal/besok, jam dan fee. Contoh: Shoot di Navi Cafe besok jam 10 fee 300rb.');
    let hours = Number(hour[1]);
    const minutes = Number(hour[2] || 0);
    if (hour[3]) {
        if (hours < 1 || hours > 12)
            throw new Error('Jam tidak valid.');
        hours = hours % 12 + (hour[3] === 'pm' ? 12 : 0);
    }
    if (hours > 23 || minutes > 59)
        throw new Error('Jam tidak valid.');
    const raw = /^\d{1,3}(?:\.\d{3})+$/.test(fee[1]) ? fee[1].replace(/\./g, '') : fee[1].replace(',', '.');
    const amount = Number(raw) * (fee[2] === 'juta' ? 1000000 : fee[2] ? 1000 : 1);
    const date = explicitDate ?? new Date(clock.getTime() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    return { title: `Shoot ${client.name.replace(/ \(Dummy\)/, '')}`, brief: text, clientId: client.id, type: 'Content Shoot', platform: 'Instagram', scheduledAt: `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, durationHours: 2, fee: amount, barter: 0, resourceIds: [] };
}
