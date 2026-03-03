import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSelector } from '@/hooks/useAppSelector';
import { Department } from '@/store/slices/userManagementSlice';
import { Combobox } from "@/components/ui/combobox";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
  mode: 'add' | 'edit';
  onSave: (department: any) => void;
}

const DepartmentModal = ({ isOpen, onClose, department, mode, onSave }: DepartmentModalProps) => {
  const { users } = useAppSelector(state => state.userManagement);
  const [formData, setFormData] = useState({
    department_name: department?.department_name || '',
    department_shortname: department?.department_shortname || '',
    description: department?.description || '',
    department_head: department?.department_head?.toString() || '',
    status: department?.finished_date ? 'inactive' : 'active'
  });

  const handleSave = () => {
    const departmentToSave = {
      ...formData,
      department_head: formData.department_head ? parseInt(formData.department_head) : null
    };
    onSave(departmentToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Department' : 'Edit Department'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department_name">Department Name</Label>
            <Input
              id="department_name"
              value={formData.department_name}
              onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
              placeholder="Enter department name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department_shortname">Department Code</Label>
            <Input
              id="department_shortname"
              value={formData.department_shortname}
              onChange={(e) => setFormData({ ...formData, department_shortname: e.target.value })}
              placeholder="Enter department code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head">Department Head</Label>
            <Combobox
              options={users.map(u => ({ value: u.user_id?.toString() || '', label: `${u.firstname} ${u.lastname}` }))}
              value={formData.department_head}
              onChange={(value) => setFormData({ ...formData, department_head: value })}
              placeholder="Select department head..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {mode === 'add' ? 'Add Department' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentModal;
