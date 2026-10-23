
import React from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import {
    Type, Hash, Calendar, Upload, List, CheckSquare,
    Layout, Rows, Plus, Table, Code, FileText
} from 'lucide-react';

export const ComponentPalette = () => {
    const components = [
        { type: 'field', label: 'Text Input', icon: Type, dataType: 'text' },
        { type: 'field', label: 'Number', icon: Hash, dataType: 'number' },
        { type: 'field', label: 'Date Picker', icon: Calendar, dataType: 'date' },
        { type: 'field', label: 'File Upload', icon: Upload, dataType: 'file' },
        { type: 'field', label: 'Select / Dropdown', icon: List, dataType: 'select' },
        // Separator
        { type: 'separator', label: 'Layout' },
        { type: 'section', label: 'Section', icon: Layout },
        { type: 'rowgroup', label: 'Row Group (Repeater)', icon: Rows },
        { type: 'textblock', label: 'Instruction Text', icon: FileText, dataType: 'textblock' },
        { type: 'specialfunc', label: 'Special Function', icon: Code },
    ];

    return (
        <div className="w-64 bg-white border-r h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-sm text-gray-700">Components</h2>
                <p className="text-xs text-gray-500">Drag to canvas to add</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">

                <Droppable droppableId="palette" isDropDisabled={true}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {components.map((item, index) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={`sep-${index}`} className="pt-4 pb-1">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</h3>
                                        </div>
                                    );
                                }

                                return (
                                    <Draggable
                                        key={`palette-${item.type}-${item.dataType || 'base'}`}
                                        draggableId={`palette-${item.type}-${item.dataType || 'base'}`}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`
                          flex items-center gap-3 p-3 rounded-lg border bg-white cursor-grab hover:border-blue-500 hover:shadow-sm transition-all
                          ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 opacity-80' : 'border-gray-200'}
                        `}
                                            >
                                                {item.icon && <item.icon className="w-4 h-4 text-gray-500" />}
                                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

            </div>
        </div>
    );
};
