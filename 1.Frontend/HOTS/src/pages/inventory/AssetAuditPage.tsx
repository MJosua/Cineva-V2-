import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Monitor, History as HistoryIcon, MessageSquare, Plus, Loader2, CheckCircle, AlertTriangle, Wrench, XCircle, ChevronLeft, Calendar, User } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from 'react-router-dom';

const CONDITION_MAP: Record<string, { label: string, color: string, icon: any }> = {
    'good': { label: 'Good condition', color: 'bg-green-500/15 text-green-700', icon: CheckCircle },
    'fair': { label: 'Fair condition', color: 'bg-yellow-500/15 text-yellow-700', icon: AlertTriangle },
    'repair': { label: 'In Repair', color: 'bg-orange-500/15 text-orange-700', icon: Wrench },
    'retired': { label: 'Retired', color: 'bg-red-500/15 text-red-700', icon: XCircle }
};

const AssetAuditPage: React.FC = () => {
    const { category, sn } = useParams();
    const location = useLocation();
    const isPublicMode = location.pathname.startsWith('/hots/inventory/');

    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportedUser, setReportedUser] = useState('');
    const [auditCondition, setAuditCondition] = useState('good');
    const [locationText, setLocationText] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [sku, setSku] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [uid, setUid] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const { toast } = useToast();

    const fetchAssetAndTimeline = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');

            let response;
            if (isPublicMode || category) {
                // Dedicated public lookup (handles sn only or category/sn)
                response = await axios.get(`${API_URL}/hots_settings/public/asset/${sn}`);
            } else {
                // Internal lookup by category/sn
                response = await axios.get(`${API_URL}/hots_settings/get/asset-by-sn/${category}/${sn}`);
            }

            if (response.data.success) {
                const isPublicBranch = isPublicMode || !!category;
                const assetData = isPublicBranch ? response.data.asset : response.data.data;
                const timelineData = isPublicBranch ? response.data.timeline : [];
                const skuData = isPublicBranch ? response.data.sku : null;

                setAsset(assetData);
                setSku(skuData);

                if (isPublicBranch) {
                    setTimeline(timelineData);
                    setLoadingTimeline(false);
                } else {
                    // Fetch timeline for this asset id (Internal)
                    setLoadingTimeline(true);
                    const timelineResponse = await axios.get(`${API_URL}/hots_settings/get/asset-timeline/${assetData.id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                    if (timelineResponse.data.success) {
                        setTimeline(timelineResponse.data.data);
                    }
                }
            }
        } catch (err: any) {
            console.error("Audit Portal Error:", err);
            toast({ title: "Lookup Failed", description: "Asset not found or invalid QR code.", variant: "destructive" });
            setLoadingTimeline(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const endpoint = isPublicMode ? `${API_URL}/hots_settings/public/locations` : `${API_URL}/hots_settings/get/inventory`;
            const response = await axios.get(endpoint, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (response.data.success) {
                if (isPublicMode) {
                    setLocations(response.data.data);
                } else {
                    const locs = response.data.data.filter((item: any) => item.resource_category === 'storage_location');
                    setLocations(locs);
                }
            }
        } catch (err) {
            console.error("Failed to fetch locations:", err);
        }
    };

    useEffect(() => {
        fetchAssetAndTimeline();
        fetchLocations();
    }, [category, sn]);

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

    const handlePostTimeline = async (e?: React.FormEvent, authData?: any) => {
        if (e) e.preventDefault();
        
        // Validation: All fields are mandatory
        const newErrors: Record<string, boolean> = {
            reportedUser: !reportedUser.trim(),
            locationText: !locationText.trim(),
            newNote: !newNote.trim() || newNote === '<p></p>' // Handle empty rich text
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(v => v)) {
            toast({ 
                title: "Validation Error", 
                description: "All field is mandatory. Please fill in all information.", 
                variant: "destructive" 
            });
            return;
        }

        if (!asset) return;

        const token = localStorage.getItem('hots_tokek');

        // Ensure we show the confirmation modal for unauthenticated users (public browsing)
        if (!token && !authData) {
            setShowAuthModal(true);
            return;
        }

        try {
            setIsSubmitting(true);
            setAuthError('');

            const payload = {
                operation: 'field_audit',
                notes: {
                    html: newNote,
                    condition: auditCondition,
                    reported_user: reportedUser,
                    location: locationText,
                    timestamp: new Date().toISOString()
                },
                ...(authData ? { auth: authData } : {})
            };

            const endpoint = isPublicMode
                ? `${API_URL}/hots_settings/public/post-timeline/${sn}`
                : `${API_URL}/hots_settings/post/asset-timeline/${asset.id}`;

            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(endpoint, payload, { headers });

            if (response.data.success) {
                toast({ title: "Audit Logged", description: `Timeline entry added successfully. Verified as ${response.data.user || 'User'}.` });
                setNewNote('');
                setReportedUser('');
                setShowAuthModal(false);
                setUid('');
                setPassword('');
                fetchAssetAndTimeline();
            }
        } catch (err: any) {
            console.error("Post Timeline Error:", err);
            const msg = err.response?.data?.message || err.message;
            if (isPublicMode && err.response?.status === 401) {
                setAuthError(msg);
            } else {
                toast({ title: "Error", description: msg, variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uid || !password) return;
        handlePostTimeline(undefined, { uid, pswd: password });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Identifying Asset...</p>
                </div>
            </div>
        );
    }



    const conditionData = CONDITION_MAP[asset.attributes?.condition || 'good'] || CONDITION_MAP['good'];
    const ConditionIcon = conditionData.icon;

    return (
        <div className="min-h-screen bg-[#fcfcfd] dark:bg-black">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center relative">

                    {/* LEFT */}
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                            <Monitor className="w-4 h-4" />
                        </div>
                    </div>

                    {/* CENTER (true center) */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <span className="font-bold text-sm tracking-tight text-foreground uppercase">
                            HOTS Audit
                        </span>
                    </div>

                    {/* RIGHT */}
                    <div className="ml-auto">
                        {/* optional button */}
                    </div>

                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {/* Asset Identity Card */}
                <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/5 mb-2">
                                {isPublicMode ? asset.resource_category?.split('_')[0] : category?.replace('_', ' ')}
                            </Badge>
                            <h1 className="text-2xl font-bold leading-tight">{asset.resource_label}</h1>
                            <p className="text-sm font-mono text-muted-foreground">SN: {asset.resource_key}</p>
                        </div>
                        <Badge variant={asset.is_active ? "default" : "secondary"}>
                            {asset.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    <div className="pt-4 border-t grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <AlertTriangle className="w-3 h-3" /> Current Condition
                            </div>
                            <div className={`p-3 rounded-xl ${conditionData.color} flex items-center gap-2 font-semibold text-sm`}>
                                <ConditionIcon className="w-4 h-4" />
                                {conditionData.label}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Calendar className="w-3 h-3" /> Last Activity
                            </div>
                            <div className="p-3 bg-muted rounded-xl text-sm font-medium">
                                {timeline[0] ? format(new Date(timeline[0].created_at), 'dd MMM yyyy') : 'No History'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Specifications Card */}
                {sku && (
                    <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold leading-none mb-1">Asset Specifications</h2>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catalog & Master Data</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {sku.attributes && (
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(sku.attributes)
                                        .filter(([k]) => !['sku_id', 'condition', 'sub_category', 'category', 'stocks', 'total_stock', 'max_stock', 'total_stocks'].includes(k))
                                        .flatMap(([k, v]: [string, any]) => {
                                            // Handle nested 'specs' or other objects to flatten them for display
                                            if (typeof v === 'object' && v !== null) {
                                                return Object.entries(v).map(([sk, sv]) => (
                                                    <div key={`${k}-${sk}`} className="flex flex-col gap-1 p-2.5 rounded-xl border bg-background/50">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">{sk.replace(/_/g, ' ')}</span>
                                                        <span className="text-xs font-bold truncate">{String(sv)}</span>
                                                    </div>
                                                ));
                                            }
                                            // Regular key-value pair
                                            return (
                                                <div key={k} className="flex flex-col gap-1 p-2.5 rounded-xl border bg-background/50">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">{k.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs font-bold truncate">{String(v)}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Interactive Timeline Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-l-4 border-primary pl-4 py-1">
                        <h2 className="text-lg font-bold">Asset Life Cycle</h2>
                        <Badge variant="outline" className="bg-background">{timeline.length} Entries</Badge>
                    </div>

                    {/* New Log Input */}
                    <div className="bg-card rounded-2xl border p-5 space-y-4 shadow-sm ring-1 ring-primary/5">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">Field Audit Entry</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Current User</Label>
                                <Input
                                    placeholder="Placeholder: name..."
                                    value={reportedUser}
                                    onChange={(e) => {
                                        setReportedUser(e.target.value);
                                        if (errors.reportedUser) setErrors(prev => ({ ...prev, reportedUser: false }));
                                    }}
                                    className={`h-10 text-sm bg-muted/30 rounded-xl border-0 focus-visible:ring-1 focus-visible:ring-primary/20 ${errors.reportedUser ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Condition</Label>
                                <Select value={auditCondition} onValueChange={setAuditCondition}>
                                    <SelectTrigger className="h-10 text-sm bg-muted/30 rounded-xl border-0 focus-visible:ring-1 focus-visible:ring-primary/20">
                                        <SelectValue placeholder="Select" />
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
                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Location / Position</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Type location (e.g. WH-01, Office A)..."
                                        value={locationText}
                                        onChange={(e) => {
                                            setLocationText(e.target.value);
                                            if (errors.locationText) setErrors(prev => ({ ...prev, locationText: false }));
                                        }}
                                        className={`h-10 text-sm bg-muted/30 rounded-xl border-0 focus-visible:ring-1 focus-visible:ring-primary/20 ${errors.locationText ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}
                                        list="audit-location-suggestions"
                                    />
                                    <datalist id="audit-location-suggestions">
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.resource_label} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Observations</Label>
                            <div className={`rounded-xl overflow-hidden transition-all ${errors.newNote ? 'ring-2 ring-red-500' : ''}`}>
                                <RichTextEditor
                                    value={newNote}
                                    onChange={(val) => {
                                        setNewNote(val);
                                        if (errors.newNote) setErrors(prev => ({ ...prev, newNote: false }));
                                    }}
                                    onImageUpload={handleImageUpload}
                                    placeholder="Snapshot observations, check results, or maintenance notes..."
                                    minHeight="120px"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={handlePostTimeline} disabled={isSubmitting || !newNote.trim()} className="h-10 px-6 gap-2 rounded-xl shadow-lg shadow-primary/20">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Submit Field Update
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-6 pt-4 px-4">
                        {timeline.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-40">
                                <HistoryIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm italic">No history recorded yet.</p>
                            </div>
                        ) : (
                            timeline.map((log, idx) => (
                                <div key={log.id} className="relative pl-10">
                                    {idx !== timeline.length - 1 && (
                                        <div className="absolute left-[13px] top-6 bottom-[-24px] w-[2px] bg-border/40" />
                                    )}
                                    <div className="absolute left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background z-10" />

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">{log.operation}</span>
                                            <div className="h-[1px] flex-1 bg-border/20" />
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                                            </div>
                                        </div>

                                        <div className="bg-card p-4 rounded-2xl border-2 border-muted/50 shadow-sm">
                                            {typeof log.notes === 'object' ? (
                                                <div className="space-y-3">
                                                    <div className="text-sm leading-relaxed rich-text-content prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: log.notes.html }} />
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {log.notes.condition && (
                                                            <Badge variant="outline" className="text-[9px] font-bold bg-green-500/5 text-green-700 tracking-tighter uppercase px-2 py-0 border-green-500/20">
                                                                {log.notes.condition}
                                                            </Badge>
                                                        )}
                                                        {log.notes.reported_user && (
                                                            <Badge variant="outline" className="text-[9px] font-bold bg-blue-500/5 text-blue-700 tracking-tighter uppercase px-2 py-0 border-blue-500/20">
                                                                User: {log.notes.reported_user}
                                                            </Badge>
                                                        )}
                                                        {log.notes.location && (
                                                            <Badge variant="outline" className="text-[9px] font-bold bg-orange-500/5 text-orange-700 tracking-tighter uppercase px-2 py-0 border-orange-500/20">
                                                                Loc: {log.notes.location}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-foreground/80 leading-relaxed">{log.notes}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pl-1">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[10px] font-semibold text-muted-foreground">Logged by {log.user_name || 'System'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-12 mt-12 border-t text-center space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">HOTS Integrated Inventory</p>
                <p className="text-[10px] text-muted-foreground/60">Property of Audit & Compliance Division</p>
            </footer>

            {/* Auth Confirmation Modal */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Verify Auditor Account
                        </DialogTitle>
                        <DialogDescription>
                            Please enter your HOTS credentials to confirm this audit entry.
                            Your name will be recorded in the timeline.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleConfirmAuth} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="uid">Username</Label>
                            <Input
                                id="uid"
                                placeholder="e.g. jdoe"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle className="w-4 h-4" />
                                {authError}
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setShowAuthModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !uid || !password}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Post"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AssetAuditPage;
