import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from 'qrcode.react';
import { Download, Monitor, CheckCircle, AlertTriangle, Wrench, XCircle, History as HistoryIcon, MessageSquare, Plus, Loader2, User, MapPin, Building, Search as SearchIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { API_URL } from '@/config/sourceConfig';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface AssetInstance {
    id: number;
    resource_category: string;
    resource_key: string;
    resource_label: string;
    attributes: any;
    is_active: number;
    location_id?: number | null;
}

interface AssetDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    asset: AssetInstance | null;
    onUpdateCondition: (asset: AssetInstance, newCondition: string) => void;
}

const CONDITION_MAP: Record<string, { label: string, color: string, icon: any }> = {
    'good': { label: 'Good condition', color: 'bg-green-500/15 text-green-700 hover:bg-green-500/25', icon: CheckCircle },
    'fair': { label: 'Fair condition', color: 'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25', icon: AlertTriangle },
    'repair': { label: 'In Repair', color: 'bg-orange-500/15 text-orange-700 hover:bg-orange-500/25', icon: Wrench },
    'retired': { label: 'Retired', color: 'bg-red-500/15 text-red-700 hover:bg-red-500/25', icon: XCircle }
};

const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({ isOpen, onClose, asset, onUpdateCondition }) => {
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [reportedUser, setReportedUser] = useState('');
    const [auditCondition, setAuditCondition] = useState('good');
    const [locationText, setLocationText] = useState('');
    const [locationId, setLocationId] = useState<string>('');
    const [isOccupied, setIsOccupied] = useState(false);
    const [occupiedBy, setOccupiedBy] = useState<string>('');
    const [assignedUserLabel, setAssignedUserLabel] = useState('');
    
    const [locations, setLocations] = useState<any[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingMaster, setIsSavingMaster] = useState(false);
    const { toast } = useToast();

    const fetchTimeline = async () => {
        if (!asset) return;
        try {
            setLoadingTimeline(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/asset-timeline/${asset.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setTimeline(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch timeline:", err);
        } finally {
            setLoadingTimeline(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const locs = response.data.data.filter((item: any) => item.resource_category === 'storage_location');
                setLocations(locs);
            }
        } catch (err) {
            console.error("Failed to fetch locations:", err);
        }
    };

    // Update local state when asset prop changes
    React.useEffect(() => {
        if (asset) {
            setSelectedCondition(asset.attributes?.condition || 'good');
            setAuditCondition(asset.attributes?.condition || 'good');
            setLocationText(asset.attributes?.location_name || '');
            setLocationId(asset.location_id?.toString() || '');
            setIsOccupied(!!asset.attributes?.is_occupied);
            setOccupiedBy(asset.attributes?.occupied_by || '');
            setAssignedUserLabel(asset.attributes?.occupied_by || '');
            
            fetchTimeline();
            fetchLocations();
        }
    }, [asset]);

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setFoundUsers([]);
            return;
        }
        try {
            setIsSearchingUsers(true);
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/search/users?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setFoundUsers(response.data.data);
            }
        } catch (err) {
            console.error("User search failed:", err);
        } finally {
            setIsSearchingUsers(false);
        }
    };

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (userSearchQuery) searchUsers(userSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [userSearchQuery]);

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'media');
        const token = localStorage.getItem('hots_tokek');
        try {
            const resp = await axios.post(`${API_URL}/engine/upload-temp`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            return resp.data.url || resp.data.data?.[0]?.url || "";
        } catch (err: any) {
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
            return "";
        }
    };

    const handleSaveTimeline = async () => {
        if (!asset || !newNote.trim()) return;
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('hots_tokek');
            // Extract a summary from the rich text or just store the HTML
            const payload = {
                operation: 'audit',
                notes: {
                    html: newNote,
                    condition: auditCondition,
                    reported_user: reportedUser,
                    location: locationText,
                    timestamp: new Date().toISOString()
                }
            };
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-timeline/${asset.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast({ title: "Saved", description: "Timeline entry added successfully." });
                setNewNote('');
                setReportedUser('');
                fetchTimeline();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!asset) return null;

    const conditionData = CONDITION_MAP[selectedCondition] || CONDITION_MAP['good'];
    const ConditionIcon = conditionData.icon;

    const handleSaveMaster = async () => {
        if (!asset) return;
        try {
            setIsSavingMaster(true);
            const token = localStorage.getItem('hots_tokek');
            
            // Find location name for the ID
            const locName = locations.find(l => l.id.toString() === locationId)?.resource_label || locationText;

            const payload = {
                ...asset,
                location_id: locationId ? parseInt(locationId) : null,
                attributes: {
                    ...asset.attributes,
                    condition: selectedCondition,
                    is_occupied: isOccupied,
                    occupied_by: occupiedBy,
                    location_name: locName
                }
            };
            
            const response = await axios.post(`${API_URL}/hots_settings/post/asset-instance/upsert`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                toast({ title: "Updated", description: "Asset record updated successfully." });
                // We should call a refresh in parent, but let's assume SSE will handle it
                // If not, we can trigger onUpdateCondition slightly differently or pass a refresh prop
                onUpdateCondition(asset, selectedCondition); 
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSavingMaster(false);
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById("asset-qr-code");
        if (svg) {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = `QR_${asset.resource_key}.svg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Monitor className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">{asset.resource_label}</SheetTitle>
                            <SheetDescription className="text-sm font-medium pt-1">
                                SN: <span className="text-foreground tracking-wide">{asset.resource_key}</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
                            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Monitor className="w-4 h-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <HistoryIcon className="w-4 h-4" /> Timeline
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:ring-0">
                            {/* Status & Condition */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
                                    <div>
                                        <Badge variant={asset.is_active ? "default" : "secondary"}>
                                            {asset.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condition</Label>
                                    <div className="flex items-center">
                                        <Badge variant="outline" className={`flex gap-1.5 items-center ${conditionData.color} border-0`}>
                                            <ConditionIcon className="w-3.5 h-3.5" />
                                            {conditionData.label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Section */}
                            <div className="bg-muted/30 border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border">
                                    <QRCodeSVG 
                                        id="asset-qr-code" 
                                        value={`${window.location.origin}/inventory/asset/${asset.resource_category}/${asset.resource_key}`} 
                                        size={180} 
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-semibold">Asset Tag QR Code</p>
                                    <p className="text-xs text-muted-foreground w-64">Scan to instantly view or update this specific asset history.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadQR} className="mt-2 w-full gap-2">
                                    <Download className="w-4 h-4" /> Download SVG
                                </Button>
                            </div>

                            {/* Update Section */}
                            <div className="space-y-6 pt-4 border-t">
                                <h4 className="text-sm font-semibold tracking-tight">Assignment & Residency</h4>
                                
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-dashed border-border/60">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Occupancy Status</Label>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Is this asset currently in use?</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-[10px] font-bold uppercase", isOccupied ? "text-blue-500" : "text-muted-foreground")}>
                                                {isOccupied ? "Occupied" : "Available"}
                                            </span>
                                            <Switch checked={isOccupied} onCheckedChange={setIsOccupied} />
                                        </div>
                                    </div>

                                    {isOccupied && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-xs font-semibold">Assigned To (User)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between h-10 px-3 bg-background font-normal"
                                                    >
                                                        {assignedUserLabel || "Search user to assign..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput 
                                                            placeholder="Type name or UID..." 
                                                            value={userSearchQuery}
                                                            onValueChange={setUserSearchQuery}
                                                        />
                                                        <CommandList>
                                                            {isSearchingUsers ? (
                                                                <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                                                            ) : foundUsers.length === 0 ? (
                                                                <CommandEmpty>No users found.</CommandEmpty>
                                                            ) : (
                                                                <CommandGroup>
                                                                    {foundUsers.map((user) => (
                                                                        <CommandItem
                                                                            key={user.user_id}
                                                                            value={user.user_id.toString()}
                                                                            onSelect={() => {
                                                                                const fullName = `${user.firstname} ${user.lastname || ''}`.trim();
                                                                                setOccupiedBy(fullName);
                                                                                setAssignedUserLabel(fullName);
                                                                                setFoundUsers([]);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    occupiedBy === `${user.firstname} ${user.lastname || ''}`.trim() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex flex-col">
                                                                                <span>{user.firstname} {user.lastname}</span>
                                                                                <span className="text-[10px] text-muted-foreground uppercase">{user.uid}</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Current Physical Location</Label>
                                        <Select value={locationId} onValueChange={setLocationId}>
                                            <SelectTrigger className="w-full h-10 px-3 bg-background">
                                                <SelectValue placeholder="Select storage location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(loc => (
                                                    <SelectItem key={loc.id} value={loc.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3 h-3 text-red-500" />
                                                            <span>{loc.resource_label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Overall Condition</Label>
                                        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                                            <SelectTrigger className="w-full h-10 px-3 bg-background">
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="good">Good condition</SelectItem>
                                                <SelectItem value="fair">Fair condition</SelectItem>
                                                <SelectItem value="repair">In Repair / Maintenance</SelectItem>
                                                <SelectItem value="retired">Retired / Scheduled for Replacement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="timeline" className="space-y-6 mt-0 focus-visible:ring-0">
                            {/* New Entry Form */}
                            <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold">Log New Incident / Maintenance</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Current User</Label>
                                        <Input 
                                            placeholder="Enter user name..." 
                                            value={reportedUser}
                                            onChange={(e) => setReportedUser(e.target.value)}
                                            className="h-8 text-xs bg-background"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Condition</Label>
                                        <Select value={auditCondition} onValueChange={setAuditCondition}>
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="good">Good</SelectItem>
                                                <SelectItem value="fair">Fair</SelectItem>
                                                <SelectItem value="repair">Maintenance</SelectItem>
                                                <SelectItem value="retired">Retired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Location</Label>
                                        <div className="relative">
                                            <Input 
                                                placeholder="Type location name (e.g. WH-01, Office A)..." 
                                                value={locationText}
                                                onChange={(e) => setLocationText(e.target.value)}
                                                className="h-8 text-xs bg-background"
                                                list="location-suggestions"
                                            />
                                            <datalist id="location-suggestions">
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.resource_label} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Log Details</Label>
                                    <RichTextEditor 
                                    value={newNote}
                                    onChange={setNewNote}
                                    onImageUpload={handleImageUpload}
                                    placeholder="Describe current condition, maintenance performed, or any observations..."
                                    minHeight="120px"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={handleSaveTimeline} disabled={isSubmitting || !newNote.trim()} className="h-9 px-4 gap-2">
                                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        Post to Timeline
                                    </Button>
                                </div>
                            </div>
                        </div>

                            {/* Timeline Feed */}
                            <div className="space-y-6 relative pt-4">
                                <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-border/40" />
                                {loadingTimeline ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                                ) : timeline.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground py-10 italic">No history recorded for this unit yet.</p>
                                ) : (
                                    timeline.map((log, idx) => (
                                        <div key={log.id} className="relative pl-10 group">
                                            <div className="absolute left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{log.operation}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                                </div>
                                                <div className="bg-muted/30 group-hover:bg-muted/50 p-3 rounded-lg border border-border/30 transition-colors">
                                                    {typeof log.notes === 'object' ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm rich-text-content" dangerouslySetInnerHTML={{ __html: log.notes.html }} />
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {log.notes.condition && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 font-bold border-primary/20 bg-green-500/5 text-green-700 uppercase">
                                                                        {log.notes.condition}
                                                                    </Badge>
                                                                )}
                                                                {log.notes.reported_user && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 font-bold border-blue-500/20 bg-blue-500/5 text-blue-700 uppercase">
                                                                        User: {log.notes.reported_user}
                                                                    </Badge>
                                                                )}
                                                                {log.notes.location && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 font-bold border-orange-500/20 bg-orange-500/5 text-orange-700 uppercase">
                                                                        Loc: {log.notes.location}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-foreground/80">{log.notes}</p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground pl-1 italic">By {log.user_name || 'System'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <SheetFooter className="mt-6 pt-6 border-t flex-col sm:flex-row gap-2">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                    </SheetClose>
                    <Button 
                        onClick={handleSaveMaster} 
                        className="w-full sm:w-auto shadow-lg shadow-primary/20" 
                        disabled={isSavingMaster || (
                            selectedCondition === asset.attributes?.condition && 
                            isOccupied === !!asset.attributes?.is_occupied &&
                            occupiedBy === (asset.attributes?.occupied_by || '') &&
                            locationId === (asset.location_id?.toString() || '')
                        )}
                    >
                        {isSavingMaster ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Master Updates
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default AssetDetailDrawer;
