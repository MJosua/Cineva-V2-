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
import { ArrowLeftRight, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface StockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { 
        operation: string; 
        items: { from_location_id: number; to_location_id: number; quantity: number }[]; 
        notes: string 
    }) => void;
    sourceItem: InventoryItem | null;
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    sourceItem
}) => {
    const [fromLocationId, setFromLocationId] = useState<string>('');
    const [toLocationId, setToLocationId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [locations, setLocations] = useState<{ id: number, resource_label: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Pre-fill source location if selected from table
            const preferredSrcId = (sourceItem as any)?.displayLocationId;
            setFromLocationId(preferredSrcId || '');
            
            setToLocationId('');
            setQuantity(1);
            setNotes('');
            fetchLocations();
        }
    }, [isOpen, sourceItem]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const locs = response.data.data.filter((i: any) => i.resource_category === 'storage_location');
                setLocations(locs);
            }
        } catch (err) {
            console.error("Failed to fetch locations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!sourceItem || !fromLocationId || !toLocationId) return;
        
        onConfirm({
            operation: 'transfer',
            items: [{ 
                from_location_id: parseInt(fromLocationId), 
                to_location_id: parseInt(toLocationId), 
                quantity 
            }],
            notes
        });
    };

    const sourceStock = parseInt(sourceItem?.attributes.stocks?.[fromLocationId] as any) || 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <ArrowLeftRight className="w-5 h-5 text-purple-500" />
                        <DialogTitle className="text-xl">Inter-Location Transfer</DialogTitle>
                    </div>
                    <div className="p-2 px-3 rounded bg-blue-500/10 border border-blue-500/20 mb-2">
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-tight">Moving Item</p>
                        <p className="font-medium text-sm">{sourceItem?.resource_label} ({sourceItem?.resource_key})</p>
                    </div>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs">From Location</Label>
                                    <Select value={fromLocationId} onValueChange={setFromLocationId}>
                                        <SelectTrigger><SelectValue placeholder="Source..." /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.resource_label} ({sourceItem?.attributes.stocks?.[loc.id] || 0})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">To Location</Label>
                                    <Select value={toLocationId} onValueChange={setToLocationId}>
                                        <SelectTrigger><SelectValue placeholder="Target..." /></SelectTrigger>
                                        <SelectContent>
                                            {locations.filter(l => l.id.toString() !== fromLocationId).map(loc => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.resource_label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="transfer-qty" className="text-sm font-medium">Quantity to Move</Label>
                                <div className="relative">
                                    <Input
                                        id="transfer-qty"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                        className="text-lg font-semibold pl-4 pr-12 h-12"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground text-sm">pcs</div>
                                </div>
                                {fromLocationId && quantity > sourceStock && (
                                    <div className="flex items-center gap-2 text-destructive text-xs mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Insufficient stock in source location! (Have: {sourceStock})</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="transfer-notes" className="text-sm font-medium">Notes</Label>
                                <Textarea
                                    id="transfer-notes"
                                    placeholder="Reason for movement..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="resize-none h-20"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button 
                        onClick={handleConfirm} 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={!fromLocationId || !toLocationId || quantity <= 0 || quantity > sourceStock}
                    >
                        Execute Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StockTransferModal;
