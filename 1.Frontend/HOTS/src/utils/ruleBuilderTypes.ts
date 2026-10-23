/**
 * ruleBuilderTypes.ts
 * Types and utilities for the natural language rule builder
 */

// Operators supported
export type RuleOperator =
    | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
    | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
    | 'isEmpty' | 'isNotEmpty'
    | 'in' | 'notIn';

// Single condition rule
export interface RuleCondition {
    field: string;
    operator: RuleOperator;
    value: string | number | boolean | string[];
}

// Combined rules (AND/OR)
export interface RuleGroup {
    combinator: 'and' | 'or';
    rules: (RuleCondition | RuleGroup)[];
}

// Top-level rule (can be single condition or group)
export type Rule = RuleCondition | RuleGroup;

// Operator metadata for UI
export interface OperatorMeta {
    value: RuleOperator;
    label: string;
    description: string;
    requiresValue: boolean;
    valueType: 'text' | 'number' | 'select' | 'multiSelect' | 'none';
}

// Field metadata for UI
export interface FieldMeta {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean';
    options?: { value: string; label: string }[];
}

// Operator catalog
export const OPERATOR_CATALOG: OperatorMeta[] = [
    { value: 'eq', label: 'is equal to', description: 'Exact match', requiresValue: true, valueType: 'text' },
    { value: 'neq', label: 'is not equal to', description: 'Not equal', requiresValue: true, valueType: 'text' },
    { value: 'gt', label: 'is greater than', description: 'Greater than', requiresValue: true, valueType: 'number' },
    { value: 'gte', label: 'is greater than or equal to', description: 'Greater or equal', requiresValue: true, valueType: 'number' },
    { value: 'lt', label: 'is less than', description: 'Less than', requiresValue: true, valueType: 'number' },
    { value: 'lte', label: 'is less than or equal to', description: 'Less or equal', requiresValue: true, valueType: 'number' },
    { value: 'contains', label: 'contains', description: 'Contains text', requiresValue: true, valueType: 'text' },
    { value: 'notContains', label: 'does not contain', description: 'Does not contain', requiresValue: true, valueType: 'text' },
    { value: 'startsWith', label: 'starts with', description: 'Starts with', requiresValue: true, valueType: 'text' },
    { value: 'endsWith', label: 'ends with', description: 'Ends with', requiresValue: true, valueType: 'text' },
    { value: 'isEmpty', label: 'is empty', description: 'Has no value', requiresValue: false, valueType: 'none' },
    { value: 'isNotEmpty', label: 'is not empty', description: 'Has a value', requiresValue: false, valueType: 'none' },
    { value: 'in', label: 'is one of', description: 'Is in list', requiresValue: true, valueType: 'multiSelect' },
    { value: 'notIn', label: 'is not one of', description: 'Not in list', requiresValue: true, valueType: 'multiSelect' },
];

// Default context fields (can be expanded from form config)
export const DEFAULT_FIELDS: FieldMeta[] = [
    {
        name: 'status', label: 'Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'rejected', label: 'Rejected' },
        ]
    },
    {
        name: 'priority', label: 'Priority', type: 'select', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
        ]
    },
    { name: 'requester_id', label: 'Requester ID', type: 'number' },
    { name: 'requester_email', label: 'Requester Email', type: 'text' },
    { name: 'current_level', label: 'Approval Level', type: 'number' },
    { name: 'ticket_id', label: 'Ticket ID', type: 'number' },
];

// Helper: Generate empty rule
export function createEmptyRule(): RuleCondition {
    return {
        field: '',
        operator: 'eq',
        value: '',
    };
}

// Helper: Generate empty group
export function createEmptyGroup(): RuleGroup {
    return {
        combinator: 'and',
        rules: [createEmptyRule()],
    };
}

// Helper: Convert rule to human-readable string
export function ruleToSentence(rule: Rule, fields: FieldMeta[]): string {
    if ('combinator' in rule) {
        const parts = rule.rules.map(r => ruleToSentence(r, fields));
        return `(${parts.join(` ${rule.combinator.toUpperCase()} `)})`;
    }

    const field = fields.find(f => f.name === rule.field);
    const fieldLabel = field?.label || rule.field;
    const operator = OPERATOR_CATALOG.find(o => o.value === rule.operator);
    const opLabel = operator?.label || rule.operator;

    if (!operator?.requiresValue) {
        return `${fieldLabel} ${opLabel}`;
    }

    const valueDisplay = Array.isArray(rule.value)
        ? rule.value.join(', ')
        : String(rule.value);

    return `${fieldLabel} ${opLabel} "${valueDisplay}"`;
}

// Helper: Convert rule to JavaScript expression
export function ruleToExpression(rule: Rule): string {
    if ('combinator' in rule) {
        const parts = rule.rules.map(r => ruleToExpression(r));
        const joiner = rule.combinator === 'and' ? ' && ' : ' || ';
        return `(${parts.join(joiner)})`;
    }

    const field = `formData.${rule.field}`;
    const value = typeof rule.value === 'string' ? `"${rule.value}"` : rule.value;

    switch (rule.operator) {
        case 'eq': return `${field} === ${value}`;
        case 'neq': return `${field} !== ${value}`;
        case 'gt': return `${field} > ${value}`;
        case 'gte': return `${field} >= ${value}`;
        case 'lt': return `${field} < ${value}`;
        case 'lte': return `${field} <= ${value}`;
        case 'contains': return `${field}?.includes(${value})`;
        case 'notContains': return `!${field}?.includes(${value})`;
        case 'startsWith': return `${field}?.startsWith(${value})`;
        case 'endsWith': return `${field}?.endsWith(${value})`;
        case 'isEmpty': return `!${field}`;
        case 'isNotEmpty': return `!!${field}`;
        case 'in': return `[${(rule.value as string[]).map(v => `"${v}"`).join(',')}].includes(${field})`;
        case 'notIn': return `![${(rule.value as string[]).map(v => `"${v}"`).join(',')}].includes(${field})`;
        default: return 'true';
    }
}

// Helper: Parse expression to rule (basic support)
export function parseExpression(expr: string): Rule | null {
    // This is a simplified parser - for complex expressions, consider a proper parser
    // For now, return null if we can't parse
    return null;
}
