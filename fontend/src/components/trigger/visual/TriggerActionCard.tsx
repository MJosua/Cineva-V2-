import React from 'react';
import { TriggerAction, ACTION_CATALOG, TriggerActionType } from '@/utils/triggerAdapter';
import {
    FileText, Mail, Code, Database, UserPlus, CheckSquare, RefreshCw,
    GripVertical, Trash2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Icon mapping
const iconMap: Record<string, React.FC<{ className?: string }>> = {
    FileText, Mail, Code, Database, UserPlus, CheckSquare, RefreshCw,
};

interface TriggerActionCardProps {
    action: TriggerAction;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

export const TriggerActionCard: React.FC<TriggerActionCardProps> = ({
    action,
    index,
    isSelected,
    onSelect,
    onDelete,
}) => {
    const meta = ACTION_CATALOG.find(a => a.type === action.action);
    if (!meta) return null;

    const Icon = iconMap[meta.icon] || FileText;

    const colorClasses: Record<string, string> = {
        blue: 'border-l-blue-500 bg-blue-50/50',
        green: 'border-l-green-500 bg-green-50/50',
        purple: 'border-l-purple-500 bg-purple-50/50',
        orange: 'border-l-orange-500 bg-orange-50/50',
        cyan: 'border-l-cyan-500 bg-cyan-50/50',
        yellow: 'border-l-yellow-500 bg-yellow-50/50',
    };

    return (
        <div
            onClick={onSelect}
            className={`p-3 rounded-lg border border-l-4 shadow-sm cursor-pointer transition-all ${colorClasses[meta.color] || 'border-l-gray-500 bg-gray-50/50'
                } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'}`}
        >
            <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />

                <div className={`p-2 rounded-md bg-${meta.color}-100`}>
                    <Icon className={`w-4 h-4 text-${meta.color}-600`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{meta.label}</div>
                    <div className="text-xs text-gray-500 truncate">
                        {Object.entries(action.params)
                            .filter(([, v]) => v)
                            .map(([k, v]) => {
                                const displayValue = typeof v === 'object'
                                    ? JSON.stringify(v).substring(0, 20)
                                    : String(v).substring(0, 20);
                                return `${k}: ${displayValue}`;
                            })
                            .join(', ') || 'Click to configure'}
                    </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>

            {action.condition && (
                <div className="mt-2 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                    ⚡ Condition: {action.condition}
                </div>
            )}
        </div>
    );
};

export default TriggerActionCard;
