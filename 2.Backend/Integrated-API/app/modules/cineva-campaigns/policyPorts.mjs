/** @purpose Single import point for the shared @hots domain-kit and scheduling-kit rules, so the backend applies the same logic as the frontend. */
// Sources are TypeScript with erasable syntax and explicit .ts imports; they load natively on Node 22.18+/24 (type stripping).
// Swapping to compiled output later only changes these two lines.
export { evaluateGate, evaluateCancellation } from '../../../../../1.Frontend/packages/domain-kit/src/policies.ts';
export { evaluateExtension } from '../../../../../1.Frontend/packages/scheduling-kit/src/workdays.ts';
