import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Actor } from '../cineva-inquiries/domain';
import { CampaignDesk, type AssignmentPanelProps } from './CampaignDesk';
import { createApiCampaignRepository } from './apiRepository';
import { campaignRepository } from './repository';

const defaultUrl = 'http://127.0.0.1:4300/api/cineva/v1';
const read = (name: string, fallback: string) => { try { return window.localStorage.getItem(name) ?? fallback; } catch { return fallback; } };
const write = (name: string, value: string) => { try { window.localStorage.setItem(name, value); } catch { /* preference only */ } };

/** Pemilih sumber data campaign: dummy lokal (bawaan) atau API percobaan. Hanya preferensi tampilan; tidak mengubah data. */
export function CampaignSourceDesk(props: { actor: Actor; onIdentityChange: (id: string) => void; renderExecution?: (props: AssignmentPanelProps) => ReactNode; renderFinance?: (props: AssignmentPanelProps) => ReactNode }) {
  const [source, setSource] = useState<'local' | 'api'>(() => (read('cineva_campaign_source', 'local') === 'api' ? 'api' : 'local'));
  const [url, setUrl] = useState(() => read('cineva_campaign_api_url', defaultUrl));
  const [applied, setApplied] = useState(url), [version, setVersion] = useState(0);
  const api = useMemo(() => createApiCampaignRepository({ baseUrl: applied }), [applied]);
  const choose = (value: 'local' | 'api') => { setSource(value); write('cineva_campaign_source', value); };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3 text-sm" data-testid="campaign-source">
      <label className="block">Sumber data campaign
        <select aria-label="Sumber data campaign" className="mt-1 block h-10 rounded-md border border-input bg-background px-3" value={source} onChange={event => choose(event.target.value as 'local' | 'api')}>
          <option value="local">Dummy lokal (browser)</option><option value="api">API percobaan (MySQL cineva_trial)</option></select></label>
      {source === 'api' && <>
        <label className="block min-w-[18rem] flex-1">Alamat API<Input aria-label="Alamat API" value={url} onChange={event => setUrl(event.target.value)}/></label>
        <Button variant="outline" onClick={() => { write('cineva_campaign_api_url', url); setApplied(url); setVersion(value => value + 1); }}>Terapkan alamat</Button>
        <Button variant="outline" onClick={() => { void api.reload(); setVersion(value => value + 1); }}>Muat ulang</Button>
        <p className="w-full text-xs text-muted-foreground">Percobaan: identitas dipetakan ke hq-1, hq-2, creator-1 dan creator-2 lewat header x-test-principal. Bukan autentikasi. Perubahan identitas atau brief campaign, penghapusan, dan data profil sosial belum didukung API.</p></>}
    </div>
    <CampaignDesk key={`${source}-${applied}-${version}`} {...props} repository={(source === 'api' ? api : campaignRepository) as typeof campaignRepository}/>
  </div>;
}
