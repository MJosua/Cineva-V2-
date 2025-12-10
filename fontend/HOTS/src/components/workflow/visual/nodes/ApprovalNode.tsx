import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UserCheck } from 'lucide-react';

interface ApprovalNodeData {
    label: string;
    level: number;
    step_type: string;
    assigned_value?: string | number;
    description?: string;
}

const stepTypeLabels: Record<string, string> = {
    team: 'Team',
    role: 'Role',
    superior: 'Superior',
    specific_user: 'Specific User',
    user_dynamic: 'Dynamic',
    department: 'Department',
};

const ApprovalNode: React.FC<NodeProps<ApprovalNodeData>> = ({ data, selected }) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-lg min-w-[250px] border-2 transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-300'
                }`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span className="font-medium text-sm">Level {data.level}</span>
                </div>
                <span className="text-xs bg-blue-400/50 px-2 py-0.5 rounded">
                    {stepTypeLabels[data.step_type] || data.step_type}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <div className="font-medium text-gray-800 text-sm">{data.label}</div>
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
                id="approved"
                className="w-3 h-3 !bg-green-500 border-2 border-white"
                style={{ left: '35%' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="rejected"
                className="w-3 h-3 !bg-red-500 border-2 border-white"
                style={{ left: '65%' }}
            />
        </div>
    );
};

export default ApprovalNode;
