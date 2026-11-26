import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { RotateCcw } from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';

interface DashboardPerformanceChartProps {
    charts?: any;
}

export default function DashboardPerformanceChart({ charts = {} }: DashboardPerformanceChartProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const categories: string[] = charts.monthly_incidents?.categories ?? ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const reportedData: number[] = charts.monthly_incidents?.data ?? categories.map(() => 0);
    const resolvedData: number[] = charts.monthly_resolved?.data ?? categories.map(() => 0);
    const dispatchData: number[] = charts.monthly_dispatches?.data ?? categories.map(() => 0);

    const sixMonthReported = reportedData.reduce((a, b) => a + b, 0);
    const sixMonthResolved = resolvedData.reduce((a, b) => a + b, 0);
    const clearanceRate = sixMonthReported > 0 ? Math.round((sixMonthResolved / sixMonthReported) * 100) : 0;

    // Trigger visible rising animation on load and updates
    const [isChartReady, setIsChartReady] = useState(false);

    useEffect(() => {
        setIsChartReady(false);
        const timer = setTimeout(() => {
            setIsChartReady(true);
        }, 150);
        return () => clearTimeout(timer);
    }, [JSON.stringify(reportedData), JSON.stringify(resolvedData), JSON.stringify(dispatchData)]);

    const series = useMemo(
        () => [
            {
                name: 'Reported',
                data: isChartReady ? reportedData : categories.map(() => 0),
            },
            {
                name: 'Resolved',
                data: isChartReady ? resolvedData : categories.map(() => 0),
            },
            {
                name: 'Dispatches',
                data: isChartReady ? dispatchData : categories.map(() => 0),
            },
        ],
        [isChartReady, reportedData, resolvedData, dispatchData, categories]
    );

    const maxVal = Math.max(1, ...reportedData, ...resolvedData, ...dispatchData);
    const yAxisMax = Math.max(10, Math.ceil(maxVal * 1.15));

    const options: any = useMemo(
        () => ({
            chart: {
                type: 'bar',
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
                        speed: 1000,
                    },
                },
            },
            colors: ['#F61509', '#10b981', '#3b82f6'],
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 7,
                    borderRadiusApplication: 'end',
                    columnWidth: '55%',
                    dataLabels: { position: 'top' },
                },
            },
            dataLabels: { enabled: false },
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
                max: yAxisMax,
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
                padding: { top: 0, right: 10, bottom: 0, left: 10 },
            },
            legend: { show: false },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val: number) => `${val} incidents`,
                },
            },
        }),
        [isDark, categories, yAxisMax]
    );

    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120] p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-in fade-in-50 duration-300">
            {/* Header: Title */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Incident &amp; Dispatch Performance
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setIsChartReady(false);
                            setTimeout(() => setIsChartReady(true), 80);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Replay bar chart animation"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bar Chart Container */}
            <div className="pt-2">
                <ReactApexChart
                    key={`perf-chart-${isDark ? 'dark' : 'light'}`}
                    options={options}
                    series={series}
                    type="bar"
                    height={285}
                />
            </div>
        </div>
    );
}
