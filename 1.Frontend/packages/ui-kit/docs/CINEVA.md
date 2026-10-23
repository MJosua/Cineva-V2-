# Cineva fork 0.2.0-cineva.1

Upstream source snapshot: 0.2.0 on 2026-10-14. Component source is unchanged. This fork adds public component, utils and mobile-hook subpaths to package exports so legacy import wrappers resolve named/default exports without copying implementation.

Optional peer libraries resolve from the host/workspace. Cineva Vite dedupe and TypeScript paths document that resolution. Shared Tailwind preset requires the plugin to be resolvable from the package's dependency tree. Source styling is scanned by the host Tailwind config; app theme tokens remain app-owned.
