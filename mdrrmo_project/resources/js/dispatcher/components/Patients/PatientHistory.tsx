import React, { useState } from 'react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import PatientCareRecordDetailsModal from '@/dispatcher/components/PatientCareRecords/PatientCareRecordDetailsModal';
import {
    Activity,
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileCheck,
    FileText,
    Heart,
    MapPin,
    Stethoscope,
    Truck,
    UserCheck,
    Users,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

interface PatientHistoryProps {
    records?: any[];
}

export default function PatientHistory({ records = [] }: PatientHistoryProps) {
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    if (!records || records.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm p-8">
                <EmptyState
                    title="No Care Record History"
                    description="This patient does not have any recorded Patient Care Records (PCRs) yet."
                    icon={Clock}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {records.map((r, i) => {
                const dispatch = r.dispatch;
                const incident = dispatch?.incident;
                const gcs = r.glasgow_coma_scale || {};
                const vitals = Array.isArray(r.vital_signs) && r.vital_signs.length > 0 ? r.vital_signs[0] : null;
                const assessments = Array.isArray(r.assessment) ? r.assessment : [];
                const markers = Array.isArray(r.assessment_markers) ? r.assessment_markers : [];
                const dispositions = Array.isArray(r.disposition) ? r.disposition : (r.disposition ? [r.disposition] : []);

                const safeDate = (d: string | null | undefined) => {
                    if (!d) return null;
                    const parsed = new Date(typeof d === 'string' && d.includes('-') && !d.includes('T') ? d.replace(/-/g, '/') : d);
                    return isNaN(parsed.getTime()) ? null : parsed;
                };

                const dateObj = safeDate(r.record_date) || safeDate(r.created_at);
                const formattedIncidentDate = dateObj
                    ? dateObj.toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                      })
                    : '—';

                const formattedIncidentTime = r.created_at
                    ? new Date(r.created_at).toLocaleTimeString('en-PH', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                      })
                    : null;

                const chiefComplaintDisplay = toPascalCase(r.chief_complaint || 'No Chief Complaint Recorded');
                const placeDisplay = r.place_of_incident ? toPascalCase(r.place_of_incident) : 'Scene location not specified';

                return (
                    <div
                        key={r.id || i}
                        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 hover:border-rose-500/30 group"
                    >
                        {/* Record Top Bar */}
                        <div className="bg-slate-50/80 dark:bg-white/[0.03] px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-[#F61509] font-bold flex items-center justify-center text-xs border border-rose-500/20">
                                    #{records.length - i}
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            PCR #{r.id}
                                        </span>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-[#F61509]" />
                                            {formattedIncidentDate}
                                            {formattedIncidentTime && (
                                                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1">
                                                    ({formattedIncidentTime})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Dispatch #{r.dispatch_id || '—'} {r.incident_type ? `• ${toPascalCase(r.incident_type)}` : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-[#F61509] border border-rose-500/20">
                                    {r.nature_of_call ? toPascalCase(r.nature_of_call) : 'Emergency'}
                                </span>

                                {r.transported ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> Transported
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                        Not Transported
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(r)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs shadow-sm transition-all cursor-pointer ml-1"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View PCR Details</span>
                                </button>
                            </div>
                        </div>

                        {/* Record Content Body */}
                        <div className="p-5 space-y-4">
                            {/* Chief Complaint & Scene Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Chief Complaint
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                        {chiefComplaintDisplay}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Place of Incident
                                    </span>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 capitalize">
                                        <MapPin className="w-4 h-4 text-[#F61509] flex-shrink-0" />
                                        <span>{placeDisplay}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Clinical & Condition Snapshot Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/5">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Patient Condition (GCS)
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Stethoscope className="w-3.5 h-3.5 text-[#F61509]" />
                                        <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                            {gcs.total ? `GCS: ${gcs.total}/15` : 'GCS: —'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        E:{gcs.eye ?? '—'} V:{gcs.verbal ?? '—'} M:{gcs.motor ?? '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Initial Vitals
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                            {vitals?.bp ? `BP: ${vitals.bp}` : 'Vitals logged'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {vitals ? `PR: ${vitals.pr || '—'} • SpO2: ${vitals.spo2 ? `${vitals.spo2}%` : '—'}` : 'See full record'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Assessment
                                    </span>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 capitalize">
                                        {assessments.length > 0 ? assessments.slice(0, 2).map((a: string) => toPascalCase(a)).join(', ') : 'Assessed'}
                                    </p>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {markers.length > 0 ? `${markers.length} injury marker(s)` : 'No injury markers'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                        Incident Disposition
                                    </span>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 capitalize">
                                        {dispositions.length > 0 ? toPascalCase(dispositions[0]) : toPascalCase(r.special_instructions || 'Treated on scene')}
                                    </p>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {r.transported_to ? `To: ${toPascalCase(r.transported_to)}` : (r.transported ? 'Transported' : 'Non-transport')}
                                    </span>
                                </div>
                            </div>

                            {/* Operational & Crew Metadata Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs border-t border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                                        <span className="text-slate-800 dark:text-slate-300 font-semibold capitalize">
                                            {toPascalCase(dispatch?.ambulance?.vehicle_name || dispatch?.ambulance?.plate_number || 'MDRRMO Ambulance')}
                                        </span>
                                    </span>

                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-[#F61509]" />
                                        <span>Crew: <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{toPascalCase(dispatch?.team_leader?.name || r.responders || 'Assigned Crew')}</span></span>
                                    </span>

                                    {r.waiver_signed && (
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Waiver Signed
                                        </span>
                                    )}
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    {r.created_at ? `Completed ${new Date(r.created_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Complete PCR Modal */}
            <PatientCareRecordDetailsModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
        </div>
    );
}
