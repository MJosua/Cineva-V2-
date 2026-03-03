import { useMemo } from 'react';
import { useWidgetData, resolveParams } from './useWidgetData';
import { getWidgetDataConfig, defaultWidgetDataConfig } from '@/config/widgetDataConfigurations';
import { getDataTransformer } from '@/utils/dataTransformers';
import { DataContext } from '@/types/widgetDataTypes';

interface UseServiceWidgetDataOptions {
  serviceId: number;
  widgetId: string;
  context: DataContext;
  enabled?: boolean;
}

export const useServiceWidgetData = ({
  serviceId,
  widgetId,
  context,
  enabled = true,
}: UseServiceWidgetDataOptions) => {
  // Get widget configuration for this service
  const widgetConfig = useMemo(() => {
    const config = getWidgetDataConfig(serviceId, widgetId) || defaultWidgetDataConfig;
    
    // Debug logging
    console.log('🔧 [Widget Data] Configuration lookup:', {
      serviceId,
      widgetId,
      configFound: !!getWidgetDataConfig(serviceId, widgetId),
      config: config,
      enabled: config.enabled
    });
    
    return config;
  }, [serviceId, widgetId]);

  // Prepare data sources with resolved parameters
  const resolvedDataSources = useMemo(() => {
    if (!enabled || !widgetConfig.enabled) {
      // console.log('🔧 [Widget Data] Skipping data sources - disabled:', { enabled, configEnabled: widgetConfig.enabled });
      return [];
    }

    const resolved = widgetConfig.dataSources.map(source => {
      // Check condition if specified
      if (source.condition) {
        const conditionValue = resolveParams({ condition: source.condition }, context).condition;
        console.log('🔧 [Widget Data] Condition check:', {
          condition: source.condition,
          resolved: conditionValue,
          passed: !!conditionValue
        });
        if (!conditionValue) return null;
      }

      // Resolve dynamic parameters
      const resolvedParams = source.params ? resolveParams(source.params, context) : {};
      
      // Check if all required dependencies are available
      if (source.dependencies) {
        const hasAllDependencies = source.dependencies.every(dep => {
          const resolved = resolveParams({ [dep]: `{${dep}}` }, context);
          return resolved[dep] !== undefined && resolved[dep] !== null;
        });
        
        console.log('🔧 [Widget Data] Dependencies check:', {
          dependencies: source.dependencies,
          hasAll: hasAllDependencies,
          context: context
        });
        
        if (!hasAllDependencies) return null;
      }

      // Resolve cache key with context
      let resolvedCacheKey = source.cacheKey;
      if (resolvedCacheKey && resolvedCacheKey.includes('{')) {
        const cacheKeyParams = resolveParams({ key: resolvedCacheKey }, context);
        resolvedCacheKey = cacheKeyParams.key;
      }

      // Get data transformer
      const transformer = getDataTransformer(source.transform);

      console.log('🔧 [Widget Data] Data source resolved:', {
        endpoint: source.endpoint,
        params: resolvedParams,
        cacheKey: resolvedCacheKey
      });

      return {
        endpoint: source.endpoint,
        method: source.method || 'GET',
        params: resolvedParams,
        transform: (data: any) => transformer(data, context),
        cacheKey: resolvedCacheKey || `${source.endpoint}_${JSON.stringify(resolvedParams)}`,
        dependencies: source.dependencies,
      };
    }).filter(Boolean);

    console.log('🔧 [Widget Data] Final resolved data sources:', {
      count: resolved.length,
      sources: resolved.map(s => ({ endpoint: s?.endpoint, params: s?.params }))
    });

    return resolved;
  }, [widgetConfig, context, enabled]);

  // Use the generic widget data hook
  const result = useWidgetData({
    dataSources: resolvedDataSources,
    enabled: enabled && widgetConfig.enabled && resolvedDataSources.length > 0,
    refetchOnMount: widgetConfig.refetchOnMount,
    cacheTime: widgetConfig.cacheTime,
  });

  // Transform the data into a more convenient format
  const transformedData = useMemo(() => {
    if (!result.data || Object.keys(result.data).length === 0) return {};

    const transformed: Record<string, any> = {};
    
    widgetConfig.dataSources.forEach((source, index) => {
      const cacheKey = resolvedDataSources[index]?.cacheKey;
      if (cacheKey && result.data[cacheKey]) {
        transformed[source.id] = result.data[cacheKey];
      }
    });

    console.log('🔧 [Widget Data] Transformed data:', {
      originalKeys: Object.keys(result.data),
      transformedKeys: Object.keys(transformed),
      hasData: Object.keys(transformed).length > 0
    });

    return transformed;
  }, [result.data, widgetConfig.dataSources, resolvedDataSources]);

  return {
    ...result,
    data: transformedData,
    hasData: Object.keys(transformedData).length > 0,
    config: widgetConfig,
  };
};

// Hook for pre-loading data before rendering widgets
export const usePreloadServiceData = (serviceId: number, widgetIds: string[], context: DataContext) => {
  const results = widgetIds.map(widgetId => 
    useServiceWidgetData({
      serviceId,
      widgetId,
      context,
      enabled: true,
    })
  );

  const allLoaded = results.every(result => !result.loading);
  const hasErrors = results.some(result => result.error);
  const allErrors = results.map(result => result.error).filter(Boolean);

  return {
    allLoaded,
    hasErrors,
    errors: allErrors,
    results: results.reduce((acc, result, index) => {
      acc[widgetIds[index]] = result;
      return acc;
    }, {} as Record<string, any>),
  };
};
