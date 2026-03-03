# Dashboard Configuration Guide

This document explains how to configure dashboard menus and widgets in the HOTS system.

## Overview

The dashboard system uses two main tables to configure what appears:

| Table | Purpose |
|-------|---------|
| `m_dashboard_menu` | **Card** displayed in dashboard main page (navigation tiles) |
| `m_dashboard_widget` | **Widget content** inside the menu page (reusable components) |

## Configuration Pattern

### 1. `m_dashboard_menu` - Dashboard Cards

This table defines the **navigation card** shown on the main dashboard. Each entry creates a clickable tile that routes to a specific path.

**Key Fields:**
- `title`: Card title displayed to user
- `description`: Subtitle/description
- `icon`: Lucide icon name (e.g., 'CreditCard', 'FileText')
- `path`: Route path (e.g., '/card-generator')
- `type`: Usually 'widget'
- `department_scope`: JSON array of department IDs (e.g., `[1, 10]` for HR & IT)
- `category_id`: Links to `m_dashboard_category`

**Example:**
```sql
INSERT INTO m_dashboard_menu 
(title, description, icon, path, type, roles_allowed, department_scope, is_active, order_index, category_id)
VALUES 
('User Name Card', 'Generate official business card', 'CreditCard', '/card-generator', 'widget', '[]', '[1, 10]', 1, 1, @category_id);
```

---

### 2. `m_dashboard_widget` - Widget Content Inside Page

This table defines **what widget/component appears inside** the menu page. Without this entry, the page shows "No panels configured for this dashboard."

**Key Fields:**
- `dashboard_menu_id`: Links to `m_dashboard_menu.id`
- `panel_type`: Usually 'custom' for React components
- `title`: Panel header title
- `component_key`: **React component name** (e.g., 'CardNameGenerator')
- `order_index`: Display order (0 = first)
- `is_tab`: 1 = tabbed panel, 0 = standalone
- `config`: JSON configuration object

**Example:**
```sql
SET @menu_id = (SELECT id FROM m_dashboard_menu WHERE path = '/card-generator' LIMIT 1);

INSERT INTO m_dashboard_widget
(dashboard_menu_id, panel_type, title, component_key, order_index, is_tab, is_collapsible, default_collapsed, config, is_active)
VALUES
(@menu_id, 'custom', 'User Name Card Generator', 'CardNameGenerator', 0, 0, 0, 0, '{}', 1);
```

---

## Complete Setup Example

```sql
-- Step 1: Create category (if new)
INSERT INTO m_dashboard_category (name, description, order_index) 
VALUES ('HR Tools', 'Personal utilities for users', 99);

-- Step 2: Register the menu (card)
SET @category_id = (SELECT id FROM m_dashboard_category WHERE name = 'HR Tools' LIMIT 1);

INSERT INTO m_dashboard_menu 
(title, description, icon, path, type, roles_allowed, department_scope, is_active, order_index, category_id)
VALUES 
('User Name Card', 'Generate official business card', 'CreditCard', '/card-generator', 'widget', '[]', '[1, 10]', 1, 1, @category_id);

-- Step 3: Register the widget (content)
SET @menu_id = (SELECT id FROM m_dashboard_menu WHERE path = '/card-generator' LIMIT 1);

INSERT INTO m_dashboard_widget
(dashboard_menu_id, panel_type, title, component_key, order_index, is_tab, is_collapsible, default_collapsed, config, is_active)
VALUES
(@menu_id, 'custom', 'User Name Card Generator', 'CardNameGenerator', 0, 0, 0, 0, '{}', 1);
```

---

## Component Key Mapping

The `component_key` in `m_dashboard_widget` must:
1. Match a React component in `fontend/HOTS/src/pages/dashboard/report/`
2. Be registered in `CUSTOM_COMPONENT_REGISTRY` inside `PanelContent.tsx`

### File Location
```
fontend/HOTS/src/pages/dashboard/report/{ComponentName}.tsx
```

### Registry Location
[PanelContent.tsx](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/fontend/HOTS/src/pages/dashboard/PanelContent.tsx#L17)

```tsx
const CUSTOM_COMPONENT_REGISTRY = {
    'srf_report': React.lazy(() => import('./report/srf_report')),
    'EOrderReporting': React.lazy(() => import('./report/EOrderReporting')),
    'LaporanCuti': React.lazy(() => import('./report/LaporanCuti')),
    'CardNameGenerator': React.lazy(() => import('./report/CardNameGenerator')),
    // Add new components here
};
```

> **Important**: Without registry entry, the panel shows: `Component "X" not found. Add it to CUSTOM_COMPONENT_REGISTRY.`

### Current Registered Components

| component_key | File Path |
|---------------|----------|
| CardNameGenerator | `pages/dashboard/report/CardNameGenerator.tsx` |
| LaporanCuti | `pages/dashboard/report/LaporanCuti.tsx` |
| LaporanIzin | `pages/dashboard/report/LaporanIzin.tsx` |
| srf_report | `pages/dashboard/report/srf_report.tsx` |
| EOrderReporting | `pages/dashboard/report/EOrderReporting.tsx` |

---

## Database Migration (Completed)

The following table renames were applied:

| Old Name | New Name |
|----------|----------|
| `m_dashboard_function` | `m_dashboard_menu` |
| `m_dashboard_panel` | `m_dashboard_widget` |
| `dashboard_function_id` | `dashboard_menu_id` |

**SQL Migration Script:**
```sql
-- Rename tables
ALTER TABLE m_dashboard_function RENAME TO m_dashboard_menu;
ALTER TABLE m_dashboard_panel RENAME TO m_dashboard_widget;

-- Rename foreign key column
ALTER TABLE m_dashboard_widget CHANGE dashboard_function_id dashboard_menu_id INT;
```
