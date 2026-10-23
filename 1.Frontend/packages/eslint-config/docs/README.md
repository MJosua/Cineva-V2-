---
app: @hots/eslint-config
purpose: Shared package @hots/eslint-config: workspace lint rules (max-lines 1000, no eval, string-built SQL warning, no localStorage tokens)
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

# @hots/eslint-config

Shared ESLint 9 flat-config rules that enforce the HOTS standards mechanically.

- **Version:** 0.1.0 · **Standards:** shared-platform 09 (file size) and 11 (security, SQL, no eval)

## Usage
```js
// eslint.config.js
import hots from '@hots/eslint-config';
export default [...hots.base, ...hots.react];   // frontend program
export default [...hots.base, ...hots.node];    // backend (CommonJS)
```
Language plugins (typescript-eslint, react-hooks) stay in the program.

## Rules
| Rule | Level | Why |
|---|---|---|
| `max-lines` 1000 | error | file-size standard (09) |
| `max-lines-per-function` 150 | warn | split into parts / use-cases |
| `no-eval`, `no-implied-eval`, `no-new-func` | error | no code execution from data (Event cssParser lesson) |
| `no-restricted-syntax` string-built SQL | warn | parameterized SQL only (E-Order SQL-injection lesson); identifier interpolation from an allow-list → disable with a reason |
| `no-restricted-properties` `localStorage.setItem` (jsx/tsx) | error | tokens only in httpOnly cookies; use `createAppStorage` |
| `no-console` (warn/error allowed), `eqeqeq`, `prefer-const`, `no-var` | warn/error | hygiene |

## Verified (2026-10-06)
Sample with string-built SQL + `eval` + `new Function` → 2 errors, 1 warning; parameterized query → clean. `transaction-kit` and `calc-kit` sources → clean (identifier interpolation annotated).
