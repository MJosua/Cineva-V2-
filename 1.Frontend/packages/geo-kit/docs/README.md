---
app: @hots/geo-kit
purpose: Shared package @hots/geo-kit: 180-country GeoJSON and country lookups
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: ["write:*"]
---

# @hots/geo-kit

World country shapes (GeoJSON) and lookups for maps (Leaflet `<GeoJSON>`), country selects and per-country charts.

- **Version:** 0.1.0 · **Source:** `E-Order/src/components/media/Map/geojson.jsx` (13 573-line JS export), converted verbatim to `src/data/countries.geo.json` on 2026-10-06. E-Order unchanged.

## Usage
```ts
import { countries, getCountryFeature, listCountries, filterCountries, countryCenter } from '@hots/geo-kit';

<GeoJSON data={filterCountries(['IDN', 'IRQ', 'JOR'])} />
const idn = getCountryFeature('IDN');      // Indonesia
const [lat, lng] = countryCenter(idn!);   // ≈ -2.4, 118.2
```

## Data notes
- 180 features; `id` = ISO 3166-1 alpha-3, `properties.name` = English name.
- Exceptions kept as in the source: `-99` is shared by Northern Cyprus and Somaliland; Kosovo is `CS-KM`.
- 257 KB JSON — import it only where a map is shown (lazy route) to keep bundles small.

## Not collected
- `E-Order/.../PetaIndofood*.jsx` maps: Indofood-specific distributor maps; the old version contains hard-coded staff e-mails.
- `E-Order/.../MarkerPosition.jsx`: hard-coded staff names and e-mails (personal data).
- No port/city coordinate dataset exists in E-Order.
- Requires `resolveJsonModule` (Vite handles JSON imports by default).
