export function handleAutoSelectFirst(field, applied, context) {
  const { autoSetValue, rowContext, globalValues } = context;
  const options = field.options ?? [];

  console.groupCollapsed(`⚙️ [autoSelectFirst] Field: ${field.name} (${field.label || "no-label"})`);

  // ✅ Early exit: No options
  if (!Array.isArray(options) || options.length === 0) {
    console.warn("⚠️ No options available — skipping autoSelectFirst.");
    console.groupEnd();
    return;
  }

  // ✅ Pick first valid option
  const first = options[0];
  const autoVal =
    typeof first === "object"
      ? first.value ?? first.label ?? first.po_number ?? first.item_name
      : first;

  // ✅ Skip if current value already equals first option
  if (field.value === autoVal) {
    console.log(`⚪ Skipped autoSelectFirst for ${field.name} — already has '${autoVal}'`);
    console.groupEnd();
    return;
  }

  // ✅ Skip if user has manually set a value recently
  if (globalValues?.__lastEditedField === field.name) {
    console.log(`⚪ Skipped autoSelectFirst for ${field.name} — user is editing this field`);
    console.groupEnd();
    return;
  }

  // ✅ Apply change only if target value is empty
  if (!field.value || field.value === "") {
    console.log(`✅ Applying autoSelectFirst → ${field.name} = ${autoVal}`);
    setTimeout(() => autoSetValue?.(field.name, autoVal, first), 0);
  } else {
    console.warn(`⚠️ Field '${field.name}' already has value '${field.value}', skipping autoSelectFirst.`);
  }

  console.groupEnd();
}
