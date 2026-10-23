import React, { useState, useEffect, useCallback } from 'react';
import { validateSqlQuery, ALLOWED_STATEMENTS, BLOCKED_KEYWORDS, ValidationResult } from '../../utils/sqlSafetyValidator';
import { API_URL } from '../../config/sourceConfig';
import './TriggerFunctionManager.css';

interface TriggerFunction {
    function_id: number;
    function_key: string;
    function_name: string;
    function_type: 'sql' | 'handler' | 'template';
    category: string;
    description?: string;
    sql_query?: string;
    sql_params?: string[] | { name: string; type: string; default?: any }[];
    handler_path?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Category {
    category: string;
    count: number;
}

const API_BASE = `${API_URL}/hots_settings`;

const TriggerFunctionManager: React.FC = () => {
    // State
    const [functions, setFunctions] = useState<TriggerFunction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedFunction, setSelectedFunction] = useState<TriggerFunction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Editor state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        function_key: '',
        function_name: '',
        function_type: 'sql' as 'sql' | 'handler' | 'template',
        category: 'general',
        description: '',
        sql_query: '',
        sql_params: '[]'
    });
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    // Test execution state
    const [testParams, setTestParams] = useState<Record<string, any>>({});
    const [testResult, setTestResult] = useState<any>(null);
    const [testLoading, setTestLoading] = useState(false);

    // User role check (from localStorage or context)
    const isAdmin = (() => {
        try {
            const token = localStorage.getItem('hots_tokek');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                // HOTS uses role_id 4 for admin
                return payload.role_id === 4 || payload.role_id === '4';
            }
        } catch { }
        return false;
    })();

    // Fetch functions
    const fetchFunctions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);
            if (!showInactive) params.append('is_active', 'true');

            const url = `${API_BASE}/trigger-functions?${params}`;
            const token = localStorage.getItem('hots_tokek');
            console.log('🔍 [TFM] Fetching functions from:', url);
            console.log('🔍 [TFM] Token present:', !!token);
            console.log('🔍 [TFM] Token preview:', token?.substring(0, 50) + '...');

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('🔍 [TFM] Response status:', response.status);
            const data = await response.json();
            console.log('🔍 [TFM] Response data:', data);

            if (data.success) {
                setFunctions(data.data);
            } else {
                setError(data.message || 'Unknown error');
            }
        } catch (err) {
            console.error('❌ [TFM] Fetch error:', err);
            setError('Failed to fetch functions: ' + (err as Error).message);
        }
        setLoading(false);
    }, [searchTerm, selectedCategory, showInactive]);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/trigger-functions/categories`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hots_tokek')}` }
            });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    useEffect(() => {
        fetchFunctions();
        fetchCategories();
    }, [fetchFunctions]);

    // Select function to view
    const handleSelectFunction = async (func: TriggerFunction) => {
        try {
            const response = await fetch(`${API_BASE}/trigger-functions/${func.function_key}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hots_tokek')}` }
            });
            const data = await response.json();
            if (data.success) {
                setSelectedFunction(data.data);
                setTestResult(null);
                setTestParams({});

                // Parse params for test form
                if (data.data.sql_params) {
                    const params = typeof data.data.sql_params === 'string'
                        ? JSON.parse(data.data.sql_params)
                        : data.data.sql_params;
                    const initialParams: Record<string, any> = {};
                    params.forEach((p: any) => {
                        const key = typeof p === 'string' ? p.replace(/^:/, '') : p.name;
                        initialParams[key] = '';
                    });
                    setTestParams(initialParams);
                }
            }
        } catch (err) {
            setError('Failed to load function details');
        }
    };

    // Validate SQL on change
    const handleSqlChange = (sql: string) => {
        setEditForm(prev => ({ ...prev, sql_query: sql }));
        const result = validateSqlQuery(sql);
        setValidation(result);
    };

    // Create/Edit function
    const startCreating = () => {
        setIsEditing(true);
        setSelectedFunction(null);
        setEditForm({
            function_key: '',
            function_name: '',
            function_type: 'sql',
            category: 'general',
            description: '',
            sql_query: '',
            sql_params: '[]'
        });
        setValidation(null);
    };

    const startEditing = () => {
        if (!selectedFunction) return;
        setIsEditing(true);
        setEditForm({
            function_key: selectedFunction.function_key,
            function_name: selectedFunction.function_name,
            function_type: selectedFunction.function_type,
            category: selectedFunction.category,
            description: selectedFunction.description || '',
            sql_query: selectedFunction.sql_query || '',
            sql_params: JSON.stringify(selectedFunction.sql_params || [], null, 2)
        });
        if (selectedFunction.sql_query) {
            setValidation(validateSqlQuery(selectedFunction.sql_query));
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({ function_key: '', function_name: '', function_type: 'sql', category: 'general', description: '', sql_query: '', sql_params: '[]' });
        setValidation(null);
    };

    const saveFunction = async () => {
        // Validate before save
        if (editForm.function_type === 'sql' && editForm.sql_query) {
            const result = validateSqlQuery(editForm.sql_query);
            if (!result.valid) {
                setError('SQL validation failed: ' + result.errors.join('; '));
                return;
            }
        }

        try {
            let sqlParams;
            try {
                sqlParams = JSON.parse(editForm.sql_params);
            } catch {
                setError('Invalid JSON in sql_params');
                return;
            }

            const body = {
                ...editForm,
                sql_params: sqlParams
            };

            const isNew = !selectedFunction;
            const url = isNew
                ? `${API_BASE}/trigger-functions`
                : `${API_BASE}/trigger-functions/${selectedFunction.function_key}`;

            const response = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('hots_tokek')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success) {
                setIsEditing(false);
                fetchFunctions();
                if (isNew) {
                    setSelectedFunction(null);
                } else {
                    handleSelectFunction(selectedFunction);
                }
            } else {
                setError(data.message + (data.errors ? ': ' + data.errors.join(', ') : ''));
            }
        } catch (err) {
            setError('Failed to save function');
        }
    };

    // Execute function
    const executeFunction = async () => {
        if (!selectedFunction) return;
        setTestLoading(true);
        setTestResult(null);

        try {
            const response = await fetch(`${API_BASE}/trigger-functions/${selectedFunction.function_key}/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('hots_tokek')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ params: testParams })
            });

            const data = await response.json();
            setTestResult(data);
        } catch (err) {
            setTestResult({ success: false, message: 'Execution failed: ' + (err as Error).message });
        }
        setTestLoading(false);
    };

    // Delete function
    const deleteFunction = async () => {
        if (!selectedFunction || !confirm('Are you sure you want to deactivate this function?')) return;

        try {
            const response = await fetch(`${API_BASE}/trigger-functions/${selectedFunction.function_key}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hots_tokek')}` }
            });

            const data = await response.json();
            if (data.success) {
                setSelectedFunction(null);
                fetchFunctions();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete function');
        }
    };

    return (
        <div className="trigger-function-manager">
            {/* Header */}
            <div className="tfm-header">
                <h1>🔧 API Function Builder</h1>
                <p className="tfm-subtitle">Create and manage SQL-based API functions</p>
                {!isAdmin && (
                    <div className="tfm-warning">
                        ⚠️ Read-only mode - Admin access required to create/edit functions
                    </div>
                )}
            </div>

            {error && (
                <div className="tfm-error" onClick={() => setError(null)}>
                    ❌ {error}
                </div>
            )}

            <div className="tfm-content">
                {/* Left Panel - Function List */}
                <div className="tfm-list-panel">
                    <div className="tfm-filters">
                        <input
                            type="text"
                            placeholder="Search functions..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="tfm-search"
                        />
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="tfm-category-select"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c.category} value={c.category}>
                                    {c.category} ({c.count})
                                </option>
                            ))}
                        </select>
                        <label className="tfm-checkbox">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={e => setShowInactive(e.target.checked)}
                            />
                            Show inactive
                        </label>
                    </div>

                    {isAdmin && (
                        <button className="tfm-btn tfm-btn-primary tfm-btn-create" onClick={startCreating}>
                            + New Function
                        </button>
                    )}

                    <div className="tfm-function-list">
                        {loading ? (
                            <div className="tfm-loading">Loading...</div>
                        ) : (
                            functions.map(func => (
                                <div
                                    key={func.function_key}
                                    className={`tfm-function-item ${selectedFunction?.function_key === func.function_key ? 'selected' : ''} ${!func.is_active ? 'inactive' : ''}`}
                                    onClick={() => handleSelectFunction(func)}
                                >
                                    <div className="tfm-func-icon">
                                        {func.function_type === 'sql' ? '📊' : func.function_type === 'handler' ? '⚡' : '📄'}
                                    </div>
                                    <div className="tfm-func-info">
                                        <div className="tfm-func-name">{func.function_name}</div>
                                        <div className="tfm-func-key">{func.function_key}</div>
                                    </div>
                                    <span className={`tfm-category-badge tfm-cat-${func.category}`}>
                                        {func.category}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel - Details/Editor */}
                <div className="tfm-detail-panel">
                    {isEditing ? (
                        /* Edit Form */
                        <div className="tfm-editor">
                            <h2>{selectedFunction ? 'Edit Function' : 'New Function'}</h2>

                            <div className="tfm-form-row">
                                <label>Function Key</label>
                                <input
                                    type="text"
                                    value={editForm.function_key}
                                    onChange={e => setEditForm(prev => ({ ...prev, function_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                    placeholder="my_custom_query"
                                    disabled={!!selectedFunction}
                                    pattern="[a-z][a-z0-9_]*"
                                />
                                <small>Lowercase letters, numbers, underscores. Cannot be changed after creation.</small>
                            </div>

                            <div className="tfm-form-row">
                                <label>Function Name</label>
                                <input
                                    type="text"
                                    value={editForm.function_name}
                                    onChange={e => setEditForm(prev => ({ ...prev, function_name: e.target.value }))}
                                    placeholder="My Custom Query"
                                />
                            </div>

                            <div className="tfm-form-row tfm-form-row-half">
                                <div>
                                    <label>Type</label>
                                    <select
                                        value={editForm.function_type}
                                        onChange={e => setEditForm(prev => ({ ...prev, function_type: e.target.value as any }))}
                                    >
                                        <option value="sql">SQL Query</option>
                                        <option value="handler">JavaScript Handler</option>
                                        <option value="template">Template</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={editForm.category}
                                        onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        placeholder="general"
                                        list="category-list"
                                    />
                                    <datalist id="category-list">
                                        {categories.map(c => <option key={c.category} value={c.category} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="tfm-form-row">
                                <label>Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What does this function do?"
                                    rows={2}
                                />
                            </div>

                            {editForm.function_type === 'sql' && (
                                <>
                                    <div className="tfm-form-row">
                                        <label>SQL Query</label>
                                        <div className="tfm-sql-editor-wrapper">
                                            <textarea
                                                className={`tfm-sql-editor ${validation && !validation.valid ? 'invalid' : ''}`}
                                                value={editForm.sql_query}
                                                onChange={e => handleSqlChange(e.target.value)}
                                                placeholder="SELECT * FROM t_ticket WHERE ticket_id = ?"
                                                rows={8}
                                                spellCheck={false}
                                            />
                                            {validation && (
                                                <div className={`tfm-validation ${validation.valid ? 'valid' : 'invalid'}`}>
                                                    {validation.valid ? (
                                                        <span>✅ Query is valid</span>
                                                    ) : (
                                                        <div>
                                                            {validation.errors.map((err, i) => (
                                                                <div key={i} className="tfm-validation-error">❌ {err}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {validation.warnings.map((warn, i) => (
                                                        <div key={i} className="tfm-validation-warning">⚠️ {warn}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="tfm-form-row">
                                        <label>SQL Parameters (JSON array)</label>
                                        <textarea
                                            value={editForm.sql_params}
                                            onChange={e => setEditForm(prev => ({ ...prev, sql_params: e.target.value }))}
                                            placeholder='[":ticketId", ":status"]'
                                            rows={3}
                                            spellCheck={false}
                                        />
                                        <small>Use :paramName format. Example: [":ticketId", ":status"]</small>
                                    </div>
                                </>
                            )}

                            <div className="tfm-safety-info">
                                <h4>🛡️ Safety Rules</h4>
                                <p><strong>Allowed:</strong> {ALLOWED_STATEMENTS.join(', ')}</p>
                                <p><strong>Blocked:</strong> DROP, CREATE, ALTER, DELETE FROM, GRANT, UNION SELECT, etc.</p>
                            </div>

                            <div className="tfm-editor-actions">
                                <button className="tfm-btn tfm-btn-secondary" onClick={cancelEditing}>
                                    Cancel
                                </button>
                                <button
                                    className="tfm-btn tfm-btn-primary"
                                    onClick={saveFunction}
                                    disabled={editForm.function_type === 'sql' && validation && !validation.valid}
                                >
                                    Save Function
                                </button>
                            </div>
                        </div>
                    ) : selectedFunction ? (
                        /* View Details */
                        <div className="tfm-details">
                            <div className="tfm-details-header">
                                <h2>{selectedFunction.function_name}</h2>
                                <span className={`tfm-type-badge tfm-type-${selectedFunction.function_type}`}>
                                    {selectedFunction.function_type}
                                </span>
                            </div>

                            <div className="tfm-details-meta">
                                <code>{selectedFunction.function_key}</code>
                                <span className={`tfm-category-badge tfm-cat-${selectedFunction.category}`}>
                                    {selectedFunction.category}
                                </span>
                                {!selectedFunction.is_active && <span className="tfm-inactive-badge">INACTIVE</span>}
                            </div>

                            {selectedFunction.description && (
                                <p className="tfm-description">{selectedFunction.description}</p>
                            )}

                            {selectedFunction.function_type === 'sql' && selectedFunction.sql_query && (
                                <div className="tfm-sql-display">
                                    <h4>SQL Query</h4>
                                    <pre>{selectedFunction.sql_query}</pre>
                                </div>
                            )}

                            {selectedFunction.sql_params && (
                                <div className="tfm-params-display">
                                    <h4>Parameters</h4>
                                    <pre>{JSON.stringify(selectedFunction.sql_params, null, 2)}</pre>
                                </div>
                            )}

                            {/* Test Execution Panel */}
                            {selectedFunction.function_type === 'sql' && (
                                <div className="tfm-test-panel">
                                    <h4>🧪 Test Execution</h4>
                                    <div className="tfm-test-params">
                                        {Object.keys(testParams).map(key => (
                                            <div key={key} className="tfm-test-param">
                                                <label>{key}</label>
                                                <input
                                                    type="text"
                                                    value={testParams[key]}
                                                    onChange={e => setTestParams(prev => ({ ...prev, [key]: e.target.value }))}
                                                    placeholder={`Enter ${key}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="tfm-btn tfm-btn-execute"
                                        onClick={executeFunction}
                                        disabled={testLoading}
                                    >
                                        {testLoading ? 'Executing...' : '▶ Execute'}
                                    </button>

                                    {testResult && (
                                        <div className={`tfm-test-result ${testResult.success ? 'success' : 'error'}`}>
                                            <h5>{testResult.success ? '✅ Success' : '❌ Failed'}</h5>
                                            {testResult.rowCount !== undefined && (
                                                <p>Rows: {testResult.rowCount}</p>
                                            )}
                                            <pre>{JSON.stringify(testResult.data || testResult.message || testResult.error, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isAdmin && (
                                <div className="tfm-details-actions">
                                    <button className="tfm-btn tfm-btn-secondary" onClick={startEditing}>
                                        ✏️ Edit
                                    </button>
                                    <button className="tfm-btn tfm-btn-danger" onClick={deleteFunction}>
                                        🗑️ Deactivate
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="tfm-empty">
                            <div className="tfm-empty-icon">📋</div>
                            <h3>Select a function</h3>
                            <p>Choose a function from the list to view details and test execution</p>
                            {isAdmin && (
                                <button className="tfm-btn tfm-btn-primary" onClick={startCreating}>
                                    + Create New Function
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriggerFunctionManager;
