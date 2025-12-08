import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import UserModal from "@/components/modals/UserModal";
import TeamModal from "@/components/modals/TeamModal";
import WorkflowGroupModal from "@/components/modals/WorkflowGroupModal";
import UserStatusBadge from "@/components/ui/UserStatusBadge";
import UserFilters from "@/components/filters/UserFilters";
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchUsers,
  fetchTeams,
  fetchDepartments,
  fetchWorkflowGroups,
  fetchRoles,
  fetchJobTitles,
  fetchSuperiors,
  fetchServices,
  UserType,
  Team,
  WorkflowGroup,
  Department,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  createWorkflowGroup,
  updateWorkflowGroup,
  deleteWorkflowGroup,
  createWorkflowStep,
  fetchWorkflowSteps,
  removeTeamMember,
  updateUser,
  createUser
} from '@/store/slices/userManagementSlice';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { WorkflowStepData } from '@/components/workflow/WorkflowStepsManager';

const UserManagement = () => {
  const dispatch = useAppDispatch();
  const { users, teams, departments, workflowGroups, roles, jobTitles, superiors, services, filters, isLoading } = useAppSelector(state => state.userManagement);
  const [activeTab, setActiveTab] = useState("users");
  const [searchValue, setSearchValue] = useState("");

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedWorkflowGroup, setSelectedWorkflowGroup] = useState<WorkflowGroup | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'team' | 'workflow', item: any } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Fetch all data when component mounts
    dispatch(fetchUsers());
    dispatch(fetchTeams());
    dispatch(fetchDepartments());
    dispatch(fetchWorkflowGroups());
    dispatch(fetchRoles());
    dispatch(fetchJobTitles());
    dispatch(fetchSuperiors());
    dispatch(fetchServices());
  }, [dispatch]);


  // Apply filters to users
  const seenUserIds = new Set<number>();

  const filteredUsers = users.filter(user => {
    const searchLower = searchValue.toLowerCase();

    // Search filter
    const searchMatch =
      searchValue === '' ||
      `${user.firstname || ''} ${user.lastname || ''}`.toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.team_name || '').toLowerCase().includes(searchLower) ||
      (user.role_name || '').toLowerCase().includes(searchLower) ||
      (user.uid || '').toLowerCase().includes(searchLower);

    // Status filter
    const statusMatch =
      filters.status === 'all' ||
      (filters.status === 'active' && user.is_active && !user.is_deleted) ||
      (filters.status === 'deleted' && user.is_deleted);

    // Team filter
    const teamMatch =
      !filters.team || (user.team_name || '') === filters.team;

    // Role filter
    const roleMatch =
      !filters.role || (user.role_name || '') === filters.role;

    // Unique filter (by user_id)
    const isUnique = user.user_id != null && !seenUserIds.has(user.user_id);

    const shouldInclude = searchMatch && statusMatch && teamMatch && roleMatch && isUnique;

    if (shouldInclude) {
      seenUserIds.add(user.user_id!);
      return true;
    }

    return false;
  });



  // Delete user function
  const deleteUserFromAPI = async (userId: number) => {
    try {
      const response = await axios.delete(`${API_URL}/hots_settings/delete/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        dispatch(fetchUsers()); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to delete user',
        variant: "destructive",
      });
    }
  };

  const filteredTeams = teams.filter(team =>
    team.team_name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredWorkflowGroups = workflowGroups.filter(group =>
    group.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ?
        <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };

  // User handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode('add');
    setIsUserModalOpen(true);
  };

  const handleModalEditUser = (user: UserType) => {
    setSelectedUser(user);
    console.log("user", user)
    setModalMode('edit');
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setDeleteTarget({ type: 'user', item: user });
    setIsDeleteModalOpen(true);
  };

  const handleEditUser = (user: UserType) => {
    if (!user.user_id) return; // avoid error if ID doesn't exist
    dispatch(updateUser({ id: user.user_id, data: user }));
    setIsUserModalOpen(false)
    dispatch(fetchUsers()); // Refresh data

  };

  const handleSaveUser = (user: UserType) => {
    console.log("user",user)
    if (!user.uid) return; // avoid error if ID doesn't exist
    dispatch(createUser(user));
    setIsUserModalOpen(false)
    dispatch(fetchUsers()); // Refresh data

  };

  // Team handlers
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
    setDeleteTarget({ type: 'team', item: team });
    setIsDeleteModalOpen(true);
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
          const usersToRemove = existingMembers.filter(id => !selectedUsers.includes(id));
          for (const userId of usersToRemove) {
            await dispatch(removeTeamMember({ team_id: teamId, user_id: userId }));
          }

          // 3. Re-add or update all selected users
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

  // Workflow Group handlers
  const handleAddWorkflowGroup = () => {
    setSelectedWorkflowGroup(null);
    setModalMode('add');
    setIsWorkflowModalOpen(true);
  };

  const handleEditWorkflowGroup = (group: WorkflowGroup) => {
    setSelectedWorkflowGroup(group);
    setModalMode('edit');
    setIsWorkflowModalOpen(true);
  };

  const handleDeleteWorkflowGroup = (group: WorkflowGroup) => {
    setDeleteTarget({ type: 'workflow', item: group });
    setIsDeleteModalOpen(true);
  };

  const handleSaveWorkflowGroup = async (group: any, steps: WorkflowStepData[]) => {
    try {
      let savedGroup;

      if (modalMode === 'add') {
        const result = await dispatch(createWorkflowGroup(group));
        savedGroup = result.payload;

        if (savedGroup) {
          toast({
            title: "Success",
            description: "Workflow group created successfully",
          });

          // Save workflow steps if any
          if (steps.length > 0) {
            const workflowGroupId = savedGroup.id;

            if (workflowGroupId) {
              const stepsWithGroupId = steps.map(step => ({
                ...step,
                workflow_group_id: workflowGroupId
              }));

              // Create all steps
              for (const step of stepsWithGroupId) {
                await dispatch(createWorkflowStep(step));
              }

              toast({
                title: "Success",
                description: `Workflow group and ${steps.length} steps created successfully`,
              });
            }
          }
        }
      } else {
        const result = await dispatch(updateWorkflowGroup({ id: selectedWorkflowGroup?.id!, data: group }));

        if (result.meta.requestStatus === 'fulfilled') {
          savedGroup = result.payload;
          toast({
            title: "Success",
            description: "Workflow group updated successfully",
          });

          // Handle workflow steps for edit mode
          if (steps.length > 0) {
            const workflowGroupId = selectedWorkflowGroup?.id;

            if (workflowGroupId) {
              // For simplicity in edit mode, we'll delete existing steps and recreate them
              // In production, you might want to implement a more sophisticated update strategy
              const stepsWithGroupId = steps.map(step => ({
                ...step,
                workflow_group_id: workflowGroupId
              }));

              // Create/update all steps
              for (const step of stepsWithGroupId) {
                await dispatch(createWorkflowStep(step));
              }

              toast({
                title: "Success",
                description: `Workflow group and ${steps.length} steps updated successfully`,
              });
            }
          }

          dispatch(fetchWorkflowGroups());
        } else {
          toast({
            title: "Error",
            description: "Failed to update workflow group",
            variant: "destructive",
          });
          return;
        }
      }

      dispatch(fetchWorkflowGroups());
    } catch (error: any) {
      console.error('Error saving workflow group:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow group",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        if (deleteTarget.type === 'user') {
          await deleteUserFromAPI(deleteTarget.item.user_id);
        } else if (deleteTarget.type === 'team') {
          await dispatch(deleteTeam(deleteTarget.item.team_id));
          toast({
            title: "Success",
            description: "Team deleted successfully",
          });
        } else if (deleteTarget.type === 'workflow') {
          try {
            await dispatch(deleteWorkflowGroup(deleteTarget.item.id)).unwrap();
            toast({
              title: "Success",
              description: "Workflow group deleted successfully",
              variant: "default",
            });
          } catch (error: any) {
            console.error("Delete workflow group failed:", error);
            toast({
              title: "Error",
              description: error?.message || "Failed to delete workflow group",
              variant: "destructive",
            });
          }
          dispatch(fetchWorkflowGroups());
        }
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);

      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(d => d.department_id === departmentId);
    return department ? department.department_name : 'Unknown Department';
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator": return "bg-purple-100 text-purple-800";
      case "Manager": return "bg-blue-100 text-blue-800";
      case "Supervisor": return "bg-green-100 text-green-800";
      case "Staff": return "bg-gray-100 text-gray-800";
      case "Executor": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (item: Department | Team | WorkflowGroup) => {
    const isActive = !item.finished_date;
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  return (
    <AppLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search users, teams, workflows..."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, teams, and workflow groups</p>
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="teams">Teams Management</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserFilters />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>System Users ({filteredUsers.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-lg">Loading users...</div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id} className={user.is_deleted ? 'opacity-40' : ''}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium">{highlightText(`${user.firstname || ''} ${user.lastname || ''}`, searchValue)}</div>
                                <div className="text-sm text-gray-500">{user.uid || 'No UID'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{highlightText(user.email || 'No email', searchValue)}</TableCell>
                          <TableCell>{highlightText(user.team_name || 'No team', searchValue)}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role_name || '')}>
                              {highlightText(user.role_name || 'No role', searchValue)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <UserStatusBadge isActive={!user.is_deleted && user.is_active} />
                          </TableCell>
                          <TableCell className="text-gray-600">{user.job_title || 'No title'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleModalEditUser(user)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {!user.is_deleted && user.is_active && (
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Teams Management ({filteredTeams.length})</span>
                  </CardTitle>
                  <Button size="sm" onClick={handleAddTeam}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>leader</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.sort((a, b) => a.team_name.localeCompare(b.team_name)).map((team) => (
                      <TableRow key={team.team_id}>

                        <TableCell className="font-medium">{highlightText(team.team_name, searchValue)}</TableCell>
                        <TableCell>{getDepartmentName(team.department_id)}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Workflow Groups</CardTitle>
                  <Button size="sm" onClick={handleAddWorkflowGroup}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow Group
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflowGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{highlightText(group.name, searchValue)}</TableCell>
                        <TableCell className="text-gray-600">{highlightText(group.description, searchValue)}</TableCell>

                        <TableCell>
                          {getStatusBadge(group)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditWorkflowGroup(group)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteWorkflowGroup(group)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          user={selectedUser}
          mode={modalMode}
          roles={roles}
          departments={departments}
          onSave={handleSaveUser}
          onEdit={handleEditUser}
        />

        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          team={selectedTeam}
          mode={modalMode}
          onSave={handleSaveTeam}
        />

        <WorkflowGroupModal
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          workflowGroup={selectedWorkflowGroup}
          mode={modalMode}
          onSave={handleSaveWorkflowGroup}
          users={users}
        />

        <AlertDialog open={isDeleteModalOpen} onOpenChange={handleDeleteCancel}>
          <AlertDialogContent

            onOverlayClick={handleDeleteCancel} // custom prop passed to AlertDialogOverlay inside your AlertDialogContent
            className="bg-white border border-gray-200 shadow-lg z-50"
          >
            <AlertDialogHeader>
              <AlertDialogTitle
                className="text-red-600"
              >Delete {deleteTarget?.type === 'user' ? 'User' : deleteTarget?.type === 'team' ? 'Team' : 'Workflow Group'}</AlertDialogTitle>
              <AlertDialogDescription
                className="text-gray-600"
              >
                Are you sure you want to delete "{deleteTarget?.item.team_name || deleteTarget?.item.name || deleteTarget?.item.firstname + ' ' + deleteTarget?.item.lastname}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter
              className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg"
            >
              <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default UserManagement
