# User Manual Updates - Jan 2026

## 1. Actionable Notification System
**New Feature**
- **Location:** Top navigation bar (Bell Icon).
- **Functionality:**
  - Users now receive persistent "to-do" style notifications for approvals, assignments, and ticket updates.
  - **Unread** notifications are highlighted.
  - Clicking a notification marks it as read and redirects directly to the relevant ticket or item.
  - Notifications are automatically cleaned up: Read (30 days), Unread (90 days).

## 2. Team Management
**Moved & Enhanced**
- **Old Location:** User Management -> "Teams" tab.
- **New Location:** Admin Menu -> **Team Management** (`/hots/admin/teams`).
- **Functionality:**
  - Dedicated page for creating and managing teams.
  - Add/Remove members directly from the team view.
  - simplified interface for Team Leaders.

## 3. SRF Document Generation
**New Feature**
- **Location:** Assignment Detail Page (for SRF tickets).
- **Functionality:**
  - **"Generate Document"** button creates a PDF version of the SRF.
  - **"Preview"** allows viewing the HTML template before generation.
  - Documents are stored and listed with auto-refresh status updates.

## 4. Priority System
**New Feature**
- **Visiblity:** Ticket Lists (My Tickets, Waiting for Approval).
- **Functionality:**
  - Tickets now display a **Priority Badge** (Low, Medium, High).
  - Priority is automatically calculated based on ticket age:
    - **Low**: < 3 days
    - **Medium**: 3-7 days
    - **High**: > 7 days
