import { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import {
    Activity,
    BarChart3,
    TrendingUp,
    PieChart,
    MapPin,
    Layers,
    Filter,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    RotateCcw,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { router, usePage } from '@inertiajs/react';

const PALETTE = [
    '#F61509', // MDRRMO Crimson
    '#3b82f6', // Electric Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
];

export default function IncidentIntelligence({ 
    incidents = [],
    filters = {}
}: { 
    incidents?: any[];
    filters?: any;
}) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';
    const { props } = usePage<any>();

    // Current active barangay filter
    const activeBarangay: string =
        filters?.barangay ||
        props?.filters?.barangay ||
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('barangay') || '' : '') ||
        '';

    const [trendStyle, setTrendStyle] = useState<'area' | 'bar'>('area');
    const [pieStyle, setPieStyle] = useState<'donut' | 'polarArea'>('donut');

    // Aggregate trends, types, statuses, and barangay activities
    const {
        trendLabels,
        trendReported,
        trendResolved,
        typeLabels,
        typeData,
        statusLabels,
        statusData,
        barangayActivity,
        totalReported,
        totalResolved,
    } = useMemo(() => {
        const trends: Record<string, { reported: number; resolved: number }> = {};
        const typeDistribution: Record<string, number> = {};
        const statusDistribution: Record<string, number> = {};
        const barangayMap: Record<string, { total: number; resolved: number; rejected: number }> = {};

        incidents.forEach((inc) => {
            // Trend (Group by Month / Year)
            if (inc.reported_at) {
                const date = new Date(inc.reported_at);
                const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                if (!trends[key]) trends[key] = { reported: 0, resolved: 0 };
                trends[key].reported++;
                if (inc.incident_status === 'resolved') trends[key].resolved++;
            }

            // Incident Type
            const typeName = inc.incident_type?.name || inc.incident_type?.incident_type_name || 'General Emergency';
            typeDistribution[typeName] = (typeDistribution[typeName] || 0) + 1;

            // Status
            const status = inc.incident_status || 'pending';
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;

            // Barangay
            const brgy = inc.barangay || 'Unknown / Unassigned';
            if (!barangayMap[brgy]) barangayMap[brgy] = { total: 0, resolved: 0, rejected: 0 };
            barangayMap[brgy].total++;
            if (inc.incident_status === 'resolved') barangayMap[brgy].resolved++;
            if (inc.incident_status === 'rejected') barangayMap[brgy].rejected++;
        });

        const sortedTrendKeys = Object.keys(trends).sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        const rep = sortedTrendKeys.map((k) => trends[k].reported);
        const res = sortedTrendKeys.map((k) => trends[k].resolved);

        return {
            trendLabels: sortedTrendKeys,
            trendReported: rep,
            trendResolved: res,
            typeLabels: Object.keys(typeDistribution),
            typeData: Object.values(typeDistribution),
            statusLabels: Object.keys(statusDistribution).map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
            statusData: Object.values(statusDistribution),
            barangayActivity: barangayMap,
            totalReported: rep.reduce((a, b) => a + b, 0),
            totalResolved: res.reduce((a, b) => a + b, 0),
        };
    }, [incidents]);

    const clearanceRate = totalReported > 0 ? Math.round((totalResolved / totalReported) * 100) : 0;

    // Filter or toggle a barangay constraint
    const handleFilterBarangay = (brgyName: string) => {
        if (brgyName === 'Unknown / Unassigned') return;

        // If clicking the already-filtered barangay, toggle it off to view all
        if (activeBarangay && activeBarangay.toLowerCase() === brgyName.toLowerCase()) {
            handleClearBarangayFilter();
            return;
        }

        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const currentQuery = Object.fromEntries(urlParams.entries());
        currentQuery.barangay = brgyName;

        const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/admin/reports';
        router.get(pathname, currentQuery, { preserveState: true, replace: true });
    };

    // Clear the active barangay constraint and show all barangays
    const handleClearBarangayFilter = () => {
        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        urlParams.delete('barangay');
        const query = Object.fromEntries(urlParams.entries());

        const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/admin/reports';
        router.get(pathname, query, { preserveState: true, replace: true });
    };

    // Trend chart options
    const trendChartOptions: any = {
        chart: {
            type: trendStyle,
            background: 'transparent',
            toolbar: { show: false },
            fontFamily: 'inherit',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            },
            dropShadow:
                trendStyle === 'area'
                    ? {
                          enabled: true,
                          top: 4,
                          left: 0,
                          blur: 8,
                          opacity: isDark ? 0.25 : 0.12,
                      }
                    : { enabled: false },
        },
        colors: ['#F61509', '#10b981'],
        stroke: {
            curve: 'smooth',
            width: trendStyle === 'area' ? 3 : 0,
        },
        fill:
            trendStyle === 'area'
                ? {
                      type: 'gradient',
                      gradient: {
                          shade: isDark ? 'dark' : 'light',
                          type: 'vertical',
                          shadeIntensity: 0.5,
                          opacityFrom: 0.45,
                          opacityTo: 0.05,
                      },
                  }
                : {
                      type: 'gradient',
                      gradient: {
                          shade: isDark ? 'dark' : 'light',
                          type: 'vertical',
                          shadeIntensity: 0.35,
                          opacityFrom: 0.95,
                          opacityTo: 0.7,
                      },
                  },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '45%',
            },
        },
        xaxis: {
            categories: trendLabels,
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
            labels: {
                style: {
                    colors: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                },
            },
        },
        grid: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            strokeDashArray: 4,
        },
        dataLabels: { enabled: false },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: { formatter: (val: number) => `${val} incidents` },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: { colors: isDark ? '#cbd5e1' : '#334155' },
        },
    };

    // Donut / Polar chart options
    const typeChartOptions: any = {
        chart: {
            type: pieStyle,
            background: 'transparent',
            toolbar: { show: false },
            fontFamily: 'inherit',
            animations: { enabled: true, easing: 'easeinout', speed: 800 },
        },
        colors: PALETTE,
        labels: typeLabels,
        theme: { mode: isDark ? 'dark' : 'light' },
        stroke: { width: 2, colors: [isDark ? '#0c1220' : '#ffffff'] },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '12px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' },
                        value: { show: true, fontSize: '24px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' },
                        total: {
                            show: true,
                            label: 'Total Incidents',
                            color: isDark ? '#94a3b8' : '#64748b',
                            formatter: () => `${incidents.length}`,
                        },
                    },
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            position: 'bottom',
            fontSize: '11px',
            labels: { colors: isDark ? '#cbd5e1' : '#334155' },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: { formatter: (val: number) => `${val} cases` },
        },
    };

    // Sorted barangays by incident count
    const sortedBarangays = Object.entries(barangayActivity).sort(
        ([, a]: any, [, b]: any) => b.total - a.total
    );

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-[#F61509] rounded-full shadow-[0_0_12px_rgba(246,21,9,0.4)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <span>01 Incident Intelligence</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                Analytics
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Temporal trends, category distribution, and territorial frequency
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Trend Card */}
            <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <span>Incident Inflow & Clearance Velocity</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Monthly volume of incoming distress calls versus successfully resolved missions
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Quick KPI stats */}
                        <div className="hidden md:flex items-center gap-3 text-xs pr-3 border-r border-slate-200 dark:border-white/10">
                            <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Clearance</span>
                                <span className="font-black text-emerald-500 font-mono">{clearanceRate}%</span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Vol</span>
                                <span className="font-black text-slate-900 dark:text-white font-mono">{totalReported}</span>
                            </div>
                        </div>

                        {/* Chart type toggle */}
                        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setTrendStyle('area')}
                                className={clsx(
                                    'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                    trendStyle === 'area'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                Wave Area
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendStyle('bar')}
                                className={clsx(
                                    'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                    trendStyle === 'bar'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                Rising Bars
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    {trendLabels.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-400 italic">
                            No incident records found for the selected time range or filters.
                        </div>
                    ) : (
                        <ReactApexChart
                            key={`trend-${trendStyle}-${theme}`}
                            options={trendChartOptions}
                            series={[
                                { name: 'Reported', data: trendReported },
                                { name: 'Resolved', data: trendResolved },
                            ]}
                            type={trendStyle}
                            height={280}
                        />
                    )}
                </div>
            </div>

            {/* Two-column Grid: Types Donut + Barangay Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Incident Distribution (5 cols) */}
                <div className="lg:col-span-5 rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-blue-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Incident Classification
                            </h3>
                        </div>

                        {/* Donut vs Polar Area toggle */}
                        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => setPieStyle('donut')}
                                className={clsx(
                                    'px-2 py-0.5 rounded-md transition-all',
                                    pieStyle === 'donut'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                        : 'text-slate-400'
                                )}
                            >
                                Donut
                            </button>
                            <button
                                type="button"
                                onClick={() => setPieStyle('polarArea')}
                                className={clsx(
                                    'px-2 py-0.5 rounded-md transition-all',
                                    pieStyle === 'polarArea'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                        : 'text-slate-400'
                                )}
                            >
                                Polar
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex-1 flex flex-col justify-center">
                        {typeLabels.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400 italic">No classification data.</div>
                        ) : (
                            <ReactApexChart
                                key={`classification-${pieStyle}-${theme}`}
                                options={typeChartOptions}
                                series={typeData}
                                type={pieStyle}
                                height={290}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Barangay Vulnerability & Leaderboard (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                    Barangay Activity & Vulnerability
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Incident frequency across Opol administrative jurisdictions
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeBarangay ? (
                                <button
                                    type="button"
                                    onClick={handleClearBarangayFilter}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30 transition-all cursor-pointer active:scale-95"
                                    title="Clear barangay filter to see all areas"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Show All Barangays</span>
                                </button>
                            ) : (
                                <span className="text-xs font-semibold text-slate-400">
                                    {sortedBarangays.length} Areas
                                </span>
                            )}
                        </div>
                    </div>

                    {activeBarangay && (
                        <div className="mt-3 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span>Currently showing only: <strong className="font-bold text-slate-900 dark:text-white capitalize">{activeBarangay}</strong></span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearBarangayFilter}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                                <span>Reset Filter</span>
                            </button>
                        </div>
                    )}

                    <div className="pt-3 flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-white/5">
                                    <th className="py-2.5 px-3">#</th>
                                    <th className="py-2.5 px-3">Barangay</th>
                                    <th className="py-2.5 px-3 text-center">Incidents</th>
                                    <th className="py-2.5 px-3 text-center">Resolved</th>
                                    <th className="py-2.5 px-3 text-center">Share</th>
                                    <th className="py-2.5 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {sortedBarangays.slice(0, 7).map(([brgy, stat]: any, idx) => {
                                    const sharePct =
                                        incidents.length > 0
                                            ? Math.round((stat.total / incidents.length) * 100)
                                            : 0;
                                    const resPct =
                                        stat.total > 0
                                            ? Math.round((stat.resolved / stat.total) * 100)
                                            : 0;
                                    const isFiltered = !!(activeBarangay && activeBarangay.toLowerCase() === brgy.toLowerCase());

                                    return (
                                        <tr
                                            key={brgy}
                                            className={clsx(
                                                "transition-colors group text-xs",
                                                isFiltered
                                                    ? "bg-red-500/[0.06] dark:bg-red-500/[0.08]"
                                                    : "hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                                            )}
                                        >
                                            <td className="py-2 px-3 font-mono font-bold text-slate-400">
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                                {brgy}
                                                {isFiltered && (
                                                    <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.2 rounded font-normal bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                                                {stat.total}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="font-mono text-emerald-500 font-bold">
                                                    {stat.resolved}
                                                </span>
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    ({resPct}%)
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-16 bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-red-500 h-full rounded-full"
                                                            style={{ width: `${sharePct}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-[10px] text-slate-400">
                                                        {sharePct}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {isFiltered ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearBarangayFilter}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-colors cursor-pointer"
                                                        title="Click to remove filter and see all barangays"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        <span>Clear</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFilterBarangay(brgy)}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                        title="Filter by this Barangay"
                                                    >
                                                        <span>Filter</span>
                                                        <ArrowUpRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {sortedBarangays.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">
                                            <p>No barangay activity records match the selected filters.</p>
                                            {activeBarangay && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearBarangayFilter}
                                                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>View All Barangays</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
