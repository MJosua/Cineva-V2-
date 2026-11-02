/** @purpose Exposes shared availability policies and strict date/calendar helpers without application or database coupling. */
export type { Interval, Resource, ReservationStatus, Reservation, AvailabilityRequest, AvailabilityInput, Issue } from './types.ts';
export { intervalsOverlap, isActiveReservation, checkAvailability } from './availability.ts';
export { stayInterval } from './stay.ts';
export * from './dates.ts';
export * from './workdays.ts';
