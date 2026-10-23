import React from 'react';
import { Megaphone } from 'lucide-react';
import InventoryModule from '@/components/inventory/InventoryModule';

/**
 * POSM Products Inventory Dashboard
 * This page uses the same unified InventoryModule as IT Equipment, 
 * granting it the Master-Detail Layout and Asset Registry features automatically.
 */
const POSMInventoryPage: React.FC = () => {
    return (
        <InventoryModule 
            category="posm"
            title="POSM Products"
            description="Marketing materials, leaflets, and banners"
            icon={Megaphone}
        />
    );
};

export default POSMInventoryPage;
