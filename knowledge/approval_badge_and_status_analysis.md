# Approval Badge & Ticket Status Analysis

## 1. Badge Count Issue ("My Approvals")
**Observation:** The badge number on "My Approvals" sidebar menu counts items that are not just approvals (e.g., assignments).

### **Root Cause: `getTaskCount` Query**
The API endpoint `/hots_ticket/task_count` hits the `getTaskCount` function in `ticketController.js` (lines ~4660).
The SQL query explicitly joins **both** `t_ticket_event` (approvals) AND `t_ticket_assignment` (assignments) and counts a ticket if **EITHER** matches the user.

```sql
WHERE (
    (ae.approver_id = ? AND ...) -- Pending Approval
    OR
    (tta.assigned_id = ?)        -- Pending Assignment (Task)
)
```

### **Why this happens**
The system currently treats "My Approvals" as a generic "My Task List" (Inbox). However, the sidebar separates them into "My Approvals" and "My Assignments", creating confusion because the "Approvals" badge is actually a "Total Inbox" count.

### **Solution Recommendation**
To fix this, we must split the `getTaskCount` query or parameterize it to count *only* approvals for the Approvals badge.

---

## 2. Ticket Status Issue ("Fulfilled" vs "Approved")
**Observation:** Ticket status shows "Fulfilled" even if the context implies it might still be in progress or simply "Approved".

### **Root Cause: `approveTicket` Logic**
In `ticketController.js` (lines ~5384), when the **last approval step** is completed, the system **forcefully updates** the ticket status:

```javascript
// If no more approval steps
await conn.query(`
    UPDATE t_ticket
    SET status_id = 3, -- 3 usually maps to "Fulfilled" or "Closed"
        workflow_step = NULL
    WHERE ticket_id = ?
`, [ticket_id]);
```

### **The Logic Gap**
This logic assumes **Approval Completion = Ticket Completion**.
It **does not check** if there are active assignments (`t_ticket_assignment`) linked to the ticket.
*   **Scenario:** A ticket is approved by a Manager, then assigned to IT Support for work.
*   **Result:** The moment the Manager approves, status becomes "Fulfilled" (Closed), even though IT Support hasn't started working on the assignment yet.

### **Solution Recommendation**
Modify the final approval step logic:
1.  Check if there are any active assignments (`t_ticket_assignment`) linked to the ticket.
2.  If assignments exist: Set status to `2` ("In Progress") instead of `3`.
3.  Only set to `3` ("Fulfilled") when the **assignment** is marked complete.
