import { useState, useEffect, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    Search,
    PhoneCall,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowRight,
    Printer,
    SlidersHorizontal,
    X,
    RotateCcw,
    Truck,
    Shield,
    Calendar,
    MapPin,
    Flame,
    Radio,
    ChevronDown,
    ChevronUp,
    FileSpreadsheet,
    Smartphone,
    Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { printDispatchLogsSummaryReport, printIncidentDetailReport } from '@/shared/utils/printDispatchReports';
import DispatchSummaryPrintModal from './DispatchSummaryPrintModal';

// Debounce hook
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

interface DispatchLogsIndexProps {
    barangays?: string[];
    initialStatus?: string;
}

const OPOL_BARANGAYS_LIST = [
    'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
    'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang',
    'Nangcaon', 'Patag', 'Poblacion', 'Taboc', 'Tingalan'
];

const STATUS_TABS = [
    { value: '', label: 'All Incidents', dotColor: 'bg-slate-400' },
    { value: 'pending', label: 'Pending', dotColor: 'bg-amber-500' },
    { value: 'verified', label: 'Verified', dotColor: 'bg-blue-500' },
    { value: 'assigned', label: 'Assigned', dotColor: 'bg-indigo-500' },
    { value: 'responding', label: 'Responding', dotColor: 'bg-purple-500' },
    { value: 'resolved', label: 'Resolved', dotColor: 'bg-emerald-500' },
    { value: 'cancelled', label: 'Cancelled', dotColor: 'bg-slate-400' },
    { value: 'rejected', label: 'Rejected', dotColor: 'bg-rose-500' },
];

function getChannelMeta(reportSource?: string) {
    const src = String(reportSource || '').toLowerCase();
    if (src === 'walk_in' || src.includes('walk')) {
        return {
            label: 'Walk-In',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            icon: Users,
        };
    }
    if (src === 'phone_sim' || src === 'dispatcher' || src.includes('phone') || src.includes('call') || src.includes('hotline')) {
        return {
            label: 'Phone/SIM',
            color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
            icon: PhoneCall,
        };
    }
    return {
        label: 'Mobile App',
        color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
        icon: Smartphone,
    };
}

export default function DispatchLogsIndex({ barangays = OPOL_BARANGAYS_LIST, initialStatus = '' }: DispatchLogsIndexProps) {
    const { auth } = usePage<any>().props;
    const isAdmin = auth?.user?.role === 'admin';
    const Layout = isAdmin ? AdminLayout : DispatcherLayout;
    const baseUrl = isAdmin ? '/admin/dispatch-logs' : '/dispatcher/dispatch-logs';
    const apiEndpoint = isAdmin ? '/admin/dispatch-logs/api/fetch' : '/dispatcher/dispatch-logs/api/fetch';

    // Helper to get initial param from props or URL
    const getInitialParam = (key: string, fallback: string = '') => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const val = params.get(key);
            if (val !== null && val !== undefined) return val;
        }
        return fallback;
    };

    // Filter states
    const [searchTerm, setSearchTerm] = useState(() => getInitialParam('search', ''));
    const debouncedSearch = useDebounce(searchTerm, 250);
    const [status, setStatus] = useState(() => initialStatus || getInitialParam('status', ''));
    const [priority, setPriority] = useState(() => getInitialParam('priority', ''));
    const [dateFilter, setDateFilter] = useState(() => getInitialParam('date', ''));
    const [startDate, setStartDate] = useState(() => getInitialParam('start_date', ''));
    const [endDate, setEndDate] = useState(() => getInitialParam('end_date', ''));
    const [barangay, setBarangay] = useState(() => getInitialParam('barangay', ''));
    const [reportSource, setReportSource] = useState(() => getInitialParam('report_source', ''));
    const [hasDispatches, setHasDispatches] = useState(() => getInitialParam('has_dispatches', ''));
    const [page, setPage] = useState(() => {
        const p = getInitialParam('page', '1');
        return parseInt(p, 10) || 1;
    });

    useEffect(() => {
        if (initialStatus) {
            setStatus(initialStatus);
        }
    }, [initialStatus]);

    // Keep browser URL synchronized with active filters without page reload
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (status) url.searchParams.set('status', status); else url.searchParams.delete('status');
            if (priority) url.searchParams.set('priority', priority); else url.searchParams.delete('priority');
            if (barangay) url.searchParams.set('barangay', barangay); else url.searchParams.delete('barangay');
            if (dateFilter) url.searchParams.set('date', dateFilter); else url.searchParams.delete('date');
            if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
            if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
            if (reportSource) url.searchParams.set('report_source', reportSource); else url.searchParams.delete('report_source');
            if (hasDispatches) url.searchParams.set('has_dispatches', hasDispatches); else url.searchParams.delete('has_dispatches');
            if (debouncedSearch) url.searchParams.set('search', debouncedSearch); else url.searchParams.delete('search');
            if (page > 1) url.searchParams.set('page', String(page)); else url.searchParams.delete('page');

            window.history.replaceState({}, '', url.toString());
        }
    }, [status, priority, barangay, dateFilter, startDate, endDate, reportSource, hasDispatches, debouncedSearch, page]);

    // Handle browser back/forward buttons (popstate)
    useEffect(() => {
        const onPopState = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                setStatus(params.get('status') || '');
                setPriority(params.get('priority') || '');
                setBarangay(params.get('barangay') || '');
                setDateFilter(params.get('date') || '');
                setStartDate(params.get('start_date') || '');
                setEndDate(params.get('end_date') || '');
                setReportSource(params.get('report_source') || '');
                setHasDispatches(params.get('has_dispatches') || '');
                setSearchTerm(params.get('search') || '');
                setPage(parseInt(params.get('page') || '1', 10) || 1);
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    // Advanced secondary filter collapse toggle
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printDataset, setPrintDataset] = useState<any[]>([]);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Reset page on filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, priority, dateFilter, startDate, endDate, barangay, reportSource, hasDispatches]);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (debouncedSearch.trim()) count++;
        if (status) count++;
        if (priority) count++;
        if (dateFilter) count++;
        if (startDate || endDate) count++;
        if (barangay) count++;
        if (reportSource) count++;
        if (hasDispatches) count++;
        return count;
    }, [debouncedSearch, status, priority, dateFilter, startDate, endDate, barangay, reportSource, hasDispatches]);

    const fetchLogs = async ({ queryKey }: any) => {
        const [_key, params] = queryKey;
        const response = await axios.get(apiEndpoint, {
            params: {
                search: params.search,
                status: params.status,
                priority: params.priority,
                date: params.date,
                start_date: params.startDate,
                end_date: params.endDate,
                barangay: params.barangay,
                report_source: params.reportSource,
                has_dispatches: params.hasDispatches,
                page: params.pageNum,
                per_page: 15
            }
        });
        return response.data;
    };

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: [
            'dispatchLogs',
            {
                search: debouncedSearch,
                status,
                priority,
                date: dateFilter,
                startDate,
                endDate,
                barangay,
                reportSource,
                hasDispatches,
                pageNum: page
            }
        ],
        queryFn: fetchLogs,
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
        refetchInterval: 15000, // automatic background sync fallback
        retry: 1,
    });

    // Automatic Real-Time WebSockets Listener (Echo)
    // Instantly refreshes when a dispatch or incident event occurs anywhere in the system
    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');

            const handleRealtimeUpdate = () => {
                refetch();
            };

            const realtimeEvents = [
                'IncidentCreated',
                'IncidentVerified',
                'IncidentRejected',
                'IncidentCancelled',
                'DispatchCreated',
                'DispatchAccepted',
                'DispatchStatusUpdated',
                'DispatchCompleted',
                'ResponderStatusUpdated',
                'PatientCareRecordSubmitted'
            ];

            realtimeEvents.forEach((eventName) => {
                channel.listen(eventName, handleRealtimeUpdate);
                channel.listen(`.${eventName}`, handleRealtimeUpdate);
            });

            return () => {
                realtimeEvents.forEach((eventName) => {
                    channel.stopListening(eventName);
                    channel.stopListening(`.${eventName}`);
                });
            };
        }
    }, [refetch]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatus('');
        setPriority('');
        setDateFilter('');
        setStartDate('');
        setEndDate('');
        setBarangay('');
        setReportSource('');
        setHasDispatches('');
        setPage(1);
    };

    const handleOpenPrintPreview = async () => {
        if (!data?.total || data.total === 0) return;

        setIsPrinting(true);
        try {
            let recordsToPrint = data.data || [];

            // If total matching records exceed current page (15), fetch all filtered records so report preview is complete!
            if (data.total > recordsToPrint.length) {
                const response = await axios.get(apiEndpoint, {
                    params: {
                        search: debouncedSearch,
                        status,
                        priority,
                        date: dateFilter,
                        start_date: startDate,
                        end_date: endDate,
                        barangay,
                        report_source: reportSource,
                        has_dispatches: hasDispatches,
                        page: 1,
                        per_page: Math.min(data.total, 500)
                    }
                });
                if (response.data?.data && Array.isArray(response.data.data)) {
                    recordsToPrint = response.data.data;
                }
            }

            setPrintDataset(recordsToPrint);
            setIsPrintModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch full print dataset, falling back to loaded records:', err);
            setPrintDataset(data.data || []);
            setIsPrintModalOpen(true);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <Layout title="Dispatch Logs & Incident Audit">
            <Head title="Dispatch Logs & Audit Trail" />

            <div className="space-y-6">

                {/* EXECUTIVE COMMAND HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                <Shield className="w-3 h-3 text-blue-500" />
                                Operations Fleet &amp; Incident Audit
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <PhoneCall className="w-6 h-6 text-red-500 shrink-0" />
                            Dispatch Logs &amp; Audit Trail
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Monitor complete operational incident history, responder team deployments, and chronological audit trail.
                        </p>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={handleOpenPrintPreview}
                            disabled={!data?.data || data.data.length === 0 || isPrinting}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {isPrinting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-900" />
                            ) : (
                                <Printer className="w-4 h-4" />
                            )}
                            <span>{isPrinting ? 'Preparing Preview...' : 'Print Summary Report'}</span>
                        </button>
                    </div>
                </div>

                {/* UNIFIED COMMAND FILTERS CARD */}
                <div className="rounded-2xl bg-white/95 dark:bg-[#0c1220]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all">

                    {/* 1. Status Filter Segmented Control Tabs */}
                    <div className="p-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                            {STATUS_TABS.map((tab) => {
                                const isSelected = status === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => setStatus(tab.value)}
                                        className={clsx(
                                            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer select-none',
                                            isSelected
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-100'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                                        )}
                                    >
                                        <span className={clsx('w-2 h-2 rounded-full shrink-0', tab.dotColor)} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Main Filters Toolbar (Search + Select Controls) */}
                    <div className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">

                            {/* Search Field (takes 5 columns on desktop) */}
                            <div className="lg:col-span-5 relative w-full">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search reference #, caller, phone, or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-xs"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                {isFetching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                                )}
                            </div>

                            {/* Priority Select (takes 2 columns) */}
                            <div className="lg:col-span-2">
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all cursor-pointer shadow-xs"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="Critical">🔴 Critical</option>
                                    <option value="High">🟠 High Priority</option>
                                    <option value="Moderate">🟡 Moderate</option>
                                </select>
                            </div>

                            {/* Barangay Select (takes 2 columns) */}
                            <div className="lg:col-span-2">
                                <select
                                    value={barangay}
                                    onChange={(e) => setBarangay(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all cursor-pointer shadow-xs"
                                >
                                    <option value="">All 14 Barangays</option>
                                    {barangays.map((b) => (
                                        <option key={b} value={b}>
                                            Brgy. {b}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Timeframe Presets Select (takes 2 columns) */}
                            <div className="lg:col-span-2">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDateFilter(val);
                                        if (val !== 'custom') {
                                            setStartDate('');
                                            setEndDate('');
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all cursor-pointer shadow-xs"
                                >
                                    <option value="">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="this_week">This Week</option>
                                    <option value="this_month">This Month</option>
                                    <option value="this_year">This Year</option>
                                    <option value="custom">📅 Custom Date Range...</option>
                                </select>
                            </div>

                            {/* More Filters Toggle Button (takes 1 column) */}
                            <div className="lg:col-span-1 flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className={clsx(
                                        'w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer',
                                        showAdvancedFilters || reportSource || hasDispatches || startDate || endDate
                                            ? 'bg-red-500/10 text-[#F61509] border-red-500/30 dark:bg-red-500/15 dark:text-red-400'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                    )}
                                    title="Toggle additional filter options"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                                    <span className="hidden xl:inline">More</span>
                                    {showAdvancedFilters ? (
                                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                </button>
                            </div>

                        </div>

                        {/* 3. Expandable Secondary Filters Strip (Channel, Fleet & Custom Date) */}
                        {(showAdvancedFilters || dateFilter === 'custom' || startDate || endDate || reportSource || hasDispatches) && (
                            <div className="pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-white/[0.01] p-3 rounded-xl animate-fadeIn">
                                {/* Report Channel */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        Report Channel
                                    </label>
                                    <select
                                        value={reportSource}
                                        onChange={(e) => setReportSource(e.target.value)}
                                        className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 cursor-pointer shadow-xs"
                                    >
                                        <option value="">All Report Channels</option>
                                        <option value="mobile_app">Citizen Mobile App</option>
                                        <option value="phone_call">Phone / SIM Hotline</option>
                                        <option value="walk_in">Walk-in / Direct</option>
                                    </select>
                                </div>

                                {/* Fleet Assignment */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        Fleet Assignment
                                    </label>
                                    <select
                                        value={hasDispatches}
                                        onChange={(e) => setHasDispatches(e.target.value)}
                                        className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 cursor-pointer shadow-xs"
                                    >
                                        <option value="">All Fleet Dispatches</option>
                                        <option value="yes">With Assigned Ambulance</option>
                                        <option value="no">No Dispatches Yet</option>
                                    </select>
                                </div>

                                {/* Custom Start Date */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        From (Start Date)
                                    </label>
                                    <input
                                        type="date"
                                        title="Start Date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setDateFilter('custom');
                                        }}
                                        className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 shadow-xs"
                                    />
                                </div>

                                {/* Custom End Date */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        To (End Date)
                                    </label>
                                    <input
                                        type="date"
                                        title="End Date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setDateFilter('custom');
                                        }}
                                        className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 shadow-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 4. Active Filter Chips & Counter Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span>
                                    Showing <strong className="text-slate-900 dark:text-white font-semibold">{data?.data?.length || 0}</strong> of <strong className="text-slate-900 dark:text-white font-semibold">{data?.total || 0}</strong> records
                                </span>

                                {activeFiltersCount > 0 && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-600">|</span>

                                        {status && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-[#F61509] dark:bg-red-500/20 dark:text-red-400 border border-red-500/25">
                                                <span>Status: <strong className="capitalize">{status}</strong></span>
                                                <button type="button" onClick={() => setStatus('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {priority && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/25">
                                                <span>Priority: <strong>{priority}</strong></span>
                                                <button type="button" onClick={() => setPriority('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {barangay && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/25">
                                                <MapPin className="w-3 h-3" />
                                                <span>Brgy: <strong>{barangay}</strong></span>
                                                <button type="button" onClick={() => setBarangay('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {dateFilter && dateFilter !== 'custom' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25">
                                                <Calendar className="w-3 h-3" />
                                                <span className="capitalize">Range: <strong>{dateFilter.replace('_', ' ')}</strong></span>
                                                <button type="button" onClick={() => setDateFilter('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {(startDate || endDate) && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25">
                                                <Calendar className="w-3 h-3" />
                                                <span>Dates: <strong>{startDate || 'Any'} ~ {endDate || 'Now'}</strong></span>
                                                <button type="button" onClick={() => { setStartDate(''); setEndDate(''); if (dateFilter === 'custom') setDateFilter(''); }} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {reportSource && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/25">
                                                <span>Source: <strong className="capitalize">{reportSource.replace('_', ' ')}</strong></span>
                                                <button type="button" onClick={() => setReportSource('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}

                                        {hasDispatches && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/25">
                                                <Truck className="w-3 h-3" />
                                                <span>Fleet: <strong>{hasDispatches === 'yes' ? 'Dispatched' : 'None'}</strong></span>
                                                <button type="button" onClick={() => setHasDispatches('')} className="hover:opacity-75 cursor-pointer">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#F61509] hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset All Filters</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* FULL-WIDTH DATA TABLE CARD */}
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 overflow-hidden relative">

                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#F61509] animate-spin" />
                        </div>
                    )}

                    <div className="overflow-x-auto min-h-[440px]">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold">Incident &amp; Type</th>
                                    <th className="px-5 py-3.5 font-semibold">Reported &amp; Caller</th>
                                    <th className="px-5 py-3.5 font-semibold">Status &amp; Priority</th>
                                    <th className="px-5 py-3.5 font-semibold">Dispatcher</th>
                                    <th className="px-5 py-3.5 font-semibold">Resources</th>
                                    <th className="px-5 py-3.5 font-semibold">Last Action</th>
                                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {isError && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-rose-500 font-medium">
                                            Failed to load dispatch logs. Please check your connection and try again.
                                        </td>
                                    </tr>
                                )}

                                {!isError && data?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                    <AlertCircle className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                                                    No incident records match your criteria
                                                </span>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                                                    Try clearing or adjusting the selected status tabs, priority, date range, or keywords.
                                                </p>
                                                {activeFiltersCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={clearAllFilters}
                                                        className="mt-3 text-xs font-semibold text-[#F61509] hover:underline cursor-pointer"
                                                    >
                                                        Reset All Filters
                                                    </button>
                                                )}
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
                                                {/* 1. Incident & Type */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {incident.reference_number || `#${incident.id}`}
                                                        </div>
                                                        {(() => {
                                                            const channel = getChannelMeta(incident.report_source);
                                                            const ChannelIcon = channel.icon;
                                                            return (
                                                                <span className={clsx(
                                                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase",
                                                                    channel.color
                                                                )}>
                                                                    <ChannelIcon className="w-2.5 h-2.5" />
                                                                    <span>{channel.label}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                                                        {incident.incident_type?.incident_type_name || incident.incident_type?.name || 'Emergency'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[190px]" title={incident.place_of_incident || (typeof incident.location === 'object' ? incident.location?.location_name || incident.location?.name : incident.location)}>
                                                        {(typeof incident.barangay === 'object' ? incident.barangay?.barangay_name || incident.barangay?.name : incident.barangay) || (typeof incident.location === 'object' ? incident.location?.location_name || incident.location?.name : incident.location)}
                                                    </div>
                                                </td>

                                                {/* 2. Reported & Caller */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {new Date(incident.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-normal">
                                                        {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 truncate max-w-[150px]">
                                                        {caller}
                                                    </div>
                                                    {phone && (
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {phone}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 3. Status & Priority */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="space-y-1">
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset uppercase",
                                                            isPending ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400' :
                                                                incident.incident_status === 'verified' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400' :
                                                                    incident.incident_status === 'assigned' || incident.incident_status === 'responding' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                                                        incident.incident_status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                                            incident.incident_status === 'cancelled' ? 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400' :
                                                                                incident.incident_status === 'rejected' ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400' :
                                                                                'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
                                                        )}>
                                                            {incident.incident_status}
                                                        </span>

                                                        {incident.priority && (
                                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                <span
                                                                    className={clsx(
                                                                        'w-1.5 h-1.5 rounded-full',
                                                                        incident.priority.toLowerCase() === 'critical' ? 'bg-red-500' :
                                                                            incident.priority.toLowerCase() === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                                                                    )}
                                                                />
                                                                <span>{incident.priority}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. Dispatcher */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="text-[13.5px] font-medium text-slate-800 dark:text-slate-200">
                                                        {dispatcher}
                                                    </div>
                                                    {verificationLog && (
                                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                                            Verified: {new Date(verificationLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 5. Resources */}
                                                <td className="px-5 py-4 align-top">
                                                    {dispatches.length > 0 ? (
                                                        <div className="text-xs space-y-0.5">
                                                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                                                <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>{ambulances || 'Assigned'}</span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-normal pl-5">
                                                                {crewCount} Responders
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-normal italic">No dispatches</span>
                                                    )}
                                                </td>

                                                {/* 6. Last Action */}
                                                <td className="px-5 py-4 align-top">
                                                    {latestLog ? (
                                                        <>
                                                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                {latestLog.action?.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                                                                {new Date(latestLog.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-normal italic">
                                                            {incident.incident_status === 'rejected' ? 'Rejected' : incident.incident_status === 'cancelled' ? 'Cancelled' : 'Reported'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 7. Action buttons */}
                                                <td className="px-5 py-4 align-top text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => printIncidentDetailReport(incident, { preparedBy: auth?.user ? `${auth.user.first_name} ${auth.user.last_name}` : dispatcher })}
                                                            title="Print Incident Report"
                                                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer active:scale-95"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </button>

                                                        <Link
                                                            href={typeof window !== 'undefined' && window.location.search ? `${baseUrl}/${incident.id}${window.location.search}` : (status ? `${baseUrl}/${incident.id}?status=${encodeURIComponent(status)}` : `${baseUrl}/${incident.id}`)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-all group-hover:border-blue-300 dark:group-hover:border-blue-500/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 active:scale-95"
                                                        >
                                                            <span>View History</span>
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

                    {/* Pagination */}
                    {data?.last_page > 1 && (
                        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <span className="text-xs text-slate-500 font-normal">
                                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{data.from}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{data.to}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{data.total}</span> entries
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex gap-1">
                                    {data.links?.filter((l: any) => !l.label.includes('Previous') && !l.label.includes('Next')).map((link: any, index: number) => {
                                        const pageNum = parseInt(link.label);
                                        if (isNaN(pageNum)) return (
                                            <span key={index} className="px-2.5 py-1 text-xs text-slate-400">...</span>
                                        );
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setPage(pageNum)}
                                                className={clsx(
                                                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                                                    link.active
                                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                                    disabled={page === data.last_page}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Official Dispatch Summary Print Preview Modal */}
            <DispatchSummaryPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                incidents={printDataset}
                totalCount={data?.total || printDataset.length}
                filters={{
                    search: debouncedSearch,
                    status,
                    priority,
                    barangay,
                    date: dateFilter,
                    startDate,
                    endDate,
                    reportSource,
                    hasDispatches,
                }}
                currentUser={auth?.user}
            />
        </Layout>
    );
}
