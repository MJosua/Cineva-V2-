import type { DynamicFieldSchema, FormValues } from "./types";

const asComparable = (value: unknown) => {
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return item.value ?? item.id ?? item.label ?? value;
  }
  return value;
};

const matches = (actualValue: unknown, when: any) => {
  if (!when) return false;
  const actual = asComparable(actualValue);
  const expected = when.value;
  const numericActual = Number.isFinite(Number(actual))
    ? Number(actual)
    : Number(String(actual ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  const numericExpected = Number.isFinite(Number(expected))
    ? Number(expected)
    : Number(String(expected ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  switch (String(when.operator || "equals").toLowerCase()) {
    case "not_equals":
    case "not_equal":
    case "!=": return String(actual ?? "") !== String(expected ?? "");
    case "contains": return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "not_contains": return !String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "in": return Array.isArray(expected) && expected.map(String).includes(String(actual ?? ""));
    case "not_in": return Array.isArray(expected) && !expected.map(String).includes(String(actual ?? ""));
    case "greater_than":
    case ">": return numericActual > numericExpected;
    case "greater_or_equal":
    case ">=": return numericActual >= numericExpected;
    case "less_than":
    case "<": return numericActual < numericExpected;
    case "less_or_equal":
    case "<=": return numericActual <= numericExpected;
    case "empty": return actual == null || actual === "" || (Array.isArray(actual) && actual.length === 0);
    case "not_empty": return !(actual == null || actual === "" || (Array.isArray(actual) && actual.length === 0));
    default: return String(actual ?? "") === String(expected ?? "");
  }
};

export function applyFieldRules(field: DynamicFieldSchema, values: FormValues): DynamicFieldSchema {
  if (!Array.isArray(field.rules) || field.rules.length === 0) return field;
  let fallback: any = null;
  let active: any = null;
  for (const rule of field.rules as any[]) {
    if (rule?.default) {
      fallback = rule;
      continue;
    }
    const source = rule?.dependsBy || rule?.when?.field;
    if (source && matches(values[source], rule.when)) active = rule;
  }
  const patch = (active || fallback)?.then;
  return patch && typeof patch === "object" ? { ...field, ...patch } : field;
}
