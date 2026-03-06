// store/slices/assignmentSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface AssignmentState {
    assignmentCount: number;
    loading: boolean;
    error?: string;
}

const initialState: AssignmentState = {
    assignmentCount: 0,
    loading: false,
};

export const fetchAssignmentCount = createAsyncThunk(
    'assignment/fetchCount',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            if (!token) return rejectWithValue('No token');

            const response = await axios.get(
                `${API_URL}/engine/my-assignments/count`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            return response.data.count;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const assignmentSlice = createSlice({
    name: 'assignment',
    initialState,
    reducers: {
        // Optional: action to manually set count if needed (e.g. optimistic update)
        setAssignmentCount: (state, action) => {
            state.assignmentCount = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssignmentCount.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAssignmentCount.fulfilled, (state, action) => {
                state.assignmentCount = action.payload;
                state.loading = false;
            })
            .addCase(fetchAssignmentCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setAssignmentCount } = assignmentSlice.actions;
export default assignmentSlice.reducer;
