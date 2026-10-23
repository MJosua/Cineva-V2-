/**
 * Output shape of `normalizeContainerTrackingData` (documented from the E-Order source, 2026-10-06).
 * Fields are kept loose (`| null`) because both SeaRates and backend-cached payloads are accepted.
 */

export interface TrackingLocation {
  location_id: number | string;
  location_list_id: number | string;
  id: number | string;
  name: string;
  state: string | null;
  country: string | null;
  country_code: string | null;
  locode?: string | null;
  label?: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
}

export interface TrackingVessel {
  vessel_id: number | string;
  id: number | string;
  name: string;
  imo: string;
  call_sign: string | null;
  mmsi: string | null;
  flag: string | null;
  voyage: string | null;
}

export interface TrackingEvent {
  event_id: number | string;
  order_id: number;
  description: string;
  event_type: string;
  event_code: string;
  status: string | null;
  /** ISO 8601 */
  date: string | null;
  /** 1 = actual (happened), 0 = estimated. SeaRates true/false and backend 1/0 are both mapped to 1/0. */
  actual: 0 | 1;
  location_id: number | string | null;
  location: number | string | null;
  vessel_id: number | string | null;
  vessel: number | string | null;
  voyage: string | null;
  facility: unknown;
  type: string | null;
  transport_type: string | null;
  is_additional_event: boolean;
}

export interface TrackingContainer {
  container_number: string;
  number: string;
  iso_code: string | null;
  size_type: string | null;
  container_status: string;
  status: string;
  so_id: number;
  sealine_name: string | null;
  is_status_from_sealine: boolean;
  events_mirrored: boolean;
}

export interface NormalizedTracking {
  _source: string;
  _isFromSeaRates: boolean;
  metadata: Record<string, any>;
  containers: TrackingContainer[];
  events: TrackingEvent[];
  locations: TrackingLocation[];
  vessels: TrackingVessel[];
  dataRoute: Record<string, any> | null;
  pin_location: Record<string, any> | null;
  /** Locations in route order, derived from events' order_id — use for map routes. */
  orderedLocations: TrackingLocation[];
  etd: string | null;
  eta: string | null;
  departureLocation: TrackingLocation | string | null;
  arrivalLocation: TrackingLocation | string | null;
  route_data: Record<string, any> | null;
  routePathSegments: Array<Array<[number, number]>>;
  facilities: unknown[];
  updateat: string | null;
  poNumber: string;
  fullRoute: unknown;
  tracking_analytics: unknown;
}
