import React, { useState, useEffect } from 'react';
import { 
    Phone, Clock, MapPin, AlertTriangle, Truck, 
    FileText, Copy, Check, Loader2, AlertCircle, PhoneCall
} from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import { toPascalCase } from '@/shared/utils/utils';

interface HistoryIncident {
    id: number;
    incident_number: string;
    caller_name?: string | null;
    incident_type: string;
    incident_status: string;
    place_of_incident: string;
    reported_at: string;
    is_prank: boolean;
    rejection_category?: string | null;
    rejection_reason?: string | null;
    ambulance?: string | null;
    has_pcr?: boolean;
}

interface CallerHistoryData {
    phone: string;
    caller_name: string;
    total_calls: number;
    prank_count: number;
    incidents: HistoryIncident[];
}

interface CallerHistoryModalProps {
    open: boolean;
    onClose: () => void;
    phone: string | null;
    callerName?: string | null;
}

export default function CallerHistoryModal({
    open,
    onClose,
    phone,
    callerName,
}: CallerHistoryModalProps) {
    const [data, setData] = useState<CallerHistoryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!open || !phone) {
            setData(null);
            setError(null);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        fetch(`/dispatcher/residents/caller-history?phone=${encodeURIComponent(phone)}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load history (${res.status})`);
                }
                return res.json();
            })
            .then((result: CallerHistoryData) => {
                if (isMounted) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message || 'Error fetching caller incident records.');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [open, phone]);

    const handleCopyPhone = () => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayName = callerName
        ? toPascalCase(callerName)
        : data?.caller_name
        ? toPascalCase(data.caller_name)
        : 'Anonymous Caller';

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="2xl"
            title="Caller Incident History"
            description="Complete log of emergency calls, incident reports, and prank verification history for this phone number."
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {data?.incidents ? `${data.incidents.length} recorded call incident(s)` : ''}
                    </span>
                    <Button variant="secondary" onClick={onClose} className="px-5">
                        Close
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 pt-1">
                {/* 1. Header Telemetry Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                            {displayName[0] || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                    {displayName}
                                </h3>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    SIM / Hotline
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{phone}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyPhone}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                    title="Copy phone number"
                                >
                                    {copied ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* KPI Quick Metrics */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                                Total Calls
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {data?.total_calls ?? '—'}
                            </span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border text-center ${
                            (data?.prank_count ?? 0) > 0
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 text-slate-500'
                        }`}>
                            <span className="text-[10px] uppercase tracking-wider font-bold block">
                                Prank Calls
                            </span>
                            <span className="text-sm font-black">
                                {data?.prank_count ?? '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Loading State */}
                {loading && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        <span className="text-xs font-semibold">Retrieving all previous incident calls...</span>
                    </div>
                )}

                {/* 3. Error State */}
                {!loading && error && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 flex items-center gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* 4. Incidents List */}
                {!loading && !error && data && (
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                        {data.incidents.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                                <PhoneCall className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm font-semibold">No call records found</p>
                                <p className="text-xs text-slate-400 mt-0.5">There are no recorded incident reports linked to this number.</p>
                            </div>
                        ) : (
                            data.incidents.map((inc, index) => (
                                <div
                                    key={inc.id || index}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        inc.is_prank
                                            ? 'bg-rose-500/[0.03] border-rose-500/25 hover:border-rose-500/40'
                                            : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                                    } shadow-xs space-y-2.5`}
                                >
                                    {/* Top Metadata Strip */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                                {inc.incident_number}
                                            </span>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{inc.reported_at}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {inc.is_prank && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                                    <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                                    Flagged as Prank
                                                </span>
                                            )}
                                            <StatusBadge status={inc.incident_status} size="sm" />
                                        </div>
                                    </div>

                                    {/* Incident Type & Location */}
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                                            {inc.incident_type}
                                        </div>
                                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                            <span className="break-words leading-relaxed font-medium">
                                                {inc.place_of_incident}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Prank / Rejection Reason Alert */}
                                    {inc.rejection_reason && (
                                        <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-0.5">
                                            <span className="font-bold text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                                                Rejection / Prank Assessment:
                                            </span>
                                            <p className="italic">"{inc.rejection_reason}"</p>
                                        </div>
                                    )}

                                    {/* Dispatch / PCR Badges */}
                                    {(inc.ambulance || inc.has_pcr) && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5 text-[11px]">
                                            {inc.ambulance && (
                                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                    <Truck className="w-3 h-3 text-cyan-500" />
                                                    <span>Vehicle: <strong>{inc.ambulance}</strong></span>
                                                </span>
                                            )}
                                            {inc.has_pcr && (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                    <FileText className="w-3 h-3 text-emerald-500" />
                                                    <span>Clinical PCR Filed</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
