
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Division {
  id: string;
  name: string;
  code: string;
  description: string;
  parentDivision: string;
  head: string;
  status: string;
}

interface DivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  division?: Division | null;
  mode: 'add' | 'edit';
  onSave: (division: Division) => void;
}

const DivisionModal = ({ isOpen, onClose, division, mode, onSave }: DivisionModalProps) => {
  const [formData, setFormData] = useState<Division>({
    id: '',
    name: '',
    code: '',
    description: '',
    parentDivision: '',
    head: '',
    status: 'active'
  });

  useEffect(() => {
    if (division && mode === 'edit') {
      setFormData(division);
    } else {
      setFormData({
        id: '',
        name: '',
        code: '',
        description: '',
        parentDivision: '',
        head: '',
        status: 'active'
      });
    }
  }, [division, mode, isOpen]);

  const handleSave = () => {
    const divisionToSave = {
      ...formData,
      id: mode === 'add' ? Date.now().toString() : formData.id
    };
    onSave(divisionToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Division' : 'Edit Division'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Division Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter division name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Division Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              placeholder="Enter division code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head">Division Head</Label>
            <Select value={formData.head || "no_head"} onValueChange={(value) => setFormData({...formData, head: value === "no_head" ? "" : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select division head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_head">No Head Assigned</SelectItem>
                <SelectItem value="john.doe">John Doe</SelectItem>
                <SelectItem value="jane.smith">Jane Smith</SelectItem>
                <SelectItem value="ahmad.rahman">Ahmad Rahman</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
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
            {mode === 'add' ? 'Add Division' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DivisionModal;
