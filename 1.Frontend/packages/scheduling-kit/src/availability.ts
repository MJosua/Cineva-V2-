import type { AvailabilityInput, Interval, Issue, Reservation } from './types.ts';

const validInterval = (value: Interval) => Boolean(value && Number.isFinite(value.start) && Number.isFinite(value.end) && value.start < value.end);
const validId = (value: string) => typeof value === 'string' && value.trim().length > 0;
const positiveInteger = (value: number) => Number.isSafeInteger(value) && value > 0;
const overlap = (left: Interval, right: Interval) => left.start < right.end && left.end > right.start;
export function intervalsOverlap(left: Interval, right: Interval): boolean {
  if (!validInterval(left) || !validInterval(right)) throw new RangeError('Intervals require finite start < end.');
  return overlap(left, right);
}
export function isActiveReservation(reservation: Reservation, now: number): boolean {
  return reservation.status === 'confirmed' || (reservation.status === 'hold' && (reservation.expiresAt === undefined || reservation.expiresAt > now));
}

/** All candidate requests compete together; resources are not allocated or mutated here. */
export function checkAvailability(input: AvailabilityInput): Issue[] {
  const issues: Issue[] = [];
  if (!input || !Array.isArray(input.resources) || !Array.isArray(input.reservations) || !Array.isArray(input.requests))
    return [{ code: 'INVALID_INPUT', message: 'Resources, reservations and requests must be arrays.' }];
  const before = input.bufferBefore ?? 0, after = input.bufferAfter ?? 0;
  if (!Number.isFinite(input.now) || ![before, after].every(value => Number.isFinite(value) && value >= 0))
    issues.push({ code: 'INVALID_INPUT', message: 'Current time and non-negative buffers must be finite.' });
  const resourceIds = new Set<string>(), reservationIds = new Set<string>();
  for (const resource of input.resources) {
    if (!resource || !validId(resource.id) || !positiveInteger(resource.capacity)) {
      issues.push({ code: 'INVALID_INPUT', message: 'Each resource requires an ID and positive integer capacity.' }); continue;
    }
    if (resourceIds.has(resource.id)) issues.push({ code: 'DUPLICATE_ID', resourceId: resource.id, message: 'Resource IDs must be unique.' });
    resourceIds.add(resource.id);
    if (resource.blackouts !== undefined && (!Array.isArray(resource.blackouts) || resource.blackouts.some(value => !validInterval(value))))
      issues.push({ code: 'INVALID_INPUT', resourceId: resource.id, message: 'Blackouts require finite start < end.' });
  }
  for (const reservation of input.reservations) {
    if (!reservation || !validId(reservation.id) || !validId(reservation.resourceId) || !validInterval(reservation) || !positiveInteger(reservation.quantity)
      || !['hold', 'confirmed', 'cancelled'].includes(reservation.status) || (reservation.expiresAt !== undefined && !Number.isFinite(reservation.expiresAt))) {
      issues.push({ code: 'INVALID_INPUT', message: 'Reservation ID, resource, interval, quantity, status or expiry is invalid.' }); continue;
    }
    if (reservationIds.has(reservation.id)) issues.push({ code: 'DUPLICATE_ID', reservationId: reservation.id, message: 'Reservation IDs must be unique.' });
    reservationIds.add(reservation.id);
    if (!resourceIds.has(reservation.resourceId)) issues.push({ code: 'UNKNOWN_RESOURCE', reservationId: reservation.id, resourceId: reservation.resourceId, message: 'Reservation resource does not exist.' });
  }
  input.requests.forEach((request, requestIndex) => {
    if (!request || !validId(request.resourceId) || !validInterval(request) || !positiveInteger(request.quantity)) {
      issues.push({ code: 'INVALID_INPUT', requestIndex, message: 'Requests require a resource, finite start < end and positive integer quantity.' }); return;
    }
    if (!resourceIds.has(request.resourceId)) issues.push({ code: 'UNKNOWN_RESOURCE', requestIndex, resourceId: request.resourceId, message: 'Requested resource does not exist.' });
  });
  if (issues.length) return issues;
  const expand = (interval: Interval): Interval => ({ start: interval.start - before, end: interval.end + after });
  const requests = input.requests.map(expand);
  const active = input.reservations.filter(row => row.id !== input.excludeReservationId && isActiveReservation(row, input.now));
  if ([...requests, ...active.map(expand)].some(value => !validInterval(value)))
    return [{ code: 'INVALID_INPUT', message: 'Buffer expansion exceeds finite interval bounds.' }];

  for (const resource of input.resources) {
    const candidateIndices = input.requests.map((row, index) => row.resourceId === resource.id ? index : -1).filter(index => index >= 0);
    if (!candidateIndices.length) continue;
    for (const requestIndex of candidateIndices) {
      const blackout = resource.blackouts?.find(interval => overlap(interval, requests[requestIndex]));
      if (blackout) issues.push({ code: 'BLACKOUT', resourceId: resource.id, requestIndex, start: blackout.start, end: blackout.end, message: 'Requested interval intersects resource unavailability.' });
    }
    const events: { at: number; delta: bigint; candidates: number }[] = [];
    const add = (interval: Interval, quantity: number, candidate: boolean) => {
      events.push({ at: interval.start, delta: BigInt(quantity), candidates: candidate ? 1 : 0 });
      events.push({ at: interval.end, delta: -BigInt(quantity), candidates: candidate ? -1 : 0 });
    };
    for (const reservation of active) if (reservation.resourceId === resource.id) add(expand(reservation), reservation.quantity, false);
    for (const index of candidateIndices) add(requests[index], input.requests[index].quantity, true);
    events.sort((left, right) => left.at - right.at);
    let load = BigInt(0), candidates = 0, index = 0;
    while (index < events.length) {
      const at = events[index].at;
      while (index < events.length && events[index].at === at) { load += events[index].delta; candidates += events[index].candidates; index++; }
      if (index < events.length && events[index].at > at && candidates > 0 && load > BigInt(resource.capacity)) {
        issues.push({ code: 'CAPACITY_EXCEEDED', resourceId: resource.id, start: at, end: events[index].at,
          requestIndex: candidateIndices.find(candidate => overlap(requests[candidate], { start: at, end: events[index].at })), message: 'Concurrent requested quantity exceeds resource capacity.' });
        break;
      }
    }
  }
  return issues;
}
