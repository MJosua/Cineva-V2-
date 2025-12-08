
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { useCatalogData } from '@/hooks/useCatalogData';
import { useAppDispatch } from '@/hooks/useAppSelector';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { FormConfig, FormField, FormSection, RowGroup } from '@/types/formTypes';
import { FormStructureItem } from '@/components/forms/UnifiedFormStructureEditor';
import { v4 as uuidv4 } from 'uuid';

import { StudioLayout } from './studio/StudioLayout';
import { ComponentPalette } from '@/components/forms/builder/ComponentPalette';
import { VisualFormCanvas } from '@/components/forms/builder/VisualFormCanvas';
import { PropertyInspector } from '@/components/forms/builder/PropertyInspector';
import VisualWorkflowEditor from '@/components/workflow/visual/VisualWorkflowEditor';
import VisualTriggerBuilder from '@/components/trigger/visual/VisualTriggerBuilder';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { WorkflowDefinition } from '@/utils/workflowGraphAdapter';
import { TriggerDefinition } from '@/utils/triggerAdapter';

// Reusing the render logic from the original editor for consistency initially
import { GripVertical, Link as LinkIcon, Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StudioPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const { categoryList, serviceCatalog } = useCatalogData();

    const [mode, setMode] = useState<'form' | 'workflow' | 'triggers' | 'settings'>('form');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // Form Configuration State
    const [config, setConfig] = useState<FormConfig>({
        title: '',
        url: '',
        description: '',
        category: '',
        apiEndpoint: '',
        items: [],
    });

    const [formStructure, setFormStructure] = useState<FormStructureItem[]>([]);

    // Workflow State
    const [workflowDefinition, setWorkflowDefinition] = useState<WorkflowDefinition | null>(null);

    // Triggers State
    const [triggers, setTriggers] = useState<TriggerDefinition[]>([]);

    // Load Data
    useEffect(() => {
        if (id && serviceCatalog.length > 0) {
            const serviceData = serviceCatalog.find(s => s.service_id.toString() === id);
            if (serviceData) {
                let parsedConfig: FormConfig = {
                    id: serviceData.service_id.toString(),
                    title: serviceData.service_name,
                    url: `/${serviceData.nav_link}`,
                    items: [],
                    description: serviceData.service_description || '',
                    category: '',
                    apiEndpoint: ''
                };

                const category = categoryList.find(cat => cat.category_id === serviceData.category_id);
                if (category) parsedConfig.category = category.category_name;

                if (serviceData.form_json) {
                    try {
                        const jsonConfig = JSON.parse(serviceData.form_json);
                        parsedConfig = { ...parsedConfig, ...jsonConfig, id: serviceData.service_id.toString() };
                    } catch (e) {
                        console.error(e);
                    }
                }

                setConfig(parsedConfig);
                setFormStructure(parsedConfig.items || []);

                // Load workflow - fetch from backend
                loadWorkflow(serviceData.service_id);

                // Load triggers
                loadTriggers(serviceData.service_id);
            }
        } else if (id === 'new') {
            setConfig(prev => ({ ...prev, title: 'New Service' }));
        }
    }, [id, serviceCatalog, categoryList]);

    // Load workflow from backend
    const loadWorkflow = async (serviceId: number) => {
        try {
            const res = await axios.get(`${API_URL}/workflow-engine/definition/${serviceId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
            });
            if (res.data?.ok && res.data?.definition) {
                setWorkflowDefinition(res.data.definition);
            } else {
                setWorkflowDefinition({ steps: [], tasks: [] });
            }
        } catch (e) {
            console.log('No workflow found, starting fresh');
            setWorkflowDefinition({ steps: [], tasks: [] });
        }
    };

    // Load triggers from backend
    const loadTriggers = async (serviceId: number) => {
        try {
            const res = await axios.get(`${API_URL}/triggers/${serviceId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
            });
            if (res.data?.ok && res.data?.triggers) {
                // Ensure each action has an ID
                const loadedTriggers = res.data.triggers.map((t: any) => ({
                    ...t,
                    trigger_config: {
                        ...t.trigger_config,
                        actions: (t.trigger_config?.actions || []).map((a: any, idx: number) => ({
                            ...a,
                            id: a.id || `action-${t.trigger_id}-${idx}`,
                        })),
                    },
                }));
                setTriggers(loadedTriggers);
            } else {
                setTriggers([]);
            }
        } catch (e) {
            console.log('No triggers found, starting fresh');
            setTriggers([]);
        }
    };

    // Handle Drag and Drop
    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        // A. Dropping from Palette to Canvas
        if (source.droppableId === 'palette' && destination.droppableId === 'unified-structure') {
            const typeParts = result.draggableId.split('-');
            const itemType = typeParts[1];
            const dataType = typeParts[2];

            const newItemId = `${itemType}-${Date.now()}`;

            let newItem: FormStructureItem = {
                id: newItemId,
                type: itemType as any,
                order: destination.index,
                data: {} as any
            };

            if (itemType === 'field') {
                newItem.data = {
                    label: 'New Field',
                    name: `field_${Date.now()}`,
                    type: dataType,
                    required: false,
                    columnSpan: 1
                } as FormField;
            } else if (itemType === 'section') {
                newItem.data = {
                    title: 'New Section',
                    fields: []
                } as FormSection;
            } else if (itemType === 'rowgroup') {
                newItem.data = {
                    title: 'New Row Group',
                    maxRows: 5
                } as RowGroup;
            }

            const newItems = [...formStructure];
            newItems.splice(destination.index, 0, newItem);
            newItems.forEach((it, idx) => it.order = idx);

            setFormStructure(newItems);
            setSelectedId(newItemId);
            return;
        }

        // B. Reordering within Canvas
        if (source.droppableId === 'unified-structure' && destination.droppableId === 'unified-structure') {
            const newItems = [...formStructure];
            const [removed] = newItems.splice(source.index, 1);
            newItems.splice(destination.index, 0, removed);
            newItems.forEach((it, idx) => it.order = idx);
            setFormStructure(newItems);
        }
    };

    // Logic to render items in the canvas
    const renderCanvasItem = (item: FormStructureItem, index: number, isSelected: boolean) => {
        if (item.type === 'field') {
            const f = item.data as FormField;
            return (
                <div className={`p-4 bg-white rounded-lg border shadow-sm flex items-center gap-3 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{f.label}</span>
                            {f.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{f.name} • {f.type}</div>
                    </div>
                    {f.uiCondition && (
                        <div className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-[10px] flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Cond
                        </div>
                    )}
                </div>
            );
        }

        if (item.type === 'section') {
            const s = item.data as FormSection;
            return (
                <div className={`p-4 bg-green-50/50 rounded-lg border border-l-4 border-l-green-500 shadow-sm flex items-center gap-3 ${isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-green-200'}`}>
                    <GripVertical className="w-4 h-4 text-green-300" />
                    <div className="flex-1">
                        <div className="font-medium text-sm text-green-900">{s.title || 'Untitled Section'}</div>
                        <div className="text-xs text-green-600 mt-0.5">Section Header</div>
                    </div>
                </div>
            );
        }

        if (item.type === 'rowgroup') {
            const r = item.data as RowGroup;
            return (
                <div className={`p-4 bg-orange-50/50 rounded-lg border border-l-4 border-l-orange-500 shadow-sm flex items-center gap-3 ${isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-orange-200'}`}>
                    <GripVertical className="w-4 h-4 text-orange-300" />
                    <div className="flex-1">
                        <div className="font-medium text-sm text-orange-900">{r.title || 'Untitled Group'}</div>
                        <div className="text-xs text-orange-600 mt-0.5">Dynamic Row Group (Max: {r.maxRows})</div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const handleUpdateItem = (id: string, newData: any) => {
        setFormStructure(prev => prev.map(item => item.id === id ? { ...item, data: newData } : item));
    };

    const handleDeleteItem = (id: string) => {
        setFormStructure(prev => prev.filter(item => item.id !== id));
        setSelectedId(null);
    };

    const handleCloneItem = (item: FormStructureItem) => {
        const cloned = { ...item, id: `${item.type}-${Date.now()}`, data: { ...item.data } };
        if (item.type === 'field') {
            (cloned.data as any).name = `${(item.data as any).name}_copy`;
            (cloned.data as any).label = `${(item.data as any).label} (Copy)`;
        }
        setFormStructure(prev => [...prev, cloned]);
    }

    const handleWorkflowChange = (definition: WorkflowDefinition) => {
        setWorkflowDefinition(definition);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save form configuration
            const payload = {
                ...(id && id !== 'new' && { service_id: parseInt(id) }),
                service_name: config.title,
                category_id: categoryList.find(c => c.category_name === config.category)?.category_id || null,
                service_description: config.description,
                nav_link: config.url?.replace(/^\/+/, '') || 'temp-link',
                active: 1,
                form_json: { ...config, items: formStructure }
            };

            await axios.post(`${API_URL}/hots_settings/insertupdate/service_catalog`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
            });

            // Save workflow definition if we have one
            if (workflowDefinition && id && id !== 'new') {
                await axios.post(
                    `${API_URL}/workflow-engine/definition/${id}`,
                    { definition: workflowDefinition, name: config.title },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` } }
                );
            }

            // Save triggers if we have any
            if (triggers.length > 0 && id && id !== 'new') {
                await axios.post(
                    `${API_URL}/triggers/${id}`,
                    { triggers },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` } }
                );
            }

            toast({ title: "Saved", description: "Service configuration saved successfully." });

            if (id === 'new') navigate('/admin/service-catalog');
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const selectedItem = formStructure.find(i => i.id === selectedId) || null;

    // Build preview config
    const previewConfig: FormConfig = {
        ...config,
        items: formStructure
    };

    return (
        <StudioLayout
            title={config.title}
            onSave={handleSave}
            isSaving={isSaving}
            mode={mode}
            setMode={setMode}
        >
            {/* FORM MODE */}
            {mode === 'form' && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full">
                        {/* Left: Palette */}
                        <ComponentPalette />

                        {/* Center: Canvas */}
                        <div className={`flex-1 flex ${showPreview ? '' : ''}`}>
                            <div className={showPreview ? 'w-1/2' : 'flex-1'}>
                                <div className="h-full flex flex-col">
                                    <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-600">Structure</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="h-7 text-xs"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                                        </Button>
                                    </div>
                                    <VisualFormCanvas
                                        items={formStructure}
                                        selectedId={selectedId}
                                        onSelect={setSelectedId}
                                        renderItem={renderCanvasItem}
                                    />
                                </div>
                            </div>

                            {/* Live Preview */}
                            {showPreview && (
                                <div className="w-1/2 border-l bg-gray-100 overflow-auto">
                                    <div className="p-2 border-b bg-white flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-medium text-gray-600">Live Preview</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="bg-white rounded-lg shadow-sm p-4">
                                            <DynamicForm
                                                config={previewConfig}
                                                setConfig={setConfig}
                                                onSubmit={() => { }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Inspector */}
                        <PropertyInspector
                            selectedItem={selectedItem}
                            onUpdate={handleUpdateItem}
                            onDelete={handleDeleteItem}
                            onClone={handleCloneItem}
                            allFields={formStructure
                                .filter(item => item.type === 'field')
                                .map(item => ({
                                    name: (item.data as any).name || '',
                                    label: (item.data as any).label || '',
                                }))}
                        />
                    </div>
                </DragDropContext>
            )}

            {/* WORKFLOW MODE */}
            {mode === 'workflow' && (
                <div className="h-full">
                    <VisualWorkflowEditor
                        workflowDefinition={workflowDefinition}
                        onChange={handleWorkflowChange}
                    />
                </div>
            )}

            {
                console.log("Rendering VisualTriggerBuilder with triggers:", triggers)
            }



            {/* TRIGGERS MODE */}
            {mode === 'triggers' && id && id !== 'new' && (
                <div className="h-full">
                    <VisualTriggerBuilder
                        serviceId={parseInt(id)}
                        triggers={triggers}
                        onChange={setTriggers}
                    />
                </div>
            )}

            {/* SETTINGS MODE */}
            {mode === 'settings' && (
                <div className="p-8 text-center text-gray-500">
                    <p>Settings panel coming soon...</p>
                </div>
            )}
        </StudioLayout>
    );
};

export default StudioPage;

