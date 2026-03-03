import React, { useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicField } from "./DynamicField";
import { StructuredRowGroup } from "./StructuredRowGroup";
import { SpecialFuncFactory } from "./specialFunc/SpecialFuncFactory";
import { FormField, RowGroup } from "@/types/formTypes";
import { applyFieldRules } from "@/utils/rulingSystem/applyFieldRules";

interface DynamicSectionProps {
  section: any;
  form: any;
  watchedValues: Record<string, any>;
  selectedObjects: Record<string, any>;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  setGlobalValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  globalValues: Record<string, any>;
  setSelectedObjects: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  handleUpdateRowGroup?: (groupId: string, updatedRows: any[]) => void;
  isSubmitting?: boolean;
  setIsSubmitting?: React.Dispatch<React.SetStateAction<boolean>>;
  schema?: any; // 🧩 NEW - for rule evaluation
  onFieldOptionsUpdate?: (fieldName: string, newOptions: any[]) => void; // 🧩 NEW
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({
  section,
  form,
  watchedValues,
  selectedObjects,
  setConfig,
  setGlobalValues,
  globalValues,
  setSelectedObjects,
  handleUpdateRowGroup,
  isSubmitting,
  setIsSubmitting,
  schema,
  onFieldOptionsUpdate,
}) => {
  // 🧩 normalize possible nested structure
  const rawFields = section.fields || [];
  const fields = rawFields.map((f: any) => f.data ?? f); // 👈 unwrap data layer if exists

  const title = section.title || "Section";

  // 🧩 Handle field options update (for API rule results)
  const handleFieldOptionsUpdateInternal = useCallback(
    (fieldName: string, newOptions: any[]) => {
      console.log(`🧩 [DynamicSection] Updating options for ${fieldName}`, newOptions);
      if (onFieldOptionsUpdate) {
        onFieldOptionsUpdate(fieldName, newOptions);
      }
      // Also update the section's field options in config
      setConfig((prev: any) => ({
        ...prev,
        items: prev.items.map((item: any) => {
          if (item.type === "section" && item.data?.fields) {
            return {
              ...item,
              data: {
                ...item.data,
                fields: item.data.fields.map((f: any) =>
                  (f.name || f.data?.name) === fieldName
                    ? { ...f, options: newOptions, data: f.data ? { ...f.data, options: newOptions } : undefined }
                    : f
                ),
              },
            };
          }
          return item;
        }),
      }));
    },
    [onFieldOptionsUpdate, setConfig]
  );

  // 🧩 Apply rules to fields (similar to DynamicForm.tsx)
  const fieldsWithRules = useMemo(() => {
    return fields.map((field: FormField) => {
      if (!field.rules || field.rules.length === 0) return field;

      const ruledField = applyFieldRules(field, {
        globalValues,
        selectedObjects,
        onFieldOptionsUpdate: handleFieldOptionsUpdateInternal,
        setGlobalValues,
        rowContext: {},
        schema,
      });
      return ruledField;
    });
  }, [fields, globalValues, selectedObjects, handleFieldOptionsUpdateInternal, setGlobalValues, schema]);



  // 🧩 unified handler for updating field value
  const handleFieldChange = (fieldName: string, value: any, fullOption?: any) => {
    form.setValue(fieldName, value);

    setGlobalValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    setSelectedObjects((p) => ({
      ...p,
      [fieldName]: fullOption && typeof fullOption === "object" ? fullOption : { value },
    }));

    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.data?.name === fieldName
          ? { ...item, data: { ...item.data, value } }
          : item
      ),
    }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setSelectedObjects((prev) => ({
      ...prev,
      __lastBlurField: fieldName,
    }));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fieldsWithRules.map((f: FormField | RowGroup, i: number) => {
            const key =
              (f as FormField).name ||
              f.label?.toLowerCase()?.replace(/[^a-z0-9]/g, "_") ||
              `field_${i}`;

            if ((f as FormField).type && (f as FormField).type !== "rowgroup") {
              const field = f as FormField;

              return (
                <DynamicField
                  key={field.name || i}
                  field={field}
                  value={globalValues[field.name] ?? field.value ?? ""}
                  globalValues={globalValues}
                  setGlobalValues={setGlobalValues}
                  setConfig={setConfig}
                  onChange={(val, full) => handleFieldChange(field.name, val, full)}
                  onBlur={() => handleFieldBlur(field.name)}
                  watchedValues={watchedValues}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              );
            }

            if ((f as RowGroup).type === "rowgroup") {
              const rg = f as RowGroup;
              return (
                <div key={rg.id || `rg_${i}`} className="col-span-3">
                  <StructuredRowGroup
                    rowGroup={rg}
                    rowGroupId={rg.id}
                    form={form}
                    watchedValues={watchedValues}
                    selectedObjects={selectedObjects}
                    currentFieldCount={0}
                    maxTotalFields={50}
                    globalValues={globalValues}
                    setGlobalValues={setGlobalValues}
                    onUpdateRowGroup={handleUpdateRowGroup || (() => { })}
                  />
                </div>
              );
            }

            if ((f as any).type === "specialfunc") {
              const spf = f as any;
              return (
                <div key={spf.id || `sp_${i}`} className="col-span-3">
                  <SpecialFuncFactory
                    data={spf.data} // DynamicSection unwraps data above, but check structure
                    globalValues={globalValues}
                    setGlobalValues={setGlobalValues}
                    id={spf.id}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
};
