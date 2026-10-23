import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getToken = () => localStorage.getItem('hots_tokek');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/hots_auth/change_pass`, {
        pswd: formData.oldPassword,
        newPswd: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Your password has been changed successfully",
        });
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        onClose();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Old Password</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOld ? "text" : "password"}
                placeholder="Enter current password"
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min 8 characters)"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmation Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
