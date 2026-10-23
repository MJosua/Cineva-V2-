import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash, Plus } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';

interface OrderItem {
    id: number;
    code: string;
    name: string;
    qty: number;
    price: number;
}

const OrderItemsWidget: React.FC<WidgetProps> = ({ data, handleUpdateData }) => {
    const [items, setItems] = useState<OrderItem[]>([]);
    const [newItem, setNewItem] = useState<Partial<OrderItem>>({});

    const addItem = () => {
        if (!newItem.code || !newItem.qty) return;
        const item: OrderItem = {
            id: Date.now(),
            code: newItem.code,
            name: newItem.name || 'Unknown Item',
            qty: Number(newItem.qty),
            price: Number(newItem.price || 0),
        };
        const updated = [...items, item];
        setItems(updated);
        setNewItem({});

        // Sync with parent form context if callback provided
        handleUpdateData && handleUpdateData({ order_items: updated });
    };

    const removeItem = (id: number) => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        handleUpdateData && handleUpdateData({ order_items: updated });
    };

    const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold">Order Items (E-Order Widget)</h3>

            <div className="flex gap-2 items-end">
                <div className="grid gap-1 flex-1">
                    <label className="text-xs">Item Code</label>
                    <Input
                        value={newItem.code || ''}
                        onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                        placeholder="E.g. IND-001"
                    />
                </div>
                <div className="grid gap-1 flex-[2]">
                    <label className="text-xs">Item Name</label>
                    <Input
                        value={newItem.name || ''}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Indomie Goreng"
                    />
                </div>
                <div className="grid gap-1 w-20">
                    <label className="text-xs">Qty</label>
                    <Input
                        type="number"
                        value={newItem.qty || ''}
                        onChange={e => setNewItem({ ...newItem, qty: Number(e.target.value) })}
                    />
                </div>
                <div className="grid gap-1 w-24">
                    <label className="text-xs">Price</label>
                    <Input
                        type="number"
                        value={newItem.price || ''}
                        onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    />
                </div>
                <Button onClick={addItem} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">No items added</TableCell>
                        </TableRow>
                    )}
                    {items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">{item.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(item.qty * item.price).toLocaleString()}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                    <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex justify-end font-bold text-lg">
                Total: Rp {total.toLocaleString()}
            </div>
        </div>
    );
};

export default OrderItemsWidget;
