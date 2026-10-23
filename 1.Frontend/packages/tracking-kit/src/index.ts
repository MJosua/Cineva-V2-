import * as normalizer from './normalizer/containerTrackingNormalizer.js';
import type { NormalizedTracking, TrackingLocation, TrackingVessel } from './normalizer/types';

export type * from './normalizer/types';

/** Accepts SeaRates live payloads or backend-cached tracking rows; returns one unified shape (or null). */
export const normalizeContainerTrackingData = normalizer.normalizeContainerTrackingData as (raw: unknown) => NormalizedTracking | null;

/** Unwraps common API envelopes (`{ data }`, `{ data: { data } }`, arrays) down to a tracking payload. */
export const extractContainerTrackingPayload = normalizer.extractContainerTrackingPayload as (responseData: unknown) => any;

/** Voyage progress 0–100 between ETD and ETA (relative to now). */
export const calculateProgress = normalizer.calculateProgress as (etd: string | null, eta: string | null) => number;

export const findLocationName = normalizer.findLocationName as (locations: TrackingLocation[], locationId: unknown) => string | null;

export const findVessel = normalizer.findVessel as (vessels: TrackingVessel[], vesselId: unknown) => TrackingVessel | null;
