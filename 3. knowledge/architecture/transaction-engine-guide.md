# Transaction Engine Guide

**Created:** 2025-12-30
**Status:** Phase 2 Complete

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

### Ticketing Transaction (Full Implementation)

```javascript
const { transactionEngine } = require('./core/init-engines');

const tx = await transactionEngine.begin('ticketing', {
  user_id: 123,
  service_id: 7,
  form_data: { title: 'IT Support Request', description: '...' },
  company_id: 100,
  creator_email: 'user@example.com'
});

const result = await tx.commit();
// result: { ok: true, ticket_id: '2507012300001', workflow_steps: 2 }
```

### POS Transaction (Template)

```javascript
const tx = await transactionEngine.begin('pos', {
  user_id: 456,
  cart_items: [
    { product_id: 'SKU001', quantity: 2, price: 99.99 },
    { product_id: 'SKU002', quantity: 1, price: 149.99 }
  ],
  payment_method: 'card'
});

const result = await tx.commit();
```

### Inventory Transaction (Template)

```javascript
const tx = await transactionEngine.begin('inventory', {
  user_id: 789,
  operation: 'receive', // receive, issue, transfer, adjust, count
  warehouse_id: 'WH001',
  items: [
    { product_id: 'SKU001', quantity: 100 }
  ]
});

const result = await tx.commit();
```

---

## File Structure

```
core/transaction/
├── index.js                  # Public API
├── transaction-manager.js    # Core facade (195 lines)
└── types/
    ├── ticketing.js          # ✅ Full implementation (240 lines)
    ├── pos.js                # 📝 Template (100 lines)
    └── inventory.js          # 📝 Template (115 lines)
```

---

## Registered Types

| Type | File | Status | Operations |
|------|------|--------|------------|
| `ticketing` | `types/ticketing.js` | ✅ Complete | create, workflow, triggers |
| `pos` | `types/pos.js` | 📝 Template | sale, payment, receipt |
| `inventory` | `types/inventory.js` | 📝 Template | receive, issue, transfer, adjust, count |

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

## Integration

The transaction engine is automatically initialized with all other engines:

```javascript
const { initAll, transactionEngine } = require('./core/init-engines');

await initAll();
// transactionEngine is now ready with types: ticketing, pos, inventory
```

---

## Adding New Types

```javascript
const txEngine = require('./core/transaction');

txEngine.registerType('custom', {
  name: 'custom',
  async validate(context, manager) { /* ... */ },
  async execute(context, manager) { /* ... */ },
  async afterCommit(context, result, manager) { /* ... */ },
  async rollback(context, result, manager) { /* ... */ }
});
```
