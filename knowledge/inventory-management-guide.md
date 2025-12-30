# Inventory Management System Guide

**Created:** 2025-12-30
**Status:** Frontend Structure Complete (Mock Data)

---

## Overview

Three separate inventory dashboards for different business units:
- **IT Equipment** - Laptops, monitors, peripherals for IT requests
- **POSM Products** - Marketing materials for distributor promotions  
- **Warehouse Stock** - Finished goods, raw materials, packaging

---

## Current Structure

```
fontend/HOTS/src/
├── data/
│   └── inventoryMockData.ts       # Types + Mock data for all 3 categories
├── components/inventory/
│   ├── index.ts                   # Component exports
│   ├── InventorySummaryCards.tsx  # Top stat cards
│   ├── InventoryTable.tsx         # Main data table with search/filters
│   └── QuickActionsPanel.tsx      # Action buttons panel
└── pages/inventory/
    ├── index.ts                   # Page exports
    ├── ITInventoryPage.tsx        # /inventory/it
    ├── POSMInventoryPage.tsx      # /inventory/posm
    └── WarehouseInventoryPage.tsx # /inventory/warehouse
```

---

## Operations (All Categories)

| Operation | Button | Description |
|-----------|--------|-------------|
| **Receive** | ⬇️ Receive Stock | Add goods to inventory |
| **Issue** | ⬆️ Issue Stock | Remove goods (linked to ticket/request) |
| **Transfer** | ↔️ Transfer | Move between locations |
| **Adjustment** | ± Adjustment | Correct quantity with reason |
| **Count** | 📋 Stock Count | Physical count reconciliation |

---

## Data Types

```typescript
interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  status: 'in_stock' | 'low' | 'critical' | 'out_of_stock';
  location: string;
  lastUpdated: string;
  unit: string;
}

interface InventorySummary {
  totalItems: number;
  lowStockAlerts: number;
  pendingTransfers: number;
  totalValue?: number;
}
```

---

## Next Steps

### Phase 2: Operation Modals
- [ ] ReceiveStockModal.tsx
- [ ] IssueStockModal.tsx
- [ ] TransferStockModal.tsx
- [ ] AdjustmentModal.tsx
- [ ] StockCountModal.tsx

### Phase 3: Routes Integration
- [ ] Add routes to App.tsx or router config
- [ ] Add sidebar menu items for inventory sections

### Phase 4: Backend API
- [ ] Create database tables
- [ ] Create inventory controller
- [ ] Replace mock data with API calls

---

## CSS Theme

Uses existing Tailwind + CSS variables:
- Dark glassmorphism: `bg-card/30 backdrop-blur-sm`
- Status colors: green (in stock), orange (low), red (critical)
- Accent colors per category: blue (IT), orange (POSM), emerald (Warehouse)
