import { useMemo } from "react";
import { DynamicForm } from "./DynamicForm";
import { FormPresentationEditor } from "./FormPresentationEditor";
import { UnifiedFormStructureBuilder } from "./UnifiedFormStructureBuilder";
import { defaultDynamicFormRegistry } from "./registry";
import type { DynamicFormItem, DynamicFormRegistry, DynamicFormSchema, FormMediaLibraryAdapter } from "./types";

export interface DynamicFormBuilderProps {
  schema: DynamicFormSchema;
  registry?: DynamicFormRegistry;
  allowedFieldTypes?: string[];
  mediaLibrary?: FormMediaLibraryAdapter;
  onChange: (schema: DynamicFormSchema) => void;
}

const schemaItems = (schema: DynamicFormSchema): DynamicFormItem[] => {
  if (Array.isArray(schema.items)) return schema.items;
  let order = 0;
  return [
    ...(schema.fields ?? []).map((field) => ({ id: `field-${field.name}-${order}`, type: "field", order: order++, data: field })),
    ...(schema.sections ?? []).map((section) => ({ id: `section-${order}`, type: "section", order: order++, data: section })),
    ...(schema.widgets ?? []).map((widget) => ({ id: widget.id ?? `widget-${order}`, type: "widget", order: order++, data: widget })),
  ];
};

export const DynamicFormBuilder = ({
  schema,
  registry = defaultDynamicFormRegistry,
  allowedFieldTypes,
  mediaLibrary,
  onChange,
}: DynamicFormBuilderProps) => {
  const items = useMemo(() => schemaItems(schema), [schema]);

  return (
    <div className="hdf-schema-builder">
      <FormPresentationEditor schema={schema} mediaLibrary={mediaLibrary} onChange={onChange} />
      <UnifiedFormStructureBuilder
        items={items}
        registry={registry}
        allowedFieldTypes={allowedFieldTypes}
        mediaLibrary={mediaLibrary}
        renderPreview={(previewItems) => <DynamicForm schema={{ ...schema, items: previewItems, fields: undefined, sections: undefined, widgets: undefined }} registry={registry} onSubmit={() => undefined} />}
        onUpdate={(nextItems) => onChange({
          ...schema,
          items: nextItems,
          fields: undefined,
          sections: undefined,
          widgets: undefined,
        })}
      />
    </div>
  );
};
