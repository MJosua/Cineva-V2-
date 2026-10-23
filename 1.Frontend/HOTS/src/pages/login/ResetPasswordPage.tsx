import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from "@/config/sourceConfig";

const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await axios.get(`${API_URL}/hots_auth/verify-token`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                }
            } catch (error) {
                setTokenValid(false);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            verifyToken();
        } else {
            setIsLoading(false);
            setTokenValid(false);
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            toast({ title: "Error", description: "Password cannot be empty!", variant: "destructive" });
            return;
        }

        if (password.length < 8) {
            toast({ title: "Error", description: "Password must be at least 8 characters!", variant: "destructive" });
            return;
        }

        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match!", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(
                `${API_URL}/hots_auth/change_pass_forgot`,
                { pswd: password },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setResetComplete(true);
                toast({ title: "Success", description: "Your password has been changed!" });
            } else {
                toast({ title: "Error", description: res.data.message || "Failed to reset password", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md shadow-xl text-center">
                    <CardContent className="p-8">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
                        <p className="mt-4 text-gray-600">Verifying your reset link...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Token expired/invalid
    if (!tokenValid && !resetComplete) {
        return (
            <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mt-4">Link Expired</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            Your password reset link has expired or is invalid.
                            <br />
                            Please request a new password reset link.
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Reset complete
    if (resetComplete) {
        return (
            <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mt-4">Password Changed!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            Your password has been successfully changed.
                            <br />
                            You can now login with your new password.
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full bg-blue-900 hover:bg-blue-800">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
                        <p className="text-sm text-gray-500 mt-2">Enter your new password below</p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>For technical support, contact IT Department</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
