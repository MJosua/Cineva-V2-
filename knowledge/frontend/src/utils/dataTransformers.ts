import { DataTransformerRegistry } from '@/types/widgetDataTypes';

// Data transformation functions for different data types
export const dataTransformers: DataTransformerRegistry = {
  // Transform meeting room booking data
  meetingRoomBookings: (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map((item: any) => ({
      id: item.ticket_id || item.id,
      room: item.room,
      startTime: item.start_time,
      endTime: item.end_time,
      bookedBy: String(item.booked_by || item.user_name || 'Unknown'),
      attendees: Number(item.attendees || 0),
      date: item.date,
      status: item.status || 'confirmed',
    }));
  },

  // Transform stock/inventory data
  stockData: (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map((item: any) => ({
      id: item.item_id || item.id,
      name: item.item_name || item.name,
      sku: item.sku || item.item_code,
      currentStock: Number(item.current_stock || item.quantity || 0),
      minStock: Number(item.min_stock || item.minimum_quantity || 0),
      maxStock: Number(item.max_stock || item.maximum_quantity || 100),
      location: item.location || item.warehouse,
      category: item.category,
      unit: item.unit || 'pcs',
      lastUpdated: item.last_updated || item.updated_at,
    }));
  },

  // Transform team workload data
  teamWorkload: (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map((member: any) => ({
      id: member.user_id || member.id,
      name: member.user_name || member.name,
      role: member.role || member.position,
      currentTasks: Number(member.current_tasks || member.active_tickets || 0),
      capacity: Number(member.capacity || member.max_capacity || 10),
      department: member.department,
      availability: member.availability || 'available',
      workload: Number(member.workload_percentage || 0),
    }));
  },

  // Transform user/request history data
  requestHistory: (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map((request: any) => ({
      id: request.ticket_id || request.id,
      serviceId: request.service_id,
      serviceName: request.service_name,
      requestedBy: request.requested_by || request.user_name,
      requestDate: request.request_date || request.created_at,
      status: request.status,
      priority: request.priority,
      description: request.description || request.summary,
      completionTime: request.completion_time,
    }));
  },

  // Transform analytics/chart data
  chartData: (rawData: any) => {
    if (!rawData) return { labels: [], datasets: [] };
    
    return {
      labels: rawData.labels || [],
      datasets: rawData.datasets || [],
      summary: rawData.summary || {},
    };
  },

  // Transform simple list data
  listData: (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    return rawData;
  },

  // Identity transformer (no transformation)
  identity: (data: any) => data,

  // Transform data to key-value pairs
  keyValue: (rawData: any) => {
    if (Array.isArray(rawData)) {
      return rawData.reduce((acc, item) => {
        const key = item.key || item.id || item.name;
        const value = item.value || item.data || item;
        if (key) acc[key] = value;
        return acc;
      }, {});
    }
    return rawData || {};
  },

  // Transform API response with pagination
  paginatedData: (rawData: any) => {
    return {
      items: rawData.data || rawData.items || [],
      pagination: {
        page: rawData.page || 1,
        totalPages: rawData.total_pages || rawData.totalPages || 1,
        totalItems: rawData.total_items || rawData.totalItems || 0,
        hasNext: rawData.has_next || rawData.hasNext || false,
        hasPrev: rawData.has_prev || rawData.hasPrev || false,
      }
    };
  },

  // Transform date range data
  dateRangeData: (rawData: any, context?: any) => {
    const { currentDateRange } = context || {};
    
    if (!Array.isArray(rawData)) return [];
    
    return rawData.filter((item: any) => {
      if (!currentDateRange || !item.date) return true;
      
      const itemDate = new Date(item.date);
      return itemDate >= currentDateRange.start && itemDate <= currentDateRange.end;
    });
  },
};

// Get transformer by name
export const getDataTransformer = (transformerName?: string) => {
  if (!transformerName) return dataTransformers.identity;
  return dataTransformers[transformerName] || dataTransformers.identity;
};

// Register new transformer
export const registerDataTransformer = (name: string, transformer: (data: any, context?: any) => any) => {
  dataTransformers[name] = transformer;
};