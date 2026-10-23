import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, Edit, Trash2, Package, Database, 
    TrendingUp, Info, Layers, ChevronRight,
    MapPin, Box, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LocationModal from '@/components/inventory/LocationModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { InventoryItem } from '@/data/inventoryMockData';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from "@/hooks/use-toast";

const StorageManagementPage: React.FC = () => {
    const [locations, setLocations] = useState<InventoryItem[]>([]);
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<InventoryItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [activeLocation, setActiveLocation] = useState<InventoryItem | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const allData: InventoryItem[] = response.data.data;
                const locs = allData.filter(item => item.resource_category === 'storage_location');
                const inv = allData.filter(item => item.resource_category !== 'storage_location');
                
                setLocations(locs);
                setAllInventory(inv);
                
                if (locs.length > 0 && !activeLocation) {
                    setActiveLocation(locs[0]);
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch locations:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.post(`${API_URL}/hots_settings/post/inventory/upsert`, itemData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({ title: "Success", description: "Location saved!" });
                setIsModalOpen(false);
                fetchItems();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = (item: InventoryItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.delete(`${API_URL}/hots_settings/delete/inventory/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ title: "Deleted", description: `Location "${itemToDelete.resource_label}" removed.` });
            if (activeLocation?.id === itemToDelete.id) setActiveLocation(null);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    // Calculate metrics for the active location
    const locationStats = useMemo(() => {
        if (!activeLocation) return { items: [], totalUnits: 0, skus: 0 };
        const key = activeLocation.resource_key;
        const items = allInventory.filter(item => (item.attributes?.stocks?.[key] || 0) > 0);
        const totalUnits = items.reduce((sum, item) => sum + (item.attributes?.stocks?.[key] || 0), 0);
        return { items, totalUnits, skus: items.length };
    }, [activeLocation, allInventory]);

    return (
        <div className="p-6 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
            <LocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} item={modalItem} />
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Storage Location"
                description={
                    <>
                        Are you sure you want to delete <span className="font-bold text-foreground">"{itemToDelete?.resource_label}"</span>? 
                        <br />This will remove the location and may affect stock records associated with it.
                    </>
                }
                confirmText="Delete Location"
                cancelText="Cancel"
            />

            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="w-6 h-6 text-primary" />
                        Storage Management
                    </h1>
                    <p className="text-sm text-muted-foreground">Monitor and organize physical stock distribution</p>
                </div>
                <Button onClick={() => { setModalItem(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Storage Units
                </Button>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-6 min-h-0 bg-card/10 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    {/* LEFT PANEL: Independent Scroll List */}
                    <div className="overflow-y-auto p-4 border-r border-border/50">
                        <div className="space-y-3">
                            {locations.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    No storage locations defined.
                                </div>
                            ) : locations.map((loc) => (
                                <div 
                                    key={loc.id}
                                    onClick={() => setActiveLocation(loc)}
                                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                                        activeLocation?.id === loc.id 
                                        ? 'bg-primary/10 border-primary/50 shadow-lg ring-1 ring-primary/20' 
                                        : 'bg-background/40 border-border/50 hover:border-primary/30 hover:bg-accent/5'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-lg ${activeLocation?.id === loc.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{loc.resource_label}</h3>
                                                <p className="text-xs font-mono text-muted-foreground">{loc.resource_key}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                onClick={(e) => { e.stopPropagation(); setModalItem(loc); setIsModalOpen(true); }}
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(loc); }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{loc.attributes?.description || 'No notes added.'}</p>
                                    {activeLocation?.id === loc.id && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <ChevronRight className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Sticky Summary Dashboard */}
                    <div className="overflow-y-auto bg-primary/[0.02] flex flex-col min-h-0">
                        {!activeLocation ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                                <Info className="w-10 h-10 mb-4 opacity-50" />
                                <p>Select a storage location to view its inventory footprint.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Header Info */}
                                <div className="space-y-1">
                                    <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">Active Unit</Badge>
                                    <h2 className="text-xl font-bold">{activeLocation.resource_label}</h2>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {activeLocation.attributes?.description || "Detailed site analysis and stock movement logs."}
                                    </p>
                                </div>

                                {/* Metrics Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <LayoutGrid className="w-5 h-5 mb-2 text-blue-400" />
                                            <div className="text-2xl font-bold">{locationStats.skus}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Unique SKUs</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-background/50 border-border/50">
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <Box className="w-5 h-5 mb-2 text-orange-400" />
                                            <div className="text-2xl font-bold">{locationStats.totalUnits}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Units</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Items List */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            Stock Footprint
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground uppercase">{locationStats.skus} registered items</span>
                                    </div>

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {locationStats.items.length === 0 ? (
                                            <div className="text-center py-10 bg-accent/20 rounded-xl text-xs text-muted-foreground border border-dashed border-border/50">
                                                No items currently stored here.
                                            </div>
                                        ) : locationStats.items.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg group hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                                        <Package className="w-3.5 h-3.5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium">{inv.resource_label || inv.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">{inv.resource_category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-primary">
                                                    {inv.attributes?.stocks?.[activeLocation.resource_key] || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageManagementPage;
