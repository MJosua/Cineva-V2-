// utils/rules/ruleActions/handleAPI.ts
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

/**
 * 🔌 handleAPI()
 * Executes rule-based API call with optional token auth.
 * Supports ${value} or ${dependsByValue} replacements.
 */
export async function handleAPI(ruleThen: any, checkVal: any) {
  if (!ruleThen?.api) return;

  // Normalize checkVal early
  if (checkVal === undefined || checkVal === null || checkVal === "null") {
    console.warn("⚠️ handleAPI: checkVal is null, skipping API call.");
    return null;
  }

  try {
    const token = localStorage.getItem("tokek") || "";
    let resolvedUrl = ruleThen.api;

    // 🧠 Normalize checkVal to primitive
    let primitiveVal = checkVal;
    if (typeof checkVal === "object" && checkVal !== null) {
      primitiveVal =
        checkVal.value ??
        checkVal.id ??
        checkVal.label ??
        checkVal.item_name ??
        checkVal.name ??
        checkVal.filter ??
        "";
    }

    // 🧠 Replace placeholders (support both ${value} and ${dependsByValue})
    if (resolvedUrl.includes("${value}")) {
      resolvedUrl = resolvedUrl.replace("${value}", encodeURIComponent(primitiveVal));
    }
    if (resolvedUrl.includes("${dependsByValue}")) {
      resolvedUrl = resolvedUrl.replace("${dependsByValue}", encodeURIComponent(primitiveVal));
    }

    // ✅ Ensure base URL prefix if needed
    if (resolvedUrl.startsWith("/")) {
      resolvedUrl = `${API_URL}${resolvedUrl}`;
    }

    console.log("🌐 Rule API request:", resolvedUrl);

    const res = await axios.get(resolvedUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = res?.data?.data ?? [];

    // ✅ Guarantee non-empty options array
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ Empty API response — defaulting to No data found");
      return [{ item_name: "No data found", filter: null }];
    }

    console.log("📡 Rule API success:", data);
    return data;
  } catch (err: any) {
    console.warn("⚠️ Rule API error:", err.response?.data || err.message);
    return [{ item_name: "No data found", filter: null }];
  }
}
