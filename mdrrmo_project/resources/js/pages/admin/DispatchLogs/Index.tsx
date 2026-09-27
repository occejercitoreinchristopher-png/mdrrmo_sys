import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    Search,
    Filter,
    PhoneCall,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    Loader2,
    ArrowRight,
    Printer,
    User,
    Truck,
    Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { printDispatchLogsSummaryReport, printIncidentDetailReport } from '@/shared/utils/printDispatchReports';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function DispatchLogsIndex() {
    const { auth } = usePage<any>().props;
    const isAdmin = auth?.user?.role === 'admin';
    const Layout = isAdmin ? AdminLayout : DispatcherLayout;
    const baseUrl = isAdmin ? '/admin/dispatch-logs' : '/dispatcher/dispatch-logs';
    const apiEndpoint = isAdmin ? '/admin/dispatch-logs/api/fetch' : '/dispatcher/dispatch-logs/api/fetch';

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 250);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    const fetchLogs = async ({ queryKey }: any) => {
        const [_key, { search, statusFilter, pageNum }] = queryKey;
        const response = await axios.get(apiEndpoint, {
            params: {
                search,
                status: statusFilter,
                page: pageNum,
                per_page: 15
            }
        });
        return response.data;
    };

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['dispatchLogs', { search: debouncedSearch, statusFilter: status, pageNum: page }],
        queryFn: fetchLogs,
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
        retry: 1,
    });

    const clearFilters = () => {
        setSearchTerm('');
        setStatus('');
        setPage(1);
    };

    const handlePrintSummary = () => {
        if (!data?.data || data.data.length === 0) return;
        printDispatchLogsSummaryReport(data.data, {
            search: debouncedSearch,
            status: status,
            preparedBy: auth?.user ? `${auth.user.first_name} ${auth.user.last_name}` : (isAdmin ? 'MDRRMO Admin' : 'MDRRMO Dispatcher')
        });
    };

    return (
        <Layout title="Dispatch Logs & Incident Audit">
            <Head title="Dispatch Logs & Audit Trail" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <PhoneCall className="w-6 h-6 text-blue-500" />
                        </div>
                        Dispatch Logs &amp; Audit Trail
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Monitor the complete operational history, responder dispatches, and chronological audit ledger.
                    </p>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handlePrintSummary}
                        disabled={!data?.data || data.data.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        Print Summary Report
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-5 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by incident reference, caller, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all shadow-sm"
                        />
                        {isFetching && (
                            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                        )}
                    </div>
                    
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full md:w-56 px-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all shadow-sm cursor-pointer appearance-none"
                    >
                        <option value="">All Incident Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified / Approved</option>
                        <option value="assigned">Assigned</option>
                        <option value="responding">Responding</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                            <RefreshCw className={clsx("w-4 h-4", isFetching && "animate-spin")} /> 
                            Refresh
                        </button>
                        {(searchTerm || status) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/80 dark:border-white/10 overflow-hidden relative">
                
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
                            <tr>
                                <th className="px-5 py-4 font-bold">Incident &amp; Type</th>
                                <th className="px-5 py-4 font-bold">Reported &amp; Caller</th>
                                <th className="px-5 py-4 font-bold">Status &amp; Priority</th>
                                <th className="px-5 py-4 font-bold">Dispatcher</th>
                                <th className="px-5 py-4 font-bold">Resources</th>
                                <th className="px-5 py-4 font-bold">Last Action</th>
                                <th className="px-5 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isError && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-rose-500 font-medium">
                                        Failed to load dispatch logs. Please try again.
                                    </td>
                                </tr>
                            )}
                            
                            {!isError && data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                No incidents found matching your criteria.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((incident: any) => {
                                    const logs = incident.dispatch_logs || [];
                                    const latestLog = logs[0] || null;
                                    const verifiedBy = incident.verified_by_user || incident.verified_by || incident.verifiedBy;
                                    const dispatcher = latestLog?.user 
                                        ? `${latestLog.user.first_name} ${latestLog.user.last_name}` 
                                        : (verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : '—');
                                    
                                    const isPending = incident.incident_status === 'pending';
                                    const verificationLog = [...logs].reverse().find(l => l.new_status === 'verified');
                                    
                                    const dispatches = incident.dispatches || [];
                                    const ambulances = dispatches.map((d: any) => d.ambulance?.plate_number).filter(Boolean).join(', ');
                                    const crewCount = dispatches.reduce((acc: number, d: any) => acc + (d.crew?.length || 0), 0);

                                    const caller = incident.caller_name || (incident.resident ? `${incident.resident.first_name} ${incident.resident.last_name}` : 'Public Caller');
                                    const phone = incident.caller_phone_number || incident.resident?.phone_number;
                                    
                                    return (
                                        <tr key={incident.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-5 py-4 align-top">
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {incident.reference_number || `#${incident.id}`}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">
                                                    {incident.incident_type?.name || 'Emergency'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[170px]" title={incident.place_of_incident || incident.location}>
                                                    {incident.barangay || incident.location}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {new Date(incident.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1 truncate max-w-[140px]">
                                                    {caller}
                                                </div>
                                                {phone && (
                                                    <div className="text-[10px] text-slate-400">
                                                        {phone}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-1">
                                                    <span className={clsx(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-inset uppercase",
                                                        isPending ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400' :
                                                        incident.incident_status === 'verified' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400' :
                                                        incident.incident_status === 'assigned' || incident.incident_status === 'responding' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                                        incident.incident_status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                        incident.incident_status === 'rejected' ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
                                                    )}>
                                                        {incident.incident_status}
                                                    </span>

                                                    {incident.priority && (
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            {incident.priority}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {dispatcher}
                                                </div>
                                                {verificationLog && (
                                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                                        Verified: {new Date(verificationLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                {dispatches.length > 0 ? (
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span>{ambulances || 'Assigned'}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-medium pl-5">
                                                            {crewCount} Responders
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium italic">No dispatches</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                {latestLog ? (
                                                    <>
                                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {latestLog.action?.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                                                            {new Date(latestLog.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium italic">
                                                        {incident.incident_status === 'rejected' ? 'Rejected' : 'Reported'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {/* Quick Print Single Incident */}
                                                    <button
                                                        type="button"
                                                        onClick={() => printIncidentDetailReport(incident, { preparedBy: auth?.user ? `${auth.user.first_name} ${auth.user.last_name}` : dispatcher })}
                                                        title="Print Official Incident Report"
                                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* View History Details */}
                                                    <Link
                                                        href={`${baseUrl}/${incident.id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all group-hover:border-blue-300 dark:group-hover:border-blue-500/50 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                                    >
                                                        View History
                                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination (TanStack / Laravel mix) */}
                {data?.last_page > 1 && (
                    <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-xs text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-700 dark:text-slate-300">{data.from}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{data.to}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{data.total}</span> entries
                        </span>
                        
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            <div className="flex gap-1">
                                {data.links?.filter((l: any) => !l.label.includes('Previous') && !l.label.includes('Next')).map((link: any, index: number) => {
                                    const pageNum = parseInt(link.label);
                                    if (isNaN(pageNum)) return (
                                        <span key={index} className="px-3 py-1.5 text-sm text-slate-400">...</span>
                                    );
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setPage(pageNum)}
                                            className={clsx(
                                                "px-3 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer",
                                                link.active 
                                                    ? "bg-blue-600 text-white shadow-sm" 
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                                disabled={page === data.last_page}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
