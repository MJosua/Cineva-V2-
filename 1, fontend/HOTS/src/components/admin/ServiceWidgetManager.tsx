
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Eye, Settings } from 'lucide-react';
import { getAllWidgets, getWidgetsByContext, getWidgetCategories } from '@/registry/widgetRegistry';
import { ServiceWidgetAssignment, WidgetConfig } from '@/types/widgetTypes';
import { useToast } from '@/hooks/use-toast';

interface ServiceWidgetManagerProps {
  serviceId: string;
  serviceName: string;
  currentWidgets?: string[];
  onSave: (assignment: ServiceWidgetAssignment) => void;
  onClose: () => void;
}

export const ServiceWidgetManager: React.FC<ServiceWidgetManagerProps> = ({
  serviceId,
  serviceName,
  currentWidgets = [],
  onSave,
  onClose
}) => {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(currentWidgets);
  const [activeTab, setActiveTab] = useState<string>('form');
  const { toast } = useToast();

  const categories = getWidgetCategories();
  const allWidgets = getAllWidgets();

  const handleWidgetToggle = (widgetId: string, checked: boolean) => {
    setSelectedWidgets(prev => {
      if (checked) {
        return [...prev, widgetId];
      } else {
        return prev.filter(id => id !== widgetId);
      }
    });
  };

  const handleSave = () => {
    const assignment: ServiceWidgetAssignment = {
      service_id: serviceId,
      widget_ids: selectedWidgets
    };

    onSave(assignment);

    toast({
      title: "Success",
      description: `Widgets updated for ${serviceName}`,
      variant: "default",
    });
  };

 

  const renderWidgetCard = (widget: WidgetConfig) => {
    const isSelected = selectedWidgets.includes(widget.id);
    return (
      <Card key={widget.id} className={`transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={widget.id}
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleWidgetToggle(widget.id, checked as boolean)
                }
              />
              <div>
                <CardTitle className="text-sm font-medium">
                  {widget.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {widget.description}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {widget.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-2">
            {widget.applicableTo.map(context => (
              <Badge key={context} variant="secondary" className="text-xs">
                {context.replace('_', ' ')}
              </Badge>
            ))}
          </div>
          {widget.dataRequirements && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Data: </span>
              {widget.dataRequirements.join(', ')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Widget Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure widgets for: <span className="font-medium">{serviceName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="form">Form Widgets</TabsTrigger>
          <TabsTrigger value="ticket_detail">Ticket Detail Widgets</TabsTrigger>
          <TabsTrigger value="all">All Widgets</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These widgets will appear before the form on the service request page.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getWidgetsByContext('form').map(renderWidgetCard)}
          </div>
        </TabsContent>

        <TabsContent value="ticket_detail" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These widgets will appear after the request information on the ticket detail page.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getWidgetsByContext('ticket_detail').map(renderWidgetCard)}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-lg font-medium mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allWidgets
                  .filter(widget => widget.category === category)
                  .map(renderWidgetCard)
                }
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Selected Widgets Summary</span>
        </div>
        <p className="text-sm text-blue-700">
          {selectedWidgets.length === 0 ? 'No widgets selected' :
            `${selectedWidgets.length} widget${selectedWidgets.length === 1 ? '' : 's'} selected`}
        </p>
        {selectedWidgets.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedWidgets.map(widgetId => {
              const widget = allWidgets.find(w => w.id === widgetId);
              return widget ? (
                <Badge key={widgetId} variant="default" className="text-xs">
                  {widget.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
