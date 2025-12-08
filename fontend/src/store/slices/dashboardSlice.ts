
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { DashboardFunction } from "@/types/hotsDashboard";

interface DashboardState {
  data: DashboardFunction[];
  loading: boolean;
  error?: string;
}

const initialState: DashboardState = {
  data: [],
  loading: false,
  error: undefined,
};

export const fetchDashboardFunctions = createAsyncThunk(
  "dashboard/fetchFunctions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("tokek");

      // ✅ EARLY RETURN — no API call if token is missing or invalid
      if (!token || token === "null" || token === "undefined") {
        console.warn("⚠️ No valid token found, skipping dashboard fetch.");
        return rejectWithValue("Token missing or invalid");
      }

      // ✅ Only runs when token is valid
      const response = await axios.get(`${API_URL}/hotsdashboard/functions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!Array.isArray(response.data)) {
        console.error("❌ Unexpected response format:", response.data);
        return rejectWithValue("Unexpected response format from backend");
      }

      return { data: response.data as DashboardFunction[] };

    } catch (error: any) {
      console.error("fetchDashboardFunctions API Error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network error"
      );
    }
  }
);


const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardErrors: (state) => {
      state.error = undefined;
    },
    clearDashboardData: (state) => {
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardFunctions.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchDashboardFunctions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchDashboardFunctions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unknown error";
      });
  },
});

export const { clearDashboardErrors, clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
