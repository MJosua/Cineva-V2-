# API — @hots/app-core

| Export | Kind | Since | Status | Notes |
|---|---|---|---|---|
| `HotsCoreProvider` | component | 0.1.0 | active | props: `appKey`, `config`, `http?` |
| `useHotsCore` / `useOptionalHotsCore` | hook | 0.1.0 | active | optional variant returns null outside provider |
| `configFromEnv(env, overrides?)` | fn | 0.1.0 | active | reads `VITE_API_URL` |
| `apiUrl(base, ...parts)` | fn | 0.1.0 | active | joins paths without double slashes |
| `createHttpClient(config)` | fn | 0.1.0 | active | cookie + CSRF + 401 callback |
| `unwrap(payload)` / `ApiError` | fn / class | 0.1.0 | active | tolerates legacy `{ data }` |
| `listParams({ page, limit, sort, order })` | fn | 0.1.0 | active | limit ≤ 100 |
| `connectSSE(opts)` / `useSSE(opts)` | fn / hook | 0.1.0 | active | `mode: 'cookie' \| 'ticket'` |
| `formatMoney`, `formatNumber`, `formatDate`, `toApiDate` | fn | 0.1.0 | active | default `id-ID`, `Asia/Jakarta` |
| `createAppStorage(appKey)` | fn | 0.1.0 | active | prefixes `<appKey>_`, rejects secrets |
| `resolveMediaUrl(path, { origin, tempDir })`, `originFromApiBase` | fn | 0.2.0 | active | bare file name → temp folder |
| `downloadFile(http, url, opts)`, `saveBlob`, `fileNameFromDisposition` | fn | 0.2.0 | active | name from Content-Disposition |
| `floorCbm(value, decimals?)`, `formatCbm(value, locale?, decimals?)` | fn | 0.3.0 | active | floors, never rounds up |
| `resolveApiBase({ candidates, pingPath?, timeoutMs?, skip? })`, `getApiBase`, `isServerReady`, `pingEndpoint`, `findHealthyUrl` | fn | 0.4.0 | active | call before render; first healthy candidate wins |
