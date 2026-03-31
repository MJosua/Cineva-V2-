import axios from "axios";
import { API_URL } from '@/config/sourceConfig';

// Always read token safely
const token = () => localStorage.getItem("hots_tokek") || "";

/* ============================================================
   PUBLIC PAGE
============================================================ */
export const fetchPublicPage = async (slug: string) => {
  try {
    const res = await axios.get(`${API_URL}/cms/public/${encodeURIComponent(slug)}`);
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   PUBLIC POSTS LIST
============================================================ */
export const fetchPublicPosts = async (params?: { module_key?: string; category_id?: string }) => {
  try {
    const res = await axios.get(`${API_URL}/cms/posts`, { params });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   ADMIN LIST (enhanced with filters/search/sort)
============================================================ */
export const adminListPages = async (params?: {
  search?: string;
  category_id?: string;
  module_key?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: string;
}) => {
  try {
    const res = await axios.get(`${API_URL}/cms/admin/list`, {
      headers: { Authorization: `Bearer ${token()}` },
      params,
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   ADMIN GET PAGE
============================================================ */
export const adminGetPage = async (id: number) => {
  try {
    const res = await axios.get(`${API_URL}/cms/admin/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   ADMIN SAVE PAGE
============================================================ */
export const adminSavePage = async (payload: any) => {
  try {
    const res = await axios.post(`${API_URL}/cms/admin/save`, payload, {
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("CMS SAVE ERROR:", err.response?.data || err);
    return err.response?.data || { ok: false, message: "Network Error" };
  }
};

/* ============================================================
   ADMIN DELETE
============================================================ */
export const adminDeletePage = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}/cms/admin/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   CATEGORIES
============================================================ */
export const fetchCategories = async () => {
  try {
    const res = await axios.get(`${API_URL}/cms/categories`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const quickUpdateField = async (id: number, field: string, value: string) => {
  try {
    const res = await axios.put(`${API_URL}/cms/admin/${id}/quick`, { field, value }, {
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const quickUpdateCategory = async (id: number, category_id: string) => {
  try {
    const res = await axios.put(`${API_URL}/cms/admin/${id}/category`, { category_id }, {
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const createCategory = async (payload: {
  category_name: string;
  color_class?: string;
  icon?: string;
  placement?: string;
}) => {
  try {
    const res = await axios.post(`${API_URL}/cms/admin/category`, payload, {
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   MEDIA LIBRARY
============================================================ */
export const adminListMedia = async (params?: {
  page?: number;
  limit?: number;
  folder?: string;
  tag?: string;
  search?: string;
}) => {
  try {
    const res = await axios.get(`${API_URL}/cms/admin/media/list`, {
      headers: { Authorization: `Bearer ${token()}` },
      params,
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const adminMediaUploadTemp = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'media');

  try {
    const res = await axios.post(`${API_URL}/cms/admin/media/upload-temp`, formData, {
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const adminMediaFinalize = async (payload: {
  upload_id: number;
  folder?: string;
  tags?: string[];
  file_name?: string;
}) => {
  try {
    const res = await axios.post(`${API_URL}/cms/admin/media/finalize`, payload, {
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

export const adminDeleteMedia = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}/cms/admin/media/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};
