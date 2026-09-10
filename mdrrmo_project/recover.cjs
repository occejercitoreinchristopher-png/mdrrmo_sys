const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\b9cbc764-abf9-48c4-a309-f3605a149e3a\\.system_generated\\logs\\transcript_full.jsonl';

const filesToRecover = [
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\admin\\components\\Dashboard\\DashboardCharts.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\admin\\components\\Dashboard\\DashboardHeader.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\admin\\components\\Dashboard\\RecentDispatchTable.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\admin\\components\\Dashboard\\RecentIncidentsTable.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\admin\\components\\Users\\UserManagement.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\dispatcher\\components\\Dispatches\\ActiveDispatchWorkspace.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\dispatcher\\components\\Incidents\\IncidentCard.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\dispatcher\\components\\Incidents\\IncidentDetails.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\dispatcher\\components\\Incidents\\IncidentKanbanBoard.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\dispatcher\\components\\Incidents\\IncidentTable.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\AdminSidebar.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\Button.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\Card.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\DataTable.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\Drawer.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\Input.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\PageHeader.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\PageTitle.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\SearchInput.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\Select.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\StatusBadge.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\components\\ThemeToggle.tsx",
    "C:\\laragon\\www\\mdrrmo_project\\resources\\js\\shared\\contexts\\ThemeContext.tsx"
].map(f => f.toLowerCase().replace(/\\/g, '/'));

async function run() {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const contents = {};

    for await (const line of rl) {
        if (!line.trim()) continue;
        let entry;
        try {
            entry = JSON.parse(line);
        } catch (e) {
            continue;
        }
        
        if (entry.content) {
            const content = entry.content;
            if (content.includes('File Path: `file:///')) {
                const match = content.match(/File Path: `file:\/\/\/(.+?)`/);
                if (match) {
                    let fp = match[1].toLowerCase();
                    // url decode in case of spaces etc, but simple decode
                    fp = decodeURIComponent(fp);
                    if (filesToRecover.includes(fp)) {
                        const lines = content.split('\n');
                        let codeStarted = false;
                        let extracted = [];
                        for (let l of lines) {
                            if (!codeStarted) {
                                if (l.match(/^\d+:/)) {
                                    codeStarted = true;
                                    extracted.push(l.substring(l.indexOf(':') + 2));
                                }
                            } else {
                                if (l.match(/^\d+:/)) {
                                    extracted.push(l.substring(l.indexOf(':') + 2));
                                } else if (l.trim() === 'The above content shows the entire, complete file contents of the requested file.') {
                                    break;
                                }
                            }
                        }
                        if (extracted.length > 0) {
                            contents[fp] = extracted.join('\n');
                        }
                    }
                }
            }
        }
        if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
            // Check for write_to_file
            for (let tc of entry.tool_calls) {
                if (tc.name === 'default_api:write_to_file' || tc.name === 'write_to_file') {
                    let args = tc.arguments;
                    if (args && args.TargetFile && args.CodeContent) {
                        let fp = args.TargetFile.toLowerCase().replace(/\\/g, '/');
                        if (filesToRecover.includes(fp)) {
                            contents[fp] = args.CodeContent;
                        }
                    }
                }
            }
        }
    }

    let recoveredCount = 0;
    for (let fp in contents) {
        let realPath = fp.replace(/\//g, '\\');
        console.log("Restoring", realPath);
        fs.writeFileSync(realPath, contents[fp]);
        recoveredCount++;
    }
    console.log("Recovered", recoveredCount, "files.");
}
run();
