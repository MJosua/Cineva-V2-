import React, { useState, useEffect } from 'react';
import {
    Rule,
    RuleGroup,
    FieldMeta,
    DEFAULT_FIELDS,
    createEmptyGroup,
    ruleToSentence,
    ruleToExpression,
} from '@/utils/ruleBuilderTypes';
import { RuleGroupComponent } from './RuleGroupComponent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, MessageSquare, Copy, Check, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RuleBuilderProps {
    value?: Rule | null;
    onChange: (rule: Rule) => void;
    fields?: FieldMeta[];
    title?: string;
    showOutput?: boolean;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
    value,
    onChange,
    fields = DEFAULT_FIELDS,
    title = 'Condition Builder',
    showOutput = true,
}) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    // Initialize with empty group if no value
    const currentRule: RuleGroup = value && 'combinator' in value
        ? value
        : createEmptyGroup();

    const handleChange = (group: RuleGroup) => {
        onChange(group);
    };

    const expression = ruleToExpression(currentRule);
    const sentence = ruleToSentence(currentRule, fields);

    const handleCopy = () => {
        navigator.clipboard.writeText(expression);
        setCopied(true);
        toast({ title: "Copied!", description: "Expression copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>

            {/* Rule Builder */}
            <RuleGroupComponent
                group={currentRule}
                fields={fields}
                onChange={handleChange}
            />

            {/* Output Preview */}
            {showOutput && (
                <Card className="bg-gray-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Condition Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="sentence">
                            <TabsList className="mb-2">
                                <TabsTrigger value="sentence">Natural Language</TabsTrigger>
                                <TabsTrigger value="code">JavaScript</TabsTrigger>
                            </TabsList>

                            <TabsContent value="sentence">
                                <div className="p-3 bg-white rounded border text-sm">
                                    {sentence || <span className="text-gray-400">No conditions defined</span>}
                                </div>
                            </TabsContent>

                            <TabsContent value="code">
                                <div className="relative">
                                    <pre className="p-3 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-x-auto">
                                        {expression || 'true'}
                                    </pre>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="absolute top-2 right-2 h-7 text-gray-400 hover:text-white"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RuleBuilder;
