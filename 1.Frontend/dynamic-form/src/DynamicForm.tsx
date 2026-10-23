import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { defaultDynamicFormRegistry } from "./registry";
import { createInitialValues, normalizeFormSchema, validateFormValues } from "./schema";
import { applyFieldRules } from "./rules";
import type {
  DynamicFieldSchema,
  DynamicFormProps,
  DynamicFormRegistry,
  DynamicRowGroupSchema,
  DynamicSectionSchema,
  FormOption,
  FormValue,
  FormValues,
} from "./types";

interface FieldViewProps {
  field: DynamicFieldSchema;
  displayQuestionNumber?: number | string;
  values: FormValues;
  errors: Record<string, string>;
  registry: DynamicFormRegistry;
  readOnly: boolean;
  systemOptions: Record<string, FormOption[]>;
  systemOptionErrors: Record<string, string>;
  uploadFile?: DynamicFormProps["uploadFile"];
  resolveFieldOptions?: DynamicFormProps["resolveFieldOptions"];
  setValue: (name: string, value: FormValue, option?: FormOption) => void;
}

const FieldView = ({ field, displayQuestionNumber, values, errors, registry, readOnly, systemOptions, systemOptionErrors, uploadFile, resolveFieldOptions, setValue }: FieldViewProps) => {
  const ruledField = applyFieldRules(field, values);
  if ((ruledField as any).hidden === true) return null;
  const extension = registry.getField(ruledField.type) ?? registry.getField("text");
  if (!extension) return null;
  const Component = extension.component;
  const resolvedField = ruledField.systemVariable && Object.prototype.hasOwnProperty.call(systemOptions, ruledField.systemVariable)
    ? { ...ruledField, options: systemOptions[ruledField.systemVariable] }
    : ruledField;
  const isContent = ["textblock", "html", "cms", "par_approval_add_btn"].includes(ruledField.type) || Boolean((resolvedField as any).hideLabel);

  return (
    <div className={`hdf-field hdf-span-${resolvedField.columnSpan ?? 1} ${errors[resolvedField.name] ? "has-error" : ""}`.trim()} data-field-name={resolvedField.name} data-field-type={resolvedField.type} data-choice-layout={resolvedField.choiceLayout}>
      {!isContent && (
        <label className="hdf-label" htmlFor={typeof resolvedField.inputId === "string" ? resolvedField.inputId : `hdf-${resolvedField.name}`}>
          {displayQuestionNumber != null && <span className="hdf-question-number">{displayQuestionNumber}.</span>}
          <span>{resolvedField.prompt ?? resolvedField.label}</span>
          {resolvedField.required && <span className="hdf-required">*</span>}
        </label>
      )}
      {resolvedField.instruction && <small className="hdf-instruction">{resolvedField.instruction}</small>}
      <Component
        field={{ ...resolvedField, readonly: readOnly || resolvedField.readonly }}
        value={values[resolvedField.name]}
        values={values}
        error={errors[resolvedField.name]}
        onChange={(value, option) => setValue(resolvedField.name, value, option)}
        setValue={setValue}
        onBlur={() => undefined}
        uploadFile={uploadFile}
        loadOptions={resolveFieldOptions && resolvedField.api ? (query) => resolveFieldOptions(resolvedField, values, query) : undefined}
      />
      {resolvedField.note && <small className="hdf-note">{resolvedField.note}</small>}
      {resolvedField.systemVariable && systemOptionErrors[resolvedField.systemVariable] && <small className="hdf-error">{systemOptionErrors[resolvedField.systemVariable]}</small>}
      {errors[resolvedField.name] && <small className="hdf-error">{errors[resolvedField.name]}</small>}
    </div>
  );
};

const getSectionIndexById = (sections: { id: string }[], sectionId: string) => sections.findIndex((section) => section.id === sectionId);

const normalizeFieldLike = (field: DynamicFieldSchema): DynamicFieldSchema => {
  const candidate = field as any;
  if ((candidate.type === "field" || candidate.type === "textblock") && candidate.data && typeof candidate.data === "object") {
    return {
      ...candidate.data,
      id: candidate.id || candidate.data.id,
      order: candidate.order ?? candidate.data.order,
    } as DynamicFieldSchema;
  }
  return field;
};

const normalizeFieldGroupChildren = (fields: DynamicFieldSchema[]) =>
  fields.map(normalizeFieldLike).filter((field) => Boolean(field?.name && field?.type));

const visibleFields = (fields: DynamicFieldSchema[], values: FormValues) =>
  fields.map(normalizeFieldLike).filter((field) => (applyFieldRules(field, values) as any).hidden !== true);

const presetColumns = (preset: unknown) => {
  switch (String(preset || "").toLowerCase()) {
    case "one-column": return 1;
    case "two-column": return 2;
    case "three-column": return 3;
    case "five-column": return 5;
    default: return null;
  }
};

const SMALL_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALE_WORDS = ["", "thousand", "million", "billion", "trillion"];

const chunkToWords = (value: number) => {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds) parts.push(`${SMALL_WORDS[hundreds]} hundred`);
  if (rest) {
    if (rest < 20) parts.push(SMALL_WORDS[rest]);
    else {
      const ten = Math.floor(rest / 10);
      const unit = rest % 10;
      parts.push(unit ? `${TENS_WORDS[ten]} ${SMALL_WORDS[unit]}` : TENS_WORDS[ten]);
    }
  }
  return parts.join(" ");
};

const amountToEnglishWords = (input: unknown) => {
  const numeric = Number(String(input ?? "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return "";
  if (numeric === 0) return "zero";
  const sign = numeric < 0 ? "minus " : "";
  let whole = Math.floor(Math.abs(numeric));
  const chunks: string[] = [];
  let scale = 0;
  while (whole > 0) {
    const chunk = whole % 1000;
    if (chunk) chunks.unshift(`${chunkToWords(chunk)}${SCALE_WORDS[scale] ? ` ${SCALE_WORDS[scale]}` : ""}`);
    whole = Math.floor(whole / 1000);
    scale += 1;
  }
  return `${sign}${chunks.join(", ")}`;
};

const parseNumericAmount = (input: unknown) => {
  const text = String(input ?? "").trim();
  if (!text) return 0;
  const normalized = text.includes(",") && text.lastIndexOf(",") > text.lastIndexOf(".")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const amountLocaleFromValues = (values: FormValues) => {
  const countryCode = String(
    values.country_code
    || values.company_country_code
    || values.par_country_code
    || "",
  ).trim().toUpperCase();
  const countryName = String(values.country_name || values.company_country_name || "").trim().toLowerCase();
  const currency = String(values.par_default_currency || values.default_currency || values.currency || "").trim().toUpperCase();

  if (countryCode === "US" || countryCode === "USA" || countryName.includes("usa") || countryName.includes("united states") || currency === "USD") {
    return "en-US";
  }
  if (countryCode === "ID" || countryCode === "IDN" || countryName.includes("indonesia") || currency === "IDR") {
    return "id-ID";
  }
  if (countryCode === "VN" || countryCode === "VNM" || countryName.includes("vietnam") || currency === "VND") {
    return "vi-VN";
  }
  if (countryCode === "CA" || countryCode === "CAN" || countryName.includes("canada") || currency === "CAD") {
    return "en-CA";
  }
  if (countryCode === "SG" || countryCode === "SGP" || countryName.includes("singapore") || currency === "SGD") {
    return "en-SG";
  }
  return "en-US";
};

const currencyNameForAmountWords = (currency: unknown) => {
  const code = String(currency || "").trim().toUpperCase();
  const names: Record<string, string> = {
    USD: "US Dollars",
    IDR: "Indonesian Rupiah",
    VND: "Vietnamese Dong",
    CAD: "Canadian Dollars",
    EUR: "Euro",
    SGD: "Singapore Dollars",
  };
  return names[code] || code;
};

const amountToCurrencyWords = (input: unknown, currency: unknown) => {
  const currencyName = currencyNameForAmountWords(currency);
  const words = amountToEnglishWords(input);
  const capitalizedWords = words ? words.replace(/\b\w/g, (char) => char.toUpperCase()) : "";
  return [currencyName, capitalizedWords].filter(Boolean).join(" ");
};

const POSITIONAL_ROW_KEYS = ["firstValue", "secondValue", "thirdValue"];
const isBlankCell = (value: unknown) => value === "" || value === null || value === undefined;

// Seeded rows use positional keys (firstValue/secondValue/thirdValue) while edits write the
// column name (description/currency/amount); read the named key first, then the positional one.
const rowCellValue = (row: Record<string, FormValue> | undefined, columnKey: string, index: number) => {
  const named = row?.[columnKey];
  if (!isBlankCell(named)) return named;
  const positionalKey = POSITIONAL_ROW_KEYS[index];
  return positionalKey && positionalKey !== columnKey ? row?.[positionalKey] ?? named : named;
};

const pickRowCell = (row: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    if (!isBlankCell(row?.[key])) return row?.[key];
  }
  return undefined;
};

const rowGroupColumns = (rowGroup: DynamicRowGroupSchema): Array<DynamicFieldSchema & { key?: string }> => {
  const structured = rowGroup.structure;
  const columns = rowGroup.columns ?? rowGroup.fields ?? structured?.columns ?? [
    structured?.firstColumn,
    structured?.secondColumn,
    structured?.thirdColumn,
  ];
  return columns
    .filter((field): field is DynamicFieldSchema & { key?: string } => Boolean(field))
    .map((field, index) => ({
      ...field,
      key: field.key || field.name || ["firstValue", "secondValue", "thirdValue"][index] || `value${index + 1}`,
      name: field.name || field.key || ["firstValue", "secondValue", "thirdValue"][index] || `value${index + 1}`,
      label: field.label || `Column ${index + 1}`,
      type: field.type || "text",
    }));
};

const resolveNextSectionIndex = (
  currentIndex: number,
  sectionNodes: { id: string; section: DynamicSectionSchema }[],
  values: FormValues,
) => {
  const current = sectionNodes[currentIndex];
  if (!current) return -1;

  for (const field of current.section.fields) {
    const targetId = field.branching?.[String(values[field.name] ?? "")];
    if (targetId) {
      const targetIndex = getSectionIndexById(sectionNodes, targetId);
      if (targetIndex >= 0) return targetIndex;
    }
  }

  if (current.section.nextSectionId) {
    const targetIndex = getSectionIndexById(sectionNodes, current.section.nextSectionId);
    if (targetIndex >= 0) return targetIndex;
  }

  return currentIndex + 1 < sectionNodes.length ? currentIndex + 1 : -1;
};

const getActiveSectionPath = (
  sectionNodes: { id: string; section: DynamicSectionSchema }[],
  values: FormValues,
  activeSection: number,
) => {
  if (sectionNodes.length === 0) return [];

  const visited = new Set<number>();
  const path: number[] = [];
  let currentIndex = 0;

  while (currentIndex >= 0 && currentIndex < sectionNodes.length && !visited.has(currentIndex)) {
    visited.add(currentIndex);
    path.push(currentIndex);
    if (currentIndex === activeSection) break;
    const nextIndex = resolveNextSectionIndex(currentIndex, sectionNodes, values);
    if (nextIndex < 0) break;
    currentIndex = nextIndex;
  }

  return path;
};

export const DynamicForm = ({
  schema,
  registry = defaultDynamicFormRegistry,
  initialValues,
  submitLabel,
  secondaryAction,
  sectionHeaderAction,
  readOnly = false,
  className = "",
  header,
  context,
  onChange,
  resolveSystemVariable,
  resolveFieldOptions,
  uploadFile,
  onSubmit,
}: DynamicFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const nodes = useMemo(() => normalizeFormSchema(schema), [schema]);
  const [values, setValues] = useState<FormValues>(() => createInitialValues(schema, initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionHistory, setSectionHistory] = useState<number[]>([]);
  const [systemOptions, setSystemOptions] = useState<Record<string, FormOption[]>>({});
  const [systemOptionErrors, setSystemOptionErrors] = useState<Record<string, string>>({});
  const [validationNotice, setValidationNotice] = useState<{ items: string[]; remaining: number } | null>(null);

  const systemVariables = useMemo(() => Array.from(new Set(nodes.flatMap((node) => {
    if (node.kind === "field") return node.field.systemVariable ? [node.field.systemVariable] : [];
    if (node.kind === "section") return node.section.fields
      .flatMap((field) => field.type === "field_group" && Array.isArray((field as any).fields) ? (field as any).fields : [field])
      .map((field) => field.systemVariable)
      .filter((value): value is string => Boolean(value));
    if (node.kind === "rowgroup") return rowGroupColumns(node.rowGroup)
      .map((field) => field.systemVariable)
      .filter((value): value is string => Boolean(value));
    return [];
  }))), [nodes]);

  const sectionNodes = useMemo(() => nodes.filter((node) => node.kind === "section"), [nodes]);
  const focusSections = sectionNodes.length > 0 && (
    sectionNodes.some((node) => node.kind === "section" && Boolean(node.section.focusMode))
    || schema.layout?.sectionFocus === true
  );
  const showQuestionNumbers = schema.layout?.showQuestionNumbers === true;
  const allFields = useMemo(() => nodes.flatMap((node) => {
    if (node.kind === "field") return [node.field];
    if (node.kind === "section") return node.section.fields.flatMap((field) => field.type === "field_group" && Array.isArray((field as any).fields) ? (field as any).fields : [field]);
    if (node.kind === "rowgroup" && node.rowGroup.titleField?.name) return [node.rowGroup.titleField];
    return [];
  }), [nodes]);
  const sectionDisplayNumbers = useMemo(() => {
    const numbers = new Map<string, Map<string, number>>();
    let questionNumber = 1;
    const path = focusSections ? getActiveSectionPath(sectionNodes as { id: string; section: DynamicSectionSchema }[], values, activeSection) : sectionNodes.map((_, index) => index);

    path.forEach((sectionIndex) => {
      const sectionNode = sectionNodes[sectionIndex];
      if (!sectionNode || sectionNode.kind !== "section") return;
      const fieldNumbers = new Map<string, number>();
      sectionNode.section.fields.forEach((field) => {
        const children = field.type === "field_group" && Array.isArray((field as any).fields)
          ? (field as any).fields as DynamicFieldSchema[]
          : [field];
        children.forEach((child) => {
          fieldNumbers.set(child.name, questionNumber);
          questionNumber += 1;
        });
      });
      numbers.set(sectionNode.id, fieldNumbers);
    });

    return numbers;
  }, [activeSection, focusSections, sectionNodes, values]);
  const activeSectionPath = useMemo(
    () => (focusSections ? getActiveSectionPath(sectionNodes as { id: string; section: DynamicSectionSchema }[], values, activeSection) : sectionNodes.map((_, index) => index)),
    [activeSection, focusSections, sectionNodes, values],
  );
  const activeSectionPosition = focusSections ? Math.max(0, activeSectionPath.indexOf(activeSection)) : activeSection;
  const activeSectionTotal = focusSections ? Math.max(1, activeSectionPath.length) : sectionNodes.length;
  const banner = schema.appearance?.banner;
  const background = schema.appearance?.background;
  const secondaryActionNode = typeof secondaryAction === "function"
    ? secondaryAction({ values, schema, submitting })
    : secondaryAction;
  const bannerStyle = banner ? ({
    "--hdf-banner-height": `${Math.min(480, Math.max(80, banner.height ?? 220))}px`,
    "--hdf-banner-mobile-height": `${Math.min(480, Math.max(80, banner.mobileHeight ?? 160))}px`,
  } as CSSProperties) : undefined;
  const backgroundStyle = background ? ({
    backgroundColor: background.color || undefined,
    backgroundImage: background.src ? `url(${JSON.stringify(background.src)})` : undefined,
    backgroundPosition: background.position ?? "center",
    backgroundSize: background.fit === "repeat" ? "auto" : background.fit ?? "cover",
    backgroundRepeat: background.fit === "repeat" ? "repeat" : "no-repeat",
    backgroundAttachment: background.fixed ? "fixed" : "scroll",
    paddingTop: background.paddingTop != null ? `${background.paddingTop}px` : undefined,
    paddingRight: background.paddingRight != null ? `${background.paddingRight}px` : undefined,
    paddingBottom: background.paddingBottom != null ? `${background.paddingBottom}px` : undefined,
    paddingLeft: background.paddingLeft != null ? `${background.paddingLeft}px` : undefined,
    marginTop: background.marginTop != null ? `${background.marginTop}px` : undefined,
    marginRight: background.marginRight != null ? `${background.marginRight}px` : undefined,
    marginBottom: background.marginBottom != null ? `${background.marginBottom}px` : undefined,
    marginLeft: background.marginLeft != null ? `${background.marginLeft}px` : undefined,
    width: background.marginLeft != null || background.marginRight != null ? "auto" : undefined,
  } as CSSProperties) : undefined;

  useEffect(() => {
    setValues(createInitialValues(schema, initialValues));
    setErrors({});
    setValidationNotice(null);
    setActiveSection(0);
    setSectionHistory([]);
  }, [schema, initialValues]);

  useEffect(() => {
    if (!validationNotice) return;
    const timer = window.setTimeout(() => setValidationNotice(null), 9000);
    return () => window.clearTimeout(timer);
  }, [validationNotice]);

  const isInitialMount = useRef(true);
  const lastInitialValuesRef = useRef(initialValues);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (lastInitialValuesRef.current !== initialValues) {
      lastInitialValuesRef.current = initialValues;
      isInitialMount.current = true;
    }
  }, [initialValues]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onChangeRef.current?.(values);
  }, [values]);

  useEffect(() => {
    const rows = values["rowgroup-payment_lines"];
    if (!Array.isArray(rows)) return;
    const totalsByCurrency = rows.reduce<Record<string, number>>((acc, row: any) => {
      const rawAmount = pickRowCell(row, ["amount", "thirdValue", "col3", "column_3"]);
      if (isBlankCell(rawAmount)) return acc;
      const amount = parseNumericAmount(rawAmount);
      if (!Number.isFinite(amount) || amount === 0) return acc;
      const currency = String(pickRowCell(row, ["currency", "secondValue", "col2", "column_2"]) || "").trim().toUpperCase() || "USD";
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {});
    const totalSummary = Object.entries(totalsByCurrency)
      .filter(([, amount]) => amount > 0)
      .map(([currency, amount]) => `${currency} ${amount.toLocaleString(amountLocaleFromValues(values), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      .join("\n");
    const words = Object.entries(totalsByCurrency)
      .filter(([, amount]) => amount > 0)
      .map(([currency, amount]) => amountToCurrencyWords(amount, currency))
      .join("\n");
    if (values.total_amount_summary === totalSummary && values.amount_in_words === words) return;
    setValues((current) => ({
      ...current,
      total_amount_summary: totalSummary,
      amount_in_words: words,
    }));
  }, [values["rowgroup-payment_lines"], values.total_amount_summary, values.amount_in_words]);
  useEffect(() => {
    const approvalSlotDefs = [
      { userKey: "approval_1_user_id", posKey: "approval_1_position" },
      { userKey: "approval_accounting_user_id", posKey: "approval_accounting_position" },
      { userKey: "approval_rm_user_id", posKey: "approval_rm_position" },
      { userKey: "approval_cfo_user_id", posKey: "approval_cfo_position" },
      { userKey: "approval_excom_user_id", posKey: "approval_excom_position" },
      { userKey: "executor_user_id", posKey: "executor_position" },
    ];

    let changed = false;
    const updates: Record<string, any> = {};

    approvalSlotDefs.forEach(({ userKey, posKey }) => {
      const selected = values[`${userKey}__selected`] as any;
      if (!selected) return;
      const jobTitle = selected.job_title || selected.position || selected.position_title;
      const currentPos = values[posKey];
      const lastUser = values[`${userKey}__last_assigned`];
      const currentUser = values[userKey];

      // Auto-fill position if user changed and position is empty, or if matching user change
      if (jobTitle && currentUser && lastUser !== currentUser) {
        updates[`${userKey}__last_assigned`] = currentUser;
        if (currentPos !== jobTitle) {
          updates[posKey] = jobTitle;
          changed = true;
        }
      }
    });

    if (changed || Object.keys(updates).length > 0) {
      setValues((current) => ({ ...current, ...updates }));
    }
  }, [
    values.approval_1_user_id,
    values.approval_1_user_id__selected,
    values.approval_accounting_user_id,
    values.approval_accounting_user_id__selected,
    values.approval_rm_user_id,
    values.approval_rm_user_id__selected,
    values.approval_cfo_user_id,
    values.approval_cfo_user_id__selected,
    values.approval_excom_user_id,
    values.approval_excom_user_id__selected,
    values.executor_user_id,
    values.executor_user_id__selected,
  ]);

  useEffect(() => {
    let active = true;
    if (!resolveSystemVariable || systemVariables.length === 0) {
      setSystemOptions({});
      setSystemOptionErrors({});
      return () => { active = false; };
    }

    setSystemOptionErrors({});
    Promise.all(systemVariables.map(async (variable) => {
      try {
        return { variable, options: await resolveSystemVariable(variable) };
      } catch {
        return { variable, options: null };
      }
    })).then((results) => {
      if (!active) return;
      setSystemOptions(Object.fromEntries(results.filter((item) => item.options).map((item) => [item.variable, item.options as FormOption[]])));
      setSystemOptionErrors(Object.fromEntries(results.filter((item) => !item.options).map((item) => [item.variable, "Options could not be loaded."])));
    });
    return () => { active = false; };
  }, [resolveSystemVariable, systemVariables]);

  const setValue = (name: string, value: FormValue, option?: FormOption) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (option !== undefined) next[`${name}__selected`] = option;
      else if (value === "" || value == null) delete next[`${name}__selected`];
      return next;
    });
    setErrors((current) => ({ ...current, [name]: "" }));
    setValidationNotice(null);
  };

  const getDisplayedQuestionNumber = (field: DynamicFieldSchema) => {
    for (const fieldNumbers of sectionDisplayNumbers.values()) {
      const number = fieldNumbers.get(field.name);
      if (number != null) return number;
    }
    return field.questionNumber;
  };

  const showValidationNotice = (nextErrors: Record<string, string>, fields: DynamicFieldSchema[]) => {
    const invalidNames = Object.keys(nextErrors);
    if (invalidNames.length === 0) {
      setValidationNotice(null);
      return;
    }
    const fieldMap = new Map(fields.map((field) => [field.name, field]));
    const items = invalidNames.slice(0, 4).map((name) => {
      const field = fieldMap.get(name);
      if (!field) return nextErrors[name];
      const number = getDisplayedQuestionNumber(field);
      const label = number != null ? `Question ${number}` : (field.questionNumber != null && String(field.questionNumber).trim() ? `Question ${field.questionNumber}` : "Question");
      return `${label}: ${field.prompt || field.label}`;
    });
    setValidationNotice({ items, remaining: Math.max(0, invalidNames.length - items.length) });

    const firstName = invalidNames[0];
    window.requestAnimationFrame(() => {
      const target = Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-field-name]") ?? [])
        .find((element) => element.dataset.fieldName === firstName);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const visitedIndexes = new Set([...sectionHistory, activeSection]);
    const validationSchema = focusSections
      ? {
          ...schema,
          fields: undefined,
          sections: undefined,
          widgets: undefined,
          items: sectionNodes
            .filter((_, index) => visitedIndexes.has(index))
            .map((node, order) => ({ id: node.id, type: "section", order, data: node.kind === "section" ? node.section : {} })),
        }
      : schema;
    const nextErrors = validateFormValues(validationSchema, values, registry);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showValidationNotice(nextErrors, allFields);
      return;
    }
    setValidationNotice(null);
    setSubmitting(true);
    try {
      await onSubmit(values, schema);
    } finally {
      setSubmitting(false);
    }
  };

  const validateFields = (fields: DynamicFieldSchema[]) => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((sourceField) => {
      const field = applyFieldRules(sourceField, values);
      if ((field as any).hidden === true) return;
      const value = values[field.name];
      const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0)
        || (field.required && field.type === "checkbox" && value !== true);
      if (field.required && empty) nextErrors[field.name] = `${field.label} is required.`;
      const extensionError = registry.getField(field.type)?.validate?.(value, field, values);
      if (extensionError) nextErrors[field.name] = extensionError;
    });
    setErrors((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [field.name, ""])), ...nextErrors }));
    showValidationNotice(nextErrors, fields);
    return Object.keys(nextErrors).length === 0;
  };

  const getNextSectionIndex = () => {
    const current = sectionNodes[activeSection];
    if (!current || current.kind !== "section") return -1;
    if (current.section.endsFlow) return -1;
    for (const field of current.section.fields.flatMap((item) => item.type === "field_group" && Array.isArray((item as any).fields) ? (item as any).fields as DynamicFieldSchema[] : [item])) {
      const targetId = field.branching?.[String(values[field.name] ?? "")];
      if (targetId) {
        const targetIndex = sectionNodes.findIndex((node) => node.id === targetId);
        if (targetIndex >= 0) return targetIndex;
      }
    }
    if (current.section.nextSectionId) {
      const configuredIndex = sectionNodes.findIndex((node) => node.id === current.section.nextSectionId);
      if (configuredIndex >= 0) return configuredIndex;
    }
    return activeSection + 1 < sectionNodes.length ? activeSection + 1 : -1;
  };

  const goNext = () => {
    const current = sectionNodes[activeSection];
    if (!current || current.kind !== "section") return;
    const fields = current.section.fields.flatMap((item) => item.type === "field_group" && Array.isArray((item as any).fields) ? (item as any).fields as DynamicFieldSchema[] : [item]);
    if (!validateFields(fields)) return;
    const target = getNextSectionIndex();
    if (target < 0) return;
    setSectionHistory((history) => [...history, activeSection]);
    setActiveSection(target);
  };

  const goBack = () => {
    const previous = sectionHistory[sectionHistory.length - 1];
    if (previous == null) return;
    setSectionHistory((history) => history.slice(0, -1));
    setActiveSection(previous);
  };

  const renderSectionField = (sectionId: string, section: DynamicSectionSchema, field: DynamicFieldSchema, index: number) => {
    const normalizedField = normalizeFieldLike(field);
    if (normalizedField.type === "field_group" && Array.isArray((normalizedField as any).fields)) {
      const children = visibleFields(normalizeFieldGroupChildren((normalizedField as any).fields as DynamicFieldSchema[]), values);
      if (children.length === 0) return null;
      const columns = Math.min(Math.max(Number((normalizedField as any).rowColumns || presetColumns((normalizedField as any).layoutPreset) || (normalizedField as any).columns || 2), 1), 6);
      const span = normalizedField.columnSpan ?? 3;
      const groupStyle = { "--hdf-field-group-columns": columns } as CSSProperties;
      return (
        <div key={normalizedField.name || `group-${index}`} className={`hdf-field-group hdf-span-${span} ${(normalizedField as any).className || ""}`.trim()}>
          {(normalizedField.label || (normalizedField as any).title) && <div className="hdf-field-group-title">{normalizedField.label || (normalizedField as any).title}</div>}
          <div className={`hdf-field-group-grid hdf-field-group-cols-${columns}`} style={groupStyle}>
            {children.map((child) => (
              <FieldView
                key={child.name}
                field={child}
                displayQuestionNumber={!showQuestionNumbers || section.hideQuestionNumbers ? undefined : (sectionDisplayNumbers.get(sectionId)?.get(child.name) ?? getDisplayedQuestionNumber(child))}
                values={values}
                errors={errors}
                registry={registry}
                readOnly={readOnly}
                systemOptions={systemOptions}
                systemOptionErrors={systemOptionErrors}
                uploadFile={uploadFile}
                resolveFieldOptions={resolveFieldOptions}
                setValue={setValue}
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <FieldView
        key={normalizedField.name}
        field={normalizedField}
        displayQuestionNumber={!showQuestionNumbers || section.hideQuestionNumbers ? undefined : (sectionDisplayNumbers.get(sectionId)?.get(normalizedField.name) ?? getDisplayedQuestionNumber(normalizedField))}
        values={values}
        errors={errors}
        registry={registry}
        readOnly={readOnly}
        systemOptions={systemOptions}
        systemOptionErrors={systemOptionErrors}
        uploadFile={uploadFile}
        resolveFieldOptions={resolveFieldOptions}
        setValue={setValue}
      />
    );
  };

  const renderSection = (id: string, section: DynamicSectionSchema) => {
    const sectionColumns = Math.min(Math.max(Number((section as any).columns || schema.layout?.columns || 3), 1), 6);
    const sectionStyle = { "--hdf-section-columns": sectionColumns } as CSSProperties;
    const normalizedSectionFields = section.fields.map(normalizeFieldLike);
    const fields = visibleFields(normalizedSectionFields.flatMap((field) => field.type === "field_group" && Array.isArray((field as any).fields) ? [] : [field]), values);
    const fieldGroups = normalizedSectionFields.filter((field) => field.type === "field_group" && Array.isArray((field as any).fields));
    const hasVisibleGroupChild = fieldGroups.some((field) => visibleFields(normalizeFieldGroupChildren((field as any).fields as DynamicFieldSchema[]), values).length > 0);
    if (fields.length === 0 && !hasVisibleGroupChild) return null;
    return (
    <section key={id} className="hdf-section" style={sectionStyle}>
      {!section.hideHeading && <div className="hdf-section-heading">
        <div>
          <h2>{section.title}</h2>
          {section.description && <p>{section.description}</p>}
        </div>
        {sectionHeaderAction?.({ sectionId: id, section, values })}
      </div>}
      <div className="hdf-grid">
        {section.fields.map((field, index) => renderSectionField(id, section, field, index))}
      </div>
    </section>
    );
  };

  const renderRowGroup = (id: string, rowGroup: DynamicRowGroupSchema) => {
    const valueKey = rowGroup.name || rowGroup.id || id;
    const rows = Array.isArray(values[valueKey]) ? values[valueKey] as Array<Record<string, FormValue>> : rowGroup.rowGroup ?? [];
    const columns = rowGroupColumns(rowGroup);
    const maxRows = rowGroup.maxRows ?? 100;

    const updateRows = (nextRows: Array<Record<string, FormValue>>) => setValue(valueKey, nextRows);
    const updateCell = (rowIndex: number, columnKey: string, value: FormValue) => {
      // Keep the positional key (firstValue/secondValue/...) in sync: rowCellValue falls back to it when the named
      // cell is blank, so an explicit empty choice (e.g. currency "— None —") would otherwise revert to the default.
      const columnIndex = columns.findIndex((column) => (column.key || column.name) === columnKey);
      const positionalKey = columnIndex >= 0 ? POSITIONAL_ROW_KEYS[columnIndex] : undefined;
      updateRows(rows.map((row, index) => {
        if (index !== rowIndex) return row;
        const next = { ...row, [columnKey]: value };
        if (positionalKey && positionalKey !== columnKey && Object.prototype.hasOwnProperty.call(row, positionalKey)) {
          next[positionalKey] = value;
        }
        return next;
      }));
    };
    const addRow = () => {
      if (rows.length >= maxRows) return;
      updateRows([
        ...rows,
        Object.fromEntries(columns.map((column) => [column.key || column.name, column.default ?? column.value ?? ""])),
      ]);
    };
    const removeRow = (rowIndex: number) => updateRows(rows.filter((_, index) => index !== rowIndex));

    return (
      <section key={id} className="hdf-rowgroup" data-rowgroup-id={valueKey}>
        <div className="hdf-rowgroup-heading">
          <div>
            <h2>{rowGroup.title || "Row group"}</h2>
            {rowGroup.description && <p>{rowGroup.description}</p>}
          </div>
          <div className="hdf-rowgroup-actions">
            {sectionHeaderAction?.({ sectionId: id, section: rowGroup as unknown as DynamicSectionSchema, values })}
            {!readOnly && <button type="button" disabled={rows.length >= maxRows} onClick={addRow}>Add row</button>}
          </div>
        </div>
        {rowGroup.titleField?.name && (
          <div className="hdf-rowgroup-title-field">
            <FieldView
              field={{ ...rowGroup.titleField, type: rowGroup.titleField.type || "text", columnSpan: 3 }}
              values={values}
              errors={errors}
              registry={registry}
              readOnly={readOnly}
              systemOptions={systemOptions}
              systemOptionErrors={systemOptionErrors}
              uploadFile={uploadFile}
              resolveFieldOptions={resolveFieldOptions}
              setValue={setValue}
            />
          </div>
        )}
        <div className="hdf-rowgroup-table-wrap">
          <table className="hdf-rowgroup-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key || column.name}>{column.label}</th>)}
                {!readOnly && <th aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${valueKey}-${rowIndex}`}>
                  {columns.map((column, columnIndex) => {
                    const columnKey = column.key || column.name;
                    const ruledColumn = applyFieldRules(column, { ...values, ...row });
                    const optionedColumn = ruledColumn.systemVariable && Object.prototype.hasOwnProperty.call(systemOptions, ruledColumn.systemVariable)
                      ? { ...ruledColumn, options: systemOptions[ruledColumn.systemVariable] }
                      : ruledColumn;
                    // Row "amount" columns accept free text and format to 10,000.00 on blur.
                    const field = optionedColumn.type === "number" && (columnKey === "amount" || optionedColumn.format === "amount")
                      ? { ...optionedColumn, type: "amount" }
                      : optionedColumn;
                    const extension = registry.getField(field.type) ?? registry.getField("text");
                    const Component = extension?.component;
                    return (
                      <td key={columnKey}>
                        {Component && (
                          <Component
                            field={{ ...field, readonly: readOnly || field.readonly }}
                            value={rowCellValue(row, columnKey, columnIndex)}
                            values={{ ...values, ...row }}
                            error={errors[`${valueKey}_${rowIndex}_${columnKey}`]}
                            onChange={(value) => updateCell(rowIndex, columnKey, value)}
                            onBlur={() => undefined}
                            uploadFile={uploadFile}
                            loadOptions={resolveFieldOptions && field.api ? (query) => resolveFieldOptions(field, { ...values, ...row }, query) : undefined}
                          />
                        )}
                        {column.systemVariable && systemOptionErrors[column.systemVariable] && <small className="hdf-error">{systemOptionErrors[column.systemVariable]}</small>}
                      </td>
                    );
                  })}
                  {!readOnly && (
                    <td>
                      <button type="button" disabled={rows.length <= 1} onClick={() => removeRow(rowIndex)}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (readOnly ? 0 : 1)}>
                    <p className="hdf-rowgroup-empty">No rows yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className={`hdf-form-canvas ${background ? "has-background" : ""}`.trim()} style={backgroundStyle}>
    <form ref={formRef} className={`hdf-form ${schema.layout?.googleFormsStyle === true ? "hdf-google-form" : ""} ${className}`.trim()} onSubmit={submit} noValidate>
      {header}
      {banner?.src && <figure className="hdf-form-banner" style={bannerStyle}><img src={banner.src} alt={banner.alt ?? ""} style={{ objectFit: banner.fit ?? "cover", objectPosition: banner.position ?? "center" }} /></figure>}
      <header className="hdf-header">
        {!schema.intro && <p className="hdf-eyebrow">Dynamic form</p>}
        <h1>{schema.title}</h1>
        {schema.intro?.subtitle && <h2 className="hdf-intro-subtitle">{schema.intro.subtitle}</h2>}
        {(schema.intro?.body || schema.description) && <p>{schema.intro?.body || schema.description}</p>}
        {schema.intro?.location && <p className="hdf-intro-location">{schema.intro.location}</p>}
        {schema.intro?.socialTitle && <strong className="hdf-intro-social-title">{schema.intro.socialTitle}</strong>}
        {schema.intro?.socialLines?.map((line) => <p className="hdf-intro-social" key={line}>{line}</p>)}
        {schema.intro?.requiredNote && <p className="hdf-required-note">{schema.intro.requiredNote}</p>}
      </header>

      {focusSections && schema.layout?.hideStepProgress !== true && <div className="hdf-step-progress">{schema.layout?.hideSectionProgressLabel !== true && <span>Section {activeSectionPosition + 1} of {activeSectionTotal}</span>}<div><i style={{ width: `${((activeSectionPosition + 1) / activeSectionTotal) * 100}%` }} /></div></div>}

      <div className="hdf-grid">
        {(focusSections ? [sectionNodes[activeSection]].filter(Boolean) : nodes).map((node) => {
          if (node.kind === "field") {
            return <FieldView key={node.id} field={node.field} displayQuestionNumber={getDisplayedQuestionNumber(node.field)} values={values} errors={errors} registry={registry} readOnly={readOnly} systemOptions={systemOptions} systemOptionErrors={systemOptionErrors} uploadFile={uploadFile} setValue={setValue} />;
          }
          if (node.kind === "section") {
            return renderSection(node.id, node.section);
          }
          if (node.kind === "rowgroup") {
            return renderRowGroup(node.id, node.rowGroup);
          }
          const widgetExtension = registry.getWidget(node.widget.type);
          if (!widgetExtension) return <div key={node.id} className="hdf-addon-missing">Widget add-on “{node.widget.type}” is not installed.</div>;
          const Widget = widgetExtension.component;
          return <Widget key={node.id} widget={node.widget} values={values} setValue={setValue} context={context} />;
        })}
      </div>

      {!readOnly && focusSections && (
        <footer className="hdf-actions hdf-step-actions">
          <button className="hdf-secondary" type="button" disabled={sectionHistory.length === 0} onClick={goBack}>Back</button>
          {getNextSectionIndex() >= 0
            ? <button className="hdf-submit" type="button" onClick={goNext}>Next section</button>
            : <>
                {secondaryActionNode}
                <button className="hdf-submit" type="submit" disabled={submitting}>{submitting ? "Submitting..." : submitLabel ?? schema.submit?.label ?? "Submit form"}</button>
              </>}
        </footer>
      )}

      {!readOnly && !focusSections && (
        <footer className="hdf-actions">
          {secondaryActionNode}
          <button className="hdf-submit" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : submitLabel ?? schema.submit?.label ?? "Submit form"}
          </button>
        </footer>
      )}
      {schema.footerNote && <p className="hdf-footer-note">{schema.footerNote}</p>}
    </form>
    {validationNotice && <aside className="hdf-validation-toast" role="alert" aria-live="assertive">
      <button type="button" aria-label="Close validation message" onClick={() => setValidationNotice(null)}>x</button>
      <strong>Please check your answers</strong>
      <p>Complete or correct these questions before continuing:</p>
      <ul>{validationNotice.items.map((item) => <li key={item}>{item}</li>)}</ul>
      {validationNotice.remaining > 0 && <small>And {validationNotice.remaining} more question{validationNotice.remaining > 1 ? "s" : ""}.</small>}
    </aside>}
    </div>
  );
};
