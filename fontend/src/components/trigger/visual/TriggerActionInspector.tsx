import React from 'react';
import { TriggerAction, ACTION_CATALOG, ParamMeta, CONTEXT_VARIABLES } from '@/utils/triggerAdapter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Settings, HelpCircle, Code } from 'lucide-react';
import { RuleBuilderInline } from '@/components/rules/RuleBuilderInline';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TriggerActionInspectorProps {
    selectedAction: TriggerAction | null;
    onUpdate: (actionId: string, updates: Partial<TriggerAction>) => void;
    onDelete: (actionId: string) => void;
}

export const TriggerActionInspector: React.FC<TriggerActionInspectorProps> = ({
    selectedAction,
    onUpdate,
    onDelete,
}) => {
    if (!selectedAction) {
        return (
            <div className="w-80 bg-white border-l h-full p-8 flex flex-col items-center justify-center text-center text-gray-500">
                <Settings className="w-8 h-8 mb-3 text-gray-300" />
                <p className="text-sm">Select an action to configure it.</p>
            </div>
        );
    }

    const meta = ACTION_CATALOG.find(a => a.type === selectedAction.action);
    if (!meta) return null;

    const handleParamChange = (key: string, value: any) => {
        onUpdate(selectedAction.id, {
            params: { ...selectedAction.params, [key]: value },
        });
    };

    const handleConditionChange = (condition: string) => {
        onUpdate(selectedAction.id, { condition });
    };

    const renderParamInput = (param: ParamMeta) => {
        const rawValue = selectedAction.params[param.key] ?? '';
        // Ensure value is a string for display (handles objects)
        const value = typeof rawValue === 'object' ? JSON.stringify(rawValue, null, 2) : rawValue;

        switch (param.type) {
            case 'textarea':
                return (
                    <Textarea
                        value={value}
                        onChange={(e) => {
                            // Try to parse as JSON if it looks like JSON
                            const newValue = e.target.value;
                            try {
                                if (newValue.startsWith('{') || newValue.startsWith('[')) {
                                    handleParamChange(param.key, JSON.parse(newValue));
                                } else {
                                    handleParamChange(param.key, newValue);
                                }
                            } catch {
                                handleParamChange(param.key, newValue);
                            }
                        }}
                        placeholder={param.placeholder}
                        rows={3}
                        className="font-mono text-xs"
                    />
                );
            case 'select':
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => handleParamChange(param.key, val)}
                    >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                            {param.options?.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleParamChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                    />
                );
            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleParamChange(param.key, e.target.checked)}
                        className="h-4 w-4"
                    />
                );
            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleParamChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                    />
                );
        }
    };

    return (
        <div className="w-80 bg-white border-l h-full flex flex-col">
            {/* Header */}
            <div className={`p-4 border-b bg-${meta.color}-50 flex items-center justify-between`}>
                <div>
                    <h2 className="font-semibold text-sm">{meta.label}</h2>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => onDelete(selectedAction.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Parameters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {meta.params.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-4">
                        No parameters required.
                    </div>
                )}

                {meta.params.map(param => (
                    <div key={param.key} className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Label className="text-xs text-gray-500">
                                {param.label}
                                {param.required && <span className="text-red-500 ml-0.5">*</span>}
                            </Label>
                            {param.helpText && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="w-3 h-3 text-gray-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs max-w-xs">{param.helpText}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {renderParamInput(param)}
                    </div>
                ))}

                {/* Condition */}
                <div className="pt-4 border-t space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        Condition (optional)
                    </Label>
                    <RuleBuilderInline
                        value={selectedAction.condition || ''}
                        onChange={handleConditionChange}
                    />
                </div>

                {/* Context Variables */}
                <div className="pt-4 border-t">
                    <Label className="text-xs text-gray-500 mb-2 block">Available Variables</Label>
                    <div className="flex flex-wrap gap-1">
                        {CONTEXT_VARIABLES.map(v => (
                            <button
                                key={v.key}
                                className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-700"
                                onClick={() => {
                                    navigator.clipboard.writeText(v.key);
                                }}
                                title={`Click to copy: ${v.label}`}
                            >
                                {v.key}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TriggerActionInspector;
