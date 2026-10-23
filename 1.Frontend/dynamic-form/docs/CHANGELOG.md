# Changelog

## 0.1.0-cineva.2 — 2026-10-18

- Optional `inputId` label binding for custom field renderers. Cineva HotsForm gives each form distinct DOM IDs; field names and values remain unchanged. Defaults retain legacy IDs.

## 0.1.0-cineva.1 — 2026-10-18

- Apply allowedFieldTypes to creation, child-field defaults and the generic inspector.
- Preserve existing unsupported field types and unknown metadata on edit; no-op field additions with an empty whitelist.
- Expose optional allowedFieldTypes to custom editor hooks; remove host registry filtering workaround.
- Browser component tests use synthetic fixtures only; database excluded by user.

## 2026-10-14

- Copied upstream source into the independent Cineva frontend workspace; no source behavior changes.
- Host adapter limits available field types consistently during creation and editing.
