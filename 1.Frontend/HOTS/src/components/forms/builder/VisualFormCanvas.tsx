
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Package, Plus } from 'lucide-react';
import { FormStructureItem } from '@/components/forms/UnifiedFormStructureEditor';
import { FormField, FormSection, RowGroup } from '@/types/formTypes';

interface VisualFormCanvasProps {
    items: FormStructureItem[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    renderItem: (item: FormStructureItem, index: number, isSelected: boolean) => React.ReactNode;
}

export const VisualFormCanvas: React.FC<VisualFormCanvasProps> = ({
    items,
    selectedId,
    onSelect,
    renderItem
}) => {
    return (
        <div
            className="flex-1 overflow-y-auto bg-gray-50/50 p-8 h-full"
            onClick={() => onSelect(null)} // Click background to deselect
        >
            <div className="max-w-3xl mx-auto min-h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <div className="h-4 bg-gray-100 rounded-t-xl border-b border-gray-200"></div> {/* Fake browser bar */}

                <Droppable droppableId="unified-structure" type="field">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-6 space-y-4 transition-colors min-h-[400px] ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                                }`}
                        >
                            {items.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 border-2 border-dashed border-gray-200 rounded-lg">
                                    <Package className="w-12 h-12 mb-4 opacity-30" />
                                    <p className="text-sm font-medium">Your canvas is empty</p>
                                    <p className="text-xs">Drag components from the left sidebar</p>
                                </div>
                            )}

                            {items.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(item.id);
                                            }}
                                            className={`
                        group relative transition-all duration-200
                        ${snapshot.isDragging ? 'z-50 opacity-90 rotate-1 shadow-xl' : ''}
                      `}
                                        >
                                            {/* Selection Ring */}
                                            {selectedId === item.id && (
                                                <div className="absolute -inset-[2px] border-2 border-blue-500 rounded-lg pointer-events-none z-10" />
                                            )}

                                            {renderItem(item, index, selectedId === item.id)}
                                        </div>
                                    )}
                                </Draggable>
                            ))}

                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            <div className="max-w-3xl mx-auto mt-4 text-center text-xs text-gray-400">
                End of Form
            </div>
        </div>
    );
};
