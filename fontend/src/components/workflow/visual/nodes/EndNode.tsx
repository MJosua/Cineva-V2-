import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle2 } from 'lucide-react';

interface EndNodeData {
    label: string;
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data }) => {
    return (
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-lg px-6 py-4 min-w-[200px] text-center border-2 border-gray-500">
            <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">{data.label}</span>
            </div>
            <Handle
                type="target"
                position={Position.Top}
                id="in"
                className="w-3 h-3 !bg-gray-400 border-2 border-white"
            />
        </div>
    );
};

export default EndNode;
