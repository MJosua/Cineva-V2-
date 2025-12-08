
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSection, RowGroup, FormStructureItem } from '@/types/formTypes';
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface FormLayoutPreviewProps {
  items: FormStructureItem[];
  onUpdate: (items: FormStructureItem[]) => void;
}

export const FormLayoutPreview: React.FC<FormLayoutPreviewProps> = ({ items, onUpdate }) => {
  const [previewItems, setPreviewItems] = useState<FormStructureItem[]>(items);

  React.useEffect(() => {
    setPreviewItems(items);
  }, [items]);

  const getAllFields = (): { field: FormField; dbColumn: string; dbLabel: string }[] => {
    const allFields: { field: FormField; dbColumn: string; dbLabel: string }[] = [];
    let columnIndex = 1;

    items.forEach(item => {
      if (item.type === 'field') {
        const field = item.data as FormField;
        allFields.push({
          field,
          dbColumn: `cstm_col${columnIndex}`,
          dbLabel: `lbl_col${columnIndex}`
        });
        columnIndex++;
      } else if (item.type === 'section') {
        const sectionData = item.data as FormSection;
        if (sectionData.fields) {
          sectionData.fields.forEach(field => {
            allFields.push({
              field,
              dbColumn: `cstm_col${columnIndex}`,
              dbLabel: `lbl_col${columnIndex}`
            });
            columnIndex++;
          });
        }
      } else if (item.type === 'rowgroup') {
        allFields.push({
          field: { label: 'Row Group', name: 'row_group', type: 'text' } as FormField,
          dbColumn: `cstm_col${columnIndex}`,
          dbLabel: `lbl_col${columnIndex} (Dynamic Rows)`
        });
        columnIndex++;
      }
    });

    return allFields;
  };

  const onPreviewDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newPreviewItems = Array.from(previewItems);
    const [reorderedItem] = newPreviewItems.splice(sourceIndex, 1);
    newPreviewItems.splice(destinationIndex, 0, reorderedItem);

    const reorderedWithOrder = newPreviewItems.map((item, index) => ({
      ...item,
      order: index
    }));

    setPreviewItems(reorderedWithOrder);
    onUpdate(reorderedWithOrder);
  };

  const renderLayoutPreview = () => {
    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          if (item.type === 'field') {
            const field = item.data as FormField;
            const colSpan = field.columnSpan || 1;
            return (
              <div key={item.id} className={`grid grid-cols-3 gap-2`}>
                <div
                  className={`col-span-${colSpan} p-3 bg-blue-50 border border-blue-200 rounded-lg`}
                  style={{ backgroundColor: '#e0f2fe' }}
                >
                  <div className="text-sm font-medium text-blue-800">{field.label}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Span: {colSpan} column{colSpan > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          } else if (item.type === 'section') {
            const sectionData = item.data as FormSection;
            return (
              <div key={item.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-semibold text-purple-800 mb-2">
                  📁 {sectionData.title}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {sectionData.fields?.map((field, fieldIndex) => (
                    <div
                      key={fieldIndex}
                      className={`col-span-${field.columnSpan || 1} p-2 bg-purple-100 border border-purple-300 rounded`}
                    >
                      <div className="text-xs font-medium text-purple-700">{field.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } else if (item.type === 'rowgroup') {
            const rowGroupData = item.data as RowGroup;
            return (
              <div key={item.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-semibold text-orange-800">
                  🗂️ {rowGroupData.title || 'Row Group'}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Max rows: {rowGroupData.maxRows || 10}
                </div>
              </div>
            )
          } else if (item.type === 'specialfunc') {
            const specialfunc = item.data as specialfunc;
            return (
              <div key={item.id} className="p-3 bg-pink-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-semibold text-orange-800">
                  🗂️ {specialfunc.title || 'function'}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Max rows: {specialfunc.maxRows || 10}
                </div>
              </div>
            )
          };
          return null;
        })}
      </div>
    );
  };

  const renderDatabaseMapping = () => {
    const allFields = getAllFields();

    return (
      <div className="space-y-2">
        {allFields.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-800">{item.field.label}</div>
                <div className="text-xs text-gray-500">({item.field.type})</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {item.dbColumn} → {item.dbLabel}
              </div>
              <div className="text-xs text-gray-500 mt-1">Database Columns</div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  const renderDraggablePreview = () => {
    let fieldCounter = 1;

    return (
      <DragDropContext onDragEnd={onPreviewDragEnd}>
        <Droppable droppableId="preview-structure">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {previewItems.map((item, index) => {
                  if (item.type === 'field') {
                    const field = item.data as FormField;
                    const cstmCol = `cstm_col${fieldCounter}`;
                    const lblCol = `lbl_col${fieldCounter}`;
                    fieldCounter++;

                    return (
                      <Draggable key={item.id} draggableId={`preview-${item.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2 bg-blue-100 border border-blue-300 rounded text-xs cursor-move hover:shadow-md transition-shadow ${field.columnSpan === 2 ? 'col-span-2' : field.columnSpan === 3 ? 'col-span-3' : 'col-span-1'
                              }`}
                          >
                            <div className="font-medium text-gray-700">{field.label}</div>
                            <div className="text-blue-600 mt-1">{cstmCol} → {lblCol}</div>
                            <div className="text-xs text-gray-500">Span: {field.columnSpan || 1} column{(field.columnSpan || 1) > 1 ? 's' : ''}</div>
                          </div>
                        )}
                      </Draggable>
                    );
                  } else if (item.type === 'section') {
                    const section = item.data as FormSection;
                    return (
                      <Draggable key={item.id} draggableId={`preview-${item.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="col-span-3 p-3 bg-green-100 border border-green-300 rounded cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium text-sm mb-2 text-gray-700">📁 {section.title}</div>
                            <div className="text-xs text-green-600">Section (spans 3 columns)</div>
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              {section.fields?.map((field, fieldIndex) => {
                                const cstmCol = `cstm_col${fieldCounter}`;
                                const lblCol = `lbl_col${fieldCounter}`;
                                fieldCounter++;
                                return (
                                  <div key={fieldIndex} className={`p-1 bg-green-200 rounded text-xs ${field.columnSpan === 2 ? 'col-span-2' : field.columnSpan === 3 ? 'col-span-3' : 'col-span-1'
                                    }`}>
                                    <span className="font-medium text-gray-700">{field.label}</span>
                                    <div className="text-green-700">{cstmCol} → {lblCol}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  } else if (item.type === 'rowgroup') {
                    const rowGroup = item.data as RowGroup;
                    const cstmCol = `cstm_col${fieldCounter}`;
                    const lblCol = `lbl_col${fieldCounter}`;
                    fieldCounter++;

                    return (
                      <Draggable key={item.id} draggableId={`preview-${item.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="col-span-3 p-2 bg-orange-100 border border-orange-300 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium text-gray-700">🗂️ {rowGroup.title || 'Row Group'}</div>
                            <div className="text-orange-600 mt-1">{cstmCol} → {lblCol} (Dynamic Rows)</div>
                            <div className="text-xs text-gray-500">Max rows: {rowGroup.maxRows || 5}</div>
                          </div>
                        )}
                      </Draggable>
                    );
                  } else if (item.type === 'specialfunc') {
                    const specialfunc = item.data as specialfunc;
                    const cstmCol = `cstm_col${fieldCounter}`;
                    const lblCol = `lbl_col${fieldCounter}`;
                    fieldCounter++;

                    return (
                      <Draggable key={item.id} draggableId={`preview-${item.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="col-span-3 p-2 bg-pink-100 border border-purple-300 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium text-gray-700">🗂️ {specialfunc.title || 'function'}</div>
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                  return null;
                })}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  return (
    <div className="space-y-6">
      {/* <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 text-lg">
            Form Layout Preview
          </CardTitle>
          <p className="text-sm text-green-600">
            Live preview of your form layout
          </p>
        </CardHeader>
        <CardContent>
          {renderLayoutPreview()}
        </CardContent>
      </Card> */}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 text-lg">
            Database Mapping Preview
          </CardTitle>
          <p className="text-sm text-blue-600">
            How fields map to database columns (drag to reorder)
          </p>
        </CardHeader>
        <CardContent>
          {renderDraggablePreview()}
        </CardContent>
      </Card>

      {/* <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-lg">
            Database Column Mapping
          </CardTitle>
          <p className="text-sm text-purple-600">
            Field to database column relationships
          </p>
        </CardHeader>
        <CardContent>
          {renderDatabaseMapping()}
        </CardContent>
      </Card> */}
    </div>
  );
};
