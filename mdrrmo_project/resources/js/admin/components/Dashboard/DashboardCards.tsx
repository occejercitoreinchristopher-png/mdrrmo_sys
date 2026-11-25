import { AlertTriangle, Ambulance, CheckCircle2, Shield, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

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

    const totalDispatches = stats.total_dispatches ?? 0;
    const resolvedIncidents = stats.resolved_incidents ?? 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* CARD 1: Resident App Users */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Resident App Users
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {totalResidents.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        registered residents
                    </span>
                </div>
            </div>

            {/* CARD 2: Ambulances Ready */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ambulances Ready
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {availableAmbulances}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / {totalAmbulances} fleet units
                    </span>
                </div>
            </div>

            {/* CARD 3: Responders on Duty */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Responders on Duty
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {availableResponders}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / {totalResponders} personnel
                    </span>
                </div>
            </div>

            {/* CARD 4: Resolved Incidents */}
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0b1120] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-center group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Resolved Incidents
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {resolvedIncidents.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        / {totalDispatches} dispatches
                    </span>
                </div>
            </div>
        </div>
    );
}
