import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BoxSelect, Hash, Tag, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9999';

interface AssetInstance {
    id: number;
    resource_category: string;
    resource_key: string;
    resource_label: string;
    attributes: any;
    is_active: number;
}

interface AssetInstanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    category: string; 
    skus: any[];
    locations: any[];
}

const AssetInstanceModal: React.FC<AssetInstanceModalProps> = ({ isOpen, onClose, onSave, category, skus, locations }) => {
    const instanceCategory = `${category}_instance`; // it_asset_instance

    const [formData, setFormData] = useState({
        resource_key: '',
        resource_label: '',
        sku_id: '',
        location_id: '',
        condition: 'good',
        registered_date: new Date().toISOString().split('T')[0],
        incrementStock: true
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setFormData({
                resource_key: '',
                resource_label: '',
                sku_id: '',
                location_id: '',
                condition: 'good',
                registered_date: new Date().toISOString().split('T')[0],
                incrementStock: true
            });
        }
    }, [isOpen]);

    // Auto-generate serial number when SKU or Registered Date changes
    useEffect(() => {
        if (formData.sku_id && formData.registered_date) {
            handleGenerateSerial();
        }
    }, [formData.sku_id, formData.registered_date]);

    const handleGenerateSerial = async () => {
        const selectedSku = skus.find(s => s.id.toString() === formData.sku_id);
        if (!selectedSku) return;

        setIsGenerating(true);
        try {
            // Format date: DDMMYYYY
            const dateObj = new Date(formData.registered_date);
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const yyyy = dateObj.getFullYear();
            const formattedDate = `${dd}${mm}${yyyy}`;

            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/asset-next-serial/${selectedSku.resource_key}/${formattedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    resource_key: response.data.nextSerial,
                    // Auto-fill friendly name if empty
                    resource_label: prev.resource_label || `${selectedSku.resource_label} - ${response.data.nextSerial.split('-').pop()}`
                }));
            }
        } catch (err) {
            console.error("Failed to generate serial:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedSku = skus.find(s => s.id.toString() === formData.sku_id);
        
        onSave({
            resource_category: instanceCategory,
            resource_key: formData.resource_key,
            resource_label: formData.resource_label,
            location_id: formData.location_id,
            incrementStock: formData.incrementStock,
            attributes: {
                sku_id: formData.sku_id,
                sku_ref: selectedSku?.resource_label || '',
                location_id: formData.location_id,
                condition: formData.condition,
                registration_date: formData.registered_date
            },
            is_active: 1
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BoxSelect className="w-5 h-5 text-primary" />
                            Register Serialized Unit
                        </DialogTitle>
                        <DialogDescription>
                            Add a precise physical unit to the registry. This will generate a unique QR code for auditing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Parent SKU Reference</Label>
                                <Select value={formData.sku_id} onValueChange={(val) => setFormData({ ...formData, sku_id: val })}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select SKU from Catalog..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skus.map(sku => (
                                            <SelectItem key={sku.id} value={sku.id.toString()}>
                                                {sku.resource_label} ({sku.resource_key})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="registered_date" className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                        <CalendarIcon className="w-3 h-3" /> Registered Date
                                    </Label>
                                    <Input
                                        id="registered_date"
                                        type="date"
                                        className="h-9"
                                        value={formData.registered_date}
                                        onChange={(e) => setFormData({ ...formData, registered_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resource_label" className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                        <Tag className="w-3 h-3" /> Friendly Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="resource_label"
                                        placeholder="e.g. Unit A1"
                                        className="h-9"
                                        value={formData.resource_label}
                                        onChange={(e) => setFormData({ ...formData, resource_label: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Physical Location</Label>
                                    <Select value={formData.location_id} onValueChange={(val) => setFormData({ ...formData, location_id: val })}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select Location..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.resource_label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="condition" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Initial Condition</Label>
                                    <Select value={formData.condition} onValueChange={(val) => setFormData({ ...formData, condition: val })}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select Condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Good / New</SelectItem>
                                            <SelectItem value="fair">Fair / Used</SelectItem>
                                            <SelectItem value="repair">Needs Repair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-dashed">
                                <div className="space-y-2">
                                    <Label htmlFor="resource_key" className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-primary font-black">
                                        <Hash className="w-3 h-3" /> Auto-Generated Serial Number / Tag <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="resource_key"
                                            placeholder="Generating..."
                                            className="font-mono bg-primary/5 h-10 pr-8 border-primary/20 text-primary font-bold"
                                            value={formData.resource_key}
                                            onChange={(e) => setFormData({ ...formData, resource_key: e.target.value })}
                                            required
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/50">
                                            {isGenerating ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw 
                                                    className="w-3.5 h-3.5 cursor-pointer hover:text-primary transition-colors" 
                                                    onClick={handleGenerateSerial}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic px-1">
                                        Pattern: SKU_KEY - DATE - SEQUENCE (based on existing records)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <Checkbox 
                                id="incrementStock" 
                                checked={formData.incrementStock}
                                onCheckedChange={(checked) => setFormData({ ...formData, incrementStock: !!checked })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="incrementStock" className="text-[11px] font-bold leading-none cursor-pointer">
                                    Increment Bulk Stock Count
                                </Label>
                                <p className="text-[10px] text-muted-foreground lowercase leading-tight">
                                    Automatically add +1 to bulk inventory for this SKU and location.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} size="sm">Cancel</Button>
                        <Button type="submit" size="sm" disabled={!formData.sku_id || !formData.location_id}>
                            Register Unit
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AssetInstanceModal;
