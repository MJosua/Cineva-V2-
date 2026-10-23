---
app: @hots/import-kit
purpose: Shared package @hots/import-kit: config-driven Excel import (templates, unpivot, carry blocks, recognition)
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: ["write:*"]
---

# @hots/import-kit

Config-driven Excel import: a **template (JSON)** turns any workbook layout into validated records — no code per distributor or file format. Pure ESM, no DB, no xlsx dependency (callers parse the workbook and pass rows).

- **Version:** 0.1.0 · **Design:** `3.Knowledge/domains/shared-platform/12_import_engine.md`, `13_distributor_profiles_and_integration.md`

## Usage
```js
import { recognize, validateTemplate, applyTemplate } from '@hots/import-kit';
const file = { name, sheets: { 'STT 2026': rows, … } };          // rows = sheet_to_json(ws, { header: 1, raw: true })
const { best } = recognize(file, templates);                       // MATCHED / AMBIGUOUS / UNKNOWN
const out = applyTemplate(file, template, { context: { currentYear: 2026, cutoffWeek: 38, reportYear: 2026 }, lookups: { port_to_warehouse: { 'CAT LAI': 'WH-HCM' } } });
// out.records[i] = { sheet, source_row, source_col, data, status: valid|warning|blocked, messages, raw }
```

## Template features
| Feature | Purpose |
|---|---|
| `mode: rows` + `columns` | one record per data row; columns by header name (wins) or `col:B` / letters |
| `mode: unpivot` | weeks-as-columns → rows (`value_columns: "C:BB"` explicit, or `value_columns_where`) |
| `header.row` / `header.detect.contains` | fixed or detected header |
| `carry` (+ `row_when`, `when`, `match`, `skip_row`) | stacked blocks: block label carried down |
| `carry_reset_when`, `carry_backfill` | close a block; fill labels that appear on later rows of the block |
| `constants`, `constants_from_sheet_name`, `"$ctx"` | fixed / sheet-name / run-context values |
| `transform` | `trim`, `string`, `number`, `int`, `excel_date`, `null_if_before`, `default`, `pcs_from_ctn`, `ctn_from_pcs`, `round`, `regex_extract`, … |
| `lookups` (`on_missing: block | warning:CODE`) | alias / code resolution |
| `required`, `rules` (`set`, `warning`, `error`, `skip`; ops `= != > >= < <= in not_in empty not_empty matches is_number`, `all`/`any`) | validation without eval |
| `fingerprint` | automatic template recognition |

## Verified on real files (2026-10-06, `npm run test:real`)
| Template | Records | Reconciliation with Excel |
|---|---|---|
| IV_STT_WEEKLY (2024–2026, 2 layouts) | 42 080 | 817 rows = sheet "Total", 0 mismatches |
| IV_OPENING_STOCK_WEEKLY | 9 513 | 146 rows (2026) = "Total", 0 mismatches |
| IV_RECEIPT_WEEKLY | 3 380 | 676 block × week totals, 0 mismatches |
| IV_ORDER_REALIZATION (DB / Master Data) | 3 459 / 5 377 | no 1899/1900 dates left; forecast flagged; port → warehouse |

Lessons encoded in the templates: YTD columns sit in the week header row (use explicit ranges); STT 2024/2025 vs 2026 layouts differ (two sheet specs); port/year rows sit under the buyer row (backfill); a header literally named "PO" must not resolve to column PO.

## Tests
`npm test` (unit, 6) · `npm run test:real` (real IndoVietnam workbooks, 6; needs xlsx from HOTS node_modules).
