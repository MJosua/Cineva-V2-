
import React, { Suspense, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createLazyWidget } from '@/utils/loadWidgetComponent';
import { WidgetConfig, WidgetProps } from '@/types/widgetTypes';
import { useServiceWidgetData } from '@/hooks/useServiceWidgetData';
import { DataContext } from '@/types/widgetDataTypes';
import { excludedWidgets } from '@/config/widgetDataConfigurations';

interface WidgetRendererProps {
  config: WidgetConfig;
  data?: WidgetProps;
  className?: string;
  serviceId?: number;
  context?: DataContext;
  handleReload?: () => void;
}

const WidgetSkeleton = () => (
  <Card className="mb-6">
    <CardContent className="p-6">
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
      <div className="flex space-x-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

const WidgetError = ({ error, widgetName }: { error: string; widgetName: string }) => (
  <Alert className="mb-6 border-orange-200 bg-orange-50">
    <AlertDescription className="text-orange-800">
      Widget "{widgetName}" could not be loaded: {error}
    </AlertDescription>
  </Alert>
);

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  config,
  data = {},
  className = "",
  serviceId,
  context,
  handleReload
}) => {
  const LazyWidget = useMemo(() => {
    try {

      return createLazyWidget(config.componentPath);
    } catch (error) {
      console.error(`Failed to create lazy widget for ${config.name}:`, error);
      return null;
    }
  }, [config.componentPath, config.name]);

  // Check if this widget should be excluded from dynamic data fetching
  const isExcluded = excludedWidgets.has(config.id);

  // Debug logging for widget data fetching
  // console.log('🔧 [Widget Renderer] Processing widget:', {
  //   widgetId: config.id,
  //   serviceId,
  //   hasContext: !!context,
  //   isExcluded,
  //   shouldFetchData: !!(serviceId && context && !isExcluded)
  // });

  // Use dynamic data fetching if serviceId and context are provided and not excluded
  const {
    data: widgetData,
    loading: isDataLoading,
    error: dataError,
    hasData,
  } = useServiceWidgetData({
    serviceId: serviceId || 0,
    widgetId: config.id,
    context: context || {},
    
    enabled: !!(serviceId && context && !isExcluded),
  });

  if (!LazyWidget) {
    return <WidgetError error="Component creation failed" widgetName={config.name} />;
  }

  // Show loading state while data is being fetched (only for non-excluded widgets)
  if (isDataLoading && serviceId && context && !isExcluded) {
    console.log('🔧 [Widget Renderer] Showing loading state for:', config.id);
    return <WidgetSkeleton />;
  }

  // Show error if data fetching failed
  if (dataError) {
    console.error('🔧 [Widget Renderer] Data error for widget:', config.id, dataError);
    return <WidgetError error={dataError} widgetName={config.name} />;
  }

  const widgetProps: WidgetProps = {
    ...data,
    ...config.props,
    widgetId: config.id,
    widgetName: config.name,
    // Pass the dynamically fetched data
    widgetData: hasData ? widgetData : undefined,
    isLoading: isDataLoading,
    error: dataError,
    handleReload
  };

  // console.log('🔧 [Widget Renderer] Final widget props:', {
  //   widgetId: config.id,
  //   hasWidgetData: !!widgetProps.widgetData,
  //   widgetDataKeys: widgetProps.widgetData ? Object.keys(widgetProps.widgetData) : [],
  //   isLoading: widgetProps.isLoading
  // });

  return (
    <div className={`widget-container ${className}`} data-widget-id={config.id}>
      <Suspense fallback={<WidgetSkeleton />}>
        <LazyWidget {...widgetProps} />
      </Suspense>
    </div>
  );
};

export default WidgetRenderer;
