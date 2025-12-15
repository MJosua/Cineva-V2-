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

  job_applicants_table: {
    id: "job_applicants_table",
    name: "Job Applicants Table",
    description: "Display and manage job applicants for HR review",
    componentPath: "JobApplicantsTable",
    applicableTo: ["ticket_detail"],
    dataRequirements: ["applicationData"],
    category: "Job Marketplace"
  },

  job_execution_tools: {
    id: "job_execution_tools",
    name: "Data Execution Tools",
    description: "Manage ticket data rows with calculations and audit logging",
    componentPath: "DataExecutionTools",
    applicableTo: ["assignment_detail"],
    dataRequirements: ["assignmentData", "workData"],
    category: "Job Marketplace"
  },

  // E-Order / Sales widgets
  order_items: {
    id: "order_items",
    name: "Order Items (E-Order)",
    description: "Shopping cart widget for E-Order with item management",
    componentPath: "OrderItemsWidget",
    applicableTo: ["form"],
    dataRequirements: ["orderData"],
    category: "E-Order"
  },

  // Dashboard widgets
  ai_chat: {
    id: "ai_chat",
    name: "HOTS Copilot (AI Chat)",
    description: "AI assistant chat widget for help and guidance",
    componentPath: "AIChatWidget",
    applicableTo: ["form", "ticket_detail"],
    dataRequirements: [],
    category: "Dashboard"
  },

  my_tickets: {
    id: "my_tickets",
    name: "My Recent Tickets",
    description: "Display user's recent tickets with status",
    componentPath: "MyTicketsWidget",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Dashboard"
  },

  pending_approvals: {
    id: "pending_approvals",
    name: "Pending Approvals",
    description: "Display pending approval items with quick actions",
    componentPath: "PendingApprovalsWidget",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Dashboard"
  },

  quick_links: {
    id: "quick_links",
    name: "Quick Links Grid",
    description: "Configurable grid of navigation cards with icons",
    componentPath: "QuickLinksWidget",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Dashboard"
  },

  guest_info: {
    id: "guest_info",
    name: "Guest Info Log",
    description: "Visitor management log",
    componentPath: "GuestInfoWidget",
    applicableTo: ["form"],
    dataRequirements: [],
    category: "Dashboard"
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

// Get widgets by context (form, ticket_detail, or assignment_detail)
export const getWidgetsByContext = (context: 'form' | 'ticket_detail' | 'assignment_detail'): WidgetConfig[] => {
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
