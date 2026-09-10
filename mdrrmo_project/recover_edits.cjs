const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\b9cbc764-abf9-48c4-a309-f3605a149e3a\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let toolCalls = [];

    for await (const line of rl) {
        if (!line.trim()) continue;
        let entry;
        try {
            entry = JSON.parse(line);
        } catch(e) { continue; }

        if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
            for (let tc of entry.tool_calls) {
                if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'default_api:replace_file_content' || tc.name === 'default_api:multi_replace_file_content') {
                    let args = tc.args || tc.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch(e) {}
                    }
                    if (args && args.TargetFile) {
                        toolCalls.push(args);
                    }
                }
            }
        }
    }

    let successCount = 0;
    for (let args of toolCalls) {
        let file = args.TargetFile;
        if (!fs.existsSync(file)) {
            file = file.replace(/\\/g, '/');
            if (!fs.existsSync(file)) {
                file = args.TargetFile.replace(/\//g, '\\');
                if (!fs.existsSync(file)) continue;
            }
        }
        
        let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
        let modified = false;

        if (args.ReplacementChunks) {
            for (let chunk of args.ReplacementChunks) {
                let target = chunk.TargetContent.replace(/\r\n/g, '\n');
                let replacement = chunk.ReplacementContent.replace(/\r\n/g, '\n');
                if (content.includes(target)) {
                    content = content.replace(target, replacement);
                    modified = true;
                }
            }
        } else if (args.TargetContent && args.ReplacementContent !== undefined) {
            let target = args.TargetContent.replace(/\r\n/g, '\n');
            let replacement = args.ReplacementContent.replace(/\r\n/g, '\n');
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            successCount++;
            console.log("Applied edit to", file);
        }
    }
    console.log("Applied", successCount, "edits.");
}
run();
