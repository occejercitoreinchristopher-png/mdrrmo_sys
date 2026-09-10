import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import Card from '@/shared/components/Card';

export interface ChartsData {
    months?: string[];
    incidents_per_month?: number[];
    resolved_per_month?: number[];
}

export interface ReportsChartsProps {
    charts?: ChartsData;
}

const baseOptions = (categories?: string[]): ApexOptions => ({
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
    colors: ['#3b82f6'],
    xaxis: {
        categories: categories ?? [],
        labels: { style: { colors: '#64748b' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' },
});

export default function ReportsCharts({ charts = {} }: ReportsChartsProps) {
    const months = charts.months ?? ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
    const incidentData = charts.incidents_per_month ?? [5,8,12,7,14,10,9];
    const resolvedData = charts.resolved_per_month ?? [4,7,10,6,12,9,8];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card padding={false}>
                <div className="p-5 border-b border-white/10">
                    <h3 className="font-semibold text-white text-sm">Incidents per Month</h3>
                </div>
                <div className="p-4">
                    <ReactApexChart options={baseOptions(months)} series={[{ name: 'Incidents', data: incidentData }]} type="bar" height={220} />
                </div>
            </Card>
            <Card padding={false}>
                <div className="p-5 border-b border-white/10">
                    <h3 className="font-semibold text-white text-sm">Resolved per Month</h3>
                </div>
                <div className="p-4">
                    <ReactApexChart options={{ ...baseOptions(months), colors: ['#10b981'] }} series={[{ name: 'Resolved', data: resolvedData }]} type="bar" height={220} />
                </div>
            </Card>
        </div>
    );
}
