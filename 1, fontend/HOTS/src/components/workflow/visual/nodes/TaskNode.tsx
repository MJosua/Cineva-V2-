import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ClipboardList } from 'lucide-react';

interface TaskNodeData {
    label: string;
    task_order: number;
    task_type: string;
    task_name?: string;
    assigned_value?: string | number;
}

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data, selected }) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-lg min-w-[250px] border-2 border-l-4 transition-all ${selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-300'
                } border-l-orange-500`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span className="font-medium text-sm">Task #{data.task_order}</span>
                </div>
                <span className="text-xs bg-orange-400/50 px-2 py-0.5 rounded">
                    {data.task_type}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <div className="font-medium text-gray-800 text-sm">{data.task_name || data.label}</div>
                {data.assigned_value && (
                    <div className="text-xs text-gray-500 mt-1">
                        Assigned: {data.assigned_value}
                    </div>
                )}
            </div>

            {/* Handles */}
            <Handle
                type="target"
                position={Position.Top}
                id="in"
                className="w-3 h-3 !bg-gray-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="out"
                className="w-3 h-3 !bg-orange-400 border-2 border-white"
            />
        </div>
    );
};

export default TaskNode;
