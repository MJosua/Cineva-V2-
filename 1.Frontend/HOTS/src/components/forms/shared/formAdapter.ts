import type { DynamicFormItem } from '@hots/dynamic-form';
import { normalizeServiceFormConfig } from '@hots/service-form-runtime';
import type { FormStructureItem } from '@/types/formTypes';
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
// Retain unknown business properties, stable item IDs and the JSON contract.
export const toSharedFormItems = (items: FormStructureItem[]): DynamicFormItem[] => copy(items) as unknown as DynamicFormItem[];
export const fromSharedFormItems = (items: DynamicFormItem[]): FormStructureItem[] => copy(items) as unknown as FormStructureItem[];
export const createSharedPreviewSchema = (items: FormStructureItem[]) => normalizeServiceFormConfig({
  service_id: 'preview', service_name: 'Form preview', form_json: { title: 'Form preview', items: toSharedFormItems(items) },
});
export function updateFormData(items: FormStructureItem[], itemId: string, patch: Record<string, unknown>, childIndex?: number): FormStructureItem[] {
  return items.map(item => {
    if (item.id !== itemId) return item;
    if (childIndex === undefined) return { ...item, data: { ...item.data, ...patch } } as FormStructureItem;
    const data = item.data as { fields?: Record<string, unknown>[] };
    return { ...item, data: { ...data, fields: data.fields?.map((field, index) => index === childIndex ? { ...field, ...patch } : field) } } as FormStructureItem;
  });
}
