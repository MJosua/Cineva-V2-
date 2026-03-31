import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { resetLoginAttempts } from '@/store/slices/authSlice';
import Loginform from './form/Loginform';
import Forgotpassform from './form/Forgotpassform';
import Recoveryform from './form/Recoveryform';
import Lockedaccount from './form/Lockedaccount';
import LoginNoticeSidebar from './LoginNoticeSidebar';
import { useCatalogData } from '@/hooks/useCatalogData';
import { Loader2 } from 'lucide-react';

const Loginpage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const { serviceCatalog, isLoading: catalogLoading, fetchData } = useCatalogData();

  const [showPassword, setShowPassword] = useState(false);
  const [forgotToggle, setForgotToggle] = useState(false);
  const [recoveryToggle, setRecoveryToggle] = useState(false);
  const [lockedAccount, setLockedAccount] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  // Redirect if already authenticated, but wait for catalog hydration
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (serviceCatalog.length === 0 && !catalogLoading) {
        console.log("🔄 Authenticated but catalog empty, triggering fetch...");
        fetchData();
        return;
      }

      if (!catalogLoading && serviceCatalog.length > 0) {
        const redirectTo = searchParams.get('redirect') || '/service-catalog';
        console.log("🚀 Catalog ready, navigating to:", redirectTo);
        navigate(redirectTo, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, catalogLoading, serviceCatalog.length, navigate, searchParams, fetchData]);

  // Reset login attempts when toggling back to login
  useEffect(() => {
    if (!forgotToggle && !lockedAccount && !recoveryToggle) {
      dispatch(resetLoginAttempts());
    }
  }, [forgotToggle, lockedAccount, recoveryToggle, dispatch]);

  if (isAuthenticated && (catalogLoading || serviceCatalog.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center w-screen space-y-4">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping" />
            <div className="relative bg-white p-4 rounded-full shadow-inner">
               <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Synchronizing Systems</h2>
            <p className="text-gray-500 text-sm font-medium">Preparing your workspace, please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center w-screen p-4 lg:p-8">
      {/* 
          Balanced grid on desktop: [1fr (Balancer) | Auto (Form) | 1fr (Notification)]
          This ensures the middle column (Form) stays exactly in the horizontal center of the screen.
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center justify-center max-w-[1600px] w-full h-full">
        
        {/* Column 1: Left Balancer (Phanton spacer to keep Form centered) */}
        <div className="hidden lg:block pointer-events-none" aria-hidden="true" style={{ width: '384px' }}>
          {/* We use the same width as the sidebar (w-96 = 384px) to balance the centering */}
        </div>

        {/* Column 2: Main Login Card (Centered) */}
        <Card className="w-full max-w-md shadow-2xl border-none shrink-0 overflow-hidden bg-white/90 backdrop-blur-sm z-10">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {lockedAccount ? (
              <Lockedaccount
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                credentials={credentials}
                setCredentials={setCredentials}
                setLockedAccount={setLockedAccount}
                setForgotToggle={setForgotToggle}
              />
            ) : recoveryToggle ? (
              <Recoveryform
                setRecoveryToggle={setRecoveryToggle}
                setForgotToggle={setForgotToggle}
              />
            ) : forgotToggle ? (
              <Forgotpassform 
                  setForgotToggle={setForgotToggle}
                  setRecoveryToggle={setRecoveryToggle}
                />
            ) : (
              <Loginform
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                credentials={credentials}
                setCredentials={setCredentials}
                setForgotToggle={setForgotToggle}
                setLockedAccount={setLockedAccount}
              />
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a onClick={() => navigate("/register")} className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer">
                  Sign up
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Column 3: CMS Notice Sidebar (Right-aligned) */}
        <div className="w-full lg:w-96 flex justify-start items-center">
           <LoginNoticeSidebar />
        </div>
      </div>
    </div>
  );
};

export default Loginpage;
