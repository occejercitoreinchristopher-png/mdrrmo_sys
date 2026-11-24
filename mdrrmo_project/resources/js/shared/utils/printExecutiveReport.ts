/**
 * Standalone Official Executive Analytics & Operations Summary Report Generator
 * Opens an isolated, pristine print preview window with forced color-scheme: light.
 * Eliminates all dark mode canvas bleed, eliminates scrollbars, and guarantees single-page A4 printing.
 */

export interface ExecutiveReportData {
    totalIncidents: number;
    topBarangay: {
        name: string;
        total: number;
        pct: number;
    };
    totalDispatches: number;
    resolvedCount: number;
    resolutionRate: number;
    reportedCount: number;
    verificationRate: number;
    avgResponseTimeStr: string;
    barangaySummary: Array<{
        name: string;
        total: number;
        dispatches: number;
        resolved: number;
        pct: number;
        clearanceRate: number;
    }>;
    initialFilters?: Record<string, any>;
    auth?: {
        user?: {
            first_name?: string;
            last_name?: string;
            role?: string;
        };
    };
}

export function printExecutiveReport(data: ExecutiveReportData): void {
    const {
        totalIncidents,
        topBarangay,
        totalDispatches,
        resolvedCount,
        resolutionRate,
        reportedCount,
        verificationRate,
        avgResponseTimeStr,
        barangaySummary,
        initialFilters = {},
        auth,
    } = data;

    const preparedByName = auth?.user
        ? `${auth.user.first_name || ''} ${auth.user.last_name || ''}`.trim()
        : 'REIN CHRISTOPHER EJERCITO';
    const preparedByRole =
        auth?.user?.role === 'dispatcher'
            ? 'Operations Dispatcher / On-Duty'
            : 'MDRRMO Operations Administrator';

    const filterScopeText =
        Object.entries(initialFilters).filter(([_, v]) => v).length > 0
            ? Object.entries(initialFilters)
                  .filter(([_, v]) => v)
                  .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
                  .join(' | ')
            : 'All Municipal Records (Unfiltered)';

    const currentDateText = new Date().toLocaleDateString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const rowsHtml = barangaySummary
        .slice(0, 8)
        .map(
            (b, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; text-align: center; border-right: 1px solid #cbd5e1; font-family: monospace; font-size: 10px; color: #475569;">${idx + 1}</td>
            <td style="padding: 5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #cbd5e1;">
                ${b.name}
                ${
                    idx === 0
                        ? `<span style="margin-left: 6px; font-size: 8px; font-weight: 900; text-transform: uppercase; padding: 1px 4px; border: 1px solid #0f172a; border-radius: 3px; background: #f1f5f9;">Top Hotspot</span>`
                        : ''
                }
            </td>
            <td style="padding: 5px 8px; text-align: center; font-weight: 700; font-family: monospace; border-right: 1px solid #cbd5e1; color: #0f172a;">${b.total}</td>
            <td style="padding: 5px 8px; text-align: center; font-family: monospace; border-right: 1px solid #cbd5e1; color: #334155;">${b.dispatches}</td>
            <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: 600; border-right: 1px solid #cbd5e1; color: #0f172a;">${b.resolved}</td>
            <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: 700; color: #0f172a;">${b.clearanceRate}%</td>
        </tr>
    `
        )
        .join('');

    const html = `<!DOCTYPE html>
<html lang="en" style="color-scheme: light !important;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MDRRMO Opol - Executive Incident & Operations Summary Report</title>
    <style>
        :root, html, body {
            color-scheme: light !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }

        /* Screen Preview Wrapper */
        @media screen {
            body {
                background: #0b1120 !important;
                padding: 24px 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                box-sizing: border-box;
            }
            .preview-toolbar {
                width: 210mm;
                max-width: 100%;
                background: #1e293b;
                color: #ffffff;
                padding: 12px 18px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                box-sizing: border-box;
            }
            .toolbar-title {
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .toolbar-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .btn {
                padding: 7px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                border: none;
                transition: all 0.15s ease;
            }
            .btn-print {
                background: #dc2626;
                color: #ffffff;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
            }
            .btn-print:hover {
                background: #b91c1c;
            }
            .btn-close {
                background: #334155;
                color: #e2e8f0;
            }
            .btn-close:hover {
                background: #475569;
            }
            .page-container {
                width: 210mm;
                background: #ffffff !important;
                color: #0f172a !important;
                padding: 10mm 12mm;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                border-radius: 2px;
                box-sizing: border-box;
            }
        }

        /* Print Override */
        @media print {
            .no-print, .preview-toolbar {
                display: none !important;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .page-container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                page-break-before: avoid !important;
                break-before: avoid !important;
                max-height: 278mm !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }
        }

        /* Core Typography & Box Styles */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0f172a;
        }
        .header-logo {
            width: 58px;
            height: 58px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .header-center {
            text-align: center;
            flex: 1;
        }
        .header-center .sub {
            font-size: 8.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            margin: 0;
            line-height: 1;
        }
        .header-center .muni {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin: 2px 0 0 0;
            line-height: 1.1;
        }
        .header-center .dept {
            font-size: 13.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.2px;
            color: #020617;
            margin: 2px 0 0 0;
            line-height: 1.1;
        }
        .header-center .ops {
            font-size: 9.5px;
            font-weight: 800;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 2px 0 0 0;
            line-height: 1;
        }
        .header-center .badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 2px 8px;
            border-radius: 3px;
            margin-top: 5px;
        }
        .meta-strip {
            display: grid;
            grid-template-columns: 1fr 1fr 1.3fr;
            gap: 8px;
            font-size: 9.5px;
            color: #334155;
            padding: 8px 0 6px 0;
            border-bottom: 1px solid #cbd5e1;
        }
        .meta-strip strong {
            display: block;
            font-size: 8.5px;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .section-title-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0 4px 0;
            border-bottom: 1.5px solid #0f172a;
            margin-bottom: 6px;
        }
        .section-title-strip h3 {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin: 0;
        }
        .section-title-strip span {
            font-size: 8.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
        }
        .grid-6 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 8px;
        }
        .stat-box {
            border: 1.5px solid #0f172a;
            background: #ffffff;
            padding: 6px 8px;
            box-sizing: border-box;
        }
        .stat-box .label {
            font-size: 8.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            margin: 0 0 2px 0;
        }
        .stat-box .val {
            font-size: 18px;
            font-weight: 900;
            font-family: monospace;
            color: #020617;
            margin: 0 0 2px 0;
            line-height: 1.1;
        }
        .stat-box .note {
            font-size: 8.5px;
            color: #64748b;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .table-wrap {
            border: 1.5px solid #0f172a;
            margin-bottom: 8px;
            box-sizing: border-box;
        }
        .table-head-bar {
            background: #f1f5f9;
            padding: 4px 8px;
            border-bottom: 1.5px solid #0f172a;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .table-head-bar h4 {
            font-size: 9.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin: 0;
        }
        .table-head-bar span {
            font-size: 8.5px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
        }
        th {
            background: #f8fafc;
            padding: 4px 6px;
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            text-align: center;
            padding-top: 8px;
            margin-top: 4px;
        }
        .sig-block {
            width: 220px;
            margin: 0 auto;
        }
        .sig-block .sig-label {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 18px 0;
        }
        .sig-block .sig-name {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
            margin: 0 0 2px 0;
            letter-spacing: 0.5px;
        }
        .sig-block .sig-line {
            border-bottom: 1.5px solid #0f172a;
            width: 100%;
            margin-bottom: 2px;
        }
        .sig-block .sig-role {
            font-size: 8.5px;
            font-weight: 600;
            color: #475569;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="preview-toolbar no-print">
        <div class="toolbar-title">
            <span>Official Executive Analytics Report &mdash; Print Preview</span>
        </div>
        <div class="toolbar-actions">
            <button type="button" class="btn btn-print" onclick="window.print()">
                &#128424; Print / Save as PDF
            </button>
            <button type="button" class="btn btn-close" onclick="window.close()">
                Close
            </button>
        </div>
    </div>

    <div class="page-container">
        <!-- 1. Dual-Logo Header -->
        <div class="header">
            <img src="/images/opol_logo.png" class="header-logo" alt="Opol Seal" onerror="this.src='/images/opol-seal.png'" />
            <div class="header-center">
                <p class="sub">Republic of the Philippines &bull; Province of Misamis Oriental</p>
                <h2 class="muni">MUNICIPALITY OF OPOL</h2>
                <h1 class="dept">MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</h1>
                <p class="ops">Emergency Operations &amp; Dispatch Monitoring Center &bull; Opol Rescue</p>
                <div class="badge">Official Executive Incident &amp; Operations Summary Report</div>
            </div>
            <img src="/images/drrm_logo.png" class="header-logo" alt="DRRM Logo" />
        </div>

        <!-- Metadata Strip -->
        <div class="meta-strip">
            <div>
                <strong>Report Generated:</strong>
                <span>${currentDateText}</span>
            </div>
            <div>
                <strong>Total Records:</strong>
                <span>${totalIncidents} Documented Emergency Cases</span>
            </div>
            <div>
                <strong>Filter Scope:</strong>
                <span>${filterScopeText}</span>
            </div>
        </div>

        <!-- 2. The 6 Core Requested Metrics -->
        <div class="section-title-strip">
            <h3>Executive Incident Summary &amp; Key Performance Indicators</h3>
            <span>Official Municipal Performance Standards</span>
        </div>

        <div class="grid-6">
            <!-- 1. Total Incidents / Accidents -->
            <div class="stat-box">
                <div class="label">1. Total Incidents / Accidents</div>
                <div class="val">${totalIncidents}</div>
                <div class="note">Documented emergency incident cases</div>
            </div>

            <!-- 2. Highest Incident Barangay -->
            <div class="stat-box">
                <div class="label">2. Highest Incident Barangay</div>
                <div class="val">${topBarangay.name}</div>
                <div class="note">${topBarangay.total} incidents (${topBarangay.pct}% of total)</div>
            </div>

            <!-- 3. Total Emergency Dispatches -->
            <div class="stat-box">
                <div class="label">3. Total Emergency Dispatches</div>
                <div class="val">${totalDispatches}</div>
                <div class="note">Ambulance &amp; quick-response deployments</div>
            </div>

            <!-- 4. Resolved Incidents -->
            <div class="stat-box">
                <div class="label">4. Resolved Incidents</div>
                <div class="val">${resolvedCount}</div>
                <div class="note">${resolutionRate}% operational clearance rate</div>
            </div>

            <!-- 5. Reported Citizen Incidents -->
            <div class="stat-box">
                <div class="label">5. Reported Citizen Incidents</div>
                <div class="val">${reportedCount}</div>
                <div class="note">${verificationRate}% verified legitimate distress calls</div>
            </div>

            <!-- 6. Average Response Time -->
            <div class="stat-box">
                <div class="label">6. Average Response Time</div>
                <div class="val">${avgResponseTimeStr}</div>
                <div class="note">Dispatch acknowledgment to on-scene arrival</div>
            </div>
        </div>

        <!-- 3. Territorial Barangay Incident & Operations Ledger -->
        <div class="table-wrap">
            <div class="table-head-bar">
                <h4>Territorial Barangay Incident &amp; Operations Distribution</h4>
                <span>Ranked by Incident Volume</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 28px; text-align: center; border-right: 1px solid #cbd5e1;">#</th>
                        <th style="text-align: left; border-right: 1px solid #cbd5e1;">Barangay Name</th>
                        <th style="text-align: center; border-right: 1px solid #cbd5e1;">Incidents</th>
                        <th style="text-align: center; border-right: 1px solid #cbd5e1;">Dispatches</th>
                        <th style="text-align: center; border-right: 1px solid #cbd5e1;">Resolved</th>
                        <th style="text-align: center;">Clearance Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>

        <!-- 4. Official Signatures Section -->
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-label">Prepared &amp; Certified By:</div>
                <div class="sig-name">${preparedByName}</div>
                <div class="sig-line"></div>
                <div class="sig-role">${preparedByRole}</div>
            </div>

            <div class="sig-block">
                <div class="sig-label">Approved &amp; Noted By:</div>
                <div class="sig-name">ENGR. ROMMEL C. LANOY</div>
                <div class="sig-line"></div>
                <div class="sig-role">Approved by / MDRRMO Officer-in-Charge</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Open dedicated, isolated print window
    const printWindow = window.open('', '_blank', 'width=980,height=820');
    if (!printWindow) {
        // Fallback to in-window print if popup is blocked
        window.print();
        return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
}
