
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Combobox } from "@/components/ui/combobox";

interface UserType {
  user_id?: number;
  user_name: string;
  firstname: string;
  lastname: string;
  uid: string;
  email: string;
  phone?: string;
  nik?: string;
  role_id: number;
  role_name?: string;
  department_id: number;
  team_name?: string;
  jobtitle_id?: number;
  job_title?: string;
  superior_id?: number;
  is_active: boolean;
  is_deleted: boolean;
}

interface JobTitle {
  jobtitle_id: number;
  job_title: string;
}

interface Superior {
  user_id: number;
  firstname: string;
  lastname: string;
  department_id: number;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserType) => void;
  mode?: 'add' | 'edit';
  onEdit?: (user: UserType) => void;
  user?: UserType | null;
  roles: Array<{ role_id: number; role_name: string }>;
  departments: Array<{ department_id: number; department_name: string }>;
  jobTitles?: JobTitle[];
  superiors?: Superior[];
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEdit = onSave,
  user,
  roles,
  departments,
  jobTitles = [],
  superiors = [],
}) => {
  const emptyUser: UserType = {
    user_name: '',
    firstname: '',
    lastname: '',
    uid: '',
    email: '',
    phone: '',
    nik: '',
    role_id: roles[0]?.role_id || 1,
    role_name: '',
    department_id: departments[0]?.department_id || 1,
    team_name: '',
    jobtitle_id: undefined,
    job_title: '',
    superior_id: undefined,
    is_active: true,
    is_deleted: false,
  };




  // Initialize state directly from prop (relies on key prop in parent to force remount)
  const [formData, setFormData] = useState<UserType>(user ?? emptyUser);

  // Filter superiors by selected department
  const filteredSuperiors = useMemo(() => {
    if (!formData.department_id) return superiors;
    return superiors.filter(s => s.department_id === formData.department_id);
  }, [superiors, formData.department_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onEdit(formData);
    }
    else {
      onSave(formData)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstname">First Name</Label>
            <Input
              id="firstname"
              value={formData.firstname}
              onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastname">Last Name</Label>
            <Input
              id="lastname"
              value={formData.lastname}
              onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="user_name">Username</Label>
            <Input
              id="user_name"
              value={formData.uid}
              onChange={(e) =>
                setFormData({ ...formData, uid: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+62..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nik">NIK (Employee ID)</Label>
            <Input
              id="nik"
              value={formData.nik || ''}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              placeholder="Employee identification number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Combobox
              options={roles.map(r => ({ value: r.role_id.toString(), label: r.role_name }))}
              value={formData.role_id?.toString()}
              onChange={(value) => {
                const roleId = parseInt(value) || 0;
                const role = roles.find((r) => r.role_id === roleId);
                setFormData({ ...formData, role_id: roleId, role_name: role?.role_name || '' });
              }}
              placeholder="Select role..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Combobox
              options={departments.map(d => ({ value: d.department_id.toString(), label: d.department_name }))}
              value={formData.department_id?.toString()}
              onChange={(value) => {
                const deptId = parseInt(value) || 0;
                const dept = departments.find(
                  (d) => d.department_id === deptId
                );
                setFormData({
                  ...formData,
                  department_id: deptId,
                  team_name: dept?.department_name || '',
                  superior_id: undefined, // Reset superior when department changes
                });
              }}
              placeholder="Select department..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobtitle">Job Title</Label>
            <Combobox
              options={jobTitles.map(j => ({ value: j.jobtitle_id.toString(), label: j.job_title }))}
              value={formData.jobtitle_id?.toString() || ''}
              onChange={(value) => {
                const jobId = parseInt(value);
                const job = jobTitles.find((j) => j.jobtitle_id === jobId);
                setFormData({
                  ...formData,
                  jobtitle_id: jobId || undefined,
                  job_title: job?.job_title || '',
                });
              }}
              placeholder="Select job title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="superior">Superior / Manager</Label>
            <Combobox
              options={filteredSuperiors.map(s => ({ value: s.user_id.toString(), label: `${s.firstname} ${s.lastname}` }))}
              value={formData.superior_id?.toString() || ''}
              onChange={(value) => setFormData({ ...formData, superior_id: parseInt(value) || undefined })}
              placeholder="Select superior..."
            />
            {formData.department_id && filteredSuperiors.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No superiors found in this department</p>
            )}
          </div>

          {/* Active Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </DialogContent >
    </Dialog >
  );
};

export default UserModal;
