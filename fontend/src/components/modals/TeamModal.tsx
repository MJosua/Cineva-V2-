import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppSelector';
import { Team, UserType, fetchTeamMembers, fetchUsers } from '@/store/slices/userManagementSlice';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team | null;
  mode: 'add' | 'edit';
  onSave: (team: any, selectedUsers?: number[], teamLeaderId?: number) => void;
}

const TeamModal = ({ isOpen, onClose, team, mode, onSave }: TeamModalProps) => {
  const dispatch = useAppDispatch();
  const { departments, users, teamMembers } = useAppSelector(state => state.userManagement);
  const [formData, setFormData] = useState({
    team_name: '',
    department_id: '',
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);
  

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [teamLeader, setTeamLeader] = useState<number | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (team && mode === 'edit') {
      setFormData({
        team_name: team.team_name,
        department_id: team.department_id.toString(),
      });

      if (team.team_id) {
        setIsLoadingMembers(true);
        dispatch(fetchTeamMembers(team.team_id))
          .then((result) => {
            if (result.payload && Array.isArray(result.payload)) {
              const memberUserIds = result.payload.map((member: any) => member.user_id);
              const leader = result.payload.find((member: any) => member.team_leader);

              setSelectedUsers(memberUserIds);
              setTeamLeader(leader ? leader.user_id : null);
            }
          })
          .catch((error) => {
            console.error('Failed to load team members:', error);
          })
          .finally(() => {
            setIsLoadingMembers(false);
          });
      }
    } else {
      setFormData({
        team_name: '',
        department_id: '',
      });
      setSelectedUsers([]);
      setTeamLeader(null);
    }
  }, [team, mode, isOpen, dispatch]);

  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      if (teamLeader === userId) {
        setTeamLeader(null);
      }
    }
  };

  const handleSave = () => {
    const teamToSave = {
      ...formData,
      department_id: parseInt(formData.department_id),
      team_leader_id: teamLeader
    };

    onSave(teamToSave, selectedUsers, teamLeader);
    onClose();
  };

  const seenUserIds = new Set<number>();

  const availableUsers = users.filter(user => {
    const isUnique = !seenUserIds.has(user.user_id!);
    const isActive = user.is_active && !user.is_deleted;
    const departmentMatch =
      !formData.department_id || user.department_id === Number(formData.department_id);
    if (isUnique && isActive && departmentMatch) {
      seenUserIds.add(user.user_id!);
      return true;
    }

    return false;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Team' : 'Edit Team'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, department_id: value });
                  setSelectedUsers([]);
                  setTeamLeader(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.department_id} value={department.department_id.toString()}>
                      {department.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.department_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({selectedUsers.length})
                  {isLoadingMembers && <span className="text-sm text-gray-500">Loading...</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={(checked) => handleUserSelection(user.user_id, checked as boolean)}
                          />
                          <div>
                            <div className="font-medium">{user.firstname} {user.lastname}</div>
                            <div className="text-sm text-gray-500">{user.role_name} • {user.email}</div>
                          </div>
                        </div>

                        {selectedUsers.includes(user.user_id) && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={teamLeader === user.user_id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setTeamLeader(teamLeader === user.user_id ? null : user.user_id)}
                            >
                              {teamLeader === user.user_id ? "Leader" : "Set Leader"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No users available for the selected department
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {teamLeader && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">Team Leader</Badge>
                <span className="font-medium">
                  {users.find(u => u.user_id === teamLeader)?.firstname} {users.find(u => u.user_id === teamLeader)?.lastname}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.team_name || !formData.department_id}>
            {mode === 'add' ? 'Create Team' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;
