
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, RefreshCw, Settings } from 'lucide-react';
import { FormConfig } from '@/types/formTypes';

interface ServiceCatalogTableProps {
  forms: FormConfig[];
  serviceCatalog: any[];
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
  onReload: () => void;
  onWidgetConfig?: (formId: string) => void;
  isDeleting: boolean;
  isReloading: boolean;
}

export const ServiceCatalogTable: React.FC<ServiceCatalogTableProps> = ({
  forms,
  serviceCatalog,
  onEdit,
  onDelete,
  onReload,
  onWidgetConfig,
  isDeleting,
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
              {forms.sort( (a,b) => b.servis_aktif - a.servis_aktif).map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">
                    {form.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{form.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={form.servis_aktif === 1 ? "default" : "secondary"}
                    >
                      {form.servis_aktif === 1 ? "Active" : "Inactive"}
                    </Badge>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(form.id!)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
