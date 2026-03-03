import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import InventorySummaryCards from '@/components/inventory/InventorySummaryCards';
import InventoryTable from '@/components/inventory/InventoryTable';
import QuickActionsPanel from '@/components/inventory/QuickActionsPanel';
import { mockITItems, mockITSummary, InventoryItem } from '@/data/inventoryMockData';

/**
 * IT Equipment Inventory Dashboard
 * Route: /inventory/it
 */
const ITInventoryPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Modal state handlers (to be implemented)
    const handleReceive = () => {
        console.log('Open Receive Stock Modal');
        // TODO: Open ReceiveStockModal
    };

    const handleIssue = () => {
        console.log('Open Issue Stock Modal');
        // TODO: Open IssueStockModal
    };

    const handleTransfer = () => {
        console.log('Open Transfer Modal');
        // TODO: Open TransferStockModal
    };

    const handleAdjustment = () => {
        console.log('Open Adjustment Modal');
        // TODO: Open AdjustmentModal
    };

    const handleStockCount = () => {
        console.log('Open Stock Count Modal');
        // TODO: Open StockCountModal
    };

    const handleItemClick = (item: InventoryItem) => {
        setSelectedItem(item);
        console.log('Selected item:', item);
        // TODO: Open item details panel/modal
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                    <Monitor className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">IT Equipment Inventory</h1>
                    <p className="text-sm text-muted-foreground">Manage laptops, monitors, peripherals, and networking equipment</p>
                </div>
            </div>

            {/* Summary Cards */}
            <InventorySummaryCards summary={mockITSummary} categoryLabel="Items" />

            {/* Main Content: Table + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                {/* Inventory Table */}
                <InventoryTable
                    items={mockITItems}
                    onItemClick={handleItemClick}
                />

                {/* Quick Actions Panel */}
                <QuickActionsPanel
                    onReceive={handleReceive}
                    onIssue={handleIssue}
                    onTransfer={handleTransfer}
                    onAdjustment={handleAdjustment}
                    onStockCount={handleStockCount}
                />
            </div>
        </div>
    );
};

export default ITInventoryPage;
