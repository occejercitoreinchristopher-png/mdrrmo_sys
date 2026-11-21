import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '@/shared/components/EmptyState';
import PatientCareRecordDetailsModal from '@/dispatcher/components/PatientCareRecords/PatientCareRecordDetailsModal';
import {
    Activity,
    ArrowUpDown,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    MapPin,
    RotateCcw,
    Search,
    Stethoscope,
    Truck,
    Users,
    X,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

interface PatientHistoryProps {
    records?: any[];
}

const safeDate = (d: string | null | undefined) => {
    if (!d) return null;
    const parsed = new Date(
        typeof d === 'string' && d.includes('-') && !d.includes('T')
            ? d.replace(/-/g, '/')
            : d
    );
    return isNaN(parsed.getTime()) ? null : parsed;
};

const getRecordTimestamp = (r: any): number => {
    const d = safeDate(r.record_date) || safeDate(r.created_at);
    if (!d) return 0;
    const created = safeDate(r.created_at);
    return created ? created.getTime() : d.getTime();
};

const buildPageNumbers = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) {
        return Array.from({ length: total }, (_, idx) => idx + 1);
    }

    const pages: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) pages.push('ellipsis');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total - 1) pages.push('ellipsis');

    pages.push(total);
    return pages;
};

export default function PatientHistory({ records = [] }: PatientHistoryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [transportFilter, setTransportFilter] = useState<'all' | 'transported' | 'not_transported'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [perPage, setPerPage] = useState<number>(5);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Keep live search responsive while also supporting explicit Search button / Enter submit
    useEffect(() => {
        setAppliedSearch(searchInput.trim());
    }, [searchInput]);

    // Reset back to page 1 whenever filters, search, sort, or page size change
    useEffect(() => {
        setCurrentPage(1);
    }, [appliedSearch, transportFilter, sortOrder, perPage, records.length]);

    // Annotate each record with its original chronological sequence number (#N = latest)
    const indexedRecords = useMemo(() => {
        return records.map((record, idx) => ({
            record,
            sequenceNumber: records.length - idx,
        }));
    }, [records]);

    const filteredRecords = useMemo(() => {
        const query = appliedSearch.toLowerCase();

        const matched = indexedRecords.filter(({ record: r, sequenceNumber }) => {
            if (transportFilter === 'transported' && !r.transported) return false;
            if (transportFilter === 'not_transported' && r.transported) return false;

            if (!query) return true;

            const dispatch = r.dispatch;
            const assessments = Array.isArray(r.assessment) ? r.assessment.join(' ') : String(r.assessment || '');
            const dispositions = Array.isArray(r.disposition) ? r.disposition.join(' ') : String(r.disposition || '');
            const dateObj = safeDate(r.record_date) || safeDate(r.created_at);
            const formattedDate = dateObj
                ? dateObj.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
            const longDate = dateObj
                ? dateObj.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                : '';

            const haystack = [
                `#${sequenceNumber}`,
                `pcr #${r.id}`,
                `#${r.id}`,
                String(r.id || ''),
                `dispatch #${r.dispatch_id || ''}`,
                String(r.dispatch_id || ''),
                r.incident_type,
                r.nature_of_call,
                r.chief_complaint,
                r.place_of_incident,
                assessments,
                dispositions,
                r.special_instructions,
                r.transported_to,
                r.responders,
                dispatch?.team_leader?.name,
                dispatch?.ambulance?.vehicle_name,
                dispatch?.ambulance?.plate_number,
                r.record_date,
                formattedDate,
                longDate,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });

        return [...matched].sort((a, b) => {
            const diff = getRecordTimestamp(b.record) - getRecordTimestamp(a.record);
            if (diff !== 0) return sortOrder === 'newest' ? diff : -diff;
            return sortOrder === 'newest'
                ? b.sequenceNumber - a.sequenceNumber
                : a.sequenceNumber - b.sequenceNumber;
        });
    }, [indexedRecords, appliedSearch, transportFilter, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * perPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + perPage);
    const pageNumbers = useMemo(() => buildPageNumbers(safePage, totalPages), [safePage, totalPages]);

    const hasActiveFilters = Boolean(appliedSearch) || transportFilter !== 'all' || sortOrder !== 'newest';

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchInput.trim());
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setAppliedSearch('');
        setTransportFilter('all');
        setSortOrder('newest');
        setCurrentPage(1);
    };

    const handlePageChange = (nextPage: number) => {
        const clamped = Math.max(1, Math.min(totalPages, nextPage));
        if (clamped === safePage) return;
        setCurrentPage(clamped);
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (!records || records.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm p-8">
                <EmptyState
                    title="No Care Record History"
                    description="This patient does not have any recorded Patient Care Records (PCRs) yet."
                    icon={Clock}
                />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-4 scroll-mt-6">
            {/* Search & Filter Toolbar */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm p-3.5 sm:p-4 space-y-3">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search PCR #, complaint, location, date, crew, or hospital..."
                            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F61509]/30 focus:border-[#F61509]/60 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                    setAppliedSearch('');
                                }}
                                title="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F61509] hover:bg-red-600 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-red-600/20 transition-all cursor-pointer shrink-0"
                    >
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </button>
                </form>

                {/* Filter & Per-Page Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                { id: 'all', label: 'All' },
                                { id: 'transported', label: 'Transported' },
                                { id: 'not_transported', label: 'Not Transported' },
                            ] as const
                        ).map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setTransportFilter(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                                    transportFilter === opt.id
                                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-xs'
                                        : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title="Toggle chronological order"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#F61509]" />
                            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                        </button>

                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            aria-label="Records per page"
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F61509]/30 cursor-pointer"
                        >
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Live Count & Quick Page Summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>
                        {filteredRecords.length === 0 ? (
                            'No matching PCR records'
                        ) : (
                            <>
                                Showing{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {startIndex + 1}–{Math.min(startIndex + perPage, filteredRecords.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {filteredRecords.length}
                                </span>{' '}
                                {filteredRecords.length === 1 ? 'record' : 'records'}
                                {filteredRecords.length !== records.length && (
                                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                                        (filtered from {records.length} total)
                                    </span>
                                )}
                            </>
                        )}
                    </span>

                    {totalPages > 1 && (
                        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                            Page {safePage} of {totalPages}
                        </span>
                    )}
                </div>
            </div>

            {/* Empty Search Result State */}
            {filteredRecords.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm p-8 text-center space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            No matching PCR records found
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Try searching with a different PCR #, complaint, location, date, or clear your filters.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear Search & Filters</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* Paginated PCR Cards */}
                    {paginatedRecords.map(({ record: r, sequenceNumber }, idx) => {
                        const dispatch = r.dispatch;
                        const gcs = r.glasgow_coma_scale || {};
                        const vitals = Array.isArray(r.vital_signs) && r.vital_signs.length > 0 ? r.vital_signs[0] : null;
                        const assessments = Array.isArray(r.assessment) ? r.assessment : [];
                        const markers = Array.isArray(r.assessment_markers) ? r.assessment_markers : [];
                        const dispositions = Array.isArray(r.disposition) ? r.disposition : (r.disposition ? [r.disposition] : []);

                        const dateObj = safeDate(r.record_date) || safeDate(r.created_at);
                        const formattedIncidentDate = dateObj
                            ? dateObj.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                              })
                            : '—';

                        const formattedIncidentTime = r.created_at
                            ? new Date(r.created_at).toLocaleTimeString('en-PH', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                              })
                            : null;

                        const chiefComplaintDisplay = toPascalCase(r.chief_complaint || 'No Chief Complaint Recorded');
                        const placeDisplay = r.place_of_incident ? toPascalCase(r.place_of_incident) : 'Scene location not specified';

                        return (
                            <div
                                key={r.id || `${sequenceNumber}-${idx}`}
                                className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 hover:border-rose-500/30 group"
                            >
                                {/* Record Top Bar */}
                                <div className="bg-slate-50/80 dark:bg-white/[0.03] px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-[#F61509] font-bold flex items-center justify-center text-xs border border-rose-500/20">
                                            #{sequenceNumber}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    PCR #{r.id}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-[#F61509]" />
                                                    {formattedIncidentDate}
                                                    {formattedIncidentTime && (
                                                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1">
                                                            ({formattedIncidentTime})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Dispatch #{r.dispatch_id || '—'} {r.incident_type ? `• ${toPascalCase(r.incident_type)}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-[#F61509] border border-rose-500/20">
                                            {r.nature_of_call ? toPascalCase(r.nature_of_call) : 'Emergency'}
                                        </span>

                                        {r.transported ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" /> Transported
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                Not Transported
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setSelectedRecord(r)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs shadow-sm transition-all cursor-pointer ml-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View PCR Details</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Record Content Body */}
                                <div className="p-5 space-y-4">
                                    {/* Chief Complaint & Scene Location */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Chief Complaint{r.chief_complaint?.includes(',') ? 's' : ''}
                                            </span>
                                            {r.chief_complaint ? (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {r.chief_complaint.split(',').map((c: string, idx: number) => {
                                                        const item = c.trim();
                                                        if (!item) return null;
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/40 capitalize"
                                                            >
                                                                {toPascalCase(item)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                                    No Chief Complaint Recorded
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Place of Incident
                                            </span>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 capitalize">
                                                <MapPin className="w-4 h-4 text-[#F61509] flex-shrink-0" />
                                                <span>{placeDisplay}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Clinical & Condition Snapshot Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/5">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Patient Condition (GCS)
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Stethoscope className="w-3.5 h-3.5 text-[#F61509]" />
                                                <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                                    {gcs.total ? `GCS: ${gcs.total}/15` : 'GCS: —'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                E:{gcs.eye ?? '—'} V:{gcs.verbal ?? '—'} M:{gcs.motor ?? '—'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Initial Vitals
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                                    {vitals?.bp ? `BP: ${vitals.bp}` : 'Vitals logged'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {vitals ? `PR: ${vitals.pr || '—'} • SpO2: ${vitals.spo2 ? `${vitals.spo2}%` : '—'}` : 'See full record'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Assessment
                                            </span>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 capitalize">
                                                {assessments.length > 0 ? assessments.slice(0, 2).map((a: string) => toPascalCase(a)).join(', ') : 'Assessed'}
                                            </p>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {markers.length > 0 ? `${markers.length} injury marker(s)` : 'No injury markers'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                                                Incident Disposition
                                            </span>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 capitalize">
                                                {dispositions.length > 0 ? toPascalCase(dispositions[0]) : toPascalCase(r.special_instructions || 'Treated on scene')}
                                            </p>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {r.transported_to ? `To: ${toPascalCase(r.transported_to)}` : (r.transported ? 'Transported' : 'Non-transport')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Operational & Crew Metadata Footer */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs border-t border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <Truck className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                                                <span className="text-slate-800 dark:text-slate-300 font-semibold capitalize">
                                                    {toPascalCase(dispatch?.ambulance?.vehicle_name || dispatch?.ambulance?.plate_number || 'MDRRMO Ambulance')}
                                                </span>
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-[#F61509]" />
                                                <span>Crew: <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{toPascalCase(dispatch?.team_leader?.name || r.responders || 'Assigned Crew')}</span></span>
                                            </span>

                                            {r.waiver_signed && (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Waiver Signed
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                            {r.created_at ? `Completed ${new Date(r.created_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {startIndex + 1}–{Math.min(startIndex + perPage, filteredRecords.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {filteredRecords.length}
                                </span>{' '}
                                PCR records
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage <= 1}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                <div className="flex items-center gap-1">
                                    {pageNumbers.map((page, idx) =>
                                        page === 'ellipsis' ? (
                                            <span
                                                key={`ellipsis-${idx}`}
                                                className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500 select-none"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => handlePageChange(page)}
                                                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                    page === safePage
                                                        ? 'bg-[#F61509] text-white border-[#F61509] shadow-sm shadow-red-600/25'
                                                        : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage >= totalPages}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Complete PCR Modal */}
            <PatientCareRecordDetailsModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
        </div>
    );
}
