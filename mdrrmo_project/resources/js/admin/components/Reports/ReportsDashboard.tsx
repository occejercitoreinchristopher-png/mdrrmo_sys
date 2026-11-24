import { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Printer,
    FileText,
    TrendingUp,
    Truck,
    Stethoscope,
    MapPin,
    Layers,
    Table,
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

    // 1. Total Incidents / Accidents
    const totalIncidents = stats.total_incidents ?? incidents.length;

    // 2. Highest Incident Barangay (Top Hotspot) & Territorial Distribution
    const barangaySummary = useMemo(() => {
        const map: Record<string, { total: number; dispatches: number; resolved: number }> = {};
        incidents.forEach((inc: any) => {
            let bName = 'Unassigned';
            if (typeof inc.barangay === 'string' && inc.barangay.trim()) {
                bName = inc.barangay.trim();
            } else if (inc.barangay && typeof inc.barangay === 'object') {
                bName = inc.barangay.barangay_name || inc.barangay.name || 'Unassigned';
            } else if (inc.resident?.residentProfile?.barangay?.barangay_name) {
                bName = inc.resident.residentProfile.barangay.barangay_name;
            } else if (inc.locationCode?.barangay?.barangay_name) {
                bName = inc.locationCode.barangay.barangay_name;
            }

            if (!map[bName]) {
                map[bName] = { total: 0, dispatches: 0, resolved: 0 };
            }
            map[bName].total += 1;
            const dispCount = Array.isArray(inc.dispatches) ? inc.dispatches.length : (inc.dispatches_count ?? 0);
            map[bName].dispatches += dispCount;
            if (inc.incident_status === 'resolved') {
                map[bName].resolved += 1;
            }
        });

        const list = Object.entries(map).map(([name, data]) => ({
            name,
            total: data.total,
            dispatches: data.dispatches,
            resolved: data.resolved,
            pct: totalIncidents > 0 ? Math.round((data.total / totalIncidents) * 100) : 0,
            clearanceRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
        }));

        list.sort((a, b) => b.total - a.total);
        return list;
    }, [incidents, totalIncidents]);

    const topBarangay = barangaySummary[0] || { name: 'None', total: 0, pct: 0, dispatches: 0, resolved: 0 };

    // 3. Total Emergency Dispatches Deployed
    const totalDispatches = stats.total_dispatches ?? incidents.reduce((sum: number, inc: any) => {
        if (Array.isArray(inc.dispatches)) return sum + inc.dispatches.length;
        if (typeof inc.dispatches_count === 'number') return sum + inc.dispatches_count;
        return sum;
    }, 0);

    // 4. Resolved Cases & Clearance Rate
    const resolvedCount = stats.resolved_count ?? incidents.filter((i: any) => i.incident_status === 'resolved').length;
    const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;

    // 5. Reported Citizen Incidents (Verified calls)
    const reportedCount = stats.verified_count ?? incidents.filter((i: any) => i.incident_status !== 'rejected').length;
    const verificationRate = totalIncidents > 0 ? Math.round((reportedCount / totalIncidents) * 100) : 0;

    // 6. Average Response Time Formatted
    const formatDuration = (sec: number) => {
        if (!sec || isNaN(sec) || sec <= 0) return '0 min';
        const totalMinutes = Math.round(sec / 60);
        if (totalMinutes < 60) {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}m ${s.toString().padStart(2, '0')}s`;
        }
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}h ${mins}m`;
    };

    const avgResponseTimeStr = formatDuration(stats.avg_response_time ?? 0);

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
        <div className="space-y-6">
            {/* Print Styles: Ultra-clean, strictly professional, ink-friendly, zero scrollbars */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 10mm 12mm 10mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        color: #0f172a !important;
                        overflow: visible !important;
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    * {
                        overflow: visible !important;
                        scrollbar-width: none !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    ::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                    }
                    .print\\:break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}} />

            {/* =========================================================================
                SCREEN DASHBOARD VIEW (Hidden entirely when printing)
               ========================================================================= */}
            <div className="print:hidden space-y-6">
                {/* Top Command Center Header */}
                <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 text-white border border-slate-800/80 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                                Reports &amp; Operational Analytics
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
                                Municipal emergency performance command, dispatch velocity metrics, spatial cluster
                                analysis, and clinical patient-care registries.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95"
                                title="Download CSV spreadsheet of current filtered incidents"
                            >
                                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                                <span>Export CSV</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95"
                                title="Print Official Executive Report Sheet"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Report View</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Intuitive Filter Bar */}
                <ReportFilters initialFilters={initialFilters} lookups={lookups} />

                {/* Core 6 Executive KPI Stat Cards */}
                <ReportOverview stats={stats} incidents={incidents} />

                {/* Module Navigation Tabs */}
                <div className="border-b border-slate-200/80 dark:border-white/10 pt-2">
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
                <div className="space-y-10">
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
                        <section className="space-y-4 animate-in fade-in duration-300">
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

            {/* =========================================================================
                OFFICIAL EXECUTIVE PRINT SHEET (PRINT ONLY: hidden print:block)
                Strictly professional, ink-friendly (black on white), zero scrollbars,
                contains ONLY the 6 user-requested core metrics, official barangay ledger,
                and PCR-matching dual-logo header & executive signatories.
               ========================================================================= */}
            <div className="hidden print:block space-y-5 bg-white text-black">
                {/* 1. Official Dual-Logo Header (Exact Match to PCR Government Standard) */}
                <div className="pb-4 border-b-2 border-slate-900 print:break-inside-avoid">
                    <div className="flex items-center justify-between gap-4">
                        {/* Municipal Official Seal (Left) */}
                        <div className="w-20 h-20 flex items-center justify-center shrink-0">
                            <img
                                src="/images/opol_logo.png"
                                alt="Municipality of Opol Official Seal"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/opol-seal.png';
                                }}
                            />
                        </div>

                        {/* Republic & Municipal Title (Center) */}
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest leading-none">
                                Republic of the Philippines • Province of Misamis Oriental
                            </p>
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1 leading-tight">
                                MUNICIPALITY OF OPOL
                            </h2>
                            <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight mt-0.5 leading-tight">
                                MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
                            </h1>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5 leading-none">
                                Emergency Operations &amp; Dispatch Monitoring Center • Opol Rescue
                            </p>
                            <div className="mt-2 inline-block px-3 py-0.5 bg-slate-900 text-white text-[9.5px] font-bold uppercase tracking-wider rounded">
                                Official Executive Incident &amp; Operations Summary Report
                            </div>
                        </div>

                        {/* Opol Rescue / DRRM Shield (Right) */}
                        <div className="w-20 h-20 flex items-center justify-center shrink-0">
                            <img
                                src="/images/drrm_logo.png"
                                alt="MDRRMO Rescue Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-3 gap-3 text-[10px] text-slate-700">
                        <div>
                            <span className="font-bold text-slate-900 uppercase tracking-wider">Report Generated:</span>
                            <p className="font-mono mt-0.5 text-slate-800 font-semibold">
                                {new Date().toLocaleDateString('en-PH', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 uppercase tracking-wider">Total Records:</span>
                            <p className="font-bold text-slate-900 mt-0.5">
                                {totalIncidents} Documented Emergency Records
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 uppercase tracking-wider">Filter Scope:</span>
                            <p className="truncate mt-0.5 font-medium text-slate-800">
                                {Object.entries(initialFilters).filter(([_, v]) => v).length > 0
                                    ? Object.entries(initialFilters)
                                          .filter(([_, v]) => v)
                                          .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
                                          .join(' | ')
                                    : 'All Municipal Records (Unfiltered)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Core 6 Performance & Operational Metrics (Strictly Requested by User) */}
                <div className="space-y-2 print:break-inside-avoid">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                            Executive Incident Summary &amp; Key Performance Indicators
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">
                            Official Municipal Metrics
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {/* 1. Ilang accident ang nangyari */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                1. Total Incidents / Accidents
                            </p>
                            <p className="text-2xl font-black text-slate-950 font-mono mt-1">
                                {totalIncidents}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                Documented emergency incident cases
                            </p>
                        </div>

                        {/* 2. Anong barangay yung may pinaka mataas na accident */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                2. Highest Incident Barangay
                            </p>
                            <p className="text-xl font-black text-slate-950 font-mono mt-1 truncate">
                                {topBarangay.name}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                {topBarangay.total} incidents ({topBarangay.pct}% of municipal total)
                            </p>
                        </div>

                        {/* 3. Yung dispatch */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                3. Total Emergency Dispatches
                            </p>
                            <p className="text-2xl font-black text-slate-950 font-mono mt-1">
                                {totalDispatches}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                Ambulance &amp; quick-response deployments
                            </p>
                        </div>

                        {/* 4. Ilang yung na resolved */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                4. Resolved Incidents
                            </p>
                            <p className="text-2xl font-black text-slate-950 font-mono mt-1">
                                {resolvedCount}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                {resolutionRate}% operational clearance rate
                            </p>
                        </div>

                        {/* 5. Yung nag report na incident */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                5. Reported Citizen Incidents
                            </p>
                            <p className="text-2xl font-black text-slate-950 font-mono mt-1">
                                {reportedCount}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                {verificationRate}% verified legitimate distress calls
                            </p>
                        </div>

                        {/* 6. Avg na response time */}
                        <div className="border-2 border-slate-900 p-3 bg-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                6. Average Response Time
                            </p>
                            <p className="text-2xl font-black text-slate-950 font-mono mt-1">
                                {avgResponseTimeStr}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                Dispatch acknowledgment to on-scene arrival
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Official Territorial Barangay Incident Breakdown Ledger */}
                <div className="border-2 border-slate-900 print:break-inside-avoid">
                    <div className="bg-slate-100 px-3 py-1.5 border-b-2 border-slate-900 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Territorial Barangay Incident &amp; Operations Distribution
                        </h3>
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">
                            Official Municipal Record • Ranked by Incident Volume
                        </span>
                    </div>

                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-400 bg-slate-50 font-bold text-slate-800 uppercase text-[9.5px]">
                                <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                                <th className="p-2 border-r border-slate-300">Barangay Name</th>
                                <th className="p-2 border-r border-slate-300 text-center">Incidents</th>
                                <th className="p-2 border-r border-slate-300 text-center">% Share</th>
                                <th className="p-2 border-r border-slate-300 text-center">Dispatches</th>
                                <th className="p-2 border-r border-slate-300 text-center">Resolved</th>
                                <th className="p-2 text-center">Clearance Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {barangaySummary.map((b, idx) => (
                                <tr key={b.name} className="border-b border-slate-200">
                                    <td className="p-2 border-r border-slate-200 text-center font-mono text-[10px] text-slate-600">
                                        {idx + 1}
                                    </td>
                                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                                        {b.name}
                                        {idx === 0 && (
                                            <span className="ml-2 text-[8.5px] font-black uppercase px-1.5 py-0.2 border border-slate-900 rounded bg-slate-100">
                                                Top Hotspot
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                                        {b.total}
                                    </td>
                                    <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-700">
                                        {b.pct}%
                                    </td>
                                    <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-800">
                                        {b.dispatches}
                                    </td>
                                    <td className="p-2 border-r border-slate-200 text-center font-mono font-semibold text-slate-900">
                                        {b.resolved}
                                    </td>
                                    <td className="p-2 text-center font-mono font-bold text-slate-900">
                                        {b.clearanceRate}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. Official Certification Signatures Block (Matching PCR Standard) */}
                <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 print:break-inside-avoid">
                    <div className="w-64 mx-auto">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                            Prepared &amp; Certified By:
                        </p>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-wider mb-1">
                            {auth?.user ? `${auth.user.first_name} ${auth.user.last_name}` : 'Rein Christopher Ejercito'}
                        </p>
                        <div className="border-b-2 border-slate-900 w-full mb-1"></div>
                        <p className="text-[10px] text-slate-600 font-semibold">
                            {auth?.user?.role === 'dispatcher' ? 'Operations Dispatcher / On-Duty' : 'MDRRMO Operations Administrator'}
                        </p>
                    </div>

                    <div className="w-64 mx-auto">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                            Approved &amp; Noted By:
                        </p>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-wider mb-1">
                            Engr. Rommel C. Lanoy
                        </p>
                        <div className="border-b-2 border-slate-900 w-full mb-1"></div>
                        <p className="text-[10px] text-slate-600 font-semibold">
                            Approved by / MDRRMO Officer-in-Charge
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
