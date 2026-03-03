import React from 'react';
import { UserCheck, ClipboardList, GitBranch } from 'lucide-react';

interface WorkflowNodePaletteProps {
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const nodeTypes = [
    {
        type: 'approvalNode',
        label: 'Approval Step',
        description: 'Add an approval level',
        icon: UserCheck,
        color: 'blue',
    },
    {
        type: 'taskNode',
        label: 'Task',
        description: 'Post-approval task',
        icon: ClipboardList,
        color: 'orange',
    },
];

export const WorkflowNodePalette: React.FC<WorkflowNodePaletteProps> = ({ onDragStart }) => {
    return (
        <div className="w-64 bg-white border-r h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Workflow Nodes
                </h2>
                <p className="text-xs text-gray-500 mt-1">Drag nodes to the canvas</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {nodeTypes.map((node) => {
                    const Icon = node.icon;
                    const colorClasses = {
                        blue: 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700',
                        orange: 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700',
                    };

                    return (
                        <div
                            key={node.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, node.type)}
                            className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${colorClasses[node.color as keyof typeof colorClasses]}`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                <div>
                                    <div className="font-medium text-sm">{node.label}</div>
                                    <div className="text-xs opacity-75">{node.description}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t bg-gray-50">
                <p className="text-xs text-gray-500">
                    <strong>Tip:</strong> Connect nodes by dragging from handles.
                </p>
            </div>
        </div>
    );
};

export default WorkflowNodePalette;
