import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

const getAuthHeader = () => {
  const token = localStorage.getItem('hots_tokek');
  return { Authorization: `Bearer ${token}` };
};

export interface JobItem {
  job_id: number;
  job_code: string;
  title: string;
  description: string;
  objective: string;
  job_status: string;
  visibility: string;
  budget_min: number;
  budget_max: number;
  quota: number;
  deadline_at: string;
  published_at: string;
  created_at: string;
  campaign_id?: number;
  campaign_name?: string;
  brand_name?: string;
  platform_name?: string;
  category_name?: string;
  assignment_count?: number;
  my_pickup?: {
    pickup_id: number;
    pickup_status: string;
    picked_at: string;
  } | null;
  my_assignment?: {
    assignment_id: number;
    status_visit: string;
    created_at: string;
  } | null;
}

export interface Campaign {
  campaign_id: number;
  campaign_name: string;
  project_name: string;
  brand_name: string;
  client_code: string;
  client_phone: string;
  target_product: string;
  job_id: number;
  title: string;
  job_status: string;
}

export interface Batch {
  batch_id: number;
  campaign_id: number;
  campaign_name: string;
  batch_name: string;
  batch_order: number;
}

export interface Location {
  location_id: number;
  batch_id: number;
  batch_name: string;
  outlet_name: string;
  address: string;
  gmaps_url: string;
}

export interface Applicant {
  pickup_id: number;
  job_id: number;
  user_id: number;
  firstname: string;
  lastname: string;
  pickup_status: string;
  picked_at: string;
  created_at?: string;
  followers_ig?: string;
  followers_tt?: string;
  niche?: string;
  tier_ig?: string;
}

export interface Assignment {
  assignment_id: number;
  campaign_id: number;
  campaign_name: string;
  job_title: string;
  user_id: number;
  firstname: string;
  lastname: string;
  status_visit: string;
}

export const jobMarketplaceService = {
  async getJobs(params?: { limit?: number; offset?: number; q?: string; job_status?: string; visibility?: string }) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/jobs`, {
      headers: getAuthHeader(),
      params
    });
    return res.data;
  },

  async createCampaign(payload: any) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/campaigns`, payload, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getJobDetail(jobId: number | string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/detail/${jobId}`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getCampaigns(params: any = {}) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/campaigns`, {
      headers: getAuthHeader(),
      params
    });
    return res.data;
  },

  async getBatches(campaignId?: number) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/batches`, {
      headers: getAuthHeader(),
      params: { campaign_id: campaignId }
    });
    return res.data;
  },

  async getLocations(batchId?: number) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/locations`, {
      headers: getAuthHeader(),
      params: { batch_id: batchId }
    });
    return res.data;
  },

  async getApplicants(jobId?: number | string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/applicants/${jobId || ''}`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getAssignments(campaignId?: number) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/assignments`, {
      headers: getAuthHeader(),
      params: { campaign_id: campaignId }
    });
    return res.data;
  },

  async getContentLogs(campaignId?: number, assignmentId?: number) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/content-logs`, {
      headers: getAuthHeader(),
      params: { campaign_id: campaignId, assignment_id: assignmentId }
    });
    return res.data;
  },

  async submitContentLog(assignmentId: number, draftLink: string, notes?: string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/content-logs`, {
      assignment_id: assignmentId,
      draft_link: draftLink,
      notes: notes
    }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async takeJob(jobId: number | string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/take-job`, { job_id: jobId }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async approveApplicant(pickupId: number, campaignId: number, batchId: number, locationId: number) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/approve-applicant`, {
      pickup_id: pickupId,
      campaign_id: campaignId,
      batch_id: batchId,
      location_id: locationId
    }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async listMyRequests() {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/my-requests`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getBrands(q?: string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/brands`, {
      headers: getAuthHeader(),
      params: q ? { q } : {}
    });
    return res.data;
  },

  async createBrand(brand_name: string, industry?: string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/brands`, { brand_name, industry }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getCategories(q?: string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/categories`, {
      headers: getAuthHeader(),
      params: q ? { q } : {}
    });
    return res.data;
  },

  async createCategory(category_name: string, description?: string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/categories`, { category_name, description }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getPlatforms(q?: string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/platforms`, {
      headers: getAuthHeader(),
      params: q ? { q } : {}
    });
    return res.data;
  },

  async createPlatform(platform_name: string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/platforms`, { platform_name }, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  async getContentTypes(q?: string) {
    const res = await axios.get(`${API_URL}/hots_jobmarketplace/content-types`, {
      headers: getAuthHeader(),
      params: q ? { q } : {}
    });
    return res.data;
  },

  async createContentType(type_name: string) {
    const res = await axios.post(`${API_URL}/hots_jobmarketplace/content-types`, { type_name }, {
      headers: getAuthHeader()
    });
    return res.data;
  },
};
