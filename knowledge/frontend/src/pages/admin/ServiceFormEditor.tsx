import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { FormConfig, FormField, FormSection, RowGroup, FormItem } from '@/types/formTypes';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { useCatalogData } from '@/hooks/useCatalogData';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTeams, fetchWorkflowGroups } from '@/store/slices/userManagementSlice';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { getMaxFormFields } from '@/utils/formFieldMapping';
import { UnifiedFormStructureEditor, FormStructureItem } from '@/components/forms/UnifiedFormStructureEditor';
import TriggerActionsEditor, { TriggerConfig } from '@/components/workflow/TriggerActionsEditor';

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
  const [triggers, setTriggers] = useState<TriggerConfig[]>([]);

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

  useEffect(() => {
    if (isEdit && id && serviceCatalog.length > 0) {
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
          items: [], // Initialize unified array
          servis_aktif: Number(serviceData.active) ?? 0,
          active: Number(serviceData.active) ?? 0
        };

        if (serviceData.form_json) {
          try {
            const jsonConfig = JSON.parse(serviceData.form_json);
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
        setFormStructure(parsedConfig.items)
        if (serviceData.m_workflow_groups) {
          setSelectedWorkflowGroup(serviceData.m_workflow_groups);
        }
        if (serviceData.team_id) {
          setSelectedAssignment(serviceData.team_id)
        }

        // Load triggers for this service
        loadTriggers(serviceData.service_id);
      }
    } else if (!isEdit) {
      const defaultWorkflow = workflowGroups.find(wg => wg.name?.toLowerCase().includes('direct superior') || wg.name?.toLowerCase().includes('default'));
      if (defaultWorkflow) {
        setSelectedWorkflowGroup(defaultWorkflow.id);
      }
    }
  }, [isEdit, id, serviceCatalog, categoryList, workflowGroups]);

  const { toast } = useToast();

  // Load triggers from database
  const loadTriggers = async (serviceId: number) => {
    try {
      const response = await axios.get(`${API_URL}/hots_settings/triggers/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
      if (response.data && Array.isArray(response.data)) {
        const loadedTriggers: TriggerConfig[] = response.data.map((t: any) => ({
          trigger_name: t.trigger_name,
          trigger_type: t.trigger_type || 'event',
          actions: t.trigger_config?.actions || [],
          active: t.active === 1,
        }));
        setTriggers(loadedTriggers);
      }
    } catch (error) {
      console.log('No triggers found or error loading:', error);
    }
  };

  // Save triggers to database
  const saveTriggers = async (serviceId: number) => {
    // Validate triggers before saving
    if (triggers.length > 0) {
      try {
        const validation = await axios.post(`${API_URL}/hots_settings/validate_triggers`, {
          triggers: triggers.map(t => ({
            trigger_name: t.trigger_name,
            trigger_type: t.trigger_type,
            trigger_config: { actions: t.actions },
          }))
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
        });

        if (!validation.data.valid) {
          const errorMessages = validation.data.errors.map((e: any) =>
            `• ${e.message}`
          ).join('\n');

          toast({
            title: "❌ Trigger Validation Failed",
            description: errorMessages,
            variant: "destructive",
            duration: 8000
          });
          throw new Error('Validation failed');
        }
      } catch (error: any) {
        if (error.message === 'Validation failed') throw error;
        console.error('Validation request failed:', error);
        // Continue saving even if validation endpoint fails
      }
    }

    try {
      await axios.post(`${API_URL}/hots_settings/triggers/${serviceId}`, {
        triggers: triggers.map(t => ({
          trigger_name: t.trigger_name,
          trigger_type: t.trigger_type,
          trigger_config: { actions: t.actions },
          active: t.active ? 1 : 0,
        }))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tokek')}` }
      });
    } catch (error) {
      console.error('Error saving triggers:', error);
      throw error;
    }
  };

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
        form_json: config, // This now includes the unified items array
        m_workflow_groups: selectedWorkflowGroup,
      };

      const response = await axios.post(`${API_URL}/hots_settings/insertupdate/service_catalog`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tokek')}`,
        }
      });

      // Save triggers if we have a service ID
      const serviceId = isEdit ? parseInt(id!) : response.data?.service_id;
      if (serviceId && triggers.length > 0) {
        await saveTriggers(serviceId);
      }

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
      <AppLayout>
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
              toast({
                title: "Form Submitted",
                description: JSON.stringify(data, null, 2),
              });
            }}
          />



        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
            <TabsTrigger value="structure">Form Structure</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
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

                        {console.log("workflowGroups", workflowGroups)}
                        {workflowGroups
                          .filter(wg => wg.is_active)
                          .map((workflowGroup) => (
                            <SelectItem key={workflowGroup.workflow_id} value={workflowGroup.workflow_id.toString()}>
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

          <TabsContent value="structure" className="space-y-6">
            {/* Field count warning */}
            {totalFieldCount > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Database Mapping:</strong> {totalFieldCount} of {getMaxFormFields()} fields used
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Fields will be mapped to database columns automatically
                      </p>
                    </div>
                    {totalFieldCount >= getMaxFormFields() && (
                      <div className="text-red-600 text-sm font-medium">
                        ⚠️ Maximum field limit reached
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Unified Form Structure</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag and drop to reorder fields, sections, and row groups. Each element can be configured individually.
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

          <TabsContent value="triggers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Triggers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure actions that run automatically when specific events occur (e.g., on approval, status change).
                </p>
              </CardHeader>
              <CardContent>
                <TriggerActionsEditor
                  triggers={triggers}
                  onTriggersChange={setTriggers}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ServiceFormEditor;
