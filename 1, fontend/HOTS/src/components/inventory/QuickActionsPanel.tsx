import React from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    SlidersHorizontal,
    ClipboardList
} from 'lucide-react';

interface QuickActionsPanelProps {
    onReceive?: () => void;
    onIssue?: () => void;
    onTransfer?: () => void;
    onAdjustment?: () => void;
    onStockCount?: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
    onReceive,
    onIssue,
    onTransfer,
    onAdjustment,
    onStockCount,
}) => {
    const actions = [
        {
            label: 'Receive Stock',
            icon: ArrowDownToLine,
            onClick: onReceive,
            color: 'text-green-400 bg-green-500/20 hover:bg-green-500/30'
        },
        {
            label: 'Issue Stock',
            icon: ArrowUpFromLine,
            onClick: onIssue,
            color: 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30'
        },
        {
            label: 'Transfer',
            icon: ArrowLeftRight,
            onClick: onTransfer,
            color: 'text-purple-400 bg-purple-500/20 hover:bg-purple-500/30'
        },
        {
            label: 'Adjustment',
            icon: SlidersHorizontal,
            onClick: onAdjustment,
            color: 'text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30'
        },
        {
            label: 'Stock Count',
            icon: ClipboardList,
            onClick: onStockCount,
            color: 'text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30'
        },
    ];

    return (
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.label}
                        variant="ghost"
                        className={`justify-start gap-3 h-10 ${action.color} transition-colors`}
                        onClick={action.onClick}
                    >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsPanel;
