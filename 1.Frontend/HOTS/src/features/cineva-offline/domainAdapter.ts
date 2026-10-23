import { assertRules, createRules, validateAttribute, validateRelations } from '@hots/domain-kit';
import type { DemoData } from './model';

/** Cineva owns schema/cash policy; shared package owns generic validation mechanics. */
export const nonNegativeInteger = (value: unknown) => validateAttribute(value, { type: 'integer', required: true, min: 0 }).length === 0;
export const calendarDate = (value: unknown) => validateAttribute(value, { type: 'date', required: true }).length === 0;
const cashRules = createRules<DemoData>([{
  code: 'cash_exceeds_fee',
  message: 'Kas tercatat melebihi fee; nominal fee tidak boleh kurang dari pembayaran.',
  check: data => {
    const total = data.payments.reduce((sum, payment) => sum + payment.amount, data.campaign.paidAmount ?? 0);
    return Number.isSafeInteger(total) && total <= data.campaign.feeAmount;
  },
}]);
export const validateCash = (data: DemoData) => assertRules(cashRules(data));
export function validateDocumentRelations(data: DemoData) {
  const { workspaces, brands, batches, tickets, assignments } = data.collections;
  const collections = { users: [data.user], campaigns: [data.campaign], workspaces, brands, batches, tickets, assignments, events: data.events, payments: data.payments, deliverables: data.deliverables };
  return validateRelations(collections, {
    collections: Object.fromEntries(Object.keys(collections).map(name => [name, { idField: 'id' }])),
    references: [
      { from: 'batches', field: 'campaignId', to: 'campaigns' },
      { from: 'assignments', field: 'userId', to: 'users' },
      { from: 'assignments', field: 'campaignId', to: 'campaigns' },
      { from: 'assignments', field: 'ticketId', to: 'tickets' },
      { from: 'assignments', field: 'batchId', to: 'batches', scope: { sourceField: 'campaignId', targetField: 'campaignId' } },
    ],
  });
}
