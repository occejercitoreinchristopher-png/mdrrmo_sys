import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
    Activity,
    BarChart3,
    MapPin,
    PieChart,
    Radar,
    TrendingUp,
} from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import { toPascalCase } from '@/shared/utils/utils';

const PIE_PALETTE = [
    '#F61509', // MDRRMO Crimson
    '#3b82f6', // Electric Blue
    '#10b981', // Vivid Emerald
    '#f59e0b', // Bright Amber
    '#8b5cf6', // Rich Violet
    '#06b6d4', // Cyan Glow
    '#ec4899', // Rose Pink
];

export default function DashboardCharts({ charts = {} }: { charts?: any }) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const [trendStyle, setTrendStyle] = useState<'bar' | 'area'>('bar');
    const [pieStyle, setPieStyle] = useState<'donut' | 'polarArea'>('donut');
    const [opsTab, setOpsTab] = useState<'dispatch' | 'sources'>('dispatch');

    // --- 1. Monthly Trend Data (100% real DB data) ---
    const categories: string[] = charts.monthly_incidents?.categories ?? ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const reportedData: number[] = charts.monthly_incidents?.data ?? categories.map(() => 0);
    const resolvedData: number[] = charts.monthly_resolved?.data ?? categories.map(() => 0);
    const dispatchData: number[] = charts.monthly_dispatches?.data ?? categories.map(() => 0);

    const sixMonthReported = reportedData.reduce((a, b) => a + b, 0);
    const sixMonthResolved = resolvedData.reduce((a, b) => a + b, 0);
    const sixMonthRate = sixMonthReported > 0 ? Math.round((sixMonthResolved / sixMonthReported) * 100) : 0;

    const trendSeries = useMemo(
        () => [
            { name: 'Reported', data: reportedData },
            { name: 'Resolved', data: resolvedData },
            { name: 'Dispatches', data: dispatchData },
        ],
        [reportedData, resolvedData, dispatchData]
    );

    const trendOptions: any = useMemo(
        () => ({
            chart: {
                type: trendStyle,
                background: 'transparent',
                toolbar: { show: false },
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1050,
                    animateGradually: {
                        enabled: true,
                        delay: 110,
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 550,
                    },
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
            colors: ['#F61509', '#10b981', '#3b82f6'],
            plotOptions: {
                bar: {
                    borderRadius: 7,
                    borderRadiusApplication: 'end',
                    columnWidth: '58%',
                    dataLabels: { position: 'top' },
                },
            },
            fill:
                trendStyle === 'bar'
                    ? {
                          type: 'gradient',
                          gradient: {
                              shade: isDark ? 'dark' : 'light',
                              type: 'vertical',
                              shadeIntensity: 0.35,
                              opacityFrom: 0.98,
                              opacityTo: 0.65,
                              stops: [0, 100],
                          },
                      }
                    : {
                          type: 'gradient',
                          gradient: {
                              shadeIntensity: 1,
                              opacityFrom: 0.42,
                              opacityTo: 0.04,
                              stops: [0, 95, 100],
                          },
                      },
            stroke:
                trendStyle === 'bar'
                    ? { show: true, width: 2, colors: ['transparent'] }
                    : { curve: 'smooth', width: 3 },
            markers:
                trendStyle === 'area'
                    ? {
                          size: 4,
                          strokeWidth: 2,
                          strokeColors: isDark ? '#0b1120' : '#ffffff',
                          hover: { size: 7 },
                      }
                    : { size: 0 },
            xaxis: {
                categories,
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
                        fontSize: '11px',
                    },
                },
            },
            grid: {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                strokeDashArray: 4,
                padding: { left: 6, right: 6 },
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '12px',
                fontWeight: 600,
                labels: { colors: isDark ? '#cbd5e1' : '#334155' },
                markers: { size: 7, offsetX: -3 },
                itemMargin: { horizontal: 10 },
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                shared: true,
                intersect: false,
                y: {
                    formatter: (val: number) => `${val} ${val === 1 ? 'record' : 'records'}`,
                },
            },
            dataLabels: { enabled: false },
        }),
        [isDark, trendStyle, categories]
    );

    // --- 2. Incidents by Type (Animated Donut / Polar Rose Pie — 100% Real DB Data) ---
    const rawIncidentTypes: Array<{ name: string; count: number }> = Array.isArray(charts.incident_types)
        ? charts.incident_types
        : [];
    const totalTypedIncidents = rawIncidentTypes.reduce((sum, item) => sum + (item.count || 0), 0);
    const typeLabels = rawIncidentTypes.map((t) => toPascalCase(t.name));
    const typeSeries = rawIncidentTypes.map((t) => t.count);

    const pieOptions: any = useMemo(
        () => ({
            chart: {
                type: pieStyle,
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1200,
                    animateGradually: {
                        enabled: true,
                        delay: 140,
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 550,
                    },
                },
                dropShadow: {
                    enabled: true,
                    top: 3,
                    left: 0,
                    blur: 10,
                    color: '#000000',
                    opacity: isDark ? 0.35 : 0.1,
                },
            },
            colors: PIE_PALETTE,
            labels: typeLabels,
            fill: {
                type: pieStyle === 'donut' ? 'gradient' : 'solid',
                opacity: pieStyle === 'polarArea' ? 0.88 : 1,
                gradient: {
                    shade: 'dark',
                    type: 'diagonal1',
                    shadeIntensity: 0.25,
                    opacityFrom: 1,
                    opacityTo: 0.85,
                },
            },
            stroke: {
                width: pieStyle === 'donut' ? 3 : 2,
                colors: [isDark ? '#0b1120' : '#ffffff'],
            },
            states: {
                hover: {
                    filter: { type: 'lighten', value: 0.08 },
                },
                active: {
                    allowMultipleDataPointsSelection: false,
                    filter: { type: 'darken', value: 0.1 },
                },
            },
            plotOptions: {
                pie: {
                    expandOnClick: true,
                    donut: {
                        size: '68%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '12px',
                                fontWeight: 600,
                                color: isDark ? '#94a3b8' : '#64748b',
                                offsetY: -4,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                fontWeight: 800,
                                color: isDark ? '#ffffff' : '#0f172a',
                                offsetY: 4,
                            },
                            total: {
                                show: true,
                                showAlways: false,
                                label: 'Total Incidents',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isDark ? '#94a3b8' : '#64748b',
                                formatter: (w: any) =>
                                    w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
                            },
                        },
                    },
                },
                polarArea: {
                    rings: {
                        strokeWidth: 1,
                        strokeColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    },
                    spokes: {
                        strokeWidth: 1,
                        connectorColors: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    },
                },
            },
            yaxis: { show: false },
            legend: { show: false },
            dataLabels: { enabled: false },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number) => {
                        const pct = totalTypedIncidents > 0 ? Math.round((val / totalTypedIncidents) * 100) : 0;
                        return `${val} (${pct}%)`;
                    },
                },
            },
        }),
        [isDark, pieStyle, typeLabels, totalTypedIncidents]
    );

    // --- 3. Top Barangays Horizontal Rising Bar Chart ---
    const topBarangays: Array<{ name: string; count: number }> = Array.isArray(charts.top_barangays)
        ? charts.top_barangays
        : [];
    const barangayLabels = topBarangays.map((b) => `Brgy. ${toPascalCase(b.name)}`);
    const barangayCounts = topBarangays.map((b) => b.count);

    const barangayOptions: any = useMemo(
        () => ({
            chart: {
                type: 'bar',
                background: 'transparent',
                toolbar: { show: false },
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1100,
                    animateGradually: { enabled: true, delay: 120 },
                    dynamicAnimation: { enabled: true, speed: 500 },
                },
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 7,
                    borderRadiusApplication: 'end',
                    barHeight: '58%',
                    distributed: true,
                    dataLabels: { position: 'top' },
                },
            },
            colors: ['#F61509', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    shadeIntensity: 0.25,
                    opacityFrom: 0.95,
                    opacityTo: 0.78,
                    stops: [0, 100],
                },
            },
            dataLabels: {
                enabled: true,
                offsetX: 20,
                style: {
                    fontSize: '11px',
                    fontWeight: 700,
                    colors: [isDark ? '#e2e8f0' : '#0f172a'],
                },
                formatter: (val: number) => `${val}`,
            },
            xaxis: {
                categories: barangayLabels,
                labels: {
                    style: { colors: isDark ? '#64748b' : '#64748b', fontSize: '11px' },
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: isDark ? '#cbd5e1' : '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                    },
                },
            },
            grid: {
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)',
                strokeDashArray: 4,
                xaxis: { lines: { show: true } },
                yaxis: { lines: { show: false } },
            },
            legend: { show: false },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: { formatter: (val: number) => `${val} incident(s)` },
            },
        }),
        [isDark, barangayLabels]
    );

    // --- 4. Dispatch Pipeline (Animated Multi-Ring RadialBar) & Report Channels (Donut) ---
    const dispatchLabels: string[] = charts.dispatch_status?.labels ?? ['Completed', 'On Scene', 'En Route', 'Assigned'];
    const dispatchRawCounts: number[] = charts.dispatch_status?.data ?? [0, 0, 0, 0];
    const totalDispatchCount = dispatchRawCounts.reduce((a, b) => a + b, 0);
    const dispatchPercentages = dispatchRawCounts.map((c) =>
        totalDispatchCount > 0 ? Math.round((c / totalDispatchCount) * 100) : 0
    );

    const dispatchRadialOptions: any = useMemo(
        () => ({
            chart: {
                type: 'radialBar',
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1300,
                    animateGradually: { enabled: true, delay: 160 },
                    dynamicAnimation: { enabled: true, speed: 500 },
                },
            },
            plotOptions: {
                radialBar: {
                    offsetY: 0,
                    startAngle: 0,
                    endAngle: 270,
                    hollow: {
                        margin: 5,
                        size: '32%',
                        background: 'transparent',
                    },
                    track: {
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
                    },
                    dataLabels: {
                        name: { show: false },
                        value: { show: false },
                    },
                },
            },
            colors: ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6'],
            labels: dispatchLabels,
            stroke: { lineCap: 'round' },
            legend: {
                show: true,
                floating: true,
                fontSize: '12px',
                fontWeight: 600,
                position: 'left',
                offsetX: 6,
                offsetY: 10,
                labels: { useSeriesColors: true },
                formatter: (seriesName: string, opts: any) => {
                    const count = dispatchRawCounts[opts.seriesIndex] ?? 0;
                    return `${seriesName}:  ${count}`;
                },
                itemMargin: { vertical: 4 },
            },
            tooltip: {
                enabled: true,
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number, opts: any) => {
                        const count = dispatchRawCounts[opts.seriesIndex] ?? 0;
                        return `${count} (${val}%)`;
                    },
                },
            },
        }),
        [isDark, dispatchLabels, dispatchRawCounts]
    );

    const reportSources: Array<{ name: string; count: number }> = Array.isArray(charts.report_sources)
        ? charts.report_sources
        : [];
    const totalSourceReports = reportSources.reduce((a, b) => a + (b.count || 0), 0);
    const sourceLabels = reportSources.map((s) => s.name);
    const sourceSeries = reportSources.map((s) => s.count);

    const sourcesDonutOptions: any = useMemo(
        () => ({
            chart: {
                type: 'donut',
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1150,
                    animateGradually: { enabled: true, delay: 140 },
                },
            },
            colors: ['#10b981', '#F61509', '#3b82f6'],
            labels: sourceLabels,
            stroke: { width: 3, colors: [isDark ? '#0b1120' : '#ffffff'] },
            plotOptions: {
                pie: {
                    expandOnClick: true,
                    donut: {
                        size: '66%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Reports',
                                color: isDark ? '#94a3b8' : '#64748b',
                                fontSize: '11px',
                                fontWeight: 600,
                            },
                            value: {
                                color: isDark ? '#ffffff' : '#0f172a',
                                fontSize: '24px',
                                fontWeight: 800,
                            },
                        },
                    },
                },
            },
            legend: {
                position: 'bottom',
                fontSize: '12px',
                fontWeight: 600,
                labels: { colors: isDark ? '#cbd5e1' : '#334155' },
            },
            dataLabels: { enabled: false },
            tooltip: { theme: isDark ? 'dark' : 'light' },
        }),
        [isDark, sourceLabels]
    );

    return (
        <div className="space-y-4 mb-6">
            {/* ROW 1: Main Trend Graph (8 cols) + Animated Incident Type Pie/Donut (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Rising Bar / Smooth Area Trend */}
                <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#F61509]">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                    Incident &amp; Dispatch Performance (6 Months)
                                </h3>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                    {sixMonthReported} reported • {sixMonthResolved} resolved ({sixMonthRate}% clearance)
                                </p>
                            </div>
                        </div>

                        {/* Bar / Area Switcher */}
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setTrendStyle('bar')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    trendStyle === 'bar'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                Rising Bars
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendStyle('area')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    trendStyle === 'area'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Activity className="w-3.5 h-3.5" />
                                Area Wave
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1">
                        <ReactApexChart
                            key={`trend-${trendStyle}-${isDark ? 'dark' : 'light'}`}
                            options={trendOptions}
                            series={trendSeries}
                            type={trendStyle}
                            height={285}
                        />
                    </div>
                </div>

                {/* Animated Incidents by Type Donut / Polar Rose Pie */}
                <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#F61509]">
                                <PieChart className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                    Incidents by Type
                                </h3>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                    Live emergency distribution
                                </p>
                            </div>
                        </div>

                        {/* Donut / Polar Rose Switcher */}
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setPieStyle('donut')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    pieStyle === 'donut'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Donut
                            </button>
                            <button
                                type="button"
                                onClick={() => setPieStyle('polarArea')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    pieStyle === 'polarArea'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Polar
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                        {totalTypedIncidents === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                No categorized incidents recorded yet.
                            </div>
                        ) : (
                            <>
                                <ReactApexChart
                                    key={`pie-${pieStyle}-${isDark ? 'dark' : 'light'}`}
                                    options={pieOptions}
                                    series={typeSeries}
                                    type={pieStyle}
                                    height={215}
                                />

                                {/* Custom Sleek Legend Bars */}
                                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2 max-h-[120px] overflow-y-auto pr-1">
                                    {rawIncidentTypes.slice(0, 5).map((item, idx) => {
                                        const pct = Math.round((item.count / totalTypedIncidents) * 100);
                                        const dotColor = PIE_PALETTE[idx % PIE_PALETTE.length];
                                        return (
                                            <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: dotColor }}
                                                    />
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate capitalize">
                                                        {toPascalCase(item.name)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {item.count}
                                                    </span>
                                                    <span className="text-slate-400 dark:text-slate-500 w-8 text-right">
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 2: Top Incident Barangays (6 cols) + Dispatch Pipeline / Report Sources (6 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Animated Horizontal Rising Bar Chart: Top Barangays */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#F61509]">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                    Top Barangays by Incident Volume
                                </h3>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                    Highest reported emergency locations in Opol
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        {topBarangays.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                No barangay incident data available yet.
                            </div>
                        ) : (
                            <ReactApexChart
                                key={`brgy-${isDark ? 'dark' : 'light'}`}
                                options={barangayOptions}
                                series={[{ name: 'Incidents', data: barangayCounts }]}
                                type="bar"
                                height={235}
                            />
                        )}
                    </div>
                </div>

                {/* Animated Dispatch Pipeline Radial / Report Channels Donut */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#F61509]">
                                <Radar className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                    {opsTab === 'dispatch' ? 'Dispatch Status Pipeline' : 'Report Intake Channels'}
                                </h3>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                    {opsTab === 'dispatch'
                                        ? `${totalDispatchCount} total ambulance dispatches tracked`
                                        : `${totalSourceReports} reports across app, phone & walk-in`}
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setOpsTab('dispatch')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    opsTab === 'dispatch'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Dispatch Rings
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpsTab('sources')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    opsTab === 'sources'
                                        ? 'bg-[#F61509] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Channels
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex items-center justify-center">
                        {opsTab === 'dispatch' ? (
                            totalDispatchCount === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                    No dispatch logs recorded yet.
                                </div>
                            ) : (
                                <div className="w-full">
                                    <ReactApexChart
                                        key={`dispatch-radial-${isDark ? 'dark' : 'light'}`}
                                        options={dispatchRadialOptions}
                                        series={dispatchPercentages}
                                        type="radialBar"
                                        height={235}
                                    />
                                </div>
                            )
                        ) : totalSourceReports === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                No incident channel data yet.
                            </div>
                        ) : (
                            <div className="w-full max-w-[340px]">
                                <ReactApexChart
                                    key={`sources-donut-${isDark ? 'dark' : 'light'}`}
                                    options={sourcesDonutOptions}
                                    series={sourceSeries}
                                    type="donut"
                                    height={235}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
