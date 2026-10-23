import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ProjectType } from '../cineva-shared/model';
import { advanceServiceWorkflow, getServiceWorkflow, serviceStages, type ServiceWorkflowState } from './workflow';

export interface ServiceWorkflowProps {
  type: ProjectType;
  state?: ServiceWorkflowState;
  busy?: boolean;
  readOnly?: boolean;
  onAdvance: (next: ServiceWorkflowState) => Promise<boolean | void> | boolean | void;
}

/** Composes vendor stage configuration with HOTS UI; persistence belongs to the host. */
export function ServiceWorkflow({ type, state, busy = false, readOnly = false, onAdvance }: ServiceWorkflowProps) {
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  let current: ServiceWorkflowState;
  try { current = getServiceWorkflow(type, state); }
  catch (failure) { return <p role="alert" className="text-sm text-destructive">{(failure as Error).message}</p>; }
  const stages = serviceStages[type], index = stages.findIndex(stage => stage.id === current.stage), next = stages[index + 1];
  return <section aria-label="Tahapan layanan" className="space-y-3 rounded-md border border-border p-4">
    <h3 className="text-sm font-semibold">Tahapan {type}</h3>
    <ol className="space-y-2 text-sm">{stages.map((stage, position) => <li key={stage.id} aria-current={position === index ? 'step' : undefined} className={position === index ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
      {position + 1}. {stage.label}{position < index ? ' · Selesai' : position === index ? ' · Saat ini' : ''}
    </li>)}</ol>
    <p className="text-sm text-muted-foreground">{stages[index].description}</p>
    <p className="text-xs text-muted-foreground">Tahapan layanan terpisah dari status pekerjaan dan pembayaran.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {next && !readOnly && <Button variant="outline" disabled={busy || pending} onClick={async () => {
      setPending(true); setError('');
      try {
        const saved = await onAdvance(advanceServiceWorkflow(type, state));
        if (saved === false) setError('Tahapan belum tersimpan. Coba kembali.');
      } catch (failure) { setError((failure as Error).message); }
      finally { setPending(false); }
    }}>Lanjut ke {next.label}</Button>}
    {!next && <p className="text-sm font-medium">Seluruh tahapan layanan selesai.</p>}
  </section>;
}
