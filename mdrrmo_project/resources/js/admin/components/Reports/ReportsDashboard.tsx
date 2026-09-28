import { useState } from 'react';
import PageHeader from '@/shared/components/PageHeader';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

import ReportFilters from './ReportFilters';
import ReportOverview from './ReportOverview';
import IncidentIntelligence from './IncidentIntelligence';
import ResponseOperations from './ResponseOperations';
import PatientCareAnalytics from './PatientCareAnalytics';
import ReportsGeographic from './ReportsGeographic';

export default function ReportsDashboard({ stats = {}, incidents = [], lookups = {}, initialFilters = {} }: any) {
    
    const handleExportCSV = () => {
        const headers = [
            'Incident #', 'Incident Type', 'Priority', 'Status', 'Barangay', 'Reported At', 'Resolved At'
        ];
        
        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
        };

        if (incidents.length === 0) {
            toast.warning('No incidents available to export.');
            return;
        }

        const rows = incidents.map((inc: any) => [
            escapeCSV(`#${inc.id}`),
            escapeCSV(inc.incident_type?.name ?? inc.incident_type?.incident_type_name ?? 'General'),
            escapeCSV(inc.priority ?? 'Moderate'),
            escapeCSV(inc.incident_status ?? 'pending'),
            escapeCSV(inc.barangay ?? 'N/A'),
            escapeCSV(inc.reported_at ? new Date(inc.reported_at).toLocaleString('en-PH') : 'N/A'),
            escapeCSV(inc.resolved_at ? new Date(inc.resolved_at).toLocaleString('en-PH') : 'N/A'),
        ]);

        const csvContent = [headers.map(escapeCSV).join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MDRRMO_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${incidents.length} record(s) to CSV.`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 print:space-y-4 print:bg-white print:text-black">
            
            {/* Header (Hidden in print, replaced by specific print header) */}
            <div className="print:hidden">
                <PageHeader
                    title="Reports & Analytics"
                    subtitle="Operational performance, incident patterns, dispatch activity, and patient-care statistics"
                />
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">MDRRMO OPOL</h1>
                <h2 className="text-xl font-bold text-slate-700">Emergency Medical Services Management System</h2>
                <h3 className="text-lg font-semibold text-slate-600 mt-2">Operational Report</h3>
                <div className="mt-4 text-sm text-slate-600 flex flex-col gap-1">
                    <p><strong>Report Date:</strong> {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Total Records:</strong> {incidents.length} incidents</p>
                    {/* Display active filters */}
                    <div className="mt-2 text-xs">
                        <strong>Filters Applied: </strong>
                        {Object.entries(initialFilters).filter(([_,v]) => v).length > 0 ? (
                            Object.entries(initialFilters).filter(([_,v]) => v).map(([k,v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`).join(' | ')
                        ) : 'None (All Records)'}
                    </div>
                </div>
            </div>

            {/* Global Filters */}
            <ReportFilters initialFilters={initialFilters} lookups={lookups} />

            {/* Actions for Web (Hidden in Print) */}
            <div className="flex flex-wrap items-center gap-3 print:hidden border-b border-slate-200 dark:border-white/10 pb-6">
                <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                >
                    <FileText className="w-4 h-4" />
                    <span>Export CSV / Excel</span>
                </button>
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-sm hover:bg-indigo-700 transition-all cursor-pointer active:scale-95"
                >
                    <Printer className="w-4 h-4" />
                    <span>Print PDF Report</span>
                </button>
            </div>

            {/* Report Sections */}
            <div className="space-y-12 print:space-y-8">
                <ReportOverview stats={stats} />
                <hr className="border-slate-200 dark:border-white/5 print:border-slate-300" />
                <IncidentIntelligence incidents={incidents} />
                <hr className="border-slate-200 dark:border-white/5 print:border-slate-300" />
                <ResponseOperations stats={stats} incidents={incidents} />
                <hr className="border-slate-200 dark:border-white/5 print:border-slate-300" />
                <PatientCareAnalytics stats={stats} />
                <hr className="border-slate-200 dark:border-white/5 print:hidden" />
                <ReportsGeographic incidents={incidents} />
            </div>
            
        </div>
    );
}
