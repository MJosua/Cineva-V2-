import { API_URL } from "../../config";

function normalizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function createEventSource(path) {
  // Keep behavior aligned with existing usage: no credentials/options changed.
  return new EventSource(API_URL + normalizePath(path));
}






