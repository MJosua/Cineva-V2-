import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  // Check both Redux state and localStorage for authentication
  const localToken = localStorage.getItem('hots_tokek');
  const isAuth = isAuthenticated && (token || localToken);
  
  if (!isAuth) {
    // Save current path to redirect back after login
    const searchParams = new URLSearchParams();
    searchParams.set('redirect', location.pathname + location.search);
    
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
