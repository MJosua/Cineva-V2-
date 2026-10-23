import { useId, useMemo } from 'react';
import { DynamicForm, createDynamicFormRegistry, type DynamicFormSchema, type FieldComponentProps, type FormValues } from '@hots/dynamic-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
const control = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
function Field({ field, value, onChange, onBlur, error }: FieldComponentProps) {
    const common = { id: typeof field.inputId === 'string' ? field.inputId : `hdf-${field.name}`, name: field.name, value: String(value ?? ''), onBlur, 'aria-invalid': Boolean(error), required: field.required, disabled: Boolean(field.disabled) };
    if (field.type === 'textarea')
        return <Textarea {...common} onChange={e => onChange(e.target.value)}/>;
    if (field.type === 'select')
        return <select {...common} className={control} onChange={e => onChange(e.target.value)}><option value="">Pilih...</option>{field.options?.map(option => { const entry = typeof option === 'object' ? option : { value: option, label: option }; return <option key={String(entry.value)} value={String(entry.value)}>{String(entry.label)}</option>; })}</select>;
    return <Input {...common} type={field.type === 'datetime' ? 'datetime-local' : field.type} min={field.minnumber} max={field.maxnumber} onChange={e => onChange(e.target.value)}/>;
}
/** Shared renderer/validation with app-owned HOTS controls; no global CSS override. */
export function HotsForm({ schema, initialValues, onSubmit, submitLabel, onValuesChange }: {
    schema: DynamicFormSchema;
    initialValues?: FormValues;
    onSubmit: (values: FormValues) => Promise<void> | void;
    submitLabel?: string;
    onValuesChange?: (values: FormValues) => void;
}) {
    const formId = useId();
    const scopedSchema = useMemo(() => ({ ...schema, fields: schema.fields?.map(field => ({ ...field, inputId: `${formId}-${field.name}` })) }), [schema, formId]);
    const registry = useMemo(() => { const base = createDynamicFormRegistry(); for (const type of ['text', 'textarea', 'select', 'number', 'date', 'datetime', 'email'])
        base.registerField({ type, label: type, component: Field }); return base; }, []);
    return <DynamicForm schema={scopedSchema} registry={registry} initialValues={initialValues} onSubmit={onSubmit} onChange={onValuesChange} submitLabel={submitLabel} className="space-y-4 text-foreground [&_.hdf-header]:hidden [&_.hdf-grid]:grid [&_.hdf-grid]:grid-cols-1 [&_.hdf-grid]:gap-4 sm:[&_.hdf-grid]:grid-cols-2 [&_.hdf-field]:space-y-2 [&_.hdf-label]:block [&_.hdf-label]:text-sm [&_.hdf-label]:font-medium [&_.hdf-required]:text-destructive [&_.hdf-error]:text-sm [&_.hdf-error]:text-destructive [&_.hdf-actions]:pt-4 [&_.hdf-submit]:rounded-md [&_.hdf-submit]:bg-primary [&_.hdf-submit]:px-4 [&_.hdf-submit]:py-2 [&_.hdf-submit]:text-sm [&_.hdf-submit]:font-medium [&_.hdf-submit]:text-primary-foreground [&_.hdf-submit]:focus-visible:ring-2 [&_.hdf-submit]:focus-visible:ring-ring [&_.hdf-submit]:disabled:opacity-50"/>;
}
