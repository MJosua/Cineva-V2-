
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { WorkflowGroup } from '@/store/slices/userManagementSlice';
import WorkflowStepsManager, { WorkflowStepData } from '@/components/workflow/WorkflowStepsManager';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { fetchWorkflowSteps, deleteWorkflowStep } from '@/store/slices/userManagementSlice';

interface WorkflowGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowGroup: WorkflowGroup | null;
  mode: 'add' | 'edit';
  onSave: (workflowGroup: any, steps: WorkflowStepData[], isEdit: boolean, existingStepIds?: number[]) => void;
  users: any[];
}

const WorkflowGroupModal = ({ isOpen, onClose, workflowGroup, mode, onSave }: WorkflowGroupModalProps) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category_ids: [],
    is_active: true
  });

  const [steps, setSteps] = useState<WorkflowStepData[]>([]);
  const [existingStepIds, setExistingStepIds] = useState<number[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  useEffect(() => {
    if (workflowGroup && mode === 'edit') {
      setFormData({
        name: workflowGroup.name,
        description: workflowGroup.description,
        category_ids: workflowGroup.category_ids,
        is_active: workflowGroup.is_active
      });
      
      // Load existing steps when editing
      if (workflowGroup.id || workflowGroup.workflow_group_id) {
        setIsLoadingSteps(true);
        const groupId = workflowGroup.id || workflowGroup.workflow_group_id;
        
        dispatch(fetchWorkflowSteps(groupId))
          .then((result) => {
            if (result.payload && Array.isArray(result.payload)) {
              const formattedSteps: WorkflowStepData[] = result.payload.map((step: any) => ({
                step_order: step.step_order,
                step_type: step.step_type,
                assigned_value: step.assigned_value,
                description: step.description,
                is_active: step.is_active
              }));
              
              // Store existing step IDs for cleanup
              const stepIds = result.payload.map((step: any) => step.step_id).filter(Boolean);
              setExistingStepIds(stepIds);
              setSteps(formattedSteps);
            }
          })
          .catch((error) => {
            console.error('Error fetching workflow steps:', error);
          })
          .finally(() => {
            setIsLoadingSteps(false);
          });
      }
    } else {
      setFormData({
        name: '',
        description: '',
        category_ids: [],
        is_active: true
      });
      setSteps([]);
      setExistingStepIds([]);
    }
  }, [workflowGroup, mode, isOpen, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleSave = async () => {
    const workflowToSave = mode === 'edit' && workflowGroup 
      ? { ...formData, workflow_group_id: workflowGroup.workflow_group_id, id: workflowGroup.id }
      : formData;
    
    // For edit mode, we need to clean up existing steps first
    if (mode === 'edit' && existingStepIds.length > 0) {
      try {
        // Delete existing steps to prevent duplication
        await Promise.all(
          existingStepIds.map(stepId => dispatch(deleteWorkflowStep(stepId)))
        );
      } catch (error) {
        console.error('Error cleaning up existing workflow steps:', error);
      }
    }
    
    onSave(workflowToSave, steps, mode === 'edit', existingStepIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Create New Workflow Group' : 'Edit Workflow Group'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter workflow group name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this workflow group"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <Separator />

          {isLoadingSteps ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading workflow steps...</div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Workflow Steps</h3>
                <p className="text-sm text-gray-600">
                  {mode === 'edit' ? 'Editing will replace all existing steps with the new configuration.' : 'Define the approval workflow steps.'}
                </p>
              </div>
              <WorkflowStepsManager steps={steps} onStepsChange={setSteps} />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingSteps}>
              {mode === 'add' ? 'Create Workflow Group' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowGroupModal;
