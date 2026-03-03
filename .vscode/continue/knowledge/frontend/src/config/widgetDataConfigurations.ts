import { ServiceDataConfiguration } from '@/types/widgetDataTypes';

// Service-specific widget data configurations
export const serviceDataConfigurations: ServiceDataConfiguration[] = [
  // Meeting Room Service Configuration
  {
    serviceId: 10, // Meeting room booking service
    dataConfigs: {
      gantt_room_schedule_static: {
        dataSources: [
          {
            id: 'meetingRoomBookings',
            endpoint: '/hots_settings/get/meetingroom_static',
            method: 'GET',
            params: {
              date: '{ticketData.detail_rows[1].cstm_col}',
              room: '{ticketData.detail_rows[0].cstm_col}',
            },
            transform: 'meetingRoomBookings',
            cacheKey: 'meeting_room_{ticketData.detail_rows[0].cstm_col}_{ticketData.detail_rows[1].cstm_col}',
            dependencies: ['ticketData.detail_rows[0].cstm_col', 'ticketData.detail_rows[1].cstm_col'],
            condition: '{ticketData.detail_rows[0].cstm_col} && {ticketData.detail_rows[1].cstm_col}',
          },
        ],
        cacheTime: 300000, // 5 minutes
        refetchOnMount: false,
        enabled: true,
      },
      gantt_room_schedule: {
        dataSources: [
          {
            id: 'meetingRoomBookings',
            endpoint: '/hots_settings/get/meetingroom_schedule',
            method: 'GET',
            params: {
              date: '{formData.booking_date}',
              room: '{formData.room_id}',
            },
            transform: 'meetingRoomBookings',
            cacheKey: 'meeting_room_form_{formData.room_id}_{formData.booking_date}',
            dependencies: ['formData.room_id', 'formData.booking_date'],
            condition: '{formData.room_id}',
          },
        ],
        cacheTime: 180000, // 3 minutes for form data (shorter cache)
        refetchOnMount: true,
        enabled: true,
      },
    },
  },
  
  // IT Asset Request Service Configuration
  {
    serviceId: 1, // PC/Notebook request service
    dataConfigs: {
      stock_overview: {
        dataSources: [
          {
            id: 'stockData',
            endpoint: '/inventory/get/stock_overview',
            method: 'GET',
            params: {
              category: '{formData.asset_type}',
              location: '{userData.location}',
            },
            transform: 'stockData',
            cacheKey: 'stock_overview_{formData.asset_type}_{userData.location}',
            dependencies: ['formData.asset_type', 'userData.location'],
          },
        ],
        cacheTime: 600000, // 10 minutes for stock data
        refetchOnMount: false,
        enabled: true,
      },
      team_workload: {
        dataSources: [
          {
            id: 'teamWorkload',
            endpoint: '/teams/get/workload',
            method: 'GET',
            params: {
              team_id: '{serviceInfo.team_id}',
              date_range: 'current_week',
            },
            transform: 'teamWorkload',
            cacheKey: 'team_workload_{serviceInfo.team_id}',
            dependencies: ['serviceInfo.team_id'],
          },
        ],
        cacheTime: 300000, // 5 minutes for team data
        refetchOnMount: false,
        enabled: true,
      },
    },
  },
  
  // IT Support Service Configuration
  {
    serviceId: 7, // IT Support service
    dataConfigs: {
      recent_requests: {
        dataSources: [
          {
            id: 'requestHistory',
            endpoint: '/tickets/get/recent',
            method: 'GET',
            params: {
              service_id: '{serviceInfo.service_id}',
              requested_by: '{userData.user_id}',
              limit: 5,
            },
            transform: 'requestHistory',
            cacheKey: 'recent_requests_{serviceInfo.service_id}_{userData.user_id}',
            dependencies: ['serviceInfo.service_id', 'userData.user_id'],
          },
        ],
        cacheTime: 180000, // 3 minutes for recent requests
        refetchOnMount: true,
        enabled: true,
      },
    },
  },
  
  // Sample Request Form Service Configuration
  {
    serviceId: 8, // Sample request form service
    dataConfigs: {
      gantt_room_schedule: {
        dataSources: [
          {
            id: 'sampleSchedule',
            endpoint: '/samples/get/schedule',
            method: 'GET',
            params: {
              lab_id: '{formData.lab_id}',
              date: '{formData.requested_date}',
            },
            transform: 'chartData',
            cacheKey: 'sample_schedule_{formData.lab_id}_{formData.requested_date}',
            dependencies: ['formData.lab_id', 'formData.requested_date'],
          },
        ],
        cacheTime: 300000, // 5 minutes
        refetchOnMount: false,
        enabled: true,
      },
      approval_progress: {
        dataSources: [
          {
            id: 'approvalFlow',
            endpoint: '/approvals/get/flow',
            method: 'GET',
            params: {
              service_id: '{serviceInfo.service_id}',
              workflow_group: '{serviceInfo.m_workflow_groups}',
            },
            transform: 'listData',
            cacheKey: 'approval_flow_{serviceInfo.service_id}',
            dependencies: ['serviceInfo.service_id'],
          },
        ],
        cacheTime: 600000, // 10 minutes for approval flow (rarely changes)
        refetchOnMount: false,
        enabled: true,
      },
    },
  },
];

// Helper functions to get configurations
export const getServiceDataConfig = (serviceId: number) => {
  return serviceDataConfigurations.find(config => config.serviceId === serviceId);
};

export const getWidgetDataConfig = (serviceId: number, widgetId: string) => {
  const serviceConfig = getServiceDataConfig(serviceId);
  return serviceConfig?.dataConfigs[widgetId];
};

// Widgets that should be excluded from dynamic data fetching
export const excludedWidgets = new Set([
  'default_item_download', // Handles its own data with Redux
]);

// Default widget data configuration for widgets without specific service configuration
export const defaultWidgetDataConfig = {
  dataSources: [],
  cacheTime: 300000,
  refetchOnMount: false,
  enabled: false,
};

// Global data configurations (not service-specific)
export const globalDataConfigurations = {
  user_profile: {
    dataSources: [
      {
        id: 'userData',
        endpoint: '/user/get/profile',
        method: 'GET',
        params: {},
        transform: 'identity',
        cacheKey: 'user_profile_{userData.user_id}',
        dependencies: ['userData.user_id'],
      },
    ],
    cacheTime: 1800000, // 30 minutes for user data
    refetchOnMount: false,
    enabled: true,
  },
};