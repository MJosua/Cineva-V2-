import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useCatalogData } from '@/hooks/useCatalogData';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const ShortRedirect = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { serviceCatalog, isLoading: catalogLoading, fetchData } = useCatalogData();
    const [status, setStatus] = useState<'loading' | 'error' | 'forbidden'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const resolveUrl = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/hots_url/resolve/${code}`);
                const { target_url, require_login } = response.data.data;

                if (require_login && !isAuthenticated) {
                    // Redirect to login with original path as redirect param
                    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
                    return;
                }

                // Wait for session and catalog hydration
                // This prevents "Cannot read length of null" errors on the destination page
                if (require_login && !user) {
                    console.log("🚦 Waiting for user session...");
                    return;
                }

                if (serviceCatalog.length === 0) {
                    if (!catalogLoading) {
                        console.log("🔄 Catalog empty in redirect, triggering fetch...");
                        fetchData();
                    }
                    console.log("🚦 Waiting for catalog hydration...");
                    return;
                }

                if (catalogLoading) {
                    console.log("🚦 Catalog is loading, waiting...");
                    return;
                }

                // Artificial delay to ensure app state is settled after login
                setTimeout(() => {
                    if (target_url.startsWith('http')) {
                        window.location.href = target_url;
                    } else {
                        const finalPath = target_url.startsWith('/') ? target_url : `/${target_url}`;
                        navigate(finalPath, { replace: true });
                    }
                }, 500);

            } catch (error: any) {
                console.error("Redirection error:", error);
                setStatus('error');
                setMessage(error.response?.data?.message || "Failed to resolve link");
            }
        };

        if (code) {
            resolveUrl();
        }
    }, [code, isAuthenticated, user, catalogLoading, navigate, location.pathname]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-gray-500 font-medium">Redirecting you to your destination...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4 text-center">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Oops! Link Invalid</h1>
                    <p className="text-gray-600">{message}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default ShortRedirect;
