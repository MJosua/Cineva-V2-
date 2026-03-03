import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Zap, GitBranch, Layers } from 'lucide-react';
import { FormConfig, FormField, FormSection, RowGroup, FormItem, FormStructureItem } from '@/types/formTypes';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { useCatalogData } from '@/hooks/useCatalogData';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTeams, fetchWorkflowGroups } from '@/store/slices/userManagementSlice';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { getMaxFormFields } from '@/utils/formFieldMapping';
import { UnifiedFormStructureEditor } from '@/components/forms/UnifiedFormStructureEditor';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ComponentPalette } from '@/components/forms/builder/ComponentPalette';
import { VisualFormCanvas } from '@/components/forms/builder/VisualFormCanvas';
import { PropertyInspector } from '@/components/forms/builder/PropertyInspector';
import { VisualWorkflowEditor } from '@/components/workflow/visual/VisualWorkflowEditor';
import { VisualTriggerBuilder } from '@/components/trigger/visual/VisualTriggerBuilder';
import { TriggerDefinition, TriggerEvent } from '@/utils/triggerAdapter';
import { WorkflowDefinition } from '@/utils/workflowGraphAdapter';
import { ServiceSettingsTab, ServiceSettings } from '@/components/admin/ServiceSettingsTab';

const ServiceFormEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEdit = !!id;
  const { categoryList, serviceCatalog } = useCatalogData();
  const { workflowGroups, teams } = useAppSelector(state => state.userManagement);

  const [config, setConfig] = useState<FormConfig>({
    title: '',
    url: '',
    description: '',
    category: '',
    apiEndpoint: '',
    items: [], // Unified array for all form elements
  });

  const [selectedWorkflowGroup, setSelectedWorkflowGroup] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formStructure, setFormStructure] = useState<FormStructureItem[]>([]);

  // Visual Editor state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workflowDefinition, setWorkflowDefinition] = useState<WorkflowDefinition | null>(null);
  const [triggers, setTriggers] = useState<TriggerDefinition[]>([]);
  const [selectedTriggerEvent, setSelectedTriggerEvent] = useState<TriggerEvent>('on_submit');
  const [serviceSettings, setServiceSettings] = useState<ServiceSettings>({});

  // Selected item for inspector
  const selectedItem = useMemo(() => {
    return formStructure.find(item => item.id === selectedId) || null;
  }, [formStructure, selectedId]);

  // Calculate total field count properly
  const totalFieldCount = formStructure.reduce((acc, item) => {
    if (item.type === 'field') {
      return acc + 1;
    } else if (item.type === 'section') {
      const sectionData = item.data as any;
      return acc + (sectionData.fields?.length || 0);
    } else if (item.type === 'rowgroup') {
      return acc + 1; // Row groups count as 1 field mapping
    }
    return acc;
  }, 0);

  // Fetch workflow groups on component mount
  useEffect(() => {
    dispatch(fetchWorkflowGroups());
    dispatch(fetchTeams())
  }, [dispatch]);

  // Load triggers from /triggers/:id endpoint (same as StudioPage)
  const loadTriggersFromAPI = async (serviceId: number) => {
    console.log("🚀 loadTriggersFromAPI called with ID:", serviceId);

    try {
      const res = await axios.get(`${API_URL}/triggers/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });

      console.log("📥 Raw trigger API response:", res.data);

      if (res.data?.ok && res.data?.triggers) {
        const loadedTriggers = res.data.triggers.map((t: any, idx: number) => ({
          ...t,
          trigger_config: {
            ...t.trigger_config,
            actions: (t.trigger_config?.actions || []).map((a: any, i: number) => ({
              ...a,
              id: a.id || `action-${idx}-${i}`,
            })),
          },
        }));

        console.log("✅ Processed triggers:", loadedTriggers);

        setTriggers(loadedTriggers);

      } else {
        console.log("⚠️ No triggers returned from API");
      }

    } catch (e: any) {
      console.log("❌ Error in loadTriggersFromAPI:", e.message);
    }
  };

  // Migration: Convert legacy structure to unified structure
  const migrateLegacyConfig = (config: any): FormStructureItem[] => {
    let items = config.items || [];
    if (items.length === 0) {
      const migratedItems: FormStructureItem[] = [];
      let order = 0;

      // 1. Add loose fields
      if (Array.isArray(config.fields)) {
        config.fields.forEach((f: any) => {
          migratedItems.push({
            id: f.id || `field-${Date.now()}-${order}`,
            type: 'field',
            order: order++,
            data: f
          });
        });
      }

      // 2. Add sections
      if (Array.isArray(config.sections)) {
        config.sections.forEach((s: any) => {
          migratedItems.push({
            id: s.id || `section-${Date.now()}-${order}`,
            type: 'section',
            order: order++,
            data: s
          });
        });
      }

      // 3. Add row groups
      if (Array.isArray(config.rowGroups)) {
        config.rowGroups.forEach((rg: any) => {
          migratedItems.push({
            id: rg.id || `rowgroup-${Date.now()}-${order}`,
            type: 'rowgroup',
            order: order++,
            data: rg
          });
        });
      }

      if (migratedItems.length > 0) {
        console.log("🔄 Migrated legacy form structure to unified items", migratedItems.length);
        items = migratedItems;
      }
    }
    return items;
  };

  useEffect(() => {
    const loadServiceData = async () => {
      if (!isEdit || !id) return;

      try {
        // Use the unified API that joins m_service + m_service_triggers + m_workflow
        const response = await axios.get(`${API_URL}/hots_settings/get_service/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
        });

        if (response.data.success && response.data.data) {
          const serviceData = response.data.data;
          const category = categoryList.find(cat => cat.category_id === serviceData.category_id);
          const categoryName = category?.category_name || '';

          let parsedConfig: FormConfig = {
            id: serviceData.service_id.toString(),
            title: serviceData.service_name,
            url: `/${serviceData.nav_link}`,
            category: categoryName,
            description: serviceData.service_description,
            apiEndpoint: `/api/${serviceData.nav_link}`,
            items: [],
            servis_aktif: Number(serviceData.active) ?? 0,
            active: Number(serviceData.active) ?? 0
          };

          // Parse form_json
          if (serviceData.form_json) {
            try {
              const jsonConfig = typeof serviceData.form_json === 'string'
                ? JSON.parse(serviceData.form_json)
                : serviceData.form_json;
              parsedConfig = {
                ...parsedConfig,
                ...jsonConfig,
                id: serviceData.service_id.toString(),
                category: categoryName,
              };
            } catch (error) {
              console.error('Failed to parse form_json:', error);
            }
          }

          setConfig(parsedConfig);

          // Apply migration
          const initialItems = migrateLegacyConfig(parsedConfig);
          setFormStructure(initialItems);

          // Load triggers using same endpoint as StudioPage (which works)
          await loadTriggersFromAPI(parseInt(id));

          // Load workflow definition from API response
          if (serviceData.workflow_definition) {
            console.log('📋 Loaded workflow from m_workflow:', serviceData.workflow_definition);
            setWorkflowDefinition(serviceData.workflow_definition);
          }

          if (serviceData.m_workflow_groups) {
            setSelectedWorkflowGroup(serviceData.m_workflow_groups);
          }
          if (serviceData.team_id) {
            setSelectedAssignment(serviceData.team_id);
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch service by ID:', error.message);
        console.log('ℹ️ If backend not restarted, restart it to enable new /get_service/:id endpoint');

        // Fallback to Redux store if API fails (backend not restarted)
        if (serviceCatalog.length > 0) {
          const serviceData = serviceCatalog.find(service => service.service_id.toString() === id);
          if (serviceData) {
            const category = categoryList.find(cat => cat.category_id === serviceData.category_id);
            const categoryName = category?.category_name || '';

            let parsedConfig: FormConfig = {
              id: serviceData.service_id.toString(),
              title: serviceData.service_name,
              url: `/${serviceData.nav_link}`,
              category: categoryName,
              description: serviceData.service_description,
              apiEndpoint: `/api/${serviceData.nav_link}`,
              items: [],
              servis_aktif: Number(serviceData.active) ?? 0,
              active: Number(serviceData.active) ?? 0
            };

            if (serviceData.form_json) {
              try {
                const jsonConfig = typeof serviceData.form_json === 'string'
                  ? JSON.parse(serviceData.form_json)
                  : serviceData.form_json;
                parsedConfig = { ...parsedConfig, ...jsonConfig, id: serviceData.service_id.toString(), category: categoryName };
              } catch (error) {
                console.error('Failed to parse form_json:', error);
              }
            }

            setConfig(parsedConfig);
            // Apply migration in fallback too
            const initialItems = migrateLegacyConfig(parsedConfig);
            setFormStructure(initialItems);
            if (serviceData.m_workflow_groups) setSelectedWorkflowGroup(serviceData.m_workflow_groups);
            if (serviceData.team_id) setSelectedAssignment(serviceData.team_id);

            // Load triggers from /triggers API (fallback also uses same endpoint)
            await loadTriggersFromAPI(serviceData.service_id);
          }
        }
      }
    };

    if (isEdit && id && categoryList.length > 0) {
      loadServiceData();
    } else if (!isEdit) {
      const defaultWorkflow = workflowGroups.find(wg => wg.name?.toLowerCase().includes('direct superior') || wg.name?.toLowerCase().includes('default'));
      if (defaultWorkflow) {
        setSelectedWorkflowGroup(defaultWorkflow.id);
      }
    }
  }, [isEdit, id, serviceCatalog, categoryList, workflowGroups]);

  const { toast } = useToast();

  // Convert legacy structure to unified structure


  const handleStructureUpdate = (items: FormStructureItem[]) => {
    setFormStructure(items);

    // Convert unified structure to legacy format for backward compatibility
    const fields: FormField[] = [];
    const sections: FormSection[] = [];
    const rowGroups: RowGroup[] = [];
    const unifiedItems: FormItem[] = [];

    items.forEach((item, index) => {
      // Create unified item
      unifiedItems.push({
        id: item.id,
        type: item.type,
        order: index,
        data: item.data
      });

      // Convert to legacy format
      if (item.type === 'field') {
        fields.push(item.data as FormField);
      } else if (item.type === 'section') {
        const sectionData = item.data as any;
        sections.push({
          title: sectionData.title,
          description: sectionData.description,
          fields: sectionData.fields,
          repeatable: sectionData.repeatable || false
        });
      } else if (item.type === 'rowgroup') {
        rowGroups.push(item.data as RowGroup);
      }
    });

    setConfig({
      ...config,
      items: unifiedItems, // Set unified items
    });
  };

  // Visual editor drag-drop handler
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // From palette to canvas
    if (source.droppableId === 'component-palette' && destination.droppableId === 'form-canvas') {
      const newId = `item-${Date.now()}`;
      let newItem: FormStructureItem;

      if (draggableId === 'field') {
        newItem = {
          id: newId,
          type: 'field',
          order: destination.index,
          data: { name: 'new_field', label: 'New Field', type: 'text' } as FormField
        };
      } else if (draggableId === 'section') {
        newItem = {
          id: newId,
          type: 'section',
          order: destination.index,
          data: { title: 'New Section', description: '', fields: [] } as unknown as FormSection
        };
      } else if (draggableId === 'rowgroup') {
        newItem = {
          id: newId,
          type: 'rowgroup',
          order: destination.index,
          data: { title: 'New Row Group', maxRows: 10 } as unknown as RowGroup
        };
      } else {
        return;
      }

      const newStructure = [...formStructure];
      newStructure.splice(destination.index, 0, newItem);
      handleStructureUpdate(newStructure);
      setSelectedId(newId);
    }

    // Reorder within canvas
    if (source.droppableId === 'form-canvas' && destination.droppableId === 'form-canvas') {
      const newStructure = [...formStructure];
      const [removed] = newStructure.splice(source.index, 1);
      newStructure.splice(destination.index, 0, removed);
      handleStructureUpdate(newStructure);
    }
  }, [formStructure, handleStructureUpdate]);

  // Update item in visual editor
  const handleUpdateItem = useCallback((itemId: string, updates: any) => {
    const newStructure = formStructure.map(item =>
      item.id === itemId ? { ...item, data: updates } : item
    );
    handleStructureUpdate(newStructure);
  }, [formStructure, handleStructureUpdate]);

  // Delete item from visual editor
  const handleDeleteItem = useCallback((itemId: string) => {
    const newStructure = formStructure.filter(item => item.id !== itemId);
    handleStructureUpdate(newStructure);
    if (selectedId === itemId) setSelectedId(null);
  }, [formStructure, handleStructureUpdate, selectedId]);

  // Clone item in visual editor
  const handleCloneItem = useCallback((item: FormStructureItem) => {
    const cloneId = `item-${Date.now()}`;
    const clonedItem: FormStructureItem = {
      ...item,
      id: cloneId,
      data: { ...item.data }
    };
    const currentIndex = formStructure.findIndex(i => i.id === item.id);
    const newStructure = [...formStructure];
    newStructure.splice(currentIndex + 1, 0, clonedItem);
    handleStructureUpdate(newStructure);
    setSelectedId(cloneId);
  }, [formStructure, handleStructureUpdate]);

  // Load workflow definition
  const loadWorkflowAndTriggers = useCallback(async () => {
    if (!id) return;
    try {
      // Load workflow definition
      const workflowRes = await axios.get(`${API_URL}/workflow-engine/definition/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      if (workflowRes.data?.definition) {
        setWorkflowDefinition(workflowRes.data.definition);
      }

      // Load triggers
      const triggersRes = await axios.get(`${API_URL}/triggers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      if (triggersRes.data) {
        setTriggers(triggersRes.data);
      }
    } catch (error) {
      console.error('Failed to load workflow/triggers:', error);
    }
  }, [id]);

  // Load workflow and triggers when tab changes
  useEffect(() => {
    console.log("🔄 activeTab changed:", activeTab);

    if (activeTab === "triggers" && id) {
      console.log("🚀 Loading triggers because user opened Triggers tab");
      loadTriggersFromAPI(parseInt(id));
    }

    if (activeTab === "workflow" && id) {
      console.log("🚀 Loading workflow because user opened Workflow tab");
      loadWorkflowAndTriggers();
    }
  }, [activeTab, id]);

  // Canvas item renderer for visual editor
  const renderCanvasItem = useCallback((item: FormStructureItem) => {
    if (item.type === 'field') {
      const field = item.data as FormField;
      return (
        <div className="p-3 bg-white border rounded-lg shadow-sm">
          <div className="font-medium text-sm">{field.label}</div>
          <div className="text-xs text-gray-500">{field.name} • {field.type}</div>
        </div>
      );
    }
    if (item.type === 'section') {
      const section = item.data as unknown as FormSection;
      return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-medium text-sm text-blue-800">{section.title}</div>
          <div className="text-xs text-blue-600">Section • {(section.fields || []).length} fields</div>
        </div>
      );
    }
    if (item.type === 'rowgroup') {
      const rg = item.data as RowGroup;
      return (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="font-medium text-sm text-purple-800">{rg.title}</div>
          <div className="text-xs text-purple-600">Row Group</div>
        </div>
      );
    }
    return null;
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    if (totalFieldCount > getMaxFormFields()) {
      toast({
        title: "Error",
        description: `Form cannot have more than ${getMaxFormFields()} fields due to database limitations`,
        variant: "destructive",
        duration: 5000
      });
      setIsLoading(false);
      return;
    }

    try {
      const selectedCategory = categoryList.find(c => c.category_name === config.category);

      const payload = {
        ...(isEdit && { service_id: parseInt(id!) }),
        service_name: config.title,
        category_id: selectedCategory?.category_id || null,
        service_description: config.description,
        approval_level: 1,
        image_url: "",
        nav_link: config.url.replace(/^\/+/, ''),
        active: 1,
        team_id: selectedAssignment || null,
        api_endpoint: config.apiEndpoint,
        form_json: {
          ...config,
          triggers: triggers, // Include triggers in form_json
          settings: serviceSettings, // Include settings in form_json
        },
        m_workflow_groups: selectedWorkflowGroup,
      };

      const response = await axios.post(`${API_URL}/hots_settings/insertupdate/service_catalog`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });

      toast({
        title: "Success",
        description: isEdit ? "Form updated successfully" : "Form created successfully",
        variant: "default",
        duration: 3000
      });

      navigate('/admin/service-catalog');

    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save form",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Hardware': '💻',
      'Software': '💾',
      'Support': '🛠️',
      'HRGA': '👥',
      'Marketing': '📢'
    };
    return iconMap[categoryName] || '📋';
  };

  const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
      'Hardware': 'bg-blue-100 text-blue-800',
      'Software': 'bg-green-100 text-green-800',
      'Support': 'bg-orange-100 text-orange-800',
      'HRGA': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800'
    };
    return colorMap[categoryName] || 'bg-gray-100 text-gray-800';
  };

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
            {config.category && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(config.category)}`}>
                <span className="mr-2">{getCategoryIcon(config.category)}</span>
                Form Preview
              </div>
            )}
          </div>
        </div>
        <DynamicForm
          config={config}
          setConfig={setConfig}
          onSubmit={(data) => {
            console.log("Form Data:", data);
            toast({
              title: "Form Submission Preview",
              description: JSON.stringify(data, null, 2),
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/service-catalog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {config.category && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(config.category)}`}>
                <span className="mr-2">{getCategoryIcon(config.category)}</span>
                {config.category}
              </div>
            )}
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Create'} Service Form</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">⚙️ Basic</TabsTrigger>
          <TabsTrigger value="form-builder">🛠️ Form Builder</TabsTrigger>
          <TabsTrigger value="workflow">🔄 Workflow</TabsTrigger>
          <TabsTrigger value="triggers">⚡ Triggers</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Form Title</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    placeholder="e.g., IT Support Request"
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL Path</Label>
                  <Input
                    id="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="e.g., /it-support"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={config.category} onValueChange={(value) => setConfig({ ...config, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryList.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_name}>
                          <span className="mr-2">{getCategoryIcon(category.category_name)}</span>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="Brief description of the form"
                  />
                </div>

                <div>
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={config.apiEndpoint}
                    onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                    placeholder="e.g., /api/it-support"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflowGroup">Workflow Group</Label>
                  <Select
                    value={selectedWorkflowGroup?.toString() || ''}
                    onValueChange={(value) => setSelectedWorkflowGroup(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow group" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowGroups
                        .filter(wg => wg.is_active && wg.id != null)
                        .map((workflowGroup) => (
                          <SelectItem key={workflowGroup.id} value={String(workflowGroup.id)}>
                            <div className="flex flex-col">
                              <span className="font-medium">{workflowGroup.name}</span>
                              <span className="text-sm text-gray-500">{workflowGroup.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the workflow group that will handle the approval process for this service.
                  </p>
                </div>

                {selectedWorkflowGroup && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Selected Workflow:</strong> {workflowGroups.find(wg => wg.id === selectedWorkflowGroup)?.name}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {workflowGroups.find(wg => wg.id === selectedWorkflowGroup)?.description}
                    </p>
                  </div>
                )}

                <div >
                  <Label htmlFor="workflowGroup">Assignment</Label>

                  <div className=" mt-2">
                    <Select
                      value={selectedAssignment?.toString() || ''}
                      onValueChange={(value) => setSelectedAssignment(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Task Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .slice() // create a shallow copy
                          .sort((a, b) => a.team_name.localeCompare(b.team_name))
                          .map((team) => (
                            <SelectItem key={team.team_id} value={team.team_id.toString()}>
                              <div className="flex flex-col text-start">
                                <span className="font-medium">{team.team_name}</span>
                                <span className="text-sm text-gray-500">Dept ID: {team.department_id} </span>
                              </div>
                            </SelectItem>
                          ))}

                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Select the task assignment that will handle the approval process for this service. Leaving this field blank will assign the task to the user.
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FORM BUILDER TAB - Unified Structure Editor */}
        <TabsContent value="form-builder" className="space-y-4">
          {/* Field count info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-sm text-blue-800">
                <strong>Database Mapping:</strong> {totalFieldCount} of {getMaxFormFields()} fields used
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Fields will be mapped to database columns automatically
              </p>
            </div>
            {totalFieldCount >= getMaxFormFields() && (
              <div className="text-red-600 text-sm font-medium">
                ⚠️ Maximum field limit reached
              </div>
            )}
          </div>

          {/* Enhanced Form Structure Editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Form Structure Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add fields, sections, row groups, and special elements. Click any element to configure its properties including visibility conditions and field rules.
              </p>
            </CardHeader>
            <CardContent>
              <UnifiedFormStructureEditor
                items={formStructure}
                onUpdate={handleStructureUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORKFLOW TAB */}
        <TabsContent value="workflow" className="h-[calc(100vh-300px)]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Visual Workflow Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              {workflowDefinition ? (
                <VisualWorkflowEditor
                  workflowDefinition={workflowDefinition}
                  onChange={setWorkflowDefinition}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No workflow definition found for this service.</p>
                    <p className="text-sm mt-2">Workflow will be created when you save.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRIGGERS TAB */}
        <TabsContent value="triggers" className="h-[calc(100vh-300px)]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Service Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              {id && (
                <div className="h-full">

                  <VisualTriggerBuilder
                    serviceId={parseInt(id)}
                    triggers={triggers}
                    onChange={(updated) => {
                      console.log("🔄 Triggers Updated:", updated);
                      setTriggers(updated);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceFormEditor;
