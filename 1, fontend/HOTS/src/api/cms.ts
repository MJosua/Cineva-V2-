import axios from "axios";
import { API_URL } from '@/config/sourceConfig';

// Always read token safely
const token = () => localStorage.getItem("tokek") || "";

/* ============================================================
   PUBLIC PAGE
============================================================ */
export const fetchPublicPage = async (slug: string) => {

  console.log("Fetching public CMS page with slug:", slug);
  try {
    const res = await axios.get(`${API_URL}/cms/public/${encodeURIComponent(slug)}`);
    console.log("Fetched public CMS page data:", res.data);
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};

/* ============================================================
   ADMIN LIST
============================================================ */
export const adminListPages = async () => {
  try {
    const res = await axios.get(`${API_URL}/cms/admin/list`, {
      headers: {
        Authorization: `Bearer ${token()}`,
      },
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
      headers: {
        Authorization: `Bearer ${token()}`,
      },
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
  console.log("CMS → Saving page to:", `${API_URL}/cms/admin/save`);
  console.log("CMS → Payload:", payload);

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
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    });
    return res.data;
  } catch (err: any) {
    return err.response?.data || { ok: false };
  }
};
