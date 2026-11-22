import { useState, useMemo } from 'react';
import {
    Printer,
    X,
    Shield,
    CheckCircle2,
    Calendar,
    MapPin,
    AlertCircle,
    Truck,
    UserCheck,
    FileText,
    ZoomIn,
    ZoomOut,
    Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import { printDispatchLogsSummaryReport } from '@/shared/utils/printDispatchReports';

interface DispatchSummaryPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    incidents: any[];
    totalCount: number;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        barangay?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        reportSource?: string;
        hasDispatches?: string;
        preparedBy?: string;
        preparedByTitle?: string;
        approvedBy?: string;
        approvedByTitle?: string;
    };
    currentUser?: any;
}

export default function DispatchSummaryPrintModal({
    isOpen,
    onClose,
    incidents = [],
    totalCount = 0,
    filters = {},
    currentUser,
}: DispatchSummaryPrintModalProps) {
    // Blank names by default as requested for manual signature
    const [preparedByName, setPreparedByName] = useState('');
    const [preparedByTitle, setPreparedByTitle] = useState('Prepared by / Operations Officer');
    const [approvedByName, setApprovedByName] = useState('');
    const [approvedByTitle, setApprovedByTitle] = useState('Approved by / MDRRMO Officer-in-Charge');
    const [previewScale, setPreviewScale] = useState<'100' | '90' | '80'>('100');

    // Build filter text
    const filterParts: string[] = [];
    if (filters.status) filterParts.push(`Status: ${filters.status.toUpperCase()}`);
    if (filters.priority) filterParts.push(`Priority: ${filters.priority.toUpperCase()}`);
    if (filters.barangay) filterParts.push(`Barangay: ${filters.barangay.toUpperCase()}`);
    if (filters.date && filters.date !== 'custom') filterParts.push(`Time: ${filters.date.replace('_', ' ').toUpperCase()}`);
    if (filters.startDate || filters.endDate) filterParts.push(`Range: ${filters.startDate || 'ANY'} to ${filters.endDate || 'NOW'}`);
    if (filters.reportSource) filterParts.push(`Source: ${filters.reportSource.toUpperCase()}`);
    if (filters.hasDispatches) filterParts.push(`Fleet: ${filters.hasDispatches === 'yes' ? 'DISPATCHED' : 'NONE'}`);
    if (filters.search) filterParts.push(`Search: "${filters.search}"`);

    const filterSummary = filterParts.length > 0 ? filterParts.join(' • ') : 'All Incidents & Dispatches (Unfiltered)';

    // KPI stats
    const stats = useMemo(() => {
        const total = incidents.length;
        const pending = incidents.filter(i => i.incident_status === 'pending').length;
        const active = incidents.filter(i => ['verified', 'assigned', 'responding'].includes(i.incident_status)).length;
        const resolved = incidents.filter(i => i.incident_status === 'resolved').length;
        const rejected = incidents.filter(i => i.incident_status === 'rejected').length;
        const totalDispatches = incidents.reduce((acc, i) => acc + (i.dispatches?.length || 0), 0);
        return { total, pending, active, resolved, rejected, totalDispatches };
    }, [incidents]);

    if (!isOpen) return null;

    const handlePrint = () => {
        printDispatchLogsSummaryReport(incidents, {
            ...filters,
            preparedBy: preparedByName.trim(),
            preparedByTitle: preparedByTitle.trim(),
            approvedBy: approvedByName.trim(),
            approvedByTitle: approvedByTitle.trim(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn">
            {/* Modal Dialog Container */}
            <div className="relative w-full max-w-6xl max-h-[96vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">

                {/* MODAL TOP TOOLBAR */}
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                    Print Summary Report Preview
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                                    Official A4 Landscape
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-md sm:max-w-xl">
                                Verify filtered parameters and records ledger before physical or PDF printing.
                            </p>
                        </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        {/* Zoom scale selector */}
                        <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setPreviewScale('80')}
                                className={clsx('px-2 py-1 rounded-lg font-medium transition-colors', previewScale === '80' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
                            >
                                80%
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewScale('90')}
                                className={clsx('px-2 py-1 rounded-lg font-medium transition-colors', previewScale === '90' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
                            >
                                90%
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewScale('100')}
                                className={clsx('px-2 py-1 rounded-lg font-medium transition-colors', previewScale === '100' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
                            >
                                100%
                            </button>
                        </div>

                        {/* Print Now Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/25 transition-all cursor-pointer active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Report Now</span>
                        </button>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Close preview"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* SIGNATURE & META CONFIGURATION STRIP */}
                <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                            Active Filters:
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 max-w-lg truncate">
                            {filterSummary}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">
                            <strong>{incidents.length}</strong> incident record{incidents.length === 1 ? '' : 's'} included
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium text-[11px]">Signatories:</span>
                        <input
                            type="text"
                            value={preparedByName}
                            onChange={(e) => setPreparedByName(e.target.value)}
                            placeholder="(Blank) Prepared by name"
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 w-44"
                            title="Prepared by name (Leave blank for manual signature)"
                        />
                        <input
                            type="text"
                            value={approvedByName}
                            onChange={(e) => setApprovedByName(e.target.value)}
                            placeholder="(Blank) Approved by name"
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 w-44"
                            title="Approved by name (Leave blank for manual signature)"
                        />
                    </div>
                </div>

                {/* SCROLLABLE DOCUMENT PREVIEW AREA */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center scrollbar-thin scrollbar-thumb-slate-700">
                    {/* Simulated Physical A4 Landscape Paper */}
                    <div
                        style={{
                            zoom: previewScale === '80' ? 0.8 : previewScale === '90' ? 0.9 : 1,
                            maxWidth: '1080px',
                            width: '100%'
                        }}
                        className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl border border-slate-200 select-text transition-transform duration-200"
                    >
                        {/* 1. Dual-Logo Official Header */}
                        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4 gap-4">
                            <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                <img
                                    src="/images/opol-seal.png"
                                    alt="Municipality of Opol"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/images/opol-logo.png';
                                    }}
                                />
                            </div>

                            <div className="text-center flex-1">
                                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest leading-none">
                                    Republic of the Philippines • Province of Misamis Oriental
                                </p>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1 leading-tight">
                                    MUNICIPALITY OF OPOL
                                </h3>
                                <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-0.5 leading-tight">
                                    MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
                                </h1>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5 leading-none">
                                    Emergency Operations &amp; Dispatch Monitoring Center
                                </p>
                            </div>

                            <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                <img
                                    src="/images/opol-logo.png"
                                    alt="MDRRMO Rescue"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        {/* 2. Official Metadata Banner */}
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-md mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-600 text-white px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider">
                                    LEDGER SUMMARY
                                </span>
                                <span>OFFICIAL EMERGENCY INCIDENT &amp; DISPATCH AUDIT LOG</span>
                            </div>
                            <div className="text-slate-300 font-mono text-[9.5px]">
                                GENERATED: {new Date().toLocaleString()}
                            </div>
                        </div>

                        {/* 3. Applied Filters Box */}
                        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded mb-3 text-[10.5px] flex items-center justify-between gap-2">
                            <div>
                                <span className="font-bold text-slate-700 uppercase tracking-wider text-[9.5px] mr-1.5">
                                    Report Filter Criteria:
                                </span>
                                <span className="font-semibold text-slate-900">
                                    {filterSummary}
                                </span>
                            </div>
                            <div className="text-slate-500 font-medium text-[10px]">
                                Record count: <strong>{incidents.length}</strong>
                            </div>
                        </div>

                        {/* 4. Statistics KPI Summary Cards */}
                        <div className="grid grid-cols-6 gap-2 mb-4">
                            <div className="border border-slate-200 rounded p-2 text-center bg-slate-50/70">
                                <div className="text-base font-black text-slate-900 tabular-nums leading-none">
                                    {stats.total}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-slate-500 tracking-wider mt-1">
                                    Total Incidents
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded p-2 text-center bg-amber-50/60">
                                <div className="text-base font-black text-amber-700 tabular-nums leading-none">
                                    {stats.pending}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-amber-700 tracking-wider mt-1">
                                    Pending
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded p-2 text-center bg-blue-50/60">
                                <div className="text-base font-black text-blue-700 tabular-nums leading-none">
                                    {stats.active}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-blue-700 tracking-wider mt-1">
                                    Active / En Route
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded p-2 text-center bg-emerald-50/60">
                                <div className="text-base font-black text-emerald-700 tabular-nums leading-none">
                                    {stats.resolved}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-emerald-700 tracking-wider mt-1">
                                    Resolved
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded p-2 text-center bg-rose-50/60">
                                <div className="text-base font-black text-rose-700 tabular-nums leading-none">
                                    {stats.rejected}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-rose-700 tracking-wider mt-1">
                                    Rejected
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded p-2 text-center bg-indigo-50/60">
                                <div className="text-base font-black text-indigo-700 tabular-nums leading-none">
                                    {stats.totalDispatches}
                                </div>
                                <div className="text-[8px] font-bold uppercase text-indigo-700 tracking-wider mt-1">
                                    Dispatches
                                </div>
                            </div>
                        </div>

                        {/* 5. Incidents Data Table */}
                        <div className="border border-slate-300 rounded overflow-hidden mb-6">
                            <table className="w-full text-left border-collapse text-[9.5px]">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[8.5px] uppercase font-bold tracking-wider">
                                        <th className="p-1.5 border-r border-slate-300 w-16">Ref #</th>
                                        <th className="p-1.5 border-r border-slate-300 w-28">Type &amp; Severity</th>
                                        <th className="p-1.5 border-r border-slate-300 w-24">Date &amp; Time</th>
                                        <th className="p-1.5 border-r border-slate-300">Caller / Reporter</th>
                                        <th className="p-1.5 border-r border-slate-300">Scene Location</th>
                                        <th className="p-1.5 border-r border-slate-300 w-24">Status</th>
                                        <th className="p-1.5 border-r border-slate-300 w-28">Ambulance Fleet</th>
                                        <th className="p-1.5">Dispatcher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {incidents.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                                                No records available for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        incidents.map((incident, idx) => {
                                            const caller = incident.caller_name || (incident.resident ? `${incident.resident.first_name} ${incident.resident.last_name}` : 'Public Caller');
                                            const phone = incident.caller_phone_number || incident.resident?.phone_number || '—';
                                            const dispatches = incident.dispatches || [];
                                            const ambulances = dispatches.map((d: any) => d.ambulance?.plate_number).filter(Boolean).join(', ');
                                            const logs = incident.dispatch_logs || [];
                                            const latestLog = logs[0] || null;
                                            const verifiedBy = incident.verified_by_user || incident.verified_by || incident.verifiedBy;
                                            const dispatcher = latestLog?.user 
                                                ? `${latestLog.user.first_name} ${latestLog.user.last_name}` 
                                                : (verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : '—');

                                            return (
                                                <tr key={incident.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                    <td className="p-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">
                                                        {incident.reference_number || `#${incident.id}`}
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200">
                                                        <div className="font-bold text-slate-900">
                                                            {incident.incident_type?.incident_type_name || incident.incident_type?.name || 'Emergency'}
                                                        </div>
                                                        <div className="text-[8px] font-semibold text-slate-500 uppercase">
                                                            {incident.priority || 'Moderate'}
                                                        </div>
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200 font-mono text-[8.5px]">
                                                        <div>{new Date(incident.created_at).toLocaleDateString()}</div>
                                                        <div className="text-slate-500">{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200">
                                                        <div className="font-semibold text-slate-900">{caller}</div>
                                                        <div className="text-[8px] text-slate-500 font-mono">{phone}</div>
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200">
                                                        <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                                                            {(typeof incident.barangay === 'object' ? incident.barangay?.barangay_name || incident.barangay?.name : incident.barangay) || 'Opol'}
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 truncate max-w-[140px]" title={incident.place_of_incident || incident.incident_address}>
                                                            {incident.place_of_incident || incident.incident_address || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200">
                                                        <span className={clsx(
                                                            'inline-block px-1.5 py-0.2 rounded font-bold uppercase text-[8px]',
                                                            incident.incident_status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                                            incident.incident_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                            incident.incident_status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        )}>
                                                            {incident.incident_status}
                                                        </span>
                                                    </td>
                                                    <td className="p-1.5 border-r border-slate-200">
                                                        {ambulances ? (
                                                            <div className="font-mono font-bold text-slate-900">{ambulances}</div>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[8.5px]">None</span>
                                                        )}
                                                    </td>
                                                    <td className="p-1.5 font-medium text-slate-800">
                                                        {dispatcher}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 6. Official Signatures Block */}
                        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-9">
                                    Prepared &amp; Certified By:
                                </p>
                                <div className="border-b border-slate-900 w-52 mx-auto mb-1.5"></div>
                                <p className="font-bold text-slate-900 uppercase text-xs min-h-[16px]">
                                    {preparedByName ? preparedByName : '\u00A0'}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                    {preparedByTitle}
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-9">
                                    Approved &amp; Noted By:
                                </p>
                                <div className="border-b border-slate-900 w-52 mx-auto mb-1.5"></div>
                                <p className="font-bold text-slate-900 uppercase text-xs min-h-[16px]">
                                    {approvedByName ? approvedByName : '\u00A0'}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                    {approvedByTitle}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400 shrink-0">
                    <div>
                        <span>Press <strong>Print Report Now</strong> to send to your printer or save as PDF.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md cursor-pointer active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Report Now</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
