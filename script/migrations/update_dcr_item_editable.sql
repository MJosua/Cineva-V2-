-- SQL Script to Update Data Change Request Service (service_id = 20)
-- This updates the detail_table widget to make product_name editable with dropdown

-- First, let's view the current form_json structure
-- SELECT service_id, service_name, JSON_PRETTY(form_json) as form_config
-- FROM hots.m_service 
-- WHERE service_id = 20;

-- Update the detail_table widget columns to make product selection editable
-- The product_sku and product_name columns should now be selectable from all products

UPDATE hots.m_service 
SET form_json = JSON_SET(
    form_json,
    '$.items[3].data.config.columns',
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'sku_id',
            'label', 'SKU ID',
            'editable', true,
            'type', 'suggestion-insert',
            'api', '/hots_settings/get_all_products',
            'displayKey', 'product_sku',
            'valueKey', 'sku_id',
            'searchable', true
        ),
        JSON_OBJECT('key', 'product_sku', 'label', 'SKU Code', 'editable', false),
        JSON_OBJECT(
            'key', 'product_name',
            'label', 'Product Name',
            'editable', true,
            'type', 'suggestion-insert',
            'api', '/hots_settings/get_all_products',
            'displayKey', 'product_name',
            'valueKey', 'product_name',
            'searchable', true
        ),
        JSON_OBJECT('key', 'quantity', 'label', 'Qty', 'editable', true, 'type', 'number', 'rounding', 0),
        JSON_OBJECT('key', 'value', 'label', 'Price', 'editable', true, 'type', 'number'),
        JSON_OBJECT('key', 'disc', 'label', 'Discount', 'editable', true, 'type', 'number'),
        JSON_OBJECT('key', 'freight_surcharge', 'label', 'Freight', 'editable', true, 'type', 'number')
    )
)
WHERE service_id = 20;

-- Verify the update
SELECT service_id, service_name, 
       JSON_PRETTY(JSON_EXTRACT(form_json, '$.items[3].data.config.columns')) as detail_columns
FROM hots.m_service 
WHERE service_id = 20;
