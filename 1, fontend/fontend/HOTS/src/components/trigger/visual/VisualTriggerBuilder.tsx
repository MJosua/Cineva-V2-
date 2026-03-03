import React, { useState, useEffect } from 'react';
import {
    TriggerAction,
    TriggerEvent,
    TriggerDefinition,
    EVENT_CATALOG,
    createAction,
    TriggerActionType,
    generateActionId
} from '@/utils/triggerAdapter';
import TriggerActionCard from './TriggerActionCard';
import TriggerActionPalette from './TriggerActionPalette';
import TriggerActionInspector from './TriggerActionInspector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Zap, Plus, Trash2, Save } from 'lucide-react';

interface VisualTriggerBuilderProps {
    serviceId: number;
    triggers: TriggerDefinition[];
    onChange: (triggers: TriggerDefinition[]) => void;
}

export const VisualTriggerBuilder: React.FC<VisualTriggerBuilderProps> = ({
    serviceId,
    triggers: triggersProp,
    onChange,
}) => {
    // Ensure triggers is always an array
    const triggers = Array.isArray(triggersProp) ? triggersProp : [];

    const [selectedEvent, setSelectedEvent] = useState<TriggerEvent | null>(
        triggers.length > 0 ? triggers[0].trigger_name : null
    );
    const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

    // Sync selectedEvent when triggers are loaded asynchronously
    useEffect(() => {
        if (triggers.length > 0 && !selectedEvent) {
            setSelectedEvent(triggers[0].trigger_name);
        }
    }, [triggers]);

    // Get current trigger for selected event
    const currentTrigger = triggers.find(t => t.trigger_name === selectedEvent);
    const actions = currentTrigger?.trigger_config?.actions || [];

    // Handle adding a new event
    const handleAddEvent = (event: TriggerEvent) => {
        if (triggers.find(t => t.trigger_name === event)) {
            setSelectedEvent(event);
            return;
        }

        const newTrigger: TriggerDefinition = {
            service_id: serviceId,
            trigger_name: event,
            trigger_type: 'custom',
            trigger_config: { actions: [] },
            active: true,
        };

        onChange([...triggers, newTrigger]);
        setSelectedEvent(event);
    };

    // Handle adding an action
    const handleAddAction = (type: TriggerActionType) => {
        if (!selectedEvent) {
            // No event selected, create default on_submit
            handleAddEvent('on_submit');
            return;
        }

        const newAction = createAction(type);
        const updatedTriggers = triggers.map(t => {
            if (t.trigger_name === selectedEvent) {
                return {
                    ...t,
                    trigger_config: {
                        ...t.trigger_config,
                        actions: [...(t.trigger_config.actions || []), newAction],
                    },
                };
            }
            return t;
        });

        // If trigger doesn't exist yet, create it
        if (!currentTrigger) {
            const newTrigger: TriggerDefinition = {
                service_id: serviceId,
                trigger_name: selectedEvent,
                trigger_type: 'custom',
                trigger_config: { actions: [newAction] },
                active: true,
            };
            onChange([...triggers, newTrigger]);
        } else {
            onChange(updatedTriggers);
        }

        setSelectedActionId(newAction.id);
    };

    // Handle updating an action
    const handleUpdateAction = (actionId: string, updates: Partial<TriggerAction>) => {
        const updatedTriggers = triggers.map(t => {
            if (t.trigger_name === selectedEvent) {
                return {
                    ...t,
                    trigger_config: {
                        ...t.trigger_config,
                        actions: t.trigger_config.actions.map(a =>
                            a.id === actionId ? { ...a, ...updates } : a
                        ),
                    },
                };
            }
            return t;
        });
        onChange(updatedTriggers);
    };

    // Handle deleting an action
    const handleDeleteAction = (actionId: string) => {
        const updatedTriggers = triggers.map(t => {
            if (t.trigger_name === selectedEvent) {
                return {
                    ...t,
                    trigger_config: {
                        ...t.trigger_config,
                        actions: t.trigger_config.actions.filter(a => a.id !== actionId),
                    },
                };
            }
            return t;
        });
        onChange(updatedTriggers);
        setSelectedActionId(null);
    };

    // Handle deleting an entire event
    const handleDeleteEvent = () => {
        if (!selectedEvent) return;
        onChange(triggers.filter(t => t.trigger_name !== selectedEvent));
        setSelectedEvent(triggers.length > 1 ? triggers[0].trigger_name : null);
    };

    const selectedAction = actions.find(a => a.id === selectedActionId) || null;

    return (
        <div className="flex h-full">
            {/* Left: Action Palette */}
            <TriggerActionPalette onAddAction={handleAddAction} />

            {/* Center: Event & Actions List */}
            <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                {/* Event Selector */}
                <div className="p-4 bg-white border-b flex items-center gap-4">
                    <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1 block">Trigger Event</Label>
                        <Select
                            value={selectedEvent || undefined}
                            onValueChange={(val) => handleAddEvent(val as TriggerEvent)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an event..." />
                            </SelectTrigger>
                            <SelectContent>
                                {EVENT_CATALOG.map(event => (
                                    <SelectItem key={event.value} value={event.value}>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-yellow-500" />
                                            <span>{event.label}</span>
                                            {triggers.find(t => t.trigger_name === event.value) && (
                                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                    {triggers.find(t => t.trigger_name === event.value)?.trigger_config.actions.length || 0} actions
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedEvent && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={handleDeleteEvent}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Event
                        </Button>
                    )}
                </div>

                {/* Actions List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!selectedEvent ? (
                        <div className="text-center py-12 text-gray-500">
                            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Select an event from the dropdown above</p>
                            <p className="text-xs mt-1">or click an action to get started</p>
                        </div>
                    ) : actions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No actions for "{EVENT_CATALOG.find(e => e.value === selectedEvent)?.label}"</p>
                            <p className="text-xs mt-1">Click an action from the left panel to add one</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {actions.map((action, index) => (
                                <TriggerActionCard
                                    key={action.id}
                                    action={action}
                                    index={index}
                                    isSelected={action.id === selectedActionId}
                                    onSelect={() => setSelectedActionId(action.id)}
                                    onDelete={() => handleDeleteAction(action.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Event Info */}
                {selectedEvent && (
                    <div className="p-3 bg-blue-50 border-t text-xs text-blue-700">
                        <strong>{EVENT_CATALOG.find(e => e.value === selectedEvent)?.label}:</strong>{' '}
                        {EVENT_CATALOG.find(e => e.value === selectedEvent)?.description}
                    </div>
                )}
            </div>

            {/* Right: Inspector */}
            <TriggerActionInspector
                selectedAction={selectedAction}
                onUpdate={handleUpdateAction}
                onDelete={handleDeleteAction}
            />
        </div>
    );
};

export default VisualTriggerBuilder;
