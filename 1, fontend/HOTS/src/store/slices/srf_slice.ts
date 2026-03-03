
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { factoryplant, srfsamplecategory, linkeddistributor } from "@/types/srf_types";

interface srf_data {
  factoryplants: factoryplant[];
  srfsamplecategoryes: srfsamplecategory[];
  linkeddistributors: linkeddistributor[];
  loading: boolean;
  error?: string;
}

const initialState: srf_data = {
  factoryplants: [],
  srfsamplecategoryes: [],
  linkeddistributors: [],
  loading: false,
};

export const fetchSRF = createAsyncThunk(
  'settings/fetchSRF',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('tokek');

      const [plantRes, categoryRes, deliverToRes] = await Promise.all([
        axios.get(`${API_URL}/hots_settings/get_srf_plant`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/hots_settings/get_srf_sampleCategory`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/hots_settings/get_srf_deliverTo`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!plantRes.data.success || !categoryRes.data.success || !deliverToRes.data.success) {
        return rejectWithValue('One or more SRF fetches failed');
      }

      return {
        factoryplants: plantRes.data.data || [],
        srfsamplecategoryes: categoryRes.data.data || [],
        linkeddistributors: deliverToRes.data.data || [],
      };
    } catch (error: any) {
      console.error('fetchSRF API Error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Network error'
      );
    }
  }
);

const srfSlice = createSlice({
  name: 'srf',
  initialState,
  reducers: {
    clearSrfErrors: (state) => {
      state.error = undefined;
    },
    clearSrfData: (state) => {
      state.factoryplants = [];
      state.srfsamplecategoryes = [];
      state.linkeddistributors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSRF.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchSRF.fulfilled, (state, action: PayloadAction<{ factoryplants: factoryplant[]; srfsamplecategoryes: srfsamplecategory[]; linkeddistributors: linkeddistributor[]; }>) => {
        state.loading = false;
        state.factoryplants = action.payload.factoryplants;
        state.srfsamplecategoryes = action.payload.srfsamplecategoryes;
        state.linkeddistributors = action.payload.linkeddistributors;
      })
      .addCase(fetchSRF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSrfErrors, clearSrfData } = srfSlice.actions;
export default srfSlice.reducer;
