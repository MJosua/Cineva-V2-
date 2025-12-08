import React from 'react';
import { ACTION_CATALOG, TriggerActionType, createAction } from '@/utils/triggerAdapter';
import { Zap, FileText, Mail, Code, Database, UserPlus, CheckSquare, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Icon mapping
const iconMap: Record<string, React.FC<{ className?: string }>> = {
    FileText, Mail, Code, Database, UserPlus, CheckSquare, RefreshCw,
};

interface TriggerActionPaletteProps {
    onAddAction: (type: TriggerActionType) => void;
}

export const TriggerActionPalette: React.FC<TriggerActionPaletteProps> = ({ onAddAction }) => {
    const colorClasses: Record<string, string> = {
        blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
        green: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700',
        purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700',
        orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700',
        cyan: 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700',
        yellow: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
    };

    return (
        <div className="w-64 bg-white border-r h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Actions
                </h2>
                <p className="text-xs text-gray-500 mt-1">Click to add an action</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ACTION_CATALOG.map((action) => {
                    const Icon = iconMap[action.icon] || FileText;
                    return (
                        <button
                            key={action.type}
                            onClick={() => onAddAction(action.type)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${colorClasses[action.color] || 'border-gray-200 bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium text-sm">{action.label}</div>
                                    <div className="text-[10px] opacity-75">{action.description}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="p-4 border-t bg-gray-50">
                <p className="text-xs text-gray-500">
                    <strong>Tip:</strong> Actions run in order from top to bottom.
                </p>
            </div>
        </div>
    );
};

export default TriggerActionPalette;
