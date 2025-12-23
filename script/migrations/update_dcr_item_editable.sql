-- SQL Script to Update Data Change Request Service (service_id = 20)
-- This updates the detail_table widget to make product_name editable with dropdown
-- SKU selection now automatically updates linked product_name and product_sku columns

-- First, let's view the current form_json structure
-- SELECT service_id, service_name, JSON_PRETTY(form_json) as form_config
-- FROM hots.m_service 
-- WHERE service_id = 20;

-- Update the detail_table widget columns to make product selection editable
-- The sku_id column uses linkedFields to automatically update product_name and product_sku

UPDATE hots.m_service 
SET form_json = JSON_SET(
    form_json,
    '$.items[4].data.config.columns',
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'sku_id',
            'label', 'Product',
            'editable', true,
            'type', 'suggestion-insert',
            'api', '/hots_settings/get_all_products',
            'displayKey', 'product_name',
            'valueKey', 'product_code',
            'searchable', true,
            'linkedFields', JSON_ARRAY(
                JSON_OBJECT('targetKey', 'product_name', 'sourceKey', 'product_name'),
                JSON_OBJECT('targetKey', 'product_sku', 'sourceKey', 'product_sku')
            )
        ),
        JSON_OBJECT('key', 'product_sku', 'label', 'SKU Code', 'editable', false),
        JSON_OBJECT('key', 'product_name', 'label', 'Product Name', 'editable', false),
        JSON_OBJECT('key', 'quantity', 'label', 'Qty', 'editable', true, 'type', 'number', 'rounding', 0),
        JSON_OBJECT('key', 'value', 'label', 'Price', 'editable', true, 'type', 'number'),
        JSON_OBJECT('key', 'disc', 'label', 'Discount', 'editable', true, 'type', 'number'),
        JSON_OBJECT('key', 'freight_surcharge', 'label', 'Freight', 'editable', true, 'type', 'number')
    )
)
WHERE service_id = 20;

-- Verify the update
SELECT service_id, service_name, 
       JSON_PRETTY(JSON_EXTRACT(form_json, '$.items[4].data.config.columns')) as detail_columns
FROM hots.m_service 
WHERE service_id = 20;

