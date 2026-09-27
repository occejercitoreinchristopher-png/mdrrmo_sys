/**
 * MDRRMO Opol - Official Incident & Dispatch Log Printing Utility
 * High-definition, letterhead-compliant, single-page optimized printable documents.
 * Automatically suppresses browser headers/footers (localhost URLs & titles)
 * and uses official dual-seal letterhead (Opol Municipal Seal left, MDRRMO Rescue Seal right).
 */

interface PrintIncidentOptions {
    preparedBy?: string;
}

export function printIncidentDetailReport(incident: any, options: PrintIncidentOptions = {}): void {
    if (!incident) return;

    const refNumber = incident.reference_number || `#${incident.id}`;
    const incidentType = incident.incident_type?.name || incident.incident_type?.incident_type_name || 'Emergency Incident';
    const reportedDate = incident.reported_at 
        ? new Date(incident.reported_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
        : (incident.created_at ? new Date(incident.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A');
    const status = (incident.incident_status || 'pending').toUpperCase();
    const priority = (incident.priority || 'Moderate').toUpperCase();
    
    // Caller / Reporter
    const resident = incident.resident;
    const callerName = incident.caller_name || (resident ? `${resident.first_name} ${resident.last_name}` : 'Public / Unspecified Caller');
    const callerPhone = incident.caller_phone_number || resident?.phone_number || 'N/A';
    const reportSource = (incident.report_source === 'dispatcher' || incident.report_source === 'phone_sim' ? 'Hotline Call-In (Dispatcher)' : (incident.report_source === 'resident_app' ? 'MDRRMO Resident Mobile App' : (incident.report_source || 'Citizen Report')));

    // Location
    const placeOfIncident = incident.place_of_incident || incident.location || 'N/A';
    const address = incident.incident_address || incident.location || 'Opol, Misamis Oriental';
    const barangay = incident.barangay || resident?.residentProfile?.barangay?.barangay_name || 'Opol';
    const coordinates = incident.incident_latitude && incident.incident_longitude 
        ? `${Number(incident.incident_latitude).toFixed(6)}, ${Number(incident.incident_longitude).toFixed(6)}`
        : 'N/A';
    const locationCode = incident.location_code || incident.location_code_id || 'N/A';

    // Dispatcher / Handler
    const logs = incident.dispatch_logs || [];
    const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const verifiedBy = incident.verified_by_user || incident.verified_by || incident.verifiedBy;
    const handlerUser = latestLog?.user || verifiedBy || incident.dispatches?.[0]?.dispatcher;
    const dispatcherName = handlerUser ? `${handlerUser.first_name} ${handlerUser.last_name}` : (options.preparedBy || 'MDRRMO Dispatcher On-Duty');

    // Dispatches
    const dispatches = incident.dispatches || [];

    // Synthesized Chronological Timeline
    const timelineEvents: any[] = [];

    // 1. Initial Report
    timelineEvents.push({
        time: incident.reported_at || incident.created_at,
        action: 'Incident Reported',
        user: callerName + (callerPhone !== 'N/A' ? ` (${callerPhone})` : ''),
        statusTransition: 'Initial -> PENDING',
        remarks: incident.incident_description || incident.chief_complaint || 'Emergency reported to MDRRMO Command Center.'
    });

    // 2. Verification
    if (incident.verified_at || incident.verified_by) {
        timelineEvents.push({
            time: incident.verified_at || incident.created_at,
            action: 'Incident Verification',
            user: verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : dispatcherName,
            statusTransition: 'pending -> ' + (incident.incident_status === 'rejected' ? 'rejected' : 'verified'),
            remarks: incident.verification_remarks || (incident.incident_status === 'rejected' ? `Rejected: ${incident.rejection_reason || 'N/A'}` : 'Details and location verified.')
        });
    }

    // 3. Dispatches
    dispatches.forEach((d: any) => {
        const ambPlate = d.ambulance?.plate_number ? `Ambulance ${d.ambulance.plate_number}` : 'Medical Unit';
        if (d.assigned_at || d.created_at) {
            timelineEvents.push({
                time: d.assigned_at || d.created_at,
                action: `Emergency Unit Dispatched (${ambPlate})`,
                user: d.dispatcher ? `${d.dispatcher.first_name} ${d.dispatcher.last_name}` : dispatcherName,
                statusTransition: 'verified -> assigned',
                remarks: `Deployed ${ambPlate} with ${d.crew?.length || 0} crew members.`
            });
        }
        if (d.arrived_at) {
            timelineEvents.push({
                time: d.arrived_at,
                action: `Unit Arrived on Scene (${ambPlate})`,
                user: d.driver ? `${d.driver.first_name} ${d.driver.last_name}` : 'Ambulance Crew',
                statusTransition: 'responding',
                remarks: `Unit reached the reported incident site.`
            });
        }
        if (d.completed_at && d.dispatch_status === 'completed') {
            timelineEvents.push({
                time: d.completed_at,
                action: `Dispatch Mission Completed (${ambPlate})`,
                user: dispatcherName,
                statusTransition: 'completed',
                remarks: `Patient care and transport completed.`
            });
        }
    });

    // 4. Actual audit dispatch_logs records merged
    logs.forEach((log: any) => {
        timelineEvents.push({
            time: log.created_at,
            action: log.action?.name || 'Audit Action',
            user: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System',
            statusTransition: (log.previous_status && log.new_status) ? `${log.previous_status} -> ${log.new_status}` : (log.new_status || '—'),
            remarks: log.remarks || '—'
        });
    });

    // 5. Final resolution / rejection if not already in timeline
    if (incident.incident_status === 'rejected') {
        const exists = timelineEvents.some(e => e.action.includes('Rejected'));
        if (!exists) {
            timelineEvents.push({
                time: incident.resolved_at || incident.updated_at,
                action: 'Incident Rejected / Cancelled',
                user: verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : dispatcherName,
                statusTransition: 'rejected',
                remarks: `Reason: ${incident.rejection_reason || 'N/A'} [Category: ${incident.rejection_category || 'other'}${incident.is_prank ? ' - Flagged as Prank' : ''}]`
            });
        }
    } else if (incident.incident_status === 'resolved') {
        const exists = timelineEvents.some(e => e.action.includes('Resolved'));
        if (!exists) {
            timelineEvents.push({
                time: incident.resolved_at || incident.updated_at,
                action: 'Incident Closed & Resolved',
                user: dispatcherName,
                statusTransition: 'resolved',
                remarks: 'All emergency operations concluded successfully.'
            });
        }
    }

    // Sort chronologically
    timelineEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Single-page limit: if timeline has many records, keep up to 6 rows to prevent page break
    const displayedTimeline = timelineEvents.slice(0, 6);

    const currentDateFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // HTML for Single Incident Report
    // Setting @page { size: portrait; margin: 0; } and title to empty removes browser header & localhost footer!
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>&nbsp;</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        @media print {
            html, body {
                width: 210mm;
                height: 297mm;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
            }
            .page-container {
                padding: 8mm 12mm !important;
                box-sizing: border-box !important;
                height: 100% !important;
                max-height: 295mm !important;
                overflow: hidden !important;
            }
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5px;
            color: #1e293b;
            line-height: 1.25;
            margin: 0;
            padding: 8mm 12mm;
            background: #fff;
        }
        .page-container {
            width: 100%;
            height: 100%;
        }
        
        /* Dual-Logo Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 7px;
        }
        .header-logo {
            width: 52px;
            height: 52px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .header-text {
            flex: 1;
            text-align: center;
        }
        .header-text h3 {
            margin: 0;
            font-size: 9.5px;
            font-weight: 500;
            letter-spacing: 0.3px;
            color: #475569;
        }
        .header-text h2 {
            margin: 1px 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.6px;
            color: #0f172a;
        }
        .header-text h1 {
            margin: 2px 0 0 0;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #b91c1c;
            line-height: 1.15;
        }
        .header-text p {
            margin: 1px 0 0 0;
            font-size: 9px;
            color: #475569;
            font-weight: 600;
        }

        .doc-title-bar {
            background: #0f172a;
            color: #fff;
            padding: 4px 10px;
            font-size: 10.5px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 3px;
            margin-bottom: 7px;
        }
        .status-badge {
            display: inline-block;
            padding: 1.5px 6px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
        }
        .badge-pending { background: #fef3c7; color: #b45309; }
        .badge-verified { background: #dbeafe; color: #1d4ed8; }
        .badge-assigned { background: #e0e7ff; color: #4338ca; }
        .badge-responding { background: #fef08a; color: #854d0e; }
        .badge-resolved { background: #dcfce7; color: #15803d; }
        .badge-rejected { background: #ffe4e6; color: #be123c; }
        
        .section-title {
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            background: #f1f5f9;
            padding: 2.5px 6px;
            border-left: 3px solid #b91c1c;
            margin-top: 6px;
            margin-bottom: 4px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }
        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 6px;
        }
        .data-card {
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            padding: 4px 6px;
            background: #f8fafc;
        }
        .field-label {
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 1px;
        }
        .field-value {
            font-size: 9.5px;
            font-weight: 600;
            color: #0f172a;
            word-break: break-word;
        }
        table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            margin-bottom: 5px;
            font-size: 8.5px;
        }
        table.report-table th {
            background: #e2e8f0;
            color: #1e293b;
            font-weight: bold;
            text-align: left;
            padding: 3.5px 5px;
            border: 1px solid #cbd5e1;
            font-size: 8px;
            text-transform: uppercase;
        }
        table.report-table td {
            padding: 3.5px 5px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            line-height: 1.2;
        }
        table.report-table tr:nth-child(even) {
            background: #f8fafc;
        }
        .timeline-time {
            white-space: nowrap;
            font-weight: 600;
            color: #475569;
            width: 105px;
        }
        .signatures {
            margin-top: 14px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            page-break-inside: avoid;
        }
        .sig-block {
            text-align: center;
        }
        .sig-line {
            border-bottom: 1.5px solid #0f172a;
            margin-top: 24px;
            margin-bottom: 3px;
        }
        .sig-name {
            font-weight: bold;
            font-size: 9.5px;
            text-transform: uppercase;
        }
        .sig-title {
            font-size: 8.5px;
            color: #64748b;
        }
        .footer-note {
            margin-top: 10px;
            text-align: center;
            font-size: 7.5px;
            color: #94a3b8;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Dual-Logo Header -->
        <div class="header">
            <!-- Left: Official Municipality of Opol White Seal -->
            <img src="/images/opol-seal.png" class="header-logo" alt="Opol Seal" onerror="this.style.opacity='0'" />
            
            <div class="header-text">
                <h3>Republic of the Philippines &bull; Province of Misamis Oriental</h3>
                <h2>MUNICIPALITY OF OPOL</h2>
                <h1>MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</h1>
                <p>Emergency Operations &amp; Dispatch Monitoring Center</p>
            </div>

            <!-- Right: MDRRMO Blue Rescue Logo -->
            <img src="/images/opol-logo.png" class="header-logo" alt="MDRRMO Rescue" onerror="this.style.opacity='0'" />
        </div>

        <!-- Title Bar -->
        <div class="doc-title-bar">
            <span>OFFICIAL INCIDENT &amp; DISPATCH AUDIT REPORT</span>
            <span>REF: ${refNumber}</span>
        </div>

        <!-- Section 1: Overview -->
        <div class="section-title">1. Incident Overview &amp; Classification</div>
        <div class="grid-3">
            <div class="data-card">
                <div class="field-label">Incident Type</div>
                <div class="field-value">${incidentType}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Priority Level</div>
                <div class="field-value" style="color:${priority === 'CRITICAL' ? '#b91c1c' : priority === 'HIGH' ? '#c2410c' : '#1d4ed8'}; font-weight: bold;">
                    ${priority} PRIORITY
                </div>
            </div>
            <div class="data-card">
                <div class="field-label">Current Status</div>
                <div class="field-value">
                    <span class="status-badge badge-${(incident.incident_status || 'pending').toLowerCase()}">
                        ${status}
                    </span>
                </div>
            </div>
        </div>

        <div class="grid-3" style="margin-top: 4px;">
            <div class="data-card">
                <div class="field-label">Reported Date &amp; Time</div>
                <div class="field-value">${reportedDate}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Report Channel / Source</div>
                <div class="field-value">${reportSource}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Dispatcher / Operations Handler</div>
                <div class="field-value">${dispatcherName}</div>
            </div>
        </div>

        <!-- Section 2: Reporter & Location -->
        <div class="section-title">2. Reporter &amp; Location Information</div>
        <div class="grid-2">
            <div class="data-card">
                <div class="field-label">Caller / Reporting Resident</div>
                <div class="field-value">${callerName}</div>
                <div style="font-size:8.5px; color:#475569;">Contact: ${callerPhone}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Barangay Jurisdiction</div>
                <div class="field-value">${barangay}</div>
                <div style="font-size:8.5px; color:#475569;">Location Code / Marker: ${locationCode}</div>
            </div>
        </div>

        <div class="grid-2" style="margin-top: 4px;">
            <div class="data-card">
                <div class="field-label">Exact Place / Landmark of Incident</div>
                <div class="field-value">${placeOfIncident}</div>
                <div style="font-size:8.5px; color:#475569;">Full Address: ${address}</div>
            </div>
            <div class="data-card">
                <div class="field-label">GPS Coordinates</div>
                <div class="field-value">${coordinates}</div>
                <div style="font-size:8.5px; color:#475569;">Source: ${incident.location_source || 'Resident GPS'}</div>
            </div>
        </div>

        <!-- Section 3: Narrative / Complaint -->
        <div class="section-title">3. Incident Narrative &amp; Initial Complaint</div>
        <div class="data-card">
            <div class="field-value" style="font-weight: 500; font-size: 8.5px; line-height: 1.3;">
                ${incident.incident_description || incident.chief_complaint || 'No detailed incident description recorded.'}
            </div>
        </div>

        ${incident.incident_status === 'rejected' ? `
        <!-- Section: Rejection Audit (compact) -->
        <div class="section-title" style="border-left-color: #be123c;">4. Rejection &amp; Invalidation Audit</div>
        <div class="data-card" style="background:#fff1f2; border-color:#fecdd3;">
            <div class="field-value" style="color:#881337; font-size: 8.5px;">
                <strong>Category:</strong> <span style="text-transform:uppercase;">${(incident.rejection_category || 'Other').replace(/_/g, ' ')}</span> &bull; 
                <strong>Prank Flag:</strong> ${incident.is_prank ? 'YES (PRANK CALL)' : 'NO'} &bull; 
                <strong>Reason:</strong> ${incident.rejection_reason || 'N/A'}
            </div>
        </div>
        ` : ''}

        <!-- Section: Dispatched Units -->
        <div class="section-title">4. Emergency Units &amp; Personnel Dispatched</div>
        ${dispatches.length === 0 ? `
            <div class="data-card" style="text-align: center; color: #64748b; font-style: italic; padding: 4px; font-size: 8.5px;">
                ${incident.incident_status === 'rejected' ? 'No emergency units dispatched (Incident was rejected/cancelled prior to deployment).' : 'No ambulance units currently assigned to this incident.'}
            </div>
        ` : `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Ambulance / Unit</th>
                        <th>Driver</th>
                        <th>Assigned Crew / Responders</th>
                        <th>Status</th>
                        <th>Dispatched At</th>
                        <th>Arrived Scene</th>
                        <th>Completed</th>
                    </tr>
                </thead>
                <tbody>
                    ${dispatches.map((d: any) => {
                        const amb = d.ambulance;
                        const ambLabel = amb ? `${amb.plate_number} (${amb.call_sign || amb.model || 'Unit'})` : 'Ambulance Unit';
                        const driver = d.driver ? `${d.driver.first_name} ${d.driver.last_name}` : '—';
                        const crewMembers = d.crew?.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ') || '—';
                        return `
                            <tr>
                                <td style="font-weight: bold;">${ambLabel}</td>
                                <td>${driver}</td>
                                <td>${crewMembers}</td>
                                <td><span class="status-badge badge-${(d.dispatch_status || 'assigned').toLowerCase()}">${d.dispatch_status}</span></td>
                                <td>${d.assigned_at ? new Date(d.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                <td>${d.arrived_at ? new Date(d.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                <td>${d.completed_at ? new Date(d.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `}

        <!-- Section: Chronological Audit Log -->
        <div class="section-title">5. Chronological Incident Audit Trail &amp; Timeline</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 105px;">Date &amp; Time</th>
                    <th style="width: 140px;">Action / Lifecycle Event</th>
                    <th style="width: 120px;">Recorded By</th>
                    <th style="width: 90px;">Status</th>
                    <th>Remarks / Details</th>
                </tr>
            </thead>
            <tbody>
                ${displayedTimeline.map((e: any) => `
                    <tr>
                        <td class="timeline-time">${new Date(e.time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style="font-weight: 600; color: #0f172a;">${e.action}</td>
                        <td>${e.user}</td>
                        <td><code>${e.statusTransition}</code></td>
                        <td>${e.remarks}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Sign-off Block (guaranteed on Page 1) -->
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">${dispatcherName}</div>
                <div class="sig-title">MDRRMO Dispatcher / Duty Officer</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">MDRRMO OPERATIONS HEAD</div>
                <div class="sig-title">Municipal Disaster Risk Reduction &amp; Management Office</div>
            </div>
        </div>

        <div class="footer-note">
            Official computer-generated audit report produced by MDRRMO Emergency Operations System on ${currentDateFormatted}. Page 1 of 1
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

    printDocumentViaIframe(html);
}

export function printDispatchLogsSummaryReport(incidents: any[], filters: { search?: string; status?: string; preparedBy?: string } = {}): void {
    if (!incidents || incidents.length === 0) {
        alert('No dispatch log records available to print.');
        return;
    }

    const currentDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    const statusFilterText = filters.status ? filters.status.toUpperCase() : 'ALL INCIDENT STATUSES';
    const searchText = filters.search ? `"${filters.search}"` : 'None (All Records)';
    const preparedBy = filters.preparedBy || 'MDRRMO Admin / Dispatcher';

    // Summary counts
    const totalCount = incidents.length;
    const resolvedCount = incidents.filter(i => i.incident_status === 'resolved').length;
    const rejectedCount = incidents.filter(i => i.incident_status === 'rejected').length;
    const pendingCount = incidents.filter(i => i.incident_status === 'pending').length;
    const activeCount = incidents.filter(i => ['verified', 'assigned', 'responding'].includes(i.incident_status)).length;
    const totalDispatches = incidents.reduce((acc, i) => acc + (i.dispatches?.length || 0), 0);

    // HTML for Landscape Summary Report
    // Setting @page { size: landscape; margin: 0; } and title to empty removes browser header & localhost footer!
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>&nbsp;</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        @media print {
            html, body {
                width: 297mm;
                height: 210mm;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .page-container {
                padding: 7mm 10mm !important;
                box-sizing: border-box !important;
            }
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #1e293b;
            line-height: 1.25;
            margin: 0;
            padding: 7mm 10mm;
            background: #fff;
        }
        .page-container {
            width: 100%;
        }

        /* Dual-Logo Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 8px;
        }
        .header-logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .header-text {
            flex: 1;
            text-align: center;
        }
        .header-text h3 {
            margin: 0;
            font-size: 9px;
            font-weight: 500;
            color: #475569;
        }
        .header-text h2 {
            margin: 1px 0;
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
        }
        .header-text h1 {
            margin: 2px 0 0 0;
            font-size: 13px;
            font-weight: 900;
            color: #b91c1c;
            line-height: 1.15;
        }
        .header-text p {
            margin: 1px 0 0 0;
            font-size: 8.5px;
            color: #475569;
            font-weight: 600;
        }

        .meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #fff;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 9px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            margin-bottom: 10px;
        }
        .stat-card {
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            padding: 4px 6px;
            background: #f8fafc;
            text-align: center;
        }
        .stat-number {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
        }
        .stat-label {
            font-size: 7.5px;
            text-transform: uppercase;
            font-weight: bold;
            color: #64748b;
        }
        table.summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        table.summary-table th {
            background: #e2e8f0;
            color: #0f172a;
            font-weight: bold;
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
            text-transform: uppercase;
            font-size: 8px;
        }
        table.summary-table td {
            padding: 4.5px 6px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            line-height: 1.2;
        }
        table.summary-table tr:nth-child(even) {
            background: #f8fafc;
        }
        .status-badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
        }
        .badge-pending { background: #fef3c7; color: #b45309; }
        .badge-verified { background: #dbeafe; color: #1d4ed8; }
        .badge-assigned { background: #e0e7ff; color: #4338ca; }
        .badge-responding { background: #fef08a; color: #854d0e; }
        .badge-resolved { background: #dcfce7; color: #15803d; }
        .badge-rejected { background: #ffe4e6; color: #be123c; }

        .signatures {
            margin-top: 18px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }
        .sig-block {
            width: 220px;
            text-align: center;
        }
        .sig-line {
            border-bottom: 1.5px solid #0f172a;
            margin-top: 24px;
            margin-bottom: 3px;
        }
        .sig-name {
            font-weight: bold;
            font-size: 9.5px;
            text-transform: uppercase;
        }
        .sig-title {
            font-size: 8.5px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Dual-Logo Header -->
        <div class="header">
            <!-- Left: Official Municipality of Opol White Seal -->
            <img src="/images/opol-seal.png" class="header-logo" alt="Opol Seal" onerror="this.style.opacity='0'" />

            <div class="header-text">
                <h3>Republic of the Philippines &bull; Province of Misamis Oriental</h3>
                <h2>MUNICIPALITY OF OPOL</h2>
                <h1>MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</h1>
                <p>Emergency Operations &amp; Dispatch Monitoring Center</p>
            </div>

            <!-- Right: MDRRMO Blue Rescue Logo -->
            <img src="/images/opol-logo.png" class="header-logo" alt="MDRRMO Rescue" onerror="this.style.opacity='0'" />
        </div>

        <!-- Meta Bar -->
        <div class="meta-bar">
            <span>DISPATCH LOGS &amp; INCIDENT AUDIT TRAIL SUMMARY</span>
            <span>FILTER: ${statusFilterText} | SEARCH: ${searchText} | GENERATED: ${currentDate}</span>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalCount}</div>
                <div class="stat-label">Total Incidents</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #b45309;">${pendingCount}</div>
                <div class="stat-label">Pending Evaluation</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #1d4ed8;">${activeCount}</div>
                <div class="stat-label">Active / Responding</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #15803d;">${resolvedCount}</div>
                <div class="stat-label">Resolved</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #be123c;">${rejectedCount}</div>
                <div class="stat-label">Rejected / Invalid</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #4338ca;">${totalDispatches}</div>
                <div class="stat-label">Total Unit Dispatches</div>
            </div>
        </div>

        <!-- Table -->
        <table class="summary-table">
            <thead>
                <tr>
                    <th style="width: 65px;">Ref #</th>
                    <th style="width: 90px;">Date &amp; Time</th>
                    <th style="width: 105px;">Type &amp; Priority</th>
                    <th>Location / Barangay</th>
                    <th>Reporter / Caller</th>
                    <th>Dispatcher / Handler</th>
                    <th>Dispatched Units</th>
                    <th style="width: 75px;">Status</th>
                    <th>Latest Action Log</th>
                </tr>
            </thead>
            <tbody>
                ${incidents.map((inc: any) => {
                    const logs = inc.dispatch_logs || [];
                    const latestLog = logs[0] || null;
                    const verifiedBy = inc.verified_by_user || inc.verified_by || inc.verifiedBy;
                    const dispatcher = latestLog?.user 
                        ? `${latestLog.user.first_name} ${latestLog.user.last_name}` 
                        : (verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : '—');
                    
                    const dispatches = inc.dispatches || [];
                    const ambList = dispatches.map((d: any) => d.ambulance?.plate_number).filter(Boolean).join(', ');
                    const crewCount = dispatches.reduce((acc: number, d: any) => acc + (d.crew?.length || 0), 0);
                    const resources = dispatches.length > 0 
                        ? `${ambList || 'Ambulance'} (${crewCount} Crew)` 
                        : '<span style="color:#94a3b8; font-style:italic;">None</span>';

                    const caller = inc.caller_name || (inc.resident ? `${inc.resident.first_name} ${inc.resident.last_name}` : 'Caller');
                    const phone = inc.caller_phone_number || inc.resident?.phone_number || '';
                    
                    return `
                        <tr>
                            <td style="font-weight: bold; color: #0f172a;">${inc.reference_number || `#${inc.id}`}</td>
                            <td style="white-space: nowrap;">${new Date(inc.created_at).toLocaleDateString()}<br><span style="color:#64748b;">${new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                            <td>
                                <strong>${inc.incident_type?.name || 'Emergency'}</strong>
                                <div style="font-size: 7.5px; color: #64748b;">${inc.priority || 'Moderate'}</div>
                            </td>
                            <td>
                                <strong>${inc.barangay || 'Opol'}</strong>
                                <div style="font-size: 7.5px; color: #64748b;">${inc.incident_address || inc.place_of_incident || ''}</div>
                            </td>
                            <td>
                                <strong>${caller}</strong>
                                ${phone ? `<div style="font-size: 7.5px; color: #64748b;">${phone}</div>` : ''}
                            </td>
                            <td>${dispatcher}</td>
                            <td>${resources}</td>
                            <td>
                                <span class="status-badge badge-${(inc.incident_status || 'pending').toLowerCase()}">
                                    ${inc.incident_status}
                                </span>
                            </td>
                            <td>
                                ${latestLog ? `
                                    <strong>${latestLog.action?.name || 'Action'}</strong>
                                    <div style="font-size: 7.5px; color: #64748b;">${new Date(latestLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                ` : (inc.incident_status === 'rejected' ? `<span style="color:#be123c;">Rejected (${inc.rejection_category || 'other'})</span>` : '<span style="color:#94a3b8; font-style:italic;">Reported</span>')}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">${preparedBy}</div>
                <div class="sig-title">Prepared by / Reporting Officer</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">MDRRMO EXECUTIVE HEAD</div>
                <div class="sig-title">Municipal Disaster Risk Reduction &amp; Management Office</div>
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

    printDocumentViaIframe(html);
}

function printDocumentViaIframe(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'MDRRMO Report Print');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
        console.error('Failed to open print iframe');
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 60000);
}
