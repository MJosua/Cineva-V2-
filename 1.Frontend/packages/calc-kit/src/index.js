/**
 * @hots/calc-kit — HEAD: pure calculation utils (no React, no DB). Usable in browser and Node (ESM),
 * so a backend can re-check the same numbers the UI showed.
 *
 *   cbm/cbmCalculator.js        CBM volumes          ← E-Order/src/utils/cbmCalculator.js
 *   cbm/containerRuleEngine.js  CBM/qty/mixed rules ← E-Order/src/utils/containerRuleEngine.js
 *   cbm/defaultContainerRules.js default rules       ← E-Order/src/utils/containerRules.js
 */
export * from './cbm/cbmCalculator.js';
export * from './cbm/containerRuleEngine.js';
export * from './cbm/evaluateContainerLoad.js';
export * from './cbm/palletPlan.js';
export * from './cbm/autoBalance.js';
export * from './cbm/validateOrderLoad.js';
export { default as defaultContainerRules } from './cbm/defaultContainerRules.js';
export * from './rules/approvalThreshold.js';
