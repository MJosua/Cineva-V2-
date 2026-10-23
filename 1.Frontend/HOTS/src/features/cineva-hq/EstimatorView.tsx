import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HotsForm } from '../cineva-shared/HotsForm';
import { JobEditor } from '../cineva-shared/JobEditor';
import { estimateBudget, money, type ProjectType } from '../cineva-shared/model';
export function EstimatorView() {
    const [result, setResult] = useState<ReturnType<typeof estimateBudget> | null>(null), [type, setType] = useState<ProjectType>('Content Shoot'), [error, setError] = useState(''), [open, setOpen] = useState(false);
    return <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Budget estimator</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Tarif dummy: crew Rp350.000/orang/hari; gear Rp250.000/unit/hari. Bukan quotation produksi.</p><HotsForm schema={{ title: 'Estimasi', fields: [{ name: 'type', label: 'Jenis shoot', type: 'select', required: true, options: ['Campaign', 'Production', 'Content Shoot'] }, { name: 'crew', label: 'Jumlah crew', type: 'number', required: true, minnumber: 1, maxnumber: 100 }, { name: 'days', label: 'Durasi (hari)', type: 'number', required: true, minnumber: 1, maxnumber: 365 }, { name: 'gear', label: 'Unit gear', type: 'number', required: true, minnumber: 0, maxnumber: 100 }] }} initialValues={{ type: 'Content Shoot', crew: 2, days: 1, gear: 1 }} submitLabel="Hitung estimasi" onSubmit={values => { try {
        const nextType = String(values.type) as ProjectType;
        setResult(estimateBudget(nextType, Number(values.crew), Number(values.days), Number(values.gear)));
        setType(nextType);
        setError('');
    }
    catch (failure) {
        setError((failure as Error).message);
    } }}/>{error && <p role="alert" className="text-destructive">{error}</p>}</CardContent></Card><Card><CardHeader><CardTitle>Rincian penawaran</CardTitle></CardHeader><CardContent>{result ? <div className="space-y-4" data-testid="estimate-result"><p>Base {money(result.base)}</p><p>Crew {money(result.crew)}</p><p>Gear {money(result.gear)}</p><p className="border-t border-border pt-4 text-2xl font-semibold">{money(result.total)}</p><Button onClick={() => setOpen(true)}>Gunakan untuk project</Button></div> : <p className="text-muted-foreground">Isi kebutuhan shoot untuk melihat rincian.</p>}</CardContent></Card>{open && result && <JobEditor open draft={{ type, fee: result.total }} onClose={() => setOpen(false)}/>}</div>;
}
