# Meeting Room Modification & Kiosk System

## Overview
This system enables users and Kiosk devices to modify (Edit Time) or Cancel existing meeting room bookings within the HOTS Scheduling interface.

## API Architecture

### 1. Action Endpoint
- **URL**: `POST /hots_ticket/meetingroom/action`
- **Controller**: `engineTicket.meetingRoomAction`
- **Purpose**: Unified endpoint for cancellations and time extensions.
- **Authentication**:
    - **Web**: Standard Bearer Token (`tokek`). Authorization is granted if the user is the **Creator** (`t_ticket.created_by`) or the **PIC** (`t_ticket_detail.PIC_user_id`).
    - **Kiosk**: Bypasses token verification if `kiosk_password` is provided. It validates the password against the PIC's record in the `user` table.

### 2. Time Boundary Endpoint
- **URL**: `GET /hots_settings/get/meetingroom/boundary`
- **Purpose**: Calculates the `max_extension_time` by finding the start time of the next booking in the same room.

### 3. Battery Status Endpoint
- **URL**: `POST /api/rooms/battery-status`
- **Router**: `routers/meetingbook/rooms.js`
- **Mounted at**: `App.use("/api/rooms", mbrooms)` in `index.js`
- **Payload**: `{ resource_key, battery_level, is_charging }`
- **Storage**: Updates `attributes` JSON column in `resource_m_data` table (`hots` DB) for the matching `resource_key` / `resource_category = 'meeting_room'`

## Technical Implementation Details

### Kiosk Authentication Logic
The Kiosk mode (`localStorage.getItem("isKiosk") === "true"`) requires the PIC password for any modification.
- **Password Storage**: HOTS primarily stores passwords in **plain text** (Testing Phase). 
- **Validation**: The backend checks the provided password against both the raw `pswd` value and its Hashed version (`hashPasswordHT`) for forward compatibility.
- **Security**: PIC details (Name/ID) are locked/read-only in the Kiosk view to prevent unauthorized spoofing.
- **Kiosk User**: `TABLET_IOD_ASIA` (uid), password `TABLET_IOD_ASIA_PWD_2026` — stored in `hots.user` AND `iod.sys_user`.

### Battery Reporting Flow (Kiosk Mode)
Battery reporting is **co-located inside `GanttRoomUsage.tsx`** (the booking widget rendered on the kiosk page).

**Trigger conditions** (reporting only in kiosk mode):
1. **On load** — immediately sends battery level and charging status.
2. **Every multiple-of-5% change** — when `level % 5 === 0` and level differs from last reported.
3. **On charging state change** — whenever plugged in / unplugged.
4. **Every 10 minutes** — heartbeat to keep dashboard up-to-date.

**Detection logic**:
```ts
const isKiosk = urlParams.get("kiosk_key") === "TABLET_IOD_ASIA"
             || localStorage.getItem("isKiosk") === "true";
const resourceKey = urlParams.get("resource_key") || localStorage.getItem("current_resource_key");
```

> ⚠️ **Browser Compatibility**: The Web Battery API (`navigator.getBattery()`) is **only supported in Firefox**. Chrome/Edge have removed it. Deploy kiosk tablets using Firefox.

**localStorage keys used**:
| Key | Purpose |
|-----|---------|
| `tokek` | JWT auth token |
| `isKiosk` | Kiosk mode flag |
| `current_resource_key` | Room identifier (e.g. `ANZPAC`) |
| `last_battery_report` | Timestamp of last report |
| `last_battery_level` | Level at last report (for change detection) |

### Frontend State & UI
- **Token Management**: The frontend uses `localStorage.getItem("tokek")` as the primary source of truth for the authentication header to avoid Redux initialization delays.
- **Layering**: To ensure dropdowns appear over the modal cards, the `SelectContent` component in `GanttRoomUsage.tsx` must use `z-[9999]`.
- **Kiosk Mode Detection**: Reliably determined via `localStorage.isKiosk`.
- **Battery badge in select removed**: The room dropdown no longer shows battery %. Battery is displayed on the dashboard only.

### Database & Transactions
- **Pattern**: Modular Engine Pattern with Transactional writes using `conn.beginTransaction()`, `conn.commit()`, and `conn.rollback()`.
- **mysql2/promise**: When using `dbHots.promise().getConnection()`, the resulting `conn` object is already a promise-wrapped instance. **Do not call `.promise()` on the connection object again.**
- **Overlap Prevention**: The "Edit Time" action performs a strict SQL check to ensure the new `end_time` does not overlap with any existing non-cancelled bookings for that room/date.

## Common Pitfalls
1. **Z-index**: Select dropdowns in Radix/Shadcn might render behind the framer-motion modal if not explicitly layered.
2. **Token Expiration**: Always fallback to `localStorage` if the Redux state is empty/syncing.
3. **Database Types**: `t_ticket_detail.value` is a string (EAV); ensure proper casting or comparison in SQL queries.
4. **Battery API**: Only works in Firefox. Chrome removed `navigator.getBattery()`. Use Firefox for kiosk deployment.
