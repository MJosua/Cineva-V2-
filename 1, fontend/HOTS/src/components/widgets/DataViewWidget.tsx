import React, { useState, useCallback } from 'react';
import { useTriggerFunction, useTriggerFunctionDetails } from '../../hooks/useTriggerFunction';
import FunctionPicker from '../common/FunctionPicker';
import './DataViewWidget.css';

interface DataViewWidgetProps {
    /** Pre-configured function key - if not provided, shows picker */
    functionKey?: string;
    /** Initial parameters for the function */
    initialParams?: Record<string, any>;
    /** Title for the widget */
    title?: string;
    /** Whether to auto-execute on mount */
    autoExecute?: boolean;
    /** Enable inline editing (for UPDATE functions) */
    editable?: boolean;
    /** Custom column config */
    columns?: ColumnConfig[];
    /** Maximum rows to show */
    maxRows?: number;
}

interface ColumnConfig {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'boolean' | 'json';
    editable?: boolean;
    width?: string;
}

/**
 * Widget for displaying data from trigger functions as a table
 * Can be used in dashboards, CMS pages, or admin panels
 */
const DataViewWidget: React.FC<DataViewWidgetProps> = ({
    functionKey: initialFunctionKey,
    initialParams = {},
    title,
    autoExecute = true,
    editable = false,
    columns,
    maxRows = 100
}) => {
    const [selectedFunction, setSelectedFunction] = useState(initialFunctionKey || '');
    const [params, setParams] = useState<Record<string, any>>(initialParams);
    const [showParamForm, setShowParamForm] = useState(false);

    const { func: funcDetails, loading: detailsLoading } = useTriggerFunctionDetails(selectedFunction);
    const { data, loading, error, execute, rowCount } = useTriggerFunction<any[]>(
        selectedFunction,
        { autoExecute: autoExecute && !!selectedFunction, params }
    );

    // Parse param definitions
    const getParamNames = useCallback(() => {
        if (!funcDetails?.sql_params) return [];
        const sqlParams = funcDetails.sql_params;
        return (Array.isArray(sqlParams) ? sqlParams : []).map(p =>
            typeof p === 'string' ? p.replace(/^:/, '') : p.name
        );
    }, [funcDetails]);

    // Auto-detect columns from data if not configured
    const getColumns = useCallback((): ColumnConfig[] => {
        if (columns && columns.length > 0) return columns;
        if (!data || data.length === 0) return [];

        const firstRow = data[0];
        return Object.keys(firstRow).map(key => ({
            key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: typeof firstRow[key] === 'number' ? 'number' : 'text'
        }));
    }, [data, columns]);

    const handleExecute = () => {
        execute(params);
        setShowParamForm(false);
    };

    const formatValue = (value: any, type?: string) => {
        if (value === null || value === undefined) return <span className="dvw-null">null</span>;
        if (type === 'date' && value) return new Date(value).toLocaleString();
        if (type === 'boolean') return value ? '✓' : '✗';
        if (type === 'json' || typeof value === 'object') {
            return <code>{JSON.stringify(value, null, 2)}</code>;
        }
        return String(value);
    };

    return (
        <div className="data-view-widget">
            {/* Header */}
            <div className="dvw-header">
                <div className="dvw-title-row">
                    {title && <h3 className="dvw-title">{title}</h3>}
                    {!initialFunctionKey && (
                        <FunctionPicker
                            value={selectedFunction}
                            onChange={setSelectedFunction}
                            filterType="sql"
                            label=""
                            placeholder="Select data function..."
                        />
                    )}
                </div>

                <div className="dvw-actions">
                    {selectedFunction && (
                        <>
                            <button
                                className="dvw-btn dvw-btn-secondary"
                                onClick={() => setShowParamForm(!showParamForm)}
                            >
                                ⚙️ Params {Object.keys(params).length > 0 && `(${Object.keys(params).length})`}
                            </button>
                            <button
                                className="dvw-btn dvw-btn-primary"
                                onClick={handleExecute}
                                disabled={loading}
                            >
                                {loading ? '⏳ Loading...' : '▶ Execute'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Parameter Form */}
            {showParamForm && selectedFunction && (
                <div className="dvw-params-form">
                    <h4>Parameters</h4>
                    {getParamNames().map(paramName => (
                        <div key={paramName} className="dvw-param-row">
                            <label>{paramName}</label>
                            <input
                                type="text"
                                value={params[paramName] || ''}
                                onChange={e => setParams(prev => ({ ...prev, [paramName]: e.target.value }))}
                                placeholder={`Enter ${paramName}`}
                            />
                        </div>
                    ))}
                    <button className="dvw-btn dvw-btn-primary" onClick={handleExecute}>
                        Apply & Execute
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="dvw-error">
                    ❌ {error}
                </div>
            )}

            {/* Content */}
            {!selectedFunction ? (
                <div className="dvw-empty">
                    <p>Select a function to load data</p>
                </div>
            ) : loading ? (
                <div className="dvw-loading">
                    <div className="dvw-spinner"></div>
                    Loading data...
                </div>
            ) : data && data.length > 0 ? (
                <>
                    <div className="dvw-table-wrapper">
                        <table className="dvw-table">
                            <thead>
                                <tr>
                                    {getColumns().map(col => (
                                        <th key={col.key} style={col.width ? { width: col.width } : {}}>
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, maxRows).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {getColumns().map(col => (
                                            <td key={col.key} className={`dvw-cell dvw-cell-${col.type || 'text'}`}>
                                                {formatValue(row[col.key], col.type)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="dvw-footer">
                        Showing {Math.min(data.length, maxRows)} of {rowCount || data.length} rows
                    </div>
                </>
            ) : data && data.length === 0 ? (
                <div className="dvw-empty">
                    <p>No data returned</p>
                </div>
            ) : null}
        </div>
    );
};

export default DataViewWidget;
