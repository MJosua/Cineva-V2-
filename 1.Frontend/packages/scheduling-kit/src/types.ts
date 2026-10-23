export interface Interval { start: number; end: number }
export interface Resource { id: string; capacity: number; blackouts?: Interval[] }
export type ReservationStatus = 'hold' | 'confirmed' | 'cancelled';
export interface Reservation extends Interval {
  id: string; resourceId: string; quantity: number; status: ReservationStatus; expiresAt?: number;
}
export interface AvailabilityRequest extends Interval { resourceId: string; quantity: number }
export interface AvailabilityInput {
  resources: Resource[]; reservations: Reservation[]; requests: AvailabilityRequest[]; now: number;
  excludeReservationId?: string; bufferBefore?: number; bufferAfter?: number;
}
export interface Issue {
  code: 'INVALID_INPUT' | 'DUPLICATE_ID' | 'UNKNOWN_RESOURCE' | 'BLACKOUT' | 'CAPACITY_EXCEEDED';
  message: string; resourceId?: string; reservationId?: string; requestIndex?: number; start?: number; end?: number;
}
