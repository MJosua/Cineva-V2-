
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceCatalogHeaderProps {
  onReload: () => void;
  onCreate: () => void;
  isReloading: boolean;
}

export const ServiceCatalogHeader: React.FC<ServiceCatalogHeaderProps> = ({
  onReload,
  onCreate,
  isReloading
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog Admin</h1>
          <p className="text-gray-600">Manage dynamic service forms and their configurations</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onReload} 
          disabled={isReloading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
        <Button onClick={onCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Form
        </Button>
      </div>
    </div>
  );
};
