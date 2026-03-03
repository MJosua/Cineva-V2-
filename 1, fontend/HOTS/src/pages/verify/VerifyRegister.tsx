import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { Button } from '@/components/ui/button';



export default function VerifyPage() {
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("Verifying...");
    const [loading, setLoading] = useState(true);

    
    // Try to get token from either ?token= or /verify/:token
    const token = searchParams.get("token") || params.token;
    console.log("🔍 Retrieved token:", token);
    useEffect(() => {
        if (!token) {
            console.log("⚠️ No token provided in URL.");
            setStatus("No token provided.");
            setLoading(false);
            return;
        }

        // If token found via ?token=, redirect to /verify/:token for clean URL
        // if (searchParams.get("token") && !params.token) {
        //   navigate(`/verify/${token}`, { replace: true });
        //   return;
        // }

        console.log("🔗 Verifying token via:", `${API_URL}/hots/verify/${token}`);

        axios
            .get(`${API_URL}/hots_auth/verify/${token}`)
            .then((res) => {
                setStatus(res.data.message || "Verification successful!");
            })
            .catch((err) => {
                console.error("❌ Verification failed:", err.response?.data || err.message);
                setStatus("Verification failed or link expired.");
            })
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
            <div className="bg-white p-6 rounded shadow-md max-w-sm text-center">
                <h2 className="text-xl font-bold mb-3">Email Verification</h2>
                <p className="text-gray-600">
                    {loading ? "Please wait..." : status}
                </p>
                <p>
                    <Button
                        h="1.75rem"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate('/')}
                    >
                        Go Back to Home
                    </Button>
                </p>

            </div>
        </div>
    );
}
