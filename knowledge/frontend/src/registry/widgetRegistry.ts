import { WidgetConfig } from '@/types/widgetTypes';

// Widget registry - all available widgets are listed here
export const widgetRegistry: Record<string, WidgetConfig> = {
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

};

// Get widget by ID
export const getWidgetById = (id: string): WidgetConfig | undefined => {
  return widgetRegistry[id];
};

// Get all widgets
export const getAllWidgets = (): WidgetConfig[] => {
  return Object.values(widgetRegistry);
};

// Get widgets by context (form or ticket_detail)
export const getWidgetsByContext = (context: 'form' | 'ticket_detail'): WidgetConfig[] => {
  return getAllWidgets().filter(widget => widget.applicableTo.includes(context));
};

// Get widgets by category
export const getWidgetsByCategory = (category: string): WidgetConfig[] => {
  return getAllWidgets().filter(widget => widget.category === category);
};

// Get all categories
export const getWidgetCategories = (): string[] => {
  return [...new Set(getAllWidgets().map(widget => widget.category).filter(Boolean))];
};
