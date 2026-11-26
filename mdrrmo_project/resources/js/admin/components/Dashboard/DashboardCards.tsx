import { AlertTriangle, Ambulance, CheckCircle2, Shield, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import AnimatedCounter from '@/shared/components/AnimatedCounter';

export interface DashboardStats {
    total_users?: number;
    users_trend?: number | null;
    total_incidents?: number;
    active_incidents?: number;
    pending_incidents?: number;
    pending_dispatch?: number;
    resolved_incidents?: number;
    resolved_today?: number;
    resolution_rate?: number;
    incidents_trend?: number | null;
    total_residents?: number;
    verified_residents?: number;
    pending_residents?: number;
    total_ambulances?: number;
    available_ambulances?: number;
    total_dispatches?: number;
    active_dispatches?: number;
    completed_dispatches?: number;
    total_responders?: number;
    available_responders?: number;
    total_patients?: number;
    total_pcrs?: number;
    [key: string]: any;
}

interface DashboardStatCardsProps {
    stats?: DashboardStats;
}

export default function DashboardStatCards({ stats = {} }: DashboardStatCardsProps) {
    const totalResidents = stats.total_residents ?? 0;
    const verifiedResidents = stats.verified_residents ?? 0;

    const totalAmbulances = stats.total_ambulances ?? 0;
    const availableAmbulances = stats.available_ambulances ?? 0;

    const totalResponders = stats.total_responders ?? 0;
    const availableResponders = stats.available_responders ?? 0;

    const totalIncidents = stats.total_incidents ?? 0;
    const resolvedIncidents = stats.resolved_incidents ?? 0;
    const unresolvedIncidents = Math.max(0, totalIncidents - resolvedIncidents);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* CARD 1: Resident App Users */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group animate-in fade-in-50 slide-in-from-bottom-2 duration-500 hover:border-rose-500/30 transition-all">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Resident App Users
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        <AnimatedCounter value={totalResidents} duration={900} />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        registered residents
                    </span>
                </div>
            </div>

            {/* CARD 2: Ambulances Ready */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-75 hover:border-rose-500/30 transition-all">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ambulances Ready
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        <AnimatedCounter value={availableAmbulances} duration={800} />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / <AnimatedCounter value={totalAmbulances} duration={800} /> fleet units
                    </span>
                </div>
            </div>

            {/* CARD 3: Responders on Duty */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-150 hover:border-rose-500/30 transition-all">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Responders on Duty
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        <AnimatedCounter value={availableResponders} duration={800} />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / <AnimatedCounter value={totalResponders} duration={800} /> personnel
                    </span>
                </div>
            </div>

            {/* CARD 4: Resolved Incidents */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-200 hover:border-rose-500/30 transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Resolved Incidents
                    </span>
                    {unresolvedIncidents > 0 ? (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            <AnimatedCounter value={unresolvedIncidents} duration={700} /> unresolved
                        </span>
                    ) : (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            All resolved
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        <AnimatedCounter value={resolvedIncidents} duration={1000} />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / <AnimatedCounter value={totalIncidents} duration={1000} /> reported incidents
                    </span>
                </div>
            </div>
        </div>
    );
}
