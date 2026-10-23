import { useEffect, useMemo, useState } from "react";
import { DynamicForm, defaultDynamicFormRegistry, type DynamicFormSchema, type FormValues } from "@hots/dynamic-form";
import { normalizeServiceFormConfig } from "./normalizeServiceFormConfig";
import type { ServiceFormRuntimeProps, ServiceFormService, ServiceFormSubmitPayload } from "./types";
import "./styles.css";

export function ServiceFormRuntime({
  servicePath,
  context = {},
  adapters,
  registry = defaultDynamicFormRegistry,
  submitLabel,
  formKey,
  initialValuesOverride,
  secondaryAction,
  sectionHeaderAction,
  extraSubmitValues,
  beforeForm,
  toolbarAction,
  footer,
  onValuesChange,
  onSubmitted,
  onBack,
}: ServiceFormRuntimeProps) {
  const [service, setService] = useState<ServiceFormService | null>(null);
  const [schema, setSchema] = useState<DynamicFormSchema | null>(null);
  const [initialValues, setInitialValues] = useState<FormValues>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const stableContext = useMemo(() => context, [JSON.stringify(context)]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSubmitError("");
    adapters.loadService(servicePath, stableContext)
      .then(async (loadedService) => {
        if (cancelled) return;
        setService(loadedService);
        setSchema(normalizeServiceFormConfig(loadedService));
        adapters.onWorkflowResolved?.(loadedService, stableContext);
        if (initialValuesOverride) {
          setInitialValues(initialValuesOverride);
        } else if (adapters.resolveGlobalValues) {
          setInitialValues(await adapters.resolveGlobalValues(loadedService, stableContext));
        } else {
          setInitialValues({});
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Service form could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adapters, servicePath, stableContext, formKey]);

  const resolveSystemVariable = adapters.resolveSystemVariable
    ? (variable: string) => adapters.resolveSystemVariable!(variable, stableContext, initialValues)
    : undefined;

  if (loading) return <div className="hsfr-state">Loading service form...</div>;
  if (error) return <div className="hsfr-state hsfr-error"><strong>{error}</strong></div>;
  if (!service || !schema) return <div className="hsfr-state">Service form is not available.</div>;

  const submit = async (values: FormValues, currentSchema: DynamicFormSchema) => {
    setSubmitting(true);
    setSubmitError("");
    const externalValues = typeof extraSubmitValues === "function" ? extraSubmitValues() : (extraSubmitValues || {});
    const mergedValues = { ...values, ...externalValues };
    const payload: ServiceFormSubmitPayload = { service, schema: currentSchema, values: mergedValues, context: stableContext };
    try {
      const result = await adapters.submit(payload);
      onSubmitted?.(result, payload);
    } catch (submitError) {
      setSubmitError(submitError instanceof Error ? submitError.message : "Service form could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="hsfr-shell">
      <header className="hsfr-toolbar">
        {onBack && <button type="button" onClick={onBack}>Back</button>}
        <div className="hsfr-toolbar-title">
          <span>{service.category_name || "Service form"}</span>
          <strong>{service.service_name}</strong>
        </div>
        {toolbarAction}
      </header>
      {submitting && <div className="hsfr-state">Submitting...</div>}
      {!submitting && submitError && (
        <aside className="hsfr-toast hsfr-toast-error" role="alert" aria-live="assertive">
          <button type="button" aria-label="Close notification" onClick={() => setSubmitError("")}>×</button>
          <strong>Submission failed</strong>
          <p>{submitError}</p>
        </aside>
      )}
      {beforeForm}
      <DynamicForm
        key={formKey}
        schema={schema}
        context={stableContext}
        registry={registry}
        initialValues={initialValues}
        onChange={onValuesChange}
        submitLabel={submitLabel}
        secondaryAction={secondaryAction}
        sectionHeaderAction={sectionHeaderAction}
        resolveSystemVariable={resolveSystemVariable}
        resolveFieldOptions={adapters.resolveFieldOptions ? (field, values, query) => adapters.resolveFieldOptions!(field, stableContext, values, query) : undefined}
        uploadFile={adapters.uploadFile ? (file, field) => adapters.uploadFile!(file, { service, context: stableContext, field }) : undefined}
        onSubmit={submit}
      />
      {footer}
    </section>
  );
}
