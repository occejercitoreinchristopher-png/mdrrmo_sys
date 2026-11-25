import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    FileText,
    Flame,
    HeartPulse,
    MapPin,
    ShieldAlert,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toPascalCase } from '@/shared/utils/utils';

interface BarangayDetail {
    name: string;
    count: number;
    resolved?: number;
    active?: number;
    top_type?: string;
    top_type_count?: number;
    percentage?: number;
}

interface DashboardLocationCardProps {
    charts?: any;
    extraData?: any;
}

const MEDAL_STYLES = [
    'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xs',
    'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-xs',
    'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xs',
    'bg-slate-700 text-white',
    'bg-slate-700 text-white',
];

export default function DashboardLocationCard({ charts = {}, extraData = {} }: DashboardLocationCardProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [selectedBarangay, setSelectedBarangay] = useState<BarangayDetail | null>(null);

    const rawBarangays: BarangayDetail[] =
        charts.top_barangays ?? extraData.incidents_by_barangay ?? [];

    const topList = useMemo(() => {
        return rawBarangays
            .filter((b) => b.name && b.name.toLowerCase() !== 'unknown' && b.name.toLowerCase() !== 'unassigned')
            .slice(0, 4);
    }, [rawBarangays]);

    const maxCount = useMemo(() => {
        if (topList.length === 0) return 1;
        return Math.max(1, ...topList.map((b) => b.count));
    }, [topList]);

    const totalMunicipalIncidents = useMemo(() => {
        return topList.reduce((acc, curr) => acc + curr.count, 0);
    }, [topList]);

    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            {/* Header: Title */}
            <div className="pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Top Incident Locations
                </h3>
            </div>

            {/* List of Ranked Barangays (Matching Picture 2 Design) */}
            <div className="space-y-2.5 pt-2.5">
                {topList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                        No barangay location data available yet
                    </div>
                ) : (
                    topList.map((item, idx) => {
                        const cleanName = item.name.replace(/^brgy\.?\s*/i, '').trim();
                        const barPercent = Math.max(12, Math.round((item.count / maxCount) * 100));
                        const sharePercent = item.percentage ?? (totalMunicipalIncidents > 0 ? Math.round((item.count / totalMunicipalIncidents) * 100) : 0);
                        const resolvedCount = item.resolved ?? 0;
                        const activeCount = item.active ?? Math.max(0, item.count - resolvedCount);
                        const topType = item.top_type || 'General Emergency';
                        const isHovered = hoveredIdx === idx;

                        return (
                            <div
                                key={item.name}
                                onClick={() => setSelectedBarangay(item)}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseMove={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className={clsx(
                                    'relative block p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer group',
                                    isHovered
                                        ? 'z-30 bg-slate-50 dark:bg-white/[0.05] border-rose-400/50 dark:border-rose-500/40 shadow-sm scale-[1.01]'
                                        : 'z-10 bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.025] dark:hover:bg-white/[0.05] border-slate-200/70 dark:border-white/[0.07]'
                                )}
                            >
                                {/* Floating Hover Popover with Detailed Breakdown */}
                                {isHovered && (
                                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-64 p-2.5 rounded-xl bg-slate-900/95 dark:bg-[#070c18]/95 backdrop-blur-md text-white border border-slate-700/80 dark:border-rose-500/30 shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                                            <span className="font-bold text-xs flex items-center gap-1.5 text-rose-400">
                                                <MapPin className="w-3 h-3" />
                                                Brgy. {toPascalCase(cleanName)}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                Rank #{idx + 1}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Total Emergencies:</span>
                                                <span className="font-bold text-white tabular-nums">
                                                    {item.count} ({sharePercent}% of total)
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Resolution Clearance:</span>
                                                <span className="font-bold text-emerald-400 tabular-nums">
                                                    {resolvedCount} Resolved • {activeCount} Active
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Dominant Incident:</span>
                                                <span className="font-bold text-amber-300 truncate max-w-[120px]">
                                                    {toPascalCase(topType)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Little Tooltip Arrow */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 dark:bg-[#070c18] border-b border-r border-slate-700/80 dark:border-rose-500/30 rotate-45" />
                                    </div>
                                )}

                                {/* Main Row Content */}
                                <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        {/* Rank Medal Badge */}
                                        <div
                                            className={clsx(
                                                'w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 shadow-xs',
                                                MEDAL_STYLES[idx] || MEDAL_STYLES[3]
                                            )}
                                        >
                                            #{idx + 1}
                                        </div>

                                        {/* Name */}
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-tight truncate">
                                            Brgy. {toPascalCase(cleanName)}
                                        </p>
                                    </div>

                                    {/* Report Pills */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                            {resolvedCount} Resolved
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                                            {item.count} Total
                                        </span>
                                    </div>
                                </div>

                                {/* Animated Rising Progress Bar (matching Picture 2) */}
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                                        <div
                                            style={{
                                                width: `${barPercent}%`,
                                            }}
                                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 group-hover:brightness-110"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 w-8 text-right shrink-0">
                                        {barPercent}%
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Interactive Click Modal: Detailed Barangay Profile */}
            {selectedBarangay && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setSelectedBarangay(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        Brgy. {toPascalCase(selectedBarangay.name.replace(/^brgy\.?\s*/i, ''))}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Emergency Incident Concentration Profile
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBarangay(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content / Metrics Grid */}
                        <div className="py-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Emergencies</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                                        {selectedBarangay.count}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                        {selectedBarangay.percentage ?? 0}% of all municipal calls
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Resolution Status</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {selectedBarangay.resolved ?? 0}
                                        </span>
                                        <span className="text-xs text-slate-400">/ {selectedBarangay.count} resolved</span>
                                    </div>
                                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">
                                        {selectedBarangay.active ?? 0} currently active
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Dominant Incident Type:</span>
                                    <span className="font-bold text-slate-900 dark:text-amber-400">
                                        {toPascalCase(selectedBarangay.top_type || 'General Emergency')}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                    <div
                                        style={{ width: `${Math.min(100, Math.round(((selectedBarangay.resolved ?? 0) / (selectedBarangay.count || 1)) * 100))}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    const clean = selectedBarangay.name.replace(/^brgy\.?\s*/i, '');
                                    router.visit(`/admin/dispatch-logs?search=${encodeURIComponent(clean)}`);
                                }}
                                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Dispatch Logs</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/admin/barangays')}
                                className="w-full sm:w-auto py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                <span>Location Codes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
