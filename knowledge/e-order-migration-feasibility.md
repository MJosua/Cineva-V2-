# E-Order Migration to HOTS Engine Feasibility Study

> **Date**: 2024-12-14  
> **Topic**: Migrating Hardcoded E-Order Features to Dynamic HOTS Engine  
> **Status**: Feasible with Custom Widgets

---

## 1. Architecture Comparison

| Feature | E-Order (Existing) | HOTS Engine (Target) |
| :--- | :--- | :--- |
| **Logic** | **Hardcoded** in `GoodsRequest.tsx` | **Dynamic** via Database & JSON Configuration |
| **UI** | Custom React Components (Table, Forms) | Generic `DynamicForm` & `TicketDetail` |
| **Flow** | Fixed linear flow | Configurable Workflows (Approval, Triggers) |
| **Data** | Local State (`items` array) | backend Tables (`t_ticket`, `t_ticket_detail`) |
| **External API** | Hardcoded `fetch()` calls | **Custom Functions** & **Widgets** |

---

## 2. Feasibility Analysis

It is **100% possible** to migrate E-Order into HOTS. The HOTS engine is designed to be extensible. We do not need to rewrite the core engine; we simply plug in new **Widgets** and **Custom Functions**.

### A. Online Ordering (The "Shopping Cart" Problem)
**Challenge**: HOTS forms typically collect one value per field (e.g., one text box, one date). E-Order requires a *list* of items (Code, Qty, Price, Total) which changes dynamically.

**Solution: Custom "Order List" Widget**
Instead of hardcoding a page, we create a **Widget** (e.g., `OrderItemsWidget`) that:
1.  Renders the "Add Item" form and "Items Table" inside the HOTS Service Form.
2.  Manages the list of items internally.
3.  Saves the final list as a JSON string into a single field (e.g., `order_details`) in the database.
4.  Calculates totals and passes them to other fields if needed.

**Implementation**:
-   Create `frontend/src/components/widgets/OrderItemsWidget.tsx`
-   Register in `widgetRegistry.ts`
-   Add to Service Form as a fancy UI component.

### B. Transaction Tracking
**Challenge**: E-Order has a specific dashboard for orders.

**Solution: HOTS Dashboard + Widgets**
1.  **Dashboard**: Use the existing `DashboardPage`.
2.  **Widgets**: Create `ActiveOrdersWidget` to display a list of tickets with "Order" status.
3.  **Filter**: Use HOTS native filtering (Service ID = E-Order) to show only relevant tickets.

### C. SEARATES API (Container Tracking)
**Challenge**: Integrating external API data (Container status, Location) into the workflow.

**Solution: Custom Function + Tracking Widget**
1.  **Backend (Custom Function)**:
    -   Create a Node.js Custom Function in HOTS Admin.
    -   Logic: Input `Container No` -> Call SEARATES API -> Return JSON data.
    -   Trigger: Run automatically on "Submit" or "Button Click".
2.  **Frontend (Tracking Widget)**:
    -   Create `ContainerTrackingWidget` for `TicketDetail` page.
    -   It reads the API response (stored in a ticket field) and renders a visual timeline or map.
    -   This keeps the UI clean and dynamic.

---

## 3. Implementation Plan

### Phase 1: The Ordering Widget (Frontend)
1.  **Extract Logic**: Copy the "Table" and "Add Item" logic from `GoodsRequest.tsx`.
2.  **Wrap as Widget**: Wrap it in the HOTS Widget interface (`WidgetProps`).
3.  **Data Handling**: Ensure it outputs a JSON string (e.g., `[{"item":"A", "qty":1}]`) so HOTS can save it.

### Phase 2: The API Integration (Backend)
1.  **API Key**: Securely store SEARATES API key in `.env`.
2.  **Custom Function**: Write a "Script" in HOTS Custom Function menu:
    ```javascript
    // Pseudo-code for Custom Function
    const containerNo = ticket.fields.container_number;
    const response = await axios.get(`searates.com/api?container=${containerNo}`);
    return {
      update_fields: {
        tracking_status: response.data.status,
        tracking_json: JSON.stringify(response.data)
      }
    };
    ```

### Phase 3: The Visualization (Frontend)
1.  **Tracking Widget**: Create a component that parses `tracking_json` and draws the shipment progress.
2.  **Embed**: Add this widget to the "Ticket Detail" view for E-Order services.

---

## 4. Conclusion

**Yes**, you can unify both systems.
-   **Old Way**: Maintain two separate codebases (E-Order hardcoded + HOTS).
-   **New Way**: E-Order becomes just another **Service** inside HOTS, powered by 2-3 custom widgets.

**Benefits**:
-   Unified Approval Workflow (HOTS already has this).
-   Unified Database (all transactions in `t_tickets`).
-   Easier Maintenance (only one frontend to update).
