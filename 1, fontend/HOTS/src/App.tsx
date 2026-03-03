

import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import TokenExpiredModalWrapper from "@/components/modals/TokenExpiredModalWrapper";

// Pages
import Index from "./pages/Index";
import ServiceCatalog from "./pages/ServiceCatalog";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";
import TaskList from "./pages/TaskList";
import UserGuide from "./pages/UserGuide";
import HelpCenter from "./pages/HelpCenter";
import NotFound from "./pages/NotFound";
import Loginpage from "./pages/login/Loginpage";
import Registerpage from "./pages/login/Registerpage";
import ResetPasswordPage from "./pages/login/ResetPasswordPage";

// Admin
import ServiceCatalogAdmin from "./pages/admin/ServiceCatalogAdmin";
import ServiceFormEditor from "./pages/admin/ServiceFormEditor";
import StudioPage from "./pages/admin/StudioPage";
import StudioLanding from "./pages/admin/StudioLanding";
import UserManagement from "./pages/admin/UserManagement";
import TeamManagement from "./pages/admin/TeamManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import JobTitleManagement from "./pages/admin/JobTitleManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import CustomFunctionManagement from "./pages/admin/CustomFunctionManagement";
import FunctionLogsManagement from "./pages/admin/FunctionLogsManagement";
import AdminGuide from "./pages/admin/AdminGuide";
import TriggerFunctionManager from "./pages/admin/TriggerFunctionManager";

// Other
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useDynamicServiceRoutes } from "./components/routing/DynamicServiceRoutes";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeaderProvider } from "@/contexts/HeaderContext";

import { fetchDepartments } from "@/store/slices/userManagementSlice";
import { fetchSRF } from "./store/slices/srf_slice";
import { fetchsku } from "./store/slices/SKUslice";
import { fetchMyTickets } from '@/store/slices/ticketsSlice';

import { fetchTaskList, fetchTaskCount } from '@/store/slices/ticketsSlice';

import { AppDispatch } from './store';
import { useAppSelector } from "./hooks/useAppSelector";
import { fetchSrf_Puprose } from "./store/slices/srf_purpose";
import { SidebarProvider } from "./components/ui/sidebar";
import { DashboardPage } from "@/pages/dashboard";
import { useDynamicDashboardRoutes } from "./components/routing/DynamicDashboardRoutes";
import MeetingRoomStandalone from "./standalone/meetingbook/MeetingRoomStandalone";
import VerifyPage from "./pages/verify/VerifyRegister";
import { useSSE } from "./hooks/useSSE";

//cms
import CmsPublicPage from "@/pages/cms/CmsPublicPage";
import CmsAdminList from "@/pages/cms/CmsAdminList";
import CmsAdminEditor from "@/pages/cms/CmsAdminEditor";


import EngineModulePage from './pages/EngineModulePage';
import EngineModuleAdminPage from './pages/EngineModuleAdminPage';
import WorkflowParamEditorPage from './pages/WorkflowParamEditorPage';
import WorkflowAdminPage from "./pages/WorkflowAdminPage";

import TicketListPage from "./pages/module/admin/TicketListPage";
import TicketDetailPage from "./pages/module/admin/TicketDetailPage";

import TicketListViewPage from "./pages/module/view/TicketListViewPage";
import TicketViewPage from "./pages/module/view/TicketViewPage";
import JobMarketplace from "./pages/JobMarketplace";
import { MyAssignments } from "./pages/MyAssignments";
import JobListPage from "./pages/dashboard/report/JobListPage";
import AssignmentDetailPage from "./pages/dashboard/AssignmentDetailPage";
import ServiceAnalyticsView from "./pages/dashboard/ServiceAnalyticsView";
import DashboardView from "./pages/dashboard/DashboardView";
import CardGeneratorPage from "./pages/CardGeneratorPage";
import CardProfilePage from "./pages/public/CardProfilePage";


const queryClient = new QueryClient();



const AppContentInner = () => {


  const dispatch = useDispatch<AppDispatch>();

  const { taskCount } = useAppSelector(state => state.tickets);

  // 🆕 SSE: Connect to real-time event stream for live updates
  useSSE();

  const navigate = useNavigate();

  // 🛡️ Kiosk Isolation Guard: Ensure Kiosks stay on the Meeting Room page
  useEffect(() => {
    const isKiosk = localStorage.getItem("isKiosk") === "true";
    const currentPath = window.location.pathname;

    // If Kiosk mode is active but user is NOT on the meetingbook page
    if (isKiosk && !currentPath.includes("/meetingbook")) {
      console.log("Kiosk mode detected. Restricting to Meeting Room Standalone...");
      // Soft internal redirect instead of window.location.href to prevent splash-screen hang
      navigate("/meetingbook?kiosk_key=TABLET_IOD_ASIA", { replace: true });
    }
  }, [navigate]);

  const handleServiceSubmit = useCallback((data: any) => {
    // console.log("Service form submitted:", data);
  }, []);

  const dynamicServiceRoutes = useDynamicServiceRoutes(handleServiceSubmit);
  const dynamicDashboardRoutes = useDynamicDashboardRoutes();

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Loginpage />} />
        <Route path="/register" element={<Registerpage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/forgot-password/:token" element={<ResetPasswordPage />} />
        <Route path="/card/card" element={<CardProfilePage />} />
        <Route path="/meetingbook" element={<MeetingRoomStandalone />} />


        {/* Protected Routes */}
        {/* ✅ Optimized Layout Routes (Persistent Search & Sidebar) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/teams" element={<TeamManagement />} />

          {/* Admin Routes */}
          <Route path="/admin/service-catalog" element={<ServiceCatalogAdmin />} />
          <Route path="/admin/service-catalog/new" element={<ServiceFormEditor />} />
          <Route path="/admin/service-catalog/create" element={<ServiceFormEditor />} />
          <Route path="/admin/service-catalog/edit/:id" element={<ServiceFormEditor />} />
          <Route path="/admin/studio" element={<StudioLanding />} />
          <Route path="/admin/studio/:id" element={<StudioPage />} />
          <Route path="/admin/departments" element={<DepartmentManagement />} />
          <Route path="/admin/divisions" element={<DepartmentManagement />} />
          <Route path="/admin/job-titles" element={<JobTitleManagement />} />
          <Route path="/admin/settings" element={<SystemSettings />} />
          <Route path="/admin/custom-functions" element={<CustomFunctionManagement />} />
          <Route path="/admin/function-logs" element={<FunctionLogsManagement />} />
          <Route path="/admin/api-builder" element={<TriggerFunctionManager />} />
          <Route path="/admin/guide" element={<AdminGuide />} />

          {/* Engine & Module Admin */}
          <Route path="/admin/cms" element={<CmsAdminList />} />
          <Route path="/admin/cms/new" element={<CmsAdminEditor />} />
          <Route path="/admin/cms/edit/:id" element={<CmsAdminEditor />} />

          <Route path="/engine-module/:moduleKey" element={<EngineModulePage />} />
          <Route path="/engine-modules-admin" element={<EngineModuleAdminPage />} />
          <Route path="/admin/workflow" element={<WorkflowAdminPage />} />
          <Route path="/admin/workflow/params/:workflow_id" element={<WorkflowParamEditorPage />} />

          <Route path="/admin/tickets" element={<TicketListPage />} />
          <Route path="/admin/tickets/:ticket_id" element={<TicketDetailPage />} />

          <Route path="/tickets" element={<TicketListViewPage />} />
          <Route path="/tickets/:ticket_id" element={<TicketViewPage />} />

          {/* My Assignments & Marketplace */}
          <Route path="/job-marketplace" element={<JobMarketplace />} />
          <Route path="/my-assignments" element={<MyAssignments />} />
          <Route path="/assignment/:ticket_id" element={<AssignmentDetailPage />} />

          {/* User & Help Routes */}
          <Route path="/task-list" element={<TaskList />} />
          <Route path="/service-catalog" element={<ServiceCatalog />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/help/user-guide" element={<HelpCenter />} />
          <Route path="/help/faq" element={<UserGuide />} />
          <Route path="/user-guide" element={<UserGuide />} />
          <Route path="/faq" element={<UserGuide />} />

          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/tickets" element={<TicketListViewPage />} />
          <Route path="/tickets/:ticket_id" element={<TicketViewPage />} />

          {/* Dashboard & Reports (Moved inside) */}
          <Route path="/dashboard/analytics/:serviceId" element={<ServiceAnalyticsView />} />
          <Route path="/dashboard/view/:dashboardId" element={<DashboardView />} />
          <Route path="/dashboard/job-list" element={<JobListPage />} />
          <Route path="/card-generator" element={<CardGeneratorPage />} />

          {dynamicDashboardRoutes}
          {dynamicServiceRoutes}
        </Route>

        {/* Public / Semi-Public with Layout */}
        <Route element={<AppLayout />}>
          <Route path="/page/:slug" element={<CmsPublicPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

      </Routes>

      <TokenExpiredModalWrapper />
      <Toaster />
    </div>
  );
};

const AppContent = () => (
  <Router basename={import.meta.env.BASE_URL}>
    <AppContentInner />
  </Router>
);

const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HeaderProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <AppContent />
          </ThemeProvider>
        </HeaderProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
