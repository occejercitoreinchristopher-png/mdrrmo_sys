import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Filter,
    RotateCcw,
    Search,
    ChevronDown,
    ChevronUp,
    X,
    Calendar,
    MapPin,
    Activity,
    ShieldAlert,
    Truck,
    UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'responding', label: 'Responding' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
    { value: '', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'low', label: 'Low' },
];

export interface ReportFiltersState {
    period?: string;
    date_from?: string;
    date_to?: string;
    barangay?: string;
    incident_type_id?: string;
    status?: string;
    priority?: string;
    responder_id?: string;
    ambulance_id?: string;
    search?: string;
    [key: string]: any;
}

export default function ReportFilters({
    initialFilters = {},
    lookups = {},
}: {
    initialFilters: any;
    lookups: any;
}) {
    const currentYear = new Date().getFullYear();

    const [filters, setFilters] = useState<ReportFiltersState>({
        period: initialFilters.period || 'all',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
        barangay: initialFilters.barangay || '',
        incident_type_id: initialFilters.incident_type_id || '',
        status: initialFilters.status || '',
        priority: initialFilters.priority || '',
        responder_id: initialFilters.responder_id || '',
        ambulance_id: initialFilters.ambulance_id || '',
        search: initialFilters.search || '',
    });

    const [showAdvanced, setShowAdvanced] = useState(() => {
        return !!(
            initialFilters.barangay ||
            initialFilters.incident_type_id ||
            initialFilters.status ||
            initialFilters.priority ||
            initialFilters.responder_id ||
            initialFilters.ambulance_id ||
            initialFilters.date_from ||
            initialFilters.date_to
        );
    });

    const handleChange = (key: string) => (val: string) => {
        setFilters((prev) => ({ ...prev, [key]: val }));
    };

    const handlePeriodChange = (periodKey: string) => {
        const nextFilters = {
            ...filters,
            period: periodKey,
            // Clear custom dates when selecting preset
            ...(periodKey !== 'custom' ? { date_from: '', date_to: '' } : {}),
        };
        setFilters(nextFilters);

        // Apply immediately for period presets
        const query = Object.fromEntries(
            Object.entries(nextFilters).filter(([k, v]) => v !== '' && (k !== 'period' || v !== 'all'))
        );
        router.get('/admin/reports', query, { preserveState: true, replace: true });
    };

    const applyFilters = () => {
        const query = Object.fromEntries(
            Object.entries(filters).filter(([k, v]) => v !== '' && (k !== 'period' || v !== 'all'))
        );
        router.get('/admin/reports', query, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setFilters({
            period: 'all',
            date_from: '',
            date_to: '',
            barangay: '',
            incident_type_id: '',
            status: '',
            priority: '',
            responder_id: '',
            ambulance_id: '',
            search: '',
        });
        router.get('/admin/reports');
    };

    const removeSingleFilter = (key: string) => {
        const nextFilters = {
            ...filters,
            [key]: key === 'period' ? 'all' : '',
        };
        setFilters(nextFilters);
        const query = Object.fromEntries(
            Object.entries(nextFilters).filter(([k, v]) => v !== '' && (k !== 'period' || v !== 'all'))
        );
        router.get('/admin/reports', query, { preserveState: true, replace: true });
    };

    const barangayOptions = [
        { value: '', label: 'All Barangays' },
        ...(lookups.barangays || []).map((b: any) => ({ value: b.id, label: b.name })),
    ];
    const typeOptions = [
        { value: '', label: 'All Incident Types' },
        ...(lookups.incident_types || []).map((t: any) => ({
            value: t.id.toString(),
            label: t.incident_type_name,
        })),
    ];
    const responderOptions = [
        { value: '', label: 'All Responders' },
        ...(lookups.responders || []).map((r: any) => ({
            value: r.id.toString(),
            label: `${r.first_name} ${r.last_name}`,
        })),
    ];
    const ambulanceOptions = [
        { value: '', label: 'All Ambulances' },
        ...(lookups.ambulances || []).map((a: any) => ({
            value: a.id.toString(),
            label: a.plate_number,
        })),
    ];

    // Count active non-default filters
    const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
        if (!v) return false;
        if (k === 'period' && v === 'all') return false;
        return true;
    }).length;

    const periodPresets = [
        { key: 'all', label: 'All Records' },
        { key: 'today', label: 'Today' },
        { key: 'this_week', label: 'This Week' },
        { key: 'this_month', label: 'This Month' },
        { key: 'this_year', label: `Year ${currentYear}` },
    ];

    return (
        <div className="space-y-3 print:hidden">
            {/* Quick Bar: Period Pills + Search + Advanced Button */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Quick Period Preset Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1.5 shrink-0 hidden sm:inline">
                        Period:
                    </span>
                    {periodPresets.map((p) => {
                        const active = filters.period === p.key;
                        return (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => handlePeriodChange(p.key)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                                    active
                                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300'
                                )}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Quick Search + Filter Toggle Button */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search incidents, barangay..."
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search')(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => {
                                    handleChange('search')('');
                                    removeSingleFilter('search');
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Advanced Filters Button */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={clsx(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                            showAdvanced || activeFilterCount > (filters.period !== 'all' ? 1 : 0)
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 border-slate-200 dark:border-white/10'
                        )}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-mono">
                                {activeFilterCount}
                            </span>
                        )}
                        {showAdvanced ? (
                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Expandable Advanced Filter Drawer */}
            {showAdvanced && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg animate-in fade-in duration-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-red-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Filter by Specific Parameters
                            </h4>
                        </div>
                        <span className="text-xs text-slate-400">
                            Apply granular constraints across dates, response assets, and locations
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {/* Date From */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => handleChange('date_from')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => handleChange('date_to')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            />
                        </div>

                        {/* Barangay */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Barangay
                            </label>
                            <select
                                value={filters.barangay || ''}
                                onChange={(e) => handleChange('barangay')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {barangayOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Incident Type */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Incident Type
                            </label>
                            <select
                                value={filters.incident_type_id || ''}
                                onChange={(e) => handleChange('incident_type_id')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {typeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Incident Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleChange('status')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Priority Level
                            </label>
                            <select
                                value={filters.priority || ''}
                                onChange={(e) => handleChange('priority')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Responder */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Responder / Crew
                            </label>
                            <select
                                value={filters.responder_id || ''}
                                onChange={(e) => handleChange('responder_id')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {responderOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ambulance */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                Ambulance Unit
                            </label>
                            <select
                                value={filters.ambulance_id || ''}
                                onChange={(e) => handleChange('ambulance_id')(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                {ambulanceOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset All</span>
                        </button>

                        <button
                            type="button"
                            onClick={applyFilters}
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition-all cursor-pointer active:scale-95"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Apply Filters</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                        Active:
                    </span>

                    {filters.period && filters.period !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <Calendar className="w-3 h-3" />
                            <span>Period: {filters.period.replace('_', ' ').toUpperCase()}</span>
                            <button
                                type="button"
                                onClick={() => handlePeriodChange('all')}
                                className="hover:text-red-700 dark:hover:text-red-300 ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.barangay && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <MapPin className="w-3 h-3" />
                            <span>Brgy: {filters.barangay}</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('barangay')}
                                className="hover:text-blue-700 dark:hover:text-blue-300 ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.status && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Activity className="w-3 h-3" />
                            <span>Status: {filters.status.toUpperCase()}</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('status')}
                                className="hover:text-emerald-700 dark:hover:text-emerald-300 ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.priority && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Priority: {filters.priority.toUpperCase()}</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('priority')}
                                className="hover:text-amber-700 dark:hover:text-amber-300 ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.date_from && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                            <span>From: {filters.date_from}</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('date_from')}
                                className="hover:text-slate-900 dark:hover:text-white ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.date_to && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                            <span>To: {filters.date_to}</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('date_to')}
                                className="hover:text-slate-900 dark:hover:text-white ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.search && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Search className="w-3 h-3" />
                            <span>&quot;{filters.search}&quot;</span>
                            <button
                                type="button"
                                onClick={() => removeSingleFilter('search')}
                                className="hover:text-purple-700 dark:hover:text-purple-300 ml-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-bold text-red-500 hover:text-red-600 underline ml-1 cursor-pointer"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
}
