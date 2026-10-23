import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/types/formTypes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, Link, Unlink, AlertCircle, Save, X } from 'lucide-react';
import { SYSTEM_VARIABLE_ENTRIES } from '@/utils/systemVariableDefinitions/systemVariableDefinitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface specialfunctionEditorProps {
  function: FormField;
  fields?: FormField[];
  onUpdate: (field: FormField) => void;
  onCancel: () => void;
}

export const FunctionEditor: React.FC<specialfunctionEditorProps> = ({ field, fields = [], onUpdate, onCancel }) => {
  const [localField, setLocalField] = useState<FormField>(field);
  const [filterInput, setFilterInput] = useState(field.filterOptionsBy || '');
  const [filterInputshow, setFilterInputShow] = useState(field.filterOptionsBy || '');

  const [dependsByValue, setDependsByValue] = useState(field.dependsOtherFieldByValue || '');

  const updateField = (updates: Partial<FormField>) => {
    setLocalField(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    // Apply the filter input when saving (prevents focus loss during typing)
    const updatedField = {
      ...localField,
      filterOptionsBy: filterInput.trim() || undefined,
      dependsOtherFieldByValue: dependsByValue.trim() || undefined
    };

    console.log('🔧 [Field Editor] Saving field:', {
      fieldName: updatedField.name,
      fieldType: updatedField.type,
      dependsOn: updatedField.dependsOn,
      filterOptionsBy: updatedField.filterOptionsBy,
      hasChainLink: !!updatedField.dependsOn,
      maxnumber: updatedField.maxnumber,
      minnumber: updatedField.minnumber,
    });

    onUpdate(updatedField);
  };

  const SystemVariableHelper = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7">
          <Info className="w-3 h-3 mr-1" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-auto bg-white border shadow-lg z-50">
        <div className="space-y-2">
          <h4 className="font-medium">Available System Variables:</h4>
          <div className="text-sm space-y-1">
            {SYSTEM_VARIABLE_ENTRIES.map((entry) => (
              <div key={entry.key} className="p-2 hover:bg-gray-50 rounded">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">{entry.key}</code>
                <span className="ml-2 text-muted-foreground">{entry.description}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // Get available fields for dependency selection
  const availableFields = fields.filter(f => f.name !== localField.name && f.name);


  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-medium text-gray-800">Edit Field: {field.label}</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={() => { handleSave() }} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Field Label</Label>
          <Input
            value={localField.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Field label"
            className="bg-white"
          />
        </div>
        <div>
          <Label>Field Name</Label>
          <Input
            value={localField.name}
            onChange={(e) => updateField({ name: e.target.value })}
            placeholder="field_name"
            className="bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Field Type</Label>
          <Select
            value={localField.type}
            onValueChange={(value: FormField['type']) => updateField({ type: value })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="radio">Radio</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="file">File</SelectItem>
              <SelectItem value="toggle">Toggle</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="suggestion-insert">Suggestion Insert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Column Span</Label>
          <Select
            value={String(localField.columnSpan || 1)}
            onValueChange={(value) => updateField({ columnSpan: Number(value) as 1 | 2 | 3 })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={localField.required || false}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
          <Label>Required</Label>
        </div>
      </div>

      {/* Chain Link Configuration Section */}
      {(localField.type === 'select' || localField.type === 'suggestion-insert') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Link className="w-4 h-4 text-blue-600" />
              Chain Link Configuration
            </CardTitle>
            <p className="text-xs text-blue-600">
              Make this field's options depend on another field's value for dynamic filtering
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <Link className="w-4 h-4" />
                Parent Field (Depends On)
              </Label>
              <Select
                value={localField.dependsOn ?? "none"}
                onValueChange={(value) => {
                  const dependsOn = value === "none" ? undefined : value;
                  updateField({
                    dependsOn,
                    // Clear filterOptionsBy if removing dependency
                    filterOptionsBy: dependsOn ? localField.filterOptionsBy : undefined
                  });
                  if (!dependsOn) {
                    setFilterInput('');
                    setDependsByValue('');
                  }

                  console.log('🔗 [Chain Link] Parent field changed:', {
                    childField: localField.name,
                    parentField: dependsOn,
                    action: dependsOn ? 'linked' : 'unlinked'
                  });
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a parent field" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Unlink className="w-4 h-4" />
                      No Dependency
                    </div>
                  </SelectItem>
                  {availableFields.length > 0 ? (
                    availableFields.map(f => (
                      <SelectItem key={f.name} value={f.name}>
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          {f.label} ({f.name})
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no_fields" disabled>
                      No fields available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {localField.dependsOn && (
                <p className="text-xs text-blue-600 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  This field will be filtered based on "{localField.dependsOn}" field's selected value
                </p>
              )}
            </div>

            {localField.dependsOn && (
              <div>
                <Label className="text-sm">Filter Property Path</Label>
                <Input
                  value={filterInputshow}
                  onBlur={(e) => {
                    // Only update local state during typing to prevent focus loss
                    setFilterInput(e.target.value);
                  }}
                  onChange={(e) => { setFilterInputShow(e.target.value) }}
                  placeholder="e.g., category.name or plant_description"
                  className="bg-white"
                />
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <p>• For simple matching: use property name like "category"</p>
                  <p>• For nested objects: use dot notation like "plant.description"</p>
                  <p>• Leave empty for basic string includes matching</p>
                  <p className="text-blue-600 font-medium">• Changes will be applied when you click Save</p>
                </div>
              </div>
            )}

            {localField.dependsOn && (
              <div>
                <Label className="text-sm">Compare To (dependsByValue)</Label>
                <Input
                  value={dependsByValue}
                  onChange={(e) => setDependsByValue(e.target.value)}
                  placeholder="e.g., filter, rm_type"
                  className="bg-white"
                />
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <p>• This defines which property in this field’s options will be compared</p>
                  <p>• Usually same as parent filter (like 'filter'), but can differ</p>
                  <p>• Leave empty to use default matching by value</p>
                </div>
              </div>
            )}


            {localField.dependsOn && (
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">How Chain Link Works:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>1. User selects value in "{localField.dependsOn}" field</p>
                  <p>2. This field's options get filtered automatically</p>
                  <p>3. Only matching options will be shown to the user</p>
                  <p>4. Filtering uses the property path you specify above</p>
                  <p>5. Console logs will show the filtering process for debugging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(localField.type === 'select' || localField.type === 'suggestion-insert') && (
        <div>
          <Label>Options (one per line)</Label>
          <Textarea
            value={localField.options?.join('\n') || ''}
            onChange={(e) => updateField({ options: e.target.value.split('\n').filter(Boolean) })}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="min-h-[100px] bg-white"
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>• Enter each option on a new line</p>
            <p>• For JSON objects, enter valid JSON on each line</p>
            <p>• System variables like ${'{factoryplants}'} will be resolved automatically</p>
            {localField.dependsOn && (
              <p className="text-blue-600">• These options will be filtered based on the chain link configuration above</p>
            )}
          </div>
        </div>
      )}

      {(localField.type === 'number') && (

        <>
          <div>
            <Label>Max Number</Label>
            <Input
              value={localField.maxnumber || ''}
              onChange={(e) => updateField({ maxnumber: e.target.value })}
              placeholder="Placeholder text"
              className="bg-white"
            />
          </div>

          <div>
            <Label>Min Number</Label>
            <Input
              value={localField.minnumber || ''}
              onChange={(e) => updateField({ minnumber: e.target.value })}
              placeholder="Placeholder text"
              className="bg-white"
            />
          </div>

          <div>
            <Label>Rounding</Label>
            <Input
              value={localField.rounding || ''}
              onChange={(e) => updateField({ rounding: e.target.value })}
              placeholder="Placeholder text"
              className="bg-white"
            />
          </div>

          <div >
            <Label>
              Is this Week Opcal ?
            </Label>
            <Switch
              checked={localField.weekopcal || false}
              onCheckedChange={(checked) => updateField({ weekopcal: checked })}
            />
          </div>

        </>

      )}
      

      

      <div>
        <Label>Placeholder</Label>
        <Input
          value={localField.placeholder || ''}
          onChange={(e) => updateField({ placeholder: e.target.value })}
          placeholder="Placeholder text"
          className="bg-white"
        />
      </div>

      <div>
        <Label>Default Value</Label>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SystemVariableHelper />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use system variables like ${'{user}'} for dynamic defaults
          </p>
        </div>
        <Input
          value={localField.default || ''}
          onChange={(e) => updateField({ default: e.target.value })}
          placeholder="Default value"
          className="bg-white"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={localField.readonly || false}
          onCheckedChange={(checked) => updateField({ readonly: checked })}
        />
        <Label>Read Only</Label>
      </div>
    </div>
  );
};
