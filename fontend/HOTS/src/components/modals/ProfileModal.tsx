import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload, Check, AlertCircle, User, Mail, Building, IdCard, PenTool } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { API_URL } from '@/config/sourceConfig';
import axios from 'axios';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  user_id: number;
  uid: string;
  firstname: string;
  lastname: string;
  email: string;
  department_id: number;
  department_name: string;
  attributes: Record<string, string>;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get token from localStorage (HOTS uses 'tokek')
  const getToken = () => localStorage.getItem('tokek');

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen && getToken()) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/hots_profile/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // Fallback to redux user data if API fails
      setError('Could not load extended profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Please upload a PNG or JPEG image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('signature', file);

    try {
      const response = await axios.post(`${API_URL}/hots_profile/upload_signature`, formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUploadSuccess(true);
        // Refresh profile to get new signature path
        await fetchProfile();
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error uploading signature:', err);
      setError('Failed to upload signature');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const first = profileData?.firstname || user?.firstname || '';
    const last = profileData?.lastname || user?.lastname || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  };

  const signaturePath = profileData?.attributes?.default_signature;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar & Name Section */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarFallback className="text-lg font-semibold bg-primary/10">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {profileData?.firstname || user?.firstname} {profileData?.lastname || user?.lastname}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profileData?.department_name || user?.department_name || 'No Department'}
              </p>
              <Badge variant="outline" className="mt-1">
                {profileData?.uid || user?.uid || 'N/A'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Profile Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <p className="text-sm font-medium truncate">
                {profileData?.email || user?.email || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Building className="w-3 h-3" /> Department
              </Label>
              <p className="text-sm font-medium">
                {profileData?.department_name || user?.department_name || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IdCard className="w-3 h-3" /> NIK
              </Label>
              <p className="text-sm font-medium">
                {user?.nik || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> User ID
              </Label>
              <p className="text-sm font-medium">
                {profileData?.user_id || user?.user_id || '-'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Digital Signature Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Digital Signature
            </Label>

            <div className="flex items-center gap-4">
              {/* Signature Preview */}
              <div className="w-32 h-20 border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                {signaturePath ? (
                  <img
                    src={`${API_URL}${signaturePath}`}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-2">
                    No signature uploaded
                  </span>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {signaturePath ? 'Change Signature' : 'Upload Signature'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG or JPEG, max 2MB
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Signature uploaded successfully!
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Additional Attributes */}
          {profileData?.attributes && Object.keys(profileData.attributes).filter(k => k !== 'default_signature').length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Additional Information</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(profileData.attributes)
                    .filter(([key]) => key !== 'default_signature')
                    .map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
