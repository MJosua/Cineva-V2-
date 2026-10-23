import { HotsForm } from '../cineva-shared/HotsForm';
import type { RateCard } from './pricing';
export function RateCardEditor({ rates, onSave }: { rates: RateCard; onSave: (next: RateCard) => void }) {
  return <details className="rounded-md border border-border p-4"><summary className="cursor-pointer font-semibold">Konfigurasi tarif dummy</summary><p className="my-3 text-sm text-muted-foreground">Perubahan tarif tidak mengubah snapshot quote terdahulu. Semua harga adalah simulasi.</p>
    <HotsForm initialValues={{ version: rates.version, crew: rates.crew, gear: rates.gear, campaign: rates.base.Campaign, production: rates.base.Production, content: rates.base['Content Shoot'] }} schema={{ title: 'Tarif', fields: [
      { name: 'version', label: 'Versi tarif', type: 'text', required: true },
      ...['crew', 'gear', 'campaign', 'production', 'content'].map(name => ({ name, label: `Tarif ${name} (Rp)`, type: 'number', required: true, minnumber: 0 })),
    ] }} submitLabel="Simpan tarif dummy" onSubmit={v => onSave({ version: String(v.version), crew: Number(v.crew), gear: Number(v.gear), base: { Campaign: Number(v.campaign), Production: Number(v.production), 'Content Shoot': Number(v.content) } })}/>
  </details>;
}
