import type {
  DynamicFieldSchema,
  DynamicFormItem,
  DynamicFormRegistry,
  DynamicFormSchema,
  DynamicRowGroupSchema,
  DynamicSectionSchema,
  DynamicWidgetSchema,
  FormValues,
} from "./types";
import { applyFieldRules } from "./rules";

export type NormalizedFormNode =
  | { id: string; kind: "field"; field: DynamicFieldSchema }
  | { id: string; kind: "section"; section: DynamicSectionSchema }
  | { id: string; kind: "rowgroup"; rowGroup: DynamicRowGroupSchema }
  | { id: string; kind: "widget"; widget: DynamicWidgetSchema };

const isField = (value: unknown): value is DynamicFieldSchema => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as DynamicFieldSchema;
  return typeof candidate.name === "string" && typeof candidate.type === "string";
};

const normalizeFieldLike = (field: DynamicFieldSchema): DynamicFieldSchema => {
  const candidate = field as any;
  if ((candidate.type === "field" || candidate.type === "textblock") && candidate.data && typeof candidate.data === "object") {
    return {
      ...candidate.data,
      id: candidate.id || candidate.data.id,
      order: candidate.order ?? candidate.data.order,
    } as DynamicFieldSchema;
  }
  return field;
};

const fieldGroupChildren = (field: DynamicFieldSchema): DynamicFieldSchema[] => {
  const normalized = normalizeFieldLike(field);
  if (normalized.type === "field_group" && Array.isArray((normalized as any).fields)) {
    return ((normalized as any).fields as DynamicFieldSchema[]).map(normalizeFieldLike).filter((child) => Boolean(child?.name && child?.type));
  }
  return [normalized];
};

export const normalizeFormSchema = (schema: DynamicFormSchema): NormalizedFormNode[] => {
  if (Array.isArray(schema.items) && schema.items.length > 0) {
    return [...schema.items]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .flatMap((item: DynamicFormItem): NormalizedFormNode[] => {
        if ((item.type === "field" || item.type === "textblock") && isField(item.data)) {
          return [{ id: item.id, kind: "field", field: item.data }];
        }
        if (item.type === "section" && item.data && Array.isArray((item.data as DynamicSectionSchema).fields)) {
          return [{ id: item.id, kind: "section", section: item.data as DynamicSectionSchema }];
        }
        if (item.type === "rowgroup" && item.data) {
          return [{ id: item.id, kind: "rowgroup", rowGroup: item.data as DynamicRowGroupSchema }];
        }
        if (item.type === "widget" && item.data && typeof (item.data as DynamicWidgetSchema).type === "string") {
          return [{ id: item.id, kind: "widget", widget: item.data as DynamicWidgetSchema }];
        }
        return [];
      });
  }

  return [
    ...(schema.fields ?? []).map((field, index): NormalizedFormNode => ({ id: `field-${index}-${field.name}`, kind: "field", field })),
    ...(schema.sections ?? []).map((section, index): NormalizedFormNode => ({ id: `section-${index}`, kind: "section", section })),
    ...(schema.widgets ?? []).map((widget, index): NormalizedFormNode => ({ id: widget.id ?? `widget-${index}`, kind: "widget", widget })),
  ];
};

export const rowGroupColumns = (rowGroup: DynamicRowGroupSchema): Array<DynamicFieldSchema & { key?: string }> => {
  const structured = rowGroup.structure;
  const columns = rowGroup.columns ?? rowGroup.fields ?? structured?.columns ?? [
    structured?.firstColumn,
    structured?.secondColumn,
    structured?.thirdColumn,
  ];
  return columns
    .filter((field): field is DynamicFieldSchema & { key?: string } => Boolean(field))
    .map((field, index) => ({
      ...field,
      key: field.key || field.name || ["firstValue", "secondValue", "thirdValue"][index] || `value${index + 1}`,
      name: field.name || field.key || ["firstValue", "secondValue", "thirdValue"][index] || `value${index + 1}`,
      label: field.label || `Column ${index + 1}`,
      type: field.type || "text",
    }));
};

export const collectFields = (schema: DynamicFormSchema): DynamicFieldSchema[] =>
  normalizeFormSchema(schema).flatMap((node) => {
    if (node.kind === "field") return fieldGroupChildren(node.field);
    if (node.kind === "section") return node.section.fields.flatMap(fieldGroupChildren);
    if (node.kind === "rowgroup" && isField(node.rowGroup.titleField)) return [node.rowGroup.titleField];
    return [];
  });

export const createInitialValues = (schema: DynamicFormSchema, supplied: FormValues = {}): FormValues => {
  const defaults = Object.fromEntries(
    collectFields(schema)
      .filter((field) => field.name)
      .map((field) => [field.name, field.default ?? field.value ?? (field.type === "checkbox" || field.type === "toggle" ? false : "")]),
  );
  return { ...defaults, ...supplied };
};

export const validateFormValues = (
  schema: DynamicFormSchema,
  values: FormValues,
  registry: DynamicFormRegistry,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const nodes = normalizeFormSchema(schema);

  nodes.forEach((node) => {
    if (node.kind === "field") {
      const field = applyFieldRules(node.field, values);
      if ((field as any).hidden === true) return;
      const value = values[field.name];
      const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0)
        || (field.required && field.type === "checkbox" && value !== true);
      if (field.required && empty) {
        errors[field.name] = `${field.label} is required.`;
        return;
      }
      const extensionError = registry.getField(field.type)?.validate?.(value, field, values);
      if (extensionError) errors[field.name] = extensionError;
    } else if (node.kind === "section") {
      const childFields = node.section.fields.flatMap(fieldGroupChildren);
      childFields.forEach((sourceField) => {
        const field = applyFieldRules(sourceField, values);
        if ((field as any).hidden === true) return;
        const value = values[field.name];
        const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0)
          || (field.required && field.type === "checkbox" && value !== true);
        if (field.required && empty) {
          errors[field.name] = `${field.label} is required.`;
          return;
        }
        const extensionError = registry.getField(field.type)?.validate?.(value, field, values);
        if (extensionError) errors[field.name] = extensionError;
      });
    } else if (node.kind === "rowgroup") {
      const rowGroup = node.rowGroup;
      const valueKey = rowGroup.name || rowGroup.id || node.id;
      const rawRows = values[valueKey];
      const rows = Array.isArray(rawRows) ? rawRows as Array<Record<string, unknown>> : (rowGroup.rowGroup ?? []);
      const columns = rowGroupColumns(rowGroup);

      if (isField(rowGroup.titleField)) {
        const titleField = applyFieldRules(rowGroup.titleField, values);
        const titleValue = values[titleField.name];
        if ((titleField as any).hidden !== true && titleField.required && (titleValue == null || String(titleValue).trim() === "")) {
          errors[titleField.name] = `${titleField.label || "Title"} is required.`;
        }
      }

      if (rowGroup.required && rows.length === 0) {
        errors[valueKey] = `${rowGroup.title || rowGroup.label || "Row group"} requires at least one row.`;
        return;
      }

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] || {};
        for (const col of columns) {
          const ruledCol = applyFieldRules(col, { ...values, ...row });
          if ((ruledCol as any).hidden === true) continue;
          const colKey = col.key || col.name;
          const cellValue = row[colKey] ?? (col.name ? row[col.name] : undefined);
          const cellEmpty = cellValue == null || cellValue === "" || (Array.isArray(cellValue) && cellValue.length === 0);
          if (ruledCol.required && cellEmpty) {
            errors[`${valueKey}_${rowIndex}_${colKey}`] = `${ruledCol.label} (Row ${rowIndex + 1}) is required.`;
          }
          const extensionError = registry.getField(ruledCol.type)?.validate?.(cellValue, ruledCol, { ...values, ...row });
          if (extensionError) {
            errors[`${valueKey}_${rowIndex}_${colKey}`] = `${extensionError} (Row ${rowIndex + 1})`;
          }
        }
      }
    }
  });

  return errors;
};
