import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type {
  DynamicFieldSchema,
  DynamicFormRegistry,
  FieldComponentProps,
  FieldExtension,
  FormOption,
  FormUploadValue,
  WidgetExtension,
} from "./types";

const firstOptionValue = (option: Exclude<FormOption, string | number>, keys: string[]) => {
  for (const key of keys) {
    const candidate = option[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
  }
  return "";
};

const optionValue = (option: FormOption, field?: DynamicFieldSchema): string => {
  if (typeof option !== "object") return String(option);
  const configuredKey = typeof field?.valueKey === "string" ? field.valueKey : "";
  return String(firstOptionValue(option, [
    configuredKey,
    "value", "user_id", "bank_account_id", "company_bank_id", "country_id",
    "distributor_id", "id", "filter", "item_name", "product_code", "product_sku",
    "po_number", "label",
  ].filter(Boolean)));
};

const optionLabel = (option: FormOption, field?: DynamicFieldSchema): string => {
  if (typeof option !== "object") return String(option);
  const configuredKey = typeof field?.labelKey === "string" ? field.labelKey : "";
  return String(firstOptionValue(option, [
    configuredKey,
    "label", "account_display", "full_name", "bank_display", "bank_name",
    "account_name", "company_name", "product_name", "item_name", "name",
    "po_name", "po_number", "value", "id",
  ].filter(Boolean)));
};

const optionSecondaryLabel = (option: FormOption): string => {
  if (typeof option !== "object") return "";
  return String(firstOptionValue(option, [
    "job_title", "position_title", "position", "department_name",
    "sublabel", "description", "account_number", "swift_code", "iso_code",
    "product_sku", "email", "uid",
  ]));
};

const optionImage = (option: FormOption): string | undefined =>
  typeof option === "object" && typeof option.image === "string" ? option.image : undefined;

const TextField = ({ field, value, error, onChange, onBlur }: FieldComponentProps) => (
  <input
    className="hdf-control"
    type={field.type === "number" ? "number" : field.type === "time" ? field.type : "text"}
    value={value == null ? "" : String(value)}
    placeholder={field.placeholder}
    readOnly={field.readonly}
    disabled={field.disabled}
    min={field.minnumber}
    max={field.maxnumber}
    aria-invalid={Boolean(error)}
    onChange={(event) => onChange(event.target.value)}
    onBlur={onBlur}
  />
);

const parseAmountText = (input: unknown) => {
  const text = String(input ?? "").trim().replace(/[^0-9,.-]+/g, "");
  if (!text) return NaN;
  const normalized = text.includes(",") && text.lastIndexOf(",") > text.lastIndexOf(".")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  return Number(normalized);
};

// Free-text amount: typed text is kept as-is; on blur it becomes en-US with 2 decimals (10,000.00).
const formatAmountText = (input: unknown) => {
  if (input === "" || input === null || input === undefined) return "";
  const numeric = parseAmountText(input);
  if (!Number.isFinite(numeric)) return String(input);
  return numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const AmountField = ({ field, value, error, onChange, onBlur }: FieldComponentProps) => {
  const [focused, setFocused] = useState(false);
  const raw = value == null ? "" : String(value);
  return (
    <input
      className="hdf-control"
      type="text"
      inputMode="decimal"
      value={focused ? raw : formatAmountText(raw)}
      placeholder={field.placeholder}
      readOnly={field.readonly}
      disabled={field.disabled}
      aria-invalid={Boolean(error)}
      onFocus={() => setFocused(true)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        setFocused(false);
        const formatted = formatAmountText(raw);
        if (formatted !== raw) onChange(formatted);
        onBlur?.();
      }}
    />
  );
};

const formatDateDisplay =(raw: unknown, field: DynamicFieldSchema) => {
  if (!raw) return "";
  const value = String(raw);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, yyyy, mm, dd] = match;
  const configuredFormat = String(field.dateFormat || field.format || "").toLowerCase();
  if (configuredFormat.includes("dd") && configuredFormat.indexOf("dd") < configuredFormat.indexOf("mm")) return `${dd}/${mm}/${yyyy}`;
  return `${mm}/${dd}/${yyyy}`;
};

const DateField = ({ field, value, error, onChange, onBlur }: FieldComponentProps) => {
  const inputValue = value == null ? "" : String(value).slice(0, 10);
  if (field.readonly || field.disabled) {
    return (
      <input
        className="hdf-control"
        type="text"
        value={inputValue ? formatDateDisplay(inputValue, field) : ""}
        placeholder={field.placeholder || "Input later"}
        readOnly
        disabled={field.disabled}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
      />
    );
  }
  return (
    <div className="hdf-date-shell">
      <input
        className="hdf-control"
        type="date"
        value={inputValue}
        readOnly={field.readonly}
        disabled={field.disabled}
        min={typeof field.minDate === "string" || typeof field.minDate === "number" ? String(field.minDate) : typeof field.min === "string" || typeof field.min === "number" ? String(field.min) : undefined}
        max={typeof field.maxDate === "string" || typeof field.maxDate === "number" ? String(field.maxDate) : typeof field.max === "string" || typeof field.max === "number" ? String(field.max) : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};

const TextareaField = ({ field, value, error, onChange, onBlur }: FieldComponentProps) => (
  <textarea
    className="hdf-control hdf-textarea"
    value={value == null ? "" : String(value)}
    placeholder={field.placeholder}
    readOnly={field.readonly}
    disabled={field.disabled}
    aria-invalid={Boolean(error)}
    onChange={(event) => onChange(event.target.value)}
    onBlur={onBlur}
  />
);

const SelectField = ({ field, value, error, onChange, onBlur }: FieldComponentProps) => (
  <select
    className="hdf-control"
    value={value == null ? "" : String(value)}
    disabled={field.readonly || field.disabled}
    aria-invalid={Boolean(error)}
    onChange={(event) => {
      const selected = (field.options ?? []).find((option) => optionValue(option, field) === event.target.value);
      onChange(event.target.value, selected);
    }}
    onBlur={onBlur}
  >
    <option value="">{field.placeholder || "Select an option"}</option>
    {(field.options ?? []).map((option, index) => (
      <option key={`${optionValue(option, field)}-${index}`} value={optionValue(option, field)}>
        {optionLabel(option, field)}
      </option>
    ))}
  </select>
);

// Plain dropdown whose options come from the field API (no typing / suggestions). Reloads when `dependsOn` changes.
export const ApiSelectField = ({ field, value, values, error, onChange, onBlur, loadOptions }: FieldComponentProps) => {
  const [remoteOptions, setRemoteOptions] = useState<FormOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;
  const dependsOnValue = field.dependsOn ? values[field.dependsOn] : undefined;

  useEffect(() => {
    const loader = loadOptionsRef.current;
    if (!loader) return;
    let active = true;
    setLoadingOptions(true);
    loader("")
      .then((next) => { if (active) setRemoteOptions(next); })
      .catch(() => { if (active) setRemoteOptions([]); })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, [field.api, field.name, dependsOnValue]);

  const options = remoteOptions.length ? remoteOptions : (field.options ?? []);
  const current = value == null ? "" : String(value);
  // Keep a saved value visible even when it is not in the loaded list (e.g. account later deactivated).
  const persistedOption = values?.[`${field.name}__selected`] as FormOption | undefined;
  const missingSaved = current && !options.some((option) => optionValue(option, field) === current)
    ? (persistedOption && typeof persistedOption === "object" && optionValue(persistedOption, field) === current ? persistedOption : null)
    : null;
  const allOptions = missingSaved ? [missingSaved, ...options] : options;

  return (
    <select
      className="hdf-control"
      value={current}
      disabled={field.readonly || field.disabled}
      aria-invalid={Boolean(error)}
      aria-busy={loadingOptions}
      onChange={(event) => {
        const selected = allOptions.find((option) => optionValue(option, field) === event.target.value);
        onChange(event.target.value, selected);
      }}
      onBlur={onBlur}
    >
      <option value="">{loadingOptions ? "Loading..." : (field.placeholder || "Select an option")}</option>
      {allOptions.map((option, index) => (
        <option key={`${optionValue(option, field)}-${index}`} value={optionValue(option, field)}>
          {optionLabel(option, field)}
        </option>
      ))}
    </select>
  );
};

export const SearchSelectField = ({ field, value, values, error, onChange, onBlur, loadOptions }: FieldComponentProps) => {
  const [remoteOptions, setRemoteOptions] = useState<FormOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FormOption | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;
  const options = remoteOptions.length ? remoteOptions : (field.options ?? []);
  const hasValue = value !== null && value !== undefined && value !== "";
  // After a remount (sheet switch, draft load) selectedOption is empty and the chosen option may not be
  // in the first page of remote options; fall back to the option persisted with the value.
  const persistedOption = values?.[`${field.name}__selected`] as FormOption | undefined;
  const persistedMatch = persistedOption && typeof persistedOption === "object" && optionValue(persistedOption, field) === String(value ?? "")
    ? persistedOption
    : null;
  const selected = hasValue ? (options.find((option) => optionValue(option, field) === String(value ?? "")) ?? selectedOption ?? persistedMatch) : null;
  const [query, setQuery] = useState(() => selected ? optionLabel(selected, field) : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = `hdf-search-options-${field.name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  useEffect(() => {
    if (selected) setQuery(optionLabel(selected, field));
    else if (value == null || value === "") setQuery("");
  }, [selected, value]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? options.filter((option) => `${optionLabel(option, field)} ${optionSecondaryLabel(option)}`.toLowerCase().includes(normalized))
      : options;
    return matches.slice(0, 12);
  }, [options, query]);

  useEffect(() => setActiveIndex(-1), [query]);

  useEffect(() => {
    if (!loadOptionsRef.current) return;
    let active = true;
    const timer = window.setTimeout(() => {
      const loader = loadOptionsRef.current;
      if (!loader) return;
      setLoadingOptions(true);
      loader(query)
        .then((next) => {
          if (active) setRemoteOptions(next);
        })
        .catch(() => {
          if (active) setRemoteOptions([]);
        })
        .finally(() => {
          if (active) setLoadingOptions(false);
        });
    }, query.trim() ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, field.api, field.name, field.dependsOn ? values[field.dependsOn] : undefined]);

  const choose = (option: FormOption) => {
    setSelectedOption(option);
    setQuery(optionLabel(option, field));
    setOpen(false);
    onChange(optionValue(option, field), option);
    onBlur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? 0 : Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => current < 0 ? Math.max(filteredOptions.length - 1, 0) : Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open && filteredOptions[activeIndex]) {
      event.preventDefault();
      choose(filteredOptions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="hdf-search-select">
      <input
        className="hdf-control"
        type="text"
        role="combobox"
        autoComplete="off"
        value={query}
        placeholder={field.placeholder || "Type to search..."}
        disabled={field.readonly || field.disabled}
        aria-invalid={Boolean(error)}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 && filteredOptions[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setSelectedOption(null);
          if (field.type === "suggestion-insert") onChange(event.target.value);
          else onChange("");
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          blurTimer.current = setTimeout(() => {
            setOpen(false);
            if (field.type === "suggestion-insert") onChange(query);
            else if (selected) setQuery(optionLabel(selected, field));
            onBlur();
          }, 120);
        }}
      />
      {open && (
        <div className="hdf-search-options" id={listId} role="listbox">
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
            <button
              id={`${listId}-${index}`}
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              role="option"
              aria-selected={optionValue(option, field) === String(value ?? "")}
              key={`${optionValue(option, field)}-${index}`}
              onMouseDown={(event) => {
                event.preventDefault();
                if (blurTimer.current) clearTimeout(blurTimer.current);
                choose(option);
              }}
            >
              <span>{optionLabel(option, field)}</span>
              {optionSecondaryLabel(option) && <small>{optionSecondaryLabel(option)}</small>}
            </button>
          )) : <p>{loadingOptions ? "Loading options..." : "No matching option."}</p>}
        </div>
      )}
    </div>
  );
};

const RadioField = ({ field, value, onChange }: FieldComponentProps) => (
  <div className={`hdf-radio-shell is-${field.choiceLayout ?? "vertical"}`}>
    {field.choiceLayout === "scale" && <span className="hdf-scale-label">{field.scaleMinLabel}</span>}
    <div className={`hdf-choice-list ${(field.options ?? []).some(optionImage) ? "hdf-image-choices" : ""}`.trim()}>
    {(field.options ?? []).map((option, index) => {
      const itemValue = optionValue(option);
      const scaleMarker = field.choiceLayout === "scale"
        ? field.scaleMarkers?.find((marker) => String(marker.value) === itemValue)
        : undefined;
      return (
        <label key={`${itemValue}-${index}`} className={`hdf-choice ${optionImage(option) ? "hdf-image-choice" : ""} ${scaleMarker?.image ? "hdf-scale-marker-choice" : ""}`.trim()} aria-label={scaleMarker?.alt || optionLabel(option)}>
          <input
            type="radio"
            name={field.name}
            value={itemValue}
            checked={String(value ?? "") === itemValue}
            disabled={field.readonly || field.disabled}
            onChange={() => onChange(itemValue, option)}
          />
          {optionImage(option) && <img src={optionImage(option)} alt="" />}
          {scaleMarker?.image ? <img className="hdf-scale-marker-image" src={scaleMarker.image} alt={scaleMarker.alt ?? optionLabel(option)} /> : <span>{optionLabel(option)}</span>}
        </label>
      );
    })}
    </div>
    {field.choiceLayout === "scale" && <span className="hdf-scale-label">{field.scaleMaxLabel}</span>}
  </div>
);

const BooleanField = ({ field, value, onChange }: FieldComponentProps) => (
  <label className="hdf-choice hdf-toggle">
    <input
      type="checkbox"
      checked={Boolean(value)}
      disabled={field.readonly || field.disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{field.placeholder || field.label}</span>
  </label>
);

const FileField = ({ field, value, onChange, uploadFile }: FieldComponentProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const current = (Array.isArray(value) ? value : value ? [value] : []).filter((item): item is FormUploadValue => Boolean(item && typeof item === "object" && "upload_token" in item));

  const chooseFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (!uploadFile) {
      setUploadError("File upload is not available in preview mode.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadFile(file, field));
      onChange(field.multiple ? [...current, ...uploaded] : uploaded[0]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (token: string) => {
    const next = current.filter((item) => item.upload_token !== token);
    onChange(field.multiple ? next : null);
  };

  return (
    <div className="hdf-file-upload">
      <input
        className="hdf-control hdf-file"
        type="file"
        accept={Array.isArray(field.accept) ? field.accept.join(",") : field.accept}
        multiple={field.multiple}
        disabled={field.readonly || field.disabled || uploading}
        onChange={chooseFiles}
      />
      {uploading && <small className="hdf-upload-status">Uploading file...</small>}
      {uploadError && <small className="hdf-error">{uploadError}</small>}
      {current.length > 0 && <div className="hdf-upload-list">{current.map((item) => <div key={item.upload_token}><span>{item.name}</span><small>{Math.max(1, Math.ceil(item.size / 1024))} KB</small><button type="button" disabled={field.readonly || field.disabled} onClick={() => remove(item.upload_token)}>Remove</button></div>)}</div>}
    </div>
  );
};

const TextBlock = ({ field }: FieldComponentProps) => {
  if (field.textType === "title") return <h3 className="hdf-text-title">{field.content}</h3>;
  if (field.textType === "subtext") return <p className="hdf-text-subtext">{field.content}</p>;
  return <p className="hdf-text-block">{field.content}</p>;
};

const defaultField = (type: string, label: string): FieldExtension => ({
  type,
  label,
  component: TextField,
  createDefault: () => ({ type, name: `${type}_${Date.now()}`, label }),
});

export const createDynamicFormRegistry = (): DynamicFormRegistry => {
  const fields = new Map<string, FieldExtension>();
  const widgets = new Map<string, WidgetExtension>();

  const registry: DynamicFormRegistry = {
    registerField(extension) {
      fields.set(extension.type, extension);
      return registry;
    },
    registerWidget(extension) {
      widgets.set(extension.type, extension);
      return registry;
    },
    getField: (type) => fields.get(type),
    getWidget: (type) => widgets.get(type),
    listFields: () => Array.from(fields.values()),
    listWidgets: () => Array.from(widgets.values()),
  };

  [
    defaultField("text", "Text"),
    defaultField("number", "Number"),
    { ...defaultField("amount", "Amount"), component: AmountField },
    { ...defaultField("date", "Date"), component: DateField },
    defaultField("time", "Time"),
    { ...defaultField("textarea", "Text area"), component: TextareaField },
    { ...defaultField("select", "Select"), component: SelectField },
    { ...defaultField("search-select", "Search select"), component: SearchSelectField },
    { ...defaultField("async_select", "Async select"), component: SearchSelectField },
    { ...defaultField("api_select", "API select"), component: ApiSelectField },
    { ...defaultField("suggestion-insert", "Suggestion insert"), component: SearchSelectField },
    { ...defaultField("radio", "Radio group"), component: RadioField },
    { ...defaultField("checkbox", "Checkbox"), component: BooleanField },
    { ...defaultField("toggle", "Toggle"), component: BooleanField },
    { ...defaultField("file", "File upload"), component: FileField },
    { ...defaultField("upload_file", "File upload"), component: FileField },
    { ...defaultField("textblock", "Instruction text"), component: TextBlock },
    { ...defaultField("html", "HTML content"), component: TextBlock },
    { ...defaultField("cms", "CMS content"), component: TextBlock },
  ].forEach((extension) => registry.registerField(extension));

  return registry;
};

export const defaultDynamicFormRegistry = createDynamicFormRegistry();
