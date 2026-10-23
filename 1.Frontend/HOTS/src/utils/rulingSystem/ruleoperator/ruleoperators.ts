// utils/rules/ruleoperator/ruleoperators.ts

/**
 * 🔍 Evaluate a single condition between `checkVal` and `expected`
 */
function evaluateSingleCondition(checkVal: any, expected: any, operator: string = "equals"): boolean {
  try {
    switch (operator) {
      case "equals":
        return checkVal === expected;

      case "not_equals":
        return checkVal !== expected;

      case "contains":
        if (typeof checkVal === "string") return checkVal.includes(String(expected));
        if (Array.isArray(checkVal)) return checkVal.includes(expected);
        return false;

      case "in":
        return Array.isArray(expected) && expected.includes(checkVal);

      case "gt":
        return Number(checkVal) > Number(expected);

      case "gte":
        return Number(checkVal) >= Number(expected);

      case "lt":
        return Number(checkVal) < Number(expected);

      case "lte":
        return Number(checkVal) <= Number(expected);

      case "starts_with":
        return typeof checkVal === "string" && checkVal.startsWith(String(expected));

      case "ends_with":
        return typeof checkVal === "string" && checkVal.endsWith(String(expected));

      case "regex":
        try {
          const re = new RegExp(expected);
          return re.test(String(checkVal));
        } catch {
          return false;
        }

      case "includes_key":
        return typeof checkVal === "object" && checkVal !== null && expected in checkVal;

      case "is_truthy":
        return Boolean(checkVal);

      case "is_falsy":
        return !Boolean(checkVal);

      default:
        console.warn(`⚠️ Unknown operator "${operator}". Defaulting to equals.`);
        return checkVal === expected;
    }
  } catch (err) {
    console.warn("⚠️ evaluateSingleCondition error:", err, { checkVal, expected, operator });
    return false;
  }
}

/**
 * ⚙️ evaluateCondition()
 * - Evaluates a field rule condition (supports "empty", "not_empty", comparisons, etc.)
 * - Automatically normalizes undefined/null/whitespace-only values
 *
 * Example:
 *   when: {
 *     operator: "equals",
 *     value: "Noodle"
 *   }
 * or:
 *   when: [
 *     { operator: "equals", value: "Noodle" },
 *     { operator: "not_empty" }
 *   ],
 *   logicOperator: "AND"
 */

export function evaluateCondition(
  leftValue: any,
  condition: { operator: string; value?: any } | { operator: string; value?: any }[],
  logicOperator: "AND" | "OR" = "AND"
): boolean {
  if (!condition) return false;

  // 🧩 Support array of conditions (logic groups)
  if (Array.isArray(condition)) {
    if (logicOperator === "AND") {
      return condition.every((c) => evaluateCondition(leftValue, c, "AND"));
    } else {
      return condition.some((c) => evaluateCondition(leftValue, c, "OR"));
    }
  }

  // ✅ Normalize left value (resolve from object-like values)
  let left = leftValue;
  if (typeof left === "object" && left !== null) {
    const primitiveKeys = ["value", "label", "name", "item_name", "id"];
    const hasPrimitive = primitiveKeys.some((k) => k in left);
    if (hasPrimitive) {
      left =
        left.value ??
        left.label ??
        left.name ??
        left.item_name ??
        left.id ??
        JSON.stringify(left);
    }
  }

  // ✅ Normalize to lowercase, trimmed strings for consistency
  const rawLeft = left;
  const leftStr = String(left ?? "").trim().toLowerCase();
  const right = condition.value;
  const rightStr = right != null ? String(right).trim().toLowerCase() : "";
  const operator = (condition.operator || "equals").toLowerCase();

  // 🧩 Normalize stringified null/undefined into truly empty values
  const normalizedLeft =
    rawLeft == null ||
    leftStr === "undefined" ||
    leftStr === "null" ||
    leftStr === ""
      ? ""
      : rawLeft;

  let result = false;

  switch (operator) {
    case "equals":
      result = leftStr === rightStr;
      break;

    case "not_equals":
      result = leftStr !== rightStr;
      break;

    case "contains":
      result = leftStr.includes(rightStr);
      break;

    case "not_contains":
      result = !leftStr.includes(rightStr);
      break;

    case "in":
      result = Array.isArray(right)
        ? right.map(String).includes(String(left))
        : false;
      break;

    case "gt":
      result = Number(left) > Number(right);
      break;

    case "gte":
      result = Number(left) >= Number(right);
      break;

    case "lt":
      result = Number(left) < Number(right);
      break;

    case "lte":
      result = Number(left) <= Number(right);
      break;

    case "starts_with":
      result = leftStr.startsWith(rightStr);
      break;

    case "ends_with":
      result = leftStr.endsWith(rightStr);
      break;

    case "empty":
      result =
        normalizedLeft == null ||
        String(normalizedLeft).trim() === "" ||
        leftStr === "undefined" ||
        leftStr === "null";
      break;

    case "not_empty":
      result =
        normalizedLeft != null &&
        String(normalizedLeft).trim() !== "" &&
        leftStr !== "undefined" &&
        leftStr !== "null";
      break;

    case "regex":
      try {
        const re = new RegExp(right);
        result = re.test(String(left));
      } catch {
        result = false;
      }
      break;

    default:
      result = leftStr === rightStr;
  }

  return result;
}
