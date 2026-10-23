import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExcelAccount } from './liveSource';
import { mapCreatorProfile } from './profileMapping';
export function ReferenceSummary({ account }: { account: ExcelAccount }) {
  const profile = mapCreatorProfile(account), fields = account.sections.flatMap(section => section.fields);
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Card><CardContent className="space-y-2 p-5" data-testid="instagram-followers"><p className="text-sm text-muted-foreground">Followers Instagram</p><p className="font-semibold">{profile.instagramFollowers === null ? 'Jumlah belum tercatat' : profile.instagramFollowers.toLocaleString('id-ID')}</p>{profile.followerCell && <p className="text-xs text-muted-foreground">{profile.followerCell}</p>}</CardContent></Card>
    <Card><CardContent className="space-y-2 p-5" data-testid="content-niche"><p className="text-sm text-muted-foreground">Niche / kategori konten</p><div className="flex flex-wrap gap-2">{profile.niches.length ? profile.niches.map(niche => <Badge key={niche} variant="secondary">{niche}</Badge>) : <p className="text-sm">Belum tercatat</p>}</div>{profile.nicheCells.length > 0 && <p className="text-xs text-muted-foreground">Sumber: {profile.nicheCells.join(', ')}</p>}</CardContent></Card>
    {['PRODUCT', 'STATUS PAYMENT', 'VIEWS'].map(label => { const field = fields.find(item => item.label.trim().toUpperCase() === label); return <Card key={label}><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="break-words font-semibold">{field ? field.value === null || field.value === '' ? 'Kosong di Excel' : String(field.value) : 'Kolom tidak ada pada bagian sumber'}</p>{field && <p className="text-xs text-muted-foreground">{field.cell}</p>}</CardContent></Card>; })}
  </div>;
}
