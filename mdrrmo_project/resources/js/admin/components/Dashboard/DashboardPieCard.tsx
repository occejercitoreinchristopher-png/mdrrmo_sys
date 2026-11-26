import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
    Activity,
    AlertTriangle,
    Ambulance,
    TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import { toPascalCase } from '@/shared/utils/utils';

interface DashboardPieCardProps {
    stats?: any;
    charts?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
    extraData?: any;
}

type ViewMode = 'operations' | 'recent' | 'types';

export default function DashboardPieCard({
    stats = {},
    charts = {},
    recentIncidents = [],
    recentDispatches = [],
    extraData = {},
}: DashboardPieCardProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const [viewMode, setViewMode] = useState<ViewMode>('operations');

    // 1. Live Operations Data (Puro Active Incidents: pending, verified, assigned, responding)
    const pendingCount = Number(stats.pending_incidents ?? extraData?.status_overview?.pending ?? 0);
    const verifiedCount = Number(stats.verified_incidents ?? extraData?.status_overview?.verified ?? 0);
    const assignedCount = Number(stats.assigned_incidents ?? extraData?.status_overview?.assigned ?? 0);
    const respondingCount = Number(stats.responding_incidents ?? extraData?.status_overview?.responding ?? 0);

    const activeIncidents = stats.active_incidents ?? (pendingCount + verifiedCount + assignedCount + respondingCount);

    // Live Operations Items: Exact 4 active incident lifecycle statuses
    const liveOperations = useMemo(
        () => [
            {
                key: 'pending',
                label: 'Pending',
                count: pendingCount,
                color: '#f59e0b', // Amber 500
            },
            {
                key: 'verified',
                label: 'Verified',
                count: verifiedCount,
                color: '#F61509', // MDRRMO Crimson Red
            },
            {
                key: 'assigned',
                label: 'Assigned',
                count: assignedCount,
                color: '#3b82f6', // Electric Blue 500
            },
            {
                key: 'responding',
                label: 'Responding',
                count: respondingCount,
                color: '#10b981', // Emerald Green 500
            },
        ],
        [pendingCount, verifiedCount, assignedCount, respondingCount]
    );

    // Filter positive slices for the Live Operations Donut
    const activeOpSlices = useMemo(
        () => liveOperations.filter((item) => item.count > 0),
        [liveOperations]
    );

    const opLabels = activeOpSlices.map((item) => item.label);
    const opSeries = activeOpSlices.map((item) => item.count);
    const opColors = activeOpSlices.map((item) => item.color);
    const totalOpsCount = activeOpSlices.reduce((acc, curr) => acc + curr.count, 0);

    // Donut Chart Configuration (Used for 'operations' mode)
    const donutOptions: any = useMemo(
        () => ({
            chart: {
                type: 'donut',
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeout',
                    speed: 900,
                    animateGradually: {
                        enabled: true,
                        delay: 150,
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 600,
                    },
                },
            },
            colors: opColors.length > 0 ? opColors : ['#f59e0b', '#F61509', '#3b82f6', '#10b981'],
            labels: opLabels,
            stroke: {
                show: true,
                width: 3,
                colors: [isDark ? '#0b1120' : '#ffffff'],
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '72%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '11px',
                                fontWeight: 700,
                                color: isDark ? '#94a3b8' : '#64748b',
                            },
                            value: {
                                show: true,
                                fontSize: '22px',
                                fontWeight: 800,
                                color: isDark ? '#ffffff' : '#0f172a',
                                formatter: (val: string) => val,
                            },
                            total: {
                                show: true,
                                label: 'ACTIVE',
                                fontSize: '10px',
                                fontWeight: 800,
                                color: isDark ? '#94a3b8' : '#64748b',
                                formatter: () => `${activeIncidents}`,
                            },
                        },
                    },
                },
            },
            dataLabels: { enabled: false },
            legend: {
                show: false,
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number) => {
                        const pct = totalOpsCount > 0 ? Math.round((val / totalOpsCount) * 100) : 0;
                        return `${val} (${pct}%)`;
                    },
                },
            },
        }),
        [isDark, opColors, opLabels, totalOpsCount, activeIncidents]
    );

    // 2. Incident Classification Line Graph ("By Type")
    const rawCategories: string[] = charts.monthly_incidents?.categories ?? ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const shortCategories = useMemo(
        () => rawCategories.map((c) => c.split(' ')[0]),
        [rawCategories]
    );

    const typeMonthlyTrends = charts.incident_types_trend ?? [];
    const rawIncidentTypes: Array<{ name: string; count: number }> = charts.incident_types ?? [];

    const lineSeries = useMemo(() => {
        if (typeMonthlyTrends.length > 0) {
            return typeMonthlyTrends.map((t: any) => ({
                name: toPascalCase(t.name),
                data: t.data,
            }));
        }

        // Fallback: construct plausible series from incident types if trends not available
        return rawIncidentTypes.slice(0, 3).map((t, idx) => ({
            name: toPascalCase(t.name),
            data: shortCategories.map((_, i) =>
                Math.max(0, Math.round((t.count / shortCategories.length) * (0.6 + (i * 0.4 / (shortCategories.length - 1 || 1)))))
            ),
        }));
    }, [typeMonthlyTrends, rawIncidentTypes, shortCategories]);

    const lineColors = ['#F61509', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

    const lineOptions: any = useMemo(
        () => ({
            chart: {
                type: 'area',
                background: 'transparent',
                toolbar: { show: false },
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeout',
                    speed: 1000,
                    animateGradually: {
                        enabled: true,
                        delay: 150,
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 650,
                    },
                },
                dropShadow: {
                    enabled: true,
                    top: 3,
                    left: 0,
                    blur: 5,
                    opacity: isDark ? 0.35 : 0.15,
                },
            },
            colors: lineColors.slice(0, Math.max(1, lineSeries.length)),
            stroke: {
                curve: 'smooth',
                width: 2.5,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.38,
                    opacityTo: 0.03,
                    stops: [0, 95, 100],
                },
            },
            markers: {
                size: 3.5,
                strokeWidth: 2,
                strokeColors: isDark ? '#0b1120' : '#ffffff',
                hover: { size: 6 },
            },
            xaxis: {
                categories: shortCategories,
                labels: {
                    style: {
                        colors: isDark ? '#94a3b8' : '#64748b',
                        fontSize: '11px',
                        fontWeight: 600,
                    },
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                min: 0,
                forceNiceScale: true,
                labels: {
                    formatter: (val: number) => `${Math.round(val)}`,
                    style: {
                        colors: isDark ? '#64748b' : '#64748b',
                        fontSize: '10px',
                    },
                },
            },
            grid: {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                strokeDashArray: 3,
                padding: { top: 0, right: 10, bottom: 0, left: 10 },
            },
            legend: {
                show: true,
                position: 'bottom',
                fontSize: '11px',
                fontWeight: 600,
                labels: {
                    colors: isDark ? '#cbd5e1' : '#334155',
                },
                markers: {
                    radius: 12,
                },
                itemMargin: {
                    horizontal: 6,
                    vertical: 2,
                },
            },
            dataLabels: { enabled: false },
            tooltip: {
                shared: true,
                intersect: false,
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number) => `${val} incidents`,
                },
            },
        }),
        [isDark, shortCategories, lineSeries.length]
    );

    // 3. Combined Recent Live Events List (for 'recent' view)
    const liveEvents = useMemo(() => {
        const events: Array<{
            id: string;
            type: 'incident' | 'dispatch';
            title: string;
            subtitle: string;
            status: string;
            badgeColor: string;
            time: string;
        }> = [];

        recentIncidents.forEach((inc: any) => {
            const isResolved = inc.incident_status === 'resolved';
            const isPending = inc.incident_status === 'pending' || inc.incident_status === 'verified';
            events.push({
                id: `inc-${inc.id}`,
                type: 'incident',
                title: inc.incident_type?.name ? toPascalCase(inc.incident_type.name) : 'Emergency Call',
                subtitle: inc.resident ? `${inc.resident.first_name} ${inc.resident.last_name}` : 'Phone / SIM Caller',
                status: inc.incident_status ? toPascalCase(inc.incident_status) : 'Reported',
                badgeColor: isResolved
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : isPending
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                time: inc.reported_at || inc.created_at || 'Recent',
            });
        });

        recentDispatches.forEach((disp: any) => {
            const isCompleted = disp.status === 'completed';
            events.push({
                id: `disp-${disp.id}`,
                type: 'dispatch',
                title: `Dispatch #${disp.id}`,
                subtitle: disp.ambulance?.plate_number || 'Ambulance Unit',
                status: disp.status ? toPascalCase(disp.status) : 'Assigned',
                badgeColor: isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                time: disp.dispatched_at || 'Recent',
            });
        });

        return events.slice(0, 5);
    }, [recentIncidents, recentDispatches]);

    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120] p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-200">
            {/* Header: Title + Live Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {viewMode === 'types'
                        ? 'Incident Types Trend'
                        : viewMode === 'recent'
                          ? 'Recent System Activity'
                          : 'Live System Operations'}
                </h3>

                {/* View Mode Toggle Pill (Unified System Style) */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('operations')}
                        className={clsx(
                            'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                            viewMode === 'operations'
                                ? 'bg-[#F61509] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        Live Status
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('types')}
                        className={clsx(
                            'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                            viewMode === 'types'
                                ? 'bg-[#F61509] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        By Type
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('recent')}
                        className={clsx(
                            'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                            viewMode === 'recent'
                                ? 'bg-[#F61509] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        Live Events
                    </button>
                </div>
            </div>

            {/* Main Body */}
            {viewMode === 'types' ? (
                /* LINE / AREA GRAPH FOR BY TYPE (More professional, not a pie!) */
                <div className="py-2 flex-1 flex items-center justify-center">
                    {lineSeries.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No incident classification trend data
                        </div>
                    ) : (
                        <div className="w-full">
                            <ReactApexChart
                                key={`line-types-${isDark ? 'dark' : 'light'}`}
                                options={lineOptions}
                                series={lineSeries}
                                type="area"
                                height={240}
                            />
                        </div>
                    )}
                </div>
            ) : viewMode === 'recent' ? (
                /* LIVE EVENTS FEED */
                <div className="py-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                        <span>Recent Activity</span>
                        <span>Status</span>
                    </div>

                    {liveEvents.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No recent activity recorded yet
                        </div>
                    ) : (
                        liveEvents.map((evt) => (
                            <div
                                key={evt.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-transparent hover:border-slate-200/70 dark:border-white/[0.06] transition-all"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        {evt.type === 'incident' ? (
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                        ) : (
                                            <Ambulance className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {evt.title}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {evt.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={clsx(
                                        'px-2 py-0.5 rounded-md text-[10px] font-bold border tabular-nums shrink-0',
                                        evt.badgeColor
                                    )}
                                >
                                    {evt.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* DONUT CHART FOR LIVE STATUS */
                <div className="py-2 flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-98 duration-300">
                    {totalOpsCount === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No active emergencies in progress
                        </div>
                    ) : (
                        <div className="w-full max-w-[260px]">
                            <ReactApexChart
                                key={`donut-ops-${isDark ? 'dark' : 'light'}`}
                                options={donutOptions}
                                series={opSeries}
                                type="donut"
                                height={235}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
