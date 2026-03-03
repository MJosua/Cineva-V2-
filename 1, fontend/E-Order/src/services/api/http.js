import Axios from "axios";
import { API_URL } from "../../config";

function normalizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function authHeader(userToken) {
  // Intentionally uses global Axios so `CheckToken` interceptors still apply.
  return { Authorization: `Bearer ${userToken}` };
}

function withAuthConfig(userToken, config = {}) {
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...authHeader(userToken),
    },
  };
}

export function apiGet(path, userToken, config) {
  return Axios.get(API_URL + normalizePath(path), withAuthConfig(userToken, config));
}

export function apiPost(path, userToken, data, config) {
  return Axios.post(
    API_URL + normalizePath(path),
    data,
    withAuthConfig(userToken, config)
  );
}

export function apiPatch(path, userToken, data, config) {
  return Axios.patch(
    API_URL + normalizePath(path),
    data,
    withAuthConfig(userToken, config)
  );
}

export function apiDelete(path, userToken, config) {
  return Axios.delete(API_URL + normalizePath(path), withAuthConfig(userToken, config));
}






