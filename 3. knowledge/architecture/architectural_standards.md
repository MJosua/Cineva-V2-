# Architectural Standards & Guidelines

## Strict Implementation Rules
Follow these rules without exception for all HOTS backend development:

### 1. Database Transactions
- **Rule**: All database writes (INSERT, UPDATE, DELETE) MUST use transactions with automatic rollback on failure.
- **Implementation**: Use the `TransactionManager` or `dbHots.promise().query` within a `try-catch` block that explicitly calls `rollback`.

### 2. Modular Engine Pattern
- **Rule**: New features should be implemented as modules compatible with the JSON-driven engine.
- **Components**: `form`, `workflow`, `triggers`, `document`.
- **Location**: Store module logic in `controller/engine/` and triggers in `script/`.

### 3. EAV Structure (Data Model)
- **Rule**: Follow the Entity-Attribute-Value pattern for ticket details.
- **Columns**: Use `cstm_col` for custom data and `lbl_col` for display labels.
- **Reference**: Query `t_ticket_detail` to retrieve or validate dynamic form data.

## Recent Patterns (Reference)

### Meeting Room Validation (Service 13)
- **Pattern**: Pre-Creation Hook in `engineTicket.js`.
- **Reasoning**: The frontend uses a generic ticket creation endpoint. By injecting validation logic into `engineTicket.js` before `generateCustomTicketID`, we ensure data integrity regardless of the entry point.
- **Validation Logic**: Cross-joins `t_ticket_detail` to reconstruct the record state (Date, Room, Time) and check for overlaps.

### Real-Time Update (SSE)
- **Pattern**: Global SSE Broadcast.
- **Trigger**: Emit `update_meeting_schedule` inside the `create` method of the ticket engine.
- **Listener**: Frontend (`MeetingRoomStandalone.tsx`) uses a singleton event listener to refresh Redux state.
