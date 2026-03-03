
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Analyst } from "@/types/analysttype";

interface AnalystState {
    data: Analyst[];
    loading: boolean;
    error?: string;
}

const initialState: AnalystState = {
    data: [],
    loading: false,
    error: undefined,
};



export const fetchAnalyst = createAsyncThunk(
    'settings/fetchAnalyst',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('tokek');

            const [getdatares] = await Promise.all([
                axios.get(`${API_URL}/hots_Tps/analyst`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!getdatares.data.success) {
                return rejectWithValue('One or more analyst fetches failed');
            }
            // console.log("getdatares",getdatares.data.results)
            return {
                data: getdatares.data.results || [],
            };
        } catch (error: any) {
            console.error('fetchAnalyst API Error:', error);
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Network error'
            );
        }
    }
);

const analystslice = createSlice({
    name: 'analyst',
    initialState,
    reducers: {
        clearAnalystErrors: (state) => {
            state.error = undefined;
        },
        clearAnalystData: (state) => {
            state.data = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnalyst.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchAnalyst.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
            })
            .addCase(fetchAnalyst.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Unknown error';
            });
    },
});

export const { clearAnalystErrors, clearAnalystData } = analystslice.actions;
export default analystslice.reducer;
