import React, { useEffect, useState } from 'react';
import { DynamicForm } from './DynamicForm';
import { FormSkeleton } from '@/components/ui/FormSkeleton';
import { useCatalogData } from '@/hooks/useCatalogData';
import { FormConfig } from '@/types/formTypes';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { Skeleton } from '../ui/skeleton';

interface CatalogFormLoaderProps {
  servicePath: string;
  onSubmit: (data: any) => void;
}

// Default fallback form configuration for services with invalid JSON
const getDefaultFormConfig = (serviceName: string, servicePath: string): FormConfig => ({
  url: `/${servicePath}`,
  title: serviceName,
  description: "Please provide the following information for your request.",
  category: "General", // Add missing category
  fields: [
    {
      label: "Subject*",
      name: "subject",
      type: "text",
      placeholder: "Enter the subject of your request",
      required: true,
      columnSpan: 3
    },
    {
      label: "Priority",
      name: "priority",
      type: "select",
      options: ["High", "Medium", "Low"],
      required: true,
      columnSpan: 1
    },
    {
      label: "Category",
      name: "category",
      type: "select",
      options: ["General", "Technical", "Administrative"],
      required: true,
      columnSpan: 1
    },
    {
      label: "Department",
      name: "department",
      type: "text",
      placeholder: "Your department",
      required: false,
      columnSpan: 1
    },
    {
      label: "Description*",
      name: "description",
      type: "textarea",
      placeholder: "Please provide a detailed description of your request",
      required: true,
      columnSpan: 3
    },
    {
      label: "Attachment",
      name: "attachment",
      type: "file",
      accept: ["image/*", "pdf", "docx"],
      maxSizeMB: 5,
      required: false,
      columnSpan: 3
    }
  ],
  approval: {
    steps: ["Supervisor"],
    mode: "sequential" as const
  }
});

export const CatalogFormLoader: React.FC<CatalogFormLoaderProps> = ({ servicePath, onSubmit }) => {
  const navigate = useNavigate();
  const { serviceCatalog, categoryList, isLoading: catalogLoading, fetchData } = useCatalogData();
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const { loading } = useAppSelector(state => state.sku);

  useEffect(() => {
    fetchData();
  }, []);

  const handleReload = async () => {
    await fetchData()
  }





  useEffect(() => {
    if (!catalogLoading && serviceCatalog.length > 0) {
      const service = serviceCatalog.find(s => s.nav_link === servicePath);

      if (!service) {
        setError(`Service not found for path: ${servicePath}`);
        setIsLoading(false);
        return;
      }

      setServiceInfo(service);

      // Try to parse form_json, fall back to default if invalid
      if (service.form_json) {
        try {
          let parsedConfig;

          if (typeof service.form_json === 'object') {
            parsedConfig = service.form_json;
          } else if (typeof service.form_json === 'string' && service.form_json.trim() !== '') {
            parsedConfig = JSON.parse(service.form_json);
          } else {
            throw new Error("Empty or invalid form_json string");
          }

          setFormConfig(parsedConfig);
          setUsingFallback(false);
          setError(null);
        } catch (parseError) {
          console.warn(`Invalid form_json for service ${service.service_id}, using fallback form:`, parseError);
          // Use default form configuration
          const defaultConfig = getDefaultFormConfig(service.service_name, servicePath);
          setFormConfig(defaultConfig);
          setUsingFallback(true);
          setError(null);
        }
      } else {
        console.warn(`No form_json for service ${service.service_id}, using fallback form`);
        // Use default form configuration
        const defaultConfig = getDefaultFormConfig(service.service_name, servicePath);
        setFormConfig(defaultConfig);
        setUsingFallback(true);
        setError(null);
      }

      setIsLoading(false);
    }
  }, [catalogLoading, serviceCatalog, servicePath]);

  const getCategoryIcon = (categoryId: number) => {
    const category = categoryList.find(cat => cat.category_id === categoryId);
    const iconMap: { [key: string]: string } = {
      'Hardware': '💻',
      'Software': '💾',
      'Support': '🛠️',
      'HRGA': '👥',
      'Marketing': '📢'
    };
    return iconMap[category?.category_name || ''] || '📋';
  };

  const [delayedLoading, setDelayedLoading] = useState(false)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isLoading || !loading) {
      // wait 1 second before hiding skeleton
      timer = setTimeout(() => setDelayedLoading(false), 250);
    } else {
      // reset to true if loading again
      setDelayedLoading(true);
    }

    return () => clearTimeout(timer);
  }, [isLoading, loading]);

  const getCategoryColor = (categoryId: number) => {
    const category = categoryList.find(cat => cat.category_id === categoryId);
    const colorMap: { [key: string]: string } = {
      'Hardware': 'md:bg-blue-100 text-blue-800',
      'Software': 'md:bg-green-100 text-green-800',
      'Support': 'md:bg-orange-100 text-orange-800',
      'HRGA': 'md:bg-purple-100 text-purple-800',
      'Marketing': 'md:bg-pink-100 text-pink-800'
    };
    return colorMap[category?.category_name || ''] || 'md:bg-gray-100 text-gray-800';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categoryList.find(cat => cat.category_id === categoryId);
    return category?.category_name || 'Unknown';
  };

  if (delayedLoading) {
    return <FormSkeleton />;
  }




  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/service-catalog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Service Catalog
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/service-catalog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Service Catalog
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Form configuration not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex justify-start w-full md:w-auto">
          <Button variant="outline" onClick={() => navigate('/service-catalog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Back to Service Catalog</span>
            <span className="inline md:hidden">Back</span>
          </Button>
        </div>
        {serviceInfo && (
          <div className={`w-full md:w-auto text-center md:text-left px-4 py-2 md:rounded-full text-lg md:text-sm font-bold md:font-medium ${getCategoryColor(serviceInfo.category_id)}`}>
            <span className="mr-2 hidden md:inline">{getCategoryIcon(serviceInfo.category_id)}</span>
            {getCategoryName(serviceInfo.category_id)} - {serviceInfo.service_name}
          </div>
        )}
        {usingFallback && (
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full self-center md:self-auto">
            Using Default Form
          </div>
        )}
      </div>


      {
        loading ?
          <>
          </>
          :
          <>
            <DynamicForm
              config={formConfig}
              setConfig={setFormConfig}
              onSubmit={onSubmit}
              serviceId={serviceInfo?.service_id?.toString()}
              moduleKey={serviceInfo?.service_name}
              handleReload={handleReload}
            />
          </>

      }


    </div>
  );
};
