-- SQL Script to Update Data Change Request Service (service_id = 20)
-- This updates the form_json with new distributor field, PO lookup, and detail_table widget

UPDATE hots.m_service 
SET form_json = JSON_SET(
    form_json,
    '$',
    JSON_OBJECT(
        'id', 'data-change-request',
        'title', 'Data Change Request',
        'category', 'Supply Chain & Logistics',
        'description', 'Request updates, corrections, or additions to master data records',
        'apiEndpoint', '/api/data-change-request',
        'items', JSON_ARRAY(
            -- Section 1: Request Information
            JSON_OBJECT(
                'id', 'section-requester',
                'type', 'section',
                'order', 0,
                'data', JSON_OBJECT(
                    'title', '📝 Request Information',
                    'fields', JSON_ARRAY(
                        JSON_OBJECT('label', 'Requested By', 'name', 'requested_by', 'type', 'text', 'required', true, 'columnSpan', 1, 'default', '${user}', 'readonly', true),
                        JSON_OBJECT('label', 'Department', 'name', 'department', 'type', 'text', 'required', true, 'columnSpan', 1, 'default', '${user_department}', 'readonly', true),
                        JSON_OBJECT('label', 'Request Date', 'name', 'request_date', 'type', 'date', 'required', true, 'columnSpan', 1, 'default', '${today}', 'readonly', true)
                    ),
                    'repeatable', false,
                    'defaultOpen', true
                )
            ),
            -- Section 2: Change Details with Distributor and PO fields
            JSON_OBJECT(
                'id', 'section-change-type',
                'type', 'section',
                'order', 1,
                'data', JSON_OBJECT(
                    'title', '🎯 Change Details',
                    'fields', JSON_ARRAY(
                        JSON_OBJECT(
                            'label', 'Distributor',
                            'name', 'distributor',
                            'type', 'suggestion-insert',
                            'required', true,
                            'columnSpan', 2,
                            'options', JSON_ARRAY('${linkeddistributors}'),
                            'dependerOf', JSON_ARRAY('po_number'),
                            'placeholder', 'Select distributor'
                        ),
                        JSON_OBJECT(
                            'label', 'PO Number',
                            'name', 'po_number',
                            'type', 'suggestion-insert',
                            'required', true,
                            'columnSpan', 1,
                            'options', JSON_ARRAY(),
                            'rules', JSON_ARRAY(
                                JSON_OBJECT(
                                    'dependsBy', 'distributor',
                                    'when', JSON_OBJECT('operator', 'not_empty'),
                                    'then', JSON_OBJECT(
                                        'api', '/hots_settings/get_srf_po/${dependsByValue}',
                                        'storeAs', 'ponumber',
                                        'dependsByValue', 'filter'
                                    ),
                                    'trigger', 'blur'
                                ),
                                JSON_OBJECT(
                                    'dependsBy', 'distributor',
                                    'when', JSON_OBJECT('operator', 'changed'),
                                    'then', JSON_OBJECT('clearSelf', true),
                                    'trigger', 'blur'
                                )
                            ),
                            'placeholder', 'Select PO Number'
                        ),
                        JSON_OBJECT(
                            'label', 'Priority',
                            'name', 'priority',
                            'type', 'select',
                            'required', true,
                            'columnSpan', 1,
                            'options', JSON_ARRAY('Low', 'Medium', 'High', 'Urgent')
                        ),
                        JSON_OBJECT(
                            'label', 'Change Type',
                            'name', 'change_type',
                            'type', 'select',
                            'required', true,
                            'columnSpan', 2,
                            'options', JSON_ARRAY('Update Existing Record', 'Add New Record', 'Delete / Deactivate Record'),
                            'placeholder', 'Select change type'
                        )
                    ),
                    'repeatable', false,
                    'defaultOpen', true
                )
            ),
            -- Widget: SO Header Diff Table
            JSON_OBJECT(
                'id', 'widget-header-diff',
                'type', 'specialfunc',
                'order', 2,
                'data', JSON_OBJECT(
                    'title', '📋 SO Header Data (Old → New)',
                    'element_type', 'diff_table',
                    'config', JSON_OBJECT(
                        'api_source', '/hots_settings/get_data_diff',
                        'trigger_field', 'po_number',
                        'auto_lock_old', true
                    )
                )
            ),
            -- Widget: SO Detail Table
            JSON_OBJECT(
                'id', 'widget-detail-table',
                'type', 'specialfunc',
                'order', 3,
                'data', JSON_OBJECT(
                    'title', '📦 Line Items (Editable)',
                    'element_type', 'detail_table',
                    'config', JSON_OBJECT(
                        'api_source', '/hots_settings/get_so_details',
                        'trigger_field', 'so_id',
                        'columns', JSON_ARRAY(
                            JSON_OBJECT('key', 'product_sku', 'label', 'SKU', 'editable', false),
                            JSON_OBJECT('key', 'product_name', 'label', 'Product', 'editable', false),
                            JSON_OBJECT('key', 'quantity', 'label', 'Qty', 'editable', true, 'type', 'number', 'rounding', 0),
                            JSON_OBJECT('key', 'value', 'label', 'Price', 'editable', true, 'type', 'number'),
                            JSON_OBJECT('key', 'disc', 'label', 'Discount', 'editable', true, 'type', 'number'),
                            JSON_OBJECT('key', 'freight_surcharge', 'label', 'Freight', 'editable', true, 'type', 'number')
                        )
                    )
                )
            ),
            -- Section: Justification
            JSON_OBJECT(
                'id', 'section-justification',
                'type', 'section',
                'order', 4,
                'data', JSON_OBJECT(
                    'title', '📎 Justification & Evidence',
                    'fields', JSON_ARRAY(
                        JSON_OBJECT('label', 'Reason for Change', 'name', 'reason', 'type', 'textarea', 'required', true, 'columnSpan', 3, 'placeholder', 'Explain why this change is needed'),
                        JSON_OBJECT('label', 'Supporting Documents', 'name', 'attachments', 'type', 'file', 'required', false, 'columnSpan', 3)
                    ),
                    'repeatable', false,
                    'defaultOpen', true
                )
            )
        ),
        'servis_aktif', 1,
        'active', 1
    )
)
WHERE service_id = 20;

-- Verify the update
SELECT service_id, service_name, 
       JSON_PRETTY(form_json) as form_config
FROM hots.m_service 
WHERE service_id = 20;
