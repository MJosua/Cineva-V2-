
export interface DashboardFunction {
    id: number;
    title: string;
    description?: string;
    icon?: string;
    path: string;
    type: string;
    category_id?: number | null;
    category_name?: string | null;
    roles_allowed?: string[] | null;
    department_scope?: string[] | null;
    is_active?: number;
    order_index?: number;
  }
  