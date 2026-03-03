// Extended widget types for dynamic data fetching
export interface WidgetDataSource {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  transform?: string; // Function name for data transformation
  cacheKey?: string;
  dependencies?: string[];
  condition?: string; // Condition to check before fetching
}

export interface WidgetDataConfig {
  dataSources: WidgetDataSource[];
  cacheTime?: number;
  refetchOnMount?: boolean;
  enabled?: boolean;
}

export interface ServiceDataConfiguration {
  serviceId: number;
  dataConfigs: {
    [widgetId: string]: WidgetDataConfig;
  };
}

// Data transformation functions registry
export type DataTransformer = (data: any, context?: any) => any;

export interface DataTransformerRegistry {
  [key: string]: DataTransformer;
}

// Context for dynamic parameter resolution
export interface DataContext {
  formData?: any;
  ticketData?: any;
  userData?: any;
  serviceInfo?: any;
  currentDateRange?: {
    start: Date;
    end: Date;
  };
  [key: string]: any;
}