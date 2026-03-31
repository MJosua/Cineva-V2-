import { WidgetConfig } from '@/types/widgetTypes';

// Extended WidgetConfig with optional serviceIds for service-specific widgets
interface ExtendedWidgetConfig extends WidgetConfig {
  serviceIds?: number[]; // If set, widget only shows for these service IDs
  displayOrder?: number; // Optional display order (lower = first)
}

// Widget registry - all available widgets are listed here
export const widgetRegistry: Record<string, ExtendedWidgetConfig> = {
  gantt_room_schedule: {
    id: "gantt_room_schedule",
    name: "Room Usage Gantt Chart",
    description: "Display current week's room usage as a Gantt chart",
    componentPath: "GanttRoomUsage",
    applicableTo: ["form"],
    dataRequirements: ["roomData", "scheduleData"],
    category: "Scheduling"
  },

  gantt_room_schedule_static: {
    id: "gantt_room_schedule_static",
    name: "Room Usage Gantt Chart Static",
    description: "Display current week's room usage as a Gantt chart",
    componentPath: "GanttRoomUsageStatic",
    applicableTo: ["ticket_detail"],
    dataRequirements: ["roomData", "scheduleData"],
    category: "Scheduling"
  },

  stock_overview: {
    id: "stock_overview",
    name: "Stock Overview",
    description: "Show real-time item stock status",
    componentPath: "StockOverview",
    applicableTo: ["form"],
    dataRequirements: ["stockData"],
    category: "Inventory"
  },
  team_workload: {
    id: "team_workload",
    name: "Team Workload Chart",
    description: "Display current team workload and capacity",
    componentPath: "TeamWorkload",
    applicableTo: ["form", "ticket_detail"],
    dataRequirements: ["teamData", "workloadData"],
    category: "Analytics"
  },


  default_item_download: {
    id: "default_item_download",
    name: "Default item download",
    description: "Display template for download",
    componentPath: "Default_item_download",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Template"
  },

  recent_requests: {
    id: "recent_requests",
    name: "Recent Similar Requests",
    description: "Show recent requests of the same type",
    componentPath: "RecentRequests",
    applicableTo: ["form"],
    dataRequirements: ["historyData"],
    category: "History"
  },

  Fetchsrfdata: {
    id: "Fetchsrfdata",
    name: "Fetch SRF Data",
    description: "Just Fetching",
    componentPath: "Fetchsrfdata",
    applicableTo: ["form"],
    dataRequirements: ["sku"],
    category: "Template"
  },

  FetchInventoryData: {
    id: "FetchInventoryData",
    name: "Fetch Inventory / POSM Data",
    description: "Modularly fetches inventory data (POSM) for dynamic forms",
    componentPath: "FetchInventoryData",
    applicableTo: ["form"],
    dataRequirements: ["inventory"],
    category: "Template"
  },

  job_applicants_table: {
    id: "job_applicants_table",
    name: "Job Applicants Table",
    description: "Display and manage job applicants for HR review",
    componentPath: "JobApplicantsTable",
    applicableTo: ["ticket_detail"],
    dataRequirements: ["applicationData"],
    category: "Job Marketplace"
  },



  // SRF-specific widgets (service_id = 6)
  // Using unified container with split layout for main area

  srf_workflow_container: {
    id: "srf_workflow_container",
    name: "SRF Work Tools",
    description: "Unified SRF workflow: Factory, Category, Number (left) + Documents (right)",
    componentPath: "SRFWorkflowContainer",
    applicableTo: ["assignment_detail", "ticket_detail"],
    dataRequirements: ["ticketData"],
    category: "SRF Tools",
    serviceIds: [6], // Only for SRF service
    displayOrder: 1  // Single unified widget
  },

  // Invoice widget - shown separately in sidebar (filtered by AssignmentDetailPage)
  srf_invoice_input: {
    id: "srf_invoice_input",
    name: "SRF Invoice Input",
    description: "Input and manage invoice numbers for SRF tickets",
    componentPath: "SRFInvoiceInput",
    applicableTo: ["assignment_detail", "ticket_detail"],
    dataRequirements: ["ticketData"],
    category: "SRF Tools",
    serviceIds: [6], // Only for SRF service
    displayOrder: 10  // Sidebar placement
  },

  detail_table: {
    id: "detail_table",
    name: "Detail Table Widget",
    description: "Editable table for line item details",
    componentPath: "DetailTableWidget",
    applicableTo: ["form"],
    dataRequirements: ["tableData"],
    category: "Data Management"
  },

  diff_table: {
    id: "diff_table",
    name: "Diff Table Widget",
    description: "Show old vs new data comparison",
    componentPath: "DetailTableWidget",
    applicableTo: ["form"],
    dataRequirements: ["diffData"],
    category: "Data Management"
  },
  QRCodeDesignWidget: {
    id: "QRCodeDesignWidget",
    name: "QR Generator & Designer",
    description: "Design branded QR codes and short links",
    componentPath: "QRCodeDesignWidget",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Tools"
  },
  QRCodePreviewWidget: {
    id: "QRCodePreviewWidget",
    name: "QR Code Preview & Download",
    description: "View and download production-ready QR codes",
    componentPath: "QRCodePreviewWidget",
    applicableTo: ["ticket_detail"],
    dataRequirements: ["ticketData"],
    category: "Tools"
  },
};

// Get widget by ID
export const getWidgetById = (id: string): ExtendedWidgetConfig | undefined => {
  return widgetRegistry[id];
};

// Get all widgets
export const getAllWidgets = (): ExtendedWidgetConfig[] => {
  return Object.values(widgetRegistry);
};

// Get widgets by context (form, ticket_detail, or assignment_detail)
// Now supports optional serviceId filtering for service-specific widgets
export const getWidgetsByContext = (
  context: 'form' | 'ticket_detail' | 'assignment_detail',
  serviceId?: number
): ExtendedWidgetConfig[] => {
  return getAllWidgets().filter(widget => {
    // Must match context
    if (!widget.applicableTo.includes(context)) return false;

    // If widget has serviceIds, check if current service matches
    if (widget.serviceIds && widget.serviceIds.length > 0) {
      if (!serviceId) return false; // No service provided, skip service-specific widgets
      return widget.serviceIds.includes(serviceId);
    }

    // Generic widgets (no serviceIds) always show
    return true;
  });
};

// Get widgets by category
export const getWidgetsByCategory = (category: string): ExtendedWidgetConfig[] => {
  return getAllWidgets().filter(widget => widget.category === category);
};

// Get all categories
export const getWidgetCategories = (): string[] => {
  return [...new Set(getAllWidgets().map(widget => widget.category).filter(Boolean))];
};

