import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea } from '@hots/ui-kit';
import type { FormField, FormSection, FormStructureItem, RowGroup, SpecialElement } from '@/types/formTypes';
import { FieldEditor } from '../FieldEditor';
import { RowGroupConfigurator } from '../RowGroupConfigurator';
import { updateFormData } from './formAdapter';
function DiagramSettings({ value, onUpdate }: { value: unknown; onUpdate: (value: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2)), [error, setError] = useState('');
  return <div className="space-y-2"><Label>Diagram data (advanced JSON)</Label><Textarea value={text} onChange={e => setText(e.target.value)} />{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button variant="outline" onClick={() => { try { onUpdate(JSON.parse(text)); setError(''); } catch { setError('Enter valid JSON before applying diagram changes.'); } }}>Apply diagram data</Button></div>;
}
// Domain-specific settings remain optional add-ons to the shared visual builder.
export function CinevaFormAddonEditors({ items, onUpdate }: { items: FormStructureItem[]; onUpdate: (items: FormStructureItem[]) => void }) {
  const [fieldTarget, setFieldTarget] = useState<{ itemId: string; childIndex?: number } | null>(null);
  const [rowTarget, setRowTarget] = useState<string | null>(null);
  const [specialTarget, setSpecialTarget] = useState<string | null>(null);
  const fields: Array<{ itemId: string; childIndex?: number; field: FormField }> = items.flatMap(item => item.type === 'field'
    ? [{ itemId: item.id, field: item.data as FormField }]
    : item.type === 'section' ? ((item.data as FormSection).fields || []).map((field, childIndex) => ({ itemId: item.id, childIndex, field })) : []);
  const selectedField = fieldTarget && fields.find(f => f.itemId === fieldTarget.itemId && f.childIndex === fieldTarget.childIndex);
  const row = items.find(i => i.id === rowTarget);
  const special = items.find(i => i.id === specialTarget)?.data as SpecialElement | undefined;
  return <section className="rounded-lg border p-4 space-y-3">
    <h3 className="font-semibold">Advanced domain settings</h3><div className="flex flex-wrap gap-2">
      {fields.map(f => <Button key={`${f.itemId}:${f.childIndex ?? 'root'}`} variant="outline" size="sm" onClick={() => setFieldTarget({ itemId: f.itemId, childIndex: f.childIndex })}>{f.field.label}: rules and data sources</Button>)}
      {items.filter(i => i.type === 'rowgroup').map(i => <Button key={i.id} variant="outline" size="sm" onClick={() => setRowTarget(i.id)}>{(i.data as RowGroup).title || 'Row group'}: columns</Button>)}
      {items.filter(i => i.type === 'specialfunc').map(i => <Button key={i.id} variant="outline" size="sm" onClick={() => setSpecialTarget(i.id)}>{(i.data as SpecialElement).title || 'Special element'}: content</Button>)}
    </div>
    <Dialog open={Boolean(selectedField)} onOpenChange={open => { if (!open) setFieldTarget(null); }}><DialogContent className="max-w-3xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>Advanced field settings</DialogTitle></DialogHeader>{selectedField && <FieldEditor key={`${selectedField.itemId}:${selectedField.childIndex}`} field={selectedField.field} fields={fields.map(f => f.field)} onCancel={() => setFieldTarget(null)} onUpdate={patch => { onUpdate(updateFormData(items, selectedField.itemId, patch as unknown as Record<string, unknown>, selectedField.childIndex)); setFieldTarget(null); }} />}</DialogContent></Dialog>
    {row && <RowGroupConfigurator key={row.id} rowGroup={row.data as RowGroup} fields={fields.map(f => f.field)} isOpen onOpenChange={open => { if (!open) setRowTarget(null); }} onUpdate={patch => { onUpdate(updateFormData(items, row.id, patch as unknown as Record<string, unknown>)); setRowTarget(null); }} />}
    <Dialog open={Boolean(special)} onOpenChange={open => { if (!open) setSpecialTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Special content</DialogTitle></DialogHeader>{special && <div className="space-y-3">
      <Label>Title</Label><Input value={special.title} onChange={e => onUpdate(updateFormData(items, specialTarget!, { title: e.target.value }))} />
      <Label>Content type</Label><select className="h-10 w-full rounded-md border px-3" value={special.element_type} onChange={e => onUpdate(updateFormData(items, specialTarget!, { element_type: e.target.value }))}>{['cms_content','cms_header','special_table','diagram','html_block'].map(type => <option key={type}>{type}</option>)}</select>
      <Label>CMS page ID</Label><Input type="number" value={special.cms_page_id ?? ''} onChange={e => onUpdate(updateFormData(items, specialTarget!, { cms_page_id: e.target.value === '' ? null : Number(e.target.value) }))} />
      <Label>CMS section</Label><Input value={special.cms_section ?? ''} onChange={e => onUpdate(updateFormData(items, specialTarget!, { cms_section: e.target.value }))} />
      <Label>Table type</Label><Input value={special.table_type ?? ''} onChange={e => onUpdate(updateFormData(items, specialTarget!, { table_type: e.target.value }))} />
      <Label>HTML</Label><Textarea value={special.html_content ?? ''} onChange={e => onUpdate(updateFormData(items, specialTarget!, { html_content: e.target.value }))} />
      <Label>Visibility condition</Label><Input value={special.uiCondition ?? ''} onChange={e => onUpdate(updateFormData(items, specialTarget!, { uiCondition: e.target.value }))} />
      {special.element_type === 'diagram' && <DiagramSettings key={specialTarget} value={special.diagram_data} onUpdate={value => onUpdate(updateFormData(items, specialTarget!, { diagram_data: value }))} />}
      <Button onClick={() => setSpecialTarget(null)}>Done</Button>
    </div>}</DialogContent></Dialog>
  </section>;
}
