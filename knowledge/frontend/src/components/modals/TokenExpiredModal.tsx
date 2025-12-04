import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, X, Lock, User } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { loginUser, getPersistentUserData, loadPersistentUser } from "@/store/slices/authSlice";
import { fetchCatalogData } from "@/store/slices/catalogSlice";
import { fetchMyTickets, fetchAllTickets, fetchTaskList } from "@/store/slices/ticketsSlice";

interface TokenExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin: () => void;
  username: string;
}

const TokenExpiredModal: React.FC<TokenExpiredModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLogin,
  username
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isLoading, user } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [effectiveUsername, setEffectiveUsername] = useState(username);

  // Load persistent user data on mount
  useEffect(() => {
    if (isOpen && (!user?.uid || !effectiveUsername)) {
      dispatch(loadPersistentUser());
      const persistentData = getPersistentUserData();
      if (persistentData?.uid) {
        setEffectiveUsername(persistentData.uid);
      }
    }
  }, [isOpen, user?.uid, effectiveUsername, dispatch]);

  const handleClose = () => {
    // Reset form state
    setPassword('');
    setValidationError('');
    setShowPassword(false);
    
    // Call the logout navigation handler
    onNavigateToLogin();
  };

  const [trialCount, setTrialCount] = useState<number>(() => {
    const stored = localStorage.getItem('trialCount');
    return stored ? parseInt(stored) : 3; // default to 3 attempts
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = trialCount - 1;
    setTrialCount(updated);
    localStorage.setItem('trialCount', updated.toString());
    
    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    setValidationError('');

    // Use multiple fallbacks for username
    const loginUsername = user?.uid || user?.username || effectiveUsername || username;
    
    if (!loginUsername) {
      setValidationError('Unable to retrieve username for re-authentication');
      return;
    }

    try {
      await dispatch(loginUser({
        username: loginUsername,
        password: password,
      })).unwrap();
      
      // Re-fetch all data after successful authentication
      dispatch(fetchCatalogData());
      dispatch(fetchMyTickets(1));
      dispatch(fetchAllTickets(1));
      dispatch(fetchTaskList(1));

      toast({
        title: "Authentication Successful",
        description: "Your session has been renewed and data refreshed",
      });

      setPassword('');
      setValidationError('');
      setShowPassword(false);
      onClose();
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Please check your password and try again",
        variant: "destructive",
      });

      setValidationError('Invalid password');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="absolute right-4 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DialogHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Session Expired
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Your session has expired. Please re-enter your password to continue.
            </p>
            {effectiveUsername && (
              <p className="text-sm text-gray-500 mt-1">
                Re-authenticating as: <span className="font-medium">{effectiveUsername}</span>
              </p>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isLoading}
                className={`pr-10 ${validationError ? "border-red-500" : ""}`}
                required
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
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Continue Session
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              End Session & Logout
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>For security, please verify your identity to continue</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenExpiredModal;
