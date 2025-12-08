import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { CustomFunctionState, CustomFunction, ServiceCustomFunction, CustomFunctionLog, GeneratedDocument, FunctionTemplate } from '@/types/customFunctionTypes';

const initialState: CustomFunctionState = {
  functions: [],
  serviceFunctions: [],
  functionLogs: [],
  generatedDocuments: [],
  templates: [],
  isLoading: false,
  isExecuting: false,
  error: null,
};

// Async thunks for API calls
export const fetchCustomFunctions = createAsyncThunk(
  'customFunction/fetchFunctions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_customfunction/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch custom functions');
      }
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const fetchServiceFunctions = createAsyncThunk(
  'customFunction/fetchServiceFunctions',
  async (serviceId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_customfunction/service/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch service functions');
      }
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const createCustomFunction = createAsyncThunk(
  'customFunction/createFunction',
  async (functionData: Partial<CustomFunction>, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_customfunction/create`, functionData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to create custom function');
      }
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const updateCustomFunction = createAsyncThunk(
  'customFunction/updateFunction',
  async ({ id, functionData }: { id: number, functionData: Partial<CustomFunction> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/hots_customfunction/update/${id}`, functionData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to update custom function');
      }
      
      return { id, functionData };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const deleteCustomFunction = createAsyncThunk(
  'customFunction/deleteFunction',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/hots_customfunction/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to delete custom function');
      }
      
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const executeCustomFunction = createAsyncThunk(
  'customFunction/executeFunction',
  async ({ ticketId, functionId, params }: { ticketId: number, functionId: number, params?: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_customfunction/execute/${functionId}`, {
        ticket_id: ticketId,
        params
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to execute custom function');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const uploadExcelFile = createAsyncThunk(
  'customFunction/uploadExcel',
  async ({ ticketId, file }: { ticketId: number, file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticket_id', ticketId.toString());
      
      const response = await axios.post(`${API_URL}/hots_customfunction/upload_excel`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to upload Excel file');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const fetchFunctionLogs = createAsyncThunk(
  'customFunction/fetchLogs',
  async (ticketId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_customfunction/logs/${ticketId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch function logs');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching function logs:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const fetchGeneratedDocuments = createAsyncThunk(
  'customFunction/fetchDocuments',
  async (ticketId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_customfunction/documents/${ticketId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch generated documents');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching generated documents:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const fetchFunctionTemplates = createAsyncThunk(
  'customFunction/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hots_customfunction/templates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch function templates');
      }
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const assignFunctionToService = createAsyncThunk(
  'customFunction/assignToService',
  async (assignmentData: {
    service_id: number;
    function_id: number;
    trigger_event: string;
    execution_order: number;
    config: any;
    is_active: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_customfunction/assign_service`, assignmentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to assign function to service');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const updateServiceFunctionAssignment = createAsyncThunk(
  'customFunction/updateServiceAssignment',
  async (assignmentData: {
    id: number;
    service_id: number;
    function_id: number;
    trigger_event: string;
    execution_order: number;
    config: any;
    is_active: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/hots_customfunction/update_service_assignment/${assignmentData.id}`, assignmentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to update service function assignment');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const deleteServiceFunctionAssignment = createAsyncThunk(
  'customFunction/deleteServiceAssignment',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/hots_customfunction/remove_service_assignment/${assignmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to delete service function assignment');
      }
      
      return assignmentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

const customFunctionSlice = createSlice({
  name: 'customFunction',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Custom Functions
      .addCase(fetchCustomFunctions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomFunctions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.functions = action.payload;
      })
      .addCase(fetchCustomFunctions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Service Functions
      .addCase(fetchServiceFunctions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceFunctions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceFunctions = action.payload;
      })
      .addCase(fetchServiceFunctions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Custom Function
      .addCase(createCustomFunction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCustomFunction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.functions.push(action.payload);
      })
      .addCase(createCustomFunction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Custom Function
      .addCase(updateCustomFunction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCustomFunction.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.functions.findIndex(func => func.id === action.payload.id);
        if (index !== -1) {
          state.functions[index] = { ...state.functions[index], ...action.payload.functionData };
        }
      })
      .addCase(updateCustomFunction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Custom Function
      .addCase(deleteCustomFunction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCustomFunction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.functions = state.functions.filter(func => func.id !== action.payload);
      })
      .addCase(deleteCustomFunction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Execute Custom Function
      .addCase(executeCustomFunction.pending, (state) => {
        state.isExecuting = true;
        state.error = null;
      })
      .addCase(executeCustomFunction.fulfilled, (state, action) => {
        state.isExecuting = false;
      })
      .addCase(executeCustomFunction.rejected, (state, action) => {
        state.isExecuting = false;
        state.error = action.payload as string;
      })
      // Upload Excel
      .addCase(uploadExcelFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadExcelFile.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(uploadExcelFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Function Logs
      .addCase(fetchFunctionLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFunctionLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.functionLogs = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFunctionLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.functionLogs = [];
      })
      // Fetch Generated Documents
      .addCase(fetchGeneratedDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGeneratedDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedDocuments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGeneratedDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.generatedDocuments = [];
      })
      // Fetch Function Templates
      .addCase(fetchFunctionTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFunctionTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchFunctionTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Assign Function to Service
      .addCase(assignFunctionToService.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignFunctionToService.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(assignFunctionToService.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Service Function Assignment
      .addCase(updateServiceFunctionAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateServiceFunctionAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(updateServiceFunctionAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Service Function Assignment
      .addCase(deleteServiceFunctionAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteServiceFunctionAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(deleteServiceFunctionAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearErrors, setExecuting } = customFunctionSlice.actions;
export default customFunctionSlice.reducer;
