-- SRF 4-Step Workflow Migration
-- Run this SQL on hots database

-- =============================================================================
-- 1. UPDATE m_service_workflow - Add Superior as Step 1
-- =============================================================================

UPDATE m_service_workflow
SET definition = '{
  "steps": [
    {
      "level": 1,
      "step_type": "user_dynamic",
      "resolver": "superior",
      "meta": {"name": "Superior", "description": "Creator direct superior approval"}
    },
    {
      "level": 2,
      "step_type": "team",
      "assigned_value": 13,
      "meta": {"name": "Logistic Analyst", "description": "Review by Logistic Reviewer"}
    },
    {
      "level": 3,
      "step_type": "team",
      "assigned_value": 14,
      "meta": {"name": "Logistic Manager", "description": "Approval by Logistic Manager"}
    },
    {
      "level": 4,
      "step_type": "team",
      "assigned_value": 15,
      "meta": {"name": "Accounting Manager", "description": "Final approval by Accounting"}
    }
  ],
  "version": "2.0",
  "updated_at": "2025-12-05"
}',
updated_at = NOW()
WHERE workflow_id = 6;

-- =============================================================================
-- 2. DELETE OLD TRIGGERS FIRST (if any)
-- =============================================================================
DELETE FROM m_service_triggers WHERE service_id = 6 AND trigger_name IN (
  'srf_step1_doc', 'srf_step2_doc', 'srf_step3_doc', 'srf_step4_doc', 
  'srf_complete_assignment', 'on_approve', 'on_complete', 'workflow_complete',
  'on_submit', 'on_create'
);

-- =============================================================================
-- 3. CREATE TRIGGERS
-- =============================================================================

-- On Submit Trigger - Generate initial document when ticket is created/submitted
INSERT INTO m_service_triggers (
    service_id, trigger_name, trigger_type, trigger_config, active, created_at
) VALUES (
    6, 
    'on_submit',   -- Fires when ticket is submitted
    'workflow_submit',
    '{
      "actions": [
        {
          "action": "execute_function",
          "params": {"function": "srf_document_generator", "args": {"ticketId": ":ticketId"}}
        }
      ]
    }',
    1, 
    NOW()
);

-- On Approve Trigger - handles ALL approval steps
-- Step 1: Always generate (Superior)
-- Step 2: Only with notes (Logistic Analyst)
-- Step 3: Always generate (Logistic Manager)
-- Step 4: Always generate (Accounting Manager)
INSERT INTO m_service_triggers (
    service_id, trigger_name, trigger_type, trigger_config, active, created_at
) VALUES (
    6, 
    'on_approve',   -- This must match the eventName passed to runTriggersForEvent
    'workflow_approve',
    '{
      "actions": [
        {
          "action": "execute_function",
          "params": {"function": "srf_document_generator", "args": {"ticketId": ":ticketId"}},
          "condition": {"type": "workflow_step", "value": {"step": 1}}
        },
        {
          "action": "execute_function",
          "params": {"function": "srf_document_generator", "args": {"ticketId": ":ticketId"}},
          "condition": {"type": "workflow_step", "value": {"step": 2, "has_notes": true}}
        },
        {
          "action": "execute_function",
          "params": {"function": "srf_document_generator", "args": {"ticketId": ":ticketId"}},
          "condition": {"type": "workflow_step", "value": {"step": 3}}
        },
        {
          "action": "execute_function",
          "params": {"function": "srf_document_generator", "args": {"ticketId": ":ticketId"}},
          "condition": {"type": "workflow_step", "value": {"step": 4}}
        }
      ]
    }',
    1, 
    NOW()
);

-- Workflow Complete Trigger - creates assignment after all approvals
INSERT INTO m_service_triggers (
    service_id, trigger_name, trigger_type, trigger_config, active, created_at
) VALUES (
    6, 
    'workflow_complete',   -- Fixed: system calls runTriggersForEvent with 'workflow_complete'
    'workflow_complete',
    '{
      "actions": [
        {
          "action": "create_assignment",
          "params": {
            "assigned_type": "team",
            "assigned_id": 13,
            "notes": "Enter invoice and document numbers"
          }
        }
      ]
    }',
    1, 
    NOW()
);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check workflow definition
SELECT workflow_id, name, definition FROM m_service_workflow WHERE workflow_id = 6;

-- Check triggers - should now have on_submit, on_approve, and workflow_complete
SELECT trigger_id, service_id, trigger_name, trigger_type, active FROM m_service_triggers WHERE service_id = 6;
