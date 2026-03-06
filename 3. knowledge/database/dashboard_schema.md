# HOTS Dashboard Database Schema

The dashboard system in HOTS is driven by three main tables: `m_dashboard_category`, `m_dashboard_menu`, and `m_dashboard_widget`.

## Table: m_dashboard_category
Defines the grouping for dashboard items.

| Column | Type | Description |
| :--- | :--- | :--- |
| id | INT | Primary Key |
| name | VARCHAR | Category name (e.g., Reports, Project Management) |
| description | TEXT | Category description |
| order_index | INT | Display order |

## Table: m_dashboard_menu
Defines the main cards/items shown on the home dashboard.

| Column | Type | Description |
| :--- | :--- | :--- |
| id | INT | Primary Key |
| title | VARCHAR | Card title |
| description | TEXT | Card description |
| icon | VARCHAR | Lucide icon name |
| path | VARCHAR | Internal route path |
| widget | VARCHAR | (Mandatory) Frontend widget identifier |
| roles_allowed | JSON/TEXT | Allowed roles (e.g., ["all"]) |
| department_scope | JSON/TEXT | Allowed departments |
| is_active | TINYINT | Activation status |
| order_index | INT | Display order |
| created_by | INT | |
| updated_by | INT | |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| category_id | INT | Foreign key to m_dashboard_category |
| related_service_id | INT | Link to m_service |
| card_config | JSON/TEXT | Data fetching logic for the card |

## Table: m_dashboard_widget
Defines the specific components (panels) shown within a dashboard view.

| Column | Type | Description |
| :--- | :--- | :--- |
| id | INT | Primary Key |
| dashboard_menu_id | INT | Link to m_dashboard_menu |
| panel_type | VARCHAR | Type of panel (e.g., 'custom', 'analytics_cards') |
| title | VARCHAR | Panel title |
| component_key | VARCHAR | The frontend component name (e.g., 'gantt_room_schedule') |
| order_index | INT | |
| is_tab | TINYINT | |
| is_collapsible | TINYINT | |
| default_collapsed | TINYINT | |
| config | JSON | Panel-specific configuration |
| is_active | TINYINT | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

> [!NOTE]
> `m_dashboard_widget` appears to have a similar structure to `m_dashboard_menu`, likely for recursive or tiered dashboard structures.
