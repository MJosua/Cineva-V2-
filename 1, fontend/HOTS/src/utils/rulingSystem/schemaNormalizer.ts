// src/utils/schemaNormalizer.ts
export interface NormalizedField {
    id: string;
    type: "field";
    scope: "global" | "row" | "cross";
    label?: string;
    rowGroup?: string | null;
    groupColumn?: string;
  }
  
  export interface NormalizedGroup {
    id: string;
    type: "rowgroup";
    title: string;
    children: string[];
  }
  
  export interface NormalizedSchema {
    fields: NormalizedField[];
    groups: NormalizedGroup[];
    fieldMap: Record<string, NormalizedField>;
  }
  
  export function normalizeSchema(editorSchema: any): NormalizedSchema {
    const normalized: NormalizedSchema = {
      fields: [],
      groups: [],
      fieldMap: {},
    };
  
    for (const item of editorSchema.items || []) {
      if (item.type === "field") {
        const field = {
          id: item.data.name,
          type: "field",
          scope: "global",
          label: item.data.label || item.data.name,
          rowGroup: null,
        };
        normalized.fields.push(field);
        normalized.fieldMap[field.id] = field;
      }
  
      if (item.type === "rowgroup") {
        const groupId = item.id || item.data.title.replace(/\s+/g, "_").toLowerCase();
        const groupDef = {
          id: groupId,
          type: "rowgroup",
          title: item.data.title,
          children: [],
        };
  
        const structure = item.data.structure || {};
        Object.entries(structure).forEach(([columnKey, subField]) => {
          const fieldId = subField.name;
          const field = {
            id: fieldId,
            type: "field",
            scope: "row",
            label: subField.label || fieldId,
            rowGroup: groupId,
            groupColumn: columnKey,
          };
          normalized.fields.push(field);
          normalized.fieldMap[fieldId] = field;
          groupDef.children.push(fieldId);
        });
  
        normalized.groups.push(groupDef);
      }
    }
  
    return normalized;
  }
  