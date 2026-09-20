import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import Card from '@/shared/components/Card';
import { useAppearance } from '@/shared/contexts/ThemeContext';

export interface ChartsData {
    months?: string[];
    incidents_per_month?: number[];
    resolved_per_month?: number[];
}

export interface ReportsChartsProps {
    charts?: ChartsData;
}

export default function ReportsCharts({ charts = {} }: ReportsChartsProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const months = charts.months ?? ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
    const incidentData = charts.incidents_per_month ?? [5,8,12,7,14,10,9];
    const resolvedData = charts.resolved_per_month ?? [4,7,10,6,12,9,8];

    const getBaseOptions = (categories: string[], color: string): ApexOptions => ({
        chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
        colors: [color],
        xaxis: {
            categories,
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } } },
        grid: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', strokeDashArray: 4 },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
        dataLabels: { enabled: false },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card padding={false}>
                <div className="p-5 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Incidents per Month</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total reported volume</p>
                </div>
                <div className="p-4">
                    <ReactApexChart key={`incidents-${theme}`} options={getBaseOptions(months, '#3b82f6')} series={[{ name: 'Incidents', data: incidentData }]} type="bar" height={220} />
                </div>
            </Card>
            <Card padding={false}>
                <div className="p-5 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Resolved per Month</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Successfully closed cases</p>
                </div>
                <div className="p-4">
                    <ReactApexChart key={`resolved-${theme}`} options={getBaseOptions(months, '#10b981')} series={[{ name: 'Resolved', data: resolvedData }]} type="bar" height={220} />
                </div>
            </Card>
        </div>
    );
}
