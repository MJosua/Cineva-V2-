# HOTS Dynamic Form

Reusable JSON-driven form renderer and builder for HOTS and public React apps.

## Extension model

Create a registry per application, then register application-specific fields and
widgets. This keeps the shared package independent from HOTS APIs, Redux, and
routing.

```tsx
const registry = createDynamicFormRegistry();

registry.registerField({
  type: "employee-picker",
  label: "Employee picker",
  createDefault: () => ({ type: "employee-picker", name: "employee", label: "Employee" }),
  component: EmployeePicker,
});

registry.registerWidget({ type: "qr-designer", component: QrDesigner });

<DynamicForm registry={registry} schema={schema} onSubmit={saveValues} />
```

The package accepts legacy HOTS `fields`, `sections`, and `items` JSON. Values
remain keyed by each field's `name`, which preserves the EAV `cstm_col` mapping.
