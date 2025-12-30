# Transaction Engine Guide

**Created:** 2025-12-30
**Status:** Phase 1 Complete

---

## Overview

The Transaction Engine is a unified facade that wraps existing HOTS engines:
- **Workflow Engine** - Approvals, state transitions
- **Trigger Engine** - Events, notifications, actions
- **Document Engine** - PDF/Doc generation

It provides a clean API for all transaction types (Ticketing, POS, Inventory).

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              TransactionManager                 │
│  - begin(type, context)                         │
│  - registerType(name, handler)                  │
└─────────────────────┬───────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Workflow       Trigger      Document
   Engine         Engine       Engine
```

---

## Usage

### Basic Transaction Flow

```javascript
const txEngine = require('./core/transaction');

// Begin a transaction
const tx = await txEngine.begin('ticketing', {
  user_id: 123,
  service_id: 7,
  form_data: { title: 'IT Support Request' }
});

// Commit it
const result = await tx.commit();

// Or check state
console.log(tx.getState());
```

### Registering Custom Types

```javascript
const txEngine = require('./core/transaction');

txEngine.registerType('pos', {
  name: 'pos',
  
  async validate(context, manager) {
    // Validate POS transaction
    if (!context.cart_items) throw new Error('Cart required');
    return true;
  },
  
  async execute(context, manager) {
    // Execute POS sale
    return { order_id: 'ORD-123', total: 99.99 };
  },
  
  async afterCommit(context, result, manager) {
    // Send receipt, update inventory
  },
  
  async rollback(context, result, manager) {
    // Reverse the transaction
  }
});
```

---

## File Structure

```
core/transaction/
├── index.js                  # Public API
├── transaction-manager.js    # Core facade
└── types/
    └── ticketing.js          # Ticketing type handler
```

---

## Transaction States

| State | Description |
|-------|-------------|
| `pending` | Just created, not validated |
| `validated` | Passed validation |
| `committed` | Successfully executed |
| `rolled_back` | Failed and cleaned up |
| `invalid` | Failed validation |

---

## Integration with init-engines.js

The transaction engine is automatically initialized with all other engines:

```javascript
const { initAll, transactionEngine } = require('./core/init-engines');

await initAll();
// transactionEngine is now ready
```

---

## Built-in Types

| Type | File | Status |
|------|------|--------|
| `ticketing` | `types/ticketing.js` | ✅ Registered |
| `pos` | (future) | ⬜ Planned |
| `inventory` | (future) | ⬜ Planned |

---

## Next Steps

1. **Phase 2:** Connect ticketing type to actual `engineTicket.js` logic
2. **Phase 3:** Create POS and Inventory types
3. **Phase 4:** Migrate controllers to use transaction engine
