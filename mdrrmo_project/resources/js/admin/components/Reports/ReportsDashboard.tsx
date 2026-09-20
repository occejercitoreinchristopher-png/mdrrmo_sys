import { useState } from 'react';
import DashboardCards from '@/admin/components/Dashboard/DashboardCards';
import ReportsCharts, { ChartsData } from './ReportsCharts';
import ReportsTable, { Incident } from './ReportsTable';
import ReportFilters, { ReportFiltersState } from './ReportFilters';
import PageHeader from '@/shared/components/PageHeader';
import { Download } from 'lucide-react';

export interface ReportsDashboardProps {
    stats?: Record<string, any>;
    charts?: ChartsData;
    incidents?: Incident[];
}

export default function ReportsDashboard({ stats = {}, charts = {}, incidents = [] }: ReportsDashboardProps) {
    const [filters, setFilters] = useState<ReportFiltersState>({ dateFrom: '', dateTo: '', status: '', type: '' });

    const handleExportCSV = () => {
        if (!incidents.length) return;
        const headers = ['ID', 'Incident Type', 'Status', 'Reported At', 'Resolved At'];
        const rows = incidents.map((inc) => [
            inc.id,
            inc.incident_type?.name ?? 'General',
            inc.incident_status,
            inc.reported_at ? new Date(inc.reported_at).toISOString() : '',
            inc.resolved_at ? new Date(inc.resolved_at).toISOString() : '',
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `MDRRMO_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports & Analytics"
                subtitle="High-level emergency intelligence, resolution rates, and dispatch timelines."
                actions={
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                }
            />

            <ReportFilters filters={filters} onChange={setFilters} />
            <DashboardCards stats={stats} />
            <ReportsCharts charts={charts} />
            <ReportsTable incidents={incidents} filters={filters} />
        </div>
    );
}
