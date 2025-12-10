
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { DynamicField } from './DynamicField';
import { FormField } from '@/types/formTypes';

interface RowGroupFieldProps {
  rowGroup: FormField[];
  form: UseFormReturn<any>;
  onValueChange?: (fieldKey: string, value: any) => void;
  groupIndex: number;
}

export const RowGroupField: React.FC<RowGroupFieldProps> = ({ 
  rowGroup, 
  form, 
  onValueChange,
  groupIndex 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {rowGroup.map((field, fieldIndex) => {
        const fieldKey = `${field.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${groupIndex}_${fieldIndex}`;
        
        return (
          <DynamicField
            key={fieldKey}
            field={field}
            value={form.watch(fieldKey)}
            onChange={(value) => {
              form.setValue(fieldKey, value);
              onValueChange?.(fieldKey, value);
            }}
          />
        );
      })}
    </div>
  );
};
