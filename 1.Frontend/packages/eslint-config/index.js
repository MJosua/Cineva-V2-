/**
 * @hots/eslint-config — shared lint rules for new programs and shared packages (ESLint 9 flat config).
 * Standard: 3.Knowledge/domains/shared-platform/09_code_structure_standard.md (file size) and
 * 11_backend_design_principles.md (security, SQL, no eval).
 *
 * Usage (eslint.config.js of a program):
 *   import hots from '@hots/eslint-config';
 *   export default [...hots.base, ...hots.react];   // frontend
 *   export default [...hots.base, ...hots.node];    // backend (CommonJS)
 * Language plugins (typescript-eslint, react-hooks) stay in the program; this file only adds HOTS rules.
 */

/** Template literals that look like SQL and interpolate values → use parameters (`?` / `$1`). */
const STRING_BUILT_SQL =
  'TemplateLiteral[expressions.length>0] > TemplateElement[value.raw=/\\b(SELECT|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|WHERE)\\b/i]';

const base = [
  {
    name: 'hots/base',
    rules: {
      // 09 §1: hard limit per file, warn on long functions (split into parts / use-cases).
      'max-lines': ['error', { max: 1000, skipBlankLines: false, skipComments: false }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      // 11 §5: no code execution from data.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // 11 §4: SQL must be parameterized. Identifier interpolation (validated table names) may be disabled
      // per line with a justification comment: // eslint-disable-next-line no-restricted-syntax -- table from allow-list
      'no-restricted-syntax': [
        'warn',
        { selector: STRING_BUILT_SQL, message: 'Possible string-built SQL: pass values as parameters (? / $1). Identifiers only from an allow-list.' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];

const react = [
  {
    name: 'hots/react',
    files: ['**/*.{jsx,tsx}'],
    rules: {
      // 11 §5 output: no raw HTML from data (sanitize with DOMPurify first, then disable per line with a reason).
      'no-restricted-properties': ['error', { object: 'localStorage', property: 'setItem', message: 'Use @hots/app-core createAppStorage (non-secret, prefixed keys only); tokens live in httpOnly cookies.' }],
    },
  },
];

const node = [
  {
    name: 'hots/node',
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      'no-process-exit': 'off',
      'no-sync': 'off',
    },
  },
];

export default { base, react, node, STRING_BUILT_SQL };
export { base, react, node, STRING_BUILT_SQL };
