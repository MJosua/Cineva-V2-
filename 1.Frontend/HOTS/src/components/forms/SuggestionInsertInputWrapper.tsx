
import React from 'react';
import { SuggestionInsertInput } from './SuggestionInsertInput';

interface SuggestionInsertInputWrapperProps {
  suggestions: string[];
  placeholder?: string;
  onAdd: (value: string) => void;
  defaultValue?: string;
}

export const SuggestionInsertInputWrapper: React.FC<SuggestionInsertInputWrapperProps> = ({
  suggestions,
  placeholder,
  onAdd,
  defaultValue,
}) => {
  const handleAdd = (value: string) => {
    if (value.trim() !== '') {
      onAdd(value.trim());
    }
  };

  return (
    <SuggestionInsertInput
      suggestions={suggestions}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={() => {}}
      onEnter={handleAdd}
    />
  );
};
