import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Mock admin data - in production this comes from API
const MOCK_ADMINS = {
    "super@example.com": {
        id: "admin-1",
        email: "super@example.com",
        name: "Super Admin",
        role: "superadmin",
        password: "admin123"
    },
    "taiwan@example.com": {
        id: "admin-2",
        email: "taiwan@example.com",
        name: "Taiwan Admin",
        role: "admin",
        password: "taiwan123",
        permitted_events: ["tw-2024", "tw-2025"]
    },
    "maldives@example.com": {
        id: "admin-3",
        email: "maldives@example.com",
        name: "Maldives Admin",
        role: "admin",
        password: "maldives123",
        permitted_events: ["maldives-2025"]
    }
};

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage for existing session
        const stored = localStorage.getItem("event_admin");
        if (stored) {
            const adminData = JSON.parse(stored);
            // Normalize role for legacy/existing sessions (case-insensitive)
            if (adminData.role) {
                const normalized = adminData.role.toLowerCase();
                if (normalized === 'superadmin' || normalized === 'distributor') {
                    adminData.role = normalized;
                } else {
                    adminData.role = 'admin';
                }
            }
            setAdmin(adminData);
        }
        const storedEvent = localStorage.getItem("current_event");
        if (storedEvent) {
            setCurrentEvent(JSON.parse(storedEvent));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Derive Auth URL from VITE_API_BASE or fallback to localhost
            const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:9999/api/event-engine";
            const AUTH_URL = API_BASE.includes('/api/event-engine')
                ? API_BASE.replace('/api/event-engine', '/hots_auth/login')
                : `${API_BASE}/hots_auth/login`;

            const response = await fetch(AUTH_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: email, // The frontend field is named email, but we send it as uid
                    asin: password
                }),
            });

            const data = await response.json();

            if (data.success) {
                const user = data.userData;
                // Map HOTS user structure to Admin Context structure
                const adminUser = {
                    id: user.user_id,
                    email: user.email || user.uid,
                    name: `${user.firstname} ${user.lastname}`,
                    // Normalize role: HOTS uses type_id=9 OR role_id=4 for superadmin in this context
                    role: (user.type_id == 9 || user.role_id === 4) ? 'superadmin' : 'admin',
                    token: data.tokek, // Yes, the backend returns 'tokek'
                    permitted_events: [] // TODO: Fetch permissions if needed
                };

                // Manual Override for Super Admin based on known ID or Role
                if (user.role_id === 4 || user.role_name === 'Admin' || user.type_id === 9) {
                    // Check if 'Admin' in HOTS translates to 'Active Operator' or 'Super Admin'
                    // For now, let's trust the role_name or type_id
                }

                setAdmin(adminUser);
                localStorage.setItem("event_admin", JSON.stringify(adminUser));
                return { success: true };
            } else {
                return { success: false, error: data.message || "Login failed" };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, error: "Network error or server offline" };
        }
    };

    const logout = () => {
        setAdmin(null);
        setCurrentEvent(null);
        localStorage.removeItem("event_admin");
        localStorage.removeItem("current_event");
    };

    const selectEvent = (event) => {
        setCurrentEvent(event);
        localStorage.setItem("current_event", JSON.stringify(event));
    };

    const clearEvent = () => {
        setCurrentEvent(null);
        localStorage.removeItem("current_event");
    };

    const canAccessEvent = (eventSlug) => {
        if (!admin) return false;
        if (admin.role === "superadmin") return true;
        return admin.permitted_events?.includes(eventSlug);
    };

    return (
        <AuthContext.Provider value={{
            admin,
            currentEvent,
            loading,
            login,
            logout,
            selectEvent,
            clearEvent,
            canAccessEvent,
            isSuperAdmin: admin?.role === "superadmin"
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
