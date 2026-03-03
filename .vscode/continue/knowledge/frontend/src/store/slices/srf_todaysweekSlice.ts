// src/redux/slices/srf_todaysweekSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

// --- Interface ---
export interface Todaysweek {
  actualWeek: number;
  deliveryYear: number;
}

interface TodaysweekState {
  data: Todaysweek | null; // only one object, not an array
  loading: boolean;
  error?: string;
}

const initialState: TodaysweekState = {
  data: null,
  loading: false,
  error: undefined,
};

// --- Async Thunk ---
export const fetchTodaysweek = createAsyncThunk<
  Todaysweek, // return type
  void, // argument type
  { rejectValue: string } // reject value type
>(
  "srf_todaysweek/fetchTodaysweek",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("tokek");
      const response = await axios.get(`${API_URL}/hots_settings/get_srf/todaysweek`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Adjust field names based on your backend response
      if (response.data.status !== "success") {
        return rejectWithValue(response.data.message || "Failed to fetch today's week");
      }

      const results = response.data.data; // from backend { actualWeek, deliveryYear }
      console.log("fetchTodaysweek results:", results);

      return {
        actualWeek: results.actualWeek ?? 0,
        deliveryYear: results.deliveryYear ?? 0,
      };
    } catch (error: any) {
      console.error("fetchTodaysweek API Error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Network error"
      );
    }
  }
);

// --- Slice ---
const todaysweekSlice = createSlice({
  name: "srf_todaysweek",
  initialState,
  reducers: {
    clearTodaysweekError: (state) => {
      state.error = undefined;
    },
    clearTodaysweekData: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodaysweek.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchTodaysweek.fulfilled, (state, action: PayloadAction<Todaysweek>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTodaysweek.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { clearTodaysweekError, clearTodaysweekData } = todaysweekSlice.actions;
export default todaysweekSlice.reducer;
