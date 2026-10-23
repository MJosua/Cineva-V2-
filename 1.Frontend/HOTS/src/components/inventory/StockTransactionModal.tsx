import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from '@/data/inventoryMockData';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface StockTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { 
        operation: string; 
        items: { id: number; location_id: number; quantity: number }[]; 
        notes: string 
    }) => void;
    item: InventoryItem | null;
    operationType: 'receive' | 'issue' | 'adjust' | null;
}

const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    item,
    operationType
}) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [locations, setLocations] = useState<{ id: number, resource_label: string }[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Check if item has a preferred display location from the flattened table
            const preferredLocId = (item as any)?.displayLocationId;
            
            if (preferredLocId && !selectedLocationId) {
                setSelectedLocationId(preferredLocId);
            }
            
            const currentStockAtLoc = selectedLocationId ? (item?.attributes.stocks?.[selectedLocationId] || 0) : (item?.attributes.total_stock || 0);
            setQuantity(operationType === 'adjust' ? currentStockAtLoc : 1);
            setNotes('');
            fetchLocations();
        }
    }, [isOpen, operationType, item, selectedLocationId]);

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const locs = response.data.data.filter((i: any) => i.resource_category === 'storage_location');
                setLocations(locs);
                if (locs.length > 0 && !selectedLocationId) {
                    setSelectedLocationId(locs[0].id.toString());
                }
            }
        } catch (err) {
            console.error("Failed to fetch locations:", err);
        }
    };

    const handleConfirm = () => {
        if (!item || !operationType || !selectedLocationId) return;
        
        onConfirm({
            operation: operationType,
            items: [{ 
                id: item.id, 
                location_id: parseInt(selectedLocationId), 
                quantity 
            }],
            notes
        });
    };

    const getTitle = () => {
        switch (operationType) {
            case 'receive': return 'Receive Stock';
            case 'issue': return 'Issue Stock';
            case 'adjust': return 'Stock Adjustment';
            default: return 'Stock Transaction';
        }
    };

    const getIcon = () => {
        switch (operationType) {
            case 'receive': return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
            case 'issue': return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
            case 'adjust': return <RefreshCw className="w-5 h-5 text-amber-500" />;
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        {getIcon()}
                        <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {item?.resource_label} ({item?.resource_key})
                    </p>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="location" className="text-sm font-medium">Storage Location</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select location..." />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id.toString()}>
                                        {loc.resource_label} ({item?.attributes?.stocks?.[loc.id] || 0} pcs)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="text-sm">
                            <p className="text-muted-foreground">{selectedLocationId ? 'Stock at Location' : 'Total Available'}</p>
                            <p className="text-2xl font-bold">
                                {selectedLocationId 
                                    ? (item?.attributes.stocks?.[selectedLocationId] || 0) 
                                    : (item?.attributes.total_stock || 0)
                                }
                            </p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="text-muted-foreground">Unit</p>
                            <p className="font-medium">Pieces</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity" className="font-bold">
                            {operationType === 'adjust' ? 'New Stock Quantity' : 'Quantity to ' + (operationType || 'process')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                className="text-lg font-semibold pl-4 pr-12 h-12"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground text-sm">
                                pcs
                            </div>
                        </div>
                        {operationType === 'issue' && quantity > (selectedLocationId ? (item?.attributes.stocks?.[selectedLocationId] || 0) : (item?.attributes.total_stock || 0)) && (
                            <div className="flex items-center gap-2 text-destructive text-xs mt-1 animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                <span>Caution: Requested quantity exceeds available stock at this location!</span>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Transaction Notes / Reference</Label>
                        <Textarea
                            id="notes"
                            placeholder="Reason for movement, PO#, or requester..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button 
                        onClick={handleConfirm} 
                        className="flex-1"
                        disabled={quantity <= 0 && operationType !== 'adjust'}
                    >
                        Confirm Transaction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StockTransactionModal;
