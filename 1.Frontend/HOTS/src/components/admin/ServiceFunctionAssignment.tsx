
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { 
  fetchServiceFunctions,
  assignFunctionToService,
  fetchCustomFunctions,
  updateServiceFunctionAssignment,
  deleteServiceFunctionAssignment
} from '@/store/slices/customFunctionSlice';
import { useToast } from '@/hooks/use-toast';

interface ServiceFunctionAssignmentProps {
  serviceId: number;
  serviceName: string;
}

export default function ServiceFunctionAssignment({ serviceId, serviceName }: ServiceFunctionAssignmentProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { functions, serviceFunctions, isLoading } = useAppSelector(state => state.customFunction);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState({
    function_id: '',
    trigger_event: '',
    execution_order: 1,
    config: '{}',
    is_active: true
  });

  useEffect(() => {
    dispatch(fetchCustomFunctions());
    dispatch(fetchServiceFunctions(serviceId));
  }, [dispatch, serviceId]);

  const resetForm = () => {
    setNewAssignment({
      function_id: '',
      trigger_event: '',
      execution_order: 1,
      config: '{}',
      is_active: true
    });
  };

  const handleAssignFunction = async () => {
    if (!newAssignment.function_id || !newAssignment.trigger_event) {
      toast({
        title: "Error",
        description: "Please select both function and trigger event",
        variant: "destructive",
      });
      return;
    }

    try {
      let config = {};
      try {
        config = JSON.parse(newAssignment.config);
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid JSON configuration",
          variant: "destructive",
        });
        return;
      }

      await dispatch(assignFunctionToService({
        service_id: serviceId,
        function_id: parseInt(newAssignment.function_id),
        trigger_event: newAssignment.trigger_event,
        execution_order: newAssignment.execution_order,
        config,
        is_active: newAssignment.is_active
      })).unwrap();

      toast({
        title: "Success",
        description: "Function assigned to service successfully",
      });
      
      setIsAssignModalOpen(false);
      resetForm();
      dispatch(fetchServiceFunctions(serviceId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign function to service",
        variant: "destructive",
      });
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      function_id: assignment.function_id.toString(),
      trigger_event: assignment.trigger_event,
      execution_order: assignment.execution_order,
      config: JSON.stringify(assignment.config || {}, null, 2),
      is_active: assignment.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      let config = {};
      try {
        config = JSON.parse(newAssignment.config);
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid JSON configuration",
          variant: "destructive",
        });
        return;
      }

      await dispatch(updateServiceFunctionAssignment({
        id: editingAssignment.id,
        service_id: serviceId,
        function_id: parseInt(newAssignment.function_id),
        trigger_event: newAssignment.trigger_event,
        execution_order: newAssignment.execution_order,
        config,
        is_active: newAssignment.is_active
      })).unwrap();

      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      
      setIsEditModalOpen(false);
      setEditingAssignment(null);
      resetForm();
      dispatch(fetchServiceFunctions(serviceId));
    } catch (error: any) {

      console.log("error",error)
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await dispatch(deleteServiceFunctionAssignment(assignmentId)).unwrap();
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      dispatch(fetchServiceFunctions(serviceId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const triggerEvents = [
    { value: 'on_created', label: 'On Created' },
    { value: 'on_approved', label: 'On Approved' },
    { value: 'on_step_approved', label: 'On Step Approved' },
    { value: 'on_rejected', label: 'On Rejected' },
    { value: 'on_final_approved', label: 'On Final Approved' },
    { value: 'on_trigger', label: 'On Trigger' }
  ];

  const closeModal = () => {
    setIsAssignModalOpen(false);
    setIsEditModalOpen(false);
    setEditingAssignment(null);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Function Assignments for "{serviceName}"</h3>
        <Button onClick={() => setIsAssignModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Assign Function
        </Button>
      </div>

      <div className="space-y-3">
        {serviceFunctions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No functions assigned to this service yet.</p>
        ) : (
          serviceFunctions.map((assignment) => {
            const func = functions.find(f => f.id === assignment.function_id);
            return (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{func?.name || 'Unknown Function'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{assignment.trigger_event}</Badge>
                          <Badge variant="secondary">Order: {assignment.execution_order}</Badge>
                          <Badge variant={assignment.is_active ? "default" : "secondary"}>
                            {assignment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this function assignment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Assign Function Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Function to Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="functionSelect">Select Function</Label>
              <Select 
                value={newAssignment.function_id} 
                onValueChange={(value) => setNewAssignment({ ...newAssignment, function_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a function" />
                </SelectTrigger>
                <SelectContent>
                  {functions.filter(f => f.is_active).map((func) => (
                    <SelectItem key={func.id} value={func.id.toString()}>
                      {func.name} ({func.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="triggerEvent">Trigger Event</Label>
              <Select 
                value={newAssignment.trigger_event} 
                onValueChange={(value) => setNewAssignment({ ...newAssignment, trigger_event: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {triggerEvents.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="executionOrder">Execution Order</Label>
              <Input
                id="executionOrder"
                type="number"
                min="1"
                value={newAssignment.execution_order}
                onChange={(e) => setNewAssignment({ ...newAssignment, execution_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={newAssignment.config}
                onChange={(e) => setNewAssignment({ ...newAssignment, config: e.target.value })}
                placeholder="Enter configuration as JSON"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleAssignFunction} disabled={isLoading}>
              Assign Function
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Function Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="functionSelect">Select Function</Label>
              <Select 
                value={newAssignment.function_id} 
                onValueChange={(value) => setNewAssignment({ ...newAssignment, function_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a function" />
                </SelectTrigger>
                <SelectContent>
                  {functions.filter(f => f.is_active).map((func) => (
                    <SelectItem key={func.id} value={func.id.toString()}>
                      {func.name} ({func.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="triggerEvent">Trigger Event</Label>
              <Select 
                value={newAssignment.trigger_event} 
                onValueChange={(value) => setNewAssignment({ ...newAssignment, trigger_event: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {triggerEvents.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="executionOrder">Execution Order</Label>
              <Input
                id="executionOrder"
                type="number"
                min="1"
                value={newAssignment.execution_order}
                onChange={(e) => setNewAssignment({ ...newAssignment, execution_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={newAssignment.config}
                onChange={(e) => setNewAssignment({ ...newAssignment, config: e.target.value })}
                placeholder="Enter configuration as JSON"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment} disabled={isLoading}>
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
