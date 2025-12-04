
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { FormConfig } from '@/types/formTypes';
import { ServiceWidgetAssignment } from '@/types/widgetTypes';
import { useCatalogData } from '@/hooks/useCatalogData';
import { FormSkeleton } from '@/components/ui/FormSkeleton';
import { ServiceCatalogHeader } from '@/components/admin/ServiceCatalogHeader';
import { ServiceCatalogSearch } from '@/components/admin/ServiceCatalogSearch';
import { ServiceCatalogTable } from '@/components/admin/ServiceCatalogTable';
import { DeleteServiceDialog } from '@/components/admin/DeleteServiceDialog';
import { ServiceWidgetManager } from '@/components/admin/ServiceWidgetManager';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchWorkflowGroups } from '@/store/slices/userManagementSlice';

const ServiceCatalogAdmin = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    serviceId: string;
    serviceName: string;
    value?: any;
  }>({
    isOpen: false,
    serviceId: '',
    serviceName: '',
    value: null
  });

  // Widget management state
  const [widgetModal, setWidgetModal] = useState<{
    isOpen: boolean;
    serviceId: string;
    serviceName: string;
    currentWidgets: string[];
  }>({
    isOpen: false,
    serviceId: '',
    serviceName: '',
    currentWidgets: []
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const {
    serviceCatalog,
    categoryList,
    isLoading,
    error,
    fetchData
  } = useCatalogData();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Fetch real data from API on component mount
  useEffect(() => {
    fetchData();
    dispatch(fetchWorkflowGroups());
  }, [dispatch]);

  const forms: FormConfig[] = serviceCatalog.map(service => {
    let parsedConfig: any = {};
    try {
      if (service.form_json) {
        parsedConfig = JSON.parse(service.form_json);
      }
    } catch (error) {
      console.error(`Failed to parse form_json for service ${service.service_id}:`, error);
    }
  
    return {
      ...parsedConfig,
      id: service.service_id.toString(),
      title: parsedConfig?.title || service.service_name,
      url: parsedConfig?.url || `/${service.nav_link}`,
      servis_aktif: Number(service.active) || 0, // ← force DB value
      category: categoryList.find(cat => cat.category_id === service.category_id)?.category_name || 'Unknown',
      description: parsedConfig?.description || service.service_description,
      apiEndpoint: parsedConfig?.apiEndpoint || `/api/${service.nav_link}`,
      approval: parsedConfig?.approval || {
        steps: service.approval_level > 0 ? ['Manager', 'Supervisor'] : [],
        mode: 'sequential' as const
      },
      fields: parsedConfig?.fields || [],
      rowGroups: parsedConfig?.rowGroups || []
    };
  });

  const filteredForms = forms.filter(form =>
    form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (formId: string) => {
    navigate(`/admin/service-catalog/edit/${formId}`);
  };

  const handleDeleteClick = (formId: string) => {
    const service = serviceCatalog.find(s => s.service_id.toString() === formId);
    if (service) {
      setDeleteModal({
        isOpen: true,
        serviceId: formId,
        serviceName: service.service_name,
        value: service.active
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.serviceId) return;

    setIsDeleting(true);

    try {
      const response = await axios.post(
        `${API_URL}/hots_settings/toggle/service/${deleteModal.serviceId}/${deleteModal.value}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('tokek')}`,
          }
        }
      );

      toast({
        title: "Success",
        description: `Service "${deleteModal.serviceName}" has been deleted successfully`,
        variant: "default",
        duration: 3000
      });

      fetchData();

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete service",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, serviceId: '', serviceName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, serviceId: '', serviceName: '' });
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await fetchData();
      toast({
        title: "Success",
        description: "Service catalog data refreshed successfully",
        variant: "default",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleCreate = () => {
    navigate('/admin/service-catalog/create');
  };

  // Widget management handlers
  const handleWidgetConfig = (formId: string) => {
    const service = serviceCatalog.find(s => s.service_id.toString() === formId);
    console.log("service", service)
    if (service) {
      setWidgetModal({
        isOpen: true,
        serviceId: formId,
        serviceName: service.service_name,
        currentWidgets: Array.isArray(service.widget)
          ? service.widget
          : typeof service.widget === 'string'
            ? JSON.parse(service.widget || '[]')
            : [] // Get widgets from database
      });
    }
  };

  const handleWidgetSave = async (assignment: ServiceWidgetAssignment) => {
    try {
      // Save widget assignment to database
      const response = await axios.put(
        `${API_URL}/hots_settings/update/widget/${assignment.service_id}`,
        { widget_ids: assignment.widget_ids },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('tokek')}`,
          }
        }
      );

      if (response.data.success) {
        // Update local state
        fetchData();
        setWidgetModal({ isOpen: false, serviceId: '', serviceName: '', currentWidgets: [] });

        toast({
          title: "Success",
          description: "Widget configuration saved successfully",
          variant: "default",
          duration: 3000
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save widget configuration",
          variant: "destructive",
          duration: 5000
        });
        throw new Error(response.data.message || 'Failed to save widget configuration');

      }
    } catch (error: any) {
      console.error('Widget save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save widget configuration",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleWidgetCancel = () => {
    setWidgetModal({ isOpen: false, serviceId: '', serviceName: '', currentWidgets: [] });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')} disabled>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Catalog Admin</h1>
                <p className="text-gray-600">Manage dynamic service forms and their configurations</p>
              </div>
            </div>
            <Button disabled className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Form Search</CardTitle>
              <Input
                placeholder="Search forms by title or category..."
                disabled
              />
            </CardHeader>
          </Card>

          <FormSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">Error loading catalog: {error}</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <ServiceCatalogHeader
          onReload={handleReload}
          onCreate={handleCreate}
          isReloading={isReloading}
        />

        <ServiceCatalogSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ServiceCatalogTable
          forms={filteredForms}
          serviceCatalog={serviceCatalog}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onReload={handleReload}
          onWidgetConfig={handleWidgetConfig}
          isDeleting={isDeleting}
          isReloading={isReloading}
        />

        <DeleteServiceDialog
          isOpen={deleteModal.isOpen}
          serviceName={deleteModal.serviceName}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        <Dialog open={widgetModal.isOpen} onOpenChange={() => handleWidgetCancel()}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Service Widget Configuration</DialogTitle>
            </DialogHeader>
            {widgetModal.isOpen && (
              <ServiceWidgetManager
                serviceId={widgetModal.serviceId}
                serviceName={widgetModal.serviceName}
                currentWidgets={widgetModal.currentWidgets}
                onSave={handleWidgetSave}
                onClose={handleWidgetCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ServiceCatalogAdmin;
