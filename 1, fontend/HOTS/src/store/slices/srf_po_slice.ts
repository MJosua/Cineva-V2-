import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { srf_po_list } from "@/types/sku_types";


interface srf_po_data {
    srf_po_list: srf_po_list[];
    loading: boolean;
    error?: string;
}

const initialState: srf_po_data = {
    srf_po_list: [],
    loading: false,
}

export const fetchpo_srf = createAsyncThunk(s
    'settings/fetchpo_file',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('tokek');

            const [getpores] = await Promise.all([
                axios.get(`${API_URL}/hots_settings/get_srf_po`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!getpores.data.success) {
                return rejectWithValue('One or more SRF fetches failed');
            }
            console.log("getpores.data.results",getpores.data.results)

            return {
                srf_po_list: getpores.data.results || [],
            };
        } catch (error: any) {
            console.error('fetchSKU API Error:', error);
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Network error'
            );
        }
    }
);

const srf_poslice = createSlice({
    name: 'srf_po',
    initialState,
    reducers: {
        clearsrf_poErrors: (state) => {
            state.error = undefined;
        },
        clearsrf_poData: (state) => {
            state.srf_po_list = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchpo_srf.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchpo_srf.fulfilled, (state, action: PayloadAction<{ srf_po_list: srf_po_list[]; }>) => {
                state.loading = false;
                state.srf_po_list = action.payload.srf_po_list;
            })
            .addCase(fetchpo_srf.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});


export const { clearsrf_poErrors, clearsrf_poData } = srf_poslice.actions;
export default srf_poslice.reducer;
