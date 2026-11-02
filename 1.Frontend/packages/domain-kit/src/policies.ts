/** @purpose Supplies configurable approval/eligibility gates and party-based cancellation outcomes, without owning persistence or payment. */

/** Gate = every required key must be satisfied. Used for multi-party approval and for "may this be paid" checks. */
export function evaluateGate(required: readonly string[], satisfied: Iterable<string> | Readonly<Record<string, boolean>>): { open: boolean; satisfied: string[]; missing: string[] } {
  if (!Array.isArray(required) || !required.length || required.some(key => typeof key !== 'string' || !key.trim()) || new Set(required).size !== required.length)
    throw new RangeError('A gate needs at least one unique, non-empty requirement key.');
  const have = new Set<string>(Symbol.iterator in Object(satisfied)
    ? [...(satisfied as Iterable<string>)]
    : Object.entries(satisfied as Record<string, boolean>).filter(([, value]) => value === true).map(([key]) => key));
  const ok = required.filter(key => have.has(key));
  const missing = required.filter(key => !have.has(key));
  return { open: missing.length === 0, satisfied: ok, missing };
}

export interface CancellationParty {
  /** The deposit paid so far is lost when this party cancels. */
  forfeitDeposit?: boolean;
  /** Penalty as a percentage (0-100) of the amount named by `penaltyBasis`. */
  penaltyPercent?: number;
  /** Key into `CancellationInput.amounts`; required when `penaltyPercent` is set. */
  penaltyBasis?: string;
  requireReplacement?: boolean;
  /** Keys that must be supplied in `CancellationInput.extraCharges` and are passed through (e.g. replacement product cost). */
  extraChargeKeys?: readonly string[];
  /** Who receives the penalty. Pass-through label owned by the host; the kit never decides it. */
  payee?: string;
  /** Optional named reasons that change the outcome (e.g. sickness waives the penalty). Unknown reasons are rejected, never ignored. */
  reasons?: Readonly<Record<string, CancellationReasonEffect>>;
}
export interface CancellationReasonEffect {
  waivePenalty?: boolean;
  waiveForfeit?: boolean;
  /** Percentage (0-100) of `refundBasis` returned to the counterparty. */
  refundPercent?: number;
  refundBasis?: string;
}
export interface CancellationPolicy { version: string; parties: Readonly<Record<string, CancellationParty>> }
export interface CancellationInput {
  party: string;
  /** Deposit already received. Defaults to 0. */
  deposit?: number;
  amounts?: Readonly<Record<string, number>>;
  extraCharges?: Readonly<Record<string, number>>;
  /** Key of `CancellationParty.reasons`. Omitted means the default rule applies. */
  reason?: string;
}
export interface CancellationOutcome {
  party: string; policyVersion: string; reason?: string; depositForfeited: number;
  refund: { amount: number; percent: number; basis: string } | null;
  penalty: { amount: number; percent: number; basis: string; payee?: string } | null;
  extraCharges: Record<string, number>; requiresReplacement: boolean; total: number;
}
const money = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Pure cancellation arithmetic in whole currency units. Throws on unknown parties or missing/invalid amounts instead of guessing. */
export function evaluateCancellation(policy: CancellationPolicy, input: CancellationInput): CancellationOutcome {
  if (!policy?.version?.trim() || !policy.parties) throw new RangeError('Cancellation policy needs a version and parties.');
  const rule = Object.prototype.hasOwnProperty.call(policy.parties, input.party) ? policy.parties[input.party] : undefined;
  if (!rule) throw new RangeError(`Unknown cancelling party: ${input.party}`);
  const deposit = input.deposit ?? 0;
  if (!money(deposit)) throw new RangeError('Deposit must be a non-negative whole amount.');
  let effect: CancellationReasonEffect | undefined;
  if (input.reason !== undefined) {
    effect = rule.reasons && Object.prototype.hasOwnProperty.call(rule.reasons, input.reason) ? rule.reasons[input.reason] : undefined;
    if (!effect) throw new RangeError(`Unknown cancellation reason: ${input.reason}`);
  }
  let penalty: CancellationOutcome['penalty'] = null;
  if (rule.penaltyPercent !== undefined && !effect?.waivePenalty) {
    const percent = rule.penaltyPercent, basis = rule.penaltyBasis;
    if (!(percent >= 0 && percent <= 100) || !basis) throw new RangeError('Penalty needs a percent from 0 to 100 and a basis key.');
    const base = input.amounts?.[basis];
    if (!money(base)) throw new RangeError(`Amount for penalty basis "${basis}" is required.`);
    const amount = Math.round(base * percent / 100);
    penalty = { amount, percent, basis, ...(rule.payee ? { payee: rule.payee } : {}) };
  }
  const extraCharges: Record<string, number> = {};
  for (const key of rule.extraChargeKeys ?? []) {
    const value = input.extraCharges?.[key];
    if (!money(value)) throw new RangeError(`Extra charge "${key}" is required.`);
    extraCharges[key] = value;
  }
  const depositForfeited = rule.forfeitDeposit && !effect?.waiveForfeit ? deposit : 0;
  let refund: CancellationOutcome['refund'] = null;
  if (effect?.refundPercent !== undefined) {
    const percent = effect.refundPercent, basis = effect.refundBasis;
    if (!(percent >= 0 && percent <= 100) || !basis) throw new RangeError('Refund needs a percent from 0 to 100 and a basis key.');
    const base = input.amounts?.[basis];
    if (!money(base)) throw new RangeError(`Amount for refund basis "${basis}" is required.`);
    refund = { amount: Math.round(base * percent / 100), percent, basis };
  }
  const total = depositForfeited + (penalty?.amount ?? 0) + Object.values(extraCharges).reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) throw new RangeError('Cancellation total is out of range.');
  return { party: input.party, policyVersion: policy.version, ...(input.reason !== undefined ? { reason: input.reason } : {}), depositForfeited, refund, penalty, extraCharges, requiresReplacement: rule.requireReplacement === true, total };
}
