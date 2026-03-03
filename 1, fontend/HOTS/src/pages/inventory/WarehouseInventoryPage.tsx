import React, { useState } from 'react';
import { Warehouse } from 'lucide-react';
import InventorySummaryCards from '@/components/inventory/InventorySummaryCards';
import InventoryTable from '@/components/inventory/InventoryTable';
import QuickActionsPanel from '@/components/inventory/QuickActionsPanel';
import { mockWarehouseItems, mockWarehouseSummary, InventoryItem } from '@/data/inventoryMockData';

/**
 * Warehouse Stock Inventory Dashboard
 * Route: /inventory/warehouse
 */
const WarehouseInventoryPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const handleReceive = () => console.log('Open Receive Stock Modal');
    const handleIssue = () => console.log('Open Issue Stock Modal');
    const handleTransfer = () => console.log('Open Transfer Modal');
    const handleAdjustment = () => console.log('Open Adjustment Modal');
    const handleStockCount = () => console.log('Open Stock Count Modal');

    const handleItemClick = (item: InventoryItem) => {
        setSelectedItem(item);
        console.log('Selected item:', item);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Warehouse className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Warehouse Stock</h1>
                    <p className="text-sm text-muted-foreground">Manage finished goods, raw materials, and packaging</p>
                </div>
            </div>

            {/* Summary Cards */}
            <InventorySummaryCards summary={mockWarehouseSummary} categoryLabel="SKUs" />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <InventoryTable
                    items={mockWarehouseItems}
                    onItemClick={handleItemClick}
                />
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

export default WarehouseInventoryPage;
