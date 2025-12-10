import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Edit, RefreshCw, Settings } from 'lucide-react';
import { FormConfig } from '@/types/formTypes';

interface ServiceCatalogTableProps {
  forms: FormConfig[];
  serviceCatalog: any[];
  onEdit: (formId: string) => void;
  onToggleActive: (formId: string, currentActive: number) => void;
  onReload: () => void;
  onWidgetConfig?: (formId: string) => void;
  isToggling?: boolean;
  isReloading: boolean;
}

export const ServiceCatalogTable: React.FC<ServiceCatalogTableProps> = ({
  forms,
  serviceCatalog,
  onEdit,
  onToggleActive,
  onReload,
  onWidgetConfig,
  isToggling,
  isReloading
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Form Configurations ({forms.length})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onReload}
          disabled={isReloading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.sort((a, b) => (b.servis_aktif || 0) - (a.servis_aktif || 0)).map((form) => (
                <TableRow key={form.id} className={form.servis_aktif !== 1 ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    {form.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{form.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.servis_aktif === 1}
                        onCheckedChange={() => onToggleActive(form.id!, form.servis_aktif || 0)}
                        disabled={isToggling}
                      />
                      <span className={`text-xs ${form.servis_aktif === 1 ? 'text-green-600' : 'text-gray-500'}`}>
                        {form.servis_aktif === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {form.url}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(form.id!)}
                        className="h-8 w-8 p-0"
                        title="Edit Service"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {onWidgetConfig && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onWidgetConfig(form.id!)}
                          className="h-8 w-8 p-0"
                          title="Configure Widgets"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {forms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No forms found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
