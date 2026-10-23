import { useMemo, useState, type ReactNode } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { DynamicForm } from "./DynamicForm";
import { defaultDynamicFormRegistry } from "./registry";
import type {
  DynamicFieldSchema,
  DynamicFormItem,
  DynamicFormRegistry,
  DynamicFormSchema,
  DynamicRowGroupSchema,
  DynamicSectionSchema,
  DynamicWidgetSchema,
  FormMediaLibraryAdapter,
  FormOption,
} from "./types";

export interface SharedFieldEditorProps {
  field: DynamicFieldSchema;
  allFields: DynamicFieldSchema[];
  sections: Array<{ id: string; title: string }>;
  registry: DynamicFormRegistry;
  /** Shared creation/inspector policy. Existing unsupported types remain round-trippable. */
  allowedFieldTypes?: string[];
  onSave: (field: DynamicFieldSchema) => void;
  onCancel: () => void;
}

export interface UnifiedFormStructureBuilderProps {
  items: DynamicFormItem[];
  onUpdate: (items: DynamicFormItem[]) => void;
  registry?: DynamicFormRegistry;
  allowedFieldTypes?: string[];
  title?: string;
  description?: string;
  showDatabaseMapping?: boolean;
  databaseMappingMode?: "numbered" | "eav";
  allowRowGroups?: boolean;
  allowSpecialFunctions?: boolean;
  mediaLibrary?: FormMediaLibraryAdapter;
  renderFieldEditor?: (props: SharedFieldEditorProps) => ReactNode;
  renderPreview?: (items: DynamicFormItem[]) => ReactNode;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const isFieldItem = (item: DynamicFormItem) => item.type === "field" || item.type === "textblock";
const sectionData = (item: DynamicFormItem) => item.data as DynamicSectionSchema;

const itemLabel = (item: DynamicFormItem) => {
  if (isFieldItem(item)) {
    const field = item.data as DynamicFieldSchema;
    return field.label || (field as any).title || field.name || item.id;
  }
  if (item.type === "section") return sectionData(item).title;
  return String((item.data as { title?: string }).title ?? item.type);
};

const optionValue = (option: FormOption) =>
  typeof option === "object" ? String(option.value ?? option.id ?? option.label ?? "") : String(option);

const optionLabel = (option: FormOption) =>
  typeof option === "object" ? String(option.label ?? option.value ?? option.id ?? "") : String(option);

const normalizeOrder = (items: DynamicFormItem[]) => items.map((item, order) => ({ ...item, order }));

const GenericFieldEditor = ({ field, allFields, sections, registry, allowedFieldTypes, onSave, onCancel }: SharedFieldEditorProps) => {
  const [draft, setDraft] = useState<DynamicFieldSchema>(() => clone(field));
  const fieldTypes = registry.listFields().filter((entry) => entry.createDefault && (!allowedFieldTypes || allowedFieldTypes.includes(entry.type)));
  const retainCurrentType = !fieldTypes.some((entry) => entry.type === draft.type);
  const hasOptions = ["select", "search-select", "radio"].includes(draft.type);
  const Inspector = registry.getField(draft.type)?.inspector;

  const patch = (next: Partial<DynamicFieldSchema>) => setDraft((current) => ({ ...current, ...next }));
  const updateOptions = (value: string) => {
    const current = draft.options ?? [];
    const next = value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
      const old = current[index];
      return typeof old === "object" ? { ...old, label: line, value: old.value ?? line } : line;
    });
    patch({ options: next });
  };
  const updateOptionImage = (index: number, image: string) => {
    const options = [...(draft.options ?? [])];
    const current = options[index];
    if (typeof current === "object") {
      options[index] = { ...current, image };
    } else {
      options[index] = { label: String(current ?? ""), value: String(current ?? ""), image };
    }
    patch({ options });
  };
  const updateScaleMarker = (index: number, next: Partial<NonNullable<DynamicFieldSchema["scaleMarkers"]>[number]>) => {
    const markers = [...(draft.scaleMarkers ?? [])];
    markers[index] = { ...markers[index], ...next };
    patch({ scaleMarkers: markers });
  };
  const addScaleMarker = () => patch({ scaleMarkers: [...(draft.scaleMarkers ?? []), { value: "", image: "", alt: "" }] });
  const removeScaleMarker = (index: number) => patch({ scaleMarkers: (draft.scaleMarkers ?? []).filter((_, markerIndex) => markerIndex !== index) });

  return (
    <div className="hdf-accordion-editor">
      <div className="hdf-editor-grid">
        <label>Label<input value={draft.label} onChange={(event) => patch({ label: event.target.value })} /></label>
        <label>Backend name<input value={draft.name} onChange={(event) => patch({ name: slugify(event.target.value) })} /></label>
        <label>Field type<select value={draft.type} onChange={(event) => patch({ type: event.target.value })}>{retainCurrentType && <option value={draft.type} disabled>{registry.getField(draft.type)?.label ?? draft.type} (existing)</option>}{fieldTypes.map((entry) => <option key={entry.type} value={entry.type}>{entry.label}</option>)}</select></label>
        <label>Column span<select value={draft.columnSpan ?? 1} onChange={(event) => patch({ columnSpan: Number(event.target.value) as 1 | 2 | 3 })}><option value="1">1 column</option><option value="2">2 columns</option><option value="3">3 columns</option></select></label>
        <label className="hdf-editor-wide">Placeholder<input value={draft.placeholder ?? ""} onChange={(event) => patch({ placeholder: event.target.value })} /></label>
        <label>Question number<input value={draft.questionNumber ?? ""} onChange={(event) => patch({ questionNumber: event.target.value || undefined })} /></label>
        <label>Choice layout<select value={draft.choiceLayout ?? "vertical"} onChange={(event) => patch({ choiceLayout: event.target.value as DynamicFieldSchema["choiceLayout"] })}><option value="vertical">Vertical</option><option value="inline">Inline</option><option value="grid">Grid</option><option value="scale">Scale</option></select></label>
        <label className="hdf-editor-wide">Instruction<input value={draft.instruction ?? ""} onChange={(event) => patch({ instruction: event.target.value || undefined })} /></label>
        {hasOptions && <label className="hdf-editor-wide">System variable<input value={draft.systemVariable ?? ""} placeholder="${allCountries}" onChange={(event) => patch({ systemVariable: event.target.value.trim() || undefined })} /></label>}
        <label>Depends on<select value={draft.dependsOn ?? ""} onChange={(event) => patch({ dependsOn: event.target.value || undefined })}><option value="">No dependency</option>{allFields.filter((candidate) => candidate.name !== draft.name).map((candidate) => <option key={candidate.name} value={candidate.name}>{candidate.label}</option>)}</select></label>
        <label className="hdf-check"><input type="checkbox" checked={Boolean(draft.required)} onChange={(event) => patch({ required: event.target.checked })} /> Required</label>
        {(draft.type === "file" || draft.type === "upload_file") && <label className="hdf-editor-wide">Accepted file types<input value={Array.isArray(draft.accept) ? draft.accept.join(",") : draft.accept ?? ".jpg,.jpeg,.png,.webp,.pdf"} onChange={(event) => patch({ accept: event.target.value })} placeholder=".jpg,.png,.pdf" /></label>}
        {(draft.type === "file" || draft.type === "upload_file") && <label className="hdf-check"><input type="checkbox" checked={Boolean(draft.multiple)} onChange={(event) => patch({ multiple: event.target.checked })} /> Allow multiple files</label>}
        {hasOptions && <label className="hdf-editor-wide">Options, one per line<textarea value={(draft.options ?? []).map(optionLabel).join("\n")} onChange={(event) => updateOptions(event.target.value)} /></label>}
      </div>
      {hasOptions && (
        <details className="hdf-logic-editor" open={false}>
          <summary>Option images</summary>
          <p>Store each option image as the URL returned by Media Library or API Bridge stream.</p>
          {(draft.options ?? []).map((option, index) => {
            const label = optionLabel(option);
            const image = typeof option === "object" ? String(option.image ?? "") : "";
            return (
              <label key={`${index}-${label}`} className="hdf-editor-wide">
                {label}
                <input
                  value={image}
                  placeholder="https://... or /api/.../stream/..."
                  onChange={(event) => updateOptionImage(index, event.target.value)}
                />
              </label>
            );
          })}
        </details>
      )}
      {hasOptions && draft.choiceLayout === "scale" && (
        <details className="hdf-logic-editor hdf-scale-marker-editor" open>
          <summary>Scale marker images</summary>
          <p>Replace selected scale numbers visually while preserving their original response values.</p>
          {(draft.scaleMarkers ?? []).map((marker, index) => <div className="hdf-scale-marker-row" key={`${index}-${marker.value}`}>
            <label>Value<input value={marker.value} placeholder="1" onChange={(event) => updateScaleMarker(index, { value: event.target.value })} /></label>
            <label>Image URL<input value={marker.image} placeholder="https://... or /image.png" onChange={(event) => updateScaleMarker(index, { image: event.target.value })} /></label>
            <label>Alternative text<input value={marker.alt ?? ""} placeholder="Product shown at this scale value" onChange={(event) => updateScaleMarker(index, { alt: event.target.value })} /></label>
            <button type="button" className="hdf-text-danger" onClick={() => removeScaleMarker(index)}>Remove</button>
          </div>)}
          <button type="button" className="hdf-add-marker" onClick={addScaleMarker}>+ Add marker image</button>
        </details>
      )}
      {hasOptions && sections.length > 0 && (
        <details className="hdf-logic-editor">
          <summary>Answer branching</summary>
          <p>Optionally send an answer directly to another section.</p>
          {(draft.options ?? []).map((option) => {
            const value = optionValue(option);
            return <label key={value}>{optionLabel(option)}<select value={draft.branching?.[value] ?? ""} onChange={(event) => patch({ branching: { ...(draft.branching ?? {}), [value]: event.target.value } })}><option value="">Continue normally</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>;
          })}
        </details>
      )}
      {Inspector && <Inspector field={draft} updateField={patch} />}
      <div className="hdf-editor-actions"><button type="button" className="is-primary" onClick={() => onSave(draft)}>Save changes</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </div>
  );
};

export const UnifiedFormStructureBuilder = ({
  items,
  onUpdate,
  registry = defaultDynamicFormRegistry,
  allowedFieldTypes,
  title = "Unified Form Structure Builder",
  description = "Drag and drop to organize the form. Containers hold child fields and can become focused steps.",
  showDatabaseMapping = true,
  databaseMappingMode = "eav",
  allowRowGroups = true,
  allowSpecialFunctions = false,
  renderFieldEditor,
  renderPreview,
}: UnifiedFormStructureBuilderProps) => {
  const ordered = useMemo(() => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [items]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ordered.filter((item) => item.type === "section").map((item) => item.id)));
  const [editing, setEditing] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const sections = ordered.filter((item) => item.type === "section").map((item) => ({ id: item.id, title: sectionData(item).title }));
  const allFields = ordered.flatMap((item) => isFieldItem(item) ? [item.data as DynamicFieldSchema] : item.type === "section" ? sectionData(item).fields ?? [] : []);
  const fieldCatalog = registry.listFields().filter((entry) => entry.createDefault && (!allowedFieldTypes || allowedFieldTypes.includes(entry.type)));
  const widgetCatalog = registry.listWidgets().filter((entry) => entry.createDefault);

  const emit = (next: DynamicFormItem[]) => onUpdate(normalizeOrder(next));
  const updateItem = (id: string, data: Record<string, unknown>) => emit(ordered.map((item) => item.id === id ? { ...item, data } : item));
  const removeItem = (id: string) => emit(ordered.filter((item) => item.id !== id));
  const duplicateItem = (item: DynamicFormItem) => {
    const copy = clone(item);
    copy.id = uid(item.type);
    if (isFieldItem(copy)) {
      const field = copy.data as DynamicFieldSchema;
      field.label = `${field.label} (Copy)`;
      field.name = `${field.name}_copy_${Date.now()}`;
    } else if (copy.type === "section") {
      const section = sectionData(copy);
      section.title = `${section.title} (Copy)`;
      section.fields = section.fields.map((field) => ({ ...field, name: `${field.name}_copy_${Date.now()}` }));
    }
    emit([...ordered, copy]);
  };

  const addField = (type = "text", sectionId?: string) => {
    const extension = fieldCatalog.find((entry) => entry.type === type) ?? fieldCatalog[0];
    if (!extension) return;
    const field = extension?.createDefault?.() ?? { type, name: `${type}_${Date.now()}`, label: extension?.label ?? "New Field" };
    field.columnSpan ??= 1;
    if (sectionId) {
      emit(ordered.map((item) => item.id === sectionId ? { ...item, data: { ...sectionData(item), fields: [...(sectionData(item).fields ?? []), field] } } : item));
      setExpanded((current) => new Set(current).add(sectionId));
      setEditing(`section:${sectionId}:${(ordered.find((item) => item.id === sectionId)?.data as DynamicSectionSchema).fields.length}`);
      return;
    }
    const next = { id: uid("field"), type: "field", order: ordered.length, data: field } satisfies DynamicFormItem;
    emit([...ordered, next]);
    setEditing(`root:${next.id}`);
  };

  const addSection = () => {
    const item = { id: uid("section"), type: "section", order: ordered.length, data: { title: `Section ${sections.length + 1}`, description: "", fields: [], defaultOpen: true, focusMode: false } } satisfies DynamicFormItem;
    emit([...ordered, item]);
    setExpanded((current) => new Set(current).add(item.id));
    setEditing(`root:${item.id}`);
  };

  const addRowGroup = () => emit([...ordered, { id: uid("rowgroup"), type: "rowgroup", order: ordered.length, data: { title: "New Row Group", maxRows: 10, isStructuredInput: true } }]);
  const addSpecial = () => emit([...ordered, { id: uid("specialfunc"), type: "specialfunc", order: ordered.length, data: { title: "Special Function", element_type: "cms_content" } }]);
  const addWidget = (type: string) => {
    const extension = registry.getWidget(type);
    const widget = extension?.createDefault?.() ?? { type, title: extension?.label ?? type, settings: {} };
    emit([...ordered, { id: uid("widget"), type: "widget", order: ordered.length, data: widget }]);
  };

  const updateSectionField = (sectionId: string, index: number, field: DynamicFieldSchema) => emit(ordered.map((item) => {
    if (item.id !== sectionId || item.type !== "section") return item;
    const fields = [...(sectionData(item).fields ?? [])];
    fields[index] = field;
    return { ...item, data: { ...sectionData(item), fields } };
  }));

  const removeSectionField = (sectionId: string, index: number) => emit(ordered.map((item) => item.id === sectionId ? { ...item, data: { ...sectionData(item), fields: sectionData(item).fields.filter((_, fieldIndex) => fieldIndex !== index) } } : item));
  const duplicateSectionField = (sectionId: string, index: number) => emit(ordered.map((item) => {
    if (item.id !== sectionId) return item;
    const fields = [...sectionData(item).fields];
    const copy = clone(fields[index]);
    copy.label = `${copy.label} (Copy)`;
    copy.name = `${copy.name}_copy_${Date.now()}`;
    fields.splice(index + 1, 0, copy);
    return { ...item, data: { ...sectionData(item), fields } };
  }));

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return;
    if (source.droppableId === "root" && destination.droppableId === "root") {
      const next = [...ordered];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      emit(next);
      return;
    }

    let movedField: DynamicFieldSchema | undefined;
    let next = [...ordered];
    if (source.droppableId === "root") {
      const sourceItem = next[source.index];
      if (!sourceItem || !isFieldItem(sourceItem)) return;
      movedField = sourceItem.data as DynamicFieldSchema;
      next.splice(source.index, 1);
    } else if (source.droppableId.startsWith("section:")) {
      const sourceId = source.droppableId.slice(8);
      next = next.map((item) => {
        if (item.id !== sourceId) return item;
        const fields = [...sectionData(item).fields];
        [movedField] = fields.splice(source.index, 1);
        return { ...item, data: { ...sectionData(item), fields } };
      });
    }
    if (!movedField) return;

    if (destination.droppableId === "root") {
      next.splice(destination.index, 0, { id: uid("field"), type: "field", order: destination.index, data: movedField });
    } else {
      const destinationId = destination.droppableId.slice(8);
      next = next.map((item) => {
        if (item.id !== destinationId) return item;
        const fields = [...sectionData(item).fields];
        fields.splice(destination.index, 0, movedField as DynamicFieldSchema);
        return { ...item, data: { ...sectionData(item), fields } };
      });
    }
    emit(next);
  };

  const renderEditor = (key: string, field: DynamicFieldSchema, save: (field: DynamicFieldSchema) => void) => editing === key && (
    renderFieldEditor?.({ field, allFields, sections, registry, allowedFieldTypes, onSave: (next) => { save(next); setEditing(null); }, onCancel: () => setEditing(null) })
    ?? <GenericFieldEditor field={field} allFields={allFields} sections={sections} registry={registry} allowedFieldTypes={allowedFieldTypes} onSave={(next) => { save(next); setEditing(null); }} onCancel={() => setEditing(null)} />
  );

  let dbIndex = 0;
  const mappingRows = ordered.flatMap((item) => {
    if (isFieldItem(item)) return [{ id: item.id, field: item.data as DynamicFieldSchema, index: ++dbIndex }];
    if (item.type === "section") return sectionData(item).fields.map((field, index) => ({ id: `${item.id}-${index}`, field, index: ++dbIndex }));
    return [];
  });

  const defaultPreview = <DynamicForm schema={{ title: "Form preview", items: ordered, submit: { label: "Submit response" } }} registry={registry} onSubmit={() => undefined} />;

  return (
    <div className="hdf-unified-builder">
      <header className="hdf-builder-command">
        <div><h2>{title}</h2><p>{description}</p></div>
        <div className="hdf-command-actions">
          <button type="button" onClick={() => setShowPreview((current) => !current)}>{showPreview ? "Hide Preview" : "Show Preview"}</button>
          <button type="button" className="is-primary" onClick={() => addField("text")}>+ Field</button>
          <button type="button" onClick={addSection}>+ Container</button>
          {allowRowGroups && <button type="button" onClick={addRowGroup}>+ Row Group</button>}
          {widgetCatalog.length > 0 && <select className="hdf-add-widget" defaultValue="" onChange={(event) => { if (event.target.value) addWidget(event.target.value); event.currentTarget.value = ""; }}><option value="" disabled>+ Widget add-on</option>{widgetCatalog.map((entry) => <option key={entry.type} value={entry.type}>{entry.label ?? entry.type}</option>)}</select>}
          {allowSpecialFunctions && <button type="button" onClick={addSpecial}>+ Special Function</button>}
        </div>
      </header>

      {showPreview && <section className="hdf-builder-preview"><div className="hdf-section-title"><div><h3>Live Form Preview</h3><p>Exactly how the form structure and section steps will be rendered.</p></div></div>{renderPreview?.(ordered) ?? defaultPreview}</section>}

      {showDatabaseMapping && <section className="hdf-mapping-preview"><div className="hdf-section-title"><div><h3>Database Mapping Preview</h3><p>{databaseMappingMode === "numbered" ? "Fields map to HOTS numbered EAV columns." : "Fields are stored as EAV response details and immutable JSON snapshots."}</p></div><span>{mappingRows.length} fields</span></div><div className="hdf-mapping-grid">{mappingRows.map(({ id, field, index }) => <div key={id} className={`hdf-map-field hdf-span-${field.columnSpan ?? 1}`}><strong>{field.label}</strong><code>{databaseMappingMode === "numbered" ? `cstm_col${index} -> lbl_col${index}` : `${field.name} -> ${field.label}`}</code><small>Span: {field.columnSpan ?? 1} column{(field.columnSpan ?? 1) > 1 ? "s" : ""}</small></div>)}</div></section>}

      <section className="hdf-structure-shell">
        <div className="hdf-section-title"><div><h3>Unified Structure ({ordered.length} elements)</h3><p>Drag to reorder, or drop a field inside an expanded container.</p></div><span>Hierarchy ready</span></div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="root" type="FORM_ITEM">
            {(provided, snapshot) => <div ref={provided.innerRef} {...provided.droppableProps} className={`hdf-root-drop ${snapshot.isDraggingOver ? "is-over" : ""}`}>
              {ordered.map((item, index) => <Draggable key={item.id} draggableId={item.id} index={index}>{(dragProvided, dragSnapshot) => {
                const field = isFieldItem(item) ? item.data as DynamicFieldSchema : undefined;
                const section = item.type === "section" ? sectionData(item) : undefined;
                const isExpanded = expanded.has(item.id);
                return <article ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={`hdf-structure-item is-${item.type} ${dragSnapshot.isDragging ? "is-dragging" : ""}`}>
                  <div className="hdf-item-summary">
                    <button type="button" className="hdf-drag-handle" {...dragProvided.dragHandleProps} aria-label={`Drag ${itemLabel(item)}`}>⋮⋮</button>
                    {section && <button type="button" className="hdf-expand" onClick={() => setExpanded((current) => { const next = new Set(current); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })}>{isExpanded ? "▾" : "▸"}</button>}
                    <div className="hdf-item-copy"><strong>{itemLabel(item)}</strong><span>{section ? `Container - ${section.fields.length} children${section.focusMode ? " - Focus step" : ""}` : field ? `Field - ${field.type}` : item.type}</span>{field && <code>DB: {field.name} | Span: {field.columnSpan ?? 1}</code>}</div>
                    <div className="hdf-item-actions"><button type="button" onClick={() => duplicateItem(item)} title="Duplicate">Copy</button><button type="button" onClick={() => setEditing((current) => current === `root:${item.id}` ? null : `root:${item.id}`)}>{editing === `root:${item.id}` ? "Close" : "Edit"}</button><button type="button" className="is-danger" onClick={() => removeItem(item.id)}>Delete</button></div>
                  </div>
                  {field && renderEditor(`root:${item.id}`, field, (next) => updateItem(item.id, next))}
                  {section && editing === `root:${item.id}` && <div className="hdf-accordion-editor"><div className="hdf-editor-grid"><label>Container title<input value={section.title} onChange={(event) => updateItem(item.id, { ...section, title: event.target.value })} /></label><label>After this container<select value={section.nextSectionId ?? ""} disabled={Boolean(section.endsFlow)} onChange={(event) => updateItem(item.id, { ...section, nextSectionId: event.target.value || undefined })}><option value="">Continue normally</option>{sections.filter((candidate) => candidate.id !== item.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></label><label className="hdf-editor-wide">Description<textarea value={section.description ?? ""} onChange={(event) => updateItem(item.id, { ...section, description: event.target.value })} /></label><label className="hdf-check"><input type="checkbox" checked={Boolean(section.focusMode)} onChange={(event) => updateItem(item.id, { ...section, focusMode: event.target.checked })} /> Focus view with Next/Back navigation</label><label className="hdf-check"><input type="checkbox" checked={Boolean(section.endsFlow)} onChange={(event) => updateItem(item.id, { ...section, endsFlow: event.target.checked, nextSectionId: event.target.checked ? undefined : section.nextSectionId })} /> End form after this container</label><label className="hdf-check"><input type="checkbox" checked={Boolean(section.hideHeading)} onChange={(event) => updateItem(item.id, { ...section, hideHeading: event.target.checked })} /> Hide container heading from respondents</label><label className="hdf-check"><input type="checkbox" checked={Boolean(section.hideQuestionNumbers)} onChange={(event) => updateItem(item.id, { ...section, hideQuestionNumbers: event.target.checked })} /> Hide question numbers inside this container</label><label className="hdf-check"><input type="checkbox" checked={section.defaultOpen !== false} onChange={(event) => updateItem(item.id, { ...section, defaultOpen: event.target.checked })} /> Expanded by default</label></div></div>}
                  {section && isExpanded && <div className="hdf-container-body"><div className="hdf-container-toolbar"><span>Children</span><select defaultValue="text" onChange={(event) => { addField(event.target.value, item.id); event.currentTarget.value = "text"; }}>{fieldCatalog.map((entry) => <option key={entry.type} value={entry.type}>Add {entry.label}</option>)}</select><button type="button" onClick={() => addField("text", item.id)}>+ Add child</button></div><Droppable droppableId={`section:${item.id}`} type="FORM_ITEM">{(childProvided, childSnapshot) => <div ref={childProvided.innerRef} {...childProvided.droppableProps} className={`hdf-child-drop ${childSnapshot.isDraggingOver ? "is-over" : ""}`}>{section.fields.map((child, childIndex) => { const childKey = `section:${item.id}:${childIndex}`; const childLabel = child.label || (child as any).title || child.name || `Child ${childIndex + 1}`; return <Draggable key={`${child.name || childLabel}-${childIndex}`} draggableId={`${item.id}:${child.name || childLabel}:${childIndex}`} index={childIndex}>{(childDragProvided) => <div ref={childDragProvided.innerRef} {...childDragProvided.draggableProps} className="hdf-child-item"><div className="hdf-item-summary"><button type="button" className="hdf-drag-handle" {...childDragProvided.dragHandleProps}>⋮⋮</button><div className="hdf-item-copy"><strong>{childLabel}</strong><span>Child field - {child.type}</span><code>{child.name || (child as any).id || "field_group"} | Span: {child.columnSpan ?? 1}</code></div><div className="hdf-item-actions"><button type="button" onClick={() => duplicateSectionField(item.id, childIndex)}>Copy</button><button type="button" onClick={() => setEditing((current) => current === childKey ? null : childKey)}>{editing === childKey ? "Close" : "Edit"}</button><button type="button" className="is-danger" onClick={() => removeSectionField(item.id, childIndex)}>Delete</button></div></div>{renderEditor(childKey, child, (next) => updateSectionField(item.id, childIndex, next))}</div>}</Draggable>; })}{childProvided.placeholder}{section.fields.length === 0 && <p className="hdf-drop-hint">Drop a field here or add the first child.</p>}</div>}</Droppable></div>}
                  {item.type === "rowgroup" && editing === `root:${item.id}` && (() => { const row = item.data as DynamicRowGroupSchema; return <div className="hdf-accordion-editor"><div className="hdf-editor-grid"><label>Title<input value={row.title ?? ""} onChange={(event) => updateItem(item.id, { ...row, title: event.target.value })} /></label><label>Maximum rows<input type="number" min="1" max="100" value={row.maxRows ?? 10} onChange={(event) => updateItem(item.id, { ...row, maxRows: Number(event.target.value) || 10 })} /></label></div></div>; })()}
                  {item.type === "widget" && editing === `root:${item.id}` && (() => { const widget = item.data as DynamicWidgetSchema; const WidgetInspector = registry.getWidget(widget.type)?.inspector; return <div className="hdf-accordion-editor"><div className="hdf-editor-grid"><label>Widget title<input value={widget.title ?? ""} onChange={(event) => updateItem(item.id, { ...widget, title: event.target.value })} /></label><label>Widget type<input value={widget.type} readOnly /></label></div>{WidgetInspector && <WidgetInspector widget={widget} updateWidget={(next) => updateItem(item.id, { ...widget, ...next })} />}</div>; })()}
                </article>;
              }}</Draggable>)}
              {provided.placeholder}
              {ordered.length === 0 && <div className="hdf-empty-structure"><strong>No form elements yet</strong><p>Add a field or container to start.</p><button type="button" className="is-primary" onClick={() => addField("text")}>+ Add first field</button></div>}
            </div>}
          </Droppable>
        </DragDropContext>
      </section>
    </div>
  );
};
