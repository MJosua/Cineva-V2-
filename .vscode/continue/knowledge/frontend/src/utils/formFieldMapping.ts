
import { FormField, RowGroup, RowData } from '@/types/formTypes';

export interface TicketColumnMapping {
  [key: string]: any; // cstm_col1, cstm_col2, etc.
}

export interface TicketLabelMapping {
  [key: string]: string; // lbl_col1, lbl_col2, etc.
}

export interface MappedTicketData extends TicketColumnMapping, TicketLabelMapping { }

/**
 * Maps form data to ticket database column structure
 * @param formData - Raw form submission data
 * @param fields - Form field definitions
 * @returns Object with cstm_colX and lbl_colX properties
 */
export const mapFormDataToTicketColumns = (
  formData: Record<string, any>,
  fields: FormField[],
  rowGroups: RowGroup[] = []
): MappedTicketData => {
  const mappedData: MappedTicketData = {};
  let counter = 1;

  // 🔹 Step 1: Map regular fields
  fields.forEach((field, index) => {
    const cstmColKey = `cstm_col${counter}`;
    const lblColKey = `lbl_col${counter}`;

    const fieldKey = field.name || field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fieldValue = formData[fieldKey];

    mappedData[cstmColKey] = fieldValue ?? '';
    mappedData[lblColKey] = field.label;
    counter++;
  });

  // 🔸 Step 2: Map structured row groups
  rowGroups.forEach((group) => {
    if (!group.structure || !group.rowGroup) return;

    const { firstColumn, secondColumn, thirdColumn, combinedMapping } = group.structure;

    group.rowGroup.forEach((row: RowData) => {
      const mappings = {
        first: { value: row.firstValue, label: firstColumn?.label },
        second: { value: row.secondValue, label: secondColumn?.label },
        third: { value: row.thirdValue, label: thirdColumn?.label }
      };

      if (combinedMapping === 'first_second') {
        // Combine first + second
        const cstmVal = [mappings.first.value, mappings.second.value].filter(Boolean).join(' ');
        const lblVal = [mappings.first.label, mappings.second.label].filter(Boolean).join(' + ');

        if (mappings.third.value && mappings.third.label) {
          mappedData[`cstm_col${counter}`] = mappings.third.value;
          mappedData[`lbl_col${counter}`] = mappings.third.label;
          counter++;
        }

        mappedData[`cstm_col${counter}`] = cstmVal;
        mappedData[`lbl_col${counter}`] = lblVal;
        counter++;

      } else if (combinedMapping === 'second_third') {
        // Combine second + third
        const cstmVal = [mappings.second.value, mappings.third.value].filter(Boolean).join(' ');
        const lblVal = [mappings.second.label, mappings.third.label].filter(Boolean).join(' + ');

        if (mappings.first.value && mappings.first.label) {
          mappedData[`cstm_col${counter}`] = mappings.first.value;
          mappedData[`lbl_col${counter}`] = mappings.first.label;
          counter++;
        }

        mappedData[`cstm_col${counter}`] = cstmVal;
        mappedData[`lbl_col${counter}`] = lblVal;
        counter++;

      } else {
        // No combination: map all individually
        ['first', 'second', 'third'].forEach((key) => {
          const col = mappings[key as keyof typeof mappings];
          if (col.value !== undefined && col.label) {
            mappedData[`cstm_col${counter}`] = col.value;
            mappedData[`lbl_col${counter}`] = col.label;
            counter++;
          }
        });
      }
    });
  });

  return mappedData;
};

/**
 * Converts ticket column data back to form data structure
 * @param ticketData - Data with cstm_colX and lbl_colX structure
 * @param fields - Form field definitions
 * @returns Form data object
 */
export const mapTicketColumnsToFormData = (
  ticketData: MappedTicketData,
  fields: FormField[]
): Record<string, any> => {
  const formData: Record<string, any> = {};

  fields.forEach((field, index) => {
    const columnIndex = index + 1;
    const cstmColKey = `cstm_col${columnIndex}`;

    const fieldKey = field.name || field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    formData[fieldKey] = ticketData[cstmColKey] || '';
  });

  return formData;
};

/**
 * Gets the maximum number of supported form fields (based on database columns)
 */
export const getMaxFormFields = (): number => {
  return 15; // t_ticket_detail supports cstm_col1 through cstm_col15
};

/**
 * Validates that form doesn't exceed maximum field limit
 * @param fieldCount - Total number of fields
 */
export const validateFormFieldCount = (fieldCount: number): boolean => {
  return fieldCount <= getMaxFormFields();
};

export const mapUnifiedForm = (
  data: Record<string, any>,
  items: any[],
  selectedObjects: Record<string, any> = {}
) => {
  if (!data || !Array.isArray(items)) return [];

  return items
    .flatMap((item) => {
      if (!item || !item.data) return null;

      switch (item.type) {
        // --- NORMAL FIELD ---
        case "field": {
          const name = item.data.name;
          const label = item.data.label || name;
          const value = data[name] ?? "";
          const selectedObject = selectedObjects[name] ?? null;

          // 🔹 Primary mapped field
          const mainField = {
            id: item.id,
            name,
            label: item.data.label || name,
            value,
            selectedObject,
          };

          // 🔹 Prepare an array of results (main + maybe generated)
          const result = [mainField];

          const isFactoryField =
            label.toLowerCase().includes("factory") || name.toLowerCase().includes("factory");
      

          // ✅ Auto-generate `_id` field if selectedObject.filter exists
          if (isFactoryField && selectedObject?.filter !== undefined && selectedObject?.filter !== null) {
            const syntheticField = {
              id: `${item.id}_id`,
              name: `${name}_id`,
              label: `${item.data.label}_id`,
              value: String(selectedObject.filter),
              selectedObject: null,
            };
            result.push(syntheticField);
          }

          console.log(`🧩 field mapped →`, result);
          return result;
        }

        // --- SECTION FIELD ---
        case "section":
          return {
            id: item.id,
            type: "section",
            label: item.data.label || "Section",
            fields: (item.data.fields || []).map((f) => ({
              name: f.name,
              value: data[f.name] ?? "",
              selectedObject: selectedObjects[f.name] ?? null, // ✅ each sub-field gets its selectedObject
            })),
          };

        // --- ROWGROUP FIELD ---
        case "rowgroup": {
          const structure = item.data.structure || {};
          const combinedMapping = structure.combinedMapping || null;
          const defaultRows = item.data.rowGroup || [];
          const inputRows = data[item.id] || defaultRows;

          const rows = inputRows.map((row: any) => {
            const resultRow: Record<string, any> = { id: row.id };

            // 🔹 Copy all default columns
            if ("firstValue" in row) resultRow.firstValue = row.firstValue;
            if ("secondValue" in row) resultRow.secondValue = row.secondValue;
            if ("thirdValue" in row) resultRow.thirdValue = row.thirdValue;

            // 🔹 Handle combined mapping (e.g., "second_third")
            if (combinedMapping) {
              const [left, right] = combinedMapping.split("_");
              const leftVal = row[`${left}Value`] ?? row[left] ?? "";
              const rightVal = row[`${right}Value`] ?? row[right] ?? "";
              if (leftVal || rightVal) {
                resultRow.combinedValue = `${leftVal} ${rightVal}`.trim();
              }
            }

            return resultRow;
          });

          return {
            id: item.id,
            type: "rowgroup",
            label: item.data.label || "Row Group",
            rows,
            combinedMapping,
          };
        }

        // --- DEFAULT FALLBACK ---
        default:
          const name = item.id;
          return {
            id: item.id,
            type: item.type,
            value: data[item.id] ?? "",
            selectedObject: selectedObjects[name] ?? null,
          };
      }
    })
    .filter(Boolean);
};
