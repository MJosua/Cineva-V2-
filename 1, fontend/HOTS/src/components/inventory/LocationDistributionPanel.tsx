import React from 'react';
import {
    MapPin, ArrowUpCircle, RefreshCw,
    ArrowLeftRight, Package, Info,
    PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/data/inventoryMockData';

interface LocationDistributionPanelProps {
    item: InventoryItem | null;
    onAction: (operation: 'receive' | 'issue' | 'adjust' | 'transfer', locationId?: string) => void;
}

const LocationDistributionPanel: React.FC<LocationDistributionPanelProps> = ({
    item,
    onAction
}) => {
    if (!item) {
        return (
            <div className="min-h-[500px] max-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-card/20 border border-dashed border-border/50 rounded-xl">
                <div className="p-4 rounded-full bg-primary/5 mb-4">
                    <Package className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="font-semibold text-lg">No Item Selected</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
                    Select an item from the list to view its storage distribution.
                </p>
            </div>
        );
    }

    const stocks = item.attributes?.stocks || {};
    const locations = Object.keys(stocks).filter(id => stocks[id] > 0);
    const locationNames = item.attributes?.location_names || {};

    return (
        <div className="max-h-[500px] min-h-[500px] flex flex-col bg-card/30 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-primary/5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter mb-1">
                            {item.resource_category}
                        </Badge>
                        <h3 className="font-bold text-sm leading-tight">{item.resource_label}</h3>
                        <p className="font-mono text-[10px] text-muted-foreground">{item.resource_key}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                    <div className="text-center flex-1">
                        <p className="text-[9px] text-muted-foreground uppercase">Total Stock</p>
                        <p className={`text-lg font-black ${item.attributes.total_stock <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {item.attributes.total_stock}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="text-center flex-1">
                        <p className="text-[9px] text-muted-foreground uppercase">Locations</p>
                        <p className="text-lg font-black text-foreground">{locations.length}</p>
                    </div>
                </div>
            </div>

            {/* Content Slot / List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Storage Distribution
                    </h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => onAction('receive')}
                    >
                        <PlusCircle className="w-3 h-3" />
                        Receive New
                    </Button>
                </div>

                {locations.length === 0 ? (
                    <div className="py-12 flex flex-col items-center text-center px-4 space-y-3">
                        <div className="p-3 rounded-xl bg-orange-500/10">
                            <Info className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium">Physical Stock Empty</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                This item exists in your catalog but is not physically stored in any location.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 h-8 text-[11px]"
                                onClick={() => onAction('receive')}
                            >
                                Process Intake
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {locations.map(locId => (
                            <div
                                key={locId}
                                className="group p-3 rounded-lg border border-border/50 bg-background/20 hover:border-primary/30 hover:bg-primary/5 transition-all"
                            >
                                <div className="flex items-start justify-between">

                                    {/* LEFT */}
                                    <div className="flex gap-3 items-start">
                                        <div className="p-2 bg-muted rounded-lg">
                                            <MapPin className="w-4 h-4" />
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">
                                                {locationNames[locId] || 'Unknown Location'}
                                            </span>

                                            <span className="text-xs text-muted-foreground font-mono">
                                                ID: {locId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="flex flex-col items-end">

                                        {/* NUMBER */}
                                        <span className="text-3xl font-bold text-blue-500 leading-none tabular-nums">
                                            {stocks[locId]}
                                        </span>

                                        {/* PCS + CURRENT */}
                                        <span className="text-xs text-muted-foreground">
                                            {item.attributes.uom || 'PCS'}
                                        </span>

                                    </div>

                                </div>

                                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 flex-1 text-[10px] gap-1 hover:bg-red-400/10 hover:text-red-400"
                                        onClick={() => onAction('issue', locId)}
                                    >
                                        <ArrowUpCircle className="w-3 h-3" />
                                        Issue
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 flex-1 text-[10px] gap-1 hover:bg-purple-400/10 hover:text-purple-400"
                                        onClick={() => onAction('transfer', locId)}
                                    >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        Transfer
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 hover:bg-amber-400/10 hover:text-amber-400"
                                        onClick={() => onAction('adjust', locId)}
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Info */}
            <div className="p-3 bg-muted/30 border-t border-border/50">
                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-2.5 h-2.5" />
                    Last audit: {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default LocationDistributionPanel;
