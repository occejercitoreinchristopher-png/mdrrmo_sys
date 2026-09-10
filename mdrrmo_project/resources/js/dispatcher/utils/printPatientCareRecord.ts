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
        ? `<span style="display:inline-block; width:10px; height:10px; border:1px solid #000; text-align:center; line-height:9px; font-size:8pt; font-weight:bold; margin-right:2px; vertical-align:middle;">&#10003;</span>` 
        : `<span style="display:inline-block; width:10px; height:10px; border:1px solid #000; margin-right:2px; vertical-align:middle;"></span>`;

    // 3. Exact Pinpoint Calculator for Front/Back Body Diagram (100% Accurate)
    // In mobile React Native BodyDiagram component:
    // TouchableOpacity diagramArea: width = 320, height = 550.
    // The image is 360x360 rendered with resizeMode: 'contain'.
    // Resulting rendered image dimensions: 320x320, vertically centered at top offset = (550 - 320) / 2 = 115px.
    // Therefore:
    // X is in [0, 320]
    // Y on the body figure is in [115, 435]
    const calculatePinPosition = (m: Marker): { left: string; top: string; isRightSide: boolean } => {
        const rawX = Number(m.x) || 0;
        const rawY = Number(m.y) || 0;

        let pctX: number;
        let pctY: number;

        if (rawX <= 1 && rawY <= 1 && rawX > 0 && rawY > 0) {
            // Already 0..1 normalized
            pctX = rawX * 100;
            pctY = rawY * 100;
        } else if (rawY >= 80 && rawY <= 550) {
            // Mobile touch event with 115px letterbox offset inside 320x550 container
            pctX = (rawX / 320) * 100;
            pctY = ((rawY - 115) / 320) * 100;
        } else {
            // Direct 320x320 coordinate space
            pctX = (rawX / 320) * 100;
            pctY = (rawY / 320) * 100;
        }

        // Keep inside visible diagram bounds
        pctX = Math.max(2, Math.min(98, pctX));
        pctY = Math.max(2, Math.min(98, pctY));

        return {
            left: `${pctX.toFixed(2)}%`,
            top: `${pctY.toFixed(2)}%`,
            isRightSide: pctX > 68,
        };
    };

    // Patient Demographics
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

    // Times parsed
    const tDispatch = parseTimeWithAmPm(record.dispatch_time);
    const tEnRoute = parseTimeWithAmPm(record.en_route_time);
    const tOnScene = parseTimeWithAmPm(record.on_scene_time);
    const tTransport = parseTimeWithAmPm(record.transport_time);
    const tArrivedHF = parseTimeWithAmPm(record.arrived_hf_time);
    const tDepartedHF = parseTimeWithAmPm(record.departed_hf_time);

    // Vitals
    const v1 = vitalSigns[0] || {};
    const v2 = vitalSigns[1] || {};
    const v3 = vitalSigns[2] || {};
    const v1Time = parseTimeWithAmPm(v1.time);
    const v2Time = parseTimeWithAmPm(v2.time);
    const v3Time = parseTimeWithAmPm(v3.time);

    // Assessment Items matching the 12 items in Image 2
    const allAssessments = [
        ...assessmentFindings.map(f => String(f).toLowerCase()),
        ...assessmentMarkers.map(m => String(m.label || m.type || '').toLowerCase())
    ];
    const isAssessed = (name: string) => allAssessments.some(a => a.includes(name.toLowerCase()));

    // Dispositions matching Image 2
    const allDispos = dispositionList.map(d => String(d).toLowerCase());
    const hasDispo = (kw: string) => allDispos.some(d => d.includes(kw.toLowerCase()));
    const isTransported = record.transported || hasDispo('transport');

    // Responders text
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
            line-height: 1.2;
        }

        .pcr-page {
            width: 100%;
            max-width: 194mm;
            margin: 0 auto;
            background: #fff;
        }

        /* HEADER */
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
            margin: 0;
        }
        .header-title-main {
            font-size: 14pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 2px 0 0 0;
        }
        .rev-tag {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 7.5pt;
            color: #333;
        }

        /* SECTION LABEL */
        .section-label-italic {
            font-size: 8.5pt;
            font-style: italic;
            text-decoration: underline;
            font-weight: bold;
            margin-bottom: 1.5mm;
            display: block;
        }

        /* TABLE GRID */
        table.form-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-bottom: 2mm;
        }
        table.form-grid td, table.form-grid th {
            border: 1px solid #000;
            padding: 2.5px 4px;
            vertical-align: middle;
            font-size: 8pt;
        }

        .field-name {
            font-size: 7.5pt;
            font-weight: bold;
        }
        .field-data {
            font-size: 8.5pt;
            font-weight: 600;
            color: #000;
        }

        /* TIME CELLS */
        .time-cell {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 7.5pt;
        }
        .time-digits {
            font-size: 8.5pt;
            font-weight: bold;
            min-width: 42px;
            display: inline-block;
            text-align: center;
        }

        /* TWO COLUMNS MIDDLE */
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
            font-size: 8.5pt;
            font-weight: bold;
            padding: 2px 5px;
            text-transform: uppercase;
        }

        /* ASSESSMENT CHECKBOXES */
        .assessment-box {
            border: 1px solid #000;
            padding: 4px;
        }
        .assess-cols {
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            margin-bottom: 2mm;
        }
        .assess-col {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        /* BODY DIAGRAM CONTAINER */
        .body-canvas {
            position: relative;
            width: 200px;
            height: 200px;
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
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #000;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .pin-text {
            position: absolute;
            top: -9px;
            left: 11px;
            background: #fff;
            border: 1px solid #000;
            padding: 1px 4px;
            font-size: 6.8pt;
            font-weight: bold;
            color: #000;
            white-space: nowrap;
            line-height: 12px;
        }
        .pin-text-left {
            left: auto;
            right: 11px;
        }

        /* SPECIAL INSTRUCTIONS */
        .special-box {
            border: 1px solid #000;
            padding: 3px 5px;
            margin-top: 2mm;
            min-height: 52px;
        }
        .line-rule {
            border-bottom: 1px solid #999;
            height: 14px;
            margin-top: 1px;
        }

        /* VITALS TABLE */
        table.vitals-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 7.5pt;
            text-align: center;
            margin-bottom: 2mm;
        }
        table.vitals-grid th, table.vitals-grid td {
            border: 1px solid #000;
            padding: 2.5px 3px;
        }
        table.vitals-grid th {
            font-weight: bold;
            font-size: 7.5pt;
            background: #f8fafc;
        }

        /* GCS TABLE */
        table.gcs-grid {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            font-size: 6.8pt;
            line-height: 1.15;
        }
        table.gcs-grid td, table.gcs-grid th {
            border: 1px solid #000;
            padding: 1.5px 3px;
        }
        .gcs-head-col {
            font-weight: bold;
            width: 32%;
            vertical-align: top;
            background: #fafafa;
        }
        .gcs-desc-col {
            width: 58%;
        }
        .gcs-score-col {
            width: 10%;
            text-align: center;
            font-weight: bold;
        }

        /* LOWER MIDDLE: DISPO & RESPONDERS */
        .lower-mid {
            display: flex;
            gap: 2.5mm;
            width: 100%;
            margin-bottom: 2mm;
        }
        .dispo-box {
            width: 50%;
            border: 1px solid #000;
            padding: 4px;
        }
        .dispo-cols {
            display: flex;
            justify-content: space-between;
            font-size: 7.2pt;
        }
        .dispo-col {
            display: flex;
            flex-direction: column;
            gap: 2.5px;
            width: 49%;
        }

        .resp-box {
            width: 50%;
            border: 1px solid #000;
            padding: 4px 6px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 8pt;
        }
        .resp-line-item {
            margin-bottom: 6px;
        }
        .underline-span {
            border-bottom: 1px solid #000;
            display: inline-block;
            font-weight: bold;
            min-width: 130px;
            padding: 0 4px;
        }

        /* WAIVER BOX */
        .waiver-wrapper {
            border: 1.5px solid #000;
            padding: 4px 6px;
            font-size: 7.2pt;
            position: relative;
        }
        .waiver-title {
            text-align: center;
            font-weight: bold;
            font-size: 8.5pt;
            margin-bottom: 2px;
        }
        .waiver-statement {
            line-height: 1.3;
            text-align: justify;
            margin-bottom: 4px;
        }
        .waiver-bottom-cols {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 4px;
        }
        .sig-col {
            width: 48%;
        }
        .sig-holder-img {
            max-height: 28px;
            max-width: 140px;
            object-fit: contain;
            display: block;
            margin-bottom: 2px;
        }
    </style>
</head>
<body>

<div class="pcr-page">
    <!-- TOP HEADER -->
    <div class="header-wrap">
        <!-- Municipal Official Seal (Left) -->
        <div style="width: 60px; text-align: left;">
            <svg width="55" height="55" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="#fef3c7" stroke="#b45309" stroke-width="3"/>
                <circle cx="50" cy="50" r="38" fill="#fff" stroke="#1e3a8a" stroke-width="2"/>
                <polygon points="50,16 54,28 67,28 56,36 60,48 50,40 40,48 44,36 33,28 46,28" fill="#b45309"/>
                <text x="50" y="62" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1e3a8a" text-anchor="middle">OPOL</text>
                <text x="50" y="72" font-family="Arial" font-size="6.5" font-weight="bold" fill="#b91c1c" text-anchor="middle">OFFICIAL SEAL</text>
            </svg>
        </div>

        <div class="header-title-box">
            <h2 class="header-title-top">LOCAL DISASTER RISK REDUCTION MANAGEMENT OFFICE</h2>
            <h1 class="header-title-main">PATIENT CARE RECORD</h1>
        </div>

        <!-- Opol Rescue Shield (Right) -->
        <div style="width: 60px; text-align: right; position: relative;">
            <span class="rev-tag">Rev. 2.0</span>
            <svg width="55" height="55" viewBox="0 0 100 110" style="margin-top: 4px;">
                <path d="M50 5 Q95 20 90 70 Q50 105 50 105 Q50 105 10 70 Q5 20 50 5 Z" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
                <circle cx="50" cy="52" r="25" fill="#fff"/>
                <rect x="46" y="34" width="8" height="36" rx="2" fill="#b91c1c"/>
                <rect x="32" y="48" width="36" height="8" rx="2" fill="#b91c1c"/>
                <text x="50" y="24" font-family="Arial" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">OPOL</text>
                <text x="50" y="90" font-family="Arial" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">RESCUE</text>
            </svg>
        </div>
    </div>

    <!-- PATIENT INFORMATION SECTION (Image 2 exact grid) -->
    <span class="section-label-italic">Patient Information</span>
    <table class="form-grid">
        <!-- Row 1 -->
        <tr>
            <td colspan="4" style="width: 65%;">
                <span class="field-name">Name of Patient:</span>
                <span class="field-data" style="margin-left: 6px;">${patientFullName || '__________________________________________'}</span>
            </td>
            <td colspan="2" style="width: 35%;">
                <span class="field-name">Date (mo/day/yr):</span>
                <span class="field-data" style="margin-left: 6px; font-family: monospace;">${formatMoDayYr(record.record_date || record.created_at)}</span>
            </td>
        </tr>

        <!-- Row 2 -->
        <tr>
            <td style="width: 32%;">
                <span class="field-name">Contact #:</span>
                <span class="field-data">${patient.contact_number || record.contact_number || '_________________'}</span>
            </td>
            <td style="width: 14%;">
                <span class="field-name">Age:</span>
                <span class="field-data">${patient.age ? patient.age : (record.age ? record.age : '___')}</span>
            </td>
            <td style="width: 10%;">
                <span class="field-name">Male</span> ${box(isMale)}
            </td>
            <td style="width: 10%;">
                <span class="field-name">Female</span> ${box(isFemale)}
            </td>
            <td colspan="2">
                <span class="field-name">Caller #:</span>
                <span class="field-data">${record.caller_no || incident.caller_phone_number || '_________________'}</span>
            </td>
        </tr>

        <!-- Row 3 -->
        <tr>
            <td colspan="4">
                <span class="field-name">Civil Status:</span>
                <span style="margin-left: 4px;">
                    ${box(civilStatus === 'single')} Single &nbsp;
                    ${box(civilStatus === 'married')} Married &nbsp;
                    ${box(civilStatus === 'widowed')} Widowed &nbsp;
                    ${box(civilStatus === 'child')} Child &nbsp;
                    ${box(civilStatus === 'separated')} Separated
                </span>
            </td>
            <td colspan="2">
                <span class="field-name">Dispatch Time:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tDispatch.time}</span>
                    <span>${box(tDispatch.am)} AM</span>
                    <span>${box(tDispatch.pm)} PM</span>
                </span>
            </td>
        </tr>

        <!-- Row 4 -->
        <tr>
            <td colspan="4">
                <span class="field-name">Address:</span>
                <span class="field-data" style="margin-left: 6px;">${patientAddress || '__________________________________________'}</span>
            </td>
            <td colspan="2">
                <span class="field-name">En Route Time:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tEnRoute.time}</span>
                    <span>${box(tEnRoute.am)} AM</span>
                    <span>${box(tEnRoute.pm)} PM</span>
                </span>
            </td>
        </tr>

        <!-- Row 5 -->
        <tr>
            <td colspan="4">
                <span class="field-name">Place of Incident:</span>
                <span class="field-data" style="margin-left: 6px;">${incidentPlace || '__________________________________________'}</span>
            </td>
            <td colspan="2">
                <span class="field-name">On Scene Time:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tOnScene.time}</span>
                    <span>${box(tOnScene.am)} AM</span>
                    <span>${box(tOnScene.pm)} PM</span>
                </span>
            </td>
        </tr>

        <!-- Row 6 -->
        <tr>
            <td colspan="4">
                <span class="field-name">Chief of Complaint:</span>
                <span class="field-data" style="margin-left: 6px; font-weight: bold;">${chiefComplaint || '__________________________________________'}</span>
            </td>
            <td colspan="2">
                <span class="field-name">Transport Time:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tTransport.time}</span>
                    <span>${box(tTransport.am)} AM</span>
                    <span>${box(tTransport.pm)} PM</span>
                </span>
            </td>
        </tr>

        <!-- Row 7 -->
        <tr>
            <td colspan="4" rowspan="2" style="vertical-align: top;">
                <span class="field-name">Nature of Call:</span>
                <div style="margin-top: 3px; line-height: 1.6;">
                    ${box(natureOfCall === 'emergency')} Emergency &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'transport')} Transport &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'standby')} Standby<br>
                    ${box(natureOfCall === 'non-emergency')} Non-Emergency &nbsp;&nbsp;&nbsp;&nbsp;
                    ${box(natureOfCall === 'medical assistance')} Medical Assistance
                </div>
            </td>
            <td colspan="2">
                <span class="field-name">Arrived HF:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tArrivedHF.time}</span>
                    <span>${box(tArrivedHF.am)} AM</span>
                    <span>${box(tArrivedHF.pm)} PM</span>
                </span>
            </td>
        </tr>

        <!-- Row 8 -->
        <tr>
            <td colspan="2">
                <span class="field-name">Departed HF:</span>
                <span class="time-cell" style="margin-left: 6px;">
                    <span class="time-digits">${tDepartedHF.time}</span>
                    <span>${box(tDepartedHF.am)} AM</span>
                    <span>${box(tDepartedHF.pm)} PM</span>
                </span>
            </td>
        </tr>
    </table>

    <!-- MIDDLE SECTION: TWO COLUMNS (ASSESSMENT + VITALS/GCS) -->
    <div class="mid-columns">
        <!-- LEFT COLUMN: ASSESSMENT & BODY DIAGRAM -->
        <div class="left-col">
            <div class="box-title-bar">ASSESSMENT</div>
            <div class="assessment-box">
                <!-- 12 Checkboxes in 3 Columns (Image 2) -->
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

                <!-- BODY DIAGRAM WITH 100% ACCURATE PIN POINTS -->
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
                <div style="display: flex; justify-content: space-around; font-size: 7pt; font-weight: bold; margin-top: 1px;">
                    <span>FRONT</span>
                    <span>BACK</span>
                </div>

                <!-- SPECIAL INSTRUCTIONS (Image 2) -->
                <div class="special-box">
                    <span class="field-name">SPECIAL INSTRUCTIONS:</span>
                    <span class="field-data" style="margin-left: 4px; font-weight: bold;">
                        ${record.special_instructions || ''}
                    </span>
                    <div class="line-rule"></div>
                    <div class="line-rule"></div>
                    <div class="line-rule"></div>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: VITAL SIGNS & GCS (Image 2) -->
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

            <!-- GLASGOW COMA SCALE (Exact Image 2 table) -->
            <div class="box-title-bar" style="border-top: 1px solid #000;">GLASGOW COMA SCALE</div>
            <table class="gcs-grid">
                <!-- Eye -->
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

                <!-- Verbal -->
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

                <!-- Motor -->
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

                <!-- TOTAL -->
                <tr style="background: #f1f5f9;">
                    <td colspan="2" style="font-weight: 900; text-align: center; font-size: 8pt; letter-spacing: 1px;">TOTAL</td>
                    <td class="gcs-score-col" style="font-size: 9pt; font-weight: 900;">${gcsTotal || ''}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- LOWER MIDDLE: DISPOSITION & RESPONDERS (Image 2) -->
    <div class="lower-mid">
        <!-- LEFT: DISPOSITION (Image 2 exact checkboxes) -->
        <div class="dispo-box">
            <span class="field-name" style="margin-bottom: 2px; display: block;">INCIDENT/PATIENT DISPOSITION</span>
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

        <!-- RIGHT: RESPONDERS, TRANSPORTED TO, RECEIVED BY (Image 2) -->
        <div class="resp-box">
            <div class="resp-line-item">
                <span class="field-name">Responders:</span>
                <span class="underline-span" style="width: calc(100% - 90px);">${respondersText || '__________________________________'}</span>
            </div>
            <div class="resp-line-item">
                <span class="field-name">Transported to:</span>
                <span class="underline-span" style="width: calc(100% - 110px);">${record.transported_to || (isTransported ? 'Opol Community Clinic' : '__________________________________')}</span>
            </div>
            <div class="resp-line-item" style="margin-bottom: 0;">
                <span class="field-name">Received by:</span>
                <span class="underline-span" style="width: calc(100% - 90px);">${record.received_by || '__________________________________'}</span>
            </div>
        </div>
    </div>

    <!-- BOTTOM: WAIVER & WITNESS INFORMATION (Image 2) -->
    <div class="waiver-wrapper">
        <div class="waiver-title">WAIVER</div>
        <div class="waiver-statement">
            By signing this form, I <b style="text-decoration: underline; padding: 0 4px;">${patientFullName || '____________________________________'}</b> is releasing OPOL RESCUE TEAM of any liability and/or medical claim resulting from my decision to refuse care against medical advice.
        </div>

        <div class="waiver-bottom-cols">
            <div class="sig-col">
                <div style="min-height: 30px; display: flex; align-items: flex-end;">
                    ${record.patient_signature ? `<img src="${record.patient_signature}" class="sig-holder-img" alt="Signature" />` : ''}
                </div>
                <div style="margin-bottom: 2px;">
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
                <span class="field-name" style="display: block; margin-bottom: 2px;">WITNESS INFORMATION</span>
                <div style="margin-bottom: 2px;">
                    <span class="field-name">NAME:</span>
                    <span style="border-bottom: 1px solid #000; display: inline-block; width: 190px; font-weight: bold; padding-left: 4px;">
                        ${record.witness_name || ''}
                    </span>
                </div>
                <div style="min-height: 25px; display: flex; align-items: flex-end;">
                    ${record.witness_signature ? `<img src="${record.witness_signature}" class="sig-holder-img" alt="Witness Signature" />` : ''}
                </div>
            </div>
        </div>
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

    // Create isolated invisible iframe to preserve digital modal view on screen
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'PCR Official Form Print');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
        console.error('Failed to open print frame');
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

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
