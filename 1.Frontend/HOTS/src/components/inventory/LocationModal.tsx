import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryItem } from '@/data/inventoryMockData';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<InventoryItem>) => void;
    item?: InventoryItem | null;
}

const LocationModal: React.FC<LocationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    item
}) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        resource_label: '',
        resource_key: '',
        resource_category: 'storage_location',
        attributes: { total_stock: 0, stocks: {}, max_stock: 0 }
    });

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                attributes: item.attributes || { total_stock: 0, stocks: {}, max_stock: 0 }
            });
        } else {
            setFormData({
                resource_label: '',
                resource_key: '',
                resource_category: 'storage_location',
                attributes: { total_stock: 0, stocks: {}, max_stock: 0 }
            });
        }
    }, [item, isOpen]);

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Storage Location' : 'Add New Storage Location'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="resource_label">Location Name (Hierarchy)</Label>
                        <Input
                            id="resource_label"
                            value={formData.resource_label || ''}
                            onChange={(e) => setFormData({ ...formData, resource_label: e.target.value })}
                            placeholder="e.g. WH-01 / RACK-A"
                        />
                        <p className="text-[10px] text-muted-foreground">Use physical structure naming conventions.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="resource_key">Location Code / Identifier</Label>
                        <Input
                            id="resource_key"
                            value={formData.resource_key || ''}
                            onChange={(e) => setFormData({ ...formData, resource_key: e.target.value })}
                            placeholder="e.g. LOC-WH-01"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description / Notes</Label>
                        <Input
                            id="description"
                            value={formData.attributes?.description || ''}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                attributes: { ...formData.attributes, description: e.target.value } 
                            } as any)}
                            placeholder="e.g. Rack A on the 2nd floor, access requires keycard"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Location</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LocationModal;
