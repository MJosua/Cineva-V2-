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
  type: 'field' | 'section' | 'rowgroup' | 'specialfunc' | 'textblock';
  order: number;
  data: FormField | FormSection | RowGroup | SpecialElement | TextBlock;
}

export interface TextBlock {
  title?: string; // Optional title for builder label
  textType: 'title' | 'normal' | 'subtext';
  content: string;
  className?: string;
  uiCondition?: string;
}

// Special Elements for CMS content, headers, tables, diagrams, etc.
export interface SpecialElement {
  title: string;
  element_type: 'cms_content' | 'cms_header' | 'special_table' | 'diagram' | 'html_block';
  cms_page_id?: number | null;
  cms_section?: string | null;
  table_type?: string | null;
  html_content?: string;
  diagram_data?: any;
  uiCondition?: string; // visibility condition
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
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'toggle' | 'number' | 'suggestion-insert' | 'html' | 'cms' | 'textblock' | 'qrcodedesign';
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
  dependerOf?: string[]; // fields that depend on this field

  // Field rules (dependsBy/when/then format)
  rules?: any[];

  // CMS & HTML specific
  html?: string;
  className?: string;
  cms_page_id?: number;
  cms_content?: any[];

  // Auto-save ID from selected object (for select fields with master data)
  autoSaveId?: {
    enabled: boolean;
    idProperty: string;       // e.g., "samplecat_id" - which property from selectedObject to extract
    suffix?: string;          // e.g., "_id" (default) - suffix for the auto-generated field name
  };

  // Other field comparison
  dependsOtherFieldByValue?: string;
  maxnumber?: number | string;
  minnumber?: number | string;
  rounding?: number | string;
  weekopcal?: boolean;

  // Text block properties
  textType?: 'title' | 'normal' | 'subtext';
  content?: string;
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
    maxnumber?: number;
    minnumber?: number;
    rounding?: number | string;
    readonly?: boolean;
    required?: boolean;
  };
}

// Legacy type - kept for backward compatibility
export interface FormStructureItem {
  id: string;
  type: 'field' | 'section' | 'rowgroup' | 'specialfunc' | 'textblock';
  order: number;
  data: FormField | FormSection | RowGroup | SpecialElement | TextBlock;
}
