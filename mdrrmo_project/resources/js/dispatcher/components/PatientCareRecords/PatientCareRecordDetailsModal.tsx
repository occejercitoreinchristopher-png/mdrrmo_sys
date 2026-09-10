import React from 'react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import {
    Activity,
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
} from 'lucide-react';

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

    const formattedDate = record.record_date || (record.created_at
        ? new Date(record.created_at).toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '—');

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
                            ? `Completed: ${new Date(record.created_at).toLocaleString('en-PH')}`
                            : ''}
                    </span>
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                {/* Header Summary Banner */}
                <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {record.nature_of_call || 'Emergency Call'}
                                </span>
                                {record.transported ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Transported
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        Not Transported / Treated on Scene
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white mt-1">
                                {record.chief_complaint || 'No Chief Complaint Specified'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                                <span>{record.place_of_incident || 'Scene location not specified'}</span>
                            </div>
                        </div>

                        {dispatch?.ambulance && (
                            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Assigned Unit
                                </p>
                                <p className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                                    <Truck className="w-4 h-4 text-orange-400" />
                                    {dispatch.ambulance.vehicle_name || dispatch.ambulance.plate_number}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Information at Time of Call */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Patient Demographics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 block">Gender</span>
                            <span className="font-semibold text-white capitalize">{record.gender || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Civil Status</span>
                            <span className="font-semibold text-white capitalize">{record.civil_status || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Contact Number</span>
                            <span className="font-mono text-white">{record.contact_number || record.caller_no || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Caller Phone</span>
                            <span className="font-mono text-white">{record.caller_no || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Response Timestamps Grid */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                            <div key={t.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                    {t.label}
                                </span>
                                <span className="text-xs font-mono font-bold text-white">
                                    {t.time || '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vital Signs (3-Take Table) */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Vital Signs Monitoring
                    </h4>
                    {vitalSigns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                                        <th className="py-2 px-3">Take #</th>
                                        <th className="py-2 px-3">Time</th>
                                        <th className="py-2 px-3">BP (mmHg)</th>
                                        <th className="py-2 px-3">Pulse (bpm)</th>
                                        <th className="py-2 px-3">Resp Rate</th>
                                        <th className="py-2 px-3">SpO2 (%)</th>
                                        <th className="py-2 px-3">Temp (°C)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {vitalSigns.map((vs, idx) => (
                                        <tr key={idx} className="text-slate-200">
                                            <td className="py-2 px-3 font-semibold text-rose-300">Take {vs.take || idx + 1}</td>
                                            <td className="py-2 px-3 font-mono">{vs.time || '—'}</td>
                                            <td className="py-2 px-3 font-mono font-medium text-white">{vs.bp || '—'}</td>
                                            <td className="py-2 px-3 font-mono">{vs.pr || '—'}</td>
                                            <td className="py-2 px-3 font-mono">{vs.rr || '—'}</td>
                                            <td className="py-2 px-3 font-mono text-emerald-400">{vs.spo2 ? `${vs.spo2}%` : '—'}</td>
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
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Glasgow Coma Scale (GCS)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Eye Opening (1-4)</span>
                            <span className="text-lg font-bold text-white font-mono">{gcs.eye ?? '—'}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Verbal Response (1-5)</span>
                            <span className="text-lg font-bold text-white font-mono">{gcs.verbal ?? '—'}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Motor Response (1-6)</span>
                            <span className="text-lg font-bold text-white font-mono">{gcs.motor ?? '—'}</span>
                        </div>
                        <div className="bg-gradient-to-br from-rose-900/40 to-orange-900/40 p-3 rounded-xl border border-rose-500/30">
                            <span className="text-[10px] uppercase text-rose-300 font-bold tracking-wider block">Total GCS Score</span>
                            <span className="text-xl font-black text-white font-mono">
                                {gcs.total ? `${gcs.total} / 15` : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Clinical Assessment & Body Diagram Markers */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Clinical Assessment Findings
                    </h4>
                    {assessmentFindings.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {assessmentFindings.map((finding, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-lg text-xs bg-rose-500/15 border border-rose-500/25 text-rose-200 font-medium"
                                >
                                    {finding}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic mb-4">No specific clinical tags recorded.</p>
                    )}

                    {assessmentMarkers.length > 0 && (
                        <div className="border-t border-white/10 pt-3">
                            <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Injury Markers Logged ({assessmentMarkers.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {assessmentMarkers.map((m, idx) => (
                                    <div key={idx} className="bg-white/5 p-2 rounded-lg text-xs flex items-start gap-2 border border-white/5">
                                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{m.label || m.type || 'Injury Marker'}</p>
                                            <p className="text-[11px] text-slate-400">{m.notes || m.description || `Location: (${m.x ?? '—'}, ${m.y ?? '—'})`}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Disposition & Transport Details */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Disposition & Transport
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 block mb-1">Incident Disposition</span>
                            {dispositionList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {dispositionList.map((d, i) => (
                                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-white/10 font-medium">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-slate-500 italic">None specified</span>
                            )}
                        </div>

                        <div>
                            <span className="text-slate-400 block mb-1">Transport Destination</span>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="font-semibold text-white">
                                    {record.transported_to || (record.transported ? 'Health Facility' : 'Not Transported')}
                                </span>
                            </div>
                            {record.received_by && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Received By: <span className="text-white font-medium">{record.received_by}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {record.special_instructions && (
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-xs">
                            <span className="text-slate-400 font-semibold block mb-1">Special Instructions:</span>
                            <p className="text-slate-200 leading-relaxed">{record.special_instructions}</p>
                        </div>
                    )}
                </div>

                {/* Responding Crew Information */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Responding Medical Crew
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Team Leader</span>
                            <span className="font-bold text-white mt-1 block">
                                {dispatch?.team_leader?.name || record.responders || '—'}
                            </span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Driver</span>
                            <span className="font-bold text-white mt-1 block">
                                {dispatch?.driver?.name || '—'}
                            </span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">EMT</span>
                            <span className="font-bold text-white mt-1 block">
                                {dispatch?.emt?.name || '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Legal Verification */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileSignature className="w-4 h-4" /> Legal Signatures & Waivers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Patient Signature */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-between text-center min-h-[140px]">
                            <span className="text-[11px] font-medium text-slate-300">Patient Signature</span>
                            {record.patient_signature ? (
                                <img
                                    src={record.patient_signature}
                                    alt="Patient Signature"
                                    className="max-h-16 w-auto object-contain my-2 bg-white/10 rounded p-1"
                                />
                            ) : (
                                <span className="text-xs text-slate-500 italic my-auto">No signature captured</span>
                            )}
                            <span className="text-[10px] text-slate-400">Patient Endorsement</span>
                        </div>

                        {/* Witness Signature */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-between text-center min-h-[140px]">
                            <span className="text-[11px] font-medium text-slate-300">Witness Signature</span>
                            {record.witness_signature ? (
                                <img
                                    src={record.witness_signature}
                                    alt="Witness Signature"
                                    className="max-h-16 w-auto object-contain my-2 bg-white/10 rounded p-1"
                                />
                            ) : (
                                <span className="text-xs text-slate-500 italic my-auto">No witness signature</span>
                            )}
                            <span className="text-[10px] text-slate-400">
                                {record.witness_name ? `Witness: ${record.witness_name}` : 'Witness Endorsement'}
                            </span>
                        </div>

                        {/* Waiver Signature */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-between text-center min-h-[140px]">
                            <span className="text-[11px] font-medium text-slate-300">Transport Waiver</span>
                            {record.waiver_signed ? (
                                <>
                                    {record.waiver_signature ? (
                                        <img
                                            src={record.waiver_signature}
                                            alt="Waiver Signature"
                                            className="max-h-16 w-auto object-contain my-2 bg-white/10 rounded p-1"
                                        />
                                    ) : (
                                        <div className="my-auto text-emerald-400 font-bold text-xs flex items-center gap-1">
                                            <FileCheck2 className="w-4 h-4" /> Waiver Signed
                                        </div>
                                    )}
                                    <span className="text-[10px] text-emerald-400 font-semibold">Refusal/Waiver Executed</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs text-slate-500 italic my-auto">No waiver required</span>
                                    <span className="text-[10px] text-slate-500">Standard Transport</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
