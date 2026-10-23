import type {
  DynamicFieldSchema,
  DynamicFormItem,
  DynamicFormSchema,
  DynamicRowGroupSchema,
  DynamicSectionSchema,
  DynamicWidgetSchema,
} from "@hots/dynamic-form";
import type { ServiceFormService } from "./types";

const parseJson = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asField = (value: unknown): DynamicFieldSchema | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if ((candidate.type === "field" || candidate.type === "textblock") && candidate.data && typeof candidate.data === "object") {
    const unwrapped = asField(candidate.data);
    if (!unwrapped) return null;
    return {
      ...unwrapped,
      id: String(candidate.id || (unwrapped as any).id || unwrapped.name),
      order: candidate.order ?? (unwrapped as any).order,
    } as DynamicFieldSchema;
  }
  if (candidate.type === "field_group") {
    const fields = Array.isArray(candidate.fields) ? candidate.fields.map(asField).filter(Boolean) : [];
    return {
      ...candidate,
      name: String(candidate.name || candidate.id || candidate.label || "field_group"),
      type: "field_group",
      label: String(candidate.label || candidate.title || ""),
      fields,
    } as DynamicFieldSchema;
  }
  const name = String(candidate.name || candidate.key || candidate.id || "");
  const type = String(candidate.type || candidate.fieldType || "text");
  const label = String(candidate.label || candidate.title || candidate.prompt || name || "Field");
  if (!name) return null;
  return { ...candidate, name, type, label } as DynamicFieldSchema;
};

const asSection = (value: unknown): DynamicSectionSchema | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const fields = Array.isArray(candidate.fields) ? candidate.fields.map(asField).filter(Boolean) as DynamicFieldSchema[] : [];
  return {
    ...candidate,
    title: String(candidate.title || candidate.label || "Section"),
    description: candidate.description ? String(candidate.description) : undefined,
    fields,
  } as DynamicSectionSchema;
};

const asRowGroup = (value: unknown): DynamicRowGroupSchema | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  return {
    ...candidate,
    id: String(candidate.id || candidate.name || ""),
    name: String(candidate.name || candidate.id || ""),
    title: String(candidate.title || candidate.label || "Row group"),
    maxRows: Number(candidate.maxRows || candidate.max_rows || 100),
  } as DynamicRowGroupSchema;
};

const asWidget = (value: unknown): DynamicWidgetSchema | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const type = String(candidate.type || candidate.addonType || candidate.component || "");
  if (!type) return null;
  return { ...candidate, type } as DynamicWidgetSchema;
};

export function normalizeServiceFormConfig(service: ServiceFormService): DynamicFormSchema {
  const raw = parseJson(service.form_json) as Record<string, unknown> | null;
  if (!raw) {
    return {
      title: service.service_name || "Service form",
      description: "Please provide the required information.",
      fields: [
        { name: "subject", label: "Subject", type: "text", required: true, columnSpan: 3 },
        { name: "description", label: "Description", type: "textarea", required: true, columnSpan: 3 },
      ],
    };
  }

  if (Array.isArray(raw.items)) {
    const items = raw.items.map((item, index) => {
      const source = item as DynamicFormItem;
      if (source.type === "field" || source.type === "textblock") return { ...source, data: asField(source.data) || source.data };
      if (source.type === "section") return { ...source, data: asSection(source.data) || source.data };
      if (source.type === "rowgroup") return { ...source, data: asRowGroup(source.data) || source.data };
      if (source.type === "widget" || source.type === "specialfunc") return { ...source, type: "widget", data: asWidget(source.data) || source.data };
      return { ...source, order: source.order ?? index };
    });
    return {
      ...raw,
      title: String(raw.title || service.service_name || "Service form"),
      description: raw.description ? String(raw.description) : undefined,
      items,
    } as DynamicFormSchema;
  }

  return {
    ...raw,
    title: String(raw.title || service.service_name || "Service form"),
    description: raw.description ? String(raw.description) : undefined,
    fields: Array.isArray(raw.fields) ? raw.fields.map(asField).filter(Boolean) as DynamicFieldSchema[] : undefined,
    sections: Array.isArray(raw.sections) ? raw.sections.map(asSection).filter(Boolean) as DynamicSectionSchema[] : undefined,
    widgets: Array.isArray(raw.widgets) ? raw.widgets.map(asWidget).filter(Boolean) as DynamicWidgetSchema[] : undefined,
  } as DynamicFormSchema;
}
