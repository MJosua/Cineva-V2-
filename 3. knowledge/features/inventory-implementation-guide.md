# Inventory Management Implementation Guide

> **Date**: 2024-12-14  
> **Topic**: Implementing a new Inventory System (CMS vs Hardcoded)  
> **Status**: Needs full stack implementation (DB + Backend + Frontend)

---

## 1. The Core Requirement (Backend)
Regardless of the frontend choice (CMS or Hardcoded), you need a **Backend Foundation**. Currently, `StockOverview.tsx` uses fake data.

### Step A: Database Schema
You need 2 new tables in MySQL:
1.  **`m_items`**: The master list of items.
    -   `id`, `item_code`, `name`, `category`, `unit`, `min_stock_level`
2.  **`t_stock_transactions`**: The history of movement.
    -   `id`, `item_id`, `type` (IN/OUT), `qty`, `ref_ticket_id` (optional), `created_at`

### Step B: Backend Controller
Create `controller/inventoryController.js`:
-   `getItems()`: Returns list + calculated current stock.
-   `adjustStock()`: Inserts into `t_stock_transactions`.

---

## 2. Frontend Implementation Options

### Option A: Hardcoded Page (Traditional)
**Best for**: Complex, high-density dashboard used by Warehouse Staff only.

-   **File**: `frontend/src/pages/admin/InventoryMaster.tsx`
-   **Work**:
    -   Manually build a `<Table>` component.
    -   Manually build "Add Item" and "Adjust Stock" dialogs.
    -   Add route to `App.tsx`.
-   **Pros**: precise control over every pixel.
-   **Cons**: Rigid. Changing layout requires re-deploying code.

### Option B: CMS + Widgets (Modern/Flexible)
**Best for**: Dashboards that need to evolve or be embedded with instructions.

-   **Files**:
    -   `widgets/InventoryListWidget.tsx`: The table view.
    -   `widgets/StockActionWidget.tsx`: The "Add Stock" button/form.
-   **Work**:
    -   Create these 2 widgets.
    -   Go to CMS -> Create Page "Office Inventory".
    -   Drag "InventoryListWidget" into the page.
-   **Pros**:
    -   **Reusability**: You can put the "Stock Action" widget on the "IT Helpdesk" page AND the "Warehouse" page.
    -   **Context**: You can add text blocks above the table explaining "How to request stock".

---

## 3. Recommendation

**Go with Option B (CMS + Widgets).**

Why?
1.  **Reusability**: Your "E-Order" system (from previous discussion) will need to *see* stock levels. If you build `InventoryListWidget`, you can reuse it inside the E-Order form!
2.  **Future Proof**: When you add "Asset Management" later, you just make another widget and add it to the same CMS page.

### Checklist to Implement:
1.  [ ] Run SQL to create `m_items` & `t_stock_transactions`.
2.  [ ] Create `inventoryController.js` (GET/POST endpoints).
3.  [ ] Create `InventoryTableWidget` (fetches from API, renders Shadcn Table).
4.  [ ] Register widget in `widgetRegistry.ts`.
5.  [ ] Create CMS Page and verify.
