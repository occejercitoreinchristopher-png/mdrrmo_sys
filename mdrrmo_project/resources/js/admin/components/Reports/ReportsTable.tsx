import { useState, useMemo } from 'react';
import {
    FileText,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ExternalLink,
    Filter,
    ShieldAlert,
    MapPin,
    Calendar,
    Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import StatusBadge from '@/shared/components/StatusBadge';

export interface IncidentRecord {
    id: number | string;
    incident_type?: {
        name?: string;
        incident_type_name?: string;
    };
    incident_status: string;
    priority?: string;
    barangay?: string;
    incident_address?: string;
    reported_at: string;
    resolved_at?: string | null;
    [key: string]: any;
}

export default function ReportsTable({ incidents = [] }: { incidents?: IncidentRecord[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter & Sort
    const filteredIncidents = useMemo(() => {
        let list = [...incidents];

        // Status filter
        if (statusFilter !== 'all') {
            list = list.filter((inc) => inc.incident_status === statusFilter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            const cleanQueryId = q.replace(/^#?inc-?/i, '').replace(/^0+/, '');
            list = list.filter((inc) => {
                const idMatch = String(inc.id).includes(q) ||
                    (cleanQueryId !== '' && String(inc.id) === cleanQueryId) ||
                    `#${inc.id}`.includes(q) ||
                    `inc-${String(inc.id).padStart(4, '0')}`.includes(q) ||
                    `#inc-${String(inc.id).padStart(4, '0')}`.includes(q) ||
                    String(inc.id).padStart(4, '0').includes(q);
                const typeMatch = (inc.incident_type?.name || inc.incident_type?.incident_type_name || '')
                    .toLowerCase()
                    .includes(q);
                const brgyMatch = (inc.barangay || '').toLowerCase().includes(q);
                const addrMatch = (inc.incident_address || '').toLowerCase().includes(q);
                const reporterMatch = (
                    `${inc.resident?.first_name || ''} ${inc.resident?.last_name || ''}`
                )
                    .toLowerCase()
                    .includes(q);

                return idMatch || typeMatch || brgyMatch || addrMatch || reporterMatch;
            });
        }

        // Sort by reported_at
        list.sort((a, b) => {
            const timeA = new Date(a.reported_at || 0).getTime();
            const timeB = new Date(b.reported_at || 0).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return list;
    }, [incidents, search, statusFilter, sortOrder]);

    const totalRecords = filteredIncidents.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * perPage;
        return filteredIncidents.slice(start, start + perPage);
    }, [filteredIncidents, safeCurrentPage, perPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const priorityBadge = (priority?: string) => {
        const p = (priority || 'moderate').toLowerCase();
        if (p === 'critical') {
            return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                    Critical
                </span>
            );
        }
        if (p === 'high') {
            return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                    High
                </span>
            );
        }
        if (p === 'low') {
            return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25">
                    Low
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                Moderate
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-[#F61509] rounded-full shadow-[0_0_12px_rgba(246,21,9,0.4)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <span>05 Filtered Incident Records</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                Detailed Log
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Searchable tabular registry of incidents matching the current active criteria
                        </p>
                    </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {totalRecords} Record{totalRecords !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table Card */}
            <div className="rounded-2xl bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                {/* Table Control Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Search inside table */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter records in view..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                    </div>

                    {/* Status filter pills & per-page */}
                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'resolved', 'verified', 'pending', 'rejected'].map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(st);
                                    setCurrentPage(1);
                                }}
                                className={clsx(
                                    'px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer',
                                    statusFilter === st
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                {st}
                            </button>
                        ))}

                        {/* Sort toggle */}
                        <button
                            type="button"
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Per page */}
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold"
                        >
                            <option value={10}>10 / page</option>
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <th className="py-3 px-4 whitespace-nowrap"># ID</th>
                                <th className="py-3 px-4">Incident Type</th>
                                <th className="py-3 px-4">Priority</th>
                                <th className="py-3 px-4 whitespace-nowrap">Barangay</th>
                                <th className="py-3 px-4">Incident Location</th>
                                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                                <th className="py-3 px-4 whitespace-nowrap">Reported At</th>
                                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {paginatedRecords.map((inc) => {
                                const typeName =
                                    inc.incident_type?.name ||
                                    inc.incident_type?.incident_type_name ||
                                    'General Incident';
                                const brgy = inc.barangay || 'Unknown';
                                const locationText = inc.incident_address || inc.place_of_incident || '—';
                                const reportedDate = inc.reported_at
                                    ? new Date(inc.reported_at).toLocaleString('en-PH', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '—';

                                return (
                                    <tr
                                        key={inc.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                            #{inc.id}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                            {typeName}
                                        </td>
                                        <td className="py-3 px-4">{priorityBadge(inc.priority)}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                <span>{brgy}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 min-w-[220px]">
                                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed break-words" title={locationText}>
                                                {locationText}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <StatusBadge status={inc.incident_status} />
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                            {reportedDate}
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <a
                                                href={`/admin/dispatch-logs/${inc.id}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            >
                                                <span>Inspect</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}

                            {paginatedRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400 italic">
                                        No incident records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Numbered Pagination Bar */}
                {totalPages > 1 && (
                    <div className="p-3.5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400">
                            Showing {(safeCurrentPage - 1) * perPage + 1} to{' '}
                            {Math.min(safeCurrentPage * perPage, totalRecords)} of {totalRecords} records
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handlePageChange(safeCurrentPage - 1)}
                                disabled={safeCurrentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => {
                                    if (totalPages <= 7) return true;
                                    if (p === 1 || p === totalPages) return true;
                                    if (Math.abs(p - safeCurrentPage) <= 1) return true;
                                    return false;
                                })
                                .map((p, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const hasGap = prev && p - prev > 1;

                                    return (
                                        <div key={p} className="flex items-center">
                                            {hasGap && <span className="px-1 text-slate-400">...</span>}
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(p)}
                                                className={clsx(
                                                    'w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                                    safeCurrentPage === p
                                                        ? 'bg-red-600 text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                                )}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    );
                                })}

                            <button
                                type="button"
                                onClick={() => handlePageChange(safeCurrentPage + 1)}
                                disabled={safeCurrentPage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
