// utils/formPrefill.ts
/**
 * rebuildInitialState(formConfig, form_values)
 * - formConfig: your HOTS json (config.items)
 * - form_values: from /engine/status or /engine/resubmit
 *
 * Returns:
 *  - populatedConfig: config with rowgroup rowGroup set
 *  - initialGlobalValues: map of fieldName -> value (for DynamicForm globalValues)
 */

export function rebuildInitialState(config, form_values) {
    const initialGlobalValues = {};
    const items = (config && config.items) ? JSON.parse(JSON.stringify(config.items)) : [];
  
    for (const item of items) {
      if (item.type === 'field') {
        const fld = item.data;
        const fid = fld.name || fld.id || item.id;
        const v = form_values?.[fid];
        if (v !== undefined) {
          // store object {label, value} or simple string
          if (typeof v === 'object' && v !== null && 'value' in v) {
            initialGlobalValues[fid] = v.value;
            // also put label if widget expects object
            // some widgets expect {label, value}
            // initialGlobalValues[`${fid}_meta`] = {label: v.label};
          } else {
            initialGlobalValues[fid] = v;
          }
        } else if (fld.default) {
          initialGlobalValues[fid] = fld.default;
        }
      } else if (item.type === 'rowgroup') {
        const rgId = item.id || item.data.name;
        const rgValues = form_values?.[rgId];
        if (Array.isArray(rgValues)) {
          // build rowGroup expected by StructuredRowGroup
          const builtRows = rgValues.map((rowObj) => {
            // we need to map column keys to firstValue/secondValue/... or to the actual name used by StructuredRowGroup
            // assuming rowObj keys match 'firstValue','secondValue' etc OR match internal names
            const mapped = {};
            for (const [colKey, val] of Object.entries(rowObj)) {
              // try to match: item.data.structure firstColumn.name etc
              // fallback: use columnKey as-is
              mapped[colKey] = val;
            }
            return mapped;
          });
          // assign onto config item so the StructuredRowGroup reads it
          if (!item.data) item.data = {};
          item.data.rowGroup = builtRows;
          // also set globalValues shortcut if your DynamicForm expects it
          initialGlobalValues[rgId] = builtRows;
        }
      }
    }
  
    return { populatedConfig: { ...config, items }, initialGlobalValues };
  }
  