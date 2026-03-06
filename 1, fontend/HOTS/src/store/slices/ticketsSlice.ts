import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { TicketsState } from '@/types/ticketTypes';

const initialState: TicketsState = {
  myTickets: {
    data: [],
    totalData: 0,
    totalPage: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  allTickets: {
    data: [],
    totalData: 0,
    totalPage: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  taskList: {
    data: [],
    totalData: 0,
    totalPage: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  involvedList: {
    data: [],
    totalData: 0,
    totalPage: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  taskCount: 0,
  isSubmitting: false,
  ticketDetail: null,
  isLoadingDetail: false,
  detailError: null,
  sseSignals: {
    assignment: 0,
    task: 0,
    comment: 0,
    document: 0,
    ticket: 0,
    processingTicketId: null  // 🆕 Track which specific ticket is generating document
  }
};

/* -------------------------------------------------------------------------- */
/*                               FETCH FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

export const fetchMyTickets = createAsyncThunk(
  'tickets/fetchMyTickets',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/my_ticket?page=${page}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch my tickets');
      }

      return { ...response.data, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAllTickets = createAsyncThunk(
  'tickets/fetchAllTickets',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/all_ticket?page=${page}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch all tickets');
      }

      return { ...response.data, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTaskList = createAsyncThunk(
  'tickets/fetchTaskList',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/task_list?page=${page}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch task list');
      }

      return { ...response.data, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchInvolvedTaskList = createAsyncThunk(
  'tickets/fetchInvolvedTaskList',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/task_list_involved?page=${page}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch involved task list');
      }

      return { ...response.data, currentPage: page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTicketDetail = createAsyncThunk(
  'tickets/fetchTicketDetail',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/detail/${ticketId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch ticket detail');
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                            CREATE / UPLOAD FUNCTIONS                        */
/* -------------------------------------------------------------------------- */

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async ({ serviceId, ticketData }: { serviceId: string; ticketData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_ticket/create/ticket/${serviceId}`, ticketData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('hots_tokek')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to create ticket');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const uploadFiles = createAsyncThunk(
  'tickets/uploadFiles',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_ticket/upload/files/`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('hots_tokek')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to upload files');
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTaskCount = createAsyncThunk(
  'tickets/fetchTaskCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_ticket/task_count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` },
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch task count');
      }

      // Backend returns summary.my_approvals
      return response.data.summary?.my_approvals || 0;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


/* -------------------------------------------------------------------------- */
/*                         APPROVE / REJECT (ENGINE v4)                       */
/* -------------------------------------------------------------------------- */

interface ApproveEnginePayload {
  ticketId: string;
  approvalOrder: number;
  comment?: string;
  approver_id?: number;
}

interface RejectEnginePayload {
  ticketId: string;
  approvalOrder: number;
  rejectionRemark: string;
  approver_id?: number;
}

export const approveTicketEngine = createAsyncThunk(
  'tickets/approveTicketEngine',
  async (
    { ticketId, approvalOrder, comment, approver_id }: ApproveEnginePayload,
    { rejectWithValue }
  ) => {
    try {
      if (!approver_id) {
        console.warn("⚠️ approveTicketEngine: approver_id is missing!");
      }

      const response = await axios.post(
        `${API_URL}/engine/ticket/approve`,
        {
          ticket_id: ticketId,
          approval_order: approvalOrder,
          remark: comment || '',
          approver_id,   // 🔥 IMPORTANT
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('hots_tokek')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("response.data", response.data)

      if (!response.data.ok) {
        return rejectWithValue(response.data.error || 'Engine approval failed');
      }

      return { ticketId, approvalOrder };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);


export const rejectTicketEngine = createAsyncThunk(
  'tickets/rejectTicketEngine',
  async (
    { ticketId, approvalOrder, rejectionRemark, approver_id }: RejectEnginePayload,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/engine/ticket/reject`,
        {
          ticket_id: ticketId,
          approval_order: approvalOrder,
          remark: rejectionRemark,
          approver_id,  // 🔥 IMPORTANT
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('hots_tokek')}`,
            'Content-Type': 'application/json',
          },
        }
      );


      if (!response.data.ok) {
        return rejectWithValue(response.data.error || 'Engine rejection failed');
      }

      return { ticketId, approvalOrder };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);



/* -------------------------------------------------------------------------- */
/*                                 SLICE REDUCERS                             */
/* -------------------------------------------------------------------------- */

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.myTickets.error = null;
      state.allTickets.error = null;
      state.taskList.error = null;
      state.detailError = null;
    },
    setCurrentPage: (state, action: PayloadAction<{ type: 'myTickets' | 'allTickets' | 'taskList' | 'involvedList'; page: number }>) => {
      state[action.payload.type].currentPage = action.payload.page;
    },
    clearTicketDetail: (state) => {
      state.ticketDetail = null;
      state.detailError = null;
    },
    triggerSSERefresh: (state, action: PayloadAction<'assignment' | 'task' | 'comment' | 'document' | 'ticket'>) => {
      // Use simple counters or timestamps to trigger useEffects
      if (!state.sseSignals) state.sseSignals = { assignment: 0, task: 0, comment: 0, document: 0, ticket: 0 };
      state.sseSignals[action.payload] = Date.now();
    },
    // 🆕 Track document generation processing state (per-ticket)
    setDocumentProcessing: (state, action: PayloadAction<string | null>) => {
      if (!state.sseSignals) state.sseSignals = { assignment: 0, task: 0, comment: 0, document: 0, ticket: 0 };
      state.sseSignals.processingTicketId = action.payload;
    },
    // 🆕 Update sidebar counts (Approvals only for this slice)
    setSidebarCounts: (state, action: PayloadAction<{ approvals?: number }>) => {
      if (action.payload.approvals !== undefined) state.taskCount = action.payload.approvals;
    }
  },

  extraReducers: (builder) => {
    /* ------------------------------- My Tickets ------------------------------- */
    builder
      .addCase(fetchMyTickets.pending, (state) => {
        state.myTickets.isLoading = true;
      })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.myTickets.isLoading = false;
        state.myTickets.data = action.payload.data || [];
        state.myTickets.totalData = action.payload.totalData || 0;
        state.myTickets.totalPage = action.payload.totalPage || 0;
        state.myTickets.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.myTickets.isLoading = false;
        state.myTickets.error = action.payload as string;
      })

      /* ------------------------------ All Tickets ------------------------------ */
      .addCase(fetchAllTickets.pending, (state) => {
        state.allTickets.isLoading = true;
      })
      .addCase(fetchAllTickets.fulfilled, (state, action) => {
        state.allTickets.isLoading = false;
        state.allTickets.data = action.payload.data || [];
        state.allTickets.totalData = action.payload.totalData || 0;
        state.allTickets.totalPage = action.payload.totalPage || 0;
        state.allTickets.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAllTickets.rejected, (state, action) => {
        state.allTickets.isLoading = false;
        state.allTickets.error = action.payload as string;
      })

      /* ------------------------------- Task List ------------------------------- */
      .addCase(fetchTaskList.pending, (state) => {
        state.taskList.isLoading = true;
      })
      .addCase(fetchTaskList.fulfilled, (state, action) => {
        state.taskList.isLoading = false;
        state.taskList.data = action.payload.data || [];
        state.taskList.totalData = action.payload.totalData || 0;
        state.taskList.totalPage = action.payload.totalPage || 0;
        state.taskList.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchTaskList.rejected, (state, action) => {
        state.taskList.isLoading = false;
        state.taskList.error = action.payload as string;
      })

      /* --------------------------- Involved Task List -------------------------- */
      .addCase(fetchInvolvedTaskList.pending, (state) => {
        state.involvedList.isLoading = true;
      })
      .addCase(fetchInvolvedTaskList.fulfilled, (state, action) => {
        state.involvedList.isLoading = false;
        state.involvedList.data = action.payload.data || [];
        state.involvedList.totalData = action.payload.totalData || 0;
        state.involvedList.totalPage = action.payload.totalPage || 0;
        state.involvedList.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchInvolvedTaskList.rejected, (state, action) => {
        state.involvedList.isLoading = false;
        state.involvedList.error = action.payload as string;
      })

      /* ------------------------------ Ticket Detail ---------------------------- */
      .addCase(fetchTicketDetail.pending, (state) => {
        state.isLoadingDetail = true;
      })
      .addCase(fetchTicketDetail.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.ticketDetail = action.payload;
      })
      .addCase(fetchTicketDetail.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.detailError = action.payload as string;
      })


      /* ------------------------------- Task Count ------------------------------ */
      .addCase(fetchTaskCount.fulfilled, (state, action) => {
        state.taskCount = action.payload;
      })

      /* --------------------------- Approve (Engine v4) ------------------------- */
      .addCase(approveTicketEngine.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(approveTicketEngine.fulfilled, (state, action) => {
        state.isSubmitting = false;

        const ticket = state.taskList.data.find(
          (t) => t.ticket_id.toString() === action.payload.ticketId
        );

        if (ticket?.list_approval) {
          const approval = ticket.list_approval.find(
            (a) => a.approval_order === action.payload.approvalOrder
          );
          if (approval) approval.approval_status = 1;
        }
      })
      .addCase(approveTicketEngine.rejected, (state) => {
        state.isSubmitting = false;
      })

      /* --------------------------- Reject (Engine v4) -------------------------- */
      .addCase(rejectTicketEngine.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(rejectTicketEngine.fulfilled, (state, action) => {
        state.isSubmitting = false;

        const ticket = state.taskList.data.find(
          (t) => t.ticket_id.toString() === action.payload.ticketId
        );

        if (ticket?.list_approval) {
          const approval = ticket.list_approval.find(
            (a) => a.approval_order === action.payload.approvalOrder
          );
          if (approval) approval.approval_status = 2;
        }
      })
      .addCase(rejectTicketEngine.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const { clearErrors, setCurrentPage, clearTicketDetail, triggerSSERefresh, setDocumentProcessing, setSidebarCounts } = ticketsSlice.actions;
export default ticketsSlice.reducer;
