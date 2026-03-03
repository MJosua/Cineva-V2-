import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    InventoryItem,
    getStatusColor,
    getStatusLabel
} from '@/data/inventoryMockData';

interface InventoryTableProps {
    items: InventoryItem[];
    onItemClick?: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onItemClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter items based on search
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b border-border/50 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search inventory items, SKUs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background/50 border-border/50"
                    />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort By
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                            <th className="px-4 py-3 font-medium">SKU</th>
                            <th className="px-4 py-3 font-medium">Item Name</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium text-center">Quantity</th>
                            <th className="px-4 py-3 font-medium text-center">Min Level</th>
                            <th className="px-4 py-3 font-medium text-center">Status</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-border/30 hover:bg-accent/30 cursor-pointer transition-colors"
                                onClick={() => onItemClick?.(item)}
                            >
                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{item.sku}</td>
                                <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{item.category}</td>
                                <td className="px-4 py-3 text-sm text-center font-medium">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-center text-muted-foreground">{item.minLevel}</td>
                                <td className="px-4 py-3 text-center">
                                    <Badge
                                        variant="outline"
                                        className={`${getStatusColor(item.status)} border text-xs`}
                                    >
                                        {getStatusLabel(item.status)}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{item.location}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{item.lastUpdated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InventoryTable;
