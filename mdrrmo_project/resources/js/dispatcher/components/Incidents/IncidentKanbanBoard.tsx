import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { 
    Search, 
    X
} from 'lucide-react';
import IncidentCard from './IncidentCard';

interface IncidentKanbanBoardProps {
    incidents: any[];
    viewing: any;
    setViewing: (incident: any) => void;
    onAssign?: (incident: any) => void;
    onLocate?: (incident: any) => void;
}

export default function IncidentKanbanBoard({ 
    incidents = [], 
    viewing, 
    setViewing,
    onAssign,
    onLocate,
}: IncidentKanbanBoardProps) {
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [originFilter, setOriginFilter] = useState<'all' | 'hotline' | 'app'>('all');

    // Counts for Telemetry Ribbon
    const counts = useMemo(() => {
        const pending = incidents.filter(i => i.incident_status === 'pending').length;
        const verified = incidents.filter(i => i.incident_status === 'verified').length;
        const assigned = incidents.filter(i => i.incident_status === 'assigned').length;
        const responding = incidents.filter(i => i.incident_status === 'responding').length;
        return {
            total: incidents.length,
            pending,
            verified,
            assigned,
            responding,
            activeField: assigned + responding,
        };
    }, [incidents]);

    // Filter incidents
    const filteredIncidents = useMemo(() => {
        const q = search.toLowerCase().trim();
        return incidents.filter((i) => {
            // Search query matching
            if (q) {
                const idMatch = i.id?.toString().includes(q) || `#${i.id}`.includes(q);
                const typeMatch = (i.incident_type?.name || '').toLowerCase().includes(q);
                const residentName = `${i.resident?.first_name || ''} ${i.resident?.last_name || ''}`.toLowerCase();
                const callerName = (i.caller_name || '').toLowerCase();
                const phone = (i.caller_phone_number || i.resident?.phone_number || '').toLowerCase();
                const location = (i.place_of_incident || i.incident_address || '').toLowerCase();
                const desc = (i.description || '').toLowerCase();

                if (!idMatch && !typeMatch && !residentName.includes(q) && !callerName.includes(q) && !phone.includes(q) && !location.includes(q) && !desc.includes(q)) {
                    return false;
                }
            }

            // Priority filter
            if (priorityFilter !== 'all' && i.priority !== priorityFilter) {
                return false;
            }

            // Origin filter
            if (originFilter === 'hotline') {
                const isHotline = Boolean(i.caller_phone_number || i.report_source === 'phone_sim' || i.description?.includes('Reported via Phone/SIM') || !i.resident);
                if (!isHotline) return false;
            }
            if (originFilter === 'app') {
                const isApp = Boolean(i.resident && !i.caller_phone_number && i.report_source !== 'phone_sim' && !i.description?.includes('Reported via Phone/SIM'));
                if (!isApp) return false;
            }

            return true;
        });
    }, [incidents, search, priorityFilter, originFilter]);

    // 4 CAD Stages
    const columns = [
        { 
            id: 'pending', 
            title: 'PENDING', 
            subtitle: 'Awaiting Triage',
            statusKey: 'pending', 
            accentBg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30',
            topBorder: 'border-t-amber-500',
            badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
            emptyText: 'No pending incident calls. Incoming stream is clear.',
        },
        { 
            id: 'verified', 
            title: 'VERIFIED', 
            subtitle: 'Ready for Unit Dispatch',
            statusKey: 'verified', 
            accentBg: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/30',
            topBorder: 'border-t-blue-500',
            badgeClass: counts.verified > 0 
                ? 'bg-blue-600 text-white font-black shadow-sm ring-2 ring-blue-400/50 animate-pulse'
                : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
            emptyText: 'All verified calls dispatched! No pending units needed.',
        },
        { 
            id: 'assigned', 
            title: 'ASSIGNED', 
            subtitle: 'Team Marshaled',
            statusKey: 'assigned', 
            accentBg: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/30',
            topBorder: 'border-t-indigo-500',
            badgeClass: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
            emptyText: 'No units currently preparing. Stations ready.',
        },
        { 
            id: 'responding', 
            title: 'RESPONDING', 
            subtitle: 'Active in Field',
            statusKey: 'responding', 
            accentBg: 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/30',
            topBorder: 'border-t-orange-500',
            badgeClass: counts.responding > 0
                ? 'bg-orange-600 text-white font-black shadow-sm'
                : 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30',
            emptyText: 'No active dispatches on run right now.',
        },
    ];

    const hasFilters = Boolean(search || priorityFilter !== 'all' || originFilter !== 'all');

    return (
        <div className="space-y-4 w-full">
            {/* ======================================================== */}
            {/* SEARCH & FILTER TOOLBAR                                  */}
            {/* ======================================================== */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by ID (e.g. #57), caller, phone, or location..."
                        className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Filter */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-xl">
                        {(['all', 'Critical', 'High', 'Moderate'] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriorityFilter(p)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    priorityFilter === p
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {p === 'all' ? 'All Priority' : p}
                            </button>
                        ))}
                    </div>

                    {/* Origin Filter */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-xl">
                        {[
                            { id: 'all', label: 'All Sources' },
                            { id: 'hotline', label: 'Hotline' },
                            { id: 'app', label: 'App' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setOriginFilter(item.id as any)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    originFilter === item.id
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setPriorityFilter('all');
                                setOriginFilter('all');
                            }}
                            className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* ======================================================== */}
            {/* KANBAN BOARD 4 COLUMNS                                   */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start w-full min-h-[70vh]">
                {columns.map((col) => {
                    const columnIncidents = filteredIncidents.filter(i => i.incident_status === col.statusKey);

                    return (
                        <div 
                            key={col.id} 
                            className={clsx(
                                "flex flex-col bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden",
                                col.topBorder,
                                "border-t-4"
                            )}
                        >
                            {/* Column Header */}
                            <div className="p-3.5 bg-white/70 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="font-black text-xs tracking-wider uppercase text-slate-900 dark:text-white">
                                        {col.title}
                                    </h2>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                        {col.subtitle}
                                    </div>
                                </div>

                                <span className={clsx("px-2 py-0.5 rounded-full text-xs font-mono font-bold", col.badgeClass)}>
                                    {columnIncidents.length}
                                </span>
                            </div>
                            
                            {/* Column Body with Incident Cards */}
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[80vh] scrollbar-thin">
                                {columnIncidents.length === 0 ? (
                                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            No {col.title.toLowerCase()} incidents
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                                            {col.emptyText}
                                        </p>
                                    </div>
                                ) : (
                                    columnIncidents.map((incident) => (
                                        <IncidentCard 
                                            key={incident.id} 
                                            incident={incident} 
                                            selected={viewing?.id === incident.id}
                                            onClick={() => setViewing(incident)}
                                            onAssign={onAssign}
                                            onLocate={onLocate}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
