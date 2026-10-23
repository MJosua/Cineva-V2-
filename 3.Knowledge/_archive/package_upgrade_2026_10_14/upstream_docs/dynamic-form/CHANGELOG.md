# @hots/dynamic-form changelog

## Unreleased (2026-10-07)
### Added
- `DynamicRowGroupSchema.titleField`: optional full-width field rendered above a rowgroup's rows.
  Value is stored at `values[titleField.name]`, included in initial values, and validated when `required`.
  Additive: rowgroups without `titleField` render and validate exactly as before.
- Field type `api_select`: plain `<select>` whose options load from the field `api` (via `loadOptions`),
  reloading when `dependsOn` changes. Keeps a saved value visible via `<name>__selected`. No typing or suggestions.
