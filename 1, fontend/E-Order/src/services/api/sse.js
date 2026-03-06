import { API_URL } from "../../config";

function normalizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function createEventSource(path, token = null) {
  let url = API_URL + normalizePath(path);
  if (token) {
    url += (url.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
  }
  return new EventSource(url);
}






