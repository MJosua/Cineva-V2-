import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import EngineLayout from "./layouts/EngineLayout";
import EventAdminLayout from "./layouts/EventAdminLayout";

// Public Pages
import EnginePage from "./pages/Public/EnginePage";

// Admin Pages
import AdminLogin from "./pages/Admin/Login";
import EventSelector from "./pages/Admin/EventSelector";
import EventDashboard from "./pages/Admin/EventDashboard";
import EventEditor from "./pages/Admin/EventEditor";
import SubmissionsPage from "./pages/Admin/SubmissionsPage";
import CouponsPage from "./pages/Admin/CouponsPage";
import ReportsPage from "./pages/Admin/ReportsPage";
import WinnerGeneratorPage from "./pages/Admin/WinnerGeneratorPage";
import SettingsPage from "./pages/Admin/SettingsPage";
import AdminManagementPage from "./pages/Admin/AdminManagementPage";

function AppRouter() {
    return (
        <ChakraProvider theme={theme}>
            <AuthProvider>
                <BrowserRouter basename="/event">
                    <Routes>
                        {/* Admin Login */}
                        <Route path="/admin/login" element={<AdminLogin />} />

                        {/* Event Selector (after login) */}
                        <Route path="/admin/events" element={<EventSelector />} />

                        {/* Event-Scoped Admin Routes */}
                        <Route path="/admin/event/:slug" element={<EventAdminLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<EventDashboard />} />
                            <Route path="editor" element={<EventEditor />} />
                            <Route path="coupons" element={<CouponsPage />} />
                            <Route path="submissions" element={<SubmissionsPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="winners" element={<WinnerGeneratorPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="admins" element={<AdminManagementPage />} />
                        </Route>

                        {/* Legacy redirect */}
                        <Route path="/admin" element={<Navigate to="/admin/events" replace />} />
                        <Route path="/admin/dashboard" element={<Navigate to="/admin/events" replace />} />

                        {/* Public Routes (Engine) */}
                        <Route path="/" element={<EngineLayout />}>
                            <Route index element={<div>Event Engine Home</div>} />
                            <Route path=":slug" element={<EnginePage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ChakraProvider>
    );
}

export default AppRouter;
