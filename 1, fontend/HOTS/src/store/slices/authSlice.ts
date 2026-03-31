import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/sourceConfig';

interface UserData {
  id: string;
  username: string;
  uid: string;
  email?: string;
  role?: string;
  user_id?: number; // Add user_id field for approval logic
  [key: string]: any;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginAttempts: number;
  isLocked: boolean;
}

// Helper functions for persistent user storage
const persistUserData = (userData: UserData) => {
  localStorage.setItem('persistentUser', JSON.stringify({
    id: userData.id,
    username: userData.username,
    uid: userData.uid,
    email: userData.email
  }));
};

const getPersistentUserData = (): Partial<UserData> | null => {
  try {
    const stored = localStorage.getItem('persistentUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const clearPersistentUserData = () => {
  localStorage.removeItem('persistentUser');
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('hots_tokek'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('hots_tokek'),
  error: null,
  loginAttempts: 0,
  isLocked: false,
};



// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hots_auth/login`, {
        uid: username,
        asin: password,
      });

      if (response.data.success) {
        const { hots_tokek, userData, current_delv_week } = response.data;
        localStorage.setItem('hots_tokek', hots_tokek);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('current_delv_week', current_delv_week);
        // Persist user data for recovery scenarios
        persistUserData(userData);

        return { token: hots_tokek, userData };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  localStorage.removeItem('hots_tokek');
  localStorage.removeItem('isAuthenticated');
  clearPersistentUserData();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.isLocked = false;
    },
    setLocked: (state) => {
      state.isLocked = true;
    },
    // Add action to clear only token but preserve user data temporarily
    clearToken: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      // Don't clear user data immediately to allow re-authentication
    },
    // New action to get persistent user data for recovery
    loadPersistentUser: (state) => {
      const persistentData = getPersistentUserData();
      if (persistentData && !state.user?.uid) {
        state.user = { ...state.user, ...persistentData } as UserData;
      }
    },
    // New action to set user data after keepLogin verification
    setUserData: (state, action: PayloadAction<{ token: string; userData: UserData }>) => {
      state.token = action.payload.token;
      state.user = action.payload.userData;
      state.isAuthenticated = true;
      state.error = null;

      // Persist user data
      persistUserData(action.payload.userData);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.userData;
        state.error = null;
        state.loginAttempts = 0;
        state.isLocked = false;

        // Persist user data
        persistUserData(action.payload.userData);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;

        // Check if account should be locked
        if (action.payload && typeof action.payload === 'string' &&
          action.payload.includes('Too many login attempt')) {
          state.isLocked = true;
        }
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loginAttempts = 0;
        state.isLocked = false;
      });
  },
});

export const { clearError, resetLoginAttempts, setLocked, clearToken, loadPersistentUser, setUserData } = authSlice.actions;
export { getPersistentUserData }; // Export for use in other components
export default authSlice.reducer;
