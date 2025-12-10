
export interface Approver {
  approver_id: number;
  approver_leader?: string;
  approver_name: string;
  approval_order: number;
  approval_status: number;
  approval_date?: string;
}

export interface Ticket {
  ticket_id: number;
  creation_date: string;
  service_id: number;
  service_name: string;
  approval_level?: number;
  assigned_to: string | null;
  status: string;
  color: string;
  team_name: string | null;
  department_name?: string;
  last_update: string | null;
  reason: string;
  fulfilment_comment: string | null;
  approval_status: number;
  list_approval: Approver[] | null;
  team_leader_id: number | null;
  created_by_name?: string;
  current_step?: number;
  files?: Array<{
    upload_id: number;
    filename: string;
    path: string;
    size: number;
  }>;
}

export interface TicketDetail extends Ticket {
  description?: string;
  priority?: string;
  department?: string;
  department_name?: string;
  requester?: string;
  detail_rows?: Array<{
    lbl_col?: string;
    cstm_col?: string;
    order_col?: number;
  }>;
  assigned_team?: string;
  approver_leader?: string;
  status_id?: number;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: string;
  }>;
  amount?: string;
  chat_messages?: Array<{
    id: number;
    user: string;
    message: string;
    time: string;
    isRequester: boolean;
  }>;
  // Dynamic form fields - labels
  lbl_col1?: string;
  lbl_col2?: string;
  lbl_col3?: string;
  lbl_col4?: string;
  lbl_col5?: string;
  lbl_col6?: string;
  lbl_col7?: string;
  lbl_col8?: string;
  lbl_col9?: string;
  lbl_col10?: string;
  lbl_col11?: string;
  lbl_col12?: string;
  lbl_col13?: string;
  lbl_col14?: string;
  lbl_col15?: string;
  lbl_col16?: string;
  // Dynamic form fields - values
  cstm_col1?: string;
  cstm_col2?: string;
  cstm_col3?: string;
  cstm_col4?: string;
  cstm_col5?: string;
  cstm_col6?: string;
  cstm_col7?: string;
  cstm_col8?: string;
  cstm_col9?: string;
  cstm_col10?: string;
  cstm_col11?: string;
  cstm_col12?: string;
  cstm_col13?: string;
  cstm_col14?: string;
  cstm_col15?: string;
  cstm_col16?: string;
}

export interface TicketsResponse {
  success: boolean;
  message: string;
  totalData: number;
  totalPage: number;
  data: Ticket[];
}

export interface CreateTicketResponse {
  success: boolean;
  message: string;
  ticket_id?: number;
}

export interface UploadFilesResponse {
  success: boolean;
  message: string;
  files?: Array<{
    upload_id: number;
    filename: string;
    path: string;
    size: number;
  }>;
}

export interface TaskCountResponse {
  success: boolean;
  message: string;
  count: number;
}

export interface ApprovalActionResponse {
  success: boolean;
  message: string;
}

export interface TicketsState {
  myTickets: {
    data: Ticket[];
    totalData: number;
    totalPage: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
  };
  allTickets: {
    data: Ticket[];
    totalData: number;
    totalPage: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
  };
  taskList: {
    data: Ticket[];
    totalData: number;
    totalPage: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
  };
  taskCount: number;
  isSubmitting: boolean;
  ticketDetail: TicketDetail | null;
  isLoadingDetail: boolean;
  detailError: string | null;
}
