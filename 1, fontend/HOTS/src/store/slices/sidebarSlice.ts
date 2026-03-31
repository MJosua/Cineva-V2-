import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/sourceConfig';

interface SystemMenuItem {
  menu_id: number;
  menu_name: string;
  menu_group: string;
  group_order: number;
  menu_icon: string;
  menu_path: string;
  roles_allowed: any;
  department_scope: any;
  users_allowed: any;
  is_active: number | boolean;
  menu_order_priority: number;
}

interface SidebarState {
  menuData: { [key: string]: SystemMenuItem[] };
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const CACHE_KEY = 'hots_sidebar_cache';

const loadCachedMenu = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const initialState: SidebarState = {
  menuData: loadCachedMenu(),
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchSidebarMenu = createAsyncThunk(
  'sidebar/fetchSidebarMenu',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('hots_tokek');
      if (!token) return rejectWithValue('No token found');

      const response = await axios.get(`${API_URL}/hots_system_menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    clearSidebar: (state) => {
      state.menuData = {};
      state.lastUpdated = null;
      localStorage.removeItem(CACHE_KEY);
    },
    updateLocalMenu: (state, action: PayloadAction<{ [key: string]: SystemMenuItem[] }>) => {
        state.menuData = action.payload;
        state.lastUpdated = Date.now();
        localStorage.setItem(CACHE_KEY, JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSidebarMenu.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSidebarMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuData = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
        localStorage.setItem(CACHE_KEY, JSON.stringify(action.payload));
      })
      .addCase(fetchSidebarMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSidebar, updateLocalMenu } = sidebarSlice.actions;
export default sidebarSlice.reducer;
