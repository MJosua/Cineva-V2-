import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

/* -------------------------------------------------------------
   🔧 DEBUG MODE
   Turn this on to see all request/response logs
------------------------------------------------------------- */
const DEBUG = true;

/* -------------------------------------------------------------
   🧠 Normalize Base URL
   Removes trailing slash from API_URL and ensures consistent path
------------------------------------------------------------- */
const BASE = `${API_URL.replace(/\/$/, "")}/workflow-engine`;




/* -------------------------------------------------------------
   🚀 Axios Instance (Centralized)
------------------------------------------------------------- */
const api = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json"
  }
});



/* -------------------------------------------------------------
   📡 Request Logger (DEBUG MODE)
------------------------------------------------------------- */
api.interceptors.request.use((config) => {
  if (DEBUG) {
    console.log(
      `%c[API REQUEST]`,
      "color:#3498db;font-weight:bold",
      {
        method: config.method,
        url: `${config.baseURL}${config.url}`,
        params: config.params,
        data: config.data
      }
    );
  }
  return config;
});

/* -------------------------------------------------------------
   📥 Response Logger (DEBUG MODE)
------------------------------------------------------------- */
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(
        `%c[API RESPONSE]`,
        "color:#2ecc71;font-weight:bold",
        response.data
      );
    }
    return response;
  },
  (error) => {
    if (DEBUG) {
      console.error(
        `%c[API ERROR]`,
        "color:#e74c3c;font-weight:bold",
        error?.response || error
      );
    }

    // Normalize error messages so FE never crashes
    const normalized = {
      ok: false,
      status: error.response?.status || 0,
      message:
        error.response?.data?.message ||
        error.message ||
        "Network error"
    };

    return Promise.reject(normalized);
  }
);

/* -------------------------------------------------------------
   🛠 Unified Request Helper (optional)
------------------------------------------------------------- */
async function request(method, url, data) {
  return api({ method, url, data });
}

/* -------------------------------------------------------------
   📚 API EXPORTS
   (Clean, consistent, safe)
------------------------------------------------------------- */
export const getWorkflow = (serviceId) =>
  request("get", `/${serviceId}`);

export const addWorkflow = (payload) =>
    request("post", "/add", payload);

export const updateWorkflow = (workflowId, payload) =>
  request("put", `/${workflowId}`, payload);

export const deleteWorkflow = (workflowId) =>
  request("delete", `/${workflowId}`);

export const getParams = (workflowId) =>
  request("get", `/params/${workflowId}`);

export const saveParam = (workflowId, payload) =>
  request("post", `/params/${workflowId}`, payload);
