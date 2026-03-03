export interface FormConfig {
  id?: string;
  title: string;
  description?: string;
  category?: string; // Make category optional
  items?: FormItem[]; // Unified array for fields, sections, and rowgroups
  // Legacy support - these will be deprecated
  fields?: FormField[];
  rowGroups?: RowGroup[];
  sections?: FormSection[];
  submit?: {
    label: string;
  };
  url?: string;
  servis_aktif?: number;
  approvalFlowId?: string;
  approval?: {
    steps: string[];
    mode?: 'sequential' | 'parallel';
  };
  apiEndpoint?: string;
  active?: number;
}

export interface FormItem {
  id: string;
  type: 'field' | 'section' | 'rowgroup';
  order: number;
  data: FormField | FormSection | RowGroup;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
  repeatable?: boolean;
  defaultOpen?: boolean; // Add this property
  summary?: {
    label: string;
    type?: string;
    calculated?: boolean;
  } | string;
  addButton?: {
    label: string;
  } | string;
}

export interface FormField {
  label: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'toggle' | 'number' | 'suggestion-insert' | 'html' | 'cms';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  suggestions?: string[]; // Add this line
  readonly?: boolean;
  value?: string;
  accept?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  default?: string;
  note?: string;
  uiCondition?: string;
  columnSpan?: 1 | 2 | 3;
  systemVariable?: string;
  dependsOn?: string; // field name this field depends on
  filterOptionsBy?: string; // key or expression to filter options based on dependsOn field's value

  // CMS & HTML specific
  html?: string;
  className?: string;
  cms_page_id?: number;
  cms_content?: any[];
}

export interface RowData {
  id: string;
  firstValue: string;
  secondValue: string;
  thirdValue: string;
}

export interface RowGroup {
  rowGroup?: RowData[];
  title?: string;
  maxRows?: number;
  isStructuredInput?: boolean;
  structure?: {
    firstColumn: {
      label: string;
      placeholder: string;
      name?: string;
      type?: 'text' | 'number' | 'select' | 'suggestion-insert';
      options?: string[];
    };
    secondColumn: {
      label: string;
      placeholder: string;
      name?: string;
      type?: 'text' | 'number' | 'select';
      options?: string[];
    };
    thirdColumn: {
      label: string;
      placeholder: string;
      name?: string;
      type?: 'text' | 'number' | 'select';
      options?: string[];
    };
    combinedMapping?: 'first_second' | 'second_third' | 'none';
  };
}

// Legacy type - kept for backward compatibility
export interface FormStructureItem {
  id: string;
  type: 'field' | 'section' | 'rowgroup';
  order: number;
  data: FormField | FormSection | RowGroup;
}
