
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { DynamicField } from './DynamicField';
import { FormSection, FormField } from '@/types/formTypes';

interface RepeatingSectionProps {
  section: FormSection;
  form: UseFormReturn<any>;
}

export const RepeatingSection: React.FC<RepeatingSectionProps> = ({ section, form }) => {
  const [items, setItems] = useState([{ id: Date.now() }]);

  const addItem = () => {
    setItems([...items, { id: Date.now() }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
      // Clean up form values for removed item
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        const sectionFields = section.fields || [];
        sectionFields.forEach(field => {
          const fieldKey = `${section.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${itemIndex}_${field.name}`;
          form.unregister(fieldKey);
        });
      }
    }
  };

  const calculateTotal = () => {
    // Only calculate if summary is an object with calculated property
    if (typeof section.summary !== 'object' || !section.summary?.calculated) return null;
    
    const total = items.reduce((sum, item, index) => {
      const quantityKey = `${section.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}_quantity`;
      const quantity = form.watch(quantityKey) || 0;
      return sum + (parseInt(quantity.toString()) || 0);
    }, 0);

    return total;
  };

  const getColSpanClass = (columnSpan: number) => {
    switch (columnSpan) {
      case 1:
        return 'col-span-1';
      case 2:
        return 'col-span-1 md:col-span-2';
      case 3:
        return 'col-span-1 md:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  // Use fields from section, fallback to empty array if not provided
  const sectionFields = section.fields || [];

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.id} className="relative">
          <CardContent className="pt-6">
            {items.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sectionFields.map((field, fieldIndex) => {
                const fieldKey = `${section.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}_${field.name}`;
                
                return (
                  <div key={`${fieldKey}-${fieldIndex}`} className={getColSpanClass(field.columnSpan || 1)}>
                    <DynamicField
                      field={field}
                      value={form.watch(fieldKey)}
                      onChange={(value) => {
                        form.setValue(fieldKey, value);
                        // Handle value changes if needed for calculations
                        // console.log(`Field ${fieldKey} changed to:`, value);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {typeof section.addButton === 'string' ? section.addButton : section.addButton?.label || 'Add Item'}
        </Button>

        {typeof section.summary === 'object' && section.summary?.calculated && (
          <div className="text-right">
            <span className="text-sm text-muted-foreground">
              {typeof section.summary === 'object' ? section.summary.label : section.summary}: 
            </span>
            <span className="font-semibold">{calculateTotal()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
