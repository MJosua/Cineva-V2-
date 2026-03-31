# HOTS Widget System Architecture

The Widget System is designed to provide modular, reusable components that can be injected into Service Forms and Ticket Detail pages without changing the core engine code.

## 1. Widget Registry
All available widgets must be registered in [widgetRegistry.ts](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/1,%20fontend/HOTS/src/registry/widgetRegistry.ts). 

Each widget definition includes:
- **`id`**: Unique identifier (referenced in `m_service.widget`).
- **`name` / `description`**: Metadata for the admin UI.
- **`componentPath`**: The filename in `src/widgets/` (without extension).
- **`applicableTo`**: Where it can be used (`form`, `ticket_detail`, `assignment_detail`).
- **`dataRequirements`**: Keys for data it needs to function.
- **`serviceIds`**: (Optional) Restrict widget to specific services.

## 2. Rendering Engine
The [WidgetRenderer.tsx](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/1,%20fontend/HOTS/src/widgets/WidgetRenderer.tsx) is responsible for:
1. Dynamically importing the component from `@/widgets/`.
2. Error handling (boundaries) to prevent a single widget from crashing the whole page.
3. Passing a standardized `data` prop:
   ```typescript
   interface WidgetData {
     formData?: any;      // Current form state (for 'form' context)
     ticketData?: any;    // Full ticket data (for 'detail' context)
     userData?: User;     // Current logged-in user
     serviceId?: string;  // ID of the active service
   }
   ```

## 3. Implementation in Forms
In [DynamicForm.tsx](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/1,%20fontend/HOTS/src/components/forms/DynamicForm.tsx), widgets are rendered before the main form card:

```tsx
{assignedWidgets.map((w) => (
  <WidgetRenderer
    key={w.id}
    config={w}
    data={{
      formData: globalValues,
      userData: user,
      serviceId
    }}
  />
))}
```

## 4. Reusability Example
The `StockOverview` widget can be used in any service related to physical goods. It uses the `formData` to detect which items are being requested and fetches real-time stock levels from the `t_inventory` system.
