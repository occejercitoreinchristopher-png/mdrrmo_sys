import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { BODY_DIAGRAM_BASE64 } from './bodyDiagramBase64';

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
    const assessmentFindings: string[] = Array.isArray(record.assessment)
        ? record.assessment
        : (typeof record.assessment === 'string' && record.assessment ? [record.assessment] : []);
    const dispositionList: string[] = Array.isArray(record.disposition)
        ? record.disposition
        : (typeof record.disposition === 'string' && record.disposition ? [record.disposition] : []);

    // 1. Date Formatting: mo/day/yr
    const formatMoDayYr = (val: string | null | undefined): string => {
        if (!val) return '___ / ___ / ______';
        const parsed = new Date(typeof val === 'string' && val.includes('-') && !val.includes('T') ? val.replace(/-/g, '/') : val);
        if (isNaN(parsed.getTime())) return String(val);
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        const yyyy = parsed.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    // 2. Time & AM/PM parser
    const parseTimeWithAmPm = (timeVal: string | null | undefined): { time: string; am: boolean; pm: boolean } => {
        if (!timeVal) return { time: ': ', am: false, pm: false };
        const str = String(timeVal).trim();
        const hasPm = /pm/i.test(str);
        const hasAm = /am/i.test(str);
        const cleanDigits = str.replace(/\s*(am|pm)/gi, '').trim();

        if (cleanDigits.includes(':')) {
            const [hStr, mStr] = cleanDigits.split(':');
            const h = parseInt(hStr, 10);
            if (!isNaN(h)) {
                if (!hasAm && !hasPm) {
                    const isPm = h >= 12;
                    const h12 = h % 12 || 12;
                    return {
                        time: `${h12}:${mStr.padStart(2, '0')}`,
                        am: !isPm,
                        pm: isPm,
                    };
                }
                return {
                    time: cleanDigits,
                    am: hasAm,
                    pm: hasPm,
                };
            }
        }
        return { time: cleanDigits || ': ', am: hasAm, pm: hasPm };
    };

    // Checkbox Helper: [ ] vs [x]
    const box = (checked: boolean) => checked
        ? `<span style="display:inline-block; width:14px; height:14px; border:1px solid #000; text-align:center; line-height:14px; font-size:10pt; font-weight:bold; margin-right:4px; vertical-align:middle; overflow:hidden;">&#10003;</span>`
        : `<span style="display:inline-block; width:14px; height:14px; border:1px solid #000; margin-right:4px; vertical-align:middle;"></span>`;

    // 3. Exact Pinpoint Calculator for Front/Back Body Diagram
    const calculatePinPosition = (m: Marker): { left: string; top: string; isRightSide: boolean } => {
        const rawX = Number(m.x) || 0;
        const rawY = Number(m.y) || 0;

        let pctX: number;
        let pctY: number;

        if (rawX <= 1 && rawY <= 1 && rawX > 0 && rawY > 0) {
            pctX = rawX * 100;
            pctY = rawY * 100;
        } else if (rawY >= 80 && rawY <= 550) {
            pctX = (rawX / 320) * 100;
            pctY = ((rawY - 115) / 320) * 100;
        } else {
            pctX = (rawX / 320) * 100;
            pctY = (rawY / 320) * 100;
        }

        pctX = Math.max(2, Math.min(98, pctX));
        pctY = Math.max(2, Math.min(98, pctY));

        return {
            left: `${pctX.toFixed(2)}%`,
            top: `${pctY.toFixed(2)}%`,
            isRightSide: pctX > 68,
        };
    };

    const patientFullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(', ')
        || patient.full_name
        || record.patient_name
        || '';

    const patientAddress = patient.address
        || [patient.house_no, patient.street, patient.barangay || patient.barangay?.barangay_name].filter(Boolean).join(', ')
        || '';

    const incidentPlace = record.place_of_incident
        || incident.incident_address
        || incident.location
        || '';

    const gender = (patient.gender || record.gender || '').toLowerCase();
    const isMale = gender === 'male';
    const isFemale = gender === 'female';

    const civilStatus = (patient.civil_status || record.civil_status || '').toLowerCase();
    const natureOfCall = (record.nature_of_call || incident.nature_of_call || '').toLowerCase();
    const chiefComplaint = record.chief_complaint || incident.chief_complaint || '';

    const tDispatch = parseTimeWithAmPm(record.dispatch_time);
    const tEnRoute = parseTimeWithAmPm(record.en_route_time);
    const tOnScene = parseTimeWithAmPm(record.on_scene_time);
    const tTransport = parseTimeWithAmPm(record.transport_time);
    const tArrivedHF = parseTimeWithAmPm(record.arrived_hf_time);
    const tDepartedHF = parseTimeWithAmPm(record.departed_hf_time);

    const v1 = vitalSigns[0] || {};
    const v2 = vitalSigns[1] || {};
    const v3 = vitalSigns[2] || {};
    const v1Time = parseTimeWithAmPm(v1.time);
    const v2Time = parseTimeWithAmPm(v2.time);
    const v3Time = parseTimeWithAmPm(v3.time);

    const allAssessments = [
        ...assessmentFindings.map(f => String(f).toLowerCase()),
        ...assessmentMarkers.map(m => String(m.label || m.type || '').toLowerCase())
    ];
    const isAssessed = (name: string) => allAssessments.some(a => a.includes(name.toLowerCase()));

    const allDispos = dispositionList.map(d => String(d).toLowerCase());
    const hasDispo = (kw: string) => allDispos.some(d => d.includes(kw.toLowerCase()));
    const isTransported = record.transported || hasDispo('transport');

    const respondersList = [
        dispatch.team_leader?.name,
        dispatch.driver?.name,
        dispatch.emt?.name,
        record.responders
    ].filter(Boolean);
    const respondersText = respondersList.length > 0 ? Array.from(new Set(respondersList)).join(', ') : '';

    const gcsEye = Number(gcs.eye) || null;
    const gcsVerbal = Number(gcs.verbal) || null;
    const gcsMotor = Number(gcs.motor) || null;
    const gcsTotal = gcs.total || (gcsEye && gcsVerbal && gcsMotor ? gcsEye + gcsVerbal + gcsMotor : '');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PCR #${record.id} - ${patientFullName || 'Patient Care Record'}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            font-size: 8pt;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            line-height: 1.3;
            width: 816px;
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: antialiased;
        }

        .pcr-page {
            width: 793px;
            margin: 0 auto;
            background: #fff;
            padding: 5px;
        }

        .header-wrap {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            margin-bottom: 2mm;
        }
        .header-title-box {
            text-align: center;
            flex: 1;
            padding: 0 5px;
        }
        .header-title-top {
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0 0 4px 0;
        }
        .header-title-main {
            font-size: 14pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }
        .rev-tag {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 7.5pt;
            color: #333;
        }

        .section-label-italic {
            font-size: 9pt;
            font-style: italic;
            text-decoration: underline;
            font-weight: bold;
            margin-bottom: 2mm;
            display: inline-block;
            letter-spacing: 0.2px;
        }

        table.form-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-bottom: 2mm;
            table-layout: fixed;
        }
        table.form-grid td, table.form-grid th {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 8pt;
            overflow: hidden;
            word-wrap: break-word;
        }

        .field-name {
            font-size: 8pt;
            font-weight: bold;
            margin-right: 4px;
        }
        .field-data {
            font-size: 8.5pt;
            font-weight: 600;
            color: #000;
            display: inline-block;
        }

        .time-cell {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 8pt;
        }
        .time-digits {
            font-size: 8.5pt;
            font-weight: bold;
            min-width: 45px;
            display: inline-block;
            text-align: center;
        }

        .mid-columns {
            display: flex;
            gap: 2.5mm;
            width: 100%;
            margin-bottom: 2mm;
        }
        .left-col {
            width: 50%;
        }
        .right-col {
            width: 50%;
        }

        .box-title-bar {
            background: #fff;
            border: 1px solid #000;
            border-bottom: none;
            font-size: 9pt;
            font-weight: bold;
            padding: 3px 6px;
            text-transform: uppercase;
        }

        .assessment-box {
            border: 1px solid #000;
            padding: 6px;
        }
        .assess-cols {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            margin-bottom: 2mm;
        }
        .assess-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .body-canvas {
            position: relative;
            width: 220px;
            height: 220px;
            margin: 0 auto;
            text-align: center;
        }
        .body-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        .pin-marker {
            position: absolute;
            width: 0;
            height: 0;
            z-index: 10;
        }
        .pin-dot {
            position: absolute;
            top: -8px;
            left: -8px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #dc2626;
            color: #fff;
            font-size: 7.5pt;
            font-weight: 900;
            text-align: center;
            line-height: 15px; /* Adjusting for border */
            border: 1.5px solid #000;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .pin-text {
            position: absolute;
            top: -9px;
            left: 11px;
            background: #fff;
            border: 1px solid #000;
            padding: 3px 6px;
            font-size: 7pt;
            font-weight: bold;
            color: #000;
            white-space: nowrap;
            line-height: 1.2;
            display: inline-block;
        }
        .pin-text-left {
            left: auto;
            right: 11px;
        }

        .special-box {
            border: 1px solid #000;
            padding: 4px 6px;
            margin-top: 2mm;
            min-height: 52px;
        }
        .line-rule {
            border-bottom: 1px solid #999;
            height: 16px;
            margin-top: 2px;
        }

        table.vitals-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 8pt;
            text-align: center;
            margin-bottom: 2mm;
            table-layout: fixed;
        }
        table.vitals-grid th, table.vitals-grid td {
            border: 1px solid #000;
            padding: 4px 3px;
        }
        table.vitals-grid th {
            font-weight: bold;
            background: #f8fafc;
        }

        table.gcs-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
            line-height: 1.3;
            table-layout: fixed;
        }
        table.gcs-grid td, table.gcs-grid th {
            border: 1px solid #000;
            padding: 4px 5px;
            word-wrap: break-word;
        }
        .gcs-head-col {
            font-weight: bold;
            width: 35%;
            vertical-align: top;
            background: #fafafa;
        }
        .gcs-desc-col {
            width: 55%;
        }
        .gcs-score-col {
            width: 10%;
            text-align: center;
            font-weight: bold;
        }

        .lower-mid {
            display: flex;
            gap: 2.5mm;
            width: 100%;
            margin-bottom: 2mm;
        }
        .dispo-box {
            width: 50%;
            border: 1px solid #000;
            padding: 6px;
        }
        .dispo-cols {
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
        }
        .dispo-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 49%;
        }

        .resp-box {
            width: 50%;
            border: 1px solid #000;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 8pt;
        }
        .resp-line-item {
            margin-bottom: 8px;
        }
        .underline-span {
            border-bottom: 1px solid #000;
            display: inline-block;
            font-weight: bold;
            padding: 0 4px 2px 4px;
        }

        .waiver-wrapper {
            border: 1.5px solid #000;
            padding: 6px 8px;
            font-size: 8pt;
            position: relative;
        }
        .waiver-title {
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 4px;
        }
        .waiver-statement {
            line-height: 1.4;
            text-align: justify;
            margin-bottom: 6px;
        }
        .waiver-bottom-cols {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 6px;
        }
        .sig-col {
            width: 48%;
        }
        .sig-holder-img {
            max-height: 32px;
            max-width: 150px;
            object-fit: contain;
            display: block;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>

<div class="pcr-page">
    <div class="header-wrap">
        <div style="width: 100px; text-align: left;">
            <img src="/images/opol_logo.png" alt="Opol Logo" style="width: 90px; height: 90px; object-fit: contain;" />
        </div>

        <div class="header-title-box">
            <h2 class="header-title-top">LOCAL DISASTER RISK REDUCTION MANAGEMENT OFFICE</h2>
            <h1 class="header-title-main">PATIENT CARE RECORD</h1>
        </div>

        <div style="width: 100px; text-align: right; position: relative;">
            <span class="rev-tag" style="top: -5px; right: 0;">Rev. 2.0</span>
            <img src="/images/drrm_logo.png" alt="Opol DRRM Logo" style="width: 80px; height: 80px; object-fit: contain; margin-top: 5px;" />
        </div>
    </div>

    <span class="section-label-italic">Patient Information</span>
    <table class="form-grid">
        <tr>
            <td colspan="4" style="width: 65%;">
                <span class="field-name">Name of Patient:</span>
                <span class="field-data">${patientFullName || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
            </td>
            <td colspan="2" style="width: 35%;">
                <span class="field-name">Date (mo/day/yr):</span>
                <span class="field-data" style="font-family: monospace;">${formatMoDayYr(record.record_date || record.created_at)}</span>
            </td>
        </tr>
        <tr>
            <td style="width: 32%;">
                <span class="field-name">Contact #:</span>
                <span class="field-data">${patient.contact_number || record.contact_number || ''}</span>
            </td>
            <td style="width: 14%;">
                <span class="field-name">Age:</span>
                <span class="field-data">${patient.age ? patient.age : (record.age ? record.age : '')}</span>
            </td>
            <td style="width: 12%;">
                <span class="field-name">Male</span> ${box(isMale)}
            </td>
            <td style="width: 12%;">
                <span class="field-name">Female</span> ${box(isFemale)}
            </td>
            <td colspan="2">
                <span class="field-name">Caller #:</span>
                <span class="field-data">${record.caller_no || incident.caller_phone_number || ''}</span>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="field-name">Civil Status:</span>
                <span>
                    ${box(civilStatus === 'single')} Single &nbsp;&nbsp;
                    ${box(civilStatus === 'married')} Married &nbsp;&nbsp;
                    ${box(civilStatus === 'widowed')} Widowed &nbsp;&nbsp;
                    ${box(civilStatus === 'child')} Child &nbsp;&nbsp;
                    ${box(civilStatus === 'separated')} Separated
                </span>
            </td>
            <td colspan="2">
                <span class="field-name">Dispatch Time:</span>
                <span class="time-cell">
                    <span class="time-digits">${tDispatch.time}</span>
                    <span>${box(tDispatch.am)} AM</span>
                    <span>${box(tDispatch.pm)} PM</span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="field-name">Address:</span>
                <span class="field-data">${patientAddress || ''}</span>
            </td>
            <td colspan="2">
                <span class="field-name">En Route Time:</span>
                <span class="time-cell">
                    <span class="time-digits">${tEnRoute.time}</span>
                    <span>${box(tEnRoute.am)} AM</span>
                    <span>${box(tEnRoute.pm)} PM</span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="field-name">Place of Incident:</span>
                <span class="field-data">${incidentPlace || ''}</span>
            </td>
            <td colspan="2">
                <span class="field-name">On Scene Time:</span>
                <span class="time-cell">
                    <span class="time-digits">${tOnScene.time}</span>
                    <span>${box(tOnScene.am)} AM</span>
                    <span>${box(tOnScene.pm)} PM</span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="field-name">Chief of Complaint:</span>
                <span class="field-data" style="font-weight: bold;">${chiefComplaint || ''}</span>
            </td>
            <td colspan="2">
                <span class="field-name">Transport Time:</span>
                <span class="time-cell">
                    <span class="time-digits">${tTransport.time}</span>
                    <span>${box(tTransport.am)} AM</span>
                    <span>${box(tTransport.pm)} PM</span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="4" rowspan="2" style="vertical-align: top;">
                <span class="field-name" style="display:block; margin-bottom: 4px;">Nature of Call:</span>
                <div style="line-height: 1.8;">
                    ${box(natureOfCall === 'emergency')} Emergency &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'transport')} Transport &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'standby')} Standby<br>
                    ${box(natureOfCall === 'non-emergency')} Non-Emergency &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'medical assistance')} Medical Assistance
                </div>
            </td>
            <td colspan="2">
                <span class="field-name">Arrived HF:</span>
                <span class="time-cell">
                    <span class="time-digits">${tArrivedHF.time}</span>
                    <span>${box(tArrivedHF.am)} AM</span>
                    <span>${box(tArrivedHF.pm)} PM</span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="field-name">Departed HF:</span>
                <span class="time-cell">
                    <span class="time-digits">${tDepartedHF.time}</span>
                    <span>${box(tDepartedHF.am)} AM</span>
                    <span>${box(tDepartedHF.pm)} PM</span>
                </span>
            </td>
        </tr>
    </table>

    <div class="mid-columns">
        <div class="left-col">
            <div class="box-title-bar">ASSESSMENT</div>
            <div class="assessment-box">
                <div class="assess-cols">
                    <div class="assess-col">
                        <span>${box(isAssessed('abrasion'))} Abrasion</span>
                        <span>${box(isAssessed('amputation'))} Amputation</span>
                        <span>${box(isAssessed('avulsion'))} Avulsion</span>
                        <span>${box(isAssessed('burn'))} Burns</span>
                    </div>
                    <div class="assess-col">
                        <span>${box(isAssessed('contusion'))} Contusion</span>
                        <span>${box(isAssessed('fractur'))} Fractured</span>
                        <span>${box(isAssessed('hematoma'))} Hematoma</span>
                        <span>${box(isAssessed('incision'))} Incision</span>
                    </div>
                    <div class="assess-col">
                        <span>${box(isAssessed('laceration'))} Laceration</span>
                        <span>${box(isAssessed('puncture'))} Punctured</span>
                        <span>${box(isAssessed('swelling'))} Swelling</span>
                        <span>${box(isAssessed('tenderness'))} Tenderness</span>
                    </div>
                </div>

                <div class="body-canvas">
                    <img src="${BODY_DIAGRAM_BASE64}" class="body-img" alt="Anatomical Diagram" />
                    ${assessmentMarkers.map((m, idx) => {
        const pos = calculatePinPosition(m);
        const labelText = m.label || m.type || '';
        return `
                            <div class="pin-marker" style="left: ${pos.left}; top: ${pos.top};" title="${labelText}">
                                <div class="pin-dot">${idx + 1}</div>
                                ${labelText ? `<div class="pin-text ${pos.isRightSide ? 'pin-text-left' : ''}">${labelText}</div>` : ''}
                            </div>
                        `;
    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-around; font-size: 8pt; font-weight: bold; margin-top: 4px;">
                    <span>FRONT</span>
                    <span>BACK</span>
                </div>

                <div class="special-box">
                    <span class="field-name">SPECIAL INSTRUCTIONS:</span>
                    <span class="field-data" style="margin-left: 4px; font-weight: bold;">
                        ${record.special_instructions || ''}
                    </span>
                    <div class="line-rule"></div>
                    <div class="line-rule"></div>
                </div>
            </div>
        </div>

        <div class="right-col">
            <div class="box-title-bar">VITAL SIGNS</div>
            <table class="vitals-grid">
                <tr>
                    <th style="width: 25%;"></th>
                    <th style="width: 25%;">1ST TAKE</th>
                    <th style="width: 25%;">2ND</th>
                    <th style="width: 25%;">3RD</th>
                </tr>
                <tr>
                    <td style="font-weight: bold;">TIME</td>
                    <td>
                        <span style="font-weight: bold;">${v1Time.time}</span><br>
                        <span>${box(v1Time.am)}AM ${box(v1Time.pm)}PM</span>
                    </td>
                    <td>
                        <span style="font-weight: bold;">${v2Time.time}</span><br>
                        <span>${box(v2Time.am)}AM ${box(v2Time.pm)}PM</span>
                    </td>
                    <td>
                        <span style="font-weight: bold;">${v3Time.time}</span><br>
                        <span>${box(v3Time.am)}AM ${box(v3Time.pm)}PM</span>
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">O2 SAT</td>
                    <td style="font-weight: bold;">${v1.spo2 ? v1.spo2 : ''}</td>
                    <td style="font-weight: bold;">${v2.spo2 ? v2.spo2 : ''}</td>
                    <td style="font-weight: bold;">${v3.spo2 ? v3.spo2 : ''}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">PR/HR</td>
                    <td style="font-weight: bold;">${v1.pr ? v1.pr : ''}</td>
                    <td style="font-weight: bold;">${v2.pr ? v2.pr : ''}</td>
                    <td style="font-weight: bold;">${v3.pr ? v3.pr : ''}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">RR</td>
                    <td style="font-weight: bold;">${v1.rr ? v1.rr : ''}</td>
                    <td style="font-weight: bold;">${v2.rr ? v2.rr : ''}</td>
                    <td style="font-weight: bold;">${v3.rr ? v3.rr : ''}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">BP</td>
                    <td style="font-weight: bold;">${v1.bp ? v1.bp : ''}</td>
                    <td style="font-weight: bold;">${v2.bp ? v2.bp : ''}</td>
                    <td style="font-weight: bold;">${v3.bp ? v3.bp : ''}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">TEMP</td>
                    <td style="font-weight: bold;">${v1.temp ? v1.temp : ''}</td>
                    <td style="font-weight: bold;">${v2.temp ? v2.temp : ''}</td>
                    <td style="font-weight: bold;">${v3.temp ? v3.temp : ''}</td>
                </tr>
            </table>

            <div class="box-title-bar" style="border-top: 1px solid #000;">GLASGOW COMA SCALE</div>
            <table class="gcs-grid">
                <tr>
                    <td class="gcs-head-col" rowspan="4">Best eye response (E)</td>
                    <td class="gcs-desc-col">Spontaneous - open with blinking at baseline</td>
                    <td class="gcs-score-col" style="${gcsEye === 4 ? 'background:#e2e8f0; font-weight:900;' : ''}">4</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Opens to verbal command, speech, or shout</td>
                    <td class="gcs-score-col" style="${gcsEye === 3 ? 'background:#e2e8f0; font-weight:900;' : ''}">3</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Opens to pain, not applied to face</td>
                    <td class="gcs-score-col" style="${gcsEye === 2 ? 'background:#e2e8f0; font-weight:900;' : ''}">2</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">None</td>
                    <td class="gcs-score-col" style="${gcsEye === 1 ? 'background:#e2e8f0; font-weight:900;' : ''}">1</td>
                </tr>

                <tr>
                    <td class="gcs-head-col" rowspan="5">Best verbal response (V)</td>
                    <td class="gcs-desc-col">Oriented</td>
                    <td class="gcs-score-col" style="${gcsVerbal === 5 ? 'background:#e2e8f0; font-weight:900;' : ''}">5</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Confused conversation, but able to answer questions</td>
                    <td class="gcs-score-col" style="${gcsVerbal === 4 ? 'background:#e2e8f0; font-weight:900;' : ''}">4</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Inappropriate responses, words discernible</td>
                    <td class="gcs-score-col" style="${gcsVerbal === 3 ? 'background:#e2e8f0; font-weight:900;' : ''}">3</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Incomprehensible speech</td>
                    <td class="gcs-score-col" style="${gcsVerbal === 2 ? 'background:#e2e8f0; font-weight:900;' : ''}">2</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">None</td>
                    <td class="gcs-score-col" style="${gcsVerbal === 1 ? 'background:#e2e8f0; font-weight:900;' : ''}">1</td>
                </tr>

                <tr>
                    <td class="gcs-head-col" rowspan="6">Best motor response (M)</td>
                    <td class="gcs-desc-col">Obeys commands for movement</td>
                    <td class="gcs-score-col" style="${gcsMotor === 6 ? 'background:#e2e8f0; font-weight:900;' : ''}">6</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Purposeful movement to painful stimulus</td>
                    <td class="gcs-score-col" style="${gcsMotor === 5 ? 'background:#e2e8f0; font-weight:900;' : ''}">5</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Withdraws from pain</td>
                    <td class="gcs-score-col" style="${gcsMotor === 4 ? 'background:#e2e8f0; font-weight:900;' : ''}">4</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Abnormal (spastic) flexion, decorticate posture</td>
                    <td class="gcs-score-col" style="${gcsMotor === 3 ? 'background:#e2e8f0; font-weight:900;' : ''}">3</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">Extensor (rigid) response, decerebrate posture</td>
                    <td class="gcs-score-col" style="${gcsMotor === 2 ? 'background:#e2e8f0; font-weight:900;' : ''}">2</td>
                </tr>
                <tr>
                    <td class="gcs-desc-col">None</td>
                    <td class="gcs-score-col" style="${gcsMotor === 1 ? 'background:#e2e8f0; font-weight:900;' : ''}">1</td>
                </tr>

                <tr style="background: #f1f5f9;">
                    <td colspan="2" style="font-weight: 900; text-align: center; font-size: 8.5pt; letter-spacing: 1px;">TOTAL</td>
                    <td class="gcs-score-col" style="font-size: 9.5pt; font-weight: 900;">${gcsTotal || ''}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="lower-mid">
        <div class="dispo-box">
            <span class="field-name" style="margin-bottom: 4px; display: block;">INCIDENT/PATIENT DISPOSITION</span>
            <div class="dispo-cols">
                <div class="dispo-col">
                    <span>${box(hasDispo('recovered'))} Treated, Recovered</span>
                    <span>${box(hasDispo('hospital'))} Treated, Transported to Hospital</span>
                    <span>${box(hasDispo('rhu'))} Treated, Transferred Care to RHU</span>
                    <span>${box(hasDispo('private veh'))} Treated, Transported by Private Veh.</span>
                    <span>${box(hasDispo('refused transport'))} Treated, Refused Transport</span>
                    <span>${box(hasDispo('no treatment, transport'))} No Treatment, Transport Required</span>
                </div>
                <div class="dispo-col">
                    <span>${box(hasDispo('false call'))} False Call</span>
                    <span>${box(hasDispo('cancelled'))} Cancelled</span>
                    <span>${box(hasDispo('no patient'))} No Patient Found</span>
                    <span>${box(hasDispo('dead'))} Dead at Scene</span>
                    <span>${box(hasDispo('refused care') || hasDispo('refused all'))} Patient Refused Care</span>
                    <span>${box(hasDispo('no treatment required'))} No Treatment Required</span>
                </div>
            </div>
        </div>

        <div class="resp-box">
            <div class="resp-line-item">
                <span class="field-name">Responders:</span>
                <span class="underline-span" style="width: calc(100% - 90px);">${respondersText || '&nbsp;'}</span>
            </div>
            <div class="resp-line-item">
                <span class="field-name">Transported to:</span>
                <span class="underline-span" style="width: calc(100% - 110px);">${record.transported_to || (isTransported ? 'Opol Community Clinic' : '&nbsp;')}</span>
            </div>
            <div class="resp-line-item" style="margin-bottom: 0;">
                <span class="field-name">Received by:</span>
                <span class="underline-span" style="width: calc(100% - 90px);">${record.received_by || '&nbsp;'}</span>
            </div>
        </div>
    </div>

    <div class="waiver-wrapper">
        <div class="waiver-title">WAIVER</div>
        <div class="waiver-statement">
            By signing this form, I <b style="text-decoration: underline; padding: 0 4px;">${patientFullName || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</b> is releasing OPOL RESCUE TEAM of any liability and/or medical claim resulting from my decision to refuse care against medical advice.
        </div>

        <div class="waiver-bottom-cols">
            <div class="sig-col">
                <div style="min-height: 35px; display: flex; align-items: flex-end;">
                    ${(() => {
            const effectivePatientSig = record.patient_signature || record.waiver_signature;
            const isPatientUnableToSign = record.patient_signature === 'UNABLE_TO_SIGN' || record.waiver_signature === 'UNABLE_TO_SIGN';
            if (!isPatientUnableToSign && effectivePatientSig && String(effectivePatientSig).startsWith('data:image')) {
                return `<img src="${effectivePatientSig}" class="sig-holder-img" alt="Signature" />`;
            }
            if (isPatientUnableToSign) {
                return `<span style="font-size: 8pt; font-weight: bold; color: #b91c1c; font-style: italic; margin-bottom: 4px;">[ PATIENT UNABLE TO SIGN / UNCONSCIOUS ]</span>`;
            }
            return '';
        })()}
                </div>
                <div style="margin-bottom: 4px;">
                    <span class="field-name">SIGNATURE:</span>
                    <span style="border-bottom: 1px solid #000; display: inline-block; width: 140px;"></span>
                </div>
                <div>
                    <span class="field-name">DATE:</span>
                    <span style="border-bottom: 1px solid #000; display: inline-block; width: 175px; font-weight: bold; padding-left: 4px;">
                        ${formatMoDayYr(record.record_date || record.created_at)}
                    </span>
                </div>
            </div>

            <div class="sig-col">
                <span class="field-name" style="display: block; margin-bottom: 4px;">WITNESS INFORMATION</span>
                <div style="margin-bottom: 4px;">
                    <span class="field-name">NAME:</span>
                    <span style="border-bottom: 1px solid #000; display: inline-block; width: 190px; font-weight: bold; padding-left: 4px;">
                        ${record.witness_name || '&nbsp;'}
                    </span>
                </div>
                <div style="min-height: 35px; display: flex; align-items: flex-end;">
                    ${record.witness_signature ? `<img src="${record.witness_signature}" class="sig-holder-img" alt="Witness Signature" />` : ''}
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>`;

    const patientName = (
        [patient.first_name, patient.middle_name, patient.last_name]
            .filter(Boolean)
            .join('_') || 'Patient'
    ).replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `PCR_${patientName}_${dateStr}.pdf`;

    downloadHtmlAsPdf(html, filename);
}

async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '816px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '99999';
    iframe.setAttribute('title', 'PDF Render Frame');
    document.body.appendChild(iframe);

    const cleanup = () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    };

    try {
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) throw new Error('Failed to access iframe document');

        doc.open();
        doc.write(html);
        doc.close();

        await new Promise(resolve => setTimeout(resolve, 800));

        const body = doc.body;
        if (!body) throw new Error('iframe body not found');

        const canvas = await html2canvas(body, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 816,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.97);

        const pdfW = 210;
        const pdfH = (canvas.height * pdfW) / canvas.width;

        const pdf = new jsPDF({
            orientation: pdfH > pdfW ? 'portrait' : 'landscape',
            unit: 'mm',
            format: [pdfW, Math.max(pdfH, 297)],
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
        pdf.save(filename);

        cleanup();
    } catch (err) {
        console.error('PDF download error:', err);
        cleanup();
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);
        iframe.contentWindow?.print();
    }
}
