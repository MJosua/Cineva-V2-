
/**
 * 🧩 utils/valueComparator.ts
 *
 * Provides robust helpers for:
 *  - Safe multi-type value comparison (primitives, arrays, objects)
 *  - Supports comma-separated string lists like "2,3"
 *  - Nested key resolution for dynamic paths (e.g., "meta.filter.code")
 */

/**
 * Normalize any value to lowercase trimmed string.
 * Handles numbers, booleans, and nulls gracefully.
 /**
 * Normalize any value to a lowercase trimmed string.
 */
const normalize = (v: any): string => String(v ?? "").trim().toLowerCase();

/**
 * Convert value to an array — safe for strings, CSVs, arrays, objects, etc.
 */
const toArray = (v: any): any[] => {
  if (v == null) return [];

  // Split comma-separated strings like "2,3"
  if (typeof v === "string" && v.includes(",")) {
    return v.split(",").map((x) => x.trim()).filter(Boolean);
  }

  // Already an array
  if (Array.isArray(v)) return v.flat(Infinity).filter(Boolean);

  // Object → take its values
  if (typeof v === "object") {
    try {
      return Object.values(v).filter(Boolean);
    } catch {
      return [v];
    }
  }

  return [v];
};

/**
 * Safely compare two values — supports strings, arrays, comma-separated values.
 */
export function compareValues(option: any, target: any): boolean {
  if (option == null || target == null) return false;

  // Convert both to arrays
  const optionArray = toArray(option);
  const targetArray = toArray(target);

  // Compare every normalized combination
  for (const o of optionArray) {
    for (const t of targetArray) {
      if (normalize(o) === normalize(t)) {
        return true; // ✅ match found
      }
    }
  }

  // No matches found
  return false;
}

/**
 * 🧠 getNested(obj, path)
 * Safely retrieves a deeply nested property using dot notation.
 * Example: getNested(data, "meta.filter.code")
 */
export function getNested(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path
        .split(".")
        .reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}


/**
 * Filters options based on dependency relations.
 * Supports both global and rowgroup contexts.
 * 
 * @param col - The field/column definition (must include dependsOn / dependsByValue)
 * @param opts - Array of option objects or primitives
 * @param context - Optional contextual values (globalValues, selectedObjects)
 */
export const getFilteredOptions = (
  col: any,
  opts: any[] = [],
  context: {
    globalValues?: Record<string, any>;
    selectedObjects?: Record<string, any>;
  } = {}
) => {
  if (!col) return opts || [];

  const { globalValues = {}, selectedObjects = {} } = context;

  // 1️⃣ Try to resolve the parent dependency value
  const parentVal =
    selectedObjects?.[col.dependsOn] ?? globalValues?.[col.dependsOn];

  const parentFilterVal =
    typeof parentVal === "object"
      ? getNested(parentVal, col.dependsOnValue || "value")
      : parentVal;

  if (!parentFilterVal) return opts || [];

  // 2️⃣ Apply the actual filtering logic
  return opts.filter((opt) => {
    try {
      const val =
        col.dependsByValue && typeof opt === "object"
          ? getNested(opt, col.dependsByValue)
          : typeof opt === "object" && opt.filter !== undefined
          ? opt.filter
          : opt;

      return compareValues(val, parentFilterVal);
    } catch {
      return true;
    }
  });
};