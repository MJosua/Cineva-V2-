/**
 * @hots/import-kit — HEAD: config-driven Excel import (pure ESM, browser + Node, no DB, no xlsx dependency).
 * Design: 3.Knowledge/domains/shared-platform/12_import_engine.md, 13_distributor_profiles_and_integration.md
 *
 *   core/columns.js      Excel letters ↔ index, ranges, column by header name
 *   core/transforms.js   trim, number, excel_date, null_if_before, pcs_from_ctn, regex_extract, …
 *   core/header.js       fixed or detected header row
 *   core/rules.js        JSON rule DSL (set / warning / error / skip), no eval
 *   core/fingerprint.js  file recognition → MATCHED / AMBIGUOUS / UNKNOWN
 *   engine/applyTemplate.js     rows + unpivot modes → records { data, status, messages, source }
 *   engine/validateTemplate.js  template problems before activation
 *   enrich/dailyStock.js        daily input + IOD/HOTS reference → stock movements per expiry (container lookup, FEFO, count check)
 *
 * Callers parse the workbook themselves (FE: @hots/ui-kit/media parseFirstSheet / xlsx; BE: xlsx) and pass
 * { name, sheets: { sheetName: rows[][] } }.
 */
export * from './core/columns.js';
export * from './core/transforms.js';
export * from './core/header.js';
export * from './core/rules.js';
export * from './core/fingerprint.js';
export * from './engine/applyTemplate.js';
export * from './engine/validateTemplate.js';
export * from './enrich/dailyStock.js';
