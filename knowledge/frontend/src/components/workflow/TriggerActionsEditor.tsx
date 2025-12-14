import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight, Zap, Database, GitBranch, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

export interface TriggerCondition {
    type: 'status_change' | 'workflow_step' | 'field_value';
    value: {
        to?: number;
        step?: number;
        field?: string;
        operator?: string;
        value?: string | number;
    };
}

export interface TriggerAction {
    id: string;
    action: string;
    condition?: TriggerCondition;
    params: Record<string, any>;
}

export interface TriggerConfig {
    trigger_name: string;
    trigger_type: string;
    actions: TriggerAction[];
    active: boolean;
}

interface SchemaColumn {
    name: string;
    type: string;
    nullable: boolean;
}

interface SchemaTable {
    table: string;
    columns: SchemaColumn[];
}

interface ValidationError {
    trigger: number;
    action: number;
    field: string;
    column?: string;
    message: string;
}

interface TriggerActionsEditorProps {
    triggers: TriggerConfig[];
    onTriggersChange: (triggers: TriggerConfig[]) => void;
    formFields?: { id: string; label: string }[];
}

const ACTION_TYPES = [
    { value: 'create_record', label: 'Create Record', icon: Database, description: 'Insert a new record into any table' },
    { value: 'send_email', label: 'Send Email', icon: Zap, description: 'Send notification email' },
    { value: 'execute_sql', label: 'Execute SQL', icon: Database, description: 'Run custom SQL query' },
    { value: 'update_ticket_status', label: 'Update Status', icon: Zap, description: 'Change ticket status' },
    { value: 'create_assignment', label: 'Create Assignment', icon: Zap, description: 'Assign ticket to team/user' },
    { value: 'execute_function', label: 'Execute Function', icon: Zap, description: 'Run custom JavaScript function' },
];

const TRIGGER_EVENTS = [
    { value: 'on_submit', label: 'On Submit', description: 'When ticket is first submitted' },
    { value: 'on_status_change', label: 'On Status Change', description: 'When ticket status changes' },
    { value: 'on_approve', label: 'On Approve', description: 'When ticket is approved' },
    { value: 'on_reject', label: 'On Reject', description: 'When ticket is rejected' },
    { value: 'on_complete', label: 'On Complete', description: 'When ticket is fully completed' },
];

const CONDITION_OPERATORS = [
    { value: '==', label: 'Equals (==)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
];

const TriggerActionsEditor = ({ triggers, onTriggersChange, formFields = [] }: TriggerActionsEditorProps) => {
    const [expandedTriggers, setExpandedTriggers] = useState<Set<number>>(new Set([0]));
    const [schema, setSchema] = useState<SchemaTable[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [isLoadingSchema, setIsLoadingSchema] = useState(true);

    // Load schema on mount
    useEffect(() => {
        const loadSchema = async () => {
            try {
                const response = await axios.get(`${API_URL}/hots_settings/schema`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
                });
                if (response.data.success) {
                    setSchema(response.data.schema);
                }
            } catch (err) {
                console.error('Failed to load schema:', err);
            } finally {
                setIsLoadingSchema(false);
            }
        };
        loadSchema();
    }, []);

    const generateId = () => `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get validation errors for specific action
    const getActionErrors = (triggerIndex: number, actionIndex: number) => {
        return validationErrors.filter(e => e.trigger === triggerIndex && e.action === actionIndex);
    };

    const addTrigger = () => {
        const newTrigger: TriggerConfig = {
            trigger_name: 'on_status_change',
            trigger_type: 'event',
            actions: [],
            active: true,
        };
        onTriggersChange([...triggers, newTrigger]);
        setExpandedTriggers(prev => new Set([...prev, triggers.length]));
    };

    const removeTrigger = (index: number) => {
        const updated = triggers.filter((_, i) => i !== index);
        onTriggersChange(updated);
    };

    const updateTrigger = (index: number, field: keyof TriggerConfig, value: any) => {
        const updated = [...triggers];
        updated[index] = { ...updated[index], [field]: value };
        onTriggersChange(updated);
    };

    const addAction = (triggerIndex: number) => {
        const updated = [...triggers];
        const newAction: TriggerAction = {
            id: generateId(),
            action: 'create_record',
            params: {},
        };
        updated[triggerIndex].actions = [...updated[triggerIndex].actions, newAction];
        onTriggersChange(updated);
    };

    const removeAction = (triggerIndex: number, actionIndex: number) => {
        const updated = [...triggers];
        updated[triggerIndex].actions = updated[triggerIndex].actions.filter((_, i) => i !== actionIndex);
        onTriggersChange(updated);
    };

    const updateAction = (triggerIndex: number, actionIndex: number, updates: Partial<TriggerAction>) => {
        const updated = [...triggers];
        updated[triggerIndex].actions[actionIndex] = {
            ...updated[triggerIndex].actions[actionIndex],
            ...updates,
        };
        onTriggersChange(updated);
    };

    const toggleTrigger = (index: number) => {
        setExpandedTriggers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const renderConditionEditor = (
        triggerIndex: number,
        actionIndex: number,
        condition?: TriggerCondition
    ) => {
        const hasCondition = !!condition;

        return (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-amber-600" />
                        Condition (Optional)
                    </Label>
                    {!hasCondition ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                updateAction(triggerIndex, actionIndex, {
                                    condition: {
                                        type: 'field_value',
                                        value: { field: '', operator: '==', value: '' }
                                    }
                                });
                            }}
                        >
                            Add Condition
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                                updateAction(triggerIndex, actionIndex, { condition: undefined });
                            }}
                        >
                            Remove
                        </Button>
                    )}
                </div>

                {hasCondition && (
                    <div className="grid grid-cols-4 gap-2">
                        <div>
                            <Label className="text-xs">Condition Type</Label>
                            <Select
                                value={condition.type}
                                onValueChange={(value: TriggerCondition['type']) => {
                                    updateAction(triggerIndex, actionIndex, {
                                        condition: { type: value, value: {} }
                                    });
                                }}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="field_value">Field Value</SelectItem>
                                    <SelectItem value="status_change">Status Change</SelectItem>
                                    <SelectItem value="workflow_step">Workflow Step</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {condition.type === 'field_value' && (
                            <>
                                <div>
                                    <Label className="text-xs">Field</Label>
                                    <Input
                                        className="h-8"
                                        placeholder="field_name"
                                        value={condition.value.field || ''}
                                        onChange={(e) => {
                                            updateAction(triggerIndex, actionIndex, {
                                                condition: {
                                                    ...condition,
                                                    value: { ...condition.value, field: e.target.value }
                                                }
                                            });
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Operator</Label>
                                    <Select
                                        value={condition.value.operator || '=='}
                                        onValueChange={(value) => {
                                            updateAction(triggerIndex, actionIndex, {
                                                condition: {
                                                    ...condition,
                                                    value: { ...condition.value, operator: value }
                                                }
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONDITION_OPERATORS.map(op => (
                                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Value</Label>
                                    <Input
                                        className="h-8"
                                        placeholder="compare value"
                                        value={condition.value.value?.toString() || ''}
                                        onChange={(e) => {
                                            updateAction(triggerIndex, actionIndex, {
                                                condition: {
                                                    ...condition,
                                                    value: { ...condition.value, value: e.target.value }
                                                }
                                            });
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {condition.type === 'status_change' && (
                            <div className="col-span-3">
                                <Label className="text-xs">To Status</Label>
                                <Select
                                    value={condition.value.to?.toString() || ''}
                                    onValueChange={(value) => {
                                        updateAction(triggerIndex, actionIndex, {
                                            condition: {
                                                ...condition,
                                                value: { to: parseInt(value) }
                                            }
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 - Pending</SelectItem>
                                        <SelectItem value="2">2 - In Progress</SelectItem>
                                        <SelectItem value="3">3 - Approved</SelectItem>
                                        <SelectItem value="4">4 - Rejected</SelectItem>
                                        <SelectItem value="5">5 - In Fulfillment</SelectItem>
                                        <SelectItem value="6">6 - Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderActionParams = (
        triggerIndex: number,
        actionIndex: number,
        action: TriggerAction
    ) => {
        switch (action.action) {
            case 'create_record':
                const errors = getActionErrors(triggerIndex, actionIndex);
                const tableError = errors.find(e => e.field === 'table');
                const selectedTable = schema.find(s => s.table === action.params.table);

                return (
                    <div className="mt-3 space-y-3">
                        <div>
                            <Label className="text-xs">Target Table</Label>
                            {isLoadingSchema ? (
                                <Input disabled value="Loading schema..." />
                            ) : (
                                <Select
                                    value={action.params.table || ''}
                                    onValueChange={(value) => {
                                        updateAction(triggerIndex, actionIndex, {
                                            params: { table: value, mapping: {} }
                                        });
                                    }}
                                >
                                    <SelectTrigger className={tableError ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select table" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schema.map(s => (
                                            <SelectItem key={s.table} value={s.table}>
                                                {s.table}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {tableError && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {tableError.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-xs">Column Mapping (JSON)</Label>
                            <textarea
                                className="w-full h-24 p-2 text-sm border rounded-md font-mono"
                                placeholder={`{
  "user_id": ":created_by",
  "ticket_id": ":ticketId",
  "created_at": "NOW()"
}`}
                                value={action.params.mappingJson || JSON.stringify(action.params.mapping || {}, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const mapping = JSON.parse(e.target.value);
                                        updateAction(triggerIndex, actionIndex, {
                                            params: { ...action.params, mapping, mappingJson: e.target.value }
                                        });
                                    } catch {
                                        updateAction(triggerIndex, actionIndex, {
                                            params: { ...action.params, mappingJson: e.target.value }
                                        });
                                    }
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use :fieldName to reference context values (e.g., :created_by, :ticketId)
                            </p>
                        </div>
                    </div>
                );

            case 'send_email':
                return (
                    <div className="mt-3 space-y-3">
                        <div>
                            <Label className="text-xs">Email Template</Label>
                            <Select
                                value={action.params.template || 'generic'}
                                onValueChange={(value) => {
                                    updateAction(triggerIndex, actionIndex, {
                                        params: { ...action.params, template: value }
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="submit">Submit Confirmation</SelectItem>
                                    <SelectItem value="approve">Approval Request</SelectItem>
                                    <SelectItem value="assignment_complete">Assignment Complete</SelectItem>
                                    <SelectItem value="generic">Generic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );

            case 'update_ticket_status':
                return (
                    <div className="mt-3">
                        <Label className="text-xs">New Status</Label>
                        <Select
                            value={action.params.status?.toString() || ''}
                            onValueChange={(value) => {
                                updateAction(triggerIndex, actionIndex, {
                                    params: { ...action.params, status: parseInt(value) }
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 - Pending</SelectItem>
                                <SelectItem value="2">2 - In Progress</SelectItem>
                                <SelectItem value="3">3 - Approved</SelectItem>
                                <SelectItem value="4">4 - Rejected</SelectItem>
                                <SelectItem value="5">5 - In Fulfillment</SelectItem>
                                <SelectItem value="6">6 - Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'execute_function':
                return (
                    <div className="mt-3 space-y-3">
                        <div>
                            <Label className="text-xs">Function Name</Label>
                            <Input
                                placeholder="e.g., publishJobListing"
                                value={action.params.function || ''}
                                onChange={(e) => {
                                    updateAction(triggerIndex, actionIndex, {
                                        params: { ...action.params, function: e.target.value }
                                    });
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Function must exist in script/trigger-functions/
                            </p>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="mt-3">
                        <Label className="text-xs">Parameters (JSON)</Label>
                        <textarea
                            className="w-full h-20 p-2 text-sm border rounded-md font-mono"
                            placeholder="{}"
                            value={JSON.stringify(action.params, null, 2)}
                            onChange={(e) => {
                                try {
                                    const params = JSON.parse(e.target.value);
                                    updateAction(triggerIndex, actionIndex, { params });
                                } catch { /* ignore parse errors while typing */ }
                            }}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base font-medium">Trigger Actions</Label>
                    <p className="text-sm text-gray-500">Configure automated actions that run on specific events</p>
                </div>
                <Button type="button" size="sm" onClick={addTrigger}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Trigger
                </Button>
            </div>

            {triggers.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No triggers configured yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Trigger" to create automated actions.</p>
                </div>
            )}

            {triggers.map((trigger, triggerIndex) => (
                <Collapsible
                    key={triggerIndex}
                    open={expandedTriggers.has(triggerIndex)}
                    onOpenChange={() => toggleTrigger(triggerIndex)}
                >
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="py-3">
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {expandedTriggers.has(triggerIndex) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        <Zap className="w-4 h-4 text-purple-500" />
                                        <CardTitle className="text-sm">
                                            {TRIGGER_EVENTS.find(e => e.value === trigger.trigger_name)?.label || trigger.trigger_name}
                                        </CardTitle>
                                        <span className="text-xs text-gray-500">
                                            ({trigger.actions.length} action{trigger.actions.length !== 1 ? 's' : ''})
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTrigger(triggerIndex);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CollapsibleTrigger>
                        </CardHeader>

                        <CollapsibleContent>
                            <CardContent className="pt-0 space-y-4">
                                <div>
                                    <Label>Trigger Event</Label>
                                    <Select
                                        value={trigger.trigger_name}
                                        onValueChange={(value) => updateTrigger(triggerIndex, 'trigger_name', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRIGGER_EVENTS.map(event => (
                                                <SelectItem key={event.value} value={event.value}>
                                                    <div className="flex flex-col">
                                                        <span>{event.label}</span>
                                                        <span className="text-xs text-gray-500">{event.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-medium">Actions</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addAction(triggerIndex)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Action
                                        </Button>
                                    </div>

                                    {trigger.actions.map((action, actionIndex) => (
                                        <Card key={action.id} className="mb-3 bg-gray-50">
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <Label className="text-xs">Action Type</Label>
                                                        <Select
                                                            value={action.action}
                                                            onValueChange={(value) => {
                                                                updateAction(triggerIndex, actionIndex, {
                                                                    action: value,
                                                                    params: {}
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ACTION_TYPES.map(type => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            <type.icon className="w-4 h-4" />
                                                                            <div>
                                                                                <span>{type.label}</span>
                                                                                <span className="text-xs text-gray-500 ml-2">{type.description}</span>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAction(triggerIndex, actionIndex)}
                                                        className="text-red-600 ml-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {renderActionParams(triggerIndex, actionIndex, action)}
                                                {renderConditionEditor(triggerIndex, actionIndex, action.condition)}
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {trigger.actions.length === 0 && (
                                        <div className="text-center py-6 text-gray-400 text-sm border border-dashed rounded">
                                            No actions yet. Click "Add Action" above.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            ))}
        </div>
    );
};

export default TriggerActionsEditor;
