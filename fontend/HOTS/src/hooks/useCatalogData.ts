import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { 
  fetchCatalogData, 
  setServiceCatalog, 
  setCategoryList,
  selectServiceCatalog,
  selectCategoryList,
  selectCatalogLoading,
  selectCatalogError,
  selectActiveServices,
  selectServicesByCategory,
  selectCategoryById,
  selectGroupedMenu
} from '@/store/slices/catalogSlice';
import type { ServiceCatalogItem, Category } from '@/store/slices/catalogSlice';

// Example data with form_json (fallback if API fails)
const exampleServiceCatalog: ServiceCatalogItem[] = [
  {
    service_id: 1,
    category_id: 1,
    service_name: "PC/Notebook Request",
    service_description: "Request a new or replacement computer",
    approval_level: 2,
    image_url: "itassetrequest.png",
    nav_link: "asset-request",
    active: 1,
    team_id: 2,
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
      ],
      approval: {
        steps: ["Manager", "IT Team"],
        mode: "sequential"
      }
    })
  },
  {
    service_id: 7,
    category_id: 3,
    service_name: "IT Technical Support",
    service_description: "Get help with IT issues from computer to software errors",
    approval_level: 1,
    image_url: "ittechnicalsupport.png",
    nav_link: "it-support",
    active: 1,
    team_id: 1,
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
        },
        {
          label: "Attachment",
          name: "attachment",
          type: "file",
          accept: ["image/*", "pdf", "docx"],
          columnSpan: 3
        }
      ],
      approval: {
        steps: ["Supervisor", "IT Team"],
        mode: "sequential"
      }
    })
  },
  {
    service_id: 8,
    category_id: 1,
    service_name: "Sample Request Form",
    service_description: "Submit sample requests with detailed item specifications",
    approval_level: 0,
    image_url: "srf.png",
    nav_link: "sample-request-form",
    active: 1,
    team_id: 8,
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
          label: "Division",
          name: "division",
          type: "text",
          readonly: true,
          value: "IOD",
          required: true,
          columnSpan: 1
        },
        {
          label: "Location",
          name: "location",
          type: "text",
          readonly: true,
          value: "INDOFOOD TOWER LT.23",
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
          label: "Plant",
          name: "plant",
          type: "select",
          options: ["Plant A", "Plant B", "Plant C"],
          required: true,
          columnSpan: 1
        },
        {
          label: "Deliver To",
          name: "deliver_to",
          type: "select",
          options: ["Lab A", "Lab B", "External Lab"],
          required: true,
          columnSpan: 1
        },
        {
          label: "SRF No",
          name: "srf_no",
          type: "text",
          value: "XXX",
          required: true,
          columnSpan: 1
        },
        {
          label: "Purpose",
          name: "purpose",
          type: "text",
          placeholder: "purpose",
          required: true,
          columnSpan: 2
        },
        {
          label: "Notes",
          name: "notes",
          type: "textarea",
          placeholder: "notes",
          required: false,
          columnSpan: 3
        },
        {
          label: "Upload Files",
          name: "upload_files",
          type: "file",
          accept: ["image/*", "pdf", "docx"],
          maxSizeMB: 5,
          multiple: true,
          columnSpan: 3
        }
      ],
      
      submit: {
        label: "Submit",
        type: "button",
        action: "/submit-sample-request"
      }
    })
  }
];

// Example data (fallback if API fails)
const exampleCategoryList: Category[] = [
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
  },
  {
    category_id: 4,
    category_name: "HRGA",
    description: null,
    creation_date: null,
    finished_date: null
  },
  {
    category_id: 5,
    category_name: "Marketing",
    description: null,
    creation_date: null,
    finished_date: null
  }
];

export const useCatalogData = () => {
  const dispatch = useAppDispatch();
  
  const serviceCatalog = useAppSelector(selectServiceCatalog);
  const categoryList = useAppSelector(selectCategoryList);
  const isLoading = useAppSelector(selectCatalogLoading);
  const error = useAppSelector(selectCatalogError);

  // Initialize with example data if needed
  const initializeWithExampleData = () => {
    dispatch(setServiceCatalog(exampleServiceCatalog));
    dispatch(setCategoryList(exampleCategoryList));
  };

  // Fetch data from API
  const fetchData = () => {
    dispatch(fetchCatalogData());
  };

  // Helper functions
  const getActiveServices = () => {
    return useAppSelector(selectActiveServices);
  };

  const getServicesByCategory = (categoryId: number) => {
    return useAppSelector(state => selectServicesByCategory(state, categoryId));
  };

  const getCategoryById = (categoryId: number) => {
    return useAppSelector(state => selectCategoryById(state, categoryId));
  };

  const getCategoryName = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    return category?.category_name || 'Unknown Category';
  };

  // Get grouped menu (like your original logic)
  const getGroupedMenu = (searchKeyword: string = '') => {
    return useAppSelector(state => selectGroupedMenu(state, searchKeyword));
  };

  return {
    // Data
    serviceCatalog,
    categoryList,
    isLoading,
    error,
    
    // Actions
    initializeWithExampleData,
    fetchData,
    
    // Helper functions
    getActiveServices,
    getServicesByCategory,
    getCategoryById,
    getCategoryName,
    getGroupedMenu,
  };
};
