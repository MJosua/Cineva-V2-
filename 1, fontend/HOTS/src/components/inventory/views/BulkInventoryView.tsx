import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import InventorySummaryCards from '@/components/inventory/InventorySummaryCards';
import InventoryTable from '@/components/inventory/InventoryTable';
import LocationDistributionPanel from '@/components/inventory/LocationDistributionPanel';
import { InventoryItem, InventorySummary, calculateStatus } from '@/data/inventoryMockData';
import InventoryModal from '@/components/inventory/InventoryModal';
import StockTransactionModal from '@/components/inventory/StockTransactionModal';
import StockTransferModal from '@/components/inventory/StockTransferModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';

interface BulkInventoryViewProps {
    category: string;
}

const BulkInventoryView: React.FC<BulkInventoryViewProps> = ({ category }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [summary, setSummary] = useState<InventorySummary>({ totalItems: 0, lowStockAlerts: 0, pendingTransfers: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [operationType, setOperationType] = useState<'receive' | 'issue' | 'adjust' | null>(null);
    const { toast } = useToast();
    const sseInventorySignal = useAppSelector(state => state.tickets.sseSignals?.inventory);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const allData: InventoryItem[] = response.data.data;
                
                // Build location lookup map
                const locationMap: Record<string, string> = {};
                allData.filter(i => i.resource_category === 'storage_location')
                      .forEach(loc => {
                          locationMap[loc.id.toString()] = loc.resource_label;
                      });

                const filteredItems = allData.filter(item => item.resource_category === category)
                    .map(item => ({
                        ...item,
                        attributes: {
                            ...item.attributes,
                            location_names: locationMap
                        },
                        status: calculateStatus(
                            Number(item.attributes?.total_stock) || 0, 
                            Number(item.attributes?.max_stock) || 100
                        )
                    }));
                setItems(filteredItems);
                setSummary({
                    totalItems: filteredItems.length,
                    lowStockAlerts: filteredItems.filter(i => i.status === 'low' || i.status === 'critical').length,
                    pendingTransfers: 0 
                });

                // Sync selected item with fresh data
                if (selectedItem) {
                    const freshItem = filteredItems.find(i => i.id === selectedItem.id);
                    if (freshItem) {
                        setSelectedItem(freshItem);
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to fetch ${category} inventory:`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setSelectedItem(null); // Reset selection when category changes
    }, [category]);

    // Listen for SSE refresh signals
    useEffect(() => {
        if (sseInventorySignal) {
            fetchData();
        }
    }, [sseInventorySignal]);

    const handleSaveItem = async (formData: Partial<InventoryItem>) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.post(`${API_URL}/hots_settings/post/inventory/upsert`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Success", description: `Inventory item ${selectedItem ? 'updated' : 'created'} successfully.` });
                setIsModalOpen(false);
                fetchData();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to save inventory item.", variant: "destructive" });
        }
    };

    const handleDeleteItem = (item: InventoryItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.delete(`${API_URL}/hots_settings/delete/inventory/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Deleted", description: `Item "${itemToDelete.resource_label}" removed from inventory.` });
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
                fetchData();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to delete item.", variant: "destructive" });
        }
    };

    const handleLocationAction = (operation: 'receive' | 'issue' | 'adjust' | 'transfer', locationId?: string) => {
        if (!selectedItem) {
            toast({ title: "No Item Selected", description: "Please click on a row to select an item first.", variant: "destructive" });
            return;
        }

        // Pre-contextualize the item for the modals
        const contextItem = { ...selectedItem, displayLocationId: locationId };
        setSelectedItem(contextItem);

        if (operation === 'transfer') {
            setIsTransferModalOpen(true);
            return;
        }
        setOperationType(operation as any);
        setIsTransactionModalOpen(true);
    };

    const handleConfirmTransaction = async (data: any) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.post(`${API_URL}/hots_settings/post/inventory/transaction`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Transaction Successful", description: response.data.message });
                setIsTransactionModalOpen(false);
                setIsTransferModalOpen(false);
                fetchData();
            }
        } catch (error: any) {
            toast({ title: "Transaction Failed", description: error.response?.data?.message || "Check stock and try again.", variant: "destructive" });
        }
    };

    const handleSelectItem = (item: InventoryItem) => setSelectedItem(item);
    const handleEditItem = (item: InventoryItem) => { setSelectedItem(item); setIsModalOpen(true); };

    // Expose a method to open the "Add new" modal to the parent component
    useEffect(() => {
        const handleOpenAddModal = (e: CustomEvent) => {
            if (e.detail?.category === category) {
                setSelectedItem(null);
                setIsModalOpen(true);
            }
        };
        window.addEventListener('openInventoryModal', handleOpenAddModal as EventListener);
        return () => window.removeEventListener('openInventoryModal', handleOpenAddModal as EventListener);
    }, [category]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Loading {category} Inventory...</p>
                </div>
            </div>
        );
    }

    const baseCategories = category === 'it_asset' 
        ? ["Laptop / Notebook", "Desktop / PC", "Monitor", "Mouse", "Keyboard", "Network Equipment"]
        : ["Baju / Apparel", "Gantungan Kunci", "Banner / Spanduk", "Flyer / Brosur", "Sticker"];
    
    // Merge base defaults with any custom dynamic categories the user previously registered
    const dynamicCategories = Array.from(new Set(items.map(i => i.attributes?.sub_category).filter(Boolean))) as string[];
    const combinedCategories = Array.from(new Set([...baseCategories, ...dynamicCategories])).sort();

    return (
        <div className="space-y-6">
            <InventoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveItem} 
                item={selectedItem} 
                category={category} 
                existingCategories={combinedCategories}
            />
            <StockTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onConfirm={handleConfirmTransaction} item={selectedItem} operationType={operationType} />
            <StockTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onConfirm={handleConfirmTransaction} sourceItem={selectedItem} />
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Inventory Item"
                description={
                    <>
                        Are you sure you want to delete <span className="font-bold text-foreground">"{itemToDelete?.resource_label}"</span>? 
                        <br />This action cannot be undone and will remove all associated stock records.
                    </>
                }
                confirmText="Delete Item"
                cancelText="Keep Item"
            />

            <InventorySummaryCards summary={summary} categoryLabel="Items" />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
                <div className="space-y-4 min-w-0">
                    <InventoryTable 
                        items={items} 
                        onItemClick={handleEditItem} 
                        onDelete={handleDeleteItem} 
                        onSelect={handleSelectItem} 
                        onAddClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                        onAction={(item, op) => {
                            setSelectedItem(item);
                            handleLocationAction(op);
                        }}
                        selectedId={selectedItem?.id} 
                    />
                </div>
                
                <div className="sticky top-6 h-[calc(100vh-140px)] min-h-[500px]">
                    <LocationDistributionPanel 
                        item={selectedItem} 
                        onAction={handleLocationAction} 
                    />
                </div>
            </div>
        </div>
    );
};

export default BulkInventoryView;
