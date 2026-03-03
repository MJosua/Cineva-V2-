import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
    Phone, Mail, Linkedin, MapPin, Globe, Download, UserPlus, MessageCircle,
    Building2, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9999';

interface ProfileData {
    user_id: number;
    fullname: string;
    position: string;
    department: string;
    email: string;
    phone: string;
    linkedin: string;
    company: string;
    website: string;
    location: string;
    address: string;
    encrypted_id: string;
    download_url?: string; // Public URL for PDF download
}

// Helper: Truncate long names to first + last word
const formatDisplayName = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length <= 2 || name.length <= 20) return name;
    return `${words[0]} ${words[words.length - 1]}`;
};

// Helper: Calculate email font size based on length
const getEmailFontSize = (email: string): string => {
    if (!email) return 'text-sm';
    if (email.length > 35) return 'text-xs';
    if (email.length > 25) return 'text-sm';
    return 'text-base';
};

export default function CardProfilePage() {
    const [searchParams] = useSearchParams();
    const employeeId = searchParams.get('employee_id');

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!employeeId) {
                setError('Invalid profile link');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/hots_settings/card/profile`, {
                    params: { employee_id: employeeId }
                });

                if (response.data.success) {
                    setProfile(response.data.data);
                } else {
                    setError(response.data.message || 'Profile not found');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [employeeId]);

    const handleWhatsApp = () => {
        if (profile?.phone) {
            const phone = profile.phone.replace(/[^0-9+]/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
        }
    };

    const handleEmail = () => {
        if (profile?.email) {
            window.location.href = `mailto:${profile.email}`;
        }
    };

    const handleLinkedIn = () => {
        if (profile?.linkedin) {
            window.open(profile.linkedin, '_blank');
        }
    };

    const handleLocation = () => {
        if (profile?.location) {
            window.open(profile.location, '_blank');
        }
    };

    const handleWebsite = () => {
        if (profile?.website) {
            window.open(profile.website, '_blank');
        }
    };

    const handleAddContact = () => {
        if (!profile) return;

        // Generate vCard
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.fullname}
ORG:${profile.company}
TITLE:${profile.position}
TEL;TYPE=CELL:${profile.phone}
EMAIL:${profile.email}
ADR;TYPE=WORK:;;${profile.address}
URL:${profile.website}
END:VCARD`;

        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profile.fullname.replace(/\s+/g, '_')}.vcf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadCard = () => {
        if (profile?.download_url) {
            window.open(profile.download_url, '_blank');
        } else {
            alert('Business card document is not available. Please contact HR to generate it.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm w-full">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h1 className="text-xl font-semibold text-gray-800">Profile Not Found</h1>
                    <p className="text-gray-500 mt-2">{error || 'The requested profile could not be found.'}</p>
                </div>
            </div>
        );
    }

    const displayName = formatDisplayName(profile.fullname);
    const emailFontClass = getEmailFontSize(profile.email);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center w-screen p-4">
            {/* Responsive content wrapper */}
            <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">

                {/* ================= CARD PREVIEW ================= */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                    {/* Header */}
                    <div className="bg-[#083484] text-white p-6 pt-8">
                        <img
                            src="/images/logo-indofoodcbp-cbp.png"
                            alt="Indofood CBP"
                            className="h-8"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>

                    {/* Profile Info */}
                    <div className="p-6 pt-8">
                        <h1 className="text-2xl font-bold text-[#083484] break-words">
                            {displayName}
                        </h1>
                        <p className="text-gray-600 mt-1">{profile.position}</p>
                        <p className="text-gray-500 text-sm">{profile.department}</p>

                        <div className="mt-6 space-y-3 text-gray-600">
                            {profile.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}

                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className={`${emailFontClass} break-all`}>
                                    {profile.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= ACTION BUTTONS ================= */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                        onClick={handleDownloadCard}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download Card
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        disabled={!profile.phone}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                    </button>

                    <button
                        onClick={handleAddContact}
                        className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Contact
                    </button>

                    <button
                        onClick={handleEmail}
                        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Mail className="w-4 h-4" />
                        Mail
                    </button>

                    <button
                        onClick={handleWebsite}
                        className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Globe className="w-4 h-4" />
                        Company Website
                    </button>

                    <button
                        onClick={handleLocation}
                        className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <MapPin className="w-4 h-4" />
                        Company Location
                    </button>

                    {profile.linkedin && (
                        <button
                            onClick={handleLinkedIn}
                            className="col-span-2 flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006396] text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn Profile
                        </button>
                    )}
                </div>

                {/* ================= FOOTER ================= */}
                <div className="mt-8 text-center text-gray-400 text-xs">
                    <p>Powered by HOTS - Help Order Ticket System</p>
                    <p className="mt-1">
                        © {new Date().getFullYear()} PT. Indofood CBP Sukses Makmur Tbk
                    </p>
                </div>
            </div>
        </div>

    );
}
