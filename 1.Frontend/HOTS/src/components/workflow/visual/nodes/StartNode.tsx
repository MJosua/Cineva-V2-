import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

interface StartNodeData {
    label: string;
}

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data }) => {
    return (
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg px-6 py-4 min-w-[200px] text-center border-2 border-green-400">
            <div className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                <span className="font-semibold">{data.label}</span>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="out"
                className="w-3 h-3 !bg-green-300 border-2 border-white"
            />
        </div>
    );
};

export default StartNode;
