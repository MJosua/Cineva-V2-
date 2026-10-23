/**
 * @hots/geo-kit — world country shapes + lookups.
 * Data source: E-Order/src/components/media/Map/geojson.jsx (`export const countries`, 13 573 lines of JS)
 * converted verbatim to src/data/countries.geo.json on 2026-10-06. E-Order unchanged.
 *
 * 180 features, ids are ISO 3166-1 alpha-3 except: `-99` (Northern Cyprus, Somaliland — shared id)
 * and `CS-KM` (Kosovo). Properties: `name` only.
 */
import countriesData from './data/countries.geo.json';

export type Position = [number, number];

export interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: { name: string };
  geometry:
    | { type: 'Polygon'; coordinates: Position[][] }
    | { type: 'MultiPolygon'; coordinates: Position[][][] };
}

export interface CountryCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

/** Full collection — pass directly to Leaflet `<GeoJSON data={countries} />`. */
export const countries = countriesData as unknown as CountryCollection;

/** Lookup by ISO3 id (case-insensitive). Returns the first match (`-99` is ambiguous). */
export function getCountryFeature(iso3: string): CountryFeature | undefined {
  const id = iso3.toUpperCase();
  return countries.features.find((f) => f.id === id);
}

/** Lookup by English name (case-insensitive, trimmed). */
export function findCountryByName(name: string): CountryFeature | undefined {
  const key = name.trim().toLowerCase();
  return countries.features.find((f) => f.properties.name.toLowerCase() === key);
}

/** `[{ id, name }]` sorted by name — for selects. */
export function listCountries(): Array<{ id: string; name: string }> {
  return countries.features
    .map((f) => ({ id: f.id, name: f.properties.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Subset collection, e.g. to highlight countries that have orders. */
export function filterCountries(ids: string[]): CountryCollection {
  const wanted = new Set(ids.map((i) => i.toUpperCase()));
  return { type: 'FeatureCollection', features: countries.features.filter((f) => wanted.has(f.id)) };
}

/** Rough [lat, lng] centre of a country (bounding-box midpoint) for markers/labels. */
export function countryCenter(feature: CountryFeature): [number, number] {
  const rings = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}
