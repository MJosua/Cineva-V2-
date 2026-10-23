
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { skulist } from "@/types/sku_types";

interface sku_data {
  skulist: skulist[];
  loading: boolean;
  error?: string;
}


const initialState: sku_data = {
  skulist: [],
  loading: false,
};

export const fetchsku = createAsyncThunk(
  'settings/fetchSKU',
  async (_, { rejectWithValue }) => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = localStorage.getItem('hots_tokek');

        const [getskures] = await Promise.all([
          axios.get(`${API_URL}/hots_settings/get_srf_sku`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);


        if (!getskures.data.success) {
          if (attempt === maxRetries) return rejectWithValue('One or more SRF fetches failed');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        return {
          skulist: getskures.data.results || [],
        };
      } catch (error: any) {
        if (attempt === maxRetries) {
          return rejectWithValue(
            error.response?.data?.message || error.message || 'Network error'
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
);

const skuslice = createSlice({
  name: 'sku',
  initialState,
  reducers: {
    clearSkuErrors: (state) => {
      state.error = undefined;
    },
    clearSkuData: (state) => {
      state.skulist = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchsku.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchsku.fulfilled, (state, action: PayloadAction<{ skulist: skulist[]; }>) => {
        state.loading = false;
        state.skulist = action.payload.skulist;
      })
      .addCase(fetchsku.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSkuErrors, clearSkuData } = skuslice.actions;
export default skuslice.reducer;
