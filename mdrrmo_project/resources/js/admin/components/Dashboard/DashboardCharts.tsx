import ReactApexChart from 'react-apexcharts';
import Card from '@/shared/components/Card';

const incidentsByTypeOptions = {
    chart: { type: 'donut', background: 'transparent' },
    colors: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'],
    labels: [],
    legend: {
        position: 'bottom',
        labels: { colors: '#94a3b8' },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
        pie: {
            donut: {
                size: '65%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Total',
                        color: '#ffffff',
                        formatter: (w) =>
                            w.globals.seriesTotals.reduce((a, b) => a + b, 0),
                    },
                    value: { color: '#ffffff', fontSize: '22px', fontWeight: 700 },
                },
            },
        },
    },
    tooltip: { theme: 'dark' },
};

const incidentsTrendOptions = {
    chart: {
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        sparkline: { enabled: false },
    },
    colors: ['#3b82f6', '#10b981'],
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] },
    },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        labels: { style: { colors: '#64748b' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
    legend: { labels: { colors: '#94a3b8' } },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false },
};

export default function DashboardCharts({ charts = {} }) {
    const typeLabels = charts.incident_types?.map((t) => t.name) ?? [
        'Fire', 'Medical', 'Flood', 'Accident', 'Other',
    ];
    const typeSeries = charts.incident_types?.map((t) => t.count) ?? [12, 28, 8, 15, 6];

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
                        options={incidentsTrendOptions}
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
                        options={{ ...incidentsByTypeOptions, labels: typeLabels }}
                        series={typeSeries}
                        type="donut"
                        height={240}
                    />
                </div>
            </Card>
        </div>
    );
}
