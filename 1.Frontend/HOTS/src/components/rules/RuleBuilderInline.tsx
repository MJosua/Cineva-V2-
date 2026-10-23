import React, { useState } from 'react';
import {
    Rule,
    RuleGroup,
    FieldMeta,
    DEFAULT_FIELDS,
    createEmptyGroup,
    ruleToSentence,
    ruleToExpression,
} from '@/utils/ruleBuilderTypes';
import { RuleBuilder } from './RuleBuilder';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Wand2, Code } from 'lucide-react';

interface RuleBuilderInlineProps {
    value?: string; // Expression string
    onChange: (expression: string) => void;
    fields?: FieldMeta[];
    placeholder?: string;
}

/**
 * Compact inline rule builder that shows the expression
 * and opens a dialog for full editing
 */
export const RuleBuilderInline: React.FC<RuleBuilderInlineProps> = ({
    value = '',
    onChange,
    fields = DEFAULT_FIELDS,
    placeholder = 'Click to add condition...',
}) => {
    const [open, setOpen] = useState(false);
    const [tempRule, setTempRule] = useState<Rule>(createEmptyGroup());

    const handleOpen = () => {
        setOpen(true);
    };

    const handleSave = () => {
        const expression = ruleToExpression(tempRule);
        onChange(expression);
        setOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setTempRule(createEmptyGroup());
    };

    return (
        <div className="space-y-2">
            {/* Display current expression */}
            <div
                className="p-2 rounded border bg-gray-50 text-xs font-mono cursor-pointer hover:bg-gray-100 transition-colors min-h-[60px] flex items-center"
                onClick={handleOpen}
            >
                {value ? (
                    <code className="text-green-700 break-all">{value}</code>
                ) : (
                    <span className="text-gray-400">{placeholder}</span>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">
                            <Wand2 className="w-3 h-3 mr-1" />
                            Build Condition
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-500" />
                                Condition Builder
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            <RuleBuilder
                                value={tempRule}
                                onChange={setTempRule}
                                fields={fields}
                                title=""
                                showOutput={true}
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                Apply Condition
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-gray-500"
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
};

export default RuleBuilderInline;
