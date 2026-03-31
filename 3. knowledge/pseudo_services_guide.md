# Pseudo Services Guide (Hiding while Functional)

This guide explains the "Seamless Hiding" pattern used in HOTS to keep services active for background/dashboard logic while removing them from the public Service Catalog.

## 💡 Concept

Some services (like **IT Project** or **Shipment Tracking**) act as "engines" or "pseudo services." They are triggered by other workflows or accessed via specialized dashboards rather than by a general user clicking a "Request Service" card.

## 🛠️ Implementation Strategy

### 1. Database Status (`active = 2`)
The `m_service.active` column is used for visibility control:
- **`active = 1`**: Public Service (Visible in Catalog).
- **`active = 2`**: Pseudo/System Service (Hidden from Catalog, but Fully Functional).
- **`active = 0`**: Disabled (Completely off).

### 2. Frontend Filtering
In `ServiceCatalog.tsx`, services are filtered to show only those with `active === 1`:
```typescript
const categoryServices = serviceCatalog.filter(service =>
  service.category_id === category.category_id &&
  service.active === 1 &&
  searchInObject(service, searchValue)
);
```

### 3. Backend Compliance
The following core engines are designed to permit `active = 2`:
- **Ticket Engine (`engineTicket.js`)**: Creates tickets without checking `active === 1`.
- **Project Dashboard (`engineProjectDashboard.js`)**: Lists services including those marked with `active = 2`.
- **Service Catalog Controller**: Can fetch all statuses for admin purposes.

## 📉 Summary of Pseudo Services
| Service ID | Service Name | Purpose | Current Status |
| :--- | :--- | :--- | :--- |
| 23 | IT Project | IT Project Management | `active = 2` |
| 24 | Shipment Tracking | Freight/Container Monitor | `active = 2` |

## 🚀 How to Hide a Service
To hide a service but keep it functional:
```sql
UPDATE m_service SET active = 2 WHERE service_id = [YOUR_ID];
```
