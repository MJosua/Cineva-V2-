/**
 * core/logger.js
 * 
 * Unified Logging Utility for HOTS, E-Order, and Event modules.
 * Standardizes log formatting and broadcasts logs via SSE to the admin dashboard.
 */

const sseManager = require('./sse-manager');

const LogLevels = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

const ColorCodes = {
    magenta: '\x1b[35m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

class Logger {
    constructor(moduleName) {
        this.moduleName = moduleName;
    }

    _formatTimestamp() {
        const now = new Date();
        const date = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        const time = now.toLocaleTimeString('id-ID', { hour12: false });
        return `${date} | ${time}`;
    }

    _log(level, ...args) {
        const timestamp = this._formatTimestamp();
        const moduleLabel = `[${this.moduleName.toUpperCase()}]`;
        const levelLabel = `[${level}]`;

        // Console output (with colors)
        let color = ColorCodes.reset;
        if (level === LogLevels.WARN) color = ColorCodes.yellow;
        if (level === LogLevels.ERROR) color = ColorCodes.red;
        if (level === LogLevels.INFO) color = ColorCodes.green;

        const consoleMsg = `${ColorCodes.magenta}${moduleLabel}${levelLabel}[${timestamp}] : ${color}${args.join(' ')}${ColorCodes.reset}`;
        console.log(consoleMsg);

        // Broadcast to SSE (clean text)
        const sseMsg = `${moduleLabel}${levelLabel}[${timestamp}] : ${args.join(' ')}`;
        sseManager.broadcastLog(sseMsg, this.moduleName);
    }

    info(...args) {
        this._log(LogLevels.INFO, ...args);
    }

    warn(...args) {
        this._log(LogLevels.WARN, ...args);
    }

    error(...args) {
        this._log(LogLevels.ERROR, ...args);
    }

    /**
     * Custom table logger. 
     * Outputs a formatted table to the server console,
     * and a structured text-based table to the SSE stream.
     */
    table(data) {
        const timestamp = this._formatTimestamp();
        const moduleLabel = `[${this.moduleName.toUpperCase()}]`;

        console.log(`${ColorCodes.magenta}${moduleLabel}[TABLE][${timestamp}] :${ColorCodes.reset}`);
        console.table(data);

        // For SSE, we convert the table to a simplified string representation
        const tableStr = Array.isArray(data) ?
            JSON.stringify(data[0] ? Object.keys(data[0]) : []) + " ... " + data.length + " rows" :
            "View formatted table in server console";

        const sseMsg = `${moduleLabel}[TABLE][${timestamp}] : ${tableStr}`;
        sseManager.broadcastLog(sseMsg, this.moduleName);
    }
}

// Export pre-initialized loggers for convenience
module.exports = {
    hots: new Logger('hots'),
    eorder: new Logger('eorder'),
    event: new Logger('event'),
    shortener: new Logger('standalone'),
    create: (name) => new Logger(name)
};
