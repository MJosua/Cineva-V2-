import React, { useCallback, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RowGroup } from "@/types/formTypes";
import { SuggestionInsertInput } from "./SuggestionInsertInput";
import { NumberField } from "./NumberField";
import { compareValues, getFilteredOptions, getNested } from "@/utils/dependencyResolver";
import { applyFieldRules } from "@/utils/rulingSystem/applyFieldRules";
import { useToast } from "@/hooks/use-toast";

interface RowData {
  id: string;
  firstValue: string;
  secondValue: string;
  thirdValue: string;
}

interface StructuredRowGroupProps {
  rowGroup: RowGroup;
  rowGroupId: string;
  form: UseFormReturn<any>;
  maxTotalFields: number;
  currentFieldCount: number;
  onUpdateRowGroup: (groupId: string, updatedRows: RowData[]) => void;
  watchedValues?: Record<string, any>;
  selectedObjects?: Record<string, any>;
  globalValues: Record<string, any>;
  setGlobalValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  schema?: any;
}

export const StructuredRowGroup: React.FC<StructuredRowGroupProps> = ({
  rowGroup,
  rowGroupId,
  form,
  onUpdateRowGroup,
  watchedValues,
  selectedObjects,
  globalValues,
  setGlobalValues,
  schema,
}) => {
  const structure = rowGroup.structure;

  const { toast } = useToast();

  const rows: RowData[] = useMemo(() => {
    const currentRows = globalValues?.[rowGroupId];
    if (Array.isArray(currentRows)) {
      return [...currentRows]; // Always create new reference
    }

    const initialRow: RowData = {
      id: `row_${Date.now()}`,
      firstValue: "",
      secondValue: "",
      thirdValue: "",
    };

    setGlobalValues((prev) => ({
      ...prev,
      [rowGroupId]: [initialRow],
    }));

    return [initialRow];
  }, [globalValues, rowGroupId]);

  const syncToGlobal = (newRows: RowData[]) => {
    setGlobalValues((prev) => {
      const prevRows = prev[rowGroupId] || [];
      // Skip if a rule just reset the group and newRows is identical
      if (
        prevRows.length === 1 &&
        prevRows[0].firstValue === "" &&
        prevRows[0].secondValue === "" &&
        prevRows[0].thirdValue === "" &&
        newRows.length === 1 &&
        newRows[0].firstValue === "" &&
        newRows[0].secondValue === "" &&
        newRows[0].thirdValue === ""
      ) {
        console.log("⚠️ Skipped redundant update (already reset)");
        return prev;
      }
      return { ...prev, [rowGroupId]: newRows };
    });
    onUpdateRowGroup(rowGroupId, newRows);
  };


  const updateRowField = (rowId: string, field: keyof RowData, value: string) => {
    setGlobalValues((prev) => {
      const updated = {
        ...prev,
        __lastEditedField: field, // mark last edited field
        [rowGroupId]: prev[rowGroupId].map((r) =>
          r.id === rowId ? { ...r, [field]: value } : r
        ),
      };

      // 🧩 if we changed quantity, manually trigger re-evaluation of 'unit'
      if (field === "secondValue") {
        const unitCol = structure.thirdColumn;
        console.log("🧩 unitCol structure before rules:", unitCol);
        applyFieldRules(unitCol, {
          watchedValues: updated,
          selectedObjects: selectedObjects || {},
          rowContext: { rowGroupId, rowId, columnKey: "thirdColumn" },
          setGlobalValues,
          globalValues: updated,
          schema,
        });
        console.log("⚙️ Forced rule evaluation for 'unit' after quantity change", field);
        console.log("globalvalue", globalValues)
      }

      return updated;
    });
  };

  const addRow = () => {
    if (rowGroup.maxRows > rows.length) {
      const newRow: RowData = {
        id: `row_${Date.now()}`,
        firstValue: "",
        secondValue: "",
        thirdValue: "",
      };

      console.log("➕ Adding new row:", newRow);

      // 🧩 Update globalValues safely (no double trigger)
      setGlobalValues((prev) => {
        const existing = Array.isArray(prev[rowGroupId]) ? prev[rowGroupId] : [];
        const updated = [...existing, newRow];

        // 🧠 Initialize the new row’s rule memory (so 'changed' doesn’t trigger)
        if (typeof window !== "undefined") {
          window.__ruleTrackers = window.__ruleTrackers || {};
          window.__ruleTrackers[rowGroupId] = window.__ruleTrackers[rowGroupId] || {};
          window.__ruleTrackers[rowGroupId][newRow.id] = {
            lastValues: { firstValue: "", secondValue: "", thirdValue: "" },
          };
        }

        return { ...prev, [rowGroupId]: updated };
      });

      // 🧠 Sync back to form structure
      onUpdateRowGroup(rowGroupId, [
        ...(globalValues?.[rowGroupId] || []),
        newRow,
      ]);
    } else {
      toast({
        title: `Can't Add More Item`,
        description: `Failed to add item, max is ${rowGroup.maxRows}`,
        variant: "destructive",
      });
    }
  };


  const removeRow = (rowId: string) => {
    const updated = rows.filter((r) => r.id !== rowId);
    if (updated.length > 0) syncToGlobal(updated);
  };

 

  const filteredFirstOptions = useMemo(() => {
    const col = structure.firstColumn;
    const opts = Array.isArray(col.options) ? col.options : [];
    return getFilteredOptions(col, opts, {
      globalValues,
      selectedObjects,
    });
  }, [structure.firstColumn.options, globalValues, selectedObjects]);
  
  const filteredSecondOptions = useMemo(() => {
    const col = structure.secondColumn;
    const opts = Array.isArray(col.options) ? col.options : [];
    return getFilteredOptions(col, opts, {
      globalValues,
      selectedObjects,
    });
  }, [structure.secondColumn.options, globalValues, selectedObjects]);
  
  const filteredThirdOptions = useMemo(() => {
    const col = structure.thirdColumn;
    const opts = Array.isArray(col.options) ? col.options : [];
    return getFilteredOptions(col, opts, {
      globalValues,
      selectedObjects,
    });
  }, [structure.thirdColumn.options, globalValues, selectedObjects]);

  const renderField = useCallback((
    column: "firstColumn" | "secondColumn" | "thirdColumn",
    value: string,
    onChange: (val: string) => void,
    rowId?: string
  ) => {
    let col = structure[column];


    col = applyFieldRules(col, {
      watchedValues: globalValues,
      selectedObjects: selectedObjects || {},
      rowContext: {
        rowGroupId,
        columnKey: column,
        rowId,  // ✅ already known
        currentEditingRowId: rowId, // ✅ FIX: use the parameter, not r
        rowContext: { rowGroupId },
      },
      setGlobalValues,
      schema,
      autoSetValue: (fieldName: string, value: any) => {
        const updatedRows = (globalValues?.[rowGroupId] || rows || []).map((r) => {
          // 🧩 If a rule triggers clearing, clear all fields in the row
          if (value === "" || value === null) {
            return {
              ...r,
              firstValue: "",
              secondValue: "",
              thirdValue: "",
            };
          }

          // 🧩 Otherwise, only update the related column normally
          const fieldKey =
            column === "firstColumn"
              ? "firstValue"
              : column === "secondColumn"
                ? "secondValue"
                : "thirdValue";

          return {
            ...r,
            [fieldKey]: value ?? "",
          };
        });

        setGlobalValues((prev) => ({
          ...prev,
          [rowGroupId]: updatedRows,
        }));

        if (value === "" || value === null) {
          console.log(`🧹 Cleared ALL columns (first, second, third) in ${rowGroupId}`);
        } else {
          console.log(`🧹 Cleared only '${column}' (${fieldName}) in ${rowGroupId}`);
        }
      },
    });


    const opts =
      column === "firstColumn"
        ? filteredFirstOptions
        : column === "secondColumn"
          ? filteredSecondOptions
          : filteredThirdOptions;

    switch (col.type) {
      case "suggestion-insert":
        return (
          <SuggestionInsertInput
            suggestions={opts}
            placeholder={col.placeholder}
            required={col.required}
            value={value}
            onChange={onChange}
          />
        );
      case "number":
        return (
          <NumberField
            value={value}
            onChange={(v) => onChange(v)}
            placeholder={col.placeholder}
            rounding={col.rounding}
            maxValue={col.maxnumber}
            readOnly={col.readonly}
            required={col.required}
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={(v) => onChange(v)} disabled={col.readonly}
            required={col.required}

          >
            <SelectTrigger>
              <SelectValue placeholder={col.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o, i) => {
                const text =
                  typeof o === "object"
                    ? o.label ?? o.item_name ?? o.name ?? JSON.stringify(o)
                    : String(o);
                return (
                  <SelectItem key={i} value={text}>
                    {text}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={col.placeholder}
          />
        );
    }
  }, [structure, globalValues, selectedObjects, schema]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Item List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-6 gap-4">
              <div className="col-span-3">
                {renderField("firstColumn", r.firstValue, (v) => updateRowField(r.id, "firstValue", v), r.id)}
              </div>
              <div className="col-span-1">
                {renderField("secondColumn", r.secondValue, (v) => updateRowField(r.id, "secondValue", v), r.id)}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {renderField("thirdColumn", r.thirdValue, (v) => updateRowField(r.id, "thirdValue", v), r.id)}
                {rows.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeRow(r.id)} className="h-[38px]">
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
