
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { DashboardFunction } from "@/types/hotsDashboard";

interface DashboardState {
  data: DashboardFunction[];
  summaries: Record<number, any>; // Store card summaries by function ID
  loading: boolean;
  summaryLoading: boolean;
  error?: string;
  lastUpdated?: number;
}

const SUM_CACHE_KEY = 'hots_dashboard_sums';

const loadCachedSums = () => {
    try {
        const cached = localStorage.getItem(SUM_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
};

const initialState: DashboardState = {
  data: [],
  summaries: loadCachedSums(),
  loading: false,
  summaryLoading: false,
  error: undefined,
};

export const fetchDashboardFunctions = createAsyncThunk(
  "dashboard/fetchFunctions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("hots_tokek");

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

export const fetchDashboardSummaries = createAsyncThunk(
  "dashboard/fetchSummaries",
  async (functions: DashboardFunction[], { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("hots_tokek");
      if (!token) return rejectWithValue("Token missing");

      const newSummaries: Record<number, any> = {};

      await Promise.all(
        functions.map(async (func) => {
          try {
            // Check for shipment_analytics skip logic (as seen in DashboardPage.tsx)
            let config: any = {};
            if (func.card_config) {
               try { config = typeof func.card_config === 'string' ? JSON.parse(func.card_config) : func.card_config; } catch(e){}
            }
            if (config && config.type === 'shipment_analytics') return;

            const res = await axios.get(`${API_URL}/hotsdashboard/card_summary/${func.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
              newSummaries[func.id] = res.data.data;
            }
          } catch (e) {
            console.warn(`Summary fetch failed for ${func.id}`);
          }
        })
      );

      return { summaries: newSummaries };
    } catch (error: any) {
      return rejectWithValue(error.message);
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
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardFunctions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unknown error";
      })
      .addCase(fetchDashboardSummaries.pending, (state) => {
        state.summaryLoading = true;
      })
      .addCase(fetchDashboardSummaries.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaries = { ...state.summaries, ...action.payload.summaries };
        localStorage.setItem(SUM_CACHE_KEY, JSON.stringify(state.summaries));
      })
      .addCase(fetchDashboardSummaries.rejected, (state) => {
        state.summaryLoading = false;
      });
  },
});

export const { clearDashboardErrors, clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
