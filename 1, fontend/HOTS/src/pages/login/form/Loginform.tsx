import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { validateLoginForm } from "@/utils/validation";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BaseLoginProps } from '@/types/loginTypes';

import axios from 'axios';
import { API_URL } from '../../../config/sourceConfig';

const Loginform = ({
  showPassword,
  setShowPassword,
  credentials,
  setCredentials,
  setForgotToggle,
  setLockedAccount,
}: BaseLoginProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loginBadge, setLoginBadge] = useState<any>(null);

  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/system-meta/login_badge_info`);
        if (response.data.success) {
          setLoginBadge(response.data.data);
        }
      } catch (err) {
        // Silently fail, badge is optional
      }
    };
    fetchBadge();
  }, []);

  const { isLoading, error, isAuthenticated, isLocked, loginAttempts } = useAppSelector(
    (state) => state.auth
  );

  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const remainingAttempts = Math.max(0, 5 - loginAttempts);

  // Clear error on input change
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [credentials.username, credentials.password, dispatch]);

  // Navigate if login successful
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      toast({
        title: "Login Successful",
        description: "Welcome back to HOTS",
      });
      navigate("/service-catalog");
    }
  }, [isAuthenticated, isLoading, navigate, toast]);

  // Account lock check
  useEffect(() => {
    if (isLocked) {
      setLockedAccount(true);
    }
  }, [isLocked, setLockedAccount]);

  // Toast error
  useEffect(() => {
    if (error && !isLoading) {
      if (error.includes("Too many login attempt")) {
        toast({
          title: "Account Locked",
          description: error,
          variant: "destructive",
          duration: 5000,
        });
        setLockedAccount(true);
      } else {
        toast({
          title: "Login Failed",
          description: error,
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  }, [error, isLoading, toast, setLockedAccount]);

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setCredentials({ ...credentials, [field]: value });

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateLoginForm(credentials.username, credentials.password);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});

    try {
      await dispatch(loginUser({
        username: credentials.username.trim(),
        password: credentials.password,
      })).unwrap();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Login Attempt Warning */}
      {loginAttempts > 0 && !isLocked && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="username">Username / Employee ID</Label>
        <Input
          id="username"
          type="text"
          value={credentials.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          placeholder="Enter your username"
          required
          disabled={isLoading}
          className={validationErrors.username ? "border-red-500" : ""}
        />
        {validationErrors.username && (
          <p className="text-sm text-red-600">{validationErrors.username}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className={validationErrors.password ? "border-red-500" : ""}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {validationErrors.password && (
          <p className="text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <button
            type="button"
            onClick={() => setForgotToggle(true)}
            className="text-blue-600 hover:text-blue-500"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-900 hover:bg-blue-800"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      {loginBadge && (
        <div className={`mt-4 p-4 rounded-xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm border-dashed ${loginBadge.bg_color || 'bg-blue-50/50'} ${loginBadge.border_color || 'border-blue-200'}`}>
          <div className="mt-1 flex-shrink-0">
            <div className={`p-1.5 rounded-lg bg-white shadow-sm ${loginBadge.text_color || 'text-blue-600'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${loginBadge.text_color || 'text-blue-800'}`}>
              {loginBadge.title || "Information"}
            </p>
            <div 
              className={`text-xs font-semibold leading-relaxed ${loginBadge.text_color || 'text-blue-900'} opacity-90`}
              dangerouslySetInnerHTML={{ __html: loginBadge.content }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>For technical support, contact IT Department</p>
      </div>
    </form>
  );
};

export default Loginform;
