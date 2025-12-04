import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

// Types for the catalog data
export interface ServiceCatalogItem {
  service_id: number;
  category_id: number;
  service_name: string;
  service_description: string;
  approval_level?: number; // Made optional for backward compatibility
  m_workflow_groups?: number; // New field for workflow group assignment
  image_url: string;
  nav_link: string;
  active: number;
  team_id: number | null;
  form_json?: string; // New field for JSON form configuration
  widget?: string[]; // New field for widget array
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  creation_date: string | null;
  finished_date: string | null;
}

interface CatalogState {
  serviceCatalog: ServiceCatalogItem[];
  categoryList: Category[];
  isLoading: boolean;
  error: string | null;
  useFallbackData: boolean;
}

const initialState: CatalogState = {
  serviceCatalog: [],
  categoryList: [],
  isLoading: false,
  error: null,
  useFallbackData: false,
};

// Fallback data for when API fails
const fallbackServiceCatalog: ServiceCatalogItem[] = [
  {
    service_id: 1,
    category_id: 1,
    service_name: "PC/Notebook Request",
    service_description: "Request a new or replacement computer",
    m_workflow_groups: 1, // Changed from workflow_group_id to m_workflow_groups
    image_url: "itassetrequest.png",
    nav_link: "asset-request",
    active: 1,
    team_id: 2,
    widget: ["stock_overview", "team_workload"], // Widget array
    form_json: JSON.stringify({
      url: "/asset-request",
      title: "PC/Notebook Request",
      fields: [
        {
          label: "Asset Type*",
          name: "asset_type",
          type: "select",
          options: ["Desktop PC", "Laptop", "Monitor", "Printer"],
          required: true,
          columnSpan: 2
        },
        {
          label: "Priority",
          name: "priority",
          type: "select",
          options: ["High", "Medium", "Low"],
          required: true,
          columnSpan: 1
        },
        {
          label: "Justification",
          name: "justification",
          type: "textarea",
          placeholder: "Please explain why you need this asset",
          required: true,
          columnSpan: 3
        }
      ]
    })
  },
  {
    service_id: 7,
    category_id: 3,
    service_name: "IT Technical Support",
    service_description: "Get help with IT issues from computer to software errors",
    m_workflow_groups: 1, // Changed from workflow_group_id to m_workflow_groups
    image_url: "ittechnicalsupport.png",
    nav_link: "it-support",
    active: 1,
    team_id: 1,
    widget: ["recent_requests"], // Widget array
    form_json: JSON.stringify({
      url: "/it-support",
      title: "IT Support Request",
      fields: [
        {
          label: "Type of Support*",
          name: "support_type",
          placeholder: "Select Type of Support",
          type: "select",
          options: ["Hardware", "Account", "Software"],
          required: true,
          columnSpan: 2
        },
        {
          label: "Priority",
          name: "priority",
          type: "select",
          options: ["High", "Medium", "Low"],
          required: true,
          columnSpan: 1
        },
        {
          label: "Issue Description",
          name: "issue_description",
          placeholder: "Please provide a detailed description of the issues you're experiencing",
          type: "textarea",
          required: true,
          columnSpan: 3
        }
      ]
    })
  },
  {
    service_id: 8,
    category_id: 1,
    service_name: "Sample Request Form",
    service_description: "Submit sample requests with detailed item specifications",
    m_workflow_groups: 1, // Changed from workflow_group_id to m_workflow_groups
    image_url: "srf.png",
    nav_link: "sample-request-form",
    active: 1,
    team_id: 8,
    widget: ["gantt_room_schedule", "approval_progress"], // Widget array
    form_json: JSON.stringify({
      url: "/sample-request-form",
      title: "Sample Request Form",
      fields: [
        {
          label: "Request By",
          name: "request_by",
          type: "text",
          readonly: true,
          value: "Yosua Gultom",
          required: true,
          columnSpan: 1
        },
        {
          label: "Sample Category",
          name: "sample_category",
          type: "select",
          options: ["Raw Material", "Finished Product", "Packaging"],
          required: true,
          columnSpan: 1
        },
        {
          label: "Notes",
          name: "notes",
          type: "textarea",
          placeholder: "notes",
          required: false,
          columnSpan: 3
        }
      ]
    })
  }
];

const fallbackCategoryList: Category[] = [
  {
    category_id: 1,
    category_name: "Hardware",
    description: null,
    creation_date: null,
    finished_date: null
  },
  {
    category_id: 2,
    category_name: "Software",
    description: null,
    creation_date: null,
    finished_date: null
  },
  {
    category_id: 3,
    category_name: "Support",
    description: null,
    creation_date: null,
    finished_date: null
  }
];

// Async thunk for fetching service catalog from API
export const fetchServiceCatalog = createAsyncThunk(
  'catalog/fetchServiceCatalog',
  async () => {
    try {
      const userToken = localStorage.getItem("tokek");
      const response = await axios.get(`${API_URL}/hots_settings/get_service`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      // // console.log('Service catalog data:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch service catalog:', error);
      if (error.response?.status === 401) {
        // // console.log('Using fallback service catalog data due to authentication error');
        return fallbackServiceCatalog;
      }
      throw error;
    }
  }
);

export const fetchCategoryList = createAsyncThunk(
  'catalog/fetchCategoryList',
  async () => {
    try {
      const userToken = localStorage.getItem("tokek");
      const response = await axios.get(`${API_URL}/hots_settings/get_serviceCategory`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      // // console.log('Category data:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch category list:', error);
      if (error.response?.status === 401) {
        // // console.log('Using fallback category data due to authentication error');
        return fallbackCategoryList;
      }
      throw error;
    }
  }
);

// Thunk to fetch both datasets
export const fetchCatalogData = createAsyncThunk(
  'catalog/fetchCatalogData',
  async (_, { dispatch }) => {
    const results = await Promise.allSettled([
      dispatch(fetchServiceCatalog()),
      dispatch(fetchCategoryList())
    ]);
    
    // Check if both requests failed due to auth issues
    const allFailed = results.every(result => result.status === 'rejected');
    if (allFailed) {
      // console.log('All API requests failed, using complete fallback data');
      return { useFallback: true };
    }
    
    return { useFallback: false };
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    // Synchronous actions for setting data directly
    setServiceCatalog: (state, action: PayloadAction<ServiceCatalogItem[]>) => {
      state.serviceCatalog = action.payload;
    },
    setCategoryList: (state, action: PayloadAction<Category[]>) => {
      state.categoryList = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    useFallbackData: (state) => {
      state.serviceCatalog = fallbackServiceCatalog;
      state.categoryList = fallbackCategoryList;
      state.useFallbackData = true;
      state.isLoading = false;
      state.error = null;
      // // console.log('Using fallback data for service catalog');
    },
  },
  extraReducers: (builder) => {
    builder
      // Service catalog cases
      .addCase(fetchServiceCatalog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceCatalog.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceCatalog = action.payload;
        state.useFallbackData = Array.isArray(action.payload) && action.payload === fallbackServiceCatalog;
      })
      .addCase(fetchServiceCatalog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch service catalog';
        // Use fallback data on failure
        state.serviceCatalog = fallbackServiceCatalog;
        state.useFallbackData = true;
      })
      // Category list cases
      .addCase(fetchCategoryList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryList = action.payload;
      })
      .addCase(fetchCategoryList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch categories';
        // Use fallback data on failure
        state.categoryList = fallbackCategoryList;
        state.useFallbackData = true;
      })
      // Combined fetch cases
      .addCase(fetchCatalogData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCatalogData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.useFallback) {
          state.serviceCatalog = fallbackServiceCatalog;
          state.categoryList = fallbackCategoryList;
          state.useFallbackData = true;
        }
      })
      .addCase(fetchCatalogData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch catalog data';
        // Use fallback data on complete failure
        state.serviceCatalog = fallbackServiceCatalog;
        state.categoryList = fallbackCategoryList;
        state.useFallbackData = true;
      });
  },
});

export const { setServiceCatalog, setCategoryList, clearError, useFallbackData } = catalogSlice.actions;
export default catalogSlice.reducer;

// Selectors
export const selectServiceCatalog = (state: any) => state.catalog.serviceCatalog;
export const selectCategoryList = (state: any) => state.catalog.categoryList;
export const selectCatalogLoading = (state: any) => state.catalog.isLoading;
export const selectCatalogError = (state: any) => state.catalog.error;
export const selectUseFallbackData = (state: any) => state.catalog.useFallbackData;

// Helper selectors
export const selectServicesByCategory = (state: any, categoryId: number) =>
  state.catalog.serviceCatalog.filter((service: ServiceCatalogItem) =>
    service.category_id === categoryId && service.active === 1
  );

export const selectActiveServices = (state: any) =>
  state.catalog.serviceCatalog.filter((service: ServiceCatalogItem) => service.active === 1);

export const selectCategoryById = (state: any, categoryId: number) =>
  state.catalog.categoryList.find((category: Category) => category.category_id === categoryId);

// Helper to create grouped menu (like your original logic)
export const selectGroupedMenu = (state: any, searchKeyword: string = '') => {
  const categories = state.catalog.categoryList;
  const services = state.catalog.serviceCatalog;
  const keyword = searchKeyword.trim().toLowerCase();

  return categories.reduce((acc: any[], category: Category) => {
    const filteredServices = services.filter((service: ServiceCatalogItem) => {
      const descMatch = service.service_description?.toLowerCase().includes(keyword);
      const nameMatch = service.service_name?.toLowerCase().includes(keyword);
      const keywordMatch = !keyword || descMatch || nameMatch;
      const categoryMatch = service.category_id === category.category_id;

      return keywordMatch && categoryMatch;
    });

    if (filteredServices.length > 0) {
      acc.push({ ...category, services: filteredServices });
    }

    return acc;
  }, []);
};

// New selector to get widgets for a service
export const selectServiceWidgets = (state: any, serviceId: number) => {
  const service = state.catalog.serviceCatalog.find((s: ServiceCatalogItem) => s.service_id === serviceId);
  return service?.widget || [];
};
