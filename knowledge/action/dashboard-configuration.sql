-- ================================================
-- Dashboard Configuration SQL
-- Run these to link dashboards to real data sources
-- ================================================

-- 1. SET card_config FOR EACH DASHBOARD FUNCTION
-- This tells the frontend how to fetch data for each card

-- SRF Report (ID 10) → Ticket-based, service_id = 6
UPDATE m_dashboard_function 
SET card_config = '{"type": "ticket", "serviceId": 6}' 
WHERE id = 10;

-- E-Order Report (ID 2) → E-Order database
UPDATE m_dashboard_function 
SET card_config = '{"type": "eorder"}' 
WHERE id = 2;

-- Static cards (Help, Settings, etc.) - show description only
UPDATE m_dashboard_function 
SET card_config = '{"type": "static"}' 
WHERE id IN (5, 6, 7, 8, 9); -- System Tools, Public, Admin, HR, Guest

-- Other ticket-based cards (set serviceId as needed)
-- UPDATE m_dashboard_function SET card_config = '{"type": "ticket", "serviceId": X}' WHERE id = Y;

-- ================================================
-- 2. ADD E-ORDER PANEL (since it has none)
-- ================================================
INSERT INTO hots.m_dashboard_panel
(dashboard_function_id, panel_type, title, component_key, order_index, is_tab, is_collapsible, default_collapsed, config, is_active, created_at, updated_at)
VALUES(2, 'custom', 'E-Order Report', 'EOrderReporting', 0, 0, 0, 0, '{}', 1, NOW(), NOW());

-- ================================================
-- 3. DISABLE ANALYTICS OVERVIEW (if you want to turn it off)
-- ================================================
-- For SRF Report:
-- UPDATE m_dashboard_panel SET is_active = 0 WHERE dashboard_function_id = 10 AND panel_type = 'analytics_cards';

-- ================================================
-- 4. VIEW CURRENT CONFIG
-- ================================================
-- See all dashboard functions with card_config:
SELECT id, title, path, card_config FROM m_dashboard_function;

-- See all panels for a specific dashboard:
-- SELECT * FROM m_dashboard_panel WHERE dashboard_function_id = 10;
