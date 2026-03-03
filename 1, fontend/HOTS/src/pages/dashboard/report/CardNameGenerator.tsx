// widgets/CardNameGenerator.tsx
// Card Name Generator widget for HR Tools Dashboard
// Allows HR to generate business cards for selected users

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import {
    CreditCard, Download, Loader2, Search, User,
    Briefcase, Phone, Mail, Building, RefreshCw, FileText, X, RotateCw, ExternalLink,
    Trash2, Eye
} from 'lucide-react';

interface UserOption {
    value: number;
    label: string;
    job_title: string;
    department: string;
}

interface UserCardData {
    user_id: number;
    nik: string;
    fullname: string;
    job_title: string;
    department: string;
    email: string;

    cell_phone: string;
    ext_phone: string;
    encrypted_id?: string; // Secure ID for public URL
    existing_card?: GeneratedCard; // Existing card info from backend
}


interface GeneratedCard {
    file_path: string;
    file_name: string;
    download_url_fixed: string; // Add fixed URL
}

const CardNameGenerator: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1); // Keyboard nav index
    const [selectedUser, setSelectedUser] = useState<UserCardData | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front'); // Toggle state



    const { toast } = useToast();

    // Debounced search
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            setFocusedIndex(-1);
            return;
        }

        try {
            setSearching(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_settings/card_generator/search_users?q=${encodeURIComponent(query)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSearchResults(response.data.data || []);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    // Handle Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev =>
                prev < searchResults.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && searchResults[focusedIndex]) {
                handleSelectUser(searchResults[focusedIndex].value);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };


    // Select user from dropdown
    const handleSelectUser = async (userId: number) => {
        try {
            setLoadingUser(true);
            setShowDropdown(false);
            setFocusedIndex(-1);
            setSearchQuery('');

            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_settings/card_generator/user/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSelectedUser(response.data.data);
                setGeneratedCard(null); // Reset previous card
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            toast({
                title: 'Error',
                description: 'Failed to load user data',
                variant: 'destructive'
            });
        } finally {
            setLoadingUser(false);
        }
    };

    // Effect to auto-load preview when user is selected
    React.useEffect(() => {
        if (selectedUser) {
            loadPreview(selectedUser.user_id);
        } else {
            setPreviewHtml('');
        }
    }, [selectedUser]);

    const loadPreview = async (userId: number) => {
        try {
            setLoadingPreview(true);
            const token = localStorage.getItem('tokek');
            // Fetch HTML directly
            const response = await axios.get(
                `${API_URL}/hots_settings/card_generator/preview/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'text' // We expect HTML string
                }
            );

            if (response.data) {
                setPreviewHtml(response.data);
            }
        } catch (error) {
            console.error('Preview error:', error);
            toast({
                title: 'Preview Failed',
                description: 'Could not load card preview',
                variant: 'destructive'
            });
        } finally {
            setLoadingPreview(false);
        }
    };


    // Generate card
    const handleGenerate = async () => {
        if (!selectedUser) {
            toast({
                title: 'Select User',
                description: 'Please select a user first',
                variant: 'destructive'
            });
            return;
        }

        try {
            setGenerating(true);
            const token = localStorage.getItem('tokek');

            const response = await axios.post(
                `${API_URL}/hots_settings/card_generator/generate`,
                { target_user_id: selectedUser.user_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Fix the path: If file_path starts with 'public\', we need to strip it to match static mount
                const rawPath = response.data.data.file_path;
                // Backend returns public\hots\generateddocuments\...
                // Static mount: /public/hots/generateddocuments -> public/hots/generateddocuments
                // So URL should be /public/hots/generateddocuments/...
                // But let's handle the string basics first
                const normalizedPath = rawPath.replace(/\\/g, '/');
                // Construct proper URL based on index.js static mounts
                // If path is "public/hots/generateddocuments/cards/file.pdf"
                // And index.js has: App.use('/public/hots/generateddocuments', ...)
                // Then correct URL is "/public/hots/generateddocuments/cards/file.pdf"

                const fixedUrl = `${API_URL}/${normalizedPath}`;

                setGeneratedCard({
                    ...response.data.data,
                    download_url_fixed: fixedUrl
                });

                // Immediate Download
                window.open(fixedUrl, '_blank');

                toast({
                    title: 'Card Generated',
                    description: `Business card for ${selectedUser.fullname} created successfully`
                });

                // NO REFRESH: Keep the UI state stable so the user can see the preview and results
                // handleSelectUser(selectedUser.user_id);
            }
        } catch (error) {
            console.error('Generate error:', error);
            toast({
                title: 'Generation Failed',
                description: 'Failed to generate business card',
                variant: 'destructive'
            });
        } finally {
            setGenerating(false);
        }

    };

    // Delete existing card
    const handleDeleteCard = async () => {
        if (!selectedUser) return;

        if (!confirm('Are you sure you want to delete this business card? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/hots_settings/card_generator/delete_card`,
                { target_user_id: selectedUser.user_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: 'Card Deleted',
                description: 'The business card has been deleted successfully',
            });

            // Refresh user data (to clear existing_card)
            handleSelectUser(selectedUser.user_id);

        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Deletion Failed',
                description: 'Failed to delete business card',
                variant: 'destructive'
            });
        }
    };

    // Open existing card
    const handleOpenExisting = () => {
        if (selectedUser?.existing_card) {
            const rawPath = selectedUser.existing_card.file_path;
            const normalizedPath = rawPath.replace(/\\/g, '/');
            const fixedUrl = `${API_URL}/${normalizedPath}`;
            window.open(fixedUrl, '_blank');
        }
    };

    // Download card
    const handleDownload = () => {
        if (generatedCard) {
            window.open(generatedCard.download_url_fixed, '_blank');
        }
    };

    // Clear selection
    const handleClear = () => {
        setSelectedUser(null);
        setGeneratedCard(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="card-generator-container grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

            {/* Left Panel: Preview */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-md h-full">
                <CardHeader className="pb-3 border-b border-slate-200">
                    <CardTitle className="flex items-center justify-between text-lg text-slate-800">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            Card Preview
                        </div>
                        {previewHtml && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewSide(prev => prev === 'front' ? 'back' : 'front')}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <RotateCw className="w-4 h-4 mr-2" />
                                Flip Card
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[350px] relative p-6 bg-slate-200/50">
                    {loadingPreview ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10 rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        </div>
                    ) : null}

                    {previewHtml ? (
                        <div className="w-full space-y-6 flex flex-col items-center justify-center">
                            {/* Card preview container - matches reference dimensions */}
                            <div className="relative mx-auto bg-white rounded-lg shadow-xl overflow-hidden"
                                style={{ width: '510px', height: previewSide === 'front' ? '312px' : '312px' }}>
                                {/* 
                                    The HTML is rendered at exact pixel dimensions (510.2362 x 311.811).
                                    We render it in iframe and just show one card at a time.
                                */}
                                <iframe
                                    srcDoc={previewHtml + `
                                        <style>
                                            html, body { 
                                                margin: 0; padding: 0; 
                                                width: 510px; height: 312px;
                                                overflow: hidden; 
                                                background: #f0f0f0;
                                            }
                                            .page-container {
                                                display: flex;
                                                flex-direction: column;
                                                gap: 0;
                                                padding: 0 !important;
                                            }
                                            /* Show only the selected card */
                                            .base-kartunama:nth-child(1) { 
                                                display: ${previewSide === 'front' ? 'block' : 'none'} !important; 
                                            }
                                            .base-kartunama:nth-child(2) { 
                                                display: ${previewSide === 'back' ? 'block' : 'none'} !important; 
                                            }
                                        </style>
                                    `}
                                    className="w-full h-full border-0"
                                    title="Card Preview"
                                    sandbox="allow-same-origin"
                                />
                            </div>

                            {/* Status Section */}
                            {generatedCard ? (
                                <div className="text-center text-xs text-blue-600 bg-blue-50 py-2 px-4 rounded-full flex items-center gap-2 border border-blue-100">
                                    <Download className="w-3 h-3" /> Card Generated & Downloaded
                                </div>
                            ) : (
                                <div className="text-center text-xs text-slate-500 bg-white/50 py-2 px-4 rounded-full">
                                    Preview Mode • Click Generate to Download PDF
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-20 text-blue-900" />
                            <p>Select a user to preview their card</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right Panel: Controls */}
            <Card className="bg-white border-slate-200 shadow-md h-full">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                        <User className="w-5 h-5 text-blue-600" />
                        Select Employee
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">

                    {/* Search Input */}
                    <div className="relative">
                        <Label className="text-slate-600 mb-2 block font-medium">Search by Name or NIK</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type name or NIK..."
                                className="pl-10 bg-white border-slate-200 focus:border-blue-500 text-slate-800"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto ring-1 ring-black/5">
                                {searchResults.map((user, index) => (
                                    <button
                                        key={user.value}
                                        onClick={() => handleSelectUser(user.value)}
                                        className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${index === focusedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                    >
                                        <div className="font-medium">{user.label}</div>
                                        <div className="text-sm text-slate-500">
                                            {user.job_title || 'No Title'} • {user.department || 'No Dept'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected User Info */}
                    {loadingUser && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    )}

                    {selectedUser && !loadingUser && (
                        <div className="bg-slate-50 rounded-lg p-5 space-y-3 relative border border-slate-100">
                            <button
                                onClick={handleClear}
                                className="absolute top-2 right-2 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                    {selectedUser.nik || 'No NIK'}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800">{selectedUser.fullname}</h3>

                            <div className="grid gap-3 text-sm mt-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">{selectedUser.job_title}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Building className="w-4 h-4 text-slate-400" />
                                    <span>{selectedUser.department}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span>{selectedUser.email}</span>
                                </div>
                                {selectedUser.cell_phone && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>Cell: {selectedUser.cell_phone}</span>
                                    </div>
                                )}
                                {selectedUser.ext_phone && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Phone className="w-4 h-4 ml-1" />
                                        <span>Ext: {selectedUser.ext_phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons - Simplified to just Generate */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedUser || generating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-lg py-6 shadow-md transition-all"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                {generatedCard ? 'Re-generate & Download' : 'Generate Business Card'}
                            </>
                        )}
                    </Button>

                    {/* Visit Profile Button */}
                    {selectedUser && (
                        <Button
                            onClick={() => {
                                // Open profile in new tab using secure encrypted ID
                                window.open(`/hots/card/card?employee_id=${selectedUser.encrypted_id}`, '_blank');
                            }}
                            variant="outline"
                            className="w-full mt-3 border-green-500 text-green-600 hover:bg-green-50"
                        >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Visit Digital Profile
                        </Button>
                    )}

                    {/* Instructions */}
                    {!selectedUser && (
                        <div className="text-center text-sm text-slate-500 mt-4">
                            <p>Search for an employee by name or NIK number.</p>
                            <p>Review their information before generating the card.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CardNameGenerator;
