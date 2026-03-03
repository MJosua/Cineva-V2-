import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { WorkflowStep } from '@/store/slices/userManagementSlice';
import { useAppSelector } from '@/hooks/useAppSelector';

export interface WorkflowStepData {
  step_order: number;
  step_type: 'role' | 'specific_user' | 'superior' | 'team';
  assigned_value: string | number;
  description: string;
  is_active: boolean;
}

interface WorkflowStepsManagerProps {
  steps: WorkflowStepData[];
  onStepsChange: (steps: WorkflowStepData[]) => void;
}

const WorkflowStepsManager = ({ steps, onStepsChange }: WorkflowStepsManagerProps) => {
  const { users, teams } = useAppSelector(state => state.userManagement);
  
  const uniqueRoles = [...new Set(users.map(user => user.role_name).filter(Boolean))];

  const addStep = () => {
    const newStep: WorkflowStepData = {
      step_order: steps.length + 1,
      step_type: 'role',
      assigned_value: '',
      description: '',
      is_active: true,
    };
    onStepsChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_order: i + 1 }));
    onStepsChange(updatedSteps);
  };

  const updateStep = (index: number, field: keyof WorkflowStepData, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    // console.log(`Updated step ${index} ${field} to:`, value);
    onStepsChange(updatedSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) {
      return;
    }

    const updatedSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedSteps[index], updatedSteps[targetIndex]] = [updatedSteps[targetIndex], updatedSteps[index]];
    
    // Update step orders
    updatedSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });
    
    onStepsChange(updatedSteps);
  };

  const getAssignedValueOptions = (stepType: string) => {
    // console.log(`Getting options for step type: ${stepType}`);
    
    switch (stepType) {
      case 'role':
        const roleOptions = uniqueRoles
          .filter(role => role && role.trim() !== "")
          .map(role => ({ value: role, label: role }));
        // console.log('Role options:', roleOptions);
        return roleOptions;
        
      case 'specific_user':
        const userOptions = users
          .filter(user => user.firstname && user.lastname && !user.is_deleted && user.is_active)
          .map(user => ({ 
            value: user.user_id.toString(), 
            label: `${user.firstname} ${user.lastname}` 
          }));
        // console.log('User options:', userOptions);
        return userOptions;
        
      case 'team':
        const teamOptions = teams
          .filter(team => team.team_name && team.team_name.trim() !== "")
          .map(team => ({ 
            value: team.team_id.toString(), 
            label: team.team_name 
          }));
        // console.log('Team options:', teamOptions);
        return teamOptions;
        
      case 'superior':
        return [{ value: 'superior', label: 'Direct Superior' }];
        
      default:
        return [];
    }
  };

  const handleStepTypeChange = (index: number, newStepType: 'role' | 'specific_user' | 'superior' | 'team') => {
    // console.log(`Changing step ${index} type from ${steps[index]?.step_type} to: ${newStepType}`);
    
    // Get new options for the step type
    const newOptions = getAssignedValueOptions(newStepType);
    // console.log('New options for step type:', newOptions);
    
    // Set default assigned value based on new step type
    const defaultValue = newOptions.length > 0 ? newOptions[0].value : '';
    // console.log('Setting default value:', defaultValue);
    
    // Update both step type and assigned value at once
    const updatedSteps = [...steps];
    updatedSteps[index] = { 
      ...updatedSteps[index], 
      step_type: newStepType,
      assigned_value: defaultValue
    };
    
    // console.log(`Updated step ${index}:`, updatedSteps[index]);
    onStepsChange(updatedSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Approval Steps</Label>
        <Button type="button" size="sm" onClick={addStep}>
          <Plus className="w-4 h-4 mr-1" />
          Add Step
        </Button>
      </div>

      {steps.map((step, index) => {
        const options = getAssignedValueOptions(step.step_type);
        const currentValue = step.assigned_value?.toString() || '';
        
        // Check if current value exists in options
        const isValidValue = options.some(option => option.value === currentValue);
        const displayValue = isValidValue ? currentValue : (options.length > 0 ? options[0].value : '');
        
        // console.log(`Step ${index}: type=${step.step_type}, value=${currentValue}, isValid=${isValidValue}, display=${displayValue}, options:`, options);
        
        return (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Step {step.step_order}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`step-type-${index}`}>Step Type</Label>
                  <Select
                    value={step.step_type}
                    onValueChange={(value: 'role' | 'specific_user' | 'superior' | 'team') => {
                      // console.log(`Step type select changed for step ${index}:`, value);
                      handleStepTypeChange(index, value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role Based</SelectItem>
                      <SelectItem value="specific_user">Specific User</SelectItem>
                      <SelectItem value="superior">Superior</SelectItem>
                      <SelectItem value="team">Team Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`assigned-value-${index}`}>Assigned To</Label>
                  <Select
                    key={`${step.step_type}-${index}`}
                    value={displayValue}
                    onValueChange={(value) => {
                      // console.log(`Updating step ${index} assigned_value to:`, value);
                      updateStep(index, 'assigned_value', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.length > 0 ? (
                        options.map((option) => (
                          <SelectItem key={`${step.step_type}-${option.value}`} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_options" disabled>
                          No options available for {step.step_type}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={step.description}
                  onChange={(e) => updateStep(index, 'description', e.target.value)}
                  placeholder="Describe this approval step"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No approval steps defined yet.</p>
          <p className="text-sm">Click "Add Step" to create your first approval step.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowStepsManager;
