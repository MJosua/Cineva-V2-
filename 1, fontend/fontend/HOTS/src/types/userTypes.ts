
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
  department_name?: string;
  team_name: string;
  team_id?: number;
  job_title: string;
  jobtitle_id?: number;
  superior_id?: number;
  finished_date?: string | null;
  is_active: boolean;
  is_deleted: boolean;
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

export interface Team {
  team_id: number;
  team_name: string;
  department_id: number;
  department_name?: string;
  creation_date: string;
  finished_date?: string | null;
  member_count: number;
  leader_name?: string;
  head_fullname?: string;
}
