// consoleinfo.js

const styles = {
    info: "\x1b[34m",    // Blue
    success: "\x1b[32m", // Green
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m"    // Red
};
const reset = "\x1b[0m";

function logStyled(message, style = "info", timestamp = true) {
    let date = new Date();
    const ts = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id');
    const prefix = styles[style] || styles.info;

    if (timestamp) {
        console.log(`${prefix}[${ts}] ${message}${reset}`);
    } else {
        console.log(`${prefix}${message}${reset}`);
    }
}

class ConsoleInfo {
    static info(msg, ts = true) { logStyled(msg, "info", ts); }
    static success(msg, ts = true) { logStyled(msg, "success", ts); }
    static warn(msg, ts = true) { logStyled(msg, "warn", ts); }
    static error(msg, ts = true) { logStyled(msg, "error", ts); }
}

module.exports = { logStyled, ConsoleInfo };
