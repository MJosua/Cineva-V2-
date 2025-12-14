
export interface WidgetPreset {
  id: string;
  name: string;
  description: string;
  componentPath: string;
  applicableTo: ('form' | 'ticket_detail' | 'cms')[];
  dataRequirements?: string[];
  category?: string;
}

export interface ServiceWidgetAssignment {
  service_id: string;
  widget_ids: string[];
}

export interface WidgetProps {
  data?: any;
  handleUpdateData?: (data: any) => void;
  serviceInfo?: any;
  widgetId?: string;
  widgetName?: string;
  ticketData?: any;
  currentDateRange?: {
    start: Date;
    end: Date;
  };
  // Dynamic data passed from the data management system
  widgetData?: Record<string, any>;
  // Loading and error states
  isLoading?: boolean;
  error?: string | null;
  handleReload?: () => void;

  formData?: Record<string, any>;
  setGlobalValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  userData?: Record<string, any>;
  serviceId?: string | number;

}

export interface WidgetConfig extends WidgetPreset {
  props?: WidgetProps;
}


export interface meetingroomwidgetdata {
  ticketdata?: any;
  cstm_col?: any;
  lbl_col?: any;
  order_col?: any;
}
