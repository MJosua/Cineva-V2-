import React, { useEffect, useState } from "react";
import axios from "axios";
import GanttRoomUsage from "@/widgets/GanttRoomUsage";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_URL } from "@/config/sourceConfig";
import { loginUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    firstname?: string;
    name?: string;
    email?: string;
}

const MeetingRoomStandalone: React.FC = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("tokek"));
    const [globalValues, setGlobalValues] = useState<Record<string, any>>({});
    const [showForm, setShowForm] = useState(false);
    const [purpose, setPurpose] = useState("");
    const [PIC, setPIC] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { toast } = useToast();

    const dispatch = useAppDispatch();

    // 🔁 Check token on mount + after login
    useEffect(() => {
        const stored = localStorage.getItem("tokek");
        if (stored) setToken(stored);
    }, []);

    // 🧩 Fetch user profile
    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`${API_URL}/hots_auth/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("tokek")}` },
            });

            if (response.data.success) {
                setUserProfile(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    useEffect(() => {
        if (token) fetchUserProfile();
    }, [token]);

    // 🧠 Handle login
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = String(formData.get("username"));
        const password = String(formData.get("password"));

        try {
            await dispatch(
                loginUser({
                    username: username.trim(),
                    password,
                })
            ).unwrap();


            toast({
                title: "Login successful!",
                description: "Welcome"
            });

            setToken(localStorage.getItem("tokek")); // ✅ update immediately to trigger rerender
        } catch (err: any) {
            console.error("Login error:", err);
            toast({
                title: "Login failed.",
                description: "❌  Please check your credentials.",
                variant: "destructive",
            });

        }
    };

    // 🧹 Handle logout
    const handleLogout = () => {
        localStorage.removeItem("tokek");
        setToken(null);
        setUserProfile(null);

        toast({
            title: "Log Out Success.",
            description: " Logged out successfully.",
        });

    };

    // 🕒 Trigger form after slot selection
    useEffect(() => {
        if (globalValues.start_time && globalValues.end_time && globalValues.date) {
            setShowForm(true);
        }
    }, [globalValues.start_time, globalValues.end_time, globalValues.date]);

    // 📤 Submit meeting booking
    const handleSubmitBooking = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ...globalValues,
                purpose,
                PIC,
                requested_by: userProfile?.name || userProfile?.firstname || "Anonymous",
            };
            await axios.post(`${API_URL}/api/meeting-room`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast({
                title: "Meeting room booked successfully!.",
            });

            setShowForm(false);
            setGlobalValues({});
            setPurpose("");
            setPIC("");
        } catch (err) {
            console.error(err);
            toast({
                title: "Failed  to book room.",
                description: "Please try again.",
                variant: "destructive",
            });

        } finally {
            setSubmitting(false);
        }
    };

    // 🧭 LOGIN SCREEN
    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen w-screen bg-gray-50 px-4">
                <Card className="w-full max-w-sm p-6 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-gray-700">
                            HOTS Meeting Room
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input name="username" placeholder="Username" required />
                            <Input name="password" placeholder="Password" type="password" required />
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 🧩 MAIN APP
    return (
        <div className="min-h-screen w-screen bg-gray-50 flex flex-col">
            {/* HEADER */}
            <header className="flex items-center justify-between bg-white shadow px-6 py-4 sticky top-0 z-10">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                        HOTS Meeting Room Booking
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">
                        Facility Booking System • Indofood ICBP
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {userProfile && (
                        <div className="text-sm text-gray-700">
                            👋 Hello, <b>{userProfile.firstname || "User"}</b>
                        </div>
                    )}
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="w-screen mx-auto py-6">
                <div className="grid grid-cols-1 w-screen px-9 lg:grid-cols-1 gap-6">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">
                                Room Selection & Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GanttRoomUsage setGlobalValues={setGlobalValues} formData={globalValues} />
                        </CardContent>
                    </Card>

                    {/* Sidebar selection summary */}

                </div>
            </main>

            {/* FOOTER */}
            <footer className="text-center text-xs text-gray-500 py-4 bg-gray-50">
                © {new Date().getFullYear()} Indofood ICBP • HOTS Facilities System
            </footer>

            {/* POPUP FORM */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
                            Confirm Meeting Booking
                        </h3>

                        <div className="space-y-2 text-sm text-gray-700 mb-4">
                            <p><b>Room:</b> {globalValues.room}</p>
                            <p><b>Date:</b> {globalValues.date}</p>
                            <p><b>Time:</b> {globalValues.start_time} – {globalValues.end_time}</p>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium">PIC / Organizer</label>
                            <Input
                                type="text"
                                placeholder="Enter person in charge"
                                value={PIC}
                                onChange={(e) => setPIC(e.target.value)}
                            />

                            <label className="block text-sm font-medium">Purpose</label>
                            <Textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Enter meeting purpose or agenda"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                            <Button disabled={submitting} onClick={handleSubmitBooking}>
                                {submitting ? "Booking..." : "Confirm Booking"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoomStandalone;
