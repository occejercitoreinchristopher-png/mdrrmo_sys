import React, { useState, useEffect, useTransition } from 'react';
import { router } from '@inertiajs/react';
import {
    ChevronUp,
    ChevronDown,
    ArrowUpDown,
    ChevronRight,
    RotateCcw,
    Copy,
    Check,
    Search,
    X,
    AlertTriangle,
    Eye,
} from 'lucide-react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Pagination from '@/shared/components/Pagination';
import Select from '@/shared/components/Select';
import { toPascalCase } from '@/shared/utils/utils';
import CallerHistoryModal from '@/dispatcher/components/Residents/CallerHistoryModal';

interface Barangay {
    id: number;
    barangay_name: string;
}

interface ResidentProfile {
    id: number;
    user_id: number;
    barangay_id: number;
    birthdate?: string | null;
    gender?: 'male' | 'female' | null;
    barangay?: Barangay | null;
}

interface ResidentUser {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    phone_number?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    birthday?: string | null;
    age?: number | null;
    role: string;
    status: string;
    verification_status?: string | null;
    is_verified?: boolean;
    created_at: string;
    resident_profile?: ResidentProfile | null;
    reported_incidents_count: number;
}

interface SimCallerIncident {
    id?: number;
    caller_name?: string | null;
    caller_phone_number?: string | null;
    incident_status: string;
    report_source?: string;
    reported_at?: string | null;
    last_called_at?: string | null;
    total_calls?: number;
    prank_count?: number;
    place_of_incident?: string | null;
    incident_address?: string | null;
    incident_type?: { incident_type_name?: string; name?: string } | null;
}

interface ResidentSummary {
    total_registered: number;
    total_active: number;
    total_anonymous: number;
    total_reports: number;
}

interface ResidentsPageProps {
    residents: {
        data: ResidentUser[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    simCallers: {
        data: SimCallerIncident[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    barangays: Barangay[];
    filters: {
        search?: string;
        barangay?: string;
        sort?: string;
        direction?: 'asc' | 'desc';
        sim_search?: string;
    };
    summary?: ResidentSummary;
}

export default function ResidentsPage({
    residents,
    simCallers,
    barangays = [],
    filters = {},
    summary,
}: ResidentsPageProps) {
    const [activeTab, setActiveTab] = useState<'registered' | 'sim_callers'>('registered');
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [barangay, setBarangay] = useState(filters.barangay || '');
    const [simSearch, setSimSearch] = useState(filters.sim_search || '');
    const [debouncedSimSearch, setDebouncedSimSearch] = useState(simSearch);
    const [copiedId, setCopiedId] = useState<number | string | null>(null);
    const [selectedHistoryCaller, setSelectedHistoryCaller] = useState<{ phone: string; name: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const residentList = residents?.data || [];
    const simCallerList = simCallers?.data || [];
    const currentSort = filters.sort || 'created_at';
    const currentDirection = filters.direction || 'desc';

    // Debounce Registered Residents search input (350ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (debouncedSearch === (filters.search || '')) return;
        applyFilters(debouncedSearch, barangay);
    }, [debouncedSearch]);

    // Debounce SIM Callers search input (350ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSimSearch(simSearch);
        }, 350);
        return () => clearTimeout(timer);
    }, [simSearch]);

    useEffect(() => {
        if (debouncedSimSearch === (filters.sim_search || '')) return;
        startTransition(() => {
            router.get(
                '/dispatcher/residents',
                { ...(debouncedSimSearch ? { sim_search: debouncedSimSearch } : {}) },
                { preserveState: true, preserveScroll: true }
            );
        });
    }, [debouncedSimSearch]);

    const applyFilters = (
        newSearch?: string,
        newBarangay?: string,
        newSort?: string,
        newDirection?: string
    ) => {
        const queryParams: Record<string, any> = {};

        const s = newSearch !== undefined ? newSearch : search;
        const b = newBarangay !== undefined ? newBarangay : barangay;
        const sortKey = newSort !== undefined ? newSort : currentSort;
        const sortDir = newDirection !== undefined ? newDirection : currentDirection;

        if (s.trim()) queryParams.search = s.trim();
        if (b) queryParams.barangay = b;
        if (sortKey) queryParams.sort = sortKey;
        if (sortDir) queryParams.direction = sortDir;

        startTransition(() => {
            router.get('/dispatcher/residents', queryParams, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    const handleBarangayChange = (value: string) => {
        setBarangay(value);
        applyFilters(search, value);
    };

    const handleClearRegisteredFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setBarangay('');
        startTransition(() => {
            router.get(
                '/dispatcher/residents',
                {},
                { preserveState: true, preserveScroll: true }
            );
        });
    };

    const handleClearSimFilters = () => {
        setSimSearch('');
        setDebouncedSimSearch('');
        startTransition(() => {
            router.get(
                '/dispatcher/residents',
                {},
                { preserveState: true, preserveScroll: true }
            );
        });
    };

    const handleSort = (key: string) => {
        let newDir: 'asc' | 'desc' = 'asc';
        if (currentSort === key) {
            newDir = currentDirection === 'asc' ? 'desc' : 'asc';
        }
        applyFilters(undefined, undefined, key, newDir);
    };

    const handleCopyText = (e: React.MouseEvent, id: number | string, text: string) => {
        e.stopPropagation();
        if (!text) return;
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard
                    .writeText(text)
                    .then(() => {
                        setCopiedId(id);
                        setTimeout(() => setCopiedId(null), 2000);
                    })
                    .catch(() => fallbackCopy(text, id));
            } else {
                fallbackCopy(text, id);
            }
        } catch {
            fallbackCopy(text, id);
        }
    };

    const fallbackCopy = (text: string, id: number | string) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {}
    };

    const renderSortHeader = (label: string, sortKey: string) => {
        const isActive = currentSort === sortKey;
        return (
            <button
                type="button"
                onClick={() => handleSort(sortKey)}
                className="flex items-center gap-1.5 uppercase font-semibold text-[11px] tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group cursor-pointer whitespace-nowrap"
            >
                <span className="whitespace-nowrap">{label}</span>
                {isActive ? (
                    currentDirection === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )
                ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors shrink-0" />
                )}
            </button>
        );
    };

    const barangayOptions = [
        { value: '', label: 'All Barangays' },
        ...barangays.map((b) => ({
            value: String(b.id),
            label: `Brgy. ${toPascalCase(b.barangay_name)}`,
        })),
    ];

    const isRegisteredFiltered = Boolean(search || barangay || currentSort !== 'created_at');
    const isSimFiltered = Boolean(simSearch);

    return (
        <DispatcherLayout title="Resident Directory">
            <div className="space-y-4 max-w-7xl mx-auto pb-10">
                {/* 1. Page Header */}
                <PageHeader
                    title="Resident Directory"
                    subtitle="View registered community residents, demographic data, verified contact information, and reported incident records."
                />

                {/* 2. Sleek Segmented Tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('registered')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'registered'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Registered Residents</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sim_callers')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'sim_callers'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>SIM / Anonymous Callers</span>
                    </button>
                </div>

                {/* 4. Tab 1: Registered Residents View */}
                {activeTab === 'registered' && (
                    <Card padding={false}>
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                                    {/* Debounced Search Input */}
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search name, email, phone..."
                                            className="w-full bg-white dark:bg-[#070b14] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-xs"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch('');
                                                    setDebouncedSearch('');
                                                    applyFilters('', barangay);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Barangay Dropdown */}
                                    <div className="w-48 sm:w-56">
                                        <Select
                                            id="resident-barangay-filter"
                                            value={barangay}
                                            onChange={handleBarangayChange}
                                            options={barangayOptions}
                                            placeholder={null}
                                            className="text-xs h-9 py-1.5"
                                        />
                                    </div>

                                    {/* Reset Button (Only visible when filtered) */}
                                    {isRegisteredFiltered && (
                                        <button
                                            type="button"
                                            onClick={handleClearRegisteredFilters}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                            title="Reset all search and dropdown filters"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>

                                {/* Live Sync / Status */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {isPending && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                            Updating...
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        Showing {residentList.length} of {residents?.total ?? residentList.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                        <th className="px-5 py-3.5 whitespace-nowrap">
                                            {renderSortHeader('Resident Name', 'name')}
                                        </th>
                                        <th className="px-5 py-3.5 whitespace-nowrap">
                                            {renderSortHeader('Email', 'email')}
                                        </th>
                                        <th className="px-5 py-3.5 whitespace-nowrap">
                                            {renderSortHeader('Phone Number', 'phone_number')}
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Barangay
                                        </th>
                                        <th className="px-5 py-3.5 whitespace-nowrap">
                                            {renderSortHeader('Registration Date', 'created_at')}
                                        </th>
                                        <th className="px-5 py-3.5 whitespace-nowrap">
                                            {renderSortHeader('Status', 'status')}
                                        </th>
                                        <th className="px-5 py-3.5 text-center whitespace-nowrap">
                                            {renderSortHeader('Incidents', 'reported_incidents_count')}
                                        </th>
                                        <th className="px-5 py-3.5 text-right text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                                    {residentList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        No Residents Found
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                                        {search || barangay
                                                            ? 'No registered residents matched your search or barangay filter.'
                                                            : 'There are no residents registered in the database yet.'}
                                                    </p>
                                                    {isRegisteredFiltered && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClearRegisteredFilters}
                                                            className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        residentList.map((res) => {
                                            const profile = res.resident_profile;
                                            const barangayName = profile?.barangay?.barangay_name;
                                            const fullName = `${res.first_name} ${res.last_name}`;
                                            const initials = `${res.first_name?.[0] || ''}${res.last_name?.[0] || ''}`.toUpperCase();
                                            const formattedName = toPascalCase(fullName);
                                            const displayGender = res.gender || profile?.gender || null;
                                            const rawBirthdate = res.birthdate || res.birthday || profile?.birthdate || null;
                                            const displayAge = (() => {
                                                if (rawBirthdate) {
                                                    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(rawBirthdate));
                                                    const d = isoMatch
                                                        ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
                                                        : new Date(rawBirthdate);
                                                    if (!isNaN(d.getTime())) {
                                                        const today = new Date();
                                                        let years = today.getFullYear() - d.getFullYear();
                                                        const m = today.getMonth() - d.getMonth();
                                                        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
                                                        if (years >= 0 && years <= 120) return years;
                                                    }
                                                }
                                                return typeof res.age === 'number' && res.age > 0 ? res.age : null;
                                            })();

                                            const formattedDate = res.created_at
                                                ? new Date(res.created_at).toLocaleDateString('en-PH', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                  })
                                                : '—';

                                            const status = (res.status || 'active').toLowerCase();

                                            return (
                                                <tr
                                                    key={res.id}
                                                    onClick={() => router.get(`/dispatcher/residents/${res.id}`)}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                                >
                                                    {/* Resident Name & Demographics */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                                                                {initials || 'R'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
                                                                    {formattedName}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                                                                    {displayGender ? displayGender : 'Gender not set'}
                                                                    {displayAge !== null ? ` • ${displayAge} yrs` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                                        <span className="truncate max-w-[200px] block">
                                                            {res.email || '—'}
                                                        </span>
                                                    </td>

                                                    {/* Phone Number with subtle Copy */}
                                                    <td className="px-5 py-3.5 text-xs font-mono">
                                                        {res.phone_number ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-900 dark:text-slate-200">
                                                                    {res.phone_number}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleCopyText(e, res.id, res.phone_number!)
                                                                    }
                                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                                                    title="Copy phone number"
                                                                >
                                                                    {copiedId === res.id ? (
                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">—</span>
                                                        )}
                                                    </td>

                                                    {/* Barangay */}
                                                    <td className="px-5 py-3.5 text-xs">
                                                        {barangayName ? (
                                                            <span className="font-medium text-slate-900 dark:text-slate-200 capitalize">
                                                                Brgy. {toPascalCase(barangayName)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Registration Date */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                                                        {formattedDate}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                                            <span className="capitalize">{status}</span>
                                                        </div>
                                                    </td>

                                                    {/* Reported Incidents */}
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                                                            {res.reported_incidents_count}{' '}
                                                            {res.reported_incidents_count === 1 ? 'report' : 'reports'}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.get(`/dispatcher/residents/${res.id}`);
                                                            }}
                                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                                        >
                                                            <span>Details</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {residents && residents.last_page > 1 && (
                            <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                <Pagination
                                    currentPage={residents.current_page}
                                    lastPage={residents.last_page}
                                    total={residents.total}
                                    perPage={residents.per_page}
                                    onPageChange={(page) => {
                                        startTransition(() => {
                                            router.get(
                                                '/dispatcher/residents',
                                                {
                                                    ...(search ? { search } : {}),
                                                    ...(barangay ? { barangay } : {}),
                                                    sort: currentSort,
                                                    direction: currentDirection,
                                                    page,
                                                },
                                                { preserveState: true, preserveScroll: true }
                                            );
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </Card>
                )}

                {/* 5. Tab 2: SIM / Anonymous Callers View */}
                {activeTab === 'sim_callers' && (
                    <Card padding={false}>
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                                    {/* Debounced SIM Search Input */}
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={simSearch}
                                            onChange={(e) => setSimSearch(e.target.value)}
                                            placeholder="Search caller name or phone..."
                                            className="w-full bg-white dark:bg-[#070b14] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-xs"
                                        />
                                        {simSearch && (
                                            <button
                                                type="button"
                                                onClick={handleClearSimFilters}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Reset Button (Only visible when filtered) */}
                                    {isSimFiltered && (
                                        <button
                                            type="button"
                                            onClick={handleClearSimFilters}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                            title="Reset caller search"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {isPending && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                            Updating...
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        Showing {simCallerList.length} of {simCallers?.total ?? simCallerList.length} callers
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SIM Callers Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Caller
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Phone Number
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                            Total Calls
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                            Prank Calls
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Last Incident Type
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Location
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            Last Called
                                        </th>
                                        <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                                    {simCallerList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        No Anonymous Callers Found
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                                        {simSearch
                                                            ? 'No callers match your search query.'
                                                            : 'No phone or SIM call incidents without a linked resident account.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        simCallerList.map((inc, idx) => {
                                            const callerName = inc.caller_name
                                                ? toPascalCase(inc.caller_name)
                                                : 'Unknown Caller';
                                            const incidentTypeName =
                                                inc.incident_type?.incident_type_name ||
                                                inc.incident_type?.name ||
                                                'General';
                                            const location =
                                                inc.place_of_incident || inc.incident_address || '—';
                                            const lastCalled =
                                                inc.last_called_at || inc.reported_at
                                                    ? new Date(
                                                          (inc.last_called_at || inc.reported_at)!
                                                      ).toLocaleDateString('en-PH', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : '—';
                                            const callCount = inc.total_calls ?? 1;
                                            const prankCount = Number(inc.prank_count ?? 0);

                                            return (
                                                <tr
                                                    key={inc.caller_phone_number ?? idx}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                                                >
                                                    {/* Caller */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 font-bold text-xs">
                                                                {callerName[0] || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-white text-xs">
                                                                    {callerName}
                                                                </p>
                                                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                                                    SIM / Phone Call
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="px-5 py-3.5 font-mono text-xs">
                                                        {inc.caller_phone_number ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-900 dark:text-slate-200">
                                                                    {inc.caller_phone_number}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleCopyText(
                                                                            e,
                                                                            inc.caller_phone_number!,
                                                                            inc.caller_phone_number!
                                                                        )
                                                                    }
                                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                                                    title="Copy phone number"
                                                                >
                                                                    {copiedId === inc.caller_phone_number ? (
                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">—</span>
                                                        )}
                                                    </td>

                                                    {/* Total Calls */}
                                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                                                callCount >= 5
                                                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                                                                    : callCount >= 3
                                                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10'
                                                            }`}
                                                        >
                                                            {callCount}x {callCount === 1 ? 'Call' : 'Calls'}
                                                        </span>
                                                    </td>

                                                    {/* Prank Calls */}
                                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                        {prankCount > 0 ? (
                                                            <span
                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap"
                                                                title={`${prankCount} confirmed prank ${prankCount === 1 ? 'call' : 'calls'}`}
                                                            >
                                                                <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                                                {prankCount}x {prankCount === 1 ? 'Prank' : 'Pranks'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 whitespace-nowrap">
                                                                0
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Incident Type */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                        <span className="font-medium whitespace-nowrap">{incidentTypeName}</span>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400 min-w-[200px] max-w-[280px]">
                                                        <span className="line-clamp-2 break-words leading-snug block" title={location}>
                                                            {location}
                                                        </span>
                                                    </td>

                                                    {/* Last Called */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                                                        {lastCalled}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedHistoryCaller({
                                                                    phone: inc.caller_phone_number || '',
                                                                    name: callerName,
                                                                });
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                                                            title="View all past reports and call history"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="whitespace-nowrap">View History</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* SIM Callers Pagination */}
                        {simCallers && simCallers.last_page > 1 && (
                            <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                <Pagination
                                    currentPage={simCallers.current_page}
                                    lastPage={simCallers.last_page}
                                    total={simCallers.total}
                                    perPage={simCallers.per_page}
                                    onPageChange={(page) => {
                                        startTransition(() => {
                                            router.get(
                                                '/dispatcher/residents',
                                                {
                                                    ...(simSearch ? { sim_search: simSearch } : {}),
                                                    sim_page: page,
                                                },
                                                { preserveState: true, preserveScroll: true }
                                            );
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Caller Incident History Modal */}
            <CallerHistoryModal
                open={Boolean(selectedHistoryCaller)}
                onClose={() => setSelectedHistoryCaller(null)}
                phone={selectedHistoryCaller?.phone || null}
                callerName={selectedHistoryCaller?.name || null}
            />
        </DispatcherLayout>
    );
}
