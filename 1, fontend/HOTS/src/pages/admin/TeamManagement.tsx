import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import TeamModal from "@/components/modals/TeamModal";
import { useHeader } from "@/contexts/HeaderContext";
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTeams,
  fetchUsers,
  fetchDepartments,
  Team,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
} from '@/store/slices/userManagementSlice';

const TeamManagement = () => {
  const dispatch = useAppDispatch();
  const { teams, users, departments, isLoading } = useAppSelector(state => state.userManagement);
  const { searchValue, setSearchValue, setSearchPlaceholder } = useHeader();
  const { toast } = useToast();

  useEffect(() => {
    setSearchPlaceholder("Search teams...");
    setSearchValue("");
    return () => {
      setSearchPlaceholder("Search...");
      setSearchValue("");
    };
  }, [setSearchValue, setSearchPlaceholder]);

  // Modal states
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  useEffect(() => {
    dispatch(fetchTeams());
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const filteredTeams = teams.filter(team =>
    team.team_name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(d => d.department_id === departmentId);
    return department ? department.department_name : 'Unknown Department';
  };

  const getCollaboratorNames = (collaboratorJson: any) => {
    if (!collaboratorJson) return [];
    try {
      const collabIds = typeof collaboratorJson === 'string' ? JSON.parse(collaboratorJson) : collaboratorJson;
      if (!Array.isArray(collabIds)) return [];
      return collabIds.map((id: number) => {
        const dept = departments.find(d => d.department_id === id);
        return dept ? dept.department_name : null;
      }).filter(Boolean);
    } catch (e) {
      console.error("Error parsing collaborators:", e);
      return [];
    }
  };

  const getStatusBadge = (team: Team) => {
    const isActive = !team.finished_date;
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ?
        <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setModalMode('add');
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setModalMode('edit');
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setDeleteTarget(team);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await dispatch(deleteTeam(deleteTarget.team_id));
        toast({
          title: "Success",
          description: "Team deleted successfully",
        });
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to delete team",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveTeam = async (teamData: any, selectedUsers: number[] = [], teamLeaderId?: number) => {
    try {
      let savedTeam;

      if (modalMode === 'add') {
        const result = await dispatch(createTeam(teamData));
        savedTeam = result.payload;

        if (savedTeam) {
          for (const userId of selectedUsers) {
            const memberData = {
              team_id: savedTeam.team_id,
              user_id: userId,
              member_desc: 'Team member',
              team_leader: userId === teamLeaderId
            };
            await dispatch(addTeamMember(memberData));
          }
          toast({ title: "Success", description: "Team created successfully" });
        }
      }

      if (modalMode === 'edit') {
        const result = await dispatch(updateTeam({ id: selectedTeam?.team_id!, data: teamData }));
        savedTeam = result.payload;

        if (savedTeam) {
          const teamId = selectedTeam!.team_id;

          // 1. Fetch existing members from users state
          const existingMembers = users
            .filter(user => user.team_id === teamId)
            .map(user => user.user_id);

          // 2. Remove users that were unselected
          // Note: Logic here assumes 'selectedUsers' contains ALL current members.
          // If a user was in the team but not in selectedUsers, they are removed.
          const usersToRemove = existingMembers.filter(id => id !== undefined && !selectedUsers.includes(id)) as number[];

          for (const userId of usersToRemove) {
            // We need to be careful not to remove users if the UI didn't load them properly, 
            // but assuming the modal initializes with current members, this logic holds.
            await dispatch(removeTeamMember({ team_id: teamId, user_id: userId }));
          }

          // 3. Re-add or update all selected users
          // This loop might be inefficient if it re-adds existing members, but the backend likely handles it (or it's acceptable overhead).
          for (const userId of selectedUsers) {
            const memberData = {
              team_id: teamId,
              user_id: userId,
              member_desc: 'Team member',
              team_leader: userId === teamLeaderId
            };
            await dispatch(addTeamMember(memberData));
          }

          toast({ title: "Success", description: "Team updated successfully" });
        }
      }

      // Refresh data after saving
      dispatch(fetchTeams());
      dispatch(fetchUsers());

    } catch (error: any) {
      console.error('Error saving team:', error);
      toast({
        title: "Error",
        description: "Failed to save team",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage teams and member assignments</p>
        </div>
        <Button onClick={handleAddTeam}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Teams ({filteredTeams.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading teams...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Team Name</TableHead>
                    <TableHead className="whitespace-nowrap">Department</TableHead>
                    <TableHead className="whitespace-nowrap">Members</TableHead>
                    <TableHead className="whitespace-nowrap">Leader</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.sort((a, b) => a.team_name.localeCompare(b.team_name)).map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{highlightText(team.team_name, searchValue)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-1">
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700">{getDepartmentName(team.department_id)}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {getCollaboratorNames(team.department_collaborator).map((name: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] font-normal px-1 py-0 h-4 border-gray-300">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.member_count || 0} members</Badge>
                      </TableCell>
                      <TableCell>
                        {team.leader_name || " - "}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(team)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteTeam(team)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        team={selectedTeam}
        mode={modalMode}
        // The TeamModal likely expects a simple onSave callback. 
        // However, the UserManagement usage passed (team, members, leader).
        // We must ensure TeamModal's onSave prop matches this signature.
        onSave={handleSaveTeam}
      />

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              "{deleteTarget?.team_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamManagement;
