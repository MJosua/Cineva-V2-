import React from 'react';
import {
    RuleCondition,
    RuleOperator,
    FieldMeta,
    OPERATOR_CATALOG
} from '@/utils/ruleBuilderTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface RuleRowProps {
    rule: RuleCondition;
    fields: FieldMeta[];
    onChange: (rule: RuleCondition) => void;
    onDelete: () => void;
    canDelete: boolean;
}

export const RuleRow: React.FC<RuleRowProps> = ({
    rule,
    fields,
    onChange,
    onDelete,
    canDelete,
}) => {
    const selectedField = fields.find(f => f.name === rule.field);
    const selectedOperator = OPERATOR_CATALOG.find(o => o.value === rule.operator);

    // Filter operators based on field type
    const availableOperators = OPERATOR_CATALOG.filter(op => {
        if (!selectedField) return true;
        if (selectedField.type === 'number') {
            return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'].includes(op.value);
        }
        if (selectedField.type === 'select') {
            return ['eq', 'neq', 'in', 'notIn', 'isEmpty', 'isNotEmpty'].includes(op.value);
        }
        return true;
    });

    const handleFieldChange = (fieldName: string) => {
        onChange({ ...rule, field: fieldName, value: '' });
    };

    const handleOperatorChange = (operator: RuleOperator) => {
        const op = OPERATOR_CATALOG.find(o => o.value === operator);
        const newValue = op?.requiresValue ? (op.valueType === 'multiSelect' ? [] : '') : '';
        onChange({ ...rule, operator, value: newValue });
    };

    const handleValueChange = (value: string | string[]) => {
        onChange({ ...rule, value });
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border shadow-sm">
            {/* Field Selector */}
            <Select value={rule.field} onValueChange={handleFieldChange}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                    {fields.map(field => (
                        <SelectItem key={field.name} value={field.name}>
                            {field.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select value={rule.operator} onValueChange={(v) => handleOperatorChange(v as RuleOperator)}>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select condition..." />
                </SelectTrigger>
                <SelectContent>
                    {availableOperators.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                            {op.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Value Input */}
            {selectedOperator?.requiresValue && (
                <>
                    {selectedField?.type === 'select' && selectedField.options ? (
                        <Select
                            value={String(rule.value)}
                            onValueChange={handleValueChange}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select value..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedField.options.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : selectedField?.type === 'number' ? (
                        <Input
                            type="number"
                            value={String(rule.value)}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder="Enter value..."
                            className="w-32"
                        />
                    ) : (
                        <Input
                            type="text"
                            value={String(rule.value)}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder="Enter value..."
                            className="w-40"
                        />
                    )}
                </>
            )}

            {/* Delete Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={!canDelete}
                className="h-8 w-8 text-gray-400 hover:text-red-500"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default RuleRow;
