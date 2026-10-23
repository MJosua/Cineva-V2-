import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import BulkInventoryView from './views/BulkInventoryView';
import AssetRegistryView from './views/AssetRegistryView';

interface InventoryModuleProps {
    category: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ category, title, description, icon: Icon }) => {
    
    const isSerialized = category === 'it_asset';

    // Trigger custom event so BulkInventoryView or AssetRegistryView can open their respective Add Modals
    const handleAddNew = () => {
        const event = new CustomEvent('openInventoryModal', { detail: { category } });
        window.dispatchEvent(event);
    };

    return (
        <div className="p-6 space-y-6">
            <Tabs defaultValue="bulk" className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{title}</h1>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    
                    {isSerialized && (
                        <TabsList className="grid grid-cols-2 w-[400px]">
                            <TabsTrigger value="bulk">Bulk Stock</TabsTrigger>
                            <TabsTrigger value="registry">Asset Registry</TabsTrigger>
                        </TabsList>
                    )}
                </div>
                
                <TabsContent value="bulk" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <BulkInventoryView category={category} />
                </TabsContent>
                
                {isSerialized && (
                    <TabsContent value="registry" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <AssetRegistryView category={category} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default InventoryModule;
