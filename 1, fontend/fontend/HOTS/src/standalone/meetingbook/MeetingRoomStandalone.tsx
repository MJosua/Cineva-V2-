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
import { fetchMeetingBookings } from "@/store/slices/meetingroom_slice";
import { Battery, BatteryLow, Zap, Loader2 } from "lucide-react";
import { useRef } from "react";

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
    const [isKioskMode, setIsKioskMode] = useState(localStorage.getItem("isKiosk") === "true");
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [battery, setBattery] = useState<{ level: number, charging: boolean } | null>(null);
    const { toast } = useToast();

    const ticketSentRef = useRef(false);
    const dispatch = useAppDispatch();

    // 🔁 Check token on mount + after login + Auto-Refresh
    useEffect(() => {
        const stored = localStorage.getItem("tokek");
        if (stored) setToken(stored);

        // Auto-refresh schedule every 5 minutes
        const refreshInterval = setInterval(() => {
            dispatch(fetchMeetingBookings());
            setLastRefresh(new Date());
        }, 5 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [dispatch]);

    // 📢 Periodic Announcement Modal (Every 2 hours, auto-closes in 2 minutes)
    useEffect(() => {
        if (!isKioskMode) return;

        const infoInterval = setInterval(() => {
            // Only show if not currently booking
            if (!showForm) {
                setShowInfoModal(true);
                // Auto-close after 2 minutes
                setTimeout(() => setShowInfoModal(false), 2 * 60 * 1000);
            }
        }, 2 * 60 * 60 * 1000); // 2 hours

        return () => clearInterval(infoInterval);
    }, [isKioskMode, showForm]);

    // 🛡️ Auto-Login Kiosk Logic & History Trap
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const kioskKey = urlParams.get("kiosk_key");

        // 1. Massive History Buffer for Standalone Kiosk
        const handlePopState = (e: PopStateEvent) => {
            if (localStorage.getItem("isKiosk") === "true") {
                // Determine if we need to refill the buffer
                // If the user navigates back rapidly, we just push them forward again
                window.history.pushState({ kiosk_trap: Date.now() }, "", window.location.href);
            }
        };

        if (localStorage.getItem("isKiosk") === "true") {
            window.addEventListener('popstate', handlePopState);

            // INITIAL INJECTION: Force-push 20 history states to create a deep buffer
            // This ensures manual back-tapping cannot exhaust the stack
            if (window.history.length < 50) {
                for (let i = 0; i < 20; i++) {
                    window.history.pushState({ kiosk_trap: `buffer_${i}` }, "", window.location.href);
                }
            }
        }

        // 2. Handle Auto-Login
        if (kioskKey === "TABLET_IOD_ASIA" && !token) {
            console.log("Kiosk key detected. Attempting auto-login...");
            const autoLogin = async () => {
                try {
                    await dispatch(
                        loginUser({
                            username: "TABLET_IOD_ASIA",
                            password: "TABLET_IOD_ASIA_PWD_2026",
                        })
                    ).unwrap();
                    localStorage.setItem("isKiosk", "true");
                    setIsKioskMode(true);
                    setToken(localStorage.getItem("tokek"));

                    // Cleanup URL safely
                    const newUrl = window.location.pathname;
                    window.history.replaceState({ kiosk_activated: true }, "", newUrl);

                    toast({ title: "Kiosk Mode Activated", description: "Identity: Tablet IOD ASIA" });

                    // Re-assert protection after activation
                    window.addEventListener('popstate', handlePopState);
                    window.history.pushState({ kiosk_trap: 'active' }, "", window.location.href);
                } catch (err) {
                    console.error("Kiosk auto-login failed:", err);
                }
            };
            autoLogin();
        }

        return () => window.removeEventListener('popstate', handlePopState);
    }, [token, dispatch, toast]);

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

    // 🔋 Battery API Integration
    useEffect(() => {
        if (!('getBattery' in navigator)) return;

        let batteryManager: any;

        const updateBattery = () => {
            const level = (batteryManager as any).level * 100;
            const charging = (batteryManager as any).charging;
            setBattery({ level, charging });
        };

        (navigator as any).getBattery().then((bm: any) => {
            batteryManager = bm;
            updateBattery();
            bm.addEventListener('levelchange', updateBattery);
            bm.addEventListener('chargingchange', updateBattery);
        });

        return () => {
            if (batteryManager) {
                batteryManager.removeEventListener('levelchange', updateBattery);
                batteryManager.removeEventListener('chargingchange', updateBattery);
            }
        };
    }, []);

    // 🤖 Automated Maintenance Ticket (Service ID 7)
    useEffect(() => {
        if (!battery || !isKioskMode) return;

        // Trigger at 10% when not charging
        if (battery.level <= 10 && !battery.charging && !ticketSentRef.current) {
            console.log("⚠️ Critical Battery Level detected. Launching auto-ticket...");

            const createAutoTicket = async () => {
                try {
                    const payload = {
                        form_data: {
                            requester_name: { value: "Tablet IOD ASIA (Kiosk)", type: "text" },
                            department: { value: "IOD", type: "text" },
                            email: { value: "tablet_iod_asia@indofood.com", type: "text" },
                            support_type: { value: "Hardware Issue", type: "select" },
                            support_subtype: { value: "Power/Battery", type: "select" },
                            urgency: { value: "High", type: "select" },
                            issue_description: { value: `[AUTO-KIOSK] Tablet for Meeting Room Booking is at critical battery: ${Math.round(battery.level)}%. Please recharge immediately to avoid downtime.`, type: "textarea" },
                            device_type: { value: "Other", type: "select" },
                            device_model: { value: "Tablet", type: "select" }
                        }
                    };

                    await axios.post(`${API_URL}/hots_ticket/create/ticket/7`, payload, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    ticketSentRef.current = true;
                    toast({
                        title: "Low Battery Action Taken",
                        description: "Maintenance ticket has been automatically created.",
                        variant: "destructive"
                    });
                } catch (err) {
                    console.error("Failed to create automated ticket:", err);
                }
            };

            createAutoTicket();
        }

        // Reset the flag if battery recovered or charging
        if (battery.level > 15 || battery.charging) {
            ticketSentRef.current = false;
        }
    }, [battery, isKioskMode, token, toast]);

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
        localStorage.removeItem("isKiosk");
        setToken(null);
        setIsKioskMode(false);
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
            // 🧹 Use high-fidelity field objects for the standard HOTS "Successful" format
            // We translate Canonical IDs back to Display Names for the database records.
            const selectedRoomName = String(globalValues.room || ""); // Default to ID if name not found

            const formData: Record<string, any> = {
                ...globalValues,
                // Map the room ID to the Display Name for the EAV "Room Name" record
                room: { type: "field", label: "Room Name", value: selectedRoomName, field_id: "room_field" },
                room_id: { type: "field", label: "Room ID", value: String(globalValues.room_id || globalValues.room || ""), field_id: "room_id_field" },
                date: { type: "field", label: "Date", value: globalValues.date, field_id: "date_field" },
                start_time: { type: "field", label: "Start Time", value: globalValues.start_time, field_id: "start_time_field" },
                end_time: { type: "field", label: "End Time", value: globalValues.end_time, field_id: "end_time_field" },

                // Native form fields
                purpose: { type: "field", label: "Purpose of Meeting", value: purpose, field_id: "purpose_field" },
                PIC: { type: "field", label: "PIC", value: PIC, field_id: "PIC_field" },
                requested_by: { type: "field", label: "Requested By", value: isKioskMode ? "Tablet IOD ASIA" : (userProfile?.name || userProfile?.firstname || "Anonymous"), field_id: "requested_by_field" },
                requested_by_type: { type: "field", label: "Requestor Type", value: isKioskMode ? "SYSTEM" : "USER", field_id: "requested_by_type_field" }
            };

            const payload = {
                form_data: formData
            };
            await axios.post(`${API_URL}/hots_ticket/create/ticket/13`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Auto-refresh schedule
            dispatch(fetchMeetingBookings());

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
        <div className={`min-h-screen w-screen bg-gray-50 flex flex-col ${isKioskMode ? "select-none overscroll-none" : ""}`}>
            {/* HEADER */}
            <header className="flex items-center justify-between bg-white shadow px-6 py-4 sticky top-0 z-30">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                        HOTS Meeting Room Booking
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">
                        Facility Booking System • Indofood ICBP
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {userProfile && !isKioskMode && (
                        <div className="text-sm text-gray-700">
                            👋 Hello, <b>{userProfile.firstname || "User"}</b>
                        </div>
                    )}
                    {!isKioskMode && (
                        <Button variant="outline" onClick={handleLogout}>
                            Logout
                        </Button>
                    )}
                    {isKioskMode && (
                        <div className="flex items-center space-x-3 mr-2">
                            {/* Battery Indicator (Kiosk only as requested) */}
                            {battery && (
                                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-all ${battery.level <= 10 ? "text-red-600 bg-red-50 border-red-200 animate-pulse" :
                                    battery.level <= 20 ? "text-orange-600 bg-orange-50 border-orange-200" :
                                        "text-gray-600 bg-gray-50 border-gray-200"
                                    }`}>
                                    {battery.charging ? (
                                        <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    ) : battery.level <= 10 ? (
                                        <BatteryLow className="w-3.5 h-3.5" />
                                    ) : (
                                        <Battery className="w-3.5 h-3.5" />
                                    )}
                                    <span className="text-xs font-bold font-mono">
                                        {Math.round(battery.level)}%
                                    </span>
                                </div>
                            )}
                            <div className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-400 border border-gray-200">
                                KIOSK MODE
                            </div>
                        </div>
                    )}
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
                            <GanttRoomUsage setGlobalValues={setGlobalValues} formData={globalValues} enableBooking={false} />
                        </CardContent>
                    </Card>

                    {/* Sidebar selection summary */}

                </div>
            </main>

            {/* FOOTER */}
            <footer className="text-center text-xs text-gray-400 py-4 bg-gray-50">
                <p>© {new Date().getFullYear()} Indofood ICBP • HOTS Facilities System</p>
                {isKioskMode && (
                    <p className="mt-1 font-mono text-[10px]">
                        Last Sync: {lastRefresh.toLocaleTimeString()}
                    </p>
                )}
            </footer>

            {/* POPUP FORM */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
                            Confirm Meeting Booking
                        </h3>

                        <div className="space-y-2 text-sm text-gray-700 mb-4">
                            <p><b>Room:</b> {String(globalValues.room || "")}</p>
                            <p><b>Date:</b> {String(globalValues.date || "")}</p>
                            <p><b>Time:</b> {String(globalValues.start_time || "")} – {String(globalValues.end_time || "")}</p>
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
                            <Button disabled={submitting || !PIC.trim() || !purpose.trim()} onClick={handleSubmitBooking}>
                                {submitting ? "Booking..." : "Confirm Booking"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* PERIODIC INFO MODAL */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 -tr-1/4 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                                Did you know?
                            </h3>

                            <p className="text-gray-600 leading-relaxed mb-8">
                                You can also schedule meetings via the <b>HOTS Portal</b> using your own account from your desk or anywhere.
                            </p>

                            <Button
                                className="w-full py-6 rounded-xl text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                onClick={() => setShowInfoModal(false)}
                            >
                                Got it!
                            </Button>

                            <p className="mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-widest italic">
                                Automatically closing in 2 minutes
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoomStandalone;
