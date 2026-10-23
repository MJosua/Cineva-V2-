import { useMemo } from 'react';
import { createDynamicFormRegistry, DynamicForm, UnifiedFormStructureBuilder } from '@hots/dynamic-form';
import type { FormStructureItem } from '@/types/formTypes';
import { FormLayoutPreview } from './FormLayoutPreview';
import { CinevaFormAddonEditors } from './shared/CinevaFormAddonEditors';
import { createSharedPreviewSchema, fromSharedFormItems, toSharedFormItems } from './shared/formAdapter';
const allowedTypes = ['text','textarea','select','radio','checkbox','date','time','file','toggle','number','suggestion-insert','html','cms','textblock','qrcodedesign'];
export function UnifiedFormStructureEditor({ items, onUpdate }: { items: FormStructureItem[]; onUpdate: (items: FormStructureItem[]) => void }) {
  const registry = useMemo(() => {
    return createDynamicFormRegistry().registerField({
      type: 'qrcodedesign', label: 'QR code design',
      createDefault: () => ({ type: 'qrcodedesign', name: `qr_${Date.now()}`, label: 'QR code design' }),
      component: () => <div className="rounded border p-3 text-sm">QR configuration is rendered in the service form.</div>,
    });
  }, []);
  const sharedItems = useMemo(() => toSharedFormItems(items), [items]);
  const preview = useMemo(() => createSharedPreviewSchema(items), [items]);
  return <div className="space-y-4">
    <UnifiedFormStructureBuilder title="Form structure" description="Arrange fields and containers, then edit their properties."
      items={sharedItems} onUpdate={next => onUpdate(fromSharedFormItems(next))} databaseMappingMode="eav"
      registry={registry} allowedFieldTypes={allowedTypes} allowSpecialFunctions
      renderPreview={() => <DynamicForm schema={preview} registry={registry} readOnly onSubmit={() => undefined} />} />
    <CinevaFormAddonEditors items={items} onUpdate={onUpdate} />
    <details><summary className="cursor-pointer text-sm font-medium">Legacy layout and column mapping</summary><FormLayoutPreview items={items} onUpdate={onUpdate} /></details>
  </div>;
}
