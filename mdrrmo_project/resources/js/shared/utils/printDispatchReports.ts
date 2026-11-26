/**
 * MDRRMO Opol - Official Incident & Dispatch Log Printing Utility
 * High-definition, letterhead-compliant, single-page optimized printable documents.
 * Automatically suppresses browser headers/footers (localhost URLs & titles)
 * and uses official dual-seal letterhead (Opol Municipal Seal left, MDRRMO Rescue Seal right).
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

    // Location & Complete Address Resolution (Guaranteed Full Human-Readable Address)
    let rawBarangay = '';
    if (typeof incident.barangay === 'string') {
        rawBarangay = incident.barangay.trim();
    } else if (incident.barangay && typeof incident.barangay === 'object') {
        rawBarangay = (incident.barangay.barangay_name || incident.barangay.name || '').trim();
    }
    if (!rawBarangay) {
        rawBarangay = (resident?.residentProfile?.barangay?.barangay_name
            || resident?.resident_profile?.barangay?.barangay_name
            || resident?.barangay?.barangay_name
            || (typeof incident.location_code === 'object' ? incident.location_code?.barangay?.barangay_name : '')
            || '').trim();
    }
    const cleanBName = rawBarangay.replace(/^(barangay|brgy\.?)\s+/i, '').trim();
    const barangay = cleanBName || 'Opol';

    const locationCode = typeof incident.location_code === 'object' && incident.location_code !== null
        ? (incident.location_code.location_code || incident.location_code.code || 'N/A')
        : (incident.location_code || incident.location_code_id || 'N/A');

    const rawPlace = (typeof incident.place_of_incident === 'string' ? incident.place_of_incident : (typeof incident.location === 'string' ? incident.location : '')).trim();
    const rawAddress = (typeof incident.incident_address === 'string' ? incident.incident_address : '').trim();

    const resProfile = resident?.residentProfile || resident?.resident_profile;
    const residentPurok = (resProfile?.purok || resProfile?.zone || '').trim();
    const residentStreet = (resProfile?.street || '').trim();
    const residentFullAddr = (resProfile?.address || resident?.address || '').trim();

    // Determine specific landmark or place (filter out generic "Opol, Misamis Oriental" or coordinate strings)
    let specificLandmark = rawPlace;
    if (
        !specificLandmark ||
        specificLandmark.toLowerCase().includes('pinpointed location') ||
        specificLandmark.toLowerCase() === 'opol, misamis oriental' ||
        specificLandmark.toLowerCase() === 'opol' ||
        specificLandmark.toLowerCase() === 'n/a'
    ) {
        specificLandmark = '';
    }

    // Determine base complete address
    let completeAddress = '';
    if (
        rawAddress &&
        rawAddress.toLowerCase() !== 'opol, misamis oriental' &&
        rawAddress.toLowerCase() !== 'opol' &&
        !rawAddress.toLowerCase().includes('pinpointed location')
    ) {
        completeAddress = rawAddress;
    } else if (specificLandmark) {
        completeAddress = specificLandmark;
    } else if (
        residentFullAddr &&
        residentFullAddr.toLowerCase() !== 'opol, misamis oriental' &&
        residentFullAddr.toLowerCase() !== 'opol'
    ) {
        completeAddress = residentFullAddr;
    }

    // Ensure Barangay is part of the complete address
    if (cleanBName) {
        const hasBarangay = completeAddress.toLowerCase().includes(cleanBName.toLowerCase());
        if (!hasBarangay) {
            const prefixParts: string[] = [];
            if (completeAddress && completeAddress.toLowerCase() !== 'opol, misamis oriental' && completeAddress.toLowerCase() !== 'opol') {
                prefixParts.push(completeAddress);
            } else {
                if (residentPurok) prefixParts.push(residentPurok.toLowerCase().startsWith('zone') || residentPurok.toLowerCase().startsWith('purok') ? residentPurok : `Zone ${residentPurok}`);
                if (residentStreet) prefixParts.push(residentStreet);
            }
            if (prefixParts.length > 0) {
                completeAddress = `${prefixParts.join(', ')}, Barangay ${cleanBName}`;
            } else {
                completeAddress = `Barangay ${cleanBName}`;
            }
        }
    }

    // Ensure Municipality and Province are included
    if (!completeAddress.toLowerCase().includes('opol')) {
        completeAddress = completeAddress ? `${completeAddress}, Opol, Misamis Oriental` : 'Opol, Misamis Oriental';
    } else if (!completeAddress.toLowerCase().includes('misamis oriental')) {
        completeAddress = `${completeAddress}, Misamis Oriental`;
    }

    const address = completeAddress;
    const placeOfIncident = specificLandmark || completeAddress;

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
                remarks: `Reason: ${incident.rejection_reason || 'N/A'} [Category: ${(incident.rejection_category || 'other').replace(/_/g, ' ')}${incident.is_prank ? ' - Flagged as Prank' : ''}]`
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

    const escapeHtml = (val: any): string =>
        String(val ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    // Collect ALL incident photo evidence (Resident + Responder dispatch/PCR photos), deduplicated
    const rawPhotoPool: any[] = [];
    if (Array.isArray(incident.images)) {
        rawPhotoPool.push(...incident.images);
    }
    dispatches.forEach((d: any) => {
        if (Array.isArray(d.images)) {
            rawPhotoPool.push(...d.images);
        }
        const pcrList = d.patient_care_records || d.patientCareRecords || [];
        if (Array.isArray(pcrList)) {
            pcrList.forEach((pcr: any) => {
                if (Array.isArray(pcr?.images)) rawPhotoPool.push(...pcr.images);
            });
        }
        const singlePcr = d.patient_care_record || d.patientCareRecord;
        if (Array.isArray(singlePcr?.images)) {
            rawPhotoPool.push(...singlePcr.images);
        }
    });

    const seenPhotoKeys = new Set<string>();
    const evidencePhotos: Array<{
        id: number | string;
        url: string;
        isResponder: boolean;
        sourceLabel: string;
        capturedAt: string;
        isGrayscale: boolean;
    }> = [];

    rawPhotoPool.forEach((img: any, idx: number) => {
        if (!img) return;
        const rawPath = img.image_path || '';
        const url = img.image_url || img.url || (rawPath ? `/storage/${String(rawPath).replace(/^\/+/, '')}` : '');
        if (!url) return;

        const dedupeKey = img.id ? `id_${img.id}` : (rawPath ? `path_${rawPath}` : `url_${url}`);
        if (seenPhotoKeys.has(dedupeKey)) return;
        seenPhotoKeys.add(dedupeKey);

        const rawSource = String(img.source || '').toLowerCase();
        const uploaderRole = String(img.user?.role || '').toLowerCase();
        const isResponder =
            rawSource.includes('responder') ||
            Boolean(img.dispatch_id) ||
            Boolean(img.patient_care_record_id) ||
            uploaderRole === 'responder';

        const capturedAt =
            img.formatted_captured_at ||
            (img.captured_at
                ? new Date(img.captured_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                : (img.created_at
                    ? new Date(img.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                    : ''));

        evidencePhotos.push({
            id: img.id ?? `photo-${idx}`,
            url,
            isResponder,
            sourceLabel: isResponder ? 'Responder Photo' : 'Resident Photo',
            capturedAt,
            isGrayscale: Boolean(img.is_grayscale),
        });
    });

    // Collect Patients & Casualties attached to this incident (from PCRs and direct patient record)
    const patients: Array<{
        name: string;
        ageGender: string;
        address: string;
        chiefComplaint: string;
        triage: string;
        hospital: string;
        pcrRef: string;
    }> = [];
    const seenPatientKeys = new Set<string>();

    const recordPatient = (pcr: any) => {
        if (!pcr || typeof pcr !== 'object') return;
        const patient = pcr.patient || {};

        const firstName = patient.first_name || patient.patient_first_name || pcr.patient_first_name || '';
        const lastName = patient.last_name || patient.patient_last_name || pcr.patient_last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ')
            || patient.full_name
            || patient.name
            || pcr.patient_name
            || 'Unidentified Patient';

        const age = patient.age ?? pcr.patient_age ?? pcr.age ?? '';
        const gender = patient.gender ?? patient.patient_gender ?? pcr.patient_gender ?? pcr.gender ?? '';
        const ageGender = [age !== '' && age !== null && age !== undefined ? `${age} yrs old` : '', gender ? String(gender).toUpperCase() : ''].filter(Boolean).join(' / ') || '—';

        const address = patient.address
            || patient.home_address
            || (typeof patient.barangay === 'object' ? patient.barangay?.barangay_name : patient.barangay)
            || pcr.patient_address
            || '—';

        const chiefComplaint = pcr.clinical_chief_complaint
            || pcr.chief_complaint
            || pcr.nature_of_injury_illness
            || incident.chief_complaint
            || '—';

        const triage = pcr.triage_tag
            || pcr.triage_category
            || pcr.priority
            || '—';

        const hospital = pcr.hospital_destination
            || pcr.destination_facility
            || pcr.destination_hospital
            || pcr.transport_disposition
            || '—';

        const pcrRef = pcr.pcr_number ? `PCR #${pcr.pcr_number}` : (pcr.id ? `PCR #${pcr.id}` : 'Field PCR');

        const key = `${fullName}_${age}_${gender}_${chiefComplaint}`.toLowerCase();
        if (seenPatientKeys.has(key)) return;
        seenPatientKeys.add(key);

        patients.push({
            name: fullName,
            ageGender,
            address,
            chiefComplaint,
            triage,
            hospital,
            pcrRef,
        });
    };

    dispatches.forEach((d: any) => {
        if (d.patient_care_record) recordPatient(d.patient_care_record);
        if (d.patientCareRecord) recordPatient(d.patientCareRecord);
        if (Array.isArray(d.patient_care_records)) d.patient_care_records.forEach((p: any) => recordPatient(p));
        if (Array.isArray(d.patientCareRecords)) d.patientCareRecords.forEach((p: any) => recordPatient(p));
    });

    if (Array.isArray(incident.patient_care_records)) incident.patient_care_records.forEach((p: any) => recordPatient(p));
    if (Array.isArray(incident.patientCareRecords)) incident.patientCareRecords.forEach((p: any) => recordPatient(p));
    if (incident.patient_care_record) recordPatient(incident.patient_care_record);
    if (incident.patientCareRecord) recordPatient(incident.patientCareRecord);
    if (incident.patient && typeof incident.patient === 'object') recordPatient({ patient: incident.patient });
    if (Array.isArray(incident.patients)) incident.patients.forEach((pt: any) => recordPatient({ patient: pt }));
    if (incident.patient_name) {
        recordPatient({
            patient_name: incident.patient_name,
            patient_age: incident.patient_age,
            patient_gender: incident.patient_gender,
            patient_address: incident.patient_address,
            chief_complaint: incident.chief_complaint,
        });
    }

    const secPatientNum = incident.incident_status === 'rejected' ? 5 : 4;
    const secUnitsNum = incident.incident_status === 'rejected' ? 6 : 5;
    const secTimelineNum = incident.incident_status === 'rejected' ? 7 : 6;

    const hasPhotos = evidencePhotos.length > 0;
    const totalPagesInitial = hasPhotos ? 2 : 1;

    // HTML for Single Incident Report (2-Step Print Preview: Page 1 Report + Optional Separate Page 2 Photo Evidence with Per-Photo B&W Toggle)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Incident Report ${escapeHtml(refNumber)} — Print Preview</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5px;
            color: #1e293b;
            line-height: 1.25;
            background: #e2e8f0;
        }

        /* Sticky Print Preview Toolbar (hidden when printing) */
        .preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #0f172a;
            color: #f8fafc;
            padding: 10px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .toolbar-title {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .toggle-photos-label {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 11px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            font-size: 12px;
            font-weight: 600;
            color: #f1f5f9;
            cursor: pointer;
            user-select: none;
        }
        .toggle-photos-label input {
            width: 14px;
            height: 14px;
            accent-color: #F61509;
            cursor: pointer;
        }
        .btn-print {
            background: #F61509;
            color: #ffffff;
            border: none;
            padding: 7px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-print:hover { background: #dc2626; }
        .btn-close {
            background: #334155;
            color: #f1f5f9;
            border: 1px solid rgba(255, 255, 255, 0.14);
            padding: 7px 13px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-close:hover { background: #475569; }

        /* Preview Stage */
        .preview-stage {
            padding: 18px 16px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .page-container {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 9mm 12mm;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
            border-radius: 4px;
            display: flex;
            flex-direction: column;
        }
        .photo-evidence-sheet {
            page-break-before: always;
            break-before: page;
        }
        .photo-evidence-sheet.is-hidden {
            display: none !important;
        }

        /* Photo Evidence Grid on Page 2 */
        .evidence-meta-strip {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 10px;
        }
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 4px;
        }
        .photo-grid.single-photo {
            grid-template-columns: 1fr;
            max-width: 155mm;
            margin-left: auto;
            margin-right: auto;
            width: 100%;
        }
        .photo-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            background: #f8fafc;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .photo-frame {
            position: relative;
            background: #0f172a;
            height: 68mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .photo-grid.single-photo .photo-frame {
            height: 120mm;
        }
        .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            transition: filter 0.18s ease;
        }
        .photo-frame img.is-grayscale {
            -webkit-filter: grayscale(100%) !important;
            filter: grayscale(100%) !important;
        }
        .photo-source-pill {
            position: absolute;
            top: 6px;
            left: 6px;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #ffffff;
        }
        .photo-source-pill.resident { background: #059669; }
        .photo-source-pill.responder { background: #0284c7; }

        .btn-bw-toggle {
            position: absolute;
            top: 6px;
            right: 6px;
            padding: 3px 8px;
            border-radius: 5px;
            font-size: 9.5px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.35);
            background: rgba(15, 23, 42, 0.85);
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }
        .btn-bw-toggle:hover {
            background: #1e293b;
        }
        .btn-bw-toggle.active-bw {
            background: #ffffff;
            color: #0f172a;
            border-color: #ffffff;
        }
        .photo-caption {
            padding: 5px 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            background: #ffffff;
            font-size: 8.5px;
            color: #334155;
        }
        .photo-caption strong {
            color: #0f172a;
        }
        .bw-tag {
            display: none;
            font-size: 7.5px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 3px;
            background: #e2e8f0;
            color: #334155;
            border: 1px solid #cbd5e1;
            margin-left: 4px;
        }
        .bw-tag.visible {
            display: inline-block;
        }

        @media print {
            html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .no-print {
                display: none !important;
            }
            .preview-stage {
                padding: 0 !important;
                gap: 0 !important;
                display: block !important;
            }
            .page-container {
                width: 210mm !important;
                min-height: 295mm !important;
                padding: 8mm 12mm !important;
                margin: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                box-sizing: border-box !important;
            }
            .photo-evidence-sheet {
                page-break-before: always !important;
                break-before: page !important;
            }
            .photo-evidence-sheet.is-hidden {
                display: none !important;
            }
            .photo-frame img.is-grayscale {
                -webkit-filter: grayscale(100%) !important;
                filter: grayscale(100%) !important;
            }
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
            color: #000000;
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
    <!-- Sticky Print Preview Toolbar (Hidden when Printing) -->
    <div class="preview-toolbar no-print">
        <div class="toolbar-title">
            <span>Incident Report ${escapeHtml(refNumber)} &mdash; Print Preview</span>
        </div>
        <div class="toolbar-actions">
            ${hasPhotos ? `
                <label class="toggle-photos-label" title="Uncheck to print Page 1 (Report Only) without Photo Evidence">
                    <input type="checkbox" id="includePhotosCheckbox" checked onchange="togglePhotoEvidencePage(this.checked)" />
                    <span>Include Photo Evidence (Page 2 &bull; ${evidencePhotos.length} photo${evidencePhotos.length > 1 ? 's' : ''})</span>
                </label>
            ` : ''}
            <button type="button" class="btn-print" onclick="window.print()">
                Print / Save as PDF
            </button>
            <button type="button" class="btn-close" onclick="window.close()">
                Close
            </button>
        </div>
    </div>

    <div class="preview-stage">
    <!-- PAGE 1: OFFICIAL INCIDENT REPORT (TEXT & DETAILS ONLY) -->
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
                <div style="font-size:8.5px; color:#475569;">Report Channel: ${reportSource}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${callerPhone}</div>
                <div style="font-size:8.5px; color:#475569;">Barangay Jurisdiction: ${barangay}${locationCode !== 'N/A' ? ` &bull; Marker: ${locationCode}` : ''}</div>
            </div>
        </div>

        <div style="margin-top: 4px;">
            <div class="data-card">
                <div class="field-label">Incident Location</div>
                <div class="field-value" style="font-size: 10px; font-weight: 700; color: #0f172a;">
                    ${escapeHtml(completeAddress)}
                </div>
                ${specificLandmark && specificLandmark !== completeAddress ? `
                    <div style="font-size: 8.5px; color: #475569; margin-top: 2px;">
                        Exact Place / Landmark: <strong>${escapeHtml(specificLandmark)}</strong>
                    </div>
                ` : ''}
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

        <!-- Section: Patient & Casualty Information -->
        <div class="section-title">${secPatientNum}. Patient &amp; Casualty Information</div>
        ${patients.length === 0 ? `
            <div class="data-card" style="text-align: center; color: #64748b; font-style: italic; padding: 4px; font-size: 8.5px;">
                No patient care records (PCR) or casualty details recorded for this incident.
            </div>
        ` : `
            <table class="report-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Patient Full Name</th>
                        <th style="width: 14%;">Age / Sex</th>
                        <th style="width: 29%;">Chief Complaint / Clinical Notes</th>
                        <th style="width: 14%;">Triage Tag</th>
                        <th style="width: 18%;">Transport Destination</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.map((p: any) => {
                        const trgLower = (p.triage || '').toLowerCase();
                        let badgeBg = '#f1f5f9';
                        let badgeColor = '#475569';
                        if (trgLower.includes('red') || trgLower.includes('immediate') || trgLower.includes('critical')) {
                            badgeBg = '#fee2e2'; badgeColor = '#b91c1c';
                        } else if (trgLower.includes('yellow') || trgLower.includes('delayed') || trgLower.includes('urgent')) {
                            badgeBg = '#fef3c7'; badgeColor = '#b45309';
                        } else if (trgLower.includes('green') || trgLower.includes('minor') || trgLower.includes('non-urgent')) {
                            badgeBg = '#dcfce7'; badgeColor = '#15803d';
                        } else if (trgLower.includes('black') || trgLower.includes('expectant') || trgLower.includes('deceased')) {
                            badgeBg = '#1e293b'; badgeColor = '#ffffff';
                        }
                        return `
                            <tr>
                                <td style="font-weight: bold;">
                                    ${escapeHtml(p.name)}
                                    <div style="font-size: 7.5px; color: #64748b; font-weight: normal;">${escapeHtml(p.pcrRef)}${p.address !== '—' ? ` &bull; ${escapeHtml(p.address)}` : ''}</div>
                                </td>
                                <td>${escapeHtml(p.ageGender)}</td>
                                <td>${escapeHtml(p.chiefComplaint)}</td>
                                <td>
                                    <span class="status-badge" style="background: ${badgeBg}; color: ${badgeColor};">
                                        ${escapeHtml(p.triage)}
                                    </span>
                                </td>
                                <td>${escapeHtml(p.hospital)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `}

        <!-- Section: Dispatched Units -->
        <div class="section-title">${secUnitsNum}. Emergency Units &amp; Personnel Dispatched</div>
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
        <div class="section-title">${secTimelineNum}. Chronological Incident Audit Trail &amp; Timeline</div>
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
                <div class="sig-name">&nbsp;</div>
                <div class="sig-title">MDRRMO Operations Head / Officer-in-Charge</div>
            </div>
        </div>

        <div class="footer-note" style="margin-top: auto;">
            Official computer-generated audit report produced by MDRRMO Emergency Operations System on ${currentDateFormatted}. <span id="page1Counter">Page 1 of ${totalPagesInitial}</span>
        </div>
    </div>

    ${hasPhotos ? `
    <!-- PAGE 2: SEPARATE INCIDENT PHOTO EVIDENCE SHEET -->
    <div class="page-container photo-evidence-sheet" id="photoEvidenceSheet">
        <!-- Dual-Logo Header -->
        <div class="header">
            <img src="/images/opol-seal.png" class="header-logo" alt="Opol Seal" onerror="this.style.opacity='0'" />
            <div class="header-text">
                <h3>Republic of the Philippines &bull; Province of Misamis Oriental</h3>
                <h2>MUNICIPALITY OF OPOL</h2>
                <h1>MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</h1>
                <p>Emergency Operations &amp; Dispatch Monitoring Center</p>
            </div>
            <img src="/images/opol-logo.png" class="header-logo" alt="MDRRMO Rescue" onerror="this.style.opacity='0'" />
        </div>

        <!-- Title Bar -->
        <div class="doc-title-bar">
            <span>INCIDENT PHOTO EVIDENCE ATTACHMENT</span>
            <span>REF: ${escapeHtml(refNumber)}</span>
        </div>

        <!-- Compact Incident Reference Strip -->
        <div class="evidence-meta-strip">
            <div class="data-card">
                <div class="field-label">Incident Type</div>
                <div class="field-value">${escapeHtml(incidentType)}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Incident Location</div>
                <div class="field-value">${escapeHtml(completeAddress)}</div>
            </div>
            <div class="data-card">
                <div class="field-label">Date &amp; Time Reported</div>
                <div class="field-value">${escapeHtml(reportedDate)}</div>
            </div>
        </div>

        <div class="section-title">Attached Incident &amp; Scene Photographs</div>

        <div class="photo-grid ${evidencePhotos.length === 1 ? 'single-photo' : ''}">
            ${evidencePhotos.map((photo, idx) => `
                <div class="photo-card">
                    <div class="photo-frame">
                        <img
                            id="evidence-img-${idx}"
                            src="${escapeHtml(photo.url)}"
                            alt="Photo Evidence #${idx + 1}"
                            class="${photo.isGrayscale ? 'is-grayscale' : ''}"
                        />
                        <span class="photo-source-pill ${photo.isResponder ? 'responder' : 'resident'}">
                            ${escapeHtml(photo.sourceLabel)}
                        </span>
                        <button
                            type="button"
                            id="bw-btn-${idx}"
                            class="btn-bw-toggle no-print ${photo.isGrayscale ? 'active-bw' : ''}"
                            onclick="togglePhotoBW(${idx})"
                            title="Toggle Black & White for this photo only"
                        >
                            ${photo.isGrayscale ? 'Switch to Color' : 'Black & White'}
                        </button>
                    </div>
                    <div class="photo-caption">
                        <div>
                            <strong>Photo #${idx + 1}</strong> &mdash; ${escapeHtml(photo.sourceLabel)}
                            <span id="bw-tag-${idx}" class="bw-tag ${photo.isGrayscale ? 'visible' : ''}">B&amp;W</span>
                        </div>
                        <span style="color:#64748b;">${escapeHtml(photo.capturedAt || reportedDate)}</span>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer-note" style="margin-top: auto;">
            Official photo evidence attachment for Incident ${escapeHtml(refNumber)} produced by MDRRMO Emergency Operations System on ${currentDateFormatted}. Page 2 of 2
        </div>
    </div>
    ` : ''}
    </div>

    <script>
        function togglePhotoEvidencePage(show) {
            var sheet = document.getElementById('photoEvidenceSheet');
            var counter = document.getElementById('page1Counter');
            if (sheet) {
                if (show) {
                    sheet.classList.remove('is-hidden');
                } else {
                    sheet.classList.add('is-hidden');
                }
            }
            if (counter) {
                counter.textContent = show ? 'Page 1 of 2' : 'Page 1 of 1';
            }
        }

        function togglePhotoBW(idx) {
            var img = document.getElementById('evidence-img-' + idx);
            var btn = document.getElementById('bw-btn-' + idx);
            var tag = document.getElementById('bw-tag-' + idx);
            if (!img) return;
            var isNowBw = img.classList.toggle('is-grayscale');
            if (btn) {
                btn.classList.toggle('active-bw', isNowBw);
                btn.textContent = isNowBw ? 'Switch to Color' : 'Black & White';
            }
            if (tag) {
                tag.classList.toggle('visible', isNowBw);
            }
        }
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=980,height=820');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
}

export function printDispatchLogsSummaryReport(
    incidents: any[],
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        barangay?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        reportSource?: string;
        hasDispatches?: string;
        preparedBy?: string;
        preparedByTitle?: string;
        approvedBy?: string;
        approvedByTitle?: string;
    } = {}
): void {
    if (!incidents || incidents.length === 0) {
        alert('No dispatch log records available to print.');
        return;
    }

    const currentDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    const preparedByName = filters.preparedBy ? filters.preparedBy.trim() : 'REIN CHRISTOPHER EJERCITO';
    const preparedByTitle = filters.preparedByTitle || 'MDRRMO Operations Officer';
    const approvedByName = filters.approvedBy ? filters.approvedBy.trim() : 'ENGR. ROMMEL C. LANOY';
    const approvedByTitle = filters.approvedByTitle || 'Approved by / MDRRMO Officer-in-Charge';

    // Build descriptive filter summary label for report header
    const filterParts: string[] = [];
    if (filters.status) filterParts.push(`STATUS: ${filters.status.toUpperCase()}`);
    if (filters.priority) filterParts.push(`PRIORITY: ${filters.priority.toUpperCase()}`);
    if (filters.barangay) filterParts.push(`BARANGAY: ${filters.barangay.toUpperCase()}`);
    if (filters.date && filters.date !== 'custom') filterParts.push(`TIMEFRAME: ${filters.date.replace('_', ' ').toUpperCase()}`);
    if (filters.startDate || filters.endDate) filterParts.push(`DATE RANGE: ${filters.startDate || 'ANY'} TO ${filters.endDate || 'NOW'}`);
    if (filters.reportSource) filterParts.push(`SOURCE: ${filters.reportSource.toUpperCase()}`);
    if (filters.hasDispatches) filterParts.push(`AMBULANCE: ${filters.hasDispatches === 'yes' ? 'DISPATCHED' : 'NONE'}`);
    if (filters.search) filterParts.push(`SEARCH: "${filters.search}"`);

    const filterSummaryText = filterParts.length > 0 ? filterParts.join(' | ') : 'ALL INCIDENT STATUSES & RECORDS';

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
            color: #000000;
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
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            padding: 0 16px;
        }
        .sig-block {
            width: 240px;
            text-align: center;
        }
        .sig-header {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 30px;
        }
        .sig-line {
            border-bottom: 1.5px solid #0f172a;
            margin-bottom: 4px;
        }
        .sig-name {
            font-weight: bold;
            font-size: 9.5px;
            text-transform: uppercase;
            min-height: 14px;
            color: #0f172a;
        }
        .sig-title {
            font-size: 8px;
            color: #475569;
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
            <span>FILTER: ${filterSummaryText} | GENERATED: ${currentDate}</span>
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
                    const firstDispatch = inc.dispatches?.[0] || null;
                    const dispatchUser = latestLog?.user || verifiedBy || firstDispatch?.dispatcher || inc.dispatcher || inc.user;
                    const dispatcher = dispatchUser 
                        ? `${dispatchUser.first_name} ${dispatchUser.last_name}` 
                        : (inc.dispatcher_name || (inc.dispatches?.length > 0 ? 'MDRRMO Dispatcher' : 'Operations Desk'));
                    
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
                                ` : (inc.incident_status === 'rejected' ? `<span style="color:#be123c;">Rejected (${(inc.rejection_category || 'other').replace(/_/g, ' ')})</span>` : '<span style="color:#94a3b8; font-style:italic;">Reported</span>')}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-header">Prepared &amp; Certified By:</div>
                <div class="sig-name">${preparedByName || 'REIN CHRISTOPHER EJERCITO'}</div>
                <div class="sig-line"></div>
                <div class="sig-title">${preparedByTitle}</div>
            </div>
            <div class="sig-block">
                <div class="sig-header">Approved &amp; Noted By:</div>
                <div class="sig-name">${approvedByName || 'ENGR. ROMMEL C. LANOY'}</div>
                <div class="sig-line"></div>
                <div class="sig-title">${approvedByTitle}</div>
            </div>
        </div>
    </div>

</body>
</html>`;

    const dateStr = new Date().toISOString().slice(0, 10);
    const safeStatus = (filters.status || 'all').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `MDRRMO_Dispatch_Summary_${safeStatus}_${dateStr}.pdf`;

    downloadHtmlAsPdf(html, filename);
}

function downloadHtmlAsPdf(html: string, filename: string): void {
    // Create a hidden full-size iframe so layout renders at proper width,
    // and html2canvas only sees the iframe's own CSS (hex/rgb only — no oklch).
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '816px';   // ~8.5in @ 96dpi
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'PDF Render Frame');
    document.body.appendChild(iframe);

    const cleanup = () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    };

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
        console.error('Failed to access iframe document');
        cleanup();
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Give the iframe DOM time to fully paint before capturing
    setTimeout(async () => {
        try {
            const body = doc.body;
            if (!body) throw new Error('iframe body not found');

            const canvas = await html2canvas(body, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 816,
                height: body.scrollHeight,
                windowWidth: 816,
                windowHeight: body.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.97);

            const pdfW = 210; // A4 width in mm
            const pdfH = (canvas.height * pdfW) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfW, Math.max(pdfH, 297)],
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
            pdf.save(filename);
            cleanup();
        } catch (err) {
            console.error('PDF generation error:', err);
            cleanup();
        }
    }, 400);
}
