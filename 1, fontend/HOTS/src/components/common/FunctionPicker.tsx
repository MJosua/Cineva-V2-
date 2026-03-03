import React, { useState, useEffect } from 'react';
import { useTriggerFunctionList, useTriggerFunctionDetails } from '../../hooks/useTriggerFunction';
import './FunctionPicker.css';

interface FunctionPickerProps {
    value?: string;
    onChange: (functionKey: string, functionDetails?: any) => void;
    filterCategory?: string;
    filterType?: 'sql' | 'handler' | 'template';
    showParams?: boolean;
    label?: string;
    placeholder?: string;
}

/**
 * Dropdown picker for selecting trigger functions
 * Use in workflow config, widget config, etc.
 */
const FunctionPicker: React.FC<FunctionPickerProps> = ({
    value,
    onChange,
    filterCategory,
    filterType,
    showParams = false,
    label = 'Function',
    placeholder = 'Select a function...'
}) => {
    const { functions, categories, loading } = useTriggerFunctionList({
        category: filterCategory,
        type: filterType
    });
    const { func: selectedFunc } = useTriggerFunctionDetails(value || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredFunctions = functions.filter(f =>
        f.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.function_key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by category
    const grouped = filteredFunctions.reduce((acc, f) => {
        if (!acc[f.category]) acc[f.category] = [];
        acc[f.category].push(f);
        return acc;
    }, {} as Record<string, typeof functions>);

    return (
        <div className="function-picker">
            {label && <label className="fp-label">{label}</label>}

            <div className="fp-dropdown-wrapper">
                <div
                    className={`fp-selected ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {value && selectedFunc ? (
                        <div className="fp-selected-content">
                            <span className="fp-icon">
                                {selectedFunc.function_type === 'sql' ? '📊' : '⚡'}
                            </span>
                            <span className="fp-name">{selectedFunc.function_name}</span>
                            <code className="fp-key">{selectedFunc.function_key}</code>
                        </div>
                    ) : (
                        <span className="fp-placeholder">{placeholder}</span>
                    )}
                    <span className="fp-arrow">▼</span>
                </div>

                {isOpen && (
                    <div className="fp-dropdown">
                        <input
                            type="text"
                            className="fp-search"
                            placeholder="Search functions..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />

                        <div className="fp-options">
                            {loading ? (
                                <div className="fp-loading">Loading...</div>
                            ) : Object.keys(grouped).length === 0 ? (
                                <div className="fp-empty">No functions found</div>
                            ) : (
                                Object.entries(grouped).map(([category, funcs]) => (
                                    <div key={category} className="fp-category-group">
                                        <div className="fp-category-header">{category}</div>
                                        {funcs.map(f => (
                                            <div
                                                key={f.function_key}
                                                className={`fp-option ${value === f.function_key ? 'selected' : ''}`}
                                                onClick={() => {
                                                    onChange(f.function_key, f);
                                                    setIsOpen(false);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                <span className="fp-icon">
                                                    {f.function_type === 'sql' ? '📊' : '⚡'}
                                                </span>
                                                <div className="fp-option-content">
                                                    <div className="fp-option-name">{f.function_name}</div>
                                                    <div className="fp-option-key">{f.function_key}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Show parameter info if enabled */}
            {showParams && selectedFunc?.sql_params && (
                <div className="fp-params-info">
                    <span className="fp-params-label">Parameters:</span>
                    <code>
                        {Array.isArray(selectedFunc.sql_params)
                            ? selectedFunc.sql_params.map(p =>
                                typeof p === 'string' ? p : p.name
                            ).join(', ')
                            : JSON.stringify(selectedFunc.sql_params)
                        }
                    </code>
                </div>
            )}
        </div>
    );
};

export default FunctionPicker;
