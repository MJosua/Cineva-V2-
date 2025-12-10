
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { srf_purpose } from "@/types/srf_purpose_type";

interface srf_PurposeState {
    data: srf_purpose[];
    loading: boolean;
    error?: string;
}

const initialState: srf_PurposeState = {
    data: [],
    loading: false,
    error: undefined,
};



export const fetchSrf_Puprose = createAsyncThunk(
    'settings/fetchSRF_Purpose',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('tokek');

            const [getdatares] = await Promise.all([
                axios.get(`${API_URL}/hots_settings/get_srf_purpose`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!getdatares.data.success) {
                return rejectWithValue('One or more srf_purpose fetches failed');
            }
            // console.log("getdatares",getdatares.data.results)
            return {
                data: getdatares.data.results || [],
            };
        } catch (error: any) {
            console.error('fetchSRF_Purpose API Error:', error);
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Network error'
            );
        }
    }
);

const srf_purposeslice = createSlice({
    name: 'srf_purpose',
    initialState,
    reducers: {
        clearSrf_PuproseErrors: (state) => {
            state.error = undefined;
        },
        clearSrf_PuproseData: (state) => {
            state.data = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSrf_Puprose.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchSrf_Puprose.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
            })
            .addCase(fetchSrf_Puprose.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Unknown error';
            });
    },
});

export const { clearSrf_PuproseErrors, clearSrf_PuproseData } = srf_purposeslice.actions;
export default srf_purposeslice.reducer;
