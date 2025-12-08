/**
 * triggerAdapter.ts
 * Types and utilities for visual trigger builder
 */

// Trigger event types
export type TriggerEvent =
    | 'on_submit'
    | 'on_approve'
    | 'on_reject'
    | 'on_complete'
    | 'on_cancel'
    | 'on_assign'
    | 'on_status_change'
    | 'on_assignment_complete'
    | 'workflow_submit'
    | 'workflow_approve'
    | 'workflow_complete';

// Action types supported by trigger-engine
export type TriggerActionType =
    | 'generate_document'
    | 'send_email'
    | 'execute_function'
    | 'execute_sql'
    | 'create_assignment'
    | 'complete_assignment'
    | 'update_ticket_status';

// Action configuration
export interface TriggerAction {
    id: string;
    action: TriggerActionType;
    params: Record<string, any>;
    condition?: string;
}

// Full trigger definition
export interface TriggerDefinition {
    trigger_id?: number;
    service_id: number;
    trigger_name: TriggerEvent;
    trigger_type: string;
    trigger_config: {
        condition?: string;
        actions: TriggerAction[];
    };
    active: boolean;
}

// UI-friendly action metadata
export interface ActionMeta {
    type: TriggerActionType;
    label: string;
    description: string;
    icon: string;
    color: string;
    params: ParamMeta[];
}

export interface ParamMeta {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'context';
    options?: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    helpText?: string;
}

// Action catalog
export const ACTION_CATALOG: ActionMeta[] = [
    {
        type: 'generate_document',
        label: 'Generate Document',
        description: 'Create a PDF document from template',
        icon: 'FileText',
        color: 'blue',
        params: [
            { key: 'templateHtml', label: 'Template HTML', type: 'textarea', helpText: 'Leave empty to use service template' },
        ],
    },
    {
        type: 'send_email',
        label: 'Send Email',
        description: 'Send an email notification',
        icon: 'Mail',
        color: 'green',
        params: [
            { key: 'to', label: 'To', type: 'text', required: true, placeholder: ':requesterEmail or email@domain.com' },
            { key: 'cc', label: 'CC', type: 'text', placeholder: 'Optional CC recipients' },
            { key: 'subject', label: 'Subject', type: 'text', required: true },
            { key: 'body', label: 'Body', type: 'textarea', required: true },
        ],
    },
    {
        type: 'execute_function',
        label: 'Execute Function',
        description: 'Run a custom JavaScript function',
        icon: 'Code',
        color: 'purple',
        params: [
            { key: 'function', label: 'Function Name', type: 'text', required: true, placeholder: 'e.g., srf_document_generator' },
            { key: 'args', label: 'Arguments (JSON)', type: 'textarea', placeholder: '{"ticketId": ":ticketId"}' },
        ],
    },
    {
        type: 'execute_sql',
        label: 'Execute SQL',
        description: 'Run a SQL query',
        icon: 'Database',
        color: 'orange',
        params: [
            { key: 'query', label: 'SQL Query', type: 'textarea', required: true, placeholder: 'UPDATE table SET ... WHERE id = ?' },
            { key: 'params', label: 'Parameters (JSON array)', type: 'textarea', placeholder: '[":ticketId"]' },
        ],
    },
    {
        type: 'create_assignment',
        label: 'Create Assignment',
        description: 'Assign ticket to team/user',
        icon: 'UserPlus',
        color: 'cyan',
        params: [
            {
                key: 'assigned_type', label: 'Assign To', type: 'select', options: [
                    { value: 'team', label: 'Team' },
                    { value: 'user', label: 'User' },
                ]
            },
            { key: 'assigned_id', label: 'Team/User ID', type: 'text', required: true },
            { key: 'notes', label: 'Notes', type: 'textarea' },
        ],
    },
    {
        type: 'complete_assignment',
        label: 'Complete Assignment',
        description: 'Mark current assignment as complete',
        icon: 'CheckSquare',
        color: 'green',
        params: [],
    },
    {
        type: 'update_ticket_status',
        label: 'Update Status',
        description: 'Change the ticket status',
        icon: 'RefreshCw',
        color: 'yellow',
        params: [
            { key: 'status', label: 'New Status ID', type: 'number', required: true },
        ],
    },
];

// Event catalog
export const EVENT_CATALOG: { value: TriggerEvent; label: string; description: string }[] = [
    { value: 'on_submit', label: 'On Submit', description: 'When a ticket is first submitted' },
    { value: 'on_approve', label: 'On Approve', description: 'When an approval step is approved' },
    { value: 'on_reject', label: 'On Reject', description: 'When an approval step is rejected' },
    { value: 'on_complete', label: 'On Complete', description: 'When the entire workflow completes' },
    { value: 'on_cancel', label: 'On Cancel', description: 'When a ticket is cancelled' },
    { value: 'on_assign', label: 'On Assign', description: 'When a ticket is assigned' },
    { value: 'on_status_change', label: 'On Status Change', description: 'When ticket status changes' },
    { value: 'on_assignment_complete', label: 'On Assignment Complete', description: 'When assignment is completed' },
    { value: 'workflow_submit', label: 'Workflow Submit', description: 'When workflow submission occurs' },
    { value: 'workflow_approve', label: 'Workflow Approve', description: 'When workflow approval occurs' },
    { value: 'workflow_complete', label: 'Workflow Complete', description: 'When workflow reaches completion' },
];

// Context variables available
export const CONTEXT_VARIABLES = [
    { key: ':ticketId', label: 'Ticket ID' },
    { key: ':moduleKey', label: 'Module Key' },
    { key: ':requesterEmail', label: 'Requester Email' },
    { key: ':requesterId', label: 'Requester User ID' },
    { key: ':currentStatus', label: 'Current Status' },
    { key: ':formData', label: 'Form Data (JSON)' },
];

// Helper to generate unique ID
export function generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create new action
export function createAction(type: TriggerActionType): TriggerAction {
    const meta = ACTION_CATALOG.find(a => a.type === type);
    const params: Record<string, any> = {};
    meta?.params.forEach(p => {
        params[p.key] = p.type === 'checkbox' ? false : '';
    });
    return {
        id: generateActionId(),
        action: type,
        params,
    };
}
