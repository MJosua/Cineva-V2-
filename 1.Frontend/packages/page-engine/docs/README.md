---
app: @hots/page-engine
purpose: Shared package @hots/page-engine: responsive layout and safe CSS parser for configurable pages (renderer not yet extracted)
domain: Shared Platform
owner: iod.it
status: draft
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

# @hots/page-engine

Building blocks for JSON-driven pages (landing, promo, event, catalogue pages). Harvested from the Event app's engine.

- **Version:** 0.1.0 · **Source:** `Event/src/components/Engine/responsiveLayout.js`, `Event/src/utils/cssParser.js` (2026-10-06, Event unchanged)

## Exports
| Export | Purpose |
|---|---|
| `resolveResponsiveProps(props, viewport)` | Desktop → tablet → mobile cascade of whitelisted layout keys + per-viewport hide |
| `applyResponsiveLayoutUpdates(props, updates, viewport)` | Editor writes: desktop → base props, other viewports → `layoutByBreakpoint` |
| `getViewportFromWidth(px)`, `BREAKPOINTS`, `LAYOUT_OVERRIDE_KEYS` | Breakpoints 768 / 1024 |
| `parseCustomCss(input)` | User CSS (JSON or `a: b; c: d`) → style object, **safe** |

## Security difference from Event
Event's `safeParseCustomCss` evaluates stored text with `new Function()` (code execution from CMS data). `parseCustomCss` removes that step, drops invalid keys, and strips `javascript:` / `expression()` / HTML `data:` URLs. Verified by smoke test (2026-10-06).

## Not extracted yet
The block registry + renderer (`Event/src/components/Engine/{Registry,EngineRenderer}.jsx`, ~20 blocks) depends on Chakra UI and contains an unsanitized `CustomHTMLBlock`. Extracting it means: Tailwind/ui-kit instead of Chakra, `registerBlock()` API, DOMPurify for HTML blocks, coupon blocks as a plugin.
