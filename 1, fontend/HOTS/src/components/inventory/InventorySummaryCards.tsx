import React from 'react';
import { Package, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { InventorySummary } from '@/data/inventoryMockData';

interface InventorySummaryCardsProps {
    summary: InventorySummary;
    categoryLabel?: string;
}

const InventorySummaryCards: React.FC<InventorySummaryCardsProps> = ({ summary, categoryLabel = 'Items' }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Items Card */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                    <Package className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-foreground">{summary.totalItems.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total {categoryLabel}</p>
                </div>
            </div>

            {/* Low Stock Alerts Card */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/20">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-foreground">{summary.lowStockAlerts}</p>
                    <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                </div>
            </div>

            {/* Pending Transfers Card */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                    <ArrowLeftRight className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-foreground">{summary.pendingTransfers}</p>
                    <p className="text-sm text-muted-foreground">Pending Transfers</p>
                </div>
            </div>
        </div>
    );
};

export default InventorySummaryCards;
