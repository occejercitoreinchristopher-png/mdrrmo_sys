import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
    Activity,
    PieChart,
    Clock,
    ShieldCheck,
    Truck,
    MapPin,
    XCircle,
    Ban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppearance } from '@/shared/contexts/ThemeContext';

interface DashboardPieCardProps {
    stats?: any;
    charts?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
    extraData?: any;
}

type ViewMode = 'status' | 'types';

// The five official MDRRMO Opol Emergency Types with their official color coding
const OFFICIAL_EMERGENCY_TYPES = [
    {
        name: 'Medical Emergency',
        color: '#3B82F6', // Blue
        matcher: (n: string) => /medical|trauma|acute|health|injury/i.test(n),
    },
    {
        name: 'Fire Emergency',
        color: '#EF4444', // Red
        matcher: (n: string) => /fire|burn|flame|structural/i.test(n),
    },
    {
        name: 'Severe Weather / Flood',
        color: '#06B6D4', // Cyan
        matcher: (n: string) => /weather|flood|typhoon|storm|landslide|water surge/i.test(n),
    },
    {
        name: 'Crime & Security',
        color: '#F59E0B', // Amber
        matcher: (n: string) => /crime|security|violence|assault|theft|robbery/i.test(n),
    },
    {
        name: 'Search & Rescue',
        color: '#A855F7', // Purple
        matcher: (n: string) => /search|rescue|drowning|retrieval|lost/i.test(n),
    },
];

export default function DashboardPieCard({
    stats = {},
    charts = {},
    extraData = {},
}: DashboardPieCardProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    // Strictly two tabs: 'status' (Incident Status) and 'types' (Emergency Types)
    const [viewMode, setViewMode] = useState<ViewMode>('status');

    // =========================================================================
    // TAB 1: INCIDENT STATUS (ACTIVE & ONGOING ONLY, STRICTLY EXCLUDING RESOLVED)
    // =========================================================================
    const pendingCount = Number(stats.pending_incidents ?? extraData?.status_overview?.pending ?? 0);
    const verifiedCount = Number(stats.verified_incidents ?? extraData?.status_overview?.verified ?? 0);
    const assignedCount = Number(stats.assigned_incidents ?? extraData?.status_overview?.assigned ?? 0);
    const respondingCount = Number(stats.responding_incidents ?? extraData?.status_overview?.responding ?? 0);
    const cancelledCount = Number(stats.cancelled_incidents ?? extraData?.status_overview?.cancelled ?? 0);
    const rejectedCount = Number(stats.rejected_incidents ?? extraData?.status_overview?.rejected ?? 0);

    // Total reported incidents from DB
    const totalReported = Number(stats.total_incidents ?? 0);

    // Supported operational incident statuses
    const operationalStatuses = useMemo(
        () => [
            {
                key: 'pending',
                name: 'Pending',
                description: 'Awaiting dispatcher verification',
                count: pendingCount,
                color: '#F59E0B', // Amber (matches filter bar Pending)
                badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
                dotStyle: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
                icon: Clock,
            },
            {
                key: 'verified',
                name: 'Verified',
                description: 'Confirmed, ready for dispatch',
                count: verifiedCount,
                color: '#3B82F6', // Blue (matches filter bar Verified)
                badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
                dotStyle: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                icon: ShieldCheck,
            },
            {
                key: 'assigned',
                name: 'Dispatched',
                description: 'Ambulance & crew deployed',
                count: assignedCount,
                color: '#6366F1', // Indigo (matches filter bar Assigned)
                badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
                dotStyle: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]',
                icon: Truck,
            },
            {
                key: 'responding',
                name: 'On Scene',
                description: 'Responders active on site / treating',
                count: respondingCount,
                color: '#A855F7', // Purple (matches filter bar Responding)
                badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
                dotStyle: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
                icon: MapPin,
            },
            {
                key: 'cancelled',
                name: 'Cancelled',
                description: 'Cancelled emergency reports',
                count: cancelledCount,
                color: '#64748B', // Slate Gray (matches filter bar Cancelled)
                badgeStyle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
                dotStyle: 'bg-slate-400 shadow-[0_0_8px_rgba(100,116,139,0.5)]',
                icon: XCircle,
            },
            {
                key: 'rejected',
                name: 'Rejected',
                description: 'Declined / invalid emergency reports',
                count: rejectedCount,
                color: '#EF4444', // Red (matches filter bar Rejected)
                badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
                dotStyle: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                icon: Ban,
            },
        ],
        [pendingCount, verifiedCount, assignedCount, respondingCount, cancelledCount, rejectedCount]
    );

    // =========================================================================
    // TAB 2: EMERGENCY TYPES (FIVE OFFICIAL TYPES WITH OFFICIAL COLORS & DONUT)
    // =========================================================================
    const rawIncidentTypes: Array<{ name: string; count: number }> = useMemo(() => {
        if (Array.isArray(charts.incident_types)) {
            return charts.incident_types;
        }
        if (Array.isArray(extraData?.incident_types)) {
            return extraData.incident_types;
        }
        return [];
    }, [charts.incident_types, extraData?.incident_types]);

    // Map against the 5 official types, preserving zero counts
    const officialTypesDistribution = useMemo(() => {
        return OFFICIAL_EMERGENCY_TYPES.map((official) => {
            const matched = rawIncidentTypes.find(
                (item) =>
                    item.name?.toLowerCase().trim() === official.name.toLowerCase().trim() ||
                    official.matcher(item.name || '')
            );
            return {
                name: official.name,
                color: official.color,
                count: matched ? Number(matched.count) || 0 : 0,
            };
        });
    }, [rawIncidentTypes]);

    const totalTypedIncidents = useMemo(() => {
        const sum = officialTypesDistribution.reduce((acc, curr) => acc + curr.count, 0);
        return sum > 0 ? sum : Number(stats.resolved_incidents ?? 0);
    }, [officialTypesDistribution, stats.resolved_incidents]);

    // Donut chart series and labels
    const donutSeries = useMemo(() => {
        const counts = officialTypesDistribution.map((t) => t.count);
        const hasAnyPositive = counts.some((c) => c > 0);
        // If all are zero, return dummy single slice so donut renders empty ring nicely
        return hasAnyPositive ? counts : [1];
    }, [officialTypesDistribution]);

    const donutLabels = useMemo(() => {
        const hasAnyPositive = officialTypesDistribution.some((t) => t.count > 0);
        return hasAnyPositive ? officialTypesDistribution.map((t) => t.name) : ['No Resolved Incidents'];
    }, [officialTypesDistribution]);

    const donutColors = useMemo(() => {
        const hasAnyPositive = officialTypesDistribution.some((t) => t.count > 0);
        return hasAnyPositive
            ? officialTypesDistribution.map((t) => t.color)
            : [isDark ? '#1e293b' : '#e2e8f0'];
    }, [officialTypesDistribution, isDark]);

    // Donut chart configuration
    const donutChartOptions: any = useMemo(
        () => ({
            chart: {
                type: 'donut',
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1000,
                    animateGradually: {
                        enabled: true,
                        delay: 120,
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 500,
                    },
                },
                dropShadow: {
                    enabled: true,
                    top: 2,
                    left: 0,
                    blur: 8,
                    color: '#000000',
                    opacity: isDark ? 0.4 : 0.08,
                },
            },
            colors: donutColors,
            labels: donutLabels,
            stroke: {
                show: true,
                width: 3,
                colors: [isDark ? '#0b1120' : '#ffffff'],
            },
            plotOptions: {
                pie: {
                    expandOnClick: true,
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
                                offsetY: -4,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                fontWeight: 800,
                                color: isDark ? '#ffffff' : '#0f172a',
                                offsetY: 4,
                                formatter: () => `${totalTypedIncidents}`,
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'RESOLVED',
                                fontSize: '10px',
                                fontWeight: 800,
                                color: isDark ? '#94a3b8' : '#64748b',
                                formatter: () => `${totalTypedIncidents}`,
                            },
                        },
                    },
                },
            },
            dataLabels: { enabled: false },
            legend: { show: false }, // Rendered using high-fidelity custom legend below
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number) => {
                        const total = totalTypedIncidents;
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return `${val} resolved (${pct}%)`;
                    },
                },
            },
        }),
        [isDark, donutColors, donutLabels, totalTypedIncidents]
    );

    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120] p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-200">
            {/* Header: Title + Compact 2-Tab Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        {viewMode === 'status' ? (
                            <Activity className="w-4 h-4 text-[#F61509]" />
                        ) : (
                            <PieChart className="w-4 h-4 text-[#3B82F6]" />
                        )}
                        <span>Incident Analytics</span>
                    </h3>
                </div>

                {/* 2-Tab Mode Switcher (Compact, modern pill aligned with heading) */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('status')}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                            viewMode === 'status'
                                ? 'bg-[#F61509] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Incident Status</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('types')}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                            viewMode === 'types'
                                ? 'bg-[#F61509] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Emergency Types</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'status' ? (
                /* ========================================================= */
                /* TAB 1: INCIDENT STATUS BREAKDOWN                          */
                /* ========================================================= */
                <div className="py-3 space-y-2.5 animate-in fade-in duration-300">
                    {/* Operational Status Rows (Pending, Verified, Dispatched, On Scene) */}
                    <div className="space-y-2">
                        {operationalStatuses.map((st) => {
                            const IconComponent = st.icon;
                            return (
                                <div
                                    key={st.key}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                                            style={{
                                                backgroundColor: `${st.color}15`,
                                                borderColor: `${st.color}30`,
                                                color: st.color,
                                            }}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {st.name}
                                                </span>
                                                <span className={clsx('w-1.5 h-1.5 rounded-full', st.dotStyle)} />
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {st.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={clsx(
                                                'px-3 py-1 rounded-lg text-xs font-black tabular-nums border min-w-[36px] text-center shadow-xs',
                                                st.badgeStyle
                                            )}
                                        >
                                            {st.count}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reported Incidents Banner (Positioned directly below On Scene) */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] mt-2">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-400" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                            </span>
                            <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Reported Incidents
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    Total recorded emergency reports
                                </span>
                            </div>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs">
                            {totalReported}
                        </span>
                    </div>
                </div>
            ) : (
                /* ========================================================= */
                /* TAB 2: EMERGENCY TYPES DONUT CHART                        */
                /* ========================================================= */
                <div className="py-4 flex flex-col items-center justify-center animate-in fade-in duration-300 min-h-[260px]">
                    {/* Donut Chart with Total in Center */}
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full max-w-[280px]">
                            <ReactApexChart
                                key={`donut-types-${isDark ? 'dark' : 'light'}`}
                                options={donutChartOptions}
                                series={donutSeries}
                                type="donut"
                                height={260}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
