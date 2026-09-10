/**
 * Utility to generate and trigger printing of an official MDRRMO Patient Care Record (PCR)
 * formatted for standard A4 portrait paper.
 */

interface Marker {
    x?: number;
    y?: number;
    label?: string;
    type?: string;
    notes?: string;
    id?: string | number;
}

export function printPatientCareRecord(record: any): void {
    if (!record) return;

    const patient = record.patient || {};
    const dispatch = record.dispatch || {};
    const incident = dispatch.incident || {};
    const gcs = record.glasgow_coma_scale || {};
    const vitalSigns = Array.isArray(record.vital_signs) ? record.vital_signs : [];
    const assessmentMarkers: Marker[] = Array.isArray(record.assessment_markers) ? record.assessment_markers : [];
    const assessmentFindings = Array.isArray(record.assessment) 
        ? record.assessment 
        : (typeof record.assessment === 'string' && record.assessment ? [record.assessment] : []);
    const dispositionList: string[] = Array.isArray(record.disposition)
        ? record.disposition
        : (typeof record.disposition === 'string' && record.disposition ? [record.disposition] : []);

    // Format Helpers
    const formatDate = (val: string | null | undefined): string => {
        if (!val) return '____________________';
        const parsed = new Date(typeof val === 'string' && val.includes('-') && !val.includes('T') ? val.replace(/-/g, '/') : val);
        if (isNaN(parsed.getTime())) return String(val);
        return parsed.toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timeVal: string | null | undefined): string => {
        if (!timeVal) return '___________';
        return String(timeVal);
    };

    const emptyLine = (val: any, fallback = '____________________'): string => {
        if (val === null || val === undefined || val === '') return fallback;
        return String(val);
    };

    const pcrDate = formatDate(record.record_date || record.created_at);
    const patientFullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(', ') 
        || patient.full_name 
        || record.patient_name 
        || '';

    const patientAddress = patient.address 
        || [patient.house_no, patient.street, patient.barangay || patient.barangay?.barangay_name].filter(Boolean).join(', ')
        || '';

    const incidentLocation = record.place_of_incident 
        || incident.incident_address 
        || incident.location 
        || '';

    const natureOfCall = (record.nature_of_call || incident.nature_of_call || '').toLowerCase();
    const chiefComplaint = record.chief_complaint || incident.chief_complaint || '';

    // Checkbox helper
    const chk = (condition: boolean) => condition ? '&#9632;' : '&#9633;';

    // 3 Takes for Vitals Table
    const take1 = vitalSigns[0] || {};
    const take2 = vitalSigns[1] || {};
    const take3 = vitalSigns[2] || {};

    // Disposition Checkboxes
    const hasDisp = (keyword: string) => dispositionList.some(d => d.toLowerCase().includes(keyword.toLowerCase()));
    const isTransported = record.transported || hasDisp('transport');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PCR #${record.id} - ${patientFullName || 'Official Record'}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 0;
            line-height: 1.25;
        }

        .pcr-container {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            border: 1.5px solid #000;
            padding: 2.5mm;
            background: #fff;
        }

        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2mm;
            border-bottom: 2px solid #000;
            padding-bottom: 2mm;
        }
        .header-logo {
            width: 55px;
            text-align: center;
            vertical-align: middle;
        }
        .header-center {
            text-align: center;
            vertical-align: middle;
        }
        .header-top {
            font-size: 7pt;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
            color: #333;
        }
        .header-main {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin: 1px 0;
            color: #b91c1c;
        }
        .header-sub {
            font-size: 8.5pt;
            font-weight: bold;
            color: #000;
            margin: 1px 0;
            letter-spacing: 0.5px;
        }
        .doc-title {
            font-size: 12pt;
            font-weight: 900;
            background: #000;
            color: #fff !important;
            padding: 2px 10px;
            display: inline-block;
            margin-top: 2px;
            letter-spacing: 1px;
            border-radius: 2px;
        }

        /* META TOP BAR */
        .meta-strip {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
            margin-bottom: 2.5mm;
            font-size: 8pt;
        }
        .meta-strip td {
            padding: 3px 6px;
            border: 1px solid #000;
        }
        .meta-label {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7pt;
            color: #333;
        }
        .meta-value {
            font-weight: bold;
            font-size: 8.5pt;
            color: #000;
        }

        /* SECTION STYLES */
        .section-header {
            background: #e2e8f0;
            border: 1px solid #000;
            font-size: 7.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 2px 6px;
            margin-top: 2mm;
            margin-bottom: 0;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 8pt;
            margin-bottom: 2mm;
        }
        .data-table td, .data-table th {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: top;
        }
        .field-lbl {
            font-size: 6.8pt;
            text-transform: uppercase;
            font-weight: bold;
            color: #444;
            display: block;
            margin-bottom: 1px;
        }
        .field-val {
            font-size: 8.5pt;
            font-weight: 600;
            color: #000;
            min-height: 12px;
        }

        /* TIMELINE ROW */
        .timeline-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
            text-align: center;
            margin-bottom: 2mm;
        }
        .timeline-table th {
            background: #f1f5f9;
            border: 1px solid #000;
            padding: 3px 2px;
            font-size: 6.8pt;
            text-transform: uppercase;
            font-weight: bold;
        }
        .timeline-table td {
            border: 1px solid #000;
            padding: 3px 2px;
            font-weight: bold;
            font-size: 8pt;
        }

        /* VITALS TABLE */
        .vitals-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 8pt;
            text-align: center;
            margin-bottom: 2mm;
        }
        .vitals-table th {
            background: #f1f5f9;
            border: 1px solid #000;
            padding: 3px 4px;
            font-size: 7pt;
            text-transform: uppercase;
            font-weight: bold;
        }
        .vitals-table td {
            border: 1px solid #000;
            padding: 3px 4px;
            font-size: 8pt;
        }

        /* ASSESSMENT & BODY DIAGRAM GRID */
        .assessment-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 2mm;
        }
        .assessment-grid > tbody > tr > td {
            border: 1px solid #000;
            padding: 4px;
            vertical-align: top;
        }
        .body-diagram-wrap {
            position: relative;
            width: 155px;
            height: 165px;
            margin: 0 auto;
            text-align: center;
        }
        .body-diagram-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        .body-marker-pin {
            position: absolute;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #dc2626;
            color: #fff;
            font-size: 7pt;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #fff;
            transform: translate(-50%, -50%);
            box-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        /* GCS TABLE */
        .gcs-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            text-align: center;
            font-size: 7.5pt;
            margin-bottom: 2mm;
        }
        .gcs-table th {
            background: #f8fafc;
            border: 1px solid #000;
            padding: 2.5px 4px;
            font-size: 6.8pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .gcs-table td {
            border: 1px solid #000;
            padding: 3px 4px;
            font-weight: bold;
            font-size: 8.5pt;
        }

        /* DISPOSITION & DESTINATION */
        .dispo-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
            margin-bottom: 2mm;
        }
        .dispo-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: top;
        }

        /* CREW */
        .crew-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
            margin-bottom: 2mm;
        }
        .crew-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            width: 33.33%;
            vertical-align: bottom;
        }
        .sign-line {
            border-top: 1px solid #000;
            margin-top: 20px;
            padding-top: 2px;
            text-align: center;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        /* WAIVER & LEGAL */
        .waiver-box {
            border: 1px solid #000;
            padding: 3px 6px;
            font-size: 6.8pt;
            line-height: 1.25;
            background: #f8fafc;
            margin-bottom: 2mm;
            text-align: justify;
        }
        .waiver-signatures {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
        }
        .waiver-signatures td {
            border: 1px solid #000;
            padding: 4px;
            width: 50%;
            vertical-align: bottom;
            text-align: center;
        }
        .sig-img {
            max-height: 32px;
            max-width: 120px;
            display: block;
            margin: 2px auto;
            object-fit: contain;
        }

        .footer-note {
            font-size: 6pt;
            text-align: right;
            margin-top: 1mm;
            color: #555;
            font-style: italic;
        }

        .check-group {
            display: inline-flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }
        .check-item {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            font-size: 7.5pt;
        }
    </style>
</head>
<body>

<div class="pcr-container">
    <!-- OFFICIAL HEADER -->
    <table class="header-table">
        <tr>
            <td class="header-logo" style="width: 50px;">
                <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" stroke="#b91c1c" stroke-width="4" fill="#fef2f2"/>
                    <rect x="42" y="16" width="16" height="68" rx="3" fill="#b91c1c"/>
                    <rect x="16" y="42" width="68" height="16" rx="3" fill="#b91c1c"/>
                    <circle cx="50" cy="50" r="14" fill="#fff" stroke="#b91c1c" stroke-width="2"/>
                    <path d="M50 40 L53 47 L60 47 L54 51 L56 58 L50 54 L44 58 L46 51 L40 47 L47 47 Z" fill="#b91c1c"/>
                </svg>
            </td>
            <td class="header-center">
                <p class="header-top">Republic of the Philippines &bull; Province of Misamis Oriental</p>
                <p class="header-main">MUNICIPALITY OF OPOL</p>
                <p class="header-sub">LOCAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)</p>
                <p style="font-size: 7pt; font-weight: bold; letter-spacing: 0.8px; margin: 1px 0; color: #1e3a8a;">
                    EMERGENCY MEDICAL SERVICES DIVISION (EMS)
                </p>
                <div class="doc-title">PATIENT CARE RECORD</div>
            </td>
            <td class="header-logo" style="width: 50px;">
                <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="50,5 95,90 5,90" stroke="#0284c7" stroke-width="4" fill="#f0f9ff"/>
                    <circle cx="50" cy="55" r="24" stroke="#b91c1c" stroke-width="3" fill="#fff"/>
                    <text x="50" y="59" font-family="Arial" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">OPOL</text>
                    <text x="50" y="70" font-family="Arial" font-size="7" font-weight="bold" fill="#0369a1" text-anchor="middle">MDRRMO</text>
                </svg>
            </td>
        </tr>
    </table>

    <!-- META TOP BAR -->
    <table class="meta-strip">
        <tr>
            <td style="width: 22%;">
                <span class="meta-label">PCR Reference #</span>
                <div class="meta-value" style="color: #b91c1c;">#${record.id}</div>
            </td>
            <td style="width: 26%;">
                <span class="meta-label">Date of Incident / Call</span>
                <div class="meta-value">${pcrDate}</div>
            </td>
            <td style="width: 26%;">
                <span class="meta-label">Dispatch / Incident Ref</span>
                <div class="meta-value">DSP #${record.dispatch_id || '—'} &bull; INC #${incident.id || '—'}</div>
            </td>
            <td style="width: 26%;">
                <span class="meta-label">Responding Unit</span>
                <div class="meta-value">${dispatch.ambulance?.vehicle_name || dispatch.ambulance?.plate_number || 'EMS Ambulance'}</div>
            </td>
        </tr>
    </table>

    <!-- 1. PATIENT INFORMATION & INCIDENT DETAILS -->
    <div class="section-header">1. Patient Information & Incident Details</div>
    <table class="data-table">
        <tr>
            <td colspan="3" style="width: 55%;">
                <span class="field-lbl">Patient Full Name (Last, First, Middle)</span>
                <div class="field-val" style="font-size: 9.5pt;">${patientFullName || emptyLine(null)}</div>
            </td>
            <td style="width: 15%;">
                <span class="field-lbl">Age</span>
                <div class="field-val">${patient.age ? patient.age + ' yrs' : (record.age ? record.age + ' yrs' : '______')}</div>
            </td>
            <td style="width: 15%;">
                <span class="field-lbl">Gender</span>
                <div class="field-val" style="text-transform: capitalize;">${patient.gender || record.gender || '______'}</div>
            </td>
            <td style="width: 15%;">
                <span class="field-lbl">Civil Status</span>
                <div class="field-val" style="text-transform: capitalize;">${patient.civil_status || record.civil_status || '______'}</div>
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="field-lbl">Residential Address</span>
                <div class="field-val">${patientAddress || emptyLine(null)}</div>
            </td>
            <td colspan="2">
                <span class="field-lbl">Patient Contact #</span>
                <div class="field-val">${patient.contact_number || record.contact_number || emptyLine(null)}</div>
            </td>
            <td>
                <span class="field-lbl">Caller Phone #</span>
                <div class="field-val">${record.caller_no || incident.caller_phone_number || emptyLine(null)}</div>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="field-lbl">Exact Place of Incident / Location</span>
                <div class="field-val">${incidentLocation || emptyLine(null)}</div>
            </td>
            <td colspan="2">
                <span class="field-lbl">Barangay</span>
                <div class="field-val">${patient.barangay || patient.barangay?.barangay_name || record.barangay || 'Opol'}</div>
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="field-lbl">Chief Complaint</span>
                <div class="field-val" style="font-weight: bold; color: #b91c1c;">${chiefComplaint || emptyLine(null)}</div>
            </td>
            <td colspan="3">
                <span class="field-lbl">Nature of Call</span>
                <div class="field-val">
                    <span class="check-group">
                        <span class="check-item">${chk(natureOfCall === 'emergency')} Emergency</span>
                        <span class="check-item">${chk(natureOfCall === 'transport')} Transport</span>
                        <span class="check-item">${chk(natureOfCall === 'medical assistance')} Med. Assist</span>
                        <span class="check-item">${chk(natureOfCall === 'standby')} Standby</span>
                        <span class="check-item">${chk(natureOfCall === 'non-emergency')} Non-Emerg</span>
                    </span>
                </div>
            </td>
        </tr>
    </table>

    <!-- 2. OPERATIONAL RESPONSE TIMES -->
    <div class="section-header">2. Operational Response Timeline</div>
    <table class="timeline-table">
        <tr>
            <th>Call / Incident</th>
            <th>Dispatch Time</th>
            <th>En Route</th>
            <th>On Scene</th>
            <th>Transporting</th>
            <th>Arrived Facility</th>
            <th>Departed Facility</th>
        </tr>
        <tr>
            <td>${formatTime(incident.created_at ? new Date(incident.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : null)}</td>
            <td>${formatTime(record.dispatch_time)}</td>
            <td>${formatTime(record.en_route_time)}</td>
            <td>${formatTime(record.on_scene_time)}</td>
            <td>${formatTime(record.transport_time)}</td>
            <td>${formatTime(record.arrived_hf_time)}</td>
            <td>${formatTime(record.departed_hf_time)}</td>
        </tr>
    </table>

    <!-- 3. VITAL SIGNS (3 TAKES) -->
    <div class="section-header">3. Serial Vital Signs Monitoring</div>
    <table class="vitals-table">
        <tr>
            <th style="width: 14%;">Take</th>
            <th style="width: 14%;">Time</th>
            <th style="width: 15%;">BP (mmHg)</th>
            <th style="width: 14%;">Pulse (bpm)</th>
            <th style="width: 14%;">Resp Rate (cpm)</th>
            <th style="width: 14%;">SpO2 (%)</th>
            <th style="width: 15%;">Temp (&deg;C)</th>
        </tr>
        <tr>
            <td style="font-weight: bold; background: #fafafa;">1st Take</td>
            <td>${formatTime(take1.time)}</td>
            <td style="font-weight: bold;">${emptyLine(take1.bp, '—')}</td>
            <td>${emptyLine(take1.pr, '—')}</td>
            <td>${emptyLine(take1.rr, '—')}</td>
            <td>${take1.spo2 ? take1.spo2 + '%' : '—'}</td>
            <td>${take1.temp ? take1.temp + '°C' : '—'}</td>
        </tr>
        <tr>
            <td style="font-weight: bold; background: #fafafa;">2nd Take</td>
            <td>${formatTime(take2.time)}</td>
            <td style="font-weight: bold;">${emptyLine(take2.bp, '—')}</td>
            <td>${emptyLine(take2.pr, '—')}</td>
            <td>${emptyLine(take2.rr, '—')}</td>
            <td>${take2.spo2 ? take2.spo2 + '%' : '—'}</td>
            <td>${take2.temp ? take2.temp + '°C' : '—'}</td>
        </tr>
        <tr>
            <td style="font-weight: bold; background: #fafafa;">3rd Take</td>
            <td>${formatTime(take3.time)}</td>
            <td style="font-weight: bold;">${emptyLine(take3.bp, '—')}</td>
            <td>${emptyLine(take3.pr, '—')}</td>
            <td>${emptyLine(take3.rr, '—')}</td>
            <td>${take3.spo2 ? take3.spo2 + '%' : '—'}</td>
            <td>${take3.temp ? take3.temp + '°C' : '—'}</td>
        </tr>
    </table>

    <!-- 4. GLASGOW COMA SCALE (GCS) -->
    <div class="section-header">4. Glasgow Coma Scale (GCS) Assessment</div>
    <table class="gcs-table">
        <tr>
            <th style="width: 25%;">Eye Opening (1-4)</th>
            <th style="width: 25%;">Verbal Response (1-5)</th>
            <th style="width: 25%;">Motor Response (1-6)</th>
            <th style="width: 25%; background: #e2e8f0;">Total GCS Score (/15)</th>
        </tr>
        <tr>
            <td>${emptyLine(gcs.eye, '—')}</td>
            <td>${emptyLine(gcs.verbal, '—')}</td>
            <td>${emptyLine(gcs.motor, '—')}</td>
            <td style="font-size: 10pt; color: #b91c1c; background: #f8fafc;">
                ${gcs.total ? `${gcs.total} / 15` : '—'}
            </td>
        </tr>
    </table>

    <!-- 5. CLINICAL ASSESSMENT & BODY DIAGRAM -->
    <div class="section-header">5. Physical Assessment & Body Injury Mapping</div>
    <table class="assessment-grid">
        <tr>
            <!-- Anatomical Diagram with Markers -->
            <td style="width: 44%; text-align: center;">
                <span class="field-lbl" style="text-align: center; margin-bottom: 3px;">Anatomical Injury Map (Front / Back)</span>
                <div class="body-diagram-wrap">
                    <img src="/images/bodydiagram.png" class="body-diagram-img" alt="Body Diagram" />
                    ${assessmentMarkers.map((m, idx) => {
                        const xPos = typeof m.x === 'number' && m.x <= 1 ? (m.x * 100) + '%' : (m.x ? `${Math.min(95, Math.max(5, (m.x / 320) * 100))}%` : '50%');
                        const yPos = typeof m.y === 'number' && m.y <= 1 ? (m.y * 100) + '%' : (m.y ? `${Math.min(95, Math.max(5, (m.y / 360) * 100))}%` : '50%');
                        return `<div class="body-marker-pin" style="left: ${xPos}; top: ${yPos};" title="${m.label || ''}">${idx + 1}</div>`;
                    }).join('')}
                </div>
                <div style="font-size: 6.5pt; font-weight: bold; color: #555; margin-top: 2px;">
                    &larr; FRONT &bull; &bull; &bull; BACK &rarr;
                </div>
            </td>

            <!-- Injury Marker Legend & Clinical Notes -->
            <td style="width: 56%;">
                <span class="field-lbl">Identified Injuries / Body Markers</span>
                <div style="min-height: 48px; font-size: 7.5pt; margin-bottom: 4px;">
                    ${assessmentMarkers.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt;">
                            ${assessmentMarkers.map((m, idx) => `
                                <tr>
                                    <td style="width: 18px; font-weight: bold; color: #b91c1c; vertical-align: top;">#${idx + 1}</td>
                                    <td style="font-weight: bold;">${m.label || m.type || 'Injury'}</td>
                                    <td style="color: #444; font-size: 7pt;">${m.notes || m.description || ''}</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : '<span style="color: #666; font-style: italic;">No specific injury markers pinned.</span>'}
                </div>

                <span class="field-lbl" style="border-top: 1px dashed #ccc; padding-top: 3px;">Clinical Findings / Assessment Tags</span>
                <div style="font-size: 7.5pt; font-weight: 600; margin-bottom: 4px;">
                    ${assessmentFindings.length > 0 ? assessmentFindings.join(' &bull; ') : '<span style="color: #666; font-style: italic;">None recorded</span>'}
                </div>

                <span class="field-lbl" style="border-top: 1px dashed #ccc; padding-top: 3px;">Special Instructions & Treatment Notes</span>
                <div style="font-size: 7.5pt; line-height: 1.3; min-height: 38px; background: #fafafa; border: 1px solid #ddd; padding: 3px;">
                    ${record.special_instructions || '<span style="color: #888; font-style: italic;">No additional instructions entered.</span>'}
                </div>
            </td>
        </tr>
    </table>

    <!-- 6. INCIDENT DISPOSITION & DESTINATION -->
    <div class="section-header">6. Incident / Patient Disposition & Transport</div>
    <table class="dispo-table">
        <tr>
            <td style="width: 50%;">
                <span class="field-lbl">Patient Disposition</span>
                <div style="font-size: 7.5pt; margin-top: 2px;">
                    <div style="margin-bottom: 2px;">${chk(isTransported)} <b>Treated and Transported</b></div>
                    <div style="margin-bottom: 2px;">${chk(hasDisp('refused transport') || (!isTransported && hasDisp('treated')))} Treated, Refused Transport</div>
                    <div style="margin-bottom: 2px;">${chk(hasDisp('refused treatment') || hasDisp('refused all'))} Refused All Care & Transport</div>
                    <div>${chk(hasDisp('cancelled') || hasDisp('dead on scene') || hasDisp('no patient'))} Cancelled / Non-Transport</div>
                </div>
            </td>
            <td style="width: 50%;">
                <span class="field-lbl">Transport Destination / Health Facility</span>
                <div class="field-val" style="font-weight: bold; margin-bottom: 4px;">
                    ${record.transported_to || (isTransported ? 'Opol Community Clinic / Hospital' : 'None (Treated on Scene / Refused)')}
                </div>
                <span class="field-lbl">Facility Personnel Received By</span>
                <div class="field-val">${record.received_by || emptyLine(null)}</div>
            </td>
        </tr>
    </table>

    <!-- 7. RESPONDING MEDICAL CREW -->
    <div class="section-header">7. Responding Medical Crew Endorsement</div>
    <table class="crew-table">
        <tr>
            <td>
                <span class="field-lbl">Team Leader</span>
                <div class="field-val">${dispatch.team_leader?.name || record.responders || emptyLine(null)}</div>
                <div class="sign-line">Signature over Printed Name</div>
            </td>
            <td>
                <span class="field-lbl">Ambulance Driver</span>
                <div class="field-val">${dispatch.driver?.name || emptyLine(null)}</div>
                <div class="sign-line">Signature over Printed Name</div>
            </td>
            <td>
                <span class="field-lbl">EMT / Care Specialist</span>
                <div class="field-val">${dispatch.emt?.name || emptyLine(null)}</div>
                <div class="sign-line">Signature over Printed Name</div>
            </td>
        </tr>
    </table>

    <!-- 8. REFUSAL WAIVER & SIGNATURES -->
    <div class="section-header">8. Refusal of Care / Transport Waiver & Acknowledgement</div>
    <div class="waiver-box">
        <b>PATIENT REFUSAL WAIVER:</b> I hereby acknowledge that emergency medical care and/or ambulance transport was offered, explained, and recommended by the MDRRMO Emergency Medical Services personnel. I voluntarily refuse further treatment and/or transport against medical advice. I release the Local Government of Opol, MDRRMO, and its EMS crew from any and all legal and medical liabilities resulting from this decision.
    </div>
    <table class="waiver-signatures">
        <tr>
            <td style="width: 50%;">
                <span class="field-lbl">Patient / Authorized Representative Signature</span>
                ${record.patient_signature ? `<img src="${record.patient_signature}" class="sig-img" alt="Patient Signature" />` : '<div style="height: 25px;"></div>'}
                <div class="sign-line">
                    ${patientFullName ? patientFullName : 'Patient Signature'} / Date: ${pcrDate}
                </div>
            </td>
            <td style="width: 50%;">
                <span class="field-lbl">Witness Signature (Crew or Relative)</span>
                ${record.witness_signature ? `<img src="${record.witness_signature}" class="sig-img" alt="Witness Signature" />` : '<div style="height: 25px;"></div>'}
                <div class="sign-line">
                    ${record.witness_name ? `Witness: ${record.witness_name}` : 'Witness Signature'} / Date: ${pcrDate}
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Official Document &bull; MDRRMO Opol Emergency Medical Services &bull; Printed on: ${new Date().toLocaleString('en-PH')} &bull; System Generated PCR #${record.id}
    </div>
</div>

<script>
    window.onload = function() {
        setTimeout(function() {
            window.focus();
            window.print();
        }, 350);
    };
</script>
</body>
</html>`;

    // Create a temporary hidden iframe to trigger print without touching the current DOM or UI
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'PCR Print Preview');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
        console.error('Failed to open print frame');
        return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Clean up iframe after print dialog completes/cancels
    const cleanup = () => {
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    };

    if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = cleanup;
    } else {
        setTimeout(cleanup, 60000);
    }
}
