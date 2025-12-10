/**
 * formRuleTypes.ts
 * Types for form field rules (dependsBy, when, then, trigger format)
 */

// Operators for form rules
export type FormRuleOperator =
    | 'equals' | 'not_equals'
    | 'not_empty' | 'is_empty'
    | 'changed'
    | 'contains' | 'not_contains'
    | 'greater_than' | 'less_than';

// When condition
export interface FormRuleWhen {
    operator: FormRuleOperator;
    value?: string | number | boolean;
}

// Then action types
export interface FormRuleThen {
    // API call
    api?: string;
    storeAs?: string;
    dependsByValue?: 'filter' | 'replace';

    // Field manipulation
    clearSelf?: boolean;
    autoSelectFirst?: boolean;
    setValue?: string | number;
    setOptions?: string[];

    // Validation
    setRequired?: boolean;
    setReadonly?: boolean;
    setVisible?: boolean;

    // Number field
    rounding?: number | string;
    maxnumber?: number | string;
    minnumber?: number | string;
}

// Complete form rule
export interface FormRule {
    id?: string;
    dependsBy: string;
    when: FormRuleWhen;
    then: FormRuleThen;
    trigger?: 'blur' | 'change' | 'init';
    default?: boolean; // If true, this is the default rule
}

// Operator catalog
export interface FormRuleOperatorMeta {
    value: FormRuleOperator;
    label: string;
    requiresValue: boolean;
}

export const FORM_RULE_OPERATORS: FormRuleOperatorMeta[] = [
    { value: 'equals', label: 'is equal to', requiresValue: true },
    { value: 'not_equals', label: 'is not equal to', requiresValue: true },
    { value: 'not_empty', label: 'has a value', requiresValue: false },
    { value: 'is_empty', label: 'is empty', requiresValue: false },
    { value: 'changed', label: 'changes', requiresValue: false },
    { value: 'contains', label: 'contains', requiresValue: true },
    { value: 'not_contains', label: 'does not contain', requiresValue: true },
    { value: 'greater_than', label: 'is greater than', requiresValue: true },
    { value: 'less_than', label: 'is less than', requiresValue: true },
];

// Then action catalog
export interface FormRuleActionMeta {
    key: keyof FormRuleThen;
    label: string;
    type: 'boolean' | 'text' | 'number' | 'api';
    description: string;
}

export const FORM_RULE_ACTIONS: FormRuleActionMeta[] = [
    { key: 'clearSelf', label: 'Clear this field', type: 'boolean', description: 'Reset field to empty' },
    { key: 'autoSelectFirst', label: 'Auto-select first option', type: 'boolean', description: 'Select first available option' },
    { key: 'setValue', label: 'Set value to', type: 'text', description: 'Set a specific value' },
    { key: 'setRequired', label: 'Set required', type: 'boolean', description: 'Make field required' },
    { key: 'setReadonly', label: 'Set readonly', type: 'boolean', description: 'Make field read-only' },
    { key: 'setVisible', label: 'Show/Hide field', type: 'boolean', description: 'Toggle visibility' },
    { key: 'api', label: 'Fetch from API', type: 'api', description: 'Load options from API' },
    { key: 'rounding', label: 'Set rounding', type: 'number', description: 'Number rounding value' },
];

// Helper: Generate unique ID
export function generateFormRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Create empty rule
export function createEmptyFormRule(currentFieldName: string): FormRule {
    return {
        id: generateFormRuleId(),
        dependsBy: '',
        when: { operator: 'changed' },
        then: { clearSelf: true },
        trigger: 'blur',
    };
}

// Helper: Convert rule to human sentence
export function formRuleToSentence(rule: FormRule): string {
    const operator = FORM_RULE_OPERATORS.find(o => o.value === rule.when.operator);
    const opLabel = operator?.label || rule.when.operator;

    let when = `When "${rule.dependsBy}" ${opLabel}`;
    if (rule.when.value !== undefined) {
        when += ` "${rule.when.value}"`;
    }

    const actions = [];
    if (rule.then.clearSelf) actions.push('clear this field');
    if (rule.then.autoSelectFirst) actions.push('auto-select first');
    if (rule.then.setValue) actions.push(`set value to "${rule.then.setValue}"`);
    if (rule.then.setRequired !== undefined) actions.push(rule.then.setRequired ? 'make required' : 'make optional');
    if (rule.then.setReadonly !== undefined) actions.push(rule.then.setReadonly ? 'make read-only' : 'make editable');
    if (rule.then.setVisible !== undefined) actions.push(rule.then.setVisible ? 'show' : 'hide');
    if (rule.then.api) actions.push(`fetch from API`);

    return `${when} → ${actions.join(', ') || 'no action'}`;
}
