import { getFilteredOptions, getNested } from "@/utils/dependencyResolver";
import { evaluateCondition } from "./ruleoperator/ruleoperators";
import { ruleActions } from "./ruleActions";
import { useEffect } from "react";

/**
 * applyFieldRules - robust version with:
 * - deterministic rule evaluation (no stale matches)
 * - explicit default rule application
 * - globalized rule application (rowContext temporarily ignored)
 * - reliable setGlobalValues updates (detects real changes)
 * - microtask-set for autoSelectFirst
 * - verbose DEBUG logs controllable via window.__debugRules
 */

const lastApiValue: Record<string, any> = {};
const lastClearTrigger: Record<string, any> = {};
const lastRowValues: Record<string, any> = {};
const debugMode = true;
const DEBUG = debugMode && typeof window !== "undefined" && !!(window as any).__debugRules;

// mapping logical names -> row keys
const fieldMap: Record<string, string> = {
  item_name: "firstValue",
  quantity: "secondValue",
  unit: "thirdValue",
  firstColumn: "firstValue",
  secondColumn: "secondValue",
  thirdColumn: "thirdValue",
};


function resolveFieldValue(fieldName: string, schema: any, globalValues: any, rowContext?: any) {
  // Try direct global value first
  if (globalValues?.[fieldName] !== undefined) return globalValues[fieldName];

  // If field belongs to a rowgroup
  const fieldDef = schema?.fieldMap?.[fieldName];
  const rowGroupId = fieldDef?.rowGroup;

  if (rowGroupId && globalValues?.[rowGroupId]) {
    const rows = globalValues[rowGroupId];
    if (Array.isArray(rows)) {
      // If there's a rowContext, return specific row
      if (rowContext?.rowId) {
        const found = rows.find((r) => r.id === rowContext.rowId);
        if (found) {
          const key = fieldMap[fieldName] || "firstValue";
          return found[key];
        }
      }
      // Otherwise return all rows (firstValue, secondValue, etc.)
      return rows.map((r) => ({
        firstValue: r.firstValue,
        secondValue: r.secondValue,
        thirdValue: r.thirdValue,
      }));
    }
  }

  // Nothing found
  return undefined;
}


function isSame(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

export function applyFieldRules(
  field: any,
  {
    watchedValues,
    schema,
    globalValues,
    selectedObjects = {},
    onFieldOptionsUpdate,
    autoSetValue,
    rowContext,
    setGlobalValues,
    onUpdateRowGroup,

  }: {
    watchedValues?: Record<string, any>;
    globalValues?: Record<string, any>;
    selectedObjects?: Record<string, any>;
    onFieldOptionsUpdate?: (fieldName: string, newOptions: any[]) => void;
    autoSetValue?: (fieldName: string, value: any, fullOption: any) => void;
    rowContext?: { rowGroupId?: string; rowId?: string; columnKey?: string; currentEditingRowId?: string };
    setGlobalValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    onUpdateRowGroup?: (groupId: string, updatedRows: any[]) => void;
  }
) {

  const fieldDef = schema?.fieldMap?.[field.name];
  const fieldScope = fieldDef?.scope || "global";
  const rowGroupId = fieldDef?.rowGroup || null;

  if (!field || !field.rules) return field;

  // prevent overlapping rule execution
  if (typeof window !== "undefined") {
    if ((window as any).__ruleProcessingField && (window as any).__ruleProcessingField !== field.name) {
      if (DEBUG) console.log(`⏳ Queued: ${field.name} waiting for ${(window as any).__ruleProcessingField}`);
      setTimeout(() => {
        try {
          applyFieldRules(field, {
            watchedValues,
            globalValues,
            selectedObjects,
            onFieldOptionsUpdate,
            autoSetValue,
            setGlobalValues,
            onUpdateRowGroup,
            rowContext: {},
            schema,
          });
        } catch (e) {
          if (DEBUG) console.warn("Retry applyFieldRules failed", e);
        }
      }, 40);
      return field;
    }
    (window as any).__ruleProcessingField = field.name;
    if ((window as any).__ruleLockActive) {
      (window as any).__ruleProcessingField = null;
      return field;
    }
    (window as any).__ruleLockActive = true;
  }

  try {
    const values = watchedValues || globalValues || {};

    if (DEBUG) {
      console.log("▶ applyFieldRules start:", field?.name, {
        rowContext,
        keysInGlobal: Object.keys(globalValues || {}).slice(0, 40),
      });
    }

    let updated = { ...field };
    let matchedRule: any = null;
    let defaultRule: any = null;

    for (const rule of field.rules) {
      try {
        if (rule.default) {
          defaultRule = rule;
          continue;
        }

        const sourceField = rule.dependsBy || rule.when?.field;
        if (!sourceField) continue;

        // 🧩 Global-only dependency resolution (ignore rowContext)
        let parentRaw: any =
          resolveFieldValue(sourceField, schema, globalValues, rowContext) ??
          selectedObjects?.[sourceField]?.value ??
          values?.[sourceField] ??
          selectedObjects?.[sourceField] ??
          "";

        const compareVal =
          typeof parentRaw === "object" && rule.dependsByValue
            ? getNested(parentRaw, rule.dependsByValue)
            : parentRaw ?? "";

        // handle changed-operator
        if (rule.when?.operator === "changed") {
          const rowKey = `${field.name}__watch_${sourceField}`;
          const serialized = JSON.stringify(compareVal);
          const prev = lastRowValues[rowKey];
          const changed = prev !== serialized;
          lastRowValues[rowKey] = serialized;
          if (!changed) continue;
          matchedRule = rule;
          continue;
        }

        const matches = evaluateCondition(compareVal, rule.when, rule.logicOperator || "AND");
        if (matches) matchedRule = rule;
      } catch (e) {
        console.warn("⚠ rule evaluation error for", field?.name, e);
      }
    }

    const activeRule: any = matchedRule || defaultRule;
    if (!activeRule?.then) return { ...field };

    const applied = { ...activeRule.then };

    // rounding normalization
    if (Object.prototype.hasOwnProperty.call(applied, "rounding")) {
      const parsed = Number(applied.rounding);
      applied.rounding = !isNaN(parsed) && parsed > 0 ? parsed : 0;
    }

    // unified setter
    const safeAutoSetValue = (fieldName: string, value: any, fullOption?: any) => {
      const newVal = value ?? "";

      if (rowContext?.rowGroupId) {
        // 🧩 Update inside rowgroup (structured input)
        setGlobalValues?.((prev) => {
          const rows = prev?.[rowContext.rowGroupId] || [];
          const updatedRows = rows.map((r) =>
            r.id === rowContext.rowId
              ? { ...r, [fieldMap[fieldName] || "thirdValue"]: newVal }
              : r
          );
          console.log(
            `✅ Updated rowgroup '${rowContext.rowGroupId}' → ${fieldName}=${newVal}`
          );
          return { ...prev, [rowContext.rowGroupId]: updatedRows };
        });
      } else {
        // 🌐 Update global fields
        setGlobalValues?.((prev) => {
          const oldVal = prev?.[fieldName];
          if (isSame(oldVal, newVal)) return prev;
          console.log(`✅ Updated global field '${fieldName}'=${newVal}`);
          return { ...prev, [fieldName]: newVal };
        });
      }
    };

    // ---------- CLEARSELF globalized ----------
    if (applied.clearSelf) {
      const dependsByField = activeRule.dependsBy || activeRule.when?.field;
      const dependencyValue =
        selectedObjects?.[dependsByField]?.value ??
        values?.[dependsByField] ??
        selectedObjects?.[dependsByField] ??
        "";

      if (lastClearTrigger[field.name] === dependencyValue) {
        console.log(`⚪ clearSelf for ${field.name} already applied for value`, dependencyValue);
      } else {
        lastClearTrigger[field.name] = dependencyValue;
        console.log(`🧹 clearSelf triggered for ${field.name} (depends on ${dependsByField})`);

        // Always clear own field
        safeAutoSetValue(field.name, "");
        queueMicrotask(() =>
          onFieldOptionsUpdate?.(field.name, [{ label: "No Data Found", value: "" }])
        );

        // --- 🔍 New logic ---
        // If the source dependency is a global field but the current field is a row field,
        // then reset all rowgroups globally too.
        const sourceFieldScope = schema?.fieldMap?.[dependsByField]?.scope;
        const currentFieldScope = schema?.fieldMap?.[field.name]?.scope;

        if (sourceFieldScope === "global" && currentFieldScope === "row") {
          const targetGroups =
            Object.keys(globalValues || {}).filter((key) => key.startsWith("rowgroup_"));

          if (targetGroups.length === 0 && schema?.groups) {
            schema.groups.forEach((g: any) => {
              const updatedRows = [
                {
                  id: `row_${Date.now()}`,
                  firstValue: "",
                  secondValue: "",
                  thirdValue: "",
                },
              ];
              setGlobalValues?.((prev) => ({ ...prev, [g.id]: updatedRows }));
              queueMicrotask(() => onUpdateRowGroup?.(g.id, updatedRows));
              console.log(`🧹 [clearSelf] '${dependsByField}' (schema fallback) → reset '${g.id}'`);
            });
          } else {
            targetGroups.forEach((key) => {
              const updatedRows = [
                {
                  id: `row_${Date.now()}`,
                  firstValue: "",
                  secondValue: "",
                  thirdValue: "",
                },
              ];
              setGlobalValues?.((prev) => ({ ...prev, [key]: updatedRows }));
              queueMicrotask(() => onUpdateRowGroup?.(key, updatedRows));
              console.log(`🧹 [clearSelf] '${dependsByField}' → reset structured group '${key}'`);
            });
          }
        }

        console.log(`🧹 [clearSelf] Global field '${field.name}' cleared`);
      }
    }

    // ---------- Apply rule actions ----------
    for (const [key, action] of Object.entries(ruleActions)) {
      if (applied[key] !== undefined && key !== "api") {
        try {
          if (key === "autoSelectFirst") {
            console.log(`⚙️ autoSelectFirst triggered for ${field.name}`);

            const currentVal =
              globalValues?.[field.name] ??
              (rowContext?.rowGroupId
                ? globalValues?.[rowContext.rowGroupId]?.find(
                  (r) => r.id === rowContext.rowId
                )?.[fieldMap[field.name] || "thirdValue"]
                : field.value);

            if (currentVal !== undefined && currentVal !== "") {
              console.log(
                `⚪ autoSelectFirst skipped for ${field.name} — already has value:`,
                currentVal
              );
              continue;
            }

            const globalSnapshot = { ...(globalValues || {}) };

            // Delay slightly to ensure options are ready
            setTimeout(() => {
              console.log(`🔍 Evaluating options for autoSelectFirst → ${field.name}`);

              if (rowContext?.rowGroupId && Array.isArray(globalSnapshot[rowContext.rowGroupId])) {
                console.log(
                  `🧩 Row context detected for '${field.name}' in '${rowContext.rowGroupId}' (rowId=${rowContext.rowId})`
                );

                const schemaField = schema?.fieldMap?.[field.name];
                const depField = schemaField?.dependsOn;

                let availableOptions = getFilteredOptions(field, field.options || [], {
                  globalValues,
                  selectedObjects,
                });
                
                // Refresh options if dependsOn exists
                if (depField && globalSnapshot[depField]) {
                  console.log(`🔁 Field '${field.name}' depends on '${depField}', using schema-defined options`);
                  availableOptions = Array.isArray(schemaField?.options)
                    ? schemaField.options
                    : availableOptions;
                }

                console.log("📦 Available options for autoSelectFirst:", availableOptions);

                if (availableOptions?.length > 0) {
                  const first = availableOptions[0];
                  const autoVal =
                    typeof first === "object"
                      ? first.value ?? first.label ?? first.po_number ?? first.item_name
                      : first;

                  safeAutoSetValue(field.name, autoVal, first);
                  console.log(`✅ autoSelectFirst applied — '${field.name}' set to '${autoVal}'`);
                } else {
                  console.log(`⚠️ autoSelectFirst found no available options for '${field.name}'`);
                }
              } else {
                console.warn(
                  `⚠️ autoSelectFirst skipped: globalSnapshot missing or invalid rowgroup '${rowContext?.rowGroupId}'`
                );
              }
            }, 50);

            continue;
          }

          // Other rule actions (e.g. rounding)
          action({ ...updated }, applied, {
            autoSetValue: safeAutoSetValue,
            globalValues,
            selectedObjects,
            setGlobalValues,
            onFieldOptionsUpdate,
          });
        } catch (e) {
          console.warn("⚠️ ruleActions error", key, e);
        }
      }
    }

    // ---------- API handling ----------
    if (applied.api) {
      const dependsByField = activeRule.dependsBy || activeRule.when?.field;
      const parentObj = selectedObjects?.[dependsByField] ?? values?.[dependsByField];
      const extractedVal =
        typeof parentObj === "object"
          ? getNested(parentObj, applied.dependsByValue || "value") ??
          parentObj.value ??
          parentObj.label ??
          parentObj.id ??
          null
          : parentObj;

      if (extractedVal !== undefined && extractedVal !== null) {
        if (lastApiValue[field.name] === extractedVal) {
          if (DEBUG) console.log(`⚪ API skip for ${field.name} (same extracted value)`);
        } else {
          lastApiValue[field.name] = extractedVal;
          (field as any).__apiPending = true;
          ruleActions
            .api(applied, extractedVal)
            .then((res: any) => {
              (field as any).__apiPending = false;
              const payload = res?.data ?? res;
              const formatted = Array.isArray(payload)
                ? payload.map((d) => d.po_number ?? d.label ?? d.value ?? d)
                : [payload];
              const fallback =
                formatted.length > 0
                  ? formatted
                  : [{ label: "No Data Found", value: "" }];
              onFieldOptionsUpdate?.(field.name, fallback);

              if (applied.autoSelectFirst && fallback[0]) {
                const first = fallback[0];
                const autoVal =
                  typeof first === "object"
                    ? first.value ?? first.label ?? first.po_number
                    : first;
                queueMicrotask(() => safeAutoSetValue(field.name, autoVal, first));
              }
            })
            .catch((err) => {
              (field as any).__apiPending = false;
              console.warn("⚠ API call failed", err);
            });
        }
      }
    }


    return { ...updated, ...applied };
  } finally {
    if (typeof window !== "undefined") {
      (window as any).__ruleLockActive = false;
      (window as any).__ruleProcessingField = null;
    }
  }
}
