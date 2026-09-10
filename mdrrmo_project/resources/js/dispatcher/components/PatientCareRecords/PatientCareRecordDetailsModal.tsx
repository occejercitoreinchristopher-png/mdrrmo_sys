import React from 'react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Building2,
    Calendar,
    Clock,
    FileCheck2,
    FileSignature,
    FileText,
    Heart,
    MapPin,
    Phone,
    Shield,
    Stethoscope,
    Truck,
    User,
    Users,
    Printer,
} from 'lucide-react';
import { printPatientCareRecord } from '@/dispatcher/utils/printPatientCareRecord';

interface VitalSignTake {
    take?: number;
    time?: string;
    bp?: string;
    pr?: string;
    rr?: string;
    spo2?: string;
    temp?: string;
}

interface PatientCareRecordDetailsModalProps {
    open: boolean;
    onClose: () => void;
    record: any | null;
}

export default function PatientCareRecordDetailsModal({
    open,
    onClose,
    record,
}: PatientCareRecordDetailsModalProps) {
    if (!record) return null;

    const dispatch = record.dispatch;
    const incident = dispatch?.incident;
    const gcs = record.glasgow_coma_scale || {};
    const vitalSigns: VitalSignTake[] = Array.isArray(record.vital_signs)
        ? record.vital_signs
        : [];
    const assessmentFindings: string[] = Array.isArray(record.assessment)
        ? record.assessment
        : typeof record.assessment === 'string' && record.assessment
        ? [record.assessment]
        : [];
    const assessmentMarkers: any[] = Array.isArray(record.assessment_markers)
        ? record.assessment_markers
        : [];
    const dispositionList: string[] = Array.isArray(record.disposition)
        ? record.disposition
        : typeof record.disposition === 'string' && record.disposition
        ? [record.disposition]
        : [];

    const formatSafeDate = (d: string | null | undefined) => {
        if (!d) return '—';
        const parsed = new Date(typeof d === 'string' && d.includes('-') && !d.includes('T') ? d.replace(/-/g, '/') : d);
        if (isNaN(parsed.getTime())) return d;
        return parsed.toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formattedDate = formatSafeDate(record.record_date || record.created_at);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Patient Care Record #${record.id}`}
            description={`Recorded on ${formattedDate} • Dispatch #${record.dispatch_id || '—'}`}
            size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-slate-400">
                        {record.created_at
                            ? `Completed: ${new Date(record.created_at).toLocaleString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true,
                              })}`
                            : ''}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            onClick={() => printPatientCareRecord(record)}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-rose-900/40 border border-rose-500/40 transition-all cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print PCR</span>
                        </Button>
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                {/* Header Summary Banner */}
                <div className="bg-gradient-to-r from-rose-50/80 via-white to-slate-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 shadow-sm dark:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                    {record.nature_of_call || 'Emergency Call'}
                                </span>
                                {record.transported ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                        Transported
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                        Not Transported / Treated on Scene
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                {record.chief_complaint || 'No Chief Complaint Specified'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                                <span>{record.place_of_incident || 'Scene location not specified'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => printPatientCareRecord(record)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-200 dark:hover:text-white font-semibold text-xs border border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-400 transition-all shadow-sm group cursor-pointer"
                                title="Print Official Patient Care Record (A4)"
                            >
                                <Printer className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                                <span>Print PCR</span>
                            </button>

                            {dispatch?.ambulance && (
                                <div className="bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                        Assigned Unit
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-end">
                                        <Truck className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                                        {dispatch.ambulance.vehicle_name || dispatch.ambulance.plate_number}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Patient Information at Time of Call */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Patient Demographics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block">Gender</span>
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">{record.gender || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block">Civil Status</span>
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">{record.civil_status || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block">Contact Number</span>
                            <span className="font-mono text-slate-900 dark:text-white">{record.contact_number || record.caller_no || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block">Caller Phone</span>
                            <span className="font-mono text-slate-900 dark:text-white">{record.caller_no || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Response Timestamps Grid */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Operational Response Times
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {[
                            { label: 'Dispatch', time: record.dispatch_time },
                            { label: 'En Route', time: record.en_route_time },
                            { label: 'On Scene', time: record.on_scene_time },
                            { label: 'Transport', time: record.transport_time },
                            { label: 'Arrived HF', time: record.arrived_hf_time },
                            { label: 'Departed HF', time: record.departed_hf_time },
                        ].map((t) => (
                            <div key={t.label} className="bg-white dark:bg-white/5 rounded-lg p-2 text-center border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    {t.label}
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                    {t.time || '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vital Signs (3-Take Table) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Vital Signs Monitoring
                    </h4>
                    {vitalSigns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[11px]">
                                        <th className="py-2 px-3">Take #</th>
                                        <th className="py-2 px-3">Time</th>
                                        <th className="py-2 px-3">BP (mmHg)</th>
                                        <th className="py-2 px-3">Pulse (bpm)</th>
                                        <th className="py-2 px-3">Resp Rate</th>
                                        <th className="py-2 px-3">SpO2 (%)</th>
                                        <th className="py-2 px-3">Temp (°C)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {vitalSigns.map((vs, idx) => (
                                        <tr key={idx} className="text-slate-700 dark:text-slate-200">
                                            <td className="py-2 px-3 font-semibold text-rose-600 dark:text-rose-300">Take {vs.take || idx + 1}</td>
                                            <td className="py-2 px-3 font-mono">{vs.time || '—'}</td>
                                            <td className="py-2 px-3 font-mono font-medium text-slate-900 dark:text-white">{vs.bp || '—'}</td>
                                            <td className="py-2 px-3 font-mono">{vs.pr || '—'}</td>
                                            <td className="py-2 px-3 font-mono">{vs.rr || '—'}</td>
                                            <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{vs.spo2 ? `${vs.spo2}%` : '—'}</td>
                                            <td className="py-2 px-3 font-mono">{vs.temp ? `${vs.temp}°C` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic">No vital signs logged for this record.</p>
                    )}
                </div>

                {/* Glasgow Coma Scale (GCS) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Glasgow Coma Scale (GCS)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider block">Eye Opening (1-4)</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{gcs.eye ?? '—'}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider block">Verbal Response (1-5)</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{gcs.verbal ?? '—'}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider block">Motor Response (1-6)</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{gcs.motor ?? '—'}</span>
                        </div>
                        <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/40 dark:to-orange-900/40 p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 shadow-xs dark:shadow-none">
                            <span className="text-[10px] uppercase text-rose-700 dark:text-rose-300 font-bold tracking-wider block">Total GCS Score</span>
                            <span className="text-xl font-black text-rose-700 dark:text-white font-mono">
                                {gcs.total ? `${gcs.total} / 15` : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Clinical Assessment & Body Diagram Markers */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Clinical Assessment Findings
                    </h4>
                    {assessmentFindings.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {assessmentFindings.map((finding, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-lg text-xs bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-200 font-medium"
                                >
                                    {finding}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic mb-4">No specific clinical tags recorded.</p>
                    )}

                    {assessmentMarkers.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-white/10 pt-3">
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Injury Markers Logged ({assessmentMarkers.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {assessmentMarkers.map((m, idx) => (
                                    <div key={idx} className="bg-white dark:bg-white/5 p-2 rounded-lg text-xs flex items-start gap-2 border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white truncate">{m.label || m.type || 'Injury Marker'}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.notes || m.description || `Location: (${m.x ?? '—'}, ${m.y ?? '—'})`}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Disposition & Transport Details */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Disposition & Transport
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Incident Disposition</span>
                            {dispositionList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {dispositionList.map((d, i) => (
                                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-medium">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-slate-500 italic">None specified</span>
                            )}
                        </div>

                        <div>
                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Transport Destination</span>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {record.transported_to || (record.transported ? 'Health Facility' : 'Not Transported')}
                                </span>
                            </div>
                            {record.received_by && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    Received By: <span className="text-slate-900 dark:text-white font-medium">{record.received_by}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {record.special_instructions && (
                        <div className="bg-white dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Special Instructions:</span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{record.special_instructions}</p>
                        </div>
                    )}
                </div>

                {/* Responding Crew Information */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Responding Medical Crew
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Team Leader</span>
                            <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                                {dispatch?.team_leader?.name || record.responders || '—'}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Driver</span>
                            <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                                {dispatch?.driver?.name || '—'}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">EMT</span>
                            <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                                {dispatch?.emt?.name || '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Legal Verification */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileSignature className="w-4 h-4" /> Legal Signatures & Waivers
                    </h4>
                    {(() => {
                        const effectivePatientSig = record.patient_signature || record.waiver_signature;
                        const effectiveWaiverSig = record.waiver_signature || record.patient_signature;
                        const isPatientUnableToSign = record.patient_signature === 'UNABLE_TO_SIGN' || record.waiver_signature === 'UNABLE_TO_SIGN';
                        const hasPatientSig = effectivePatientSig && effectivePatientSig !== 'UNABLE_TO_SIGN';
                        const hasWaiverSig = effectiveWaiverSig && effectiveWaiverSig !== 'UNABLE_TO_SIGN';

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Patient Signature */}
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between text-center min-h-[140px] shadow-xs dark:shadow-none">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Patient Signature</span>
                                    {hasPatientSig ? (
                                        <img
                                            src={effectivePatientSig}
                                            alt="Patient Signature"
                                            className="max-h-16 w-auto object-contain my-2 bg-slate-100 dark:bg-white/10 rounded p-1"
                                        />
                                    ) : isPatientUnableToSign ? (
                                        <div className="my-auto py-2 px-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                                            <span>Unable to Sign (Unconscious / Minor)</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500 italic my-auto">No signature captured</span>
                                    )}
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Patient Endorsement</span>
                                </div>

                                {/* Witness Signature */}
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between text-center min-h-[140px] shadow-xs dark:shadow-none">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Witness Signature</span>
                                    {record.witness_signature ? (
                                        <img
                                            src={record.witness_signature}
                                            alt="Witness Signature"
                                            className="max-h-16 w-auto object-contain my-2 bg-slate-100 dark:bg-white/10 rounded p-1"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-500 italic my-auto">No witness signature</span>
                                    )}
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {record.witness_name ? `Witness: ${record.witness_name}` : 'Witness Endorsement'}
                                    </span>
                                </div>

                                {/* Waiver Signature */}
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between text-center min-h-[140px] shadow-xs dark:shadow-none">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Transport Waiver</span>
                                    {isPatientUnableToSign ? (
                                        <>
                                            <div className="my-auto py-2 px-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                                                <span>Exempt / Unable to Sign</span>
                                            </div>
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Patient Unconscious / Minor</span>
                                        </>
                                    ) : hasWaiverSig || record.waiver_signed ? (
                                        <>
                                            {hasWaiverSig && effectiveWaiverSig.startsWith('data:image') ? (
                                                <img
                                                    src={effectiveWaiverSig}
                                                    alt="Waiver Signature"
                                                    className="max-h-16 w-auto object-contain my-2 bg-slate-100 dark:bg-white/10 rounded p-1"
                                                />
                                            ) : (
                                                <div className="my-auto text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                                                    <FileCheck2 className="w-4 h-4" /> Waiver Signed
                                                </div>
                                            )}
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Refusal/Waiver Executed</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs text-slate-500 italic my-auto">No waiver required</span>
                                            <span className="text-[10px] text-slate-500">Standard Transport</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </Modal>
    );
}
