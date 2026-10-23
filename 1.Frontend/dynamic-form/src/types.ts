import type { ComponentType, ReactNode } from "react";

export type FormValue = unknown;
export type FormValues = Record<string, FormValue>;
export type FormOption = string | number | { label?: string; value?: unknown; id?: unknown; [key: string]: unknown };

export interface FormUploadValue {
  upload_token: string;
  name: string;
  size: number;
  mime_type?: string | null;
  storage_provider?: "bridge" | "local";
  url?: string;
}

export interface DynamicFieldSchema {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  /** Optional DOM id for custom renderers; field name/value remains unchanged. */
  inputId?: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  default?: FormValue;
  value?: FormValue;
  note?: string;
  options?: FormOption[];
  systemVariable?: string;
  accept?: string[] | string;
  multiple?: boolean;
  minnumber?: number | string;
  maxnumber?: number | string;
  columnSpan?: number;
  rowColumns?: 1 | 2 | 3 | 4 | 5 | 6;
  layoutPreset?: "one-column" | "two-column" | "three-column" | "five-column";
  uiCondition?: string;
  className?: string;
  content?: string;
  textType?: "title" | "normal" | "subtext";
  dependsOn?: string;
  rules?: unknown[];
  branching?: Record<string, string>;
  questionNumber?: number | string;
  prompt?: string;
  instruction?: string;
  choiceLayout?: "vertical" | "inline" | "grid" | "scale";
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleMarkers?: DynamicScaleMarkerSchema[];
  [key: string]: unknown;
}

export interface DynamicScaleMarkerSchema {
  value: string | number;
  image: string;
  alt?: string;
}

export interface DynamicSectionSchema {
  title: string;
  description?: string;
  fields: DynamicFieldSchema[];
  repeatable?: boolean;
  defaultOpen?: boolean;
  focusMode?: boolean;
  startQuestionNumber?: number;
  nextSectionId?: string;
  endsFlow?: boolean;
  hideHeading?: boolean;
  hideQuestionNumbers?: boolean;
  [key: string]: unknown;
}

export interface DynamicWidgetSchema {
  type: string;
  id?: string;
  title?: string;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DynamicFormItem {
  id: string;
  type: "field" | "section" | "widget" | "textblock" | string;
  order?: number;
  data: DynamicFieldSchema | DynamicSectionSchema | DynamicWidgetSchema | Record<string, unknown>;
}

export interface DynamicRowGroupSchema {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  maxRows?: number;
  isStructuredInput?: boolean;
  /** Optional full-width field rendered above the rows; its value is stored at values[titleField.name]. */
  titleField?: DynamicFieldSchema;
  structure?: {
    firstColumn?: DynamicFieldSchema & { key?: string };
    secondColumn?: DynamicFieldSchema & { key?: string };
    thirdColumn?: DynamicFieldSchema & { key?: string };
    columns?: Array<DynamicFieldSchema & { key?: string }>;
    [key: string]: unknown;
  };
  columns?: Array<DynamicFieldSchema & { key?: string }>;
  fields?: Array<DynamicFieldSchema & { key?: string }>;
  rowGroup?: Array<Record<string, FormValue>>;
  [key: string]: unknown;
}

export interface DynamicFormBannerSchema {
  src: string;
  alt?: string;
  fit?: "cover" | "contain";
  position?: "top" | "center" | "bottom";
  height?: number;
  mobileHeight?: number;
  mediaId?: number | string;
  source?: "url" | "cms" | "local" | "bridge";
}

export interface DynamicFormBackgroundSchema {
  src?: string;
  color?: string;
  fit?: "cover" | "contain" | "repeat";
  position?: "top" | "center" | "bottom";
  fixed?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  mediaId?: number | string;
  source?: "url" | "cms" | "local" | "bridge";
}

export interface DynamicFormAppearanceSchema {
  banner?: DynamicFormBannerSchema;
  background?: DynamicFormBackgroundSchema;
}

export interface DynamicFormSeoSchema {
  mode?: "automatic" | "manual";
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  allowIndexing?: boolean;
}

export interface FormMediaItem {
  id: number | string;
  name: string;
  url: string;
  mimeType?: string;
}

export interface FormMediaLibraryAdapter {
  listImages: (search?: string) => Promise<FormMediaItem[]>;
  uploadImage?: (file: File) => Promise<FormMediaItem>;
  resolveUrl?: (url: string) => string;
}

export interface DynamicFormSchema {
  id?: string;
  title: string;
  description?: string;
  fields?: DynamicFieldSchema[];
  sections?: DynamicSectionSchema[];
  items?: DynamicFormItem[];
  widgets?: DynamicWidgetSchema[];
  submit?: {
    label?: string;
    showReference?: boolean;
  };
  layout?: Record<string, unknown> & {
    sectionFocus?: boolean;
    hideStepProgress?: boolean;
    hideSectionProgressLabel?: boolean;
    googleFormsStyle?: boolean;
  };
  appearance?: DynamicFormAppearanceSchema;
  seo?: DynamicFormSeoSchema;
  intro?: {
    subtitle?: string;
    body?: string;
    location?: string;
    socialTitle?: string;
    socialLines?: string[];
    requiredNote?: string;
  };
  footerNote?: string;
  [key: string]: unknown;
}

export interface FieldComponentProps {
  field: DynamicFieldSchema;
  value: FormValue;
  values: FormValues;
  error?: string;
  onChange: (value: FormValue, selectedOption?: FormOption) => void;
  setValue?: (name: string, value: FormValue, selectedOption?: FormOption) => void;
  onBlur: () => void;
  uploadFile?: (file: File, field: DynamicFieldSchema) => Promise<FormUploadValue>;
  loadOptions?: (query?: string) => Promise<FormOption[]>;
}

export interface WidgetComponentProps {
  widget: DynamicWidgetSchema;
  values: FormValues;
  setValue: (name: string, value: FormValue) => void;
  context?: Record<string, unknown>;
}

export interface FieldExtension {
  type: string;
  label: string;
  component: ComponentType<FieldComponentProps>;
  createDefault?: () => DynamicFieldSchema;
  validate?: (value: FormValue, field: DynamicFieldSchema, values: FormValues) => string | undefined;
  inspector?: ComponentType<FieldInspectorProps>;
}

export interface WidgetExtension {
  type: string;
  label?: string;
  component: ComponentType<WidgetComponentProps>;
  createDefault?: () => DynamicWidgetSchema;
  inspector?: ComponentType<WidgetInspectorProps>;
}

export interface WidgetInspectorProps {
  widget: DynamicWidgetSchema;
  updateWidget: (patch: Partial<DynamicWidgetSchema>) => void;
}

export interface FieldInspectorProps {
  field: DynamicFieldSchema;
  updateField: (patch: Partial<DynamicFieldSchema>) => void;
}

export interface DynamicFormRegistry {
  registerField: (extension: FieldExtension) => DynamicFormRegistry;
  registerWidget: (extension: WidgetExtension) => DynamicFormRegistry;
  getField: (type: string) => FieldExtension | undefined;
  getWidget: (type: string) => WidgetExtension | undefined;
  listFields: () => FieldExtension[];
  listWidgets: () => WidgetExtension[];
}

export interface DynamicFormProps {
  schema: DynamicFormSchema;
  registry?: DynamicFormRegistry;
  initialValues?: FormValues;
  submitLabel?: string;
  secondaryAction?: ReactNode | ((args: { values: FormValues; schema: DynamicFormSchema; submitting: boolean }) => ReactNode);
  sectionHeaderAction?: (args: { sectionId: string; section: DynamicSectionSchema; values: FormValues }) => ReactNode;
  readOnly?: boolean;
  className?: string;
  header?: ReactNode;
  context?: Record<string, unknown>;
  onChange?: (values: FormValues) => void;
  resolveSystemVariable?: (variable: string) => Promise<FormOption[]>;
  resolveFieldOptions?: (field: DynamicFieldSchema, values: FormValues, query?: string) => Promise<FormOption[]>;
  uploadFile?: (file: File, field: DynamicFieldSchema) => Promise<FormUploadValue>;
  onSubmit: (values: FormValues, schema: DynamicFormSchema) => void | Promise<void>;
}
