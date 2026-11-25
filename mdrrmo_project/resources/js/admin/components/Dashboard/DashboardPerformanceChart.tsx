import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
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

    const series = useMemo(
        () => [
            { name: 'Reported', data: reportedData },
            { name: 'Resolved', data: resolvedData },
            { name: 'Dispatches', data: dispatchData },
        ],
        [reportedData, resolvedData, dispatchData]
    );

    const options: any = useMemo(
        () => ({
            chart: {
                type: 'bar',
                background: 'transparent',
                toolbar: { show: false },
                fontFamily: 'inherit',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
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
        [isDark, categories]
    );

    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            {/* Header: Title */}
            <div className="pb-3 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Incident &amp; Dispatch Performance
                </h3>
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
