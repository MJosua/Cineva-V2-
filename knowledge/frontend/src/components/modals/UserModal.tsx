
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface UserType {
  user_id?: number;
  user_name: string;
  firstname: string;
  lastname: string;
  uid: string;
  email: string;
  role_id: number;
  role_name?: string;
  department_id: number;
  team_name?: string;
  job_title: string;
  is_active: boolean;
  is_deleted: boolean;
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
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEdit = onSave,
  user,
  roles,
  departments,
}) => {
  const emptyUser: UserType = {
    user_name: '',
    firstname: '',
    lastname: '',
    uid: '',
    email: '',
    role_id: roles[0]?.role_id || 1,
    role_name: '',
    department_id: departments[0]?.department_id || 1,
    team_name: '',
    job_title: '',
    is_active: true,
    is_deleted: false,
  };

  const [formData, setFormData] = useState<UserType>(user ?? emptyUser);

  useEffect(() => {
    if (user) {
      const dept = departments.find(d => d.department_id === user.department_id);
      const role = roles.find(r => r.role_id === user.role_id);

      setFormData({
        user_id: user.user_id,
        user_name: user.user_name,
        firstname: user.firstname,
        lastname: user.lastname,
        uid: user.uid,
        email: user.email,
        role_id: role?.role_id || 1,
        role_name: role?.role_name || '',
        department_id: dept?.department_id || departments[0]?.department_id || 1,
        team_name: dept?.department_name || '',
        job_title: user.job_title || '',
        is_active: user.is_active,
        is_deleted: user.is_deleted,
      });
    } else {
      setFormData(emptyUser);
    }
  }, [user, departments, roles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onEdit(formData);
    }
    else{

      onSave(formData)
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="lastname">Last Name</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) =>
                  setFormData({ ...formData, lastname: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
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

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role_id.toString()}
              onValueChange={(value) => {
                const roleId = parseInt(value);
                const role = roles.find((r) => r.role_id === roleId);
                setFormData({
                  ...formData,
                  role_id: roleId,
                  role_name: role?.role_name || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles && roles.map((role) => (
                  <SelectItem
                    key={role.role_id}
                    value={role.role_id.toString()}
                  >
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department_id ? formData.department_id.toString() : '-'}
              onValueChange={(value) => {
                const deptId = parseInt(value);
                const dept = departments.find(
                  (d) => d.department_id === deptId
                );
                setFormData({
                  ...formData,
                  department_id: deptId,
                  team_name: dept?.department_name || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments && departments.map((dept) => (
                  <SelectItem
                    key={dept.department_id}
                    value={dept.department_id.toString()}
                  >
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
