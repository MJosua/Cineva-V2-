import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

export interface InventoryItem {
    id: number;
    resource_category: string;
    resource_key: string;
    resource_label: string;
    attributes: any;
    is_active: number;
}

interface InventoryState {
    items: InventoryItem[];
    loading: boolean;
    error?: string;
}

const initialState: InventoryState = {
    items: [],
    loading: false,
};

export const fetchInventory = createAsyncThunk(
    'inventory/fetchInventory',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue('Failed to fetch inventory');
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
        }
    }
);

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        clearInventory: (state) => {
            state.items = [];
            state.error = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventory.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<InventoryItem[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchInventory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearInventory } = inventorySlice.actions;
export default inventorySlice.reducer;
