import React, { useEffect, useMemo } from "react";
import { Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import { DashboardFunction } from "@/types/hotsDashboard";
import { DashboardModuleLoader } from "../forms/dashboard/DashboardFormLoader";

interface DynamicDashboardRoutesProps {
  fallback?: React.ReactNode;
}

export const useDynamicDashboardRoutes = () => {
  const dispatch = useAppDispatch();
  const { data: dashboardFunctions, loading } = useAppSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchDashboardFunctions());
}, [dispatch]);


  const routes = useMemo(() => {
    if (dashboardFunctions.length === 0) return [];

    const activeModules = dashboardFunctions.filter(
      (func) => func.is_active && func.path && func.path.trim() !== ""
    );

    return activeModules.map((func: DashboardFunction) => (
      <Route
        key={func.id}
        path={func.path.replace(/^\/+/, "")}
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardModuleLoader />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    ));
  }, [dashboardFunctions]);

  return routes;
};

export const DynamicDashboardRoutes: React.FC<DynamicDashboardRoutesProps> = ({
  fallback,
}) => {
  const routes = useDynamicDashboardRoutes();
  if (routes.length === 0) return <>{fallback || null}</>;
  return <>{routes}</>;
};
