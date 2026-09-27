const fs = require('fs');
const path = require('path');

const replacements = [
    { regex: /CallLog/g, to: 'DispatchLog' },
    { regex: /Call Log/g, to: 'Dispatch Log' },
    { regex: /callLog/g, to: 'dispatchLog' },
    { regex: /call_log/g, to: 'dispatch_log' },
    { regex: /call_logs/g, to: 'dispatch_logs' },
    { regex: /call-log/g, to: 'dispatch-log' },
    { regex: /call-logs/g, to: 'dispatch-logs' },
    { regex: /Call Logs/g, to: 'Dispatch Logs' }
];

const directories = [
    'app',
    'resources/js',
    'routes',
    'tests',
    'database/migrations'
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (/\.(php|ts|tsx|js|json)$/.test(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const replacement of replacements) {
                if (replacement.regex.test(content)) {
                    content = content.replace(replacement.regex, replacement.to);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

directories.forEach(dir => {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
        processDirectory(fullDir);
    }
});
