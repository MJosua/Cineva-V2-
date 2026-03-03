import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

export interface MeetingRoom {
  id: number;
  name?: string;      // Legacy support
  room_name: string;  // New Universal System
  resource_key?: string;
  capacity?: number;
  location?: string;
}

export interface MeetingBooking {
  id: number;
  room: string;
  date: string;
  start_time: string;
  end_time: string;
  booked_by: string;
  attendees?: number;
  purpose?: string;
  PIC?: string;
  PIC_user_id?: string;
}

interface MeetingRoomState {
  rooms: MeetingRoom[];
  bookings: MeetingBooking[];
  loading: boolean;
  error?: string;
}

const initialState: MeetingRoomState = {
  rooms: [],
  bookings: [],
  loading: false,
};

// 🔹 Fetch all meeting rooms
export const fetchMeetingRooms = createAsyncThunk(
  "meetingroom/fetchRooms",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("tokek");
      const res = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });



      if (!res.data?.success || !Array.isArray(res.data?.data)) {
        throw new Error("Invalid room response structure");
      }

      return res.data.data as MeetingRoom[];
    } catch (err: any) {
      console.error("fetchMeetingRooms Error:", err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔹 Fetch all active bookings
export const fetchMeetingBookings = createAsyncThunk(
  "meetingroom/fetchBookings",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("tokek");
      // Changed to use the HOTS settings endpoint to match t_ticket source of truth
      const res = await axios.get(`${API_URL}/hots_settings/get/meetingroom`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data?.success && !Array.isArray(res.data?.data)) {
        throw new Error("Invalid meeting booking response structure");
      }

      // Map t_ticket data to MeetingBooking interface
      return res.data.data.map((item: any) => ({
        id: item.ticket_id,
        room: item.room,
        date: item.date,
        start_time: item.start_time,
        end_time: item.end_time,
        booked_by: item.booked_by,
        PIC: item.PIC,
        PIC_user_id: item.PIC_user_id,
        purpose: item.purpose,
      })) as MeetingBooking[];
    } catch (err: any) {
      console.error("fetchMeetingBookings Error:", err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const meetingroomSlice = createSlice({
  name: "meetingroom",
  initialState,
  reducers: {
    clearMeetingRoomErrors: (state) => {
      state.error = undefined;
    },
    clearMeetingRoomData: (state) => {
      state.rooms = [];
      state.bookings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 📦 Fetch Rooms
      .addCase(fetchMeetingRooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMeetingRooms.fulfilled, (state, action: PayloadAction<MeetingRoom[]>) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchMeetingRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 🗓️ Fetch Bookings
      .addCase(fetchMeetingBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMeetingBookings.fulfilled, (state, action: PayloadAction<MeetingBooking[]>) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMeetingBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMeetingRoomErrors, clearMeetingRoomData } = meetingroomSlice.actions;
export default meetingroomSlice.reducer;
