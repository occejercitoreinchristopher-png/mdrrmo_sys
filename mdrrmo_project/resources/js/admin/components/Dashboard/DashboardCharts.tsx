import ReactApexChart from 'react-apexcharts';
import Card from '@/shared/components/Card';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import { useMemo } from 'react';

export default function DashboardCharts({ charts = {} }: { charts?: any }) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const typeLabels = charts.incident_types?.map((t: any) => t.name) ?? [
        'Fire', 'Medical', 'Flood', 'Accident', 'Other',
    ];
    const typeSeries = charts.incident_types?.map((t: any) => t.count) ?? [12, 28, 8, 15, 6];

    const trendSeries = [
        {
            name: 'Incidents',
            data: charts.monthly_incidents ?? [10, 14, 8, 20, 16, 24, 18],
        },
        {
            name: 'Resolved',
            data: charts.monthly_resolved ?? [8, 12, 6, 18, 14, 20, 16],
        },
    ];

    const donutOptions: any = useMemo(() => ({
        chart: { type: 'donut', background: 'transparent' },
        colors: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'],
        labels: typeLabels,
        legend: {
            position: 'bottom',
            labels: { colors: isDark ? '#94a3b8' : '#475569' },
        },
        dataLabels: { enabled: false },
        stroke: { width: isDark ? 0 : 2, colors: isDark ? [] : ['#ffffff'] },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            color: isDark ? '#ffffff' : '#0f172a',
                            formatter: (w: any) =>
                                w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
                        },
                        value: { color: isDark ? '#ffffff' : '#0f172a', fontSize: '22px', fontWeight: 700 },
                    },
                },
            },
        },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    }), [isDark, typeLabels]);

    const trendOptions: any = useMemo(() => ({
        chart: {
            type: 'area',
            background: 'transparent',
            toolbar: { show: false },
            sparkline: { enabled: false },
        },
        colors: ['#3b82f6', '#10b981'],
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
        },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            labels: { style: { colors: '#64748b' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: '#64748b' } } },
        grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', strokeDashArray: 4 },
        legend: { labels: { colors: isDark ? '#94a3b8' : '#475569' } },
        tooltip: { theme: isDark ? 'dark' : 'light' },
        dataLabels: { enabled: false },
    }), [isDark]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2" padding={false}>
                <div className="p-5 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Incident Trend (Monthly)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Incidents reported vs resolved
                    </p>
                </div>
                <div className="p-4">
                    <ReactApexChart
                        key={`trend-${theme}`}
                        options={trendOptions}
                        series={trendSeries}
                        type="area"
                        height={240}
                    />
                </div>
            </Card>

            <Card padding={false}>
                <div className="p-5 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Incidents by Type
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution</p>
                </div>
                <div className="p-4">
                    <ReactApexChart
                        key={`donut-${theme}`}
                        options={donutOptions}
                        series={typeSeries}
                        type="donut"
                        height={240}
                    />
                </div>
            </Card>
        </div>
    );
}
