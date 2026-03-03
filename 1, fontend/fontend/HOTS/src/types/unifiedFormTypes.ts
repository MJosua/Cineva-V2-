// Unified form element types
export type FormElementType = 'field' | 'section' | 'rowgroup';

export interface UnifiedFormElement {
  id: string;
  type: FormElementType;
  name: string;
  label?: string;
  properties: {
    // Common properties
    visible?: boolean;
    required?: boolean;
    width?: string | number;
    alignment?: 'left' | 'center' | 'right';
    
    // Field-specific
    fieldType?: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'toggle' | 'number' | 'suggestion-insert';
    placeholder?: string;
    options?: string[];
    suggestions?: string[];
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
    dependsOn?: string;
    filterOptionsBy?: string;
    
    // Section-specific
    description?: string;
    repeatable?: boolean;
    defaultOpen?: boolean;
    summary?: {
      label: string;
      type?: string;
      calculated?: boolean;
    } | string;
    addButton?: {
      label: string;
    } | string;
    
    // RowGroup-specific
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
    
    // Row data for non-structured rowgroups
    rowData?: Array<{
      id: string;
      [key: string]: any;
    }>;
  };
  
  // For nested elements (sections can contain other elements)
  children?: UnifiedFormElement[];
  
  // Metadata
  order: number;
  parentId?: string;
  depth: number;
}

export interface UnifiedFormConfig {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  elements: UnifiedFormElement[];
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
