import Card from '@/shared/components/Card';
import ReactApexChart from 'react-apexcharts';
import { useAppearance } from '@/shared/contexts/ThemeContext';

export default function IncidentIntelligence({ incidents }) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    // Calculate Trend Data (Reported vs Resolved per month or day based on date span)
    const trends: Record<string, { reported: number; resolved: number }> = {};
    const typeDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    const barangayActivity: Record<string, { total: number; resolved: number; rejected: number }> = {};

    incidents.forEach(inc => {
        // Trend (group by Month for now, could be Day if span is short)
        if (inc.reported_at) {
            const date = new Date(inc.reported_at);
            const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!trends[key]) trends[key] = { reported: 0, resolved: 0 };
            trends[key].reported++;
            if (inc.incident_status === 'resolved') trends[key].resolved++;
        }

        // Type
        const typeName = inc.incident_type?.incident_type_name || 'General';
        typeDistribution[typeName] = (typeDistribution[typeName] || 0) + 1;

        // Status
        const status = inc.incident_status || 'pending';
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;

        // Barangay
        const brgy = inc.barangay || 'Unknown';
        if (!barangayActivity[brgy]) barangayActivity[brgy] = { total: 0, resolved: 0, rejected: 0 };
        barangayActivity[brgy].total++;
        if (inc.incident_status === 'resolved') barangayActivity[brgy].resolved++;
        if (inc.incident_status === 'rejected') barangayActivity[brgy].rejected++;
    });

    const trendLabels = Object.keys(trends).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const trendReported = trendLabels.map(k => trends[k].reported);
    const trendResolved = trendLabels.map(k => trends[k].resolved);

    const typeLabels = Object.keys(typeDistribution);
    const typeData = Object.values(typeDistribution);

    const statusLabels = Object.keys(statusDistribution).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const statusData = Object.values(statusDistribution);

    const getBaseOptions = (categories: any) => ({
        chart: { background: 'transparent', toolbar: { show: false } },
        theme: { mode: (isDark ? 'dark' : 'light') as 'dark' | 'light' },
        xaxis: {
            categories,
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '10px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } } },
        grid: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', strokeDashArray: 4 },
        dataLabels: { enabled: false },
        tooltip: { theme: (isDark ? 'dark' : 'light') as 'dark' | 'light' },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-rose-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    01 Incident Intelligence
                </h2>
            </div>

            <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm mb-4">
                <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Reported vs Resolved Trend</h3>
                </div>
                <div className="p-4">
                    {trendLabels.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500 italic">No trend data for selected filters.</div>
                    ) : (
                        <ReactApexChart
                            key={`trend-${theme}`}
                            options={{
                                ...getBaseOptions(trendLabels),
                                colors: ['#3b82f6', '#10b981'],
                                stroke: { curve: 'smooth', width: 3 },
                                markers: { size: 4, strokeWidth: 2, hover: { size: 6 } }
                            }}
                            series={[
                                { name: 'Reported', data: trendReported },
                                { name: 'Resolved', data: trendResolved }
                            ]}
                            type="area"
                            height={250}
                        />
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm">
                    <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Incident Distribution</h3>
                    </div>
                    <div className="p-4 flex justify-center">
                        {typeLabels.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 italic">No type data.</div>
                        ) : (
                            <ReactApexChart
                                key={`type-${theme}`}
                                options={{
                                    chart: { type: 'donut', background: 'transparent' },
                                    labels: typeLabels,
                                    theme: { mode: (isDark ? 'dark' : 'light') as 'dark' | 'light' },
                                    dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(1)}%` },
                                    legend: { position: 'bottom' },
                                    stroke: { show: false }
                                }}
                                series={typeData}
                                type="donut"
                                height={280}
                            />
                        )}
                    </div>
                </Card>
                <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm">
                    <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Status Distribution</h3>
                    </div>
                    <div className="p-4 flex justify-center">
                        {statusLabels.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500 italic">No status data.</div>
                        ) : (
                            <ReactApexChart
                                key={`status-${theme}`}
                                options={{
                                    chart: { type: 'pie', background: 'transparent' },
                                    labels: statusLabels,
                                    theme: { mode: (isDark ? 'dark' : 'light') as 'dark' | 'light' },
                                    colors: ['#64748b', '#3b82f6', '#8b5cf6', '#eab308', '#10b981', '#ef4444'],
                                    dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(1)}%` },
                                    legend: { position: 'bottom' },
                                    stroke: { show: false }
                                }}
                                series={statusData}
                                type="pie"
                                height={280}
                            />
                        )}
                    </div>
                </Card>
            </div>

            <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Incident Activity by Barangay</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <th className="p-3">Barangay</th>
                                <th className="p-3 text-center">Total Incidents</th>
                                <th className="p-3 text-center">Resolved</th>
                                <th className="p-3 text-center">Rejected</th>
                                <th className="p-3 text-center">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {Object.entries(barangayActivity)
                                .sort(([,a]: any, [,b]: any) => b.total - a.total)
                                .map(([brgy, stat]: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] text-sm text-slate-700 dark:text-slate-300">
                                    <td className="p-3 font-medium">{brgy}</td>
                                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{stat.total}</td>
                                    <td className="p-3 text-center font-medium text-emerald-600 dark:text-emerald-400">{stat.resolved}</td>
                                    <td className="p-3 text-center font-medium text-rose-600 dark:text-rose-400">{stat.rejected}</td>
                                    <td className="p-3 text-center font-mono text-xs">{((stat.total / incidents.length) * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                            {Object.keys(barangayActivity).length === 0 && (
                                <tr><td colSpan={5} className="p-4 text-center text-sm text-slate-500 italic">No barangay data matching filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
