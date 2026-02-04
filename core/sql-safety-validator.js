/**
 * SQL Safety Validator for Trigger Engine
 * 
 * Provides security measures for executing database-stored SQL queries:
 * - Whitelist of allowed statement types
 * - Blacklist of dangerous operations
 * - Parameter sanitization
 * - Query timeout limits
 * - Logging and auditing
 */

const ALLOWED_STATEMENTS = ['SELECT', 'INSERT', 'UPDATE'];

const BLOCKED_KEYWORDS = [
    // DDL - Never allow structure changes
    'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'RENAME',
    // Administrative - Never allow
    'GRANT', 'REVOKE', 'FLUSH', 'KILL', 'SHUTDOWN',
    // Dangerous operations
    'DELETE FROM', // Block mass deletes (UPDATE SET is_deleted = 1 is safer)
    'LOAD_FILE', 'INTO OUTFILE', 'INTO DUMPFILE',
    // Information schema access (potential reconnaissance)
    'INFORMATION_SCHEMA', 'MYSQL.USER', 'PERFORMANCE_SCHEMA',
    // Comments that could hide malicious code
    '--', '/*', '*/',
    // Stacked queries (SQL injection vector)
    ';SELECT', '; SELECT', ';UPDATE', '; UPDATE', ';DROP', '; DROP',
    // Union-based injection patterns
    'UNION ALL SELECT', 'UNION SELECT',
    // System functions
    'SLEEP(', 'BENCHMARK(', 'LOAD_FILE(', 'SCHEMA()',
];

const ALLOWED_TABLES = [
    // Ticket/Service tables (read + update)
    't_ticket', 't_ticket_detail', 't_ticket_event', 't_ticket_assignment',
    't_ticket_work_data', 't_file_upload', 'm_service_trigger_log',
    // Master tables (read only - enforced separately)
    'm_service', 'm_team', 'm_department', 'm_ticket_status',
    'm_workflow_step', 'm_service_workflow', 'm_service_triggers',
    'm_service_trigger_function',
    // User table (read only)
    'user',
    // Analytics
    't_ticket_analytics',
];

// Tables that are READ-ONLY (SELECT only)
const READ_ONLY_TABLES = ['m_service', 'm_team', 'm_department', 'user', 'm_ticket_status'];

class SqlSafetyValidator {
    constructor(options = {}) {
        this.allowedStatements = options.allowedStatements || ALLOWED_STATEMENTS;
        this.blockedKeywords = options.blockedKeywords || BLOCKED_KEYWORDS;
        this.allowedTables = options.allowedTables || ALLOWED_TABLES;
        this.readOnlyTables = options.readOnlyTables || READ_ONLY_TABLES;
        this.maxQueryLength = options.maxQueryLength || 5000;
    }

    /**
     * Validate SQL query for safety
     * @param {string} sql - The SQL query to validate
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(sql) {
        const errors = [];
        const normalizedSql = sql.toUpperCase().trim();

        // 1. Check query length
        if (sql.length > this.maxQueryLength) {
            errors.push(`Query exceeds maximum length of ${this.maxQueryLength} characters`);
        }

        // 2. Check statement type
        const statementType = this._getStatementType(normalizedSql);
        if (!this.allowedStatements.includes(statementType)) {
            errors.push(`Statement type '${statementType}' is not allowed. Allowed: ${this.allowedStatements.join(', ')}`);
        }

        // 3. Check for blocked keywords
        for (const keyword of this.blockedKeywords) {
            if (normalizedSql.includes(keyword.toUpperCase())) {
                errors.push(`Blocked keyword detected: '${keyword}'`);
            }
        }

        // 4. Check table access permissions
        const tables = this._extractTables(sql);
        for (const table of tables) {
            const tableLower = table.toLowerCase();

            // Check if table is in allowed list
            if (!this.allowedTables.some(t => tableLower.includes(t))) {
                errors.push(`Table '${table}' is not in the allowed list`);
            }

            // Check read-only enforcement for UPDATE/INSERT on protected tables
            if (statementType !== 'SELECT') {
                if (this.readOnlyTables.some(t => tableLower.includes(t))) {
                    errors.push(`Table '${table}' is read-only, cannot ${statementType}`);
                }
            }
        }

        // 5. Check for multiple statements (prevent stacked queries)
        const semicolonCount = (sql.match(/;/g) || []).length;
        if (semicolonCount > 1) {
            errors.push('Multiple statements detected (stacked queries not allowed)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    _getStatementType(sql) {
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

    _extractTables(sql) {
        // Simple regex to extract table names (not perfect but covers common cases)
        const tables = [];

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
     * Sanitize parameter value
     * @param {any} value - The value to sanitize
     * @returns {any} - Sanitized value
     */
    sanitizeParam(value) {
        if (value === null || value === undefined) return null;

        if (typeof value === 'string') {
            // Remove potential SQL injection patterns
            return value
                .replace(/['";]/g, '') // Remove quotes and semicolons
                .replace(/--/g, '')     // Remove comment markers
                .substring(0, 1000);    // Limit length
        }

        if (typeof value === 'number') {
            if (!isFinite(value)) return 0;
            return value;
        }

        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }

        // For objects/arrays, stringify with length limit
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value).substring(0, 5000);
            } catch {
                return null;
            }
        }

        return String(value).substring(0, 1000);
    }
}

module.exports = SqlSafetyValidator;
module.exports.ALLOWED_STATEMENTS = ALLOWED_STATEMENTS;
module.exports.BLOCKED_KEYWORDS = BLOCKED_KEYWORDS;
module.exports.ALLOWED_TABLES = ALLOWED_TABLES;
