# Cineva product compositions

Frontend dummy preview implements HQ and Creator Space on existing HOTS shell, dynamic-form, ui-kit and app-core. No new backend engine/database is included.

Vendor palette: brown/gold/white is applied through `features/cineva-shared/CinevaVendorTheme.tsx` and `cineva-vendor.css` at the app/preview roots. Shared HOTS defaults and engines remain unchanged. Future upstream features must be additive/backward-compatible; Kantor is read-only from this project.

- Development: from workspace root `npm.cmd run preview:products`, then `/hots/cineva-preview.html#/hq/dashboard` or `#/creator/dashboard` on port 48174.
- Authenticated host entries: `/hots/cineva/hq/dashboard`, `/hots/cineva/creator/dashboard`. These still use synthetic data.
- Production build includes `dist/cineva-preview.html`; serve under `/hots/`. Preview has isolated dummy repository; it never calls ticket/auth/provider endpoints.
- Edit navigation in `src/features/cineva-shared/navigation.ts`, seed/adapter in `dummyRepository.ts`, domain validation in `model.ts`, and shared form in `HotsForm.tsx`. Product-specific views stay under `cineva-hq` and `creator-space`.
- All local sample storage keys are namespaced `cineva_dummy_v1_`; reset changes only active product samples. Not tenant authorization.
- Full architecture and acceptance: [knowledge record](../../../3.Knowledge/architecture/dual_product_preview_2026_10_18.md).
