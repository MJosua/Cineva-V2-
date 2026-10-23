# @hots/dynamic-form — Cineva snapshot

Upstream 0.1.0 from `D:/Kantor/1.Frontend/dynamic-form` on 2026-10-14. Local fork **0.1.0-cineva.1** (2026-10-18) applies `allowedFieldTypes` consistently to creation and the generic inspector. Existing unsupported types remain selected as disabled legacy choices and retain unknown metadata. Empty whitelist prevents field creation; omitted whitelist retains the complete catalog. Optional custom field editors receive the same policy through `SharedFieldEditorProps.allowedFieldTypes` and must honor it. Cineva uses the full registry with its domain extension and passes its whitelist through the public builder prop. The primary legacy ticket form runtime is not replaced wholesale.

Provenance and gaps: `3.Knowledge/architecture/reusable_packages_2026_10_14.md` in the Cineva workspace.

Current fork **0.1.0-cineva.2** adds optional `DynamicFieldSchema.inputId` for custom renderers: labels bind to that ID when supplied, otherwise retain `hdf-${name}`. The custom renderer must apply the same ID. Cineva HotsForm supplies a unique React useId prefix for its flat fields and memoizes the decorated schema so typing does not reset form values. Names and submitted values are unchanged. Upstream snapshot hashes remain historical provenance.
