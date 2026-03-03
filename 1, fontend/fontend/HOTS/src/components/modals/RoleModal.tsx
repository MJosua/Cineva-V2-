
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Role {
  id: string;
  name: string;
  permissions: number;
  description: string;
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  mode: 'add' | 'edit';
  onSave: (role: Role) => void;
}

const RoleModal = ({ isOpen, onClose, role, mode, onSave }: RoleModalProps) => {
  const [formData, setFormData] = useState<Role>({
    id: '',
    name: '',
    permissions: 0,
    description: ''
  });

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData(role);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        permissions: 0,
        description: ''
      });
    }
  }, [role, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (field: keyof Role, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Create New Role' : 'Edit Role'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter role name"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="permissions">Number of Permissions</Label>
            <Input
              id="permissions"
              type="number"
              value={formData.permissions}
              onChange={(e) => handleChange('permissions', parseInt(e.target.value) || 0)}
              placeholder="Enter number of permissions"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter role description"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleModal;
