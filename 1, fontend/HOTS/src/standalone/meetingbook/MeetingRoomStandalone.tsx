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
    const [PICId, setPICId] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
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
        } else if (isKioskMode && token) {
            // Check if existing token is valid/expired
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                if (isExpired) {
                    console.log("Kiosk token expired. Forcing re-login...");
                    localStorage.removeItem("tokek");
                    setToken(null);
                }
            } catch (e) {
                console.error("Failed to parse token:", e);
            }
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
        } catch (error: any) {
            console.error("Failed to fetch user profile:", error);
            // If profile fetch fails with 401, clear token to trigger auto-login
            if (error.response?.status === 401) {
                console.log("Token invalid or expired. Clearing...");
                localStorage.removeItem("tokek");
                setToken(null);
            }
        }
    };

    useEffect(() => {
        if (token) fetchUserProfile();
    }, [token]);

    // 🔋 Battery API Integration
    useEffect(() => {
        // @ts-ignore
        if (!navigator.getBattery) return;

        // @ts-ignore
        navigator.getBattery().then((batt) => {
            setBattery(batt);

            const updateBattery = () => setBattery(batt);
            batt.addEventListener("levelchange", updateBattery);
            batt.addEventListener("chargingchange", updateBattery);

            // Initial check
            checkBatteryStatus(batt);
        });
    }, []);

    const checkBatteryStatus = async (batt: any) => {
        if (!isKioskMode || !token) return;

        console.log(`🔋 Battery Check: ${batt.level * 100}%, Charging: ${batt.charging}`);

        // Threshold: 10% (0.1)
        if (batt.level <= 0.1 && !batt.charging && !ticketSentRef.current) {
            console.log("⚠️ Critical Battery Level detected. Launching auto-ticket...");

            try {
                // Service ID 7: IT Support
                const payload = {
                    service_id: 7,
                    form_data: {
                        title: "CRITICAL: Kiosk Low Battery",
                        description: `Tablet Kiosk (User: Table IOD Asia) is at ${Math.round(batt.level * 100)}% and NOT charging. Please check power source immediately.`,
                        priority: "High",
                        category: "Hardware",
                    }
                };

                const res = await axios.post(`${API_URL}/hots_ticket/create/ticket/7`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data && res.data.success) {
                    console.log("✅ Battery Ticket Created:", res.data);
                    ticketSentRef.current = true;
                    toast({
                        title: "Battery Alert Sent",
                        description: "IT Support has been notified.",
                        variant: "destructive",
                    });
                } else {
                    console.error("❌ Ticket Creation Failed:", res.data);
                }
            } catch (error: any) {
                console.error("❌ Error sending battery ticket:", error.response?.data || error.message);
            }
        }
    };

    // Monitor changes
    useEffect(() => {
        if (battery) checkBatteryStatus(battery);

        // Reset the flag if battery recovered or charging
        if (battery && (battery.level > 0.15 || battery.charging)) {
            ticketSentRef.current = false;
        }
    }, [battery, isKioskMode, token]);

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
        if (!PICId) {
            toast({
                title: "Invalid PIC",
                description: "Please select a valid PIC from the suggestions list.",
                variant: "destructive",
            });
            return;
        }
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
                PIC_user_id: { type: "field", label: "PIC User ID", value: String(PICId || ""), field_id: "PIC_user_id_field" },
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
                title: "Meeting room booked successfully!",
                description: "Note: To Edit or Delete, the PIC must manage it via the HOTS Generated Ticket.",
            });

            setShowForm(false);
            setGlobalValues({});
            setPurpose("");
            setPIC("");
            setPICId(null);
        } catch (err) {
            console.error(err);
            toast({
                title: "Failed to book room.",
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
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Enter person in charge"
                                    value={PIC}
                                    className={showSuggestions && !PICId && PIC.length >= 2 ? "border-red-500 ring-red-200" : ""}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        setPIC(val);
                                        setPICId(null); // Reset ID on type
                                        if (val.length >= 2) {
                                            try {
                                                const res = await axios.get(`${API_URL}/hots_settings/search/users?query=${val}`, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
                                                });
                                                if (res.data.success) {
                                                    setSuggestions(res.data.data);
                                                    setShowSuggestions(true);
                                                }
                                            } catch (err) {
                                                console.error("Search error", err);
                                            }
                                        } else {
                                            setSuggestions([]);
                                            setShowSuggestions(false);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (!showSuggestions || suggestions.length === 0) return;

                                        // Find currently highlighted index or default to -1
                                        const currentIdx = suggestions.findIndex(s => s.highlighted);

                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            const nextIdx = currentIdx < suggestions.length - 1 ? currentIdx + 1 : 0;
                                            setSuggestions(suggestions.map((s, i) => ({ ...s, highlighted: i === nextIdx })));
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            const prevIdx = currentIdx > 0 ? currentIdx - 1 : suggestions.length - 1;
                                            setSuggestions(suggestions.map((s, i) => ({ ...s, highlighted: i === prevIdx })));
                                        } else if (e.key === "Enter") {
                                            e.preventDefault();
                                            const selected = suggestions[currentIdx >= 0 ? currentIdx : 0];
                                            if (selected) {
                                                setPIC(`${selected.firstname} ${selected.lastname}`);
                                                setPICId(selected.user_id);
                                                setShowSuggestions(false);
                                            }
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                />
                                {showSuggestions && !PICId && PIC.length >= 2 && (
                                    <p className="text-[10px] text-red-500 mt-1 font-semibold animate-pulse">
                                        * Please make sure you select a name from the selection list.
                                    </p>
                                )}

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-[100] w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {suggestions.map((user) => (
                                            <div
                                                key={user.user_id}
                                                className={`px-4 py-2 cursor-pointer text-sm ${user.highlighted || (suggestions.length === 1) ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                                                onClick={() => {
                                                    setPIC(`${user.firstname} ${user.lastname}`);
                                                    setPICId(user.user_id);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <b>{user.firstname} {user.lastname}</b> <span className="text-gray-400">({user.uid})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <label className="block text-sm font-medium">Purpose</label>
                            <Textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Enter meeting purpose or agenda"
                            />
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-xs text-blue-700 leading-relaxed shadow-sm">
                            <div className="mt-0.5 text-blue-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            </div>
                            <p>
                                <b>Important:</b> To Edit or Delete this booking later, the PIC needs to execute it via the <b>HOTS Generated Ticket</b>.
                            </p>
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
