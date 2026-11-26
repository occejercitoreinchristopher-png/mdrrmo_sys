import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp } from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import DashboardPieCard from '@/admin/components/Dashboard/DashboardPieCard';

export default function DashboardCharts({
    charts = {},
    stats = {},
    extraData = {},
}: {
    charts?: any;
    stats?: any;
    extraData?: any;
}) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

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
                type: 'bar',
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
                dropShadow: { enabled: false },
            },
            // Strict 3 colors: Crimson, Emerald, Blue
            colors: ['#F61509', '#10B981', '#3B82F6'],
            plotOptions: {
                bar: {
                    borderRadius: 7,
                    borderRadiusApplication: 'end',
                    columnWidth: '58%',
                    dataLabels: { position: 'top' },
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: isDark ? 'dark' : 'light',
                    type: 'vertical',
                    shadeIntensity: 0.35,
                    opacityFrom: 0.98,
                    opacityTo: 0.65,
                    stops: [0, 100],
                },
            },
            stroke: { show: true, width: 2, colors: ['transparent'] },
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
            legend: { show: false },
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
        [isDark, categories]
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
            {/* Main Rising Bar Trend (7-8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                    <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#F61509]">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                    Incident &amp; Dispatch Performance
                                </h3>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                    {sixMonthReported} reported • {sixMonthResolved} resolved
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <ReactApexChart
                            key={`trend-bar-${isDark ? 'dark' : 'light'}`}
                            options={trendOptions}
                            series={trendSeries}
                            type="bar"
                            height={320}
                        />
                    </div>
                </div>
            </div>

            {/* Two-Tab Incident Analytics Card (4-5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <DashboardPieCard
                    stats={stats}
                    charts={charts}
                    extraData={extraData}
                />
            </div>
        </div>
    );
}
