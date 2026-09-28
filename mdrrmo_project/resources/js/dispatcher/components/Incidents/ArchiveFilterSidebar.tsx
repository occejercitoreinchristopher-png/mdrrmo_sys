import { useState, useMemo } from 'react';
import { Filter, RotateCcw, MapPin, Activity, Check, Search, X, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle, Calendar } from 'lucide-react';

export interface ArchiveFilterSidebarProps {
    barangays: string[];
    chiefComplaints: string[];
    selectedBarangays: string[];
    setSelectedBarangays: (barangays: string[]) => void;
    selectedComplaints: string[];
    setSelectedComplaints: (complaints: string[]) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    barangayCounts?: Record<string, number>;
    complaintCounts?: Record<string, number>;
    startDate?: string;
    setStartDate?: (date: string) => void;
    endDate?: string;
    setEndDate?: (date: string) => void;
    totalFilteredCount: number;
    totalAllCount: number;
    onReset: () => void;
    orientation?: 'vertical' | 'horizontal';
}

export default function ArchiveFilterSidebar({
    barangays = [],
    chiefComplaints = [],
    selectedBarangays = [],
    setSelectedBarangays,
    selectedComplaints = [],
    setSelectedComplaints,
    searchQuery = '',
    setSearchQuery,
    barangayCounts = {},
    complaintCounts = {},
    startDate = '',
    setStartDate,
    endDate = '',
    setEndDate,
    totalFilteredCount,
    totalAllCount,
    onReset,
    orientation = 'vertical',
}: ArchiveFilterSidebarProps) {
    const [barangaySearch, setBarangaySearch] = useState('');
    const [complaintSearch, setComplaintSearch] = useState('');
    const [isBarangayOpen, setIsBarangayOpen] = useState(true);
    const [isComplaintOpen, setIsComplaintOpen] = useState(true);
    const [isDateRangeOpen, setIsDateRangeOpen] = useState(true);

    const hasActiveFilters = selectedBarangays.length > 0 || selectedComplaints.length > 0 || searchQuery.trim().length > 0 || !!startDate || !!endDate;
    const totalActiveFiltersCount = selectedBarangays.length + selectedComplaints.length + (searchQuery.trim() ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

    const toggleBarangay = (name: string) => {
        if (selectedBarangays.includes(name)) {
            setSelectedBarangays(selectedBarangays.filter((b) => b !== name));
        } else {
            setSelectedBarangays([...selectedBarangays, name]);
        }
    };

    const toggleComplaint = (name: string) => {
        if (selectedComplaints.includes(name)) {
            setSelectedComplaints(selectedComplaints.filter((c) => c !== name));
        } else {
            setSelectedComplaints([...selectedComplaints, name]);
        }
    };

    const selectAllBarangays = () => {
        setSelectedBarangays([...barangays]);
    };

    const clearAllBarangays = () => {
        setSelectedBarangays([]);
    };

    const selectAllComplaints = () => {
        setSelectedComplaints([...chiefComplaints]);
    };

    const clearAllComplaints = () => {
        setSelectedComplaints([]);
    };

    const filteredBarangaysList = useMemo(() => {
        if (!barangaySearch.trim()) return barangays;
        const q = barangaySearch.toLowerCase();
        return barangays.filter((b) => b.toLowerCase().includes(q));
    }, [barangays, barangaySearch]);

    const filteredComplaintsList = useMemo(() => {
        if (!complaintSearch.trim()) return chiefComplaints;
        const q = complaintSearch.toLowerCase();
        return chiefComplaints.filter((c) => c.toLowerCase().includes(q));
    }, [chiefComplaints, complaintSearch]);

    return (
        <aside className={`${orientation === 'horizontal' ? 'w-full flex flex-col md:flex-row' : 'w-80 shrink-0 flex flex-col lg:sticky lg:top-4 max-h-[calc(100vh-5.5rem)]'} bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-md`}>
            {/* Header & Reset */}
            <div className={`p-3.5 border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shrink-0 ${orientation === 'horizontal' ? 'w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col justify-between' : 'border-b'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Filter className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            Archive Filters
                        </h3>
                    </div>
                    {hasActiveFilters && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                            {totalActiveFiltersCount} Active
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                    <span>
                        Showing <strong className="text-slate-900 dark:text-white">{totalFilteredCount}</strong> of {totalAllCount}
                    </span>
                    <button
                        onClick={onReset}
                        disabled={!hasActiveFilters}
                        className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer text-xs ${
                            hasActiveFilters 
                                ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300' 
                                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                        title="Reset all filters"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>

                <div className={`relative ${orientation === 'horizontal' ? 'mt-auto' : ''}`}>
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search records..."
                        className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className={`flex-1 overflow-y-auto p-3.5 min-h-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 ${orientation === 'horizontal' ? 'flex flex-row gap-4 items-start' : 'space-y-4'}`}>
                
                {/* 1. DATE RANGE FILTER */}
                <div className={`rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] p-2.5 ${orientation === 'horizontal' ? 'flex-1 min-w-[200px]' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
                            className="flex items-center gap-1.5 text-left font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Date Range</span>
                            {(startDate || endDate) && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                    Active
                                </span>
                            )}
                            {isDateRangeOpen ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            )}
                        </button>
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate?.(''); setEndDate?.(''); }}
                                className="text-[11px] text-slate-500 hover:underline font-medium cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    
                    {isDateRangeOpen && (
                        <div className="flex flex-col gap-2 mt-2">
                            <div>
                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Start Date (MM/DD/YYYY)</label>
                                <input
                                    type="date"
                                    value={startDate || ''}
                                    onChange={(e) => setStartDate?.(e.target.value)}
                                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">End Date (MM/DD/YYYY)</label>
                                <input
                                    type="date"
                                    value={endDate || ''}
                                    onChange={(e) => setEndDate?.(e.target.value)}
                                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. BARANGAY FILTER */}
                <div className={`rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] p-2.5 ${orientation === 'horizontal' ? 'flex-1 min-w-[200px]' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => setIsBarangayOpen(!isBarangayOpen)}
                            className="flex items-center gap-1.5 text-left font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Barangay</span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                {selectedBarangays.length > 0 ? `${selectedBarangays.length}/${barangays.length}` : 'All 14'}
                            </span>
                            {isBarangayOpen ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            )}
                        </button>
                        <div className="flex items-center gap-1 text-[11px]">
                            {selectedBarangays.length < barangays.length ? (
                                <button
                                    onClick={selectAllBarangays}
                                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                                >
                                    Select All
                                </button>
                            ) : (
                                <button
                                    onClick={clearAllBarangays}
                                    className="text-[11px] text-slate-500 hover:underline font-medium cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {isBarangayOpen && (
                        <>
                            {barangays.length > 8 && (
                                <div className="mb-2">
                                    <input
                                        type="text"
                                        value={barangaySearch}
                                        onChange={(e) => setBarangaySearch(e.target.value)}
                                        placeholder="Filter barangay..."
                                        className="w-full text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                                    />
                                </div>
                            )}

                            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                {filteredBarangaysList.map((name) => {
                                    const isChecked = selectedBarangays.includes(name);
                                    const count = barangayCounts[name] ?? 0;
                                    return (
                                        <label
                                            key={name}
                                            onClick={() => toggleBarangay(name)}
                                            className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                                                isChecked
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-200 font-semibold'
                                                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 dark:bg-slate-800 border-slate-300 dark:border-white/20 cursor-pointer"
                                                />
                                                <span className="truncate">{name}</span>
                                            </div>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                                    count > 0
                                                        ? isChecked
                                                            ? 'bg-rose-200/60 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 font-bold'
                                                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                        : 'text-slate-400 opacity-40'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* 3. INCIDENT TYPE FILTER */}
                <div className={`rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] p-2.5 ${orientation === 'horizontal' ? 'flex-1 min-w-[200px]' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <button
                            onClick={() => setIsComplaintOpen(!isComplaintOpen)}
                            className="flex items-center gap-1.5 text-left font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Incident Type</span>
                            {selectedComplaints.length > 0 && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                    {selectedComplaints.length}
                                </span>
                            )}
                            {isComplaintOpen ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            )}
                        </button>
                        <div className="flex items-center gap-1 text-[11px]">
                            {selectedComplaints.length < chiefComplaints.length ? (
                                <button
                                    onClick={selectAllComplaints}
                                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                                >
                                    Select All
                                </button>
                            ) : (
                                <button
                                    onClick={clearAllComplaints}
                                    className="text-[11px] text-slate-500 hover:underline font-medium cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic">
                        Filtered by standardized incident types.
                    </p>

                    {isComplaintOpen && (
                        <>
                            {chiefComplaints.length > 8 && (
                                <div className="mb-2">
                                    <input
                                        type="text"
                                        value={complaintSearch}
                                        onChange={(e) => setComplaintSearch(e.target.value)}
                                        placeholder="Filter type..."
                                        className="w-full text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                                    />
                                </div>
                            )}

                            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                {filteredComplaintsList.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2 text-center">
                                        No incident types available.
                                    </p>
                                ) : (
                                    filteredComplaintsList.map((name) => {
                                        const isChecked = selectedComplaints.includes(name);
                                        const count = complaintCounts[name] ?? 0;
                                        return (
                                            <label
                                                key={name}
                                                onClick={() => toggleComplaint(name)}
                                                className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                                                    isChecked
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 font-semibold'
                                                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 border-slate-300 dark:border-white/20 cursor-pointer"
                                                    />
                                                    <span className="truncate">{name}</span>
                                                </div>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                                        count > 0
                                                            ? isChecked
                                                                ? 'bg-indigo-200/60 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 font-bold'
                                                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            : 'text-slate-400 opacity-40'
                                                    }`}
                                                >
                                                    {count}
                                                </span>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </aside>
    );
}
