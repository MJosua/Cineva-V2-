
import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface TeamMember {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  team_id: number;
  team_name: string;
  role_name: string;
  is_active: boolean;
}

interface Team {
  team_id: number;
  team_name: string;
  department_id: number;
}

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('tokek');
      const response = await axios.get(`${API_URL}/hots_settings/team_members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeamMembers(response.data.data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('tokek');
      const response = await axios.get(`${API_URL}/hots_settings/get/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("team",response.data)

      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error: any) {
      
      console.log("error",error)
      
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive",
      });
    }
  };



  console.log("teams",teams)
  const updateTeamMember = async (userId: number, teamId: number) => {
    try {
      const token = localStorage.getItem('tokek');
      await axios.put(`${API_URL}/hots_settings/user/${userId}/team`, 
        { team_id: teamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTeamMembers(), fetchTeams()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = `${member.firstname} ${member.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === '' || member.team_id.toString() === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Manage team members and assignments</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Teams</SelectItem>
                  {teams.map((team,index) => (
                    <SelectItem key={index} value={team.team_id.toString()}>
                      {team.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.firstname} {member.lastname}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.team_name}</TableCell>
                      <TableCell>{member.role_name}</TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={member.team_id.toString()} 
                          onValueChange={(value) => updateTeamMember(member.user_id, parseInt(value))}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.team_id} value={team.team_id.toString()}>
                                {team.team_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeamManagement;
