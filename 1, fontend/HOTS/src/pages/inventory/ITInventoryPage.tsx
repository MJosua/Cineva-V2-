import React from 'react';
import { Monitor } from 'lucide-react';
import InventoryModule from '@/components/inventory/InventoryModule';

/**
 * IT Equipment Inventory Dashboard
 * This page is now a thin wrapper around the unified InventoryModule.
 */
const ITInventoryPage: React.FC = () => {
    return (
        <InventoryModule 
            category="it_asset"
            title="IT Equipment"
            description="Laptops, monitors, and peripherals management"
            icon={Monitor}
        />
    );
};

export default ITInventoryPage;
