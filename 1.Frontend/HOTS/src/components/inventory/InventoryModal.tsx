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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { InventoryItem } from '@/data/inventoryMockData';

import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<InventoryItem>) => void;
    item?: InventoryItem | null;
    category?: string;
    existingCategories?: string[]; // Dynamic categories passed from the view
}

const InventoryModal: React.FC<InventoryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    item,
    category,
    existingCategories = []
}) => {
    const [openCategory, setOpenCategory] = useState(false);
    const [searchStr, setSearchStr] = useState('');

    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        resource_label: '',
        resource_key: '',
        resource_category: category || 'it_asset',
        attributes: {
            total_stock: 0,
            stocks: {},
            max_stock: 0,
            specs: {}
        }
    });

    const [specs, setSpecs] = useState<{ id: string; key: string; value: string }[]>([]);

    useEffect(() => {
        if (item) {
            const initialSpecs = item.attributes?.specs 
                ? Object.entries(item.attributes.specs).map(([k, v]) => ({ id: Math.random().toString(), key: k, value: String(v) }))
                : [];
            
            setFormData({
                ...item,
                attributes: {
                    total_stock: item.attributes?.total_stock ?? 0,
                    stocks: item.attributes?.stocks ?? {},
                    max_stock: item.attributes?.max_stock ?? 0,
                    specs: item.attributes?.specs || {}
                }
            });
            setSpecs(initialSpecs);
        } else {
            setFormData({
                resource_label: '',
                resource_key: '',
                resource_category: category || 'it_asset',
                attributes: {
                    total_stock: 0,
                    stocks: {},
                    max_stock: 0,
                    specs: {}
                }
            });
            setSpecs([]);
        }
    }, [item, isOpen, category]);

    const handleAttributeChange = (key: string, value: string) => {
        const numVal = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [key]: numVal
            }
        }));
    };

    const addSpecField = () => {
        setSpecs([...specs, { id: Math.random().toString(), key: '', value: '' }]);
    };

    const removeSpecField = (id: string) => {
        setSpecs(specs.filter(s => s.id !== id));
    };

    const updateSpec = (id: string, field: 'key' | 'value', val: string) => {
        setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const handleSave = () => {
        // Convert specs array back to object
        const specsObject = specs.reduce((acc, curr) => {
            if (curr.key.trim()) {
                acc[curr.key.trim()] = curr.value;
            }
            return acc;
        }, {} as Record<string, any>);

        onSave({
            ...formData,
            attributes: {
                ...formData.attributes,
                specs: specsObject
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="resource_label">Item Name</Label>
                        <Input
                            id="resource_label"
                            value={formData.resource_label || ''}
                            onChange={(e) => setFormData({ ...formData, resource_label: e.target.value })}
                            placeholder="e.g. MacBook Pro M3"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="resource_key">SKU / Key</Label>
                        <Input
                            id="resource_key"
                            value={formData.resource_key || ''}
                            onChange={(e) => setFormData({ ...formData, resource_key: e.target.value })}
                            placeholder="e.g. HW-LP-001"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sub_category">Item Category / Type</Label>
                        <Popover open={openCategory} onOpenChange={setOpenCategory}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCategory}
                                    className="justify-between w-full font-normal"
                                >
                                    {formData.attributes?.sub_category || "Select or type new type..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-0" align="start">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search or add new category..." 
                                        onValueChange={setSearchStr}
                                        value={searchStr}
                                    />
                                    <CommandList>
                                        <CommandEmpty className="py-2 px-4 text-sm text-center">
                                            <p className="text-muted-foreground mb-2">"{searchStr}" not found.</p>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        attributes: { ...formData.attributes, sub_category: searchStr }
                                                    });
                                                    setOpenCategory(false);
                                                }}
                                                className="w-full gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Add "{searchStr}"
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {existingCategories.map((catName) => (
                                                <CommandItem
                                                    key={catName}
                                                    value={catName}
                                                    onSelect={(currentValue) => {
                                                        setFormData({
                                                            ...formData,
                                                            attributes: { ...formData.attributes, sub_category: catName }
                                                        });
                                                        setOpenCategory(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={`mr-2 h-4 w-4 ${formData.attributes?.sub_category === catName ? "opacity-100" : "opacity-0"}`}
                                                    />
                                                    {catName}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="total_stock" className="flex justify-between items-center text-muted-foreground">
                                Total Stock
                                <span className="text-[10px] bg-muted px-2 rounded">Read-only</span>
                            </Label>
                            <Input
                                id="total_stock"
                                type="number"
                                value={formData.attributes?.total_stock ?? 0}
                                disabled
                                className="bg-muted/50 cursor-not-allowed opacity-70"
                            />
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Stock is tracked via transaction logs (Receive, Issue, Adjust).
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max_stock">Max Alert Level</Label>
                            <Input
                                id="max_stock"
                                type="number"
                                value={formData.attributes?.max_stock ?? 0}
                                onChange={(e) => handleAttributeChange('max_stock', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold">Additional Specs/Attributes</Label>
                            <Button variant="outline" size="sm" onClick={addSpecField} className="h-7 px-2">
                                <Plus className="w-3 h-3 mr-1" /> Add Spec
                            </Button>
                        </div>
                        {specs.map((spec) => (
                            <div key={spec.id} className="flex gap-2 items-center">
                                <Input 
                                    placeholder="Property (e.g. RAM)" 
                                    value={spec.key}
                                    onChange={(e) => updateSpec(spec.id, 'key', e.target.value)}
                                    className="flex-1"
                                />
                                <Input 
                                    placeholder="Value (e.g. 32GB)" 
                                    value={spec.value}
                                    onChange={(e) => updateSpec(spec.id, 'value', e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeSpecField(spec.id)} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {specs.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-2 italic font-mono">No dimensions or specifications added yet.</p>
                        )}
                    </div>
                </div>
                <DialogFooter className="pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryModal;
