import { applyFieldRules, type DynamicFormItem, type DynamicFormSchema, type DynamicRowGroupSchema, type FormValues } from "@hots/dynamic-form";

type MappedItem = {
  id?: string;
  name?: string;
  label: string;
  value?: unknown;
  type: string;
  rows?: unknown[];
  columns?: unknown[];
  selectedObject: unknown;
};

function fieldValue(values: FormValues, name?: string) {
  if (!name) return "";
  return values[name] ?? "";
}

function asMappedField(id: string | undefined, name: string | undefined, label: string | undefined, type: string, value: unknown, selectedObject: unknown = null): MappedItem {
  return {
    id,
    name,
    label: label || name || id || "Field",
    value,
    type,
    selectedObject,
  };
}

function mapSectionFields(item: DynamicFormItem, values: FormValues): MappedItem[] {
  const section = item.data as Record<string, any>;
  const fields = Array.isArray(section?.fields) ? section.fields : [];
  return fields.flatMap((rawField: any) => {
    const field = rawField?.data ?? rawField;
    if (!field) return [];
    if (field.type === "field_group" && Array.isArray(field.fields)) {
      return field.fields.flatMap((child: any) => {
        const childField = applyFieldRules(child?.data ?? child, values) as any;
        if (childField.hidden === true) return [];
        return asMappedField(`${item.id}_${childField.name}`, childField.name, childField.label, "field", fieldValue(values, childField.name), values[`${childField.name}__selected`] ?? null);
      });
    }
    const ruledField = applyFieldRules(field, values) as any;
    if (ruledField.hidden === true) return [];
    return [asMappedField(`${item.id}_${ruledField.name}`, ruledField.name, ruledField.label, "field", fieldValue(values, ruledField.name), values[`${ruledField.name}__selected`] ?? null)];
  });
}

function mapRowGroup(item: DynamicFormItem, values: FormValues): MappedItem {
  const rowGroup = item.data as DynamicRowGroupSchema & Record<string, any>;
  const id = String(rowGroup?.id || rowGroup?.name || item.id || "rowgroup");
  return {
    id,
    name: id,
    label: rowGroup?.label || rowGroup?.title || "Row Group",
    type: "rowgroup",
    columns: rowGroup?.columns || rowGroup?.fields || rowGroup?.structure?.columns || [],
    rows: Array.isArray(values[id]) ? values[id] as unknown[] : [],
    value: "",
    selectedObject: null,
  };
}

export function mapServiceFormPayload(values: FormValues, schema: DynamicFormSchema): Record<number, MappedItem> {
  const sourceItems = Array.isArray(schema.items) ? schema.items : [];
  const mappedItems = sourceItems.flatMap((item): MappedItem[] => {
    if (!item) return [];
    const data = item.data as Record<string, any> | undefined;
    if (item.type === "field") {
      const field = applyFieldRules({ label: data?.label || "", type: data?.type || "text", ...(data || {}), name: data?.name || item.id }, values) as any;
      if (field.hidden === true) return [];
      const name = field.name || item.id;
      return [asMappedField(item.id, name, field.label, "field", fieldValue(values, name), values[`${name}__selected`] ?? null)];
    }
    if (item.type === "section") return mapSectionFields(item, values);
    if (item.type === "rowgroup") return [mapRowGroup(item, values)];
    if (item.type === "widget" || item.type === "specialfunc") {
      const name = data?.name || item.id;
      return [asMappedField(item.id, name, data?.label || data?.title || "Special Function", "specialfunc", fieldValue(values, name))];
    }
    return [asMappedField(item.id, item.id, item.id, item.type || "field", fieldValue(values, item.id))];
  }).filter((item) => {
    if (item.type === "rowgroup") return Array.isArray(item.rows) && item.rows.length > 0;
    return item.value !== "" && item.value !== undefined && item.value !== null;
  });

  return Object.fromEntries(mappedItems.map((item, index) => [index, item])) as Record<number, MappedItem>;
}
