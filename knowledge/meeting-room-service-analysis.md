# Meeting Room Service Analysis

## 1. Issue: Empty Room List (`${meetingrooms}`)
The Meeting Room form fails to display available rooms because of two critical gaps:

### **A. Backend API Missing**
*   **Status:** The router file `routers/meetingbook/rooms.js` exists and defines `GET /`.
*   **Root Cause:** This router is **NOT mounted** in the main `index.js` file.
*   **Effect:** Requests to `/api/rooms` (or `/mbrooms`) return 404 Not Found.
*   **Fix:** Add `App.use('/api/rooms', mbrooms);` to `index.js`.

### **B. Frontend Logic Missing**
*   **Status:** The Redux action `fetchMeetingRooms` exists in `meetingroom_slice.ts`.
*   **Root Cause:** This action is **never dispatched** by the Form Builder (`DynamicForm.tsx` or `WidgetRenderer`). It is only used in the Gantt Chart (`GanttRoomUsage.tsx`).
*   **Effect:** Even if the API worked, the browser never asks for the data.
*   **Fix:** Add `dispatch(fetchMeetingRooms())` to the `useEffect` in `DynamicForm` or `WidgetRenderer` when the form configuration contains `${meetingrooms}`.

---

## 2. Issue: Saving Mechanism
The user asked: *"how is the saving method on t ticket happened?"*

*   **Configured Action:** The JSON config specifies `"submit": { "action": "/submit-meeting-room" }`.
*   **Actual Behavior:** The `DynamicForm` component has **no handler** for this custom action URL. It falls back to the default `handleSubmit` function.
*   **Result:**
    *   The data is saved via `ticketsSlice.createTicket`.
    *   It hits `POST /hots_ticket/create/ticket/:service_id`.
    *   Data is stored in `t_ticket` (Header) and `t_ticket_detail` (EAV Attributes).
    *   **NO** data is written to any specialized Meeting Booking table (e.g., `t_meeting_booking`).

### **Recommendation**
If dedicated booking logic (checking availability ensuring no double bookings) is required:
1.  Implement a specific controller for `/submit-meeting-room`.
2.  Update `DynamicForm` to route to this custom endpoint when specified.
