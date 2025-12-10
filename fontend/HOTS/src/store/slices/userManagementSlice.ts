import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

export interface UserType {
  user_id: number;
  user_name: string;
  firstname: string;
  lastname: string;
  uid: string;
  email: string;
  role_id: number;
  role_name: string;
  department_id: number;
  team_name: string;
  team_id?: number;
  job_title: string;
  jobtitle_id?: number;
  superior_id?: number;
  finished_date?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

export interface Team {
  team_id: number;
  team_name: string;
  department_id: number;
  creation_date: string;
  finished_date?: string | null;
  member_count: number;
  leader_name?: string;
}

export interface TeamMember {
  member_id: number;
  team_id: number;
  user_id: number;
  member_desc: string;
  creation_date: string;
  finished_date?: string | null;
  team_leader: boolean;
  user_name?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  department_shortname: string;
  department_head?: number;
  description?: string;
  head_name?: string;
  is_deleted: number;
  created_date: string;
  finished_date?: string | null;
  status: 'active' | 'inactive';
}

export interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  permissions: number;
  created_date: string;
  finished_date?: string | null;
  is_active: boolean;
}

export interface JobTitle {
  jobtitle_id: number;
  job_title: string;
  jobtitle_name: string;
  jobtitle_description: string;
  department_id: number;
  created_date: string;
  finished_date?: string | null;
  is_active: boolean;
}

export interface Service {
  service_id: number;
  service_name: string;
  service_description: string;
  is_active: boolean;
  created_date: string;
  updated_date: string;
}

export interface Superior {
  user_id: number;
  firstname: string;
  lastname: string;
  uid: string;
  role_name: string;
  department_name: string;
}

export interface WorkflowGroup {
  workflow_group_id: number;
  id: number; // Add id property for consistency
  name: string;
  description: string;
  category_ids: number[];
  created_at: string;
  updated_at: string;
  finished_date?: string | null; // Add finished_date property
  is_active: boolean;
}

export interface WorkflowStep {
  step_id: number;
  workflow_group_id: number;
  step_order: number;
  step_type: 'role' | 'specific_user' | 'superior' | 'team';
  assigned_value: string | number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  workflow_id: number;
  workflow_group_id: number;
  ticket_id: number;
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepExecution {
  id: number;
  workflow_id: number;
  step_order: number;
  assigned_user_id: number;
  status: string;
  action_date: string;
  action_by_user_id?: number;
  comments?: string;
  rejection_reason?: string;
}

interface UserManagementState {
  users: UserType[];
  teams: Team[];
  teamMembers: TeamMember[];
  departments: Department[];
  roles: Role[];
  jobTitles: JobTitle[];
  services: Service[];
  superiors: Superior[];
  workflowGroups: WorkflowGroup[];
  workflowSteps: WorkflowStep[];
  workflowInstances: WorkflowInstance[];
  workflowStepExecutions: WorkflowStepExecution[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status: 'all' | 'active' | 'deleted';
    team: string;
    role: string;
  };
}

const initialState: UserManagementState = {
  users: [],
  teams: [],
  teamMembers: [],
  departments: [],
  roles: [],
  jobTitles: [],
  services: [],
  superiors: [],
  workflowGroups: [],
  workflowSteps: [],
  workflowInstances: [],
  workflowStepExecutions: [],
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    team: '',
    role: '',
  },
};

// User Management
export const fetchUsers = createAsyncThunk(
  'userManagement/fetchUsers',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const createUser = createAsyncThunk(
  'userManagement/createUser',
  async (userData: Omit<UserType, 'user_id' | 'is_active'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/user`, userData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log("user created", response.data);
    return response.data.data || response.data;
  }
);

export const updateUser = createAsyncThunk(
  'userManagement/updateUser',
  async ({ id, data }: { id: number; data: Partial<UserType> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/user/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("user updated", response.data);
    return response.data.data || response.data;
  }
);

export const deleteUser = createAsyncThunk(
  'userManagement/deleteUser',
  async (id: number) => {
    const response = await axios.delete(`${API_URL}/hots_settings/delete/user/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("user deleted", response.data);
    return id;
  }
);

// Fixed Teams API - using consistent endpoints
export const fetchTeams = createAsyncThunk(
  'userManagement/fetchTeams',
  async () => {
    try {
      const response = await axios.get(`${API_URL}/hots_settings/get/team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });
      // console.log("teams fetch", response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error("Teams fetch error:", error);
      throw error;
    }
  }
);

export const createTeam = createAsyncThunk(
  'userManagement/createTeam',
  async (teamData: Omit<Team, 'team_id' | 'creation_date' | 'member_count'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/team`, teamData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log("team created", response.data);
    return response.data.data || response.data;
  }
);

export const updateTeam = createAsyncThunk(
  'userManagement/updateTeam',
  async ({ id, data }: { id: number; data: Partial<Team> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/team/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log("team updated", response.data);
    return response.data.data || response.data;
  }
);

export const deleteTeam = createAsyncThunk(
  'userManagement/deleteTeam',
  async (id: number) => {
    const response = await axios.delete(`${API_URL}/hots_settings/delete/team/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("team deleted", response.data);
    return id;
  }
);

export const fetchTeamMembers = createAsyncThunk(
  'userManagement/fetchTeamMembers',
  async (teamId: number) => {
    const response = await axios.get(`${API_URL}/hots_settings/get/team_members/${teamId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const fetchTeamLeaders = createAsyncThunk(
  'userManagement/fetchTeamLeaders',
  async (teamId: number) => {
    const response = await axios.get(`${API_URL}/hots_settings/get/team_leaders/${teamId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const addTeamMember = createAsyncThunk(
  'userManagement/addTeamMember',
  async (memberData: Omit<TeamMember, 'member_id' | 'creation_date'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/team_member`, memberData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const updateTeamMember = createAsyncThunk(
  'userManagement/updateTeamMember',
  async ({ id, data }: { id: number; data: Partial<TeamMember> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/team_member/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const removeTeamMember = createAsyncThunk(
  'userManagement/removeTeamMember',
  async ({ team_id, user_id }: { team_id: number; user_id: number }) => {
    await axios.delete(`${API_URL}/hots_settings/delete/team_member/${team_id}/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return { team_id, user_id };
  }
);

// Department Management
export const fetchDepartments = createAsyncThunk(
  'userManagement/fetchDepartments',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/departments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const createDepartment = createAsyncThunk(
  'userManagement/createDepartment',
  async (departmentData: Omit<Department, 'department_id' | 'created_date'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/department`, departmentData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const updateDepartment = createAsyncThunk(
  'userManagement/updateDepartment',
  async ({ id, data }: { id: number; data: Partial<Department> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/department/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const deleteDepartment = createAsyncThunk(
  'userManagement/deleteDepartment',
  async (id: number) => {
    await axios.delete(`${API_URL}/hots_settings/delete/department/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return id;
  }
);

export const fetchTeamsByDepartment = createAsyncThunk(
  'userManagement/fetchTeamsByDepartment',
  async (departmentId: number) => {
    const response = await axios.get(`${API_URL}/hots_settings/get/departments/${departmentId}/teams`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

// Role Management
export const fetchRoles = createAsyncThunk(
  'userManagement/fetchRoles',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/role`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("roles fetch", response.data);
    return response.data.data || response.data;
  }
);

export const createRole = createAsyncThunk(
  'userManagement/createRole',
  async (roleData: Omit<Role, 'role_id' | 'created_date'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/role`, roleData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const updateRole = createAsyncThunk(
  'userManagement/updateRole',
  async ({ id, data }: { id: number; data: Partial<Role> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/role/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const deleteRole = createAsyncThunk(
  'userManagement/deleteRole',
  async (id: number) => {
    await axios.delete(`${API_URL}/hots_settings/delete/role/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return id;
  }
);

// Job Title Management
export const fetchJobTitles = createAsyncThunk(
  'userManagement/fetchJobTitles',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/jobtitle`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("job titles fetch", response.data);
    return response.data.data || response.data;
  }
);

export const createJobTitle = createAsyncThunk(
  'userManagement/createJobTitle',
  async (jobTitleData: Omit<JobTitle, 'jobtitle_id' | 'created_date'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/jobtitle`, jobTitleData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const updateJobTitle = createAsyncThunk(
  'userManagement/updateJobTitle',
  async ({ id, data }: { id: number; data: Partial<JobTitle> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/jobtitle/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const deleteJobTitle = createAsyncThunk(
  'userManagement/deleteJobTitle',
  async (id: number) => {
    await axios.delete(`${API_URL}/hots_settings/delete/jobtitle/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return id;
  }
);

// Service/Menu Management
export const fetchServices = createAsyncThunk(
  'userManagement/fetchServices',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/services`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    })
    return response.data.data;
  }
);

export const fetchActiveServices = createAsyncThunk(
  'userManagement/fetchActiveServices',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/services/active`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const fetchInactiveServices = createAsyncThunk(
  'userManagement/fetchInactiveServices',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/services/inactive`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const toggleServiceStatus = createAsyncThunk(
  'userManagement/toggleServiceStatus',
  async (serviceData: { service_id: number; is_active: boolean }) => {
    const response = await axios.post(`${API_URL}/hots_settings/toggle/service`, serviceData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

// Superior Management
export const fetchSuperiors = createAsyncThunk(
  'userManagement/fetchSuperiors',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get_superior`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("superiors fetch", response.data);
    return response.data.data || response.data;
  }
);

// Workflow Groups
export const fetchWorkflowGroups = createAsyncThunk(
  'userManagement/fetchWorkflowGroups',
  async () => {
    try {
      const response = await axios.get(`${API_URL}/hots_settings/get/workflow_groups`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });
      // console.log("workflow groups fetch", response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error("Workflow groups fetch error:", error);
      throw error;
    }
  }
);

export const createWorkflowGroup = createAsyncThunk(
  'userManagement/createWorkflowGroup',
  async (workflowData: Omit<WorkflowGroup, 'workflow_group_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await axios.post(`${API_URL}/hots_settings/post/workflow_group`, workflowData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
          'Content-Type': 'application/json'
        }
      });
      // console.log("workflow group created", response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error("Workflow group creation error:", error);
      throw error;
    }
  }
);

export const updateWorkflowGroup = createAsyncThunk(
  'userManagement/updateWorkflowGroup',
  async ({ id, data }: { id: number; data: Partial<WorkflowGroup> }) => {
    try {
      const response = await axios.put(`${API_URL}/hots_settings/update/workflow_group/${id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
          'Content-Type': 'application/json'
        }
      });
      // console.log("workflow group updated", response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error("Workflow group update error:", error);
      throw error;
    }
  }
);

export const deleteWorkflowGroup = createAsyncThunk(
  'userManagement/deleteWorkflowGroup',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/hots_settings/delete/workflow_group/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });
      return id;
    } catch (error: any) {
      console.error("Workflow group deletion error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchWorkflowSteps = createAsyncThunk(
  'userManagement/fetchWorkflowSteps',
  async (workflowGroupId: number) => {
    const response = await axios.get(`${API_URL}/hots_settings/get/workflow_steps/${workflowGroupId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("workflow steps fetch", response.data);
    return response.data.data || response.data;
  }
);

export const createWorkflowStep = createAsyncThunk(
  'userManagement/createWorkflowStep',
  async (stepData: Omit<WorkflowStep, 'step_id' | 'created_at' | 'updated_at'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/post/workflow_step`, stepData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log("workflow step created", response.data);
    return response.data.data || response.data;
  }
);

export const updateWorkflowStep = createAsyncThunk(
  'userManagement/updateWorkflowStep',
  async ({ id, data }: { id: number; data: Partial<WorkflowStep> }) => {
    const response = await axios.put(`${API_URL}/hots_settings/update/workflow_step/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log("workflow step updated", response.data);
    return response.data.data || response.data;
  }
);

export const deleteWorkflowStep = createAsyncThunk(
  'userManagement/deleteWorkflowStep',
  async (id: number) => {
    const response = await axios.delete(`${API_URL}/hots_settings/delete/workflow_step/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    // console.log("workflow step deleted", response.data);
    return id;
  }
);

// Workflow Instances
export const fetchWorkflowInstances = createAsyncThunk(
  'userManagement/fetchWorkflowInstances',
  async () => {
    const response = await axios.get(`${API_URL}/hots_settings/get/workflow_instances`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const createWorkflowInstance = createAsyncThunk(
  'userManagement/createWorkflowInstance',
  async (instanceData: Omit<WorkflowInstance, 'workflow_id' | 'created_at' | 'updated_at'>) => {
    const response = await axios.post(`${API_URL}/hots_settings/create/workflow_instance`, instanceData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

export const fetchWorkflowStepExecutions = createAsyncThunk(
  'userManagement/fetchWorkflowStepExecutions',
  async (workflowId: number) => {
    const response = await axios.get(`${API_URL}/hots_settings/get/workflow_step_executions/${workflowId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
      }
    });
    return response.data.data;
  }
);

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<'all' | 'active' | 'deleted'>) => {
      state.filters.status = action.payload;
    },
    setTeamFilter: (state, action: PayloadAction<string>) => {
      state.filters.team = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<string>) => {
      state.filters.role = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        team: '',
        role: '',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.map((user: any) => ({
          ...user,
          is_active: !user.finished_date,
          is_deleted: user.is_deleted || false,
        }));
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(createUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.users.push({
            ...action.payload,
            is_deleted: false,
          });
        }
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.users.findIndex(u => u.user_id === action.payload.user_id);
          if (index !== -1) {
            state.users[index] = {
              ...action.payload,
              is_deleted: action.payload.is_deleted || false,
            };
          }
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.user_id === action.payload);
        if (index !== -1) {
          state.users[index].is_deleted = true;
        }
      })
      // Teams - Fixed error handling
      .addCase(fetchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = Array.isArray(action.payload) ? action.payload : [];
        // console.log("Teams updated in state:", state.teams);
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch teams';
        console.error("Teams fetch error:", action.error);
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        if (action.payload) {
          state.teams.push(action.payload);
        }
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create team';
        console.error("Team creation error:", action.error);
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.teams.findIndex(t => t.team_id === action.payload.team_id);
          if (index !== -1) {
            state.teams[index] = action.payload;
          }
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update team';
        console.error("Team update error:", action.error);
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter(t => t.team_id !== action.payload);
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete team';
        console.error("Team deletion error:", action.error);
      })
      // Departments
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      // Roles
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = Array.isArray(action.payload) ? action.payload : [];
      })
      // Job Titles
      .addCase(fetchJobTitles.fulfilled, (state, action) => {
        state.jobTitles = Array.isArray(action.payload) ? action.payload : [];
      })
      // Superiors
      .addCase(fetchSuperiors.fulfilled, (state, action) => {
        state.superiors = Array.isArray(action.payload) ? action.payload : [];
      })
      // Workflow Groups - Fixed error handling
      .addCase(fetchWorkflowGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkflowGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflowGroups = Array.isArray(action.payload) ? action.payload : [];
        // console.log("Workflow groups updated in state:", state.workflowGroups);
      })
      .addCase(fetchWorkflowGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch workflow groups';
        console.error("Workflow groups fetch error:", action.error);
      })
      .addCase(createWorkflowGroup.fulfilled, (state, action) => {
        if (action.payload) {
          state.workflowGroups.push(action.payload);
        }
      })
      .addCase(createWorkflowGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create workflow group';
        console.error("Workflow group creation error:", action.error);
      })
      .addCase(updateWorkflowGroup.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.workflowGroups.findIndex(w => w.workflow_group_id === action.payload.workflow_group_id);
          if (index !== -1) {
            state.workflowGroups[index] = action.payload;
          }
        }
      })
      .addCase(updateWorkflowGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update workflow group';
        console.error("Workflow group update error:", action.error);
      })
      .addCase(deleteWorkflowGroup.fulfilled, (state, action) => {
        state.workflowGroups = state.workflowGroups.filter(w => w.workflow_group_id !== action.payload);
      })
      .addCase(deleteWorkflowGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete workflow group';
        console.error("Workflow group deletion error:", action.error);
      })
      .addCase(fetchWorkflowSteps.fulfilled, (state, action) => {
        state.workflowSteps = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createWorkflowStep.fulfilled, (state, action) => {
        if (action.payload) {
          state.workflowSteps.push(action.payload);
        }
      })
      .addCase(updateWorkflowStep.fulfilled, (state, action) => {
        const index = state.workflowSteps.findIndex(s => s.step_id === action.payload.step_id);
        if (index !== -1) {
          state.workflowSteps[index] = action.payload;
        }
      })
      .addCase(deleteWorkflowStep.fulfilled, (state, action) => {
        state.workflowSteps = state.workflowSteps.filter(s => s.step_id !== action.payload);
      })
      // Workflow Instances
      .addCase(fetchWorkflowInstances.fulfilled, (state, action) => {
        state.workflowInstances = action.payload;
      })
      .addCase(createWorkflowInstance.fulfilled, (state, action) => {
        state.workflowInstances.push(action.payload);
      })
      .addCase(fetchWorkflowStepExecutions.fulfilled, (state, action) => {
        state.workflowStepExecutions = action.payload;
      });
  },
});

export const { setStatusFilter, setTeamFilter, setRoleFilter, clearFilters } = userManagementSlice.actions;
export default userManagementSlice.reducer;
