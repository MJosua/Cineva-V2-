import React, { useState, useEffect } from 'react';
import { Search, Filter, BoxSelect, Loader2, SearchX, PlusCircle, X, DownloadCloud, LayoutGrid, Layers, Activity, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import AssetDetailDrawer from '@/components/inventory/AssetDetailDrawer';
import AssetInstanceModal from '@/components/inventory/AssetInstanceModal';
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from "framer-motion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AssetInstance {
    id: number;
    resource_category: string;
    resource_key: string;
    resource_label: string;
    attributes: {
        sku_id?: string | number;
        sku_ref?: string;
        condition?: string;
        location_id?: string | number;
        location_name?: string;
        is_occupied?: boolean;
        occupied_by?: string | null;
        registered_date?: string;
        [key: string]: any;
    };
    is_active: number;
    location_id?: number | null;
    created_at?: string;
}

interface AssetRegistryViewProps {
    category: string;
}

const CONDITION_COLORS: Record<string, string> = {
    'good': 'bg-green-100 text-green-700 border-green-200',
    'fair': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'repair': 'bg-orange-100 text-orange-700 border-orange-200',
    'retired': 'bg-red-100 text-red-700 border-red-200'
};

const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ category }) => {
    const [assets, setAssets] = useState<AssetInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<AssetInstance | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [skus, setSkus] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    
    // Bulk Actions State
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [targetLocationId, setTargetLocationId] = useState<string>('');
    
    // Advanced Grid State
    const [sortBy, setSortBy] = useState<string>('resource_key');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [groupBy, setGroupBy] = useState<'none' | 'sku_id' | 'location_id' | 'registered_date'>('none');
    const [filterCondition, setFilterCondition] = useState<string>('all');
    const [filterLocation, setFilterLocation] = useState<string>('all');
    const [filterOccupancy, setFilterOccupancy] = useState<string>('all');

    const { toast } = useToast();

    const sseInventorySignal = useAppSelector(state => state.tickets.sseSignals?.inventory);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/asset-instances/${category}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setAssets(response.data.data);
                if (selectedAsset) {
                    const fresh = response.data.data.find((a: any) => a.id === selectedAsset.id);
                    if (fresh) setSelectedAsset(fresh);
                }
            }
        } catch (err) {
            console.error(`Failed to fetch ${category} instances:`, err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const allData = response.data.data;
                setSkus(allData.filter((i: any) => i.resource_category === category));
                setLocations(allData.filter((i: any) => i.resource_category === 'storage_location'));
            }
        } catch (err) {
            console.error("Failed to fetch Master Data for Asset Registry:", err);
        }
    };

    useEffect(() => {
        fetchAssets();
        fetchMasterData();
    }, [category]);

    useEffect(() => {
        if (sseInventorySignal) {
            fetchAssets();
        }
    }, [sseInventorySignal]);

    const handleBulkMove = async () => {
        if (!targetLocationId || selectedIds.size === 0) return;
        
        try {
            setIsBulkLoading(true);
            const token = localStorage.getItem('hots_tokek');
            const locationName = locations.find(l => l.id.toString() === targetLocationId)?.resource_label || '';
            
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-instances/bulk-update`, {
                ids: Array.from(selectedIds),
                updates: {
                    location_id: parseInt(targetLocationId),
                    location_name: locationName,
                    log_operation: 'transfer',
                    log_notes: `Bulk transfer to ${locationName}`
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({ title: "Bulk Move SUCCESS", description: `Successfully moved ${selectedIds.size} assets.` });
                setSelectedIds(new Set());
                setIsLocationModalOpen(false);
                fetchAssets();
            }
        } catch (err: any) {
            toast({ title: "Bulk Move Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleBulkRelease = async () => {
        if (selectedIds.size === 0) return;
        
        if (!confirm(`Are you sure you want to release ${selectedIds.size} selected assets? This will mark them as Available and remove current assignments.`)) {
            return;
        }

        try {
            setIsBulkLoading(true);
            const token = localStorage.getItem('hots_tokek');
            
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-instances/bulk-update`, {
                ids: Array.from(selectedIds),
                updates: {
                    is_occupied: false,
                    occupied_by: null,
                    log_operation: 'release',
                    log_notes: 'Bulk released to Available stock'
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({ title: "Bulk Release SUCCESS", description: `Successfully released ${selectedIds.size} assets.` });
                setSelectedIds(new Set());
                fetchAssets();
            }
        } catch (err: any) {
            toast({ title: "Bulk Release Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleSaveInstance = async (data: Partial<AssetInstance>) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-instance/upsert`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Success", description: "Asset unit registered successfully." });
                setIsModalOpen(false);
                fetchAssets();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to register unit.", variant: "destructive" });
        }
    };

    const handleUpdateCondition = async (asset: AssetInstance, newCondition: string) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const payload = {
                ...asset,
                attributes: { ...asset.attributes, condition: newCondition }
            };
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-instance/upsert`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Updated", description: `Asset ${asset.resource_key} condition marked as ${newCondition}.` });
                setIsDrawerOpen(false);
                fetchAssets();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to update asset condition.", variant: "destructive" });
        }
    };

    const sortedAndFilteredAssets = React.useMemo(() => {
        let result = assets.filter(asset => asset.is_active !== 0);

        // 1. Filtering
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a => 
                a.resource_key.toLowerCase().includes(term) ||
                a.resource_label.toLowerCase().includes(term) ||
                a.attributes.sku_ref?.toLowerCase().includes(term)
            );
        }

        if (filterCondition !== 'all') {
            result = result.filter(a => (a.attributes.condition || 'good') === filterCondition);
        }

        if (filterLocation !== 'all') {
            result = result.filter(a => a.attributes.location_id?.toString() === filterLocation);
        }

        if (filterOccupancy !== 'all') {
            const isOcc = filterOccupancy === 'occupied';
            result = result.filter(a => !!a.attributes.is_occupied === isOcc);
        }

        // 2. Sorting
        result.sort((a, b) => {
            let valA: any, valB: any;

            switch (sortBy) {
                case 'resource_key':
                    valA = a.resource_key;
                    valB = b.resource_key;
                    break;
                case 'resource_label':
                    valA = a.resource_label;
                    valB = b.resource_label;
                    break;
                case 'location':
                    valA = locations.find(l => l.id.toString() === a.attributes.location_id?.toString())?.resource_label || '';
                    valB = locations.find(l => l.id.toString() === b.attributes.location_id?.toString())?.resource_label || '';
                    break;
                case 'condition':
                    valA = a.attributes.condition || 'good';
                    valB = b.attributes.condition || 'good';
                    break;
                case 'date':
                    valA = a.attributes.registered_date || a.created_at || '';
                    valB = b.attributes.registered_date || b.created_at || '';
                    break;
                case 'occupancy':
                    valA = a.attributes.is_occupied ? 1 : 0;
                    valB = b.attributes.is_occupied ? 1 : 0;
                    break;
                default:
                    valA = a.id;
                    valB = b.id;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [assets, searchTerm, filterCondition, filterLocation, filterOccupancy, sortBy, sortOrder, locations]);

    const groupedAssets = React.useMemo(() => {
        if (groupBy === 'none') return { 'All Assets': sortedAndFilteredAssets };

        const groups: Record<string, AssetInstance[]> = {};
        sortedAndFilteredAssets.forEach(asset => {
            let groupKey = 'Other';
            
            if (groupBy === 'sku_id') {
                groupKey = asset.attributes.sku_ref || 'Uncategorized';
            } else if (groupBy === 'location_id') {
                groupKey = locations.find(l => l.id.toString() === asset.attributes.location_id?.toString())?.resource_label || 'Default Location';
            } else if (groupBy === 'registered_date') {
                groupKey = asset.attributes.registered_date || 'Unknown Date';
            }

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(asset);
        });

        return groups;
    }, [sortedAndFilteredAssets, groupBy, locations]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const toggleRow = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === sortedAndFilteredAssets.length && sortedAndFilteredAssets.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedAndFilteredAssets.map(a => a.id)));
        }
    };

    const handleRowClick = (asset: AssetInstance, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.checkbox-cell')) return;
        setSelectedAsset(asset);
        setIsDrawerOpen(true);
    };

    const generateBulkQRPDF = async () => {
        const selectedAssets = assets.filter(a => selectedIds.has(a.id));
        if (selectedAssets.length === 0) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const labelWidth = 60, labelHeight = 35, margin = 10, cols = 3, padding = 5;

        toast({ title: "Generating Labels", description: `Preparing ${selectedAssets.length} asset tags...` });

        for (let i = 0; i < selectedAssets.length; i++) {
            const asset = selectedAssets[i];
            const col = i % cols;
            const row = Math.floor((i % (cols * 5)) / cols);

            if (i > 0 && i % (cols * 5) === 0) doc.addPage();

            const x = margin + col * (labelWidth + padding);
            const y = margin + row * (labelHeight + padding);

            doc.setDrawColor(230);
            doc.rect(x, y, labelWidth, labelHeight);

            const qrCanvas = document.getElementById(`qr-gen-${asset.id}`) as HTMLCanvasElement;
            if (qrCanvas) {
                const qrData = qrCanvas.toDataURL("image/png");
                doc.addImage(qrData, 'PNG', x + 2, y + 2, 20, 20);
            }

            doc.setTextColor(50);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(asset.resource_label.substring(0, 25), x + 25, y + 6);
            
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.text(`SN: ${asset.resource_key}`, x + 25, y + 10);
            
            doc.setFontSize(6);
            doc.setTextColor(100);
            const sku = skus.find(s => s.id.toString() === asset.attributes?.sku_id);
            doc.text(`SKU: ${sku?.resource_key || 'N/A'}`, x + 25, y + 14);
            
            const loc = locations.find(l => l.id.toString() === asset.attributes?.location_id);
            doc.text(`LOC: ${loc?.resource_label || 'Default'}`, x + 25, y + 18);

            doc.setFontSize(5);
            doc.text("HOTS INVENTORY SYSTEM", x + 25, y + labelHeight - 4);
        }

        doc.save(`Asset_Labels_${category}_${new Date().getTime()}.pdf`);
        toast({ title: "Success", description: "Labels downloaded successfully." });
    };

    if (loading && assets.length === 0) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative pb-20">
            <AssetDetailDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                asset={selectedAsset}
                onUpdateCondition={handleUpdateCondition}
            />
            
            <AssetInstanceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveInstance} 
                category={category} 
                skus={skus}
                locations={locations}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by SN, Label, or Model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background/50 border-border/60"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
                        <PlusCircle className="w-4 h-4" /> Register Unit
                    </Button>
                </div>
            </div>

            {/* Filter Toolbelt */}
            <div className="flex flex-wrap items-center gap-3 p-2 bg-muted/20 rounded-xl border border-border/30">
                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/40">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Group By</span>
                    <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                        <SelectTrigger className="h-7 w-[130px] text-[11px] border-none bg-transparent shadow-none focus:ring-0">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="sku_id">Master SKU</SelectItem>
                            <SelectItem value="location_id">Storage Location</SelectItem>
                            <SelectItem value="registered_date">Registration Date</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/40">
                    <Activity className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Condition</span>
                    <Select value={filterCondition} onValueChange={setFilterCondition}>
                        <SelectTrigger className="h-7 w-[100px] text-[11px] border-none bg-transparent shadow-none focus:ring-0">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Condition</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Occupancy</span>
                    <Select value={filterOccupancy} onValueChange={setFilterOccupancy}>
                        <SelectTrigger className="h-7 w-[110px] text-[11px] border-none bg-transparent shadow-none focus:ring-0">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Location</span>
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="h-7 w-[130px] text-[11px] border-none bg-transparent shadow-none focus:ring-0">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                    {loc.resource_label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(filterCondition !== 'all' || filterLocation !== 'all' || filterOccupancy !== 'all' || groupBy !== 'none' || searchTerm) && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setFilterCondition('all');
                            setFilterLocation('all');
                            setFilterOccupancy('all');
                            setGroupBy('none');
                            setSearchTerm('');
                        }}
                        className="h-7 px-2 text-[10px] gap-1 hover:bg-red-400/10 hover:text-red-400"
                    >
                        <X className="w-3 h-3" /> Reset Filters
                    </Button>
                )}
            </div>

            <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/30">
                                <TableHead className="w-[40px] checkbox-cell">
                                    <Checkbox 
                                        checked={selectedIds.size > 0 && selectedIds.size === sortedAndFilteredAssets.length} 
                                        onCheckedChange={toggleAll}
                                    />
                                </TableHead>
                                <TableHead 
                                    className="w-[180px] font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('resource_key')}
                                >
                                    Serial Number / Tag {sortBy === 'resource_key' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead 
                                    className="min-w-[200px] font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('resource_label')}
                                >
                                    Asset Name & SKU {sortBy === 'resource_label' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead 
                                    className="w-[140px] font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('location')}
                                >
                                    Location {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead 
                                    className="w-[120px] font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('condition')}
                                >
                                    Condition {sortBy === 'condition' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead 
                                    className="w-[120px] font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('occupancy')}
                                >
                                    Occupied {sortBy === 'occupancy' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead className="w-[100px] text-right font-semibold tracking-tight">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAndFilteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <SearchX className="w-10 h-10 shadow-sm mb-4 opacity-20" />
                                            <p className="text-base font-medium">No serialized assets found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.keys(groupedAssets).map(groupName => (
                                    <React.Fragment key={groupName}>
                                        {groupBy !== 'none' && (
                                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                <TableCell colSpan={7} className="py-2 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                            {groupName} ({groupedAssets[groupName].length})
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {groupedAssets[groupName].map((asset) => {
                                            const condition = asset.attributes?.condition || 'good';
                                            const conditionStyle = CONDITION_COLORS[condition] || CONDITION_COLORS['good'];
                                            const isOccupied = !!asset.attributes?.is_occupied;
                                            return (
                                                <TableRow 
                                                    key={asset.id} 
                                                    className={`group hover:bg-muted/50 transition-colors cursor-pointer ${selectedIds.has(asset.id) ? 'bg-primary/5' : ''}`}
                                                    onClick={(e) => handleRowClick(asset, e)}
                                                >
                                                    <TableCell className="checkbox-cell">
                                                        <Checkbox 
                                                            checked={selectedIds.has(asset.id)} 
                                                            onCheckedChange={() => toggleRow(asset.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <BoxSelect className="w-4 h-4 text-muted-foreground opacity-50" />
                                                            <span className="font-mono text-xs font-semibold bg-muted px-2 py-1 rounded">
                                                                {asset.resource_key}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm leading-tight text-foreground/90">{asset.resource_label}</span>
                                                            {asset.attributes?.sku_ref && (
                                                                <span className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-wide">
                                                                    {asset.attributes.sku_ref}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                                                            <Badge variant="outline" className="text-[10px] font-mono opacity-70 px-1 border-primary/20 bg-primary/5">
                                                                {asset.attributes?.location_id || 'N/A'}
                                                            </Badge>
                                                            <span className="truncate max-w-[100px]">
                                                                {locations.find(l => l.id.toString() === asset.attributes?.location_id?.toString())?.resource_label || 'Default'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`${conditionStyle} uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 border-none`}>
                                                            {condition}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-[10px] tracking-wider font-semibold border-none ${isOccupied ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {isOccupied ? 'Occupied' : 'Available'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">Audit / Scan</Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="hidden">
                {assets.map(asset => (
                    <QRCodeCanvas 
                        key={asset.id}
                        id={`qr-gen-${asset.id}`}
                        value={JSON.stringify({ id: asset.id, sn: asset.resource_key, cat: asset.resource_category })}
                        size={128}
                    />
                ))}
            </div>

            {/* Bulk Actions Floating Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="flex items-center gap-3 pr-4 border-r border-white/20">
                            <div className="bg-blue-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                                {selectedIds.size}
                            </div>
                            <span className="text-sm font-medium">Items Selected</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsLocationModalOpen(true)}
                                className="text-white hover:bg-white/10 gap-2"
                            >
                                <LayoutGrid className="w-4 h-4" /> Move Location
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleBulkRelease}
                                className="text-white hover:bg-white/10 gap-2"
                            >
                                <X className="w-4 h-4" /> Mark Available
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={generateBulkQRPDF}
                                className="text-white hover:bg-white/10 gap-2"
                            >
                                <DownloadCloud className="w-4 h-4" /> Download QR Labels
                            </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Move Modal */}
            <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Move {selectedIds.size} Assets</DialogTitle>
                        <DialogDescription>
                            Select the destination storage location for all selected equipment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 flex items-center gap-3 mb-2">
                            <LayoutGrid className="w-5 h-5 text-blue-500" />
                            <p className="text-xs text-blue-700">Select the destination storage location for all selected equipment.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetLocation">Destination Location</Label>
                            <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                                <SelectTrigger id="targetLocation">
                                    <SelectValue placeholder="Select location..." />
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLocationModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkMove} disabled={!targetLocationId || isBulkLoading}>
                            {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Update Location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AssetRegistryView;
