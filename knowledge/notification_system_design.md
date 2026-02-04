# HOTS Notification System Design

## Overview
A persistent, actionable notification system to keep users informed about critical updates (Approvals, Rejections, Assignments). Unlike ephemeral SSE events, these notifications persist until read, serving as a "To-Do" or "Reminder" list (e.g., "You have a new ticket to approve").

## Database Schema

### `user_notification`
We will use a dedicated table for HOTS to ensure we can store rich metadata (JSON) for frontend actions.

| Column | Type | Description |
|---|---|---|
| `notification_id` | INT (PK, AI) | Unique identifier |
| `user_id` | INT | Recipient (ForeignKey -> user.user_id) |
| `type` | VARCHAR(50) | Event type (`approval_needed`, `ticket_update`, `assignment`) |
| `title` | VARCHAR(255) | Brief user-facing title (e.g., "New Approval Required") |
| `message` | TEXT | Detailed text (e.g., "Ticket #1234 requires your approval") |
| `data_payload` | JSON | Action data (e.g., `{ "link": "/ticket/1234", "ticket_id": 1234, "action": "approve" }`) |
| `is_read` | TINYINT(1) | 0 = New/Unread, 1 = Read/Done |
| `created_at` | DATETIME | Timestamp |

```sql
CREATE TABLE IF NOT EXISTS user_notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50),  -- e.g., 'need_approval', 'ticket_status', 'info'
    title VARCHAR(255),
    message TEXT,
    data_payload JSON, -- Contains routing info like { url: '/ticket/detail/123' }
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created_at (created_at)
);
```

## Workflow Integration

### Trigger Points (Backend)
The `sse-manager.js` will serve as the central hub. When an SSE event is emitted, we will **simultaneously** create a persistent notification record in the Inbox.

1.  **Ticket Created**: Notify Assignee / Approver.
2.  **Need Approval**: Notify Next Approver (High Priority).
3.  **Approved/Rejected**: Notify Creator.
4.  **Assigned**: Notify Asignee (New Task).
5.  **New Comment (Chat)**: Notify Ticket Owner & Assignee ("New message from X in Ticket #Y").


### Backend Implementation (`sse-manager.js`)
Update `emitToUser` to handle persistence:
```javascript
// Pseudo-code
async emitToUser(userId, eventType, data) {
    // 1. Emit Realtime (Toast)
    this.send(userId, eventType, data);

    // 2. Persist Notification
    const notificationData = this.mapEventToNotification(eventType, data);
    if (notificationData) {
        await db.query("INSERT INTO t_hots_notifications ...", notificationData);
    }
}
```

## API Endpoints (`hotsNotification.js`)
- `GET /hots_notifications`: Fetch list (unread first).
- `POST /hots_notifications/read/:id`: Mark as read (e.g., when user clicks the row).
- `POST /hots_notifications/read_all`: Clear all badges.
- `GET /hots_notifications/unread_count`: For the bell icon badge.

## Lifecycle & Retention Policy (User & Auto-Management)

To answer the usage question: **"How long do they stay?"**

1.  **Unread Status**: Notifications remain "Active/Unread" indefinitely until the user interacts with them. They will trigger the "Red Dot" badge.
2.  **Read Status**: Once clicked or "Marked as Read", they move to the "History" state (dimmed in UI). They do **not** disappear immediately, allowing users to reference recent history.
3.  **Auto-Cleanup (Retention)**: To prevent table bloat, we will implement an automated cleanup policy:
    - **Read Notifications**: Auto-delete after **30 Days**.
    - **Unread Notifications**: Auto-delete after **90 Days** (assuming irrelevant if ignored for 3 months).
4.  **Manual Cleanup**: Users can "Clear All Read" to tidy up their list immediately.

### Backend Implementation
- **Cron Job / Scheduled Event**: Run a daily cleanup query.
  ```sql
  DELETE FROM t_hots_notifications WHERE is_read = 1 AND created_at < NOW() - INTERVAL 30 DAY;
  ```

## Frontend (`NotificationBell.tsx`)
- **Bell Icon**: Shows unread count.
- **Dropdown/Drawer**: Lists notifications (Unread at top).
- **Click Action**: 
    1. Mark read (API call).
    2. Navigate to `data_payload.url` (e.g., Ticket Detail).
- **"Mark All Read"** button.

