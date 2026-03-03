
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { setStatusFilter, setTeamFilter, setRoleFilter, clearFilters } from '@/store/slices/userManagementSlice';

const UserFilters = () => {
  const dispatch = useAppDispatch();
  const { filters, teams, users } = useAppSelector(state => state.userManagement);
  
  const uniqueRoles = [...new Set(users.map(user => user.role_name).filter(Boolean))];
  const uniqueTeams = [...new Set(users.map(user => user.team_name).filter(Boolean))];

  const hasActiveFilters = filters.status !== 'all' || filters.team || filters.role;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      <Select value={filters.status} onValueChange={(value: 'all' | 'active' | 'deleted') => dispatch(setStatusFilter(value))}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="deleted">Deleted</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.team || "all_teams"} onValueChange={(value) => dispatch(setTeamFilter(value === "all_teams" ? "" : value))}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_teams">All Teams</SelectItem>
          {uniqueTeams.filter(team => team && team.trim() !== "").map((team) => (
            <SelectItem key={team} value={team}>
              {team}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.role || "all_roles"} onValueChange={(value) => dispatch(setRoleFilter(value === "all_roles" ? "" : value))}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_roles">All Roles</SelectItem>
          {uniqueRoles.filter(role => role && role.trim() !== "").map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => dispatch(clearFilters())}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default UserFilters;
