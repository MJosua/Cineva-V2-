import { FormItem, FormField, FormSection, RowGroup, RowData } from '@/types/formTypes';

export interface MappedTicketData {
  [key: string]: any;
}

/**
 * Maps unified form data to ticket columns for backend consumption.
 * Supports fields, sections (with fields), and row groups in any order.
 * @param formData - The form data keyed by field names.
 * @param items - The unified array of form items (fields, sections, rowgroups).
 * @returns MappedTicketData object with cstm_colN and lbl_colN keys.
 */
export const mapUnifiedForm = (
  formData: Record<string, any>,
  items: FormItem[]
): MappedTicketData => {
  const mappedData: MappedTicketData = {};
  let counter = 1;

  // Sort items by order to maintain consistent mapping
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  sortedItems.forEach(item => {
    if (item.type === 'field') {
      const field = item.data as FormField;
      const fieldKey = field.name || field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fieldValue = formData[fieldKey];

      mappedData[`cstm_col${counter}`] = fieldValue ?? '';
      mappedData[`lbl_col${counter}`] = field.label;
      counter++;

    } else if (item.type === 'section') {
      const section = item.data as FormSection;
      section.fields.forEach(field => {
        const fieldKey = field.name || field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fieldValue = formData[fieldKey];

        mappedData[`cstm_col${counter}`] = fieldValue ?? '';
        mappedData[`lbl_col${counter}`] = field.label;
        counter++;
      });

    } else if (item.type === 'rowgroup') {
      const rowGroup = item.data as RowGroup;
      if (!rowGroup.structure || !rowGroup.rowGroup) return;

      const { firstColumn, secondColumn, thirdColumn, combinedMapping } = rowGroup.structure;

      rowGroup.rowGroup.forEach((row: RowData) => {
        const mappings = {
          first: { value: row.firstValue, label: firstColumn?.label },
          second: { value: row.secondValue, label: secondColumn?.label },
          third: { value: row.thirdValue, label: thirdColumn?.label }
        };

        if (combinedMapping === 'first_second') {
          // Combine first + second columns
          const cstmVal = [mappings.first.value, mappings.second.value].filter(Boolean).join(' ');
          const lblVal = [mappings.first.label, mappings.second.label].filter(Boolean).join(' + ');

          // Map third column if it exists
          if (mappings.third.value && mappings.third.label) {
            mappedData[`cstm_col${counter}`] = mappings.third.value;
            mappedData[`lbl_col${counter}`] = mappings.third.label;
            counter++;
          }

          // Map combined first+second
          mappedData[`cstm_col${counter}`] = cstmVal;
          mappedData[`lbl_col${counter}`] = lblVal;
          counter++;

        } else if (combinedMapping === 'second_third') {
          // Combine second + third columns
          const cstmVal = [mappings.second.value, mappings.third.value].filter(Boolean).join(' ');
          const lblVal = [mappings.second.label, mappings.third.label].filter(Boolean).join(' + ');

          // Map first column if it exists
          if (mappings.first.value && mappings.first.label) {
            mappedData[`cstm_col${counter}`] = mappings.first.value;
            mappedData[`lbl_col${counter}`] = mappings.first.label;
            counter++;
          }

          // Map combined second+third
          mappedData[`cstm_col${counter}`] = cstmVal;
          mappedData[`lbl_col${counter}`] = lblVal;
          counter++;

        } else {
          // No combination: map all columns individually
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
    }
  });

  return mappedData;
};

/**
 * Converts unified form items back to legacy format for backward compatibility
 * @param items - Unified form items array
 * @returns Object with separate fields, sections, and rowGroups arrays
 */
export const convertUnifiedToLegacy = (items: FormItem[]) => {
  const fields: FormField[] = [];
  const sections: FormSection[] = [];
  const rowGroups: RowGroup[] = [];

  items.forEach(item => {
    if (item.type === 'field') {
      fields.push(item.data as FormField);
    } else if (item.type === 'section') {
      sections.push(item.data as FormSection);
    } else if (item.type === 'rowgroup') {
      rowGroups.push(item.data as RowGroup);
    }
  });

  return { fields, sections, rowGroups };
};

/**
 * Converts legacy format to unified items array
 * @param config - Form config with separate arrays
 * @returns Unified items array
 */
export const convertLegacyToUnified = (config: {
  fields?: FormField[];
  sections?: FormSection[];
  rowGroups?: RowGroup[];
}): FormItem[] => {
  const items: FormItem[] = [];
  let counter = 0;

  // Convert fields
  config.fields?.forEach(field => {
    items.push({
      id: `field-${Date.now()}-${counter}`,
      type: 'field',
      order: counter,
      data: field
    });
    counter++;
  });

  // Convert sections
  config.sections?.forEach(section => {
    items.push({
      id: `section-${Date.now()}-${counter}`,
      type: 'section',
      order: counter,
      data: section
    });
    counter++;
  });

  // Convert row groups
  config.rowGroups?.forEach(rowGroup => {
    items.push({
      id: `rowgroup-${Date.now()}-${counter}`,
      type: 'rowgroup',
      order: counter,
      data: rowGroup
    });
    counter++;
  });

  return items;
};
