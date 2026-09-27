import { useState } from 'react';
import DashboardCards from '@/admin/components/Dashboard/DashboardCards';
import ReportsCharts, { ChartsData } from './ReportsCharts';
import ReportsTable, { Incident } from './ReportsTable';
import ReportFilters, { ReportFiltersState } from './ReportFilters';
import PageHeader from '@/shared/components/PageHeader';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportsDashboardProps {
    stats?: Record<string, any>;
    charts?: ChartsData;
    incidents?: Incident[];
}

export default function ReportsDashboard({ stats = {}, charts = {}, incidents = [] }: ReportsDashboardProps) {
    const [filters, setFilters] = useState<ReportFiltersState>({ dateFrom: '', dateTo: '', status: '', type: '' });

    const handleExportCSV = () => {
        const filteredIncidents = incidents.filter((inc) => {
            const matchStatus = !filters.status || inc.incident_status === filters.status;
            const matchType = !filters.type || String(inc.incident_type_id) === String(filters.type);
            const matchFrom = !filters.dateFrom || (inc.reported_at && new Date(inc.reported_at) >= new Date(filters.dateFrom));
            const matchTo = !filters.dateTo || (inc.reported_at && new Date(inc.reported_at) <= new Date(filters.dateTo + 'T23:59:59'));
            return matchStatus && matchType && matchFrom && matchTo;
        });

        const headers = [
            'Incident #',
            'Incident Type',
            'Priority',
            'Status',
            'Caller / Resident',
            'Contact Number',
            'Incident Address',
            'Report Source',
            'Location Source',
            'Reported At',
            'Resolved At',
        ];

        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        if (incidents.length === 0) {
            // Generate empty CSV template with headers so user has a valid file
            const csvContent = headers.map(escapeCSV).join(',') + '\r\n';
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `MDRRMO_Reports_Template_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.info('No incident records found in the database. Downloaded standard CSV template.');
            return;
        }

        if (filteredIncidents.length === 0) {
            toast.warning('No incidents match the active filter criteria.');
            return;
        }

        const rows = filteredIncidents.map((inc) => [
            escapeCSV(`#${inc.id}`),
            escapeCSV(inc.incident_type?.name ?? inc.incident_type?.incident_type_name ?? 'General'),
            escapeCSV(inc.priority ?? 'Moderate'),
            escapeCSV(inc.incident_status ?? 'pending'),
            escapeCSV(inc.caller_name ?? (inc.resident ? `${inc.resident.first_name ?? ''} ${inc.resident.last_name ?? ''}`.trim() : 'N/A')),
            escapeCSV(inc.caller_phone_number ?? inc.resident?.phone_number ?? 'N/A'),
            escapeCSV(inc.incident_address ?? inc.place_of_incident ?? inc.location ?? 'N/A'),
            escapeCSV(inc.report_source ?? 'N/A'),
            escapeCSV(inc.location_source ?? 'N/A'),
            escapeCSV(inc.reported_at ? new Date(inc.reported_at).toLocaleString('en-PH') : 'N/A'),
            escapeCSV(inc.resolved_at ? new Date(inc.resolved_at).toLocaleString('en-PH') : 'N/A'),
        ]);

        const csvContent = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MDRRMO_Incident_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Successfully exported ${filteredIncidents.length} incident record(s) to CSV.`);
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
