import React, { useState, useTransition } from 'react';
import { router } from '@inertiajs/react';
import {
    Users,
    Search,
    MapPin,
    Phone,
    Mail,
    Calendar,
    AlertTriangle,
    Eye,
    Copy,
    Check,
    X,
    Filter,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import Pagination from '@/shared/components/Pagination';

interface Barangay {
    id: number;
    barangay_name: string;
}

interface ResidentProfile {
    id: number;
    user_id: number;
    barangay_id: number;
    house_no?: string | null;
    street?: string | null;
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
    role: string;
    status: string;
    created_at: string;
    resident_profile?: ResidentProfile | null;
    reported_incidents_count: number;
}

interface ResidentsPageProps {
    residents: {
        data: ResidentUser[];
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
    };
}

export default function ResidentsPage({ residents, barangays = [], filters = {} }: ResidentsPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [barangay, setBarangay] = useState(filters.barangay || '');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    const residentList = residents?.data || [];
    const currentSort = filters.sort || 'created_at';
    const currentDirection = filters.direction || 'desc';

    const handleApplyFilters = (newSearch?: string, newBarangay?: string, newSort?: string, newDirection?: string) => {
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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleApplyFilters(search, barangay);
    };

    const handleClearFilters = () => {
        setSearch('');
        setBarangay('');
        startTransition(() => {
            router.get('/dispatcher/residents', {}, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    const handleSort = (key: string) => {
        let newDir: 'asc' | 'desc' = 'asc';
        if (currentSort === key) {
            newDir = currentDirection === 'asc' ? 'desc' : 'asc';
        }
        handleApplyFilters(undefined, undefined, key, newDir);
    };

    const handleCopyPhone = (e: React.MouseEvent, id: number, phone: string) => {
        e.stopPropagation();
        if (!phone) return;
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(phone).then(() => {
                    setCopiedId(id);
                    setTimeout(() => setCopiedId(null), 2000);
                }).catch(() => {
                    fallbackCopy(phone, id);
                });
            } else {
                fallbackCopy(phone, id);
            }
        } catch {
            fallbackCopy(phone, id);
        }
    };

    const fallbackCopy = (text: string, id: number) => {
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
                className="flex items-center gap-1.5 uppercase font-semibold text-xs text-slate-400 hover:text-white transition-colors group text-left"
            >
                <span>{label}</span>
                {isActive ? (
                    currentDirection === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
                    )
                ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                )}
            </button>
        );
    };

    return (
        <DispatcherLayout title="Residents">
            <div className="space-y-5 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <PageHeader
                    title="Resident Directory"
                    subtitle="View registered community residents, demographic data, verified contact information, and reported incident records."
                />

                {/* Filter and Search Bar Card */}
                <Card padding={false} className="border-white/10 bg-slate-900/70 shadow-xl backdrop-blur-md overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                                {/* Search input */}
                                <div className="relative flex-1 min-w-[260px]">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name (e.g. 'ren'), email, phone..."
                                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40 transition-all"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                handleApplyFilters('', barangay);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Barangay Dropdown Filter */}
                                <div className="relative min-w-[180px]">
                                    <select
                                        value={barangay}
                                        onChange={(e) => {
                                            setBarangay(e.target.value);
                                            handleApplyFilters(search, e.target.value);
                                        }}
                                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-900 text-slate-300">All Barangays</option>
                                        {barangays.map((b) => (
                                            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                                Brgy. {b.barangay_name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                        ▼
                                    </div>
                                </div>

                                {/* Search button */}
                                <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap">
                                    <Search className="w-3.5 h-3.5 mr-1" />
                                    Search
                                </Button>

                                {/* Reset Filter Button */}
                                {(search || barangay || currentSort !== 'created_at') && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="whitespace-nowrap"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Count summary */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 self-end md:self-center">
                                <span>Showing <strong className="text-white">{residents?.total ?? residentList.length}</strong> registered residents</span>
                            </div>
                        </form>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto relative">
                        {isPending && (
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-rose-300">
                                    <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    Loading residents...
                                </div>
                            </div>
                        )}

                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.03]">
                                    <th className="px-5 py-3.5">
                                        {renderSortHeader('Resident Name', 'name')}
                                    </th>
                                    <th className="px-5 py-3.5">
                                        {renderSortHeader('Email', 'email')}
                                    </th>
                                    <th className="px-5 py-3.5">
                                        {renderSortHeader('Phone Number', 'phone_number')}
                                    </th>
                                    <th className="px-5 py-3.5 text-xs uppercase font-semibold text-slate-400">
                                        Barangay
                                    </th>
                                    <th className="px-5 py-3.5">
                                        {renderSortHeader('Registration Date', 'created_at')}
                                    </th>
                                    <th className="px-5 py-3.5">
                                        {renderSortHeader('Status', 'status')}
                                    </th>
                                    <th className="px-5 py-3.5 text-center">
                                        {renderSortHeader('Incidents', 'reported_incidents_count')}
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-xs uppercase font-semibold text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {residentList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mb-1">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-semibold text-white">No Residents Found</p>
                                                <p className="text-xs text-slate-500 max-w-sm">
                                                    {search || barangay
                                                        ? 'No residents match your search criteria. Try clearing filters.'
                                                        : 'There are no residents registered in the system yet.'}
                                                </p>
                                                {(search || barangay) && (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={handleClearFilters}
                                                        className="mt-2"
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    residentList.map((res) => {
                                        const profile = res.resident_profile;
                                        const barangayName = profile?.barangay?.barangay_name || 'Unassigned';
                                        const fullName = `${res.first_name} ${res.last_name}`;
                                        const initials = `${res.first_name?.[0] || ''}${res.last_name?.[0] || ''}`.toUpperCase();

                                        const formattedDate = res.created_at
                                            ? new Date(res.created_at).toLocaleDateString('en-PH', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                              })
                                            : '—';

                                        return (
                                            <tr
                                                key={res.id}
                                                onClick={() => router.get(`/dispatcher/residents/${res.id}`)}
                                                className="hover:bg-rose-500/[0.04] transition-colors cursor-pointer group"
                                            >
                                                {/* Resident Name */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <span className="text-xs font-bold text-rose-300">
                                                                {initials || 'R'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                                                                {fullName}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 capitalize">
                                                                {profile?.gender ? profile.gender : 'Gender not set'}
                                                                {profile?.birthdate ? ` • ${new Date().getFullYear() - new Date(profile.birthdate).getFullYear()} yrs` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td className="px-5 py-4 text-xs text-slate-300">
                                                    <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                                                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span className="truncate">{res.email}</span>
                                                    </div>
                                                </td>

                                                {/* Phone Number with Copy */}
                                                <td className="px-5 py-4 text-xs font-mono">
                                                    {res.phone_number ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-200">{res.phone_number}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleCopyPhone(e, res.id, res.phone_number!)}
                                                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                                title="Copy phone number"
                                                            >
                                                                {copiedId === res.id ? (
                                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">—</span>
                                                    )}
                                                </td>

                                                {/* Barangay */}
                                                <td className="px-5 py-4 text-xs">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                                                        <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                                        {barangayName}
                                                    </span>
                                                </td>

                                                {/* Registration Date */}
                                                <td className="px-5 py-4 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span>{formattedDate}</span>
                                                    </div>
                                                </td>

                                                {/* Account Status */}
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={res.status || 'active'} />
                                                </td>

                                                {/* Reported Incidents */}
                                                <td className="px-5 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            res.reported_incidents_count > 0
                                                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                                                : 'bg-slate-800 text-slate-400 border border-white/5'
                                                        }`}
                                                    >
                                                        {res.reported_incidents_count} {res.reported_incidents_count === 1 ? 'report' : 'reports'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <Button
                                                        size="xs"
                                                        variant="secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.get(`/dispatcher/residents/${res.id}`);
                                                        }}
                                                        className="group-hover:border-rose-500/40 group-hover:text-rose-300"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" />
                                                        View Details
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
                        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
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
            </div>
        </DispatcherLayout>
    );
}
