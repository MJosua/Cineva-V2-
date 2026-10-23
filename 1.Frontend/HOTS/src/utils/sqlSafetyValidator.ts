/**
 * SQL Safety Validator (Frontend)
 * 
 * Client-side validation for SQL queries in the Visual API Builder
 * Mirrors the backend sql-safety-validator.js for instant feedback
 */

export const ALLOWED_STATEMENTS = ['SELECT', 'INSERT', 'UPDATE'];

export const BLOCKED_KEYWORDS = [
    // DDL - Never allow structure changes
    'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'RENAME',
    // Administrative - Never allow
    'GRANT', 'REVOKE', 'FLUSH', 'KILL', 'SHUTDOWN',
    // Dangerous operations
    'DELETE FROM',
    'LOAD_FILE', 'INTO OUTFILE', 'INTO DUMPFILE',
    // Information schema access
    'INFORMATION_SCHEMA', 'MYSQL.USER', 'PERFORMANCE_SCHEMA',
    // Comments that could hide malicious code
    '--', '/*', '*/',
    // Stacked queries
    ';SELECT', '; SELECT', ';UPDATE', '; UPDATE', ';DROP', '; DROP',
    // Union-based injection patterns
    'UNION ALL SELECT', 'UNION SELECT',
    // System functions
    'SLEEP(', 'BENCHMARK(', 'LOAD_FILE(', 'SCHEMA()',
];

export const ALLOWED_TABLES = [
    't_ticket', 't_ticket_detail', 't_ticket_event', 't_ticket_assignment',
    't_ticket_work_data', 't_generated_documents', 't_custom_function_logs',
    'm_service', 'm_company_team', 'm_company_department', 'm_ticket_status',
    'm_workflow_step', 'm_service_workflow', 'm_service_triggers',
    'm_service_trigger_function',
    'user',
    't_ticket_analytics',
];

export const READ_ONLY_TABLES = ['m_service', 'm_company_team', 'm_company_department', 'user', 'm_ticket_status'];

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate SQL query for safety
 */
export function validateSqlQuery(sql: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalizedSql = sql.toUpperCase().trim();

    // 1. Check query length
    if (sql.length > 5000) {
        errors.push('Query exceeds maximum length of 5000 characters');
    }

    // 2. Check statement type
    const statementType = getStatementType(normalizedSql);
    if (!ALLOWED_STATEMENTS.includes(statementType)) {
        errors.push(`Statement type '${statementType}' is not allowed. Allowed: ${ALLOWED_STATEMENTS.join(', ')}`);
    }

    // 3. Check for blocked keywords
    for (const keyword of BLOCKED_KEYWORDS) {
        if (normalizedSql.includes(keyword.toUpperCase())) {
            errors.push(`Blocked keyword detected: '${keyword}'`);
        }
    }

    // 4. Check table access permissions
    const tables = extractTables(sql);
    for (const table of tables) {
        const tableLower = table.toLowerCase();

        // Check if table is in allowed list
        if (!ALLOWED_TABLES.some(t => tableLower.includes(t))) {
            warnings.push(`Table '${table}' may not be in the allowed list`);
        }

        // Check read-only enforcement
        if (statementType !== 'SELECT') {
            if (READ_ONLY_TABLES.some(t => tableLower.includes(t))) {
                errors.push(`Table '${table}' is read-only, cannot ${statementType}`);
            }
        }
    }

    // 5. Check for multiple statements
    const semicolonCount = (sql.match(/;/g) || []).length;
    if (semicolonCount > 1) {
        errors.push('Multiple statements detected (stacked queries not allowed)');
    } else if (semicolonCount === 1 && !sql.trim().endsWith(';')) {
        errors.push('Semicolon found in the middle of query (potential stacked query)');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

function getStatementType(sql: string): string {
    const normalized = sql.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';
    if (normalized.startsWith('DROP')) return 'DROP';
    if (normalized.startsWith('CREATE')) return 'CREATE';
    if (normalized.startsWith('ALTER')) return 'ALTER';
    return 'UNKNOWN';
}

function extractTables(sql: string): string[] {
    const tables: string[] = [];

    // FROM clause
    const fromMatch = sql.match(/FROM\s+([`'\w.,\s]+?)(?:\s+WHERE|\s+JOIN|\s+LEFT|\s+RIGHT|\s+INNER|\s+ORDER|\s+GROUP|\s+LIMIT|$)/gi);
    if (fromMatch) {
        fromMatch.forEach(m => {
            const tablesPart = m.replace(/FROM\s+/i, '').split(/\s+(?:WHERE|JOIN|LEFT|RIGHT|INNER|ORDER|GROUP|LIMIT)/i)[0];
            tablesPart.split(',').forEach(t => tables.push(t.trim().replace(/[`'"]/g, '')));
        });
    }

    // JOIN clause
    const joinMatch = sql.match(/JOIN\s+([`'\w]+)/gi);
    if (joinMatch) {
        joinMatch.forEach(m => {
            tables.push(m.replace(/JOIN\s+/i, '').trim().replace(/[`'"]/g, ''));
        });
    }

    // UPDATE clause
    const updateMatch = sql.match(/UPDATE\s+([`'\w]+)/gi);
    if (updateMatch) {
        updateMatch.forEach(m => {
            tables.push(m.replace(/UPDATE\s+/i, '').trim().replace(/[`'"]/g, ''));
        });
    }

    // INSERT INTO clause
    const insertMatch = sql.match(/INSERT\s+INTO\s+([`'\w]+)/gi);
    if (insertMatch) {
        insertMatch.forEach(m => {
            tables.push(m.replace(/INSERT\s+INTO\s+/i, '').trim().replace(/[`'"]/g, ''));
        });
    }

    return [...new Set(tables)].filter(t => t);
}

/**
 * Get syntax highlighting class for SQL keywords
 */
export function getKeywordClass(keyword: string): string {
    const upper = keyword.toUpperCase();

    if (['SELECT', 'INSERT', 'UPDATE', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'LIMIT', 'SET', 'VALUES', 'INTO'].includes(upper)) {
        return 'sql-keyword';
    }
    if (BLOCKED_KEYWORDS.some(b => upper.includes(b.toUpperCase()))) {
        return 'sql-blocked';
    }
    return '';
}
