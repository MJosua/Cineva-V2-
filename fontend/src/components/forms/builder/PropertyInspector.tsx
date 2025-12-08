
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormSection, RowGroup } from '@/types/formTypes';
import { FormStructureItem } from '@/components/forms/UnifiedFormStructureEditor';
import { Trash2, Copy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormRuleEditor } from '@/components/rules/FormRuleEditor';
import { RuleBuilderInline } from '@/components/rules/RuleBuilderInline';
import { FormRule } from '@/utils/formRuleTypes';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

interface PropertyInspectorProps {
    selectedItem: FormStructureItem | null;
    onUpdate: (id: string, updates: any) => void;
    onDelete: (id: string) => void;
    onClone: (item: FormStructureItem) => void;
    allFields?: { name: string; label: string }[];
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
    selectedItem,
    onUpdate,
    onDelete,
    onClone,
    allFields = [],
}) => {
    if (!selectedItem) {
        return (
            <div className="w-80 bg-white border-l h-full p-8 flex flex-col items-center justify-center text-center text-gray-500">
                <p className="text-sm">Select an element on the canvas to edit its properties.</p>
            </div>
        );
    }

    const { type, data } = selectedItem;

    const handleChange = (key: string, value: any) => {
        onUpdate(selectedItem.id, { ...data, [key]: value });
    };

    return (
        <div className="w-80 bg-white border-l h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <h2 className="font-semibold text-sm text-gray-900">Properties</h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => onClone(selectedItem)}>
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => onDelete(selectedItem.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Common Field Properties */}
                {type === 'field' && (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Field Label</Label>
                                <Input
                                    value={(data as FormField).label}
                                    onChange={(e) => handleChange('label', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Backend Name (System ID)</Label>
                                <Input
                                    className="font-mono text-xs"
                                    value={(data as FormField).name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Type</Label>
                                    <Select
                                        value={(data as FormField).type}
                                        onValueChange={(val) => handleChange('type', val)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="textarea">Text Area</SelectItem>
                                            <SelectItem value="select">Select / Dropdown</SelectItem>
                                            <SelectItem value="suggestion-insert">Suggestion Insert</SelectItem>
                                            <SelectItem value="upload_file">File Upload</SelectItem>
                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Width</Label>
                                    <Select
                                        value={((data as FormField).columnSpan || 1).toString()}
                                        onValueChange={(val) => handleChange('columnSpan', parseInt(val))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Col (1/3)</SelectItem>
                                            <SelectItem value="2">2 Cols (2/3)</SelectItem>
                                            <SelectItem value="3">3 Cols (Full)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-b">
                                <Label className="text-sm">Required Field</Label>
                                <Switch
                                    checked={(data as FormField).required || false}
                                    onCheckedChange={(checked) => handleChange('required', checked)}
                                />
                            </div>

                            {(data as FormField).type === 'select' && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-gray-500">Options (JSON)</Label>
                                    <Textarea
                                        className="font-mono text-xs h-24"
                                        placeholder='["Option A", "Option B"]'
                                        value={JSON.stringify((data as FormField).options || [], null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleChange('options', parsed);
                                            } catch (err) {
                                                // ignore parse errors while typing
                                            }
                                        }}
                                    />
                                    <p className="text-[10px] text-gray-400">Enter a valid JSON array of options.</p>
                                </div>
                            )}

                            {/* Advanced Section with Accordion */}
                            <Accordion type="single" collapsible className="w-full">
                                {/* Visibility Condition */}
                                <AccordionItem value="visibility">
                                    <AccordionTrigger className="text-xs py-2">Visibility Condition</AccordionTrigger>
                                    <AccordionContent>
                                        <RuleBuilderInline
                                            value={(data as FormField).uiCondition || ''}
                                            onChange={(expr) => handleChange('uiCondition', expr)}
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Field Rules */}
                                <AccordionItem value="rules">
                                    <AccordionTrigger className="text-xs py-2">
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                            Field Rules ({((data as FormField).rules || []).length})
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <FormRuleEditor
                                            rules={((data as FormField).rules as FormRule[]) || []}
                                            onChange={(rules) => handleChange('rules', rules)}
                                            availableFields={allFields}
                                            currentFieldName={(data as FormField).name}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </>
                )}

                {/* Section Properties */}
                {type === 'section' && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Section Title</Label>
                            <Input
                                value={(data as FormSection).title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Description</Label>
                            <Textarea
                                value={(data as FormSection).description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Row Group Properties */}
                {type === 'rowgroup' && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Group Title</Label>
                            <Input
                                value={(data as RowGroup).title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Max Rows</Label>
                            <Input
                                type="number"
                                value={(data as RowGroup).maxRows || 10}
                                onChange={(e) => handleChange('maxRows', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
