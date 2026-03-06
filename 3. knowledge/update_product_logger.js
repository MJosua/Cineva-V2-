const fs = require('fs');
const files = [
    {
        path: "d:\\GIT-Based-Backend\\Integrated-API.worktrees\\AntiGravityWorktree\\controller\\OnlineOrder\\product.js",
        loggerRequire: "const log = require('../../core/logger');",
        loggerPrefix: "log.eorder"
    }
];

let totalFixed = 0;

for (const f of files) {
    if (!fs.existsSync(f.path)) {
        console.log(`File not found: ${f.path}`);
        continue;
    }

    let content = fs.readFileSync(f.path, 'utf8');
    const original = content;

    // Inject require
    if (!content.includes('core/logger')) {
        content = content.replace(/(const .* = require\(.*?\);?)/, `$1\n${f.loggerRequire}`);
    }

    // Replace console.log / warn / error
    content = content.replace(/console\.log\s*\(/g, `${f.loggerPrefix}.info(`);
    content = content.replace(/console\.warn\s*\(/g, `${f.loggerPrefix}.warn(`);
    content = content.replace(/console\.error\s*\(/g, `${f.loggerPrefix}.error(`);

    // Remove legacy timestamp prefixes inside the logs (like log.eorder.info(timestamp + "message"))
    content = content.replace(/(log\.[a-z]+\.(?:info|warn|error)\()timestamp\s*\+\s*/g, '$1');
    content = content.replace(/(log\.[a-z]+\.(?:info|warn|error)\()req\.dataToken\.timestamp\s*\+\s*/g, '$1');
    content = content.replace(/(log\.[a-z]+\.(?:info|warn|error)\()timestamp\s*,\s*/g, '$1');

    if (content !== original) {
        fs.writeFileSync(f.path, content, 'utf8');
        console.log(`Updated: ${f.path}`);
        totalFixed++;
    } else {
        console.log(`No changes needed: ${f.path}`);
    }
}
console.log(`Summary: Fixed ${totalFixed} files.`);
