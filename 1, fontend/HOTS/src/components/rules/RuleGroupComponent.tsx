import React, { useState } from 'react';
import {
    Rule,
    RuleCondition,
    RuleGroup as RuleGroupType,
    FieldMeta,
    createEmptyRule,
    createEmptyGroup,
    ruleToSentence,
    ruleToExpression,
} from '@/utils/ruleBuilderTypes';
import { RuleRow } from './RuleRow';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Layers, Trash2, Code, MessageSquare } from 'lucide-react';

interface RuleGroupProps {
    group: RuleGroupType;
    fields: FieldMeta[];
    onChange: (group: RuleGroupType) => void;
    onDelete?: () => void;
    depth?: number;
}

export const RuleGroupComponent: React.FC<RuleGroupProps> = ({
    group,
    fields,
    onChange,
    onDelete,
    depth = 0,
}) => {
    const handleCombinatorChange = (combinator: 'and' | 'or') => {
        onChange({ ...group, combinator });
    };

    const handleRuleChange = (index: number, rule: RuleCondition | RuleGroupType) => {
        const newRules = [...group.rules];
        newRules[index] = rule;
        onChange({ ...group, rules: newRules });
    };

    const handleDeleteRule = (index: number) => {
        const newRules = group.rules.filter((_, i) => i !== index);
        onChange({ ...group, rules: newRules.length > 0 ? newRules : [createEmptyRule()] });
    };

    const handleAddRule = () => {
        onChange({ ...group, rules: [...group.rules, createEmptyRule()] });
    };

    const handleAddGroup = () => {
        onChange({ ...group, rules: [...group.rules, createEmptyGroup()] });
    };

    const bgColors = [
        'bg-blue-50/50 border-blue-200',
        'bg-purple-50/50 border-purple-200',
        'bg-green-50/50 border-green-200',
    ];
    const bgColor = bgColors[depth % bgColors.length];

    return (
        <div className={`rounded-lg border-2 p-4 ${bgColor}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Match</span>
                    <Select
                        value={group.combinator}
                        onValueChange={(v) => handleCombinatorChange(v as 'and' | 'or')}
                    >
                        <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="and">ALL of</SelectItem>
                            <SelectItem value="or">ANY of</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">the following conditions:</span>
                </div>

                {onDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-8 text-gray-400 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove Group
                    </Button>
                )}
            </div>

            {/* Rules */}
            <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                {group.rules.map((rule, index) => (
                    <div key={index}>
                        {'combinator' in rule ? (
                            <RuleGroupComponent
                                group={rule}
                                fields={fields}
                                onChange={(updated) => handleRuleChange(index, updated)}
                                onDelete={() => handleDeleteRule(index)}
                                depth={depth + 1}
                            />
                        ) : (
                            <RuleRow
                                rule={rule}
                                fields={fields}
                                onChange={(updated) => handleRuleChange(index, updated)}
                                onDelete={() => handleDeleteRule(index)}
                                canDelete={group.rules.length > 1}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Add Buttons */}
            <div className="flex items-center gap-2 mt-3 ml-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRule}
                    className="h-8"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddGroup}
                    className="h-8"
                >
                    <Layers className="w-3 h-3 mr-1" />
                    Add Group
                </Button>
            </div>
        </div>
    );
};

export default RuleGroupComponent;
