import React, { useState, useMemo } from 'react';
import {
    Search, Filter, ChevronLeft, ChevronRight,
    ArrowUpDown, Edit, Trash2, MapPin,
    ArrowUp, ArrowDown, ListFilter,
    Package, LayoutGrid, PlusCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    InventoryItem,
    getStatusColor,
    getStatusLabel
} from '@/data/inventoryMockData';


interface InventoryTableProps {
    items: InventoryItem[];
    onItemClick?: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
    onSelect?: (item: InventoryItem) => void;
    onAction?: (item: InventoryItem, operation: 'receive' | 'issue' | 'adjust' | 'transfer') => void;
    onAddClick?: () => void;
    selectedId?: number | null;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
    items,
    onItemClick,
    onDelete,
    onSelect,
    onAction,
    onAddClick,
    selectedId
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const itemsPerPage = 10;

    // 1. Process Data (Unique SKUs only)
    const processedItems = useMemo(() => {
        let result = items.filter(item => {
            if (item.is_active === 0) return false;
            const label = (item.resource_label || item.name || '').toLowerCase();
            const key = (item.resource_key || item.sku || '').toLowerCase();
            const cat = (item.attributes?.sub_category || item.resource_category || '').toLowerCase();
            const query = searchQuery.toLowerCase();

            const matchesSearch = label.includes(query) || key.includes(query) || cat.includes(query);

            // Filter by sub_category
            const matchesCategory = filterCategory === 'all' ||
                (item.attributes?.sub_category || item.resource_category) === filterCategory;

            return matchesSearch && matchesCategory;
        });

        // 2. Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any, bValue: any;

                switch (sortConfig.key) {
                    case 'sku': aValue = a.resource_key; bValue = b.resource_key; break;
                    case 'name': aValue = a.resource_label; bValue = b.resource_label; break;
                    case 'category': aValue = a.attributes?.sub_category || a.resource_category; bValue = b.attributes?.sub_category || b.resource_category; break;
                    case 'stock': aValue = a.attributes?.total_stock || 0; bValue = b.attributes?.total_stock || 0; break;
                    default: return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, searchQuery, sortConfig, filterCategory]);

    // Pagination
    const totalPages = Math.ceil(processedItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = processedItems.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Extract unique active categories for the filter
    const activeCategories = useMemo(() => {
        const cats = items.map(i => i.attributes?.sub_category || i.resource_category).filter(Boolean);
        return Array.from(new Set(cats)).sort();
    }, [items]);

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (!sortConfig || sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
    };

    return (
        <div className="  bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 items-center bg-background/20">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search SKU, Name, or Location..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="pl-10 bg-background/50 border-border/50 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {onAddClick && (
                        <Button onClick={onAddClick} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            <PlusCircle className="w-4 h-4" />
                            Add New Item
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={`gap-2 ${filterCategory !== 'all' ? 'border-primary text-primary' : ''}`}>
                                <ListFilter className="w-4 h-4" />
                                {filterCategory === 'all' ? 'All Categories' : filterCategory.replace('_', ' ')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={filterCategory} onValueChange={setFilterCategory}>
                                <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
                                {activeCategories.map(cat => (
                                    <DropdownMenuRadioItem key={cat} value={cat}>
                                        {cat.replace(/_/g, ' ')}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(filterCategory !== 'all' || searchQuery !== '') && (
                        <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setFilterCategory('all'); }} className="text-muted-foreground h-8 px-2 hover:bg-transparent hover:text-primary">
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto ">
                <table className="w-full  border-collapse">
                    <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                        <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('sku')}>
                                <div className="flex items-center">Key / SKU <SortIcon colKey="sku" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center">Item Name <SortIcon colKey="name" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('category')}>
                                <div className="flex items-center">Category <SortIcon colKey="category" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('stock')}>
                                <div className="flex items-center justify-center">Total Stock <SortIcon colKey="stock" /></div>
                            </th>
                            <th className="px-4 py-3 font-semibold text-center">UoM</th>
                            <th className="px-4 py-3 font-semibold text-center">Status</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {paginatedItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-20 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center">
                                        <Package className="w-12 h-12 mb-2 opacity-10" />
                                        <p>No inventory matches found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedItems.map((item) => (
                            <tr
                                key={item.id}
                                className={`group hover:bg-accent/20 transition-all cursor-pointer ${selectedId === item.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
                                    }`}
                                onClick={() => onSelect?.(item)}
                            >
                                <td className="px-4 py-4 text-xs font-mono text-muted-foreground select-all">{item.resource_key || item.sku}</td>
                                <td className="px-4 py-4">
                                    <div className="text-sm font-semibold">{item.resource_label || item.name}</div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-xs text-muted-foreground uppercase opacity-80 whitespace-nowrap">
                                        {item.attributes?.sub_category
                                            ? item.attributes.sub_category.replace(/_/g, ' ')
                                            : item.resource_category.replace(/_/g, ' ')}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`text-sm font-bold ${(item.attributes?.total_stock || 0) <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {item.attributes?.total_stock || 0}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-muted-foreground uppercase">
                                    {item.attributes?.uom || 'pcs'}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Badge
                                        variant="outline"
                                        className={`${getStatusColor(item.status)} border text-[10px] py-0 h-5`}
                                    >
                                        {getStatusLabel(item.status)}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-500/10"
                                            title="Quick Receive (Add Stock)"
                                            onClick={(e) => { e.stopPropagation(); onAction?.(item, 'receive'); }}
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-400/10"
                                            onClick={(e) => { e.stopPropagation(); onItemClick?.(item); }}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-400/10"
                                            onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between text-xs bg-background/20 shrink-0">
                <span className="text-muted-foreground font-medium">
                    Showing <span className="text-foreground">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedItems.length)}</span> of <span className="text-foreground">{processedItems.length}</span> entries
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="h-8 gap-1"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        Prev
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((page, index, array) => (
                                <div key={page} className="contents">
                                    {index > 0 && array[index - 1] !== page - 1 && <span className="px-1 opacity-50">...</span>}
                                    <Button
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        className={`w-8 h-8 p-0 ${currentPage === page ? 'shadow-lg' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                </div>
                            ))
                        }
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="h-8 gap-1"
                    >
                        Next
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InventoryTable;
