/** @purpose Holds Cineva campaign business parameters (approval/payment gate keys, extension limits, cancellation policy) as data, mirroring the frontend client rules. */

/** Mirrors 1.Frontend/HOTS/src/features/cineva-services/policies.ts (CLIENT-2026-11-03). Change both when the client changes a rule. */
const crewReasons = { not_committed: { waivePenalty: true }, valid_reason: { waivePenalty: true }, force_majeure: { waivePenalty: true } };

export const defaultConfig = Object.freeze({
  /** Two-layer content approval (client N27): the client is the main holder, the Cineva owner concurs. */
  approvalKeys: ['client', 'owner'],
  /** Creator payout gate (client N19, N43). */
  paymentKeys: ['post_live', 'insight_submitted', 'obligations_complete'],
  /** Sick/disaster leave: 2 requests at different times, each at most 2 consecutive days (client N28 + K6 clarification). */
  extensionLimits: { maxTotalDays: 4, maxRequests: 2 },
  maxExtensionDaysPerRequest: 2,
  cancellationPolicy: {
    version: 'CLIENT-2026-11-03',
    parties: {
      brand: { forfeitDeposit: true, reasons: { force_majeure: { waiveForfeit: true, refundPercent: 50, refundBasis: 'amountPaid' } } },
      crew: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, extraChargeKeys: ['productReplacement'], reasons: crewReasons },
      creator: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, extraChargeKeys: ['productReplacement'], reasons: crewReasons },
    },
  },
  /** Page size ceiling for list queries (platform rule: fewer than 100 rows). */
  maxPageSize: 100,
});
