import React, { useState } from 'react';
import {
    FormRule,
    FormRuleWhen,
    FormRuleThen,
    FormRuleOperator,
    FORM_RULE_OPERATORS,
    FORM_RULE_ACTIONS,
    createEmptyFormRule,
    formRuleToSentence,
} from '@/utils/formRuleTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, Wand2, ArrowRight, Zap } from 'lucide-react';

interface FormRuleEditorProps {
    rules: FormRule[];
    onChange: (rules: FormRule[]) => void;
    availableFields: { name: string; label: string }[];
    currentFieldName: string;
}

export const FormRuleEditor: React.FC<FormRuleEditorProps> = ({
    rules,
    onChange,
    availableFields,
    currentFieldName,
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempRule, setTempRule] = useState<FormRule>(createEmptyFormRule(currentFieldName));

    const handleAddRule = () => {
        setTempRule(createEmptyFormRule(currentFieldName));
        setEditingIndex(null);
        setDialogOpen(true);
    };

    const handleEditRule = (index: number) => {
        setTempRule({ ...rules[index] });
        setEditingIndex(index);
        setDialogOpen(true);
    };

    const handleSaveRule = () => {
        if (editingIndex !== null) {
            const newRules = [...rules];
            newRules[editingIndex] = tempRule;
            onChange(newRules);
        } else {
            onChange([...rules, tempRule]);
        }
        setDialogOpen(false);
    };

    const handleDeleteRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
    };

    const updateTempRule = (updates: Partial<FormRule>) => {
        setTempRule(prev => ({ ...prev, ...updates }));
    };

    const updateWhen = (updates: Partial<FormRuleWhen>) => {
        setTempRule(prev => ({ ...prev, when: { ...prev.when, ...updates } }));
    };

    const updateThen = (updates: Partial<FormRuleThen>) => {
        setTempRule(prev => ({ ...prev, then: { ...prev.then, ...updates } }));
    };

    const selectedOperator = FORM_RULE_OPERATORS.find(o => o.value === tempRule.when.operator);

    return (
        <div className="space-y-3">
            {/* Existing Rules */}
            {rules.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-400 border-2 border-dashed rounded-lg">
                    No rules defined
                </div>
            ) : (
                <div className="space-y-2">
                    {rules.map((rule, index) => (
                        <div
                            key={rule.id || index}
                            className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs cursor-pointer hover:bg-amber-100"
                            onClick={() => handleEditRule(index)}
                        >
                            <Zap className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span className="flex-1 truncate">{formRuleToSentence(rule)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRule(index);
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Rule Button */}
            <Button variant="outline" size="sm" className="w-full" onClick={handleAddRule}>
                <Plus className="w-3 h-3 mr-1" />
                Add Rule
            </Button>

            {/* Rule Editor Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-purple-500" />
                            {editingIndex !== null ? 'Edit' : 'Add'} Field Rule
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* WHEN section */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">When...</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Depends By */}
                                <div>
                                    <Label className="text-xs text-gray-500">This field triggers the rule:</Label>
                                    <Select
                                        value={tempRule.dependsBy}
                                        onValueChange={(v) => updateTempRule({ dependsBy: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select field..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableFields
                                                .filter(f => f.name !== currentFieldName)
                                                .map(field => (
                                                    <SelectItem key={field.name} value={field.name}>
                                                        {field.label} ({field.name})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Operator */}
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={tempRule.when.operator}
                                        onValueChange={(v) => updateWhen({ operator: v as FormRuleOperator, value: undefined })}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select condition..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FORM_RULE_OPERATORS.map(op => (
                                                <SelectItem key={op.value} value={op.value}>
                                                    {op.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedOperator?.requiresValue && (
                                        <Input
                                            value={String(tempRule.when.value || '')}
                                            onChange={(e) => updateWhen({ value: e.target.value })}
                                            placeholder="Value"
                                            className="w-32"
                                        />
                                    )}
                                </div>

                                {/* Trigger */}
                                <div>
                                    <Label className="text-xs text-gray-500">Trigger on:</Label>
                                    <Select
                                        value={tempRule.trigger || 'blur'}
                                        onValueChange={(v) => updateTempRule({ trigger: v as 'blur' | 'change' | 'init' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blur">Field loses focus (blur)</SelectItem>
                                            <SelectItem value="change">Value changes</SelectItem>
                                            <SelectItem value="init">Form loads</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <ArrowRight className="w-5 h-5 text-gray-300" />
                        </div>

                        {/* THEN section */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Then...</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2">
                                    <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                            checked={tempRule.then.clearSelf || false}
                                            onCheckedChange={(c) => updateThen({ clearSelf: !!c })}
                                        />
                                        Clear this field
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                            checked={tempRule.then.autoSelectFirst || false}
                                            onCheckedChange={(c) => updateThen({ autoSelectFirst: !!c })}
                                        />
                                        Auto-select first
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                            checked={tempRule.then.setRequired || false}
                                            onCheckedChange={(c) => updateThen({ setRequired: !!c })}
                                        />
                                        Make required
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs">
                                        <Checkbox
                                            checked={tempRule.then.setReadonly || false}
                                            onCheckedChange={(c) => updateThen({ setReadonly: !!c })}
                                        />
                                        Make read-only
                                    </label>
                                </div>

                                {/* Set Value */}
                                <div>
                                    <Label className="text-xs text-gray-500">Set value to:</Label>
                                    <Input
                                        value={tempRule.then.setValue?.toString() || ''}
                                        onChange={(e) => updateThen({ setValue: e.target.value || undefined })}
                                        placeholder="Leave empty to skip"
                                    />
                                </div>

                                {/* API Call */}
                                <div>
                                    <Label className="text-xs text-gray-500">Fetch from API:</Label>
                                    <Input
                                        value={tempRule.then.api || ''}
                                        onChange={(e) => updateThen({ api: e.target.value || undefined })}
                                        placeholder="/api/endpoint/${dependsByValue}"
                                        className="font-mono text-xs"
                                    />
                                    {tempRule.then.api && (
                                        <div className="mt-1 flex gap-2">
                                            <Input
                                                value={tempRule.then.storeAs || ''}
                                                onChange={(e) => updateThen({ storeAs: e.target.value || undefined })}
                                                placeholder="Store as..."
                                                className="flex-1 text-xs"
                                            />
                                            <Select
                                                value={tempRule.then.dependsByValue || 'filter'}
                                                onValueChange={(v) => updateThen({ dependsByValue: v as 'filter' | 'replace' })}
                                            >
                                                <SelectTrigger className="w-24">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="filter">Filter</SelectItem>
                                                    <SelectItem value="replace">Replace</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Rounding (for number fields) */}
                                <div>
                                    <Label className="text-xs text-gray-500">Rounding (number fields):</Label>
                                    <Input
                                        type="number"
                                        value={tempRule.then.rounding?.toString() || ''}
                                        onChange={(e) => updateThen({ rounding: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="e.g., 25"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveRule} disabled={!tempRule.dependsBy}>
                            {editingIndex !== null ? 'Update' : 'Add'} Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FormRuleEditor;
