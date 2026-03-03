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
    Briefcase, Phone, Mail, Building, RefreshCw, FileText, X
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
}

interface GeneratedCard {
    file_path: string;
    file_name: string;
    download_url: string;
}

const CardNameGenerator: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserCardData | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const { toast } = useToast();

    // Debounced search
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
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

    // Select user from dropdown
    const handleSelectUser = async (userId: number) => {
        try {
            setLoadingUser(true);
            setShowDropdown(false);
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
                setGeneratedCard(response.data.data);
                toast({
                    title: 'Card Generated',
                    description: `Business card for ${selectedUser.fullname} created successfully`
                });
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

    // Download card
    const handleDownload = () => {
        if (generatedCard) {
            window.open(`${API_URL}${generatedCard.download_url}`, '_blank');
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
            <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="w-5 h-5 text-cyan-400" />
                        Card Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[350px]">
                    {generatedCard ? (
                        <div className="w-full space-y-4">
                            <div className="bg-white rounded-lg p-4 shadow-lg">
                                <iframe
                                    src={`${API_URL}${generatedCard.download_url}`}
                                    className="w-full h-[280px] border-0 rounded"
                                    title="Card Preview"
                                />
                            </div>
                            <Button
                                onClick={handleDownload}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Select a user and generate their card</p>
                            <p className="text-sm mt-1 opacity-60">Preview will appear here</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right Panel: Controls */}
            <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="w-5 h-5 text-emerald-400" />
                        Select Employee
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Search Input */}
                    <div className="relative">
                        <Label className="text-slate-300 mb-2 block">Search by Name or NIK</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Type name or NIK..."
                                className="pl-10 bg-slate-900/50 border-slate-600 focus:border-cyan-500"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-400" />
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.value}
                                        onClick={() => handleSelectUser(user.value)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                                    >
                                        <div className="font-medium text-white">{user.label}</div>
                                        <div className="text-sm text-slate-400">
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
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        </div>
                    )}

                    {selectedUser && !loadingUser && (
                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 relative">
                            <button
                                onClick={handleClear}
                                className="absolute top-2 right-2 p-1 hover:bg-slate-700 rounded"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                    {selectedUser.nik || 'No NIK'}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-semibold text-white">{selectedUser.fullname}</h3>

                            <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Briefcase className="w-4 h-4 text-cyan-400" />
                                    <span>{selectedUser.job_title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Building className="w-4 h-4 text-purple-400" />
                                    <span>{selectedUser.department}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Mail className="w-4 h-4 text-amber-400" />
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Phone className="w-4 h-4 text-emerald-400" />
                                    <span>Cell: {selectedUser.cell_phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Phone className="w-4 h-4 text-blue-400" />
                                    <span>Ext: {selectedUser.ext_phone}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedUser || generating}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-6"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Generate Business Card
                            </>
                        )}
                    </Button>

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
