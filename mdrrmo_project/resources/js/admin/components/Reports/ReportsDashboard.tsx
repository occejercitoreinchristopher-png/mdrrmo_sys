import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Printer,
    FileText,
    TrendingUp,
    Truck,
    Stethoscope,
    MapPin,
    Layers,
    ListFilter,
    Table,
    Sparkles,
    Calendar,
    ArrowDownToLine,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

import ReportFilters from './ReportFilters';
import ReportOverview from './ReportOverview';
import IncidentIntelligence from './IncidentIntelligence';
import ResponseOperations from './ResponseOperations';
import PatientCareAnalytics from './PatientCareAnalytics';
import ReportsGeographic from './ReportsGeographic';
import ReportsTable from './ReportsTable';

export default function ReportsDashboard({
    stats = {},
    incidents = [],
    lookups = {},
    initialFilters = {},
    initialMonthlyReport = null,
}: any) {
    const { auth } = usePage().props as any;

    // Active View Tab: 'intelligence' | 'fleet' | 'pcr' | 'geographic' | 'records' | 'all'
    const [activeTab, setActiveTab] = useState<
        'intelligence' | 'fleet' | 'pcr' | 'geographic' | 'records' | 'all'
    >('all');

    const handleExportCSV = () => {
        const headers = [
            'Incident #',
            'Incident Type',
            'Priority',
            'Status',
            'Barangay',
            'Address',
            'Reported At',
            'Resolved At',
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
            escapeCSV(inc.incident_address ?? 'N/A'),
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

    const tabs = [
        { id: 'all', label: 'All Modules', icon: Layers, badge: incidents.length },
        { id: 'intelligence', label: 'Incident Trends', icon: TrendingUp },
        { id: 'fleet', label: 'Fleet & Response', icon: Truck },
        { id: 'pcr', label: 'Patient Care (PCR)', icon: Stethoscope },
        { id: 'geographic', label: 'Spatial Heatmap', icon: MapPin },
        { id: 'records', label: 'Incident Records', icon: Table, badge: incidents.length },
    ];

    return (
        <div className="space-y-6 print:space-y-4 print:bg-white print:text-black">
            {/* Top Command Center Header (Screen only) */}
            <div className="print:hidden rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 text-white border border-slate-800/80 shadow-xl relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Title & Metadata */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                                <Shield className="w-3 h-3 text-red-500" />
                                <span>MDRRMO HQ • Executive Intelligence</span>
                            </span>
                            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                            <span className="text-slate-400 text-xs font-mono hidden sm:inline">
                                Municipality of Opol
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Reports & Operational Analytics
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
                            Municipal emergency performance command, dispatch velocity metrics, spatial cluster
                            analysis, and clinical patient-care registries.
                        </p>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {/* Export CSV */}
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95"
                            title="Download CSV spreadsheet of current filtered incidents"
                        >
                            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                            <span>Export CSV</span>
                        </button>

                        {/* Quick Page Print */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/60 font-semibold text-xs transition-all cursor-pointer"
                            title="Direct print current dashboard layout"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print View</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Print-Only Header */}
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">MDRRMO OPOL</h1>
                <h2 className="text-xl font-bold text-slate-700">
                    Emergency Medical Services & Disaster Operations Center
                </h2>
                <h3 className="text-lg font-semibold text-slate-600 mt-2">Executive Analytics Report</h3>
                <div className="mt-4 text-sm text-slate-600 flex flex-col gap-1">
                    <p>
                        <strong>Generated:</strong>{' '}
                        {new Date().toLocaleDateString('en-PH', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                    <p>
                        <strong>Total Records In Scope:</strong> {incidents.length} incidents
                    </p>
                    <div className="mt-2 text-xs">
                        <strong>Filters Applied: </strong>
                        {Object.entries(initialFilters).filter(([_, v]) => v).length > 0
                            ? Object.entries(initialFilters)
                                  .filter(([_, v]) => v)
                                  .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
                                  .join(' | ')
                            : 'None (All Records)'}
                    </div>
                </div>
            </div>

            {/* Global Intuitive Filter Bar */}
            <ReportFilters initialFilters={initialFilters} lookups={lookups} />

            {/* Core Executive KPI Stat Cards */}
            <ReportOverview stats={stats} />

            {/* Module Navigation Tabs (Screen only) */}
            <div className="print:hidden border-b border-slate-200/80 dark:border-white/10 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                                    isActive
                                        ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500/20'
                                        : 'bg-white/80 dark:bg-[#0c1220]/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                                {typeof tab.badge === 'number' && (
                                    <span
                                        className={clsx(
                                            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                        )}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Sections based on Active Tab */}
            <div className="space-y-10 print:space-y-8">
                {/* 1. Incident Intelligence */}
                {(activeTab === 'all' || activeTab === 'intelligence') && (
                    <section className="space-y-4 animate-in fade-in duration-300">
                        <IncidentIntelligence incidents={incidents} />
                    </section>
                )}

                {/* 2. Fleet & Operations */}
                {(activeTab === 'all' || activeTab === 'fleet') && (
                    <section className="space-y-4 animate-in fade-in duration-300">
                        <ResponseOperations stats={stats} incidents={incidents} />
                    </section>
                )}

                {/* 3. Patient Care Analytics */}
                {(activeTab === 'all' || activeTab === 'pcr') && (
                    <section className="space-y-4 animate-in fade-in duration-300">
                        <PatientCareAnalytics stats={stats} />
                    </section>
                )}

                {/* 4. Geographic Heatmap */}
                {(activeTab === 'all' || activeTab === 'geographic') && (
                    <section className="space-y-4 animate-in fade-in duration-300 print:hidden">
                        <ReportsGeographic incidents={incidents} />
                    </section>
                )}

                {/* 5. Filtered Incident Records Table */}
                {(activeTab === 'all' || activeTab === 'records') && (
                    <section className="space-y-4 animate-in fade-in duration-300">
                        <ReportsTable incidents={incidents} />
                    </section>
                )}
            </div>
        </div>
    );
}
