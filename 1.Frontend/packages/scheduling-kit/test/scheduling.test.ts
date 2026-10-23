import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAvailability, intervalsOverlap, stayInterval, type AvailabilityInput, type Reservation } from '../src/index.ts';
const reservation = (id: string, start: number, end: number, overrides: Partial<Reservation> = {}): Reservation =>
  ({ id, resourceId: 'resource', start, end, quantity: 1, status: 'confirmed', ...overrides });
function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return { resources: [{ id: 'resource', capacity: 1 }], reservations: [], requests: [{ resourceId: 'resource', start: 10, end: 20, quantity: 1 }], now: 0, ...overrides };
}
test('Half-open intervals allow adjacent meetings but detect contained and cross-window overlap', () => {
  assert.equal(intervalsOverlap({ start: 0, end: 10 }, { start: 10, end: 20 }), false);
  assert.equal(intervalsOverlap({ start: 0, end: 10 }, { start: 9, end: 20 }), true);
  assert.equal(intervalsOverlap({ start: 0, end: 20 }, { start: 5, end: 8 }), true);
  assert.equal(intervalsOverlap({ start: -10, end: -1 }, { start: -5, end: 2 }), true);
});
test('Meeting availability rejects overlap and permits adjacency', () => {
  assert.deepEqual(checkAvailability(input({ reservations: [reservation('previous', 0, 10)] })), []);
  assert.equal(checkAvailability(input({ reservations: [reservation('previous', 9, 11)] }))[0].code, 'CAPACITY_EXCEEDED');
});
test('Crew and gear candidate allocations are checked together without mutating any input', () => {
  const value = input({ resources: [{ id: 'crew', capacity: 1 }, { id: 'gear', capacity: 1 }],
    reservations: [reservation('gear-busy', 10, 20, { resourceId: 'gear' })],
    requests: [{ resourceId: 'crew', start: 10, end: 20, quantity: 1 }, { resourceId: 'gear', start: 10, end: 20, quantity: 1 }] });
  const before = structuredClone(value), issues = checkAvailability(value);
  assert.equal(issues.length, 1); assert.equal(issues[0].resourceId, 'gear'); assert.deepEqual(value, before);
});
test('Hotel type inventory counts concurrent rooms rather than summing disjoint reservations', () => {
  const value = input({ resources: [{ id: 'resource', capacity: 2 }], reservations: [reservation('first', 10, 15), reservation('second', 15, 20)] });
  assert.deepEqual(checkAvailability(value), []);
  value.reservations.push(reservation('cross-window', 14, 16));
  assert.equal(checkAvailability(value)[0].code, 'CAPACITY_EXCEEDED');
});
test('Overlapping candidate requests consume capacity collectively', () => {
  assert.equal(checkAvailability(input({ requests: [{ resourceId: 'resource', start: 10, end: 20, quantity: 1 }, { resourceId: 'resource', start: 15, end: 25, quantity: 1 }] }))[0].code, 'CAPACITY_EXCEEDED');
  assert.deepEqual(checkAvailability(input({ requests: [{ resourceId: 'resource', start: 10, end: 20, quantity: 1 }, { resourceId: 'resource', start: 20, end: 25, quantity: 1 }] })), []);
});
test('Existing overcapacity outside requested windows does not reject unrelated availability', () => {
  assert.deepEqual(checkAvailability(input({ reservations: [reservation('one', 0, 5), reservation('two', 0, 5)] })), []);
});
test('Expired holds release at exact expiry while confirmed reservations keep occupying', () => {
  assert.deepEqual(checkAvailability(input({ now: 5, reservations: [reservation('hold', 10, 20, { status: 'hold', expiresAt: 5 })] })), []);
  assert.equal(checkAvailability(input({ now: 4, reservations: [reservation('hold', 10, 20, { status: 'hold', expiresAt: 5 })] }))[0].code, 'CAPACITY_EXCEEDED');
  assert.equal(checkAvailability(input({ now: 5, reservations: [reservation('hold', 10, 20, { status: 'hold' })] }))[0].code, 'CAPACITY_EXCEEDED');
  assert.equal(checkAvailability(input({ now: 5, reservations: [reservation('confirmed', 10, 20, { expiresAt: 1 })] }))[0].code, 'CAPACITY_EXCEEDED');
});
test('Cancellation releases capacity and update exclusion omits only the named reservation', () => {
  assert.deepEqual(checkAvailability(input({ reservations: [reservation('cancelled', 10, 20, { status: 'cancelled' })] })), []);
  assert.deepEqual(checkAvailability(input({ reservations: [reservation('editing', 10, 20)], excludeReservationId: 'editing' })), []);
  assert.equal(checkAvailability(input({ reservations: [reservation('editing', 10, 20), reservation('other', 10, 20)], excludeReservationId: 'editing' }))[0].code, 'CAPACITY_EXCEEDED');
});
test('Blackouts reject overlap but allow adjacency, including buffered preparation', () => {
  const resources = [{ id: 'resource', capacity: 1, blackouts: [{ start: 0, end: 10 }] }];
  assert.deepEqual(checkAvailability(input({ resources })), []);
  assert.equal(checkAvailability(input({ resources, bufferBefore: 1 }))[0].code, 'BLACKOUT');
});
test('Buffers expand existing and requested occupied intervals with exact gap adjacency', () => {
  const reservations = [reservation('previous', 0, 8)];
  assert.deepEqual(checkAvailability(input({ reservations, bufferBefore: 1, bufferAfter: 1 })), []);
  assert.equal(checkAvailability(input({ reservations, bufferBefore: 2, bufferAfter: 1 }))[0].code, 'CAPACITY_EXCEEDED');
});
test('Strict date-only hotel stays use ordinal days and exclusive checkout through leap/month/year changes', () => {
  const stay = stayInterval('2028-02-28', '2028-03-01');
  assert.equal(stay.nights, 2); assert.equal(stay.end - stay.start, 2);
  const first = stayInterval('2026-12-31', '2027-01-02'), next = stayInterval('2027-01-02', '2027-01-04');
  assert.equal(first.nights, 2); assert.equal(intervalsOverlap(first, next), false);
  assert.deepEqual(checkAvailability(input({ reservations: [reservation('stay', first.start, first.end)], requests: [{ resourceId: 'resource', start: next.start, end: next.end, quantity: 1 }] })), []);
});
test('Invalid hotel dates, equal/reverse checkout and non date-only values are rejected', () => {
  for (const [checkIn, checkOut] of [['2026-02-29', '2026-03-02'], ['2026-02-31', '2026-03-02'], ['2026-13-01', '2027-01-02'], ['2026-10-01', '2026-10-01'], ['2026-10-02', '2026-10-01'], ['2026-1-01', '2026-10-02'], ['2026-10-01T00:00:00Z', '2026-10-02']])
    assert.throws(() => stayInterval(checkIn, checkOut), RangeError);
});
test('Duplicate resource and reservation IDs are rejected even when reservations are excluded', () => {
  assert.equal(checkAvailability(input({ resources: [{ id: 'resource', capacity: 1 }, { id: 'resource', capacity: 2 }] }))[0].code, 'DUPLICATE_ID');
  assert.equal(checkAvailability(input({ reservations: [reservation('same', 1, 2), reservation('same', 3, 4)], excludeReservationId: 'same' }))[0].code, 'DUPLICATE_ID');
});
test('Quantity and capacity require positive safe integers; unknown resources are rejected', () => {
  for (const quantity of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(checkAvailability(input({ requests: [{ resourceId: 'resource', start: 10, end: 20, quantity }] }))[0].code, 'INVALID_INPUT');
    assert.equal(checkAvailability(input({ resources: [{ id: 'resource', capacity: quantity }] }))[0].code, 'INVALID_INPUT');
  }
  assert.equal(checkAvailability(input({ requests: [{ resourceId: 'missing', start: 10, end: 20, quantity: 1 }] }))[0].code, 'UNKNOWN_RESOURCE');
  assert.equal(checkAvailability(input({ reservations: [reservation('missing', 0, 1, { resourceId: 'missing' })] }))[0].code, 'UNKNOWN_RESOURCE');
});
test('Invalid intervals, expiry, clock, blackouts and buffers return validation issues', () => {
  for (const interval of [{ start: 0, end: 0 }, { start: 1, end: 0 }, { start: NaN, end: 2 }, { start: 0, end: Infinity }]) {
    assert.throws(() => intervalsOverlap(interval, { start: 0, end: 1 }), RangeError);
    assert.equal(checkAvailability(input({ requests: [{ ...interval, quantity: 1, resourceId: 'resource' }] }))[0].code, 'INVALID_INPUT');
  }
  for (const value of [input({ now: NaN }), input({ bufferAfter: -1 }), input({ bufferBefore: Infinity }), input({ reservations: [reservation('bad', 0, 1, { expiresAt: NaN })] }), input({ resources: [{ id: 'resource', capacity: 1, blackouts: [{ start: 2, end: 1 }] }] })])
    assert.equal(checkAvailability(value)[0].code, 'INVALID_INPUT');
});
test('Buffer numeric overflow is rejected and high integer capacities remain exact', () => {
  assert.equal(checkAvailability(input({ requests: [{ resourceId: 'resource', start: 1e308, end: 1.1e308, quantity: 1 }], bufferAfter: 1e308 }))[0].code, 'INVALID_INPUT');
  assert.equal(checkAvailability(input({ resources: [{ id: 'resource', capacity: Number.MAX_SAFE_INTEGER }], reservations: [reservation('large', 10, 20, { quantity: Number.MAX_SAFE_INTEGER - 1 })], requests: [{ resourceId: 'resource', start: 10, end: 20, quantity: 2 }] }))[0].code, 'CAPACITY_EXCEEDED');
});
