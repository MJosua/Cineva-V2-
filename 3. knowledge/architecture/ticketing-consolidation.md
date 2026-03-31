# Ticketing Persistence Consolidation

## Overview
To prevent data inconsistency and ensure reliable attachment handling, the ticketing logic has been consolidated into `engineTicket.js`. 

## Core Patterns
- **Single Source of Truth**: All ticket creation, modification, and attachment processes MUST route through `engineTicket.js`.
- **Legacy Compatibility**: Old routes are refactored to call the core engine functions instead of implementing ad-hoc database writes.
- **Attachment Integrity**: By centralizing the persistence logic, we avoid common issues like `[object Object]` errors in the database when saving file metadata.

## Implementation Details
- **File**: `controller/engine/engineTicket.js`
- **Hook**: Logic is injected before `generateCustomTicketID` to ensure data integrity regardless of the entry point (Generic vs. Modular).
- **EAV Adherence**: All custom fields must follow the EAV structure using `cstm_col` and `lbl_col` in `t_ticket_detail`.
