
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  
  // Check both Redux state and localStorage for authentication
  const localToken = localStorage.getItem('tokek');
  const isAuth = isAuthenticated && (token || localToken);
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
