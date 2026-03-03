
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Country } from "@/types/countrytype";

interface CountryState {
    data: Country[];
    loading: boolean;
    error?: string;
}

const initialState: CountryState = {
    data: [],
    loading: false,
    error: undefined,
};



export const fetchCountry = createAsyncThunk(
    'settings/country',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('tokek');

            const [getdatares] = await Promise.all([
                axios.get(`${API_URL}/hots_Tps/country`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!getdatares.data.success) {
                return rejectWithValue('One or more fetchCountry failed');
            }
            console.log("getdatares",getdatares.data.results)
            return {
                data: getdatares.data.results || [],
            };
        } catch (error: any) {
            console.error('fetchCountry API Error:', error);
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Network error'
            );
        }
    }
);

const countryslice = createSlice({
    name: 'country',
    initialState,
    reducers: {
        clearCountryErrors: (state) => {
            state.error = undefined;
        },
        clearCountryData: (state) => {
            state.data = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCountry.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchCountry.fulfilled, (state, action) => {
                state.loading = false;
                console.log("action.payload.data",action.payload.data)
                state.data = action.payload.data;
            })
            .addCase(fetchCountry.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Unknown error';
            });
    },
});

export const { clearCountryErrors, clearCountryData } = countryslice.actions;
export default countryslice.reducer;
