import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, FormSection, RowGroup } from '@/types/formTypes';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Edit3, Package, ChevronDown, ChevronUp, Link, Save, X, Settings, HelpCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import { FormLayoutPreview } from './FormLayoutPreview';
import { RowGroupConfigurator } from './RowGroupConfigurator';
import { UnifiedFormDemo } from './UnifiedFormDemo';

export interface FormStructureItem {
  id: string;
  type: 'field' | 'section' | 'rowgroup';
  order: number;
  data: FormField | FormSection | RowGroup;
}

interface UnifiedFormStructureEditorProps {
  items: FormStructureItem[];
  onUpdate: (items: FormStructureItem[]) => void;
}

export const UnifiedFormStructureEditor: React.FC<UnifiedFormStructureEditorProps> = ({
  items,
  onUpdate,
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);
  const [configuringRowGroup, setConfiguringRowGroup] = useState<string | null>(null);
  const [showChainLinkHelper, setShowChainLinkHelper] = useState(false);


  const addItem = (type: 'field' | 'section' | 'rowgroup' | 'specialfunc') => {
    let newItem: FormStructureItem;

    switch (type) {
      case 'field':
        newItem = {
          id: `field-${Date.now()}`,
          type: 'field',
          order: items.length,
          data: {
            label: 'New Field',
            name: `field_${Date.now()}`,
            type: 'text',
            required: false,
            columnSpan: 1
          }
        };
        break;
      case 'section':
        newItem = {
          id: `section-${Date.now()}`,
          type: 'section',
          order: items.length,
          data: {
            title: 'New Section',
            description: '',
            fields: [],
            repeatable: false,
            defaultOpen: true
          }
        };
        break;
      case 'rowgroup':
        newItem = {
          id: `rowgroup-${Date.now()}`,
          type: 'rowgroup',
          order: items.length,
          data: {
            title: 'New Row Group',
            isStructuredInput: false,
            rowGroup: [],
            maxRows: 10
          }
        };
        break;

      case 'specialfunc':
        newItem = {
          id: `specialfunc-${Date.now()}`,
          type: 'specialfunc',
          order: items.length,
          data: {
            title: 'New function',
            function_id: '',
          }
        };
        break;
    }

    onUpdate([...items, newItem]);
  };

  const cloneItem = (item: FormStructureItem) => {
    const clonedItem: FormStructureItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      order: items.length,
      data: { ...item.data }
    };

    if (item.type === "section") {
      const sectionData = item.data as FormSection;
      clonedItem.data = {
        ...sectionData,
        title: `${sectionData.title} (Copy)`,
        fields: sectionData.fields
          ? sectionData.fields.map((f) => ({
            ...f,
            name: `${f.name}_${Date.now()}_${uuidv4()}`, // ensure unique
            label: `${f.label} (Copy)`, // optional
          }))
          : [],
      };
    } else if (item.type === 'field') {
      const fieldData = item.data as FormField;
      clonedItem.data = {
        ...fieldData,
        label: `${fieldData.label} (Copy)`,
        name: `${fieldData.name}_copy_${Date.now()}`
      };
    } else if (item.type === 'rowgroup') {
      const rowGroupData = item.data as RowGroup;
      clonedItem.data = {
        ...rowGroupData,
        title: `${rowGroupData.title || 'Row Group'} (Copy)`
      };
    } else if (item.type === 'specialfunc') {
      const specialfunc = item.data as specialfunc;
      clonedItem.data = {
        ...specialfunc,
        title: `${specialfunc.title || 'function'} (Copy)`
      };
    }

    onUpdate([...items, clonedItem]);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    onUpdate(newItems);
  };

  const updateItem = (id: string, newData: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, data: newData };
      }
      return item;
    });
    onUpdate(newItems);
  };

  const addFieldToSection = (sectionId: string) => {
    const newField: FormField = {
      label: 'New Field',
      name: `field_${Date.now()}`,
      type: 'text',
      required: false,
      columnSpan: 1
    };

    const newItems = items.map(item => {
      if (item.id === sectionId && item.type === 'section') {
        const sectionData = item.data as FormSection;
        return {
          ...item,
          data: {
            ...sectionData,
            fields: [...(sectionData.fields || []), newField]
          }
        };
      }
      return item;
    });
    onUpdate(newItems);
  };

  const updateSectionField = (sectionId: string, fieldIndex: number, updatedField: FormField) => {
    const newItems = items.map(item => {
      if (item.id === sectionId && item.type === 'section') {
        const sectionData = item.data as FormSection;
        const updatedFields = [...(sectionData.fields || [])];
        updatedFields[fieldIndex] = updatedField;
        return {
          ...item,
          data: {
            ...sectionData,
            fields: updatedFields
          }
        };
      }
      return item;
    });
    onUpdate(newItems);
  };

  const removeSectionField = (sectionId: string, fieldIndex: number) => {
    const newItems = items.map(item => {
      if (item.id === sectionId && item.type === 'section') {
        const sectionData = item.data as FormSection;
        const updatedFields = sectionData.fields?.filter((_, i) => i !== fieldIndex) || [];
        return {
          ...item,
          data: {
            ...sectionData,
            fields: updatedFields
          }
        };
      }
      return item;
    });
    onUpdate(newItems);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Case 1: reorder items in main structure
    if (source.droppableId === 'unified-structure' && destination.droppableId === 'unified-structure') {
      const newItems = [...items];
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);

      newItems.forEach((item, index) => {
        item.order = index;
      });

      onUpdate(newItems);
      return;
    }

    // Case 2: moving within same section
    if (source.droppableId.startsWith('section-') && destination.droppableId.startsWith('section-')) {
      const sourceSectionId = source.droppableId.replace('section-', '');
      const destSectionId = destination.droppableId.replace('section-', '');

      // same section reordering
      if (sourceSectionId === destSectionId) {
        const section = items.find(i => i.id === sourceSectionId);
        if (section && section.type === 'section') {
          const sectionData = section.data as FormSection;
          const fields = [...(sectionData.fields || [])];
          const [movedField] = fields.splice(source.index, 1);
          fields.splice(destination.index, 0, movedField);

          const updatedItems = items.map(i =>
            i.id === section.id ? { ...i, data: { ...sectionData, fields } } : i
          );

          onUpdate(updatedItems);
        }
        return;
      }

      // moving between two different sections
      const newItems = items.map(i => {
        if (i.id === source.droppableId.replace('section-', '') && i.type === 'section') {
          const sectionData = i.data as FormSection;
          const fields = [...(sectionData.fields || [])];
          fields.splice(source.index, 1);
          return { ...i, data: { ...sectionData, fields } };
        }
        if (i.id === destination.droppableId.replace('section-', '') && i.type === 'section') {
          const sectionData = i.data as FormSection;
          const fields = [...(sectionData.fields || [])];
          const sourceSection = items.find(s => s.id === sourceSectionId)!;
          const movedField = (sourceSection.data as FormSection).fields![source.index];
          fields.splice(destination.index, 0, movedField);
          return { ...i, data: { ...sectionData, fields } };
        }
        return i;
      });

      onUpdate(newItems);
      return;
    }

    // Case 3: moving OUT of a section into main structure
    if (source.droppableId.startsWith('section-') && destination.droppableId === 'unified-structure') {
      const sectionId = source.droppableId.replace('section-', '');
      const section = items.find(i => i.id === sectionId) as FormStructureItem;

      if (section && section.type === 'section') {
        const sectionData = section.data as FormSection;
        const fields = [...(sectionData.fields || [])];
        const [movedField] = fields.splice(source.index, 1);

        const newItems: FormStructureItem[] = items.map(i =>
          i.id === sectionId ? { ...i, data: { ...sectionData, fields } } : i
        );

        const newFieldItem: FormStructureItem = {
          id: `field-${Date.now()}`,
          type: 'field',
          order: destination.index,
          data: movedField,
        };

        newItems.splice(destination.index, 0, newFieldItem);

        newItems.forEach((i, idx) => (i.order = idx));
        onUpdate(newItems);
      }
      return;
    }

    // Case 4: moving INTO a section from main structure
    if (source.droppableId === 'unified-structure' && destination.droppableId.startsWith('section-')) {
      const sourceItem = items[source.index];
      if (sourceItem.type !== 'field') return;

      const destSectionId = destination.droppableId.replace('section-', '');
      const newItems = items.filter((_, idx) => idx !== source.index);

      const destSectionIndex = newItems.findIndex(i => i.id === destSectionId);
      const destSection = newItems[destSectionIndex] as FormStructureItem;
      const sectionData = destSection.data as FormSection;

      const updatedSection: FormStructureItem = {
        ...destSection,
        data: {
          ...sectionData,
          fields: [
            ...(sectionData.fields || []),
            sourceItem.data as FormField
          ]
        }
      };

      newItems[destSectionIndex] = updatedSection;

      newItems.forEach((i, idx) => (i.order = idx));
      onUpdate(newItems);
      return;
    }
  };


  const getAllFields = () => {
    const allFields: FormField[] = [];
    items.forEach(item => {
      if (item.type === 'field') {
        allFields.push(item.data as FormField);
      } else if (item.type === 'section') {
        const sectionData = item.data as FormSection;
        if (sectionData.fields) {
          allFields.push(...sectionData.fields);
        }
      }
    });
    return allFields;
  };

  // Chain Link Helper Component


  const renderUnifiedStructure = () => {
    let dbColumnIndex = 1;

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="unified-structure" type="field">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-3 min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
            >
              {items.map((item, index) => {
                // prepare dbColumnIndex logic
                let currentDbIndex = dbColumnIndex;

                if (item.type === "field") {
                  dbColumnIndex += 1;
                } else if (item.type === "section") {
                  const sectionData = item.data as FormSection;
                  dbColumnIndex += (sectionData.fields?.length || 0) + 1; // +1 for section header
                } else if (item.type === "rowgroup") {
                  dbColumnIndex += 1; // just reserve one column for row group JSON
                } else if (item.type === "specialfunc") {
                  dbColumnIndex += 1; // just reserve one column for row group JSON
                }

                // render inside Draggable
                return (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? "transform rotate-1 z-50 shadow-lg" : ""}`}
                      >
                        {renderUnifiedItem(item, index, currentDbIndex, provided.dragHandleProps)}
                      </div>
                    )}
                  </Draggable>
                );
              })}

              {provided.placeholder}

              {items.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No form elements yet</p>
                  <p className="text-sm mb-4">Start building your unified form structure</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => addItem('field')} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Field
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  const renderUnifiedItem = (item: FormStructureItem, index: number, dbColumnStart: number, dragHandleProps: any) => {
    if (item.type === 'field') {
      const field = item.data as FormField;
      const dbColumn = `cstm_col${dbColumnStart}`;
      const lblColumn = `lbl_col${dbColumnStart}`;

      return (
        <div className="p-4 bg-white border-l-4 border-l-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...dragHandleProps} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-800">{field.label}</span>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Field • {field.type}
                  </div>
                  {field.dependsOn && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      <Link className="w-3 h-3" />
                      Linked to: {field.dependsOn}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  DB: {dbColumn} → {lblColumn} | Span: {field.columnSpan || 1} column{(field.columnSpan || 1) > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cloneItem(item)}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(item.id)}
                className="h-8 px-2"
              >
                {editingItem === item.id ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {editingItem === item.id && (
            <div className="mt-3 p-3 border-t bg-gray-50 rounded-b-lg">
              <FieldEditor
                field={field}
                fields={getAllFields()}
                onUpdate={(updatedField) => {
                  updateItem(item.id, updatedField);
                  setEditingItem(null);
                }}
                onCancel={() => setEditingItem(null)}
              />
            </div>
          )}
        </div>
      );
    } else if (item.type === 'section') {
      const sectionData = item.data as FormSection;
      const isExpanded = expandedSections.has(item.id);
      const sectionDbColumn = `cstm_col${dbColumnStart}`;

      return (
        <div className="p-4 b bg-green-50 border-l-4 border-l-green-500 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-green-800">{sectionData.title}</span>
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Section • {sectionData.fields?.length || 0} fields
                  </div>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  DB: Section starts at {sectionDbColumn}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newExpanded = new Set(expandedSections);
                  if (isExpanded) {
                    newExpanded.delete(item.id);
                  } else {
                    newExpanded.add(item.id);
                  }
                  setExpandedSections(newExpanded);
                }}
                className="h-8 px-2"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cloneItem(item)}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(item.id)}
                className="h-8 px-2"
              >
                {editingItem === item.id ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isExpanded && renderSectionFields(sectionData, item.id, dbColumnStart)}

          {editingItem === item.id && (
            <div className="mt-3 p-3 border-t bg-white rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={sectionData.title}
                    onChange={(e) => updateItem(item.id, { ...sectionData, title: e.target.value })}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={sectionData.description || ''}
                    onChange={(e) => updateItem(item.id, { ...sectionData, description: e.target.value })}
                    placeholder="Optional section description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={sectionData.repeatable || false}
                    onCheckedChange={(checked) => updateItem(item.id, { ...sectionData, repeatable: checked })}
                  />
                  <Label>Repeatable Section</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setEditingItem(null)} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)} size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (item.type === 'rowgroup') {
      const rowGroupData = item.data as RowGroup;
      const dbColumn = `cstm_col${dbColumnStart}`;

      return (
        <div className="p-4 bg-orange-50 border-l-4 border-l-orange-500 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-orange-800">
                    {rowGroupData.title || 'Row Group'}
                  </span>
                  <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Row Group • Max: {rowGroupData.maxRows || 10}
                  </div>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  DB: {dbColumn} (Dynamic Rows JSON)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfiguringRowGroup(item.id)}
                className="h-8 px-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cloneItem(item)}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(item.id)}
                className="h-8 px-2"
              >
                {editingItem === item.id ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {editingItem === item.id && (
            <div className="mt-3 p-3 border-t bg-white rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label>Row Group Title</Label>
                  <Input
                    value={rowGroupData.title || ''}
                    onChange={(e) => updateItem(item.id, { ...rowGroupData, title: e.target.value })}
                    placeholder="Row group title"
                  />
                </div>
                <div>
                  <Label>Maximum Rows</Label>
                  <Input
                    type="number"
                    value={rowGroupData.maxRows || 10}
                    onChange={(e) => updateItem(item.id, { ...rowGroupData, maxRows: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={rowGroupData.isStructuredInput || false}
                    onCheckedChange={(checked) => updateItem(item.id, { ...rowGroupData, isStructuredInput: checked })}
                  />
                  <Label>Structured Input (3-column table)</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setEditingItem(null)} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)} size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (item.type === 'specialfunc') {
      const specialfuncData = item.data as specialfunc;
      const dbColumn = `cstm_col${dbColumnStart}`;

      return (
        <div className="p-4 bg-pink-50 border-l-4 border-l-pink-500 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-pink-800">
                    {specialfuncData.title || 'Special Function'}
                  </span>
                  <div className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                    Row Group • Max: {specialfuncData.maxRows || 10}
                  </div>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  DB: {dbColumn} (Dynamic Rows JSON)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfiguringRowGroup(item.id)}
                className="h-8 px-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cloneItem(item)}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(item.id)}
                className="h-8 px-2"
              >
                {editingItem === item.id ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {editingItem === item.id && (
            <div className="mt-3 p-3 border-t bg-white rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label>Row Group Title</Label>
                  <Input
                    value={specialfuncData.title || ''}
                    onChange={(e) => updateItem(item.id, { ...specialfuncData, title: e.target.value })}
                    placeholder="Row group title"
                  />
                </div>
                <div>
                  <Label>Maximum Rows</Label>
                  <Input
                    type="number"
                    value={specialfuncData.maxRows || 10}
                    onChange={(e) => updateItem(item.id, { ...specialfuncData, maxRows: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={specialfuncData.isStructuredInput || false}
                    onCheckedChange={(checked) => updateItem(item.id, { ...specialfuncData, isStructuredInput: checked })}
                  />
                  <Label>Structured Input (3-column table)</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setEditingItem(null)} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)} size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderSectionFields = (sectionData: FormSection, sectionId: string, dbColumnStart: number) => {
    let fieldDbIndex = dbColumnStart + 1; // Section fields start after section header

    return (
      <Droppable droppableId={`section-${sectionId}`} type="field">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[60px] p-4 rounded-lg border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'border-purple-400 bg-purple-100' : 'border-purple-300 bg-white'
              }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs text-purple-700 font-medium">
                Section Fields ({sectionData.fields?.length || 0})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFieldToSection(sectionId)}
                className="h-7 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Field
              </Button>
            </div>

            {sectionData.fields?.map((field: FormField, index: number) => {
              const currentDbColumn = `cstm_col${fieldDbIndex + index}`;
              const currentLblColumn = `lbl_col${fieldDbIndex + index}`;

              return (
                <Draggable key={`section-field-${index}`} draggableId={`section-field-${sectionId}-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-3 bg-white border rounded-lg shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg border-purple-300 transform rotate-1' : 'border-purple-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{field.label}</span>
                              <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {field.type}
                              </div>
                              {field.dependsOn && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                  <Link className="w-3 h-3" />
                                  → {field.dependsOn}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              DB: {currentDbColumn} → {currentLblColumn}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(`${sectionId}-field-${index}`)}
                            className="h-7 w-7 p-0"
                          >
                            {editingItem === `${sectionId}-field-${index}` ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSectionField(sectionId, index)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {editingItem === `${sectionId}-field-${index}` && (
                        <div className="mt-3 p-3 border-t bg-gray-50 rounded-b-lg">
                          <FieldEditor
                            field={field}
                            fields={getAllFields()}
                            onUpdate={(updatedField) => {
                              updateSectionField(sectionId, index, updatedField);
                              setEditingItem(null);
                            }}
                            onCancel={() => setEditingItem(null)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            {(!sectionData.fields || sectionData.fields.length === 0) && (
              <div className="text-center text-purple-400 text-sm py-6">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Drop fields here or click "Add Field"
              </div>
            )}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between sticky top-[80px] z-30 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-b border shadow-sm">

        <div>
          <h3 className="text-lg font-semibold text-gray-800">Unified Form Structure Builder</h3>
          <p className="text-sm text-gray-600">Drag and drop to organize your form with real-time database mapping</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addItem('field')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Field
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('section')}>
              <Plus className="w-4 h-4 mr-2" />
              Section
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('rowgroup')}>
              <Plus className="w-4 h-4 mr-2" />
              Row Group
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('specialfunc')}>
              <Plus className="w-4 h-4 mr-2" />
              Special Function
            </Button>
          </div>
        </div>
      </div>

      {/* Chain Link Helper */}

      {/* Form Layout Preview */}
      {showPreview && <FormLayoutPreview items={items} onUpdate={onUpdate} />}


      {/* Unified Form Structure Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unified Structure ({items.length} elements)</span>
            <div className="text-sm text-gray-500">
              Drag to reorder • Real-time DB mapping • Chain link ready
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderUnifiedStructure()}
        </CardContent>
      </Card>

      {/* Row Group Configurator */}
      {configuringRowGroup && (
        <RowGroupConfigurator
          field={items.data}
          rowGroup={items.find(item => item.id === configuringRowGroup)?.data as RowGroup}
          onUpdate={(updatedRowGroup) => {
            updateItem(configuringRowGroup, updatedRowGroup);
            setConfiguringRowGroup(null);
          }}
          isOpen={!!configuringRowGroup}
          onOpenChange={(open) => {
            if (!open) setConfiguringRowGroup(null);
          }}
          fields={getAllFields()}

        />
      )}


   
    </div>
  );
};
