
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const [profile, setProfile] = useState({
    name: 'Yosua Gultom',
    email: 'yosua.gultom@indofood.com',
    department: 'International Operation',
    phone: '+62 812 3456 7890',
    bio: 'International Operations Manager with 5+ years experience in global supply chain management.',
    avatar: ''
  });
  const { user } = useAppSelector((state) => state.auth);
  const handleSave = () => {
    // console.log('Saving profile:', profile);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-lg font-semibold">
                {typeof user?.firstname === 'string'
                  ? user.firstname.split(' ').map(n => n?.[0] || '').join('')
                  : 'N'}
              </AvatarFallback>
            </Avatar>

          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={user?.user_name || user?.firstname}
                disabled
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={user?.department_name}
                disabled
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">nik</Label>
              <Input
                id="nik"
                value={user?.nik || ""}
                disabled
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>


          </div>

          {/* Actions */}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
