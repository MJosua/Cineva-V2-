# @hots/content-kit 0.1.0-cineva.1

New local universal module, not an upstream HOTS release. Browser studio and backend content service consume the same contracts and deterministic SVG renderer. No React, DB, network, vendor config imports, or runtime logging. `src/index.mjs` supports Node ESM and Vite; `src/index.d.mts` supplies types.

Includes revision-safe editorial transition policy, 8 original text-based templates, brand kit, bounded slide rendering and lifetime metric projections. Carousel UI and date picker remain ui-kit. Backend workflow port is injectable; live application workflow binding is a host responsibility. Content labels/colors are supplied by templates and brand, not hardcoded into platform defaults.

SVG is rendered on demand from frozen JSON. Browser exports raster PNG using the same SVG, fonts must be ready. Raster logos are bounded data URLs; arbitrary SVG/HTML is not accepted. No image-generation provider or photo stock library is bundled. Runtime package consumer tests use synthetic data, not production accounts.

Promotion to HOTS is a separate owner review. Preserve existing package APIs and program behavior. See Cineva knowledge implementation notes for provider/persistence activation gates.
