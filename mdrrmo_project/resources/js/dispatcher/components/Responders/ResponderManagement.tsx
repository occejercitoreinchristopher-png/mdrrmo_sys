import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '@/shared/components/DataTable';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Card from '@/shared/components/Card';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import Drawer from '@/shared/components/Drawer';
import Pagination from '@/shared/components/Pagination';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { toPascalCase } from '@/shared/utils/utils';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'offline', label: 'Offline' },
];

const ROLE_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'emt', label: 'EMT' },
    { value: 'driver', label: 'Driver' },
    { value: 'team_leader', label: 'Team Leader' },
];

const TEAM_OPTIONS = [
    { value: '', label: 'All Teams / Pools' },
    { value: 'Alpha', label: 'Team Alpha' },
    { value: 'Bravo', label: 'Team Bravo' },
    { value: 'Charlie', label: 'Team Charlie' },
    { value: 'reliever', label: 'Reliever Pool' },
    { value: 'unassigned', label: 'Unassigned' },
];

interface SummaryStats {
    total: number;
    assigned: number;
    available: number;
    offline: number;
    relievers: number;
}

interface ResponderManagementProps {
    initialUsers?: any[];
    initialPagination?: any;
    initialFilters?: any;
    initialSummary?: SummaryStats;
}

export default function ResponderManagement({
    initialUsers = [],
    initialPagination = null,
    initialFilters = {},
    initialSummary,
}: ResponderManagementProps) {
    // 1. Filter States
    const [search, setSearch] = useState(initialFilters?.search ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [statusFilter, setStatusFilter] = useState(initialFilters?.status ?? '');
    const [roleFilter, setRoleFilter] = useState(initialFilters?.role ?? '');
    const [teamFilter, setTeamFilter] = useState(initialFilters?.team ?? '');
    const [page, setPage] = useState(initialPagination?.current_page ?? 1);

    // 2. Drawer & Editing States
    const [selectedResponder, setSelectedResponder] = useState<any | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [editingBadge, setEditingBadge] = useState(false);
    const [badgeInput, setBadgeInput] = useState('');
    const [badgeUpdating, setBadgeUpdating] = useState(false);

    // Reset page to 1 when filters change
    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        setPage(1);
    };

    const handleRoleChange = (val: string) => {
        setRoleFilter(val);
        setPage(1);
    };

    const handleTeamChange = (val: string) => {
        setTeamFilter(val);
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setStatusFilter('');
        setRoleFilter('');
        setTeamFilter('');
        setPage(1);
    };

    const isFiltered = Boolean(debouncedSearch || statusFilter || roleFilter || teamFilter);

    // Sync URL search params cleanly
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter) params.set('status', statusFilter);
        if (roleFilter) params.set('role', roleFilter);
        if (teamFilter) params.set('team', teamFilter);
        if (page > 1) params.set('page', String(page));
        const qs = params.toString();
        const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [debouncedSearch, statusFilter, roleFilter, teamFilter, page]);

    // 4. TanStack Query for fast reactive caching & background fetching
    const fetchResponders = async () => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter) params.set('status', statusFilter);
        if (roleFilter) params.set('role', roleFilter);
        if (teamFilter) params.set('team', teamFilter);
        if (page > 1) params.set('page', String(page));

        const res = await fetch(`/dispatcher/responders?${params.toString()}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch responders roster');
        }

        return res.json();
    };

    const isDefaultState =
        !debouncedSearch &&
        !statusFilter &&
        !roleFilter &&
        !teamFilter &&
        page === (initialPagination?.current_page ?? 1);

    const { data: serverData, isFetching } = useQuery({
        queryKey: ['responders', debouncedSearch, statusFilter, roleFilter, teamFilter, page],
        queryFn: fetchResponders,
        initialData: isDefaultState
            ? {
                  users: initialUsers,
                  pagination: initialPagination,
                  summary: initialSummary,
                  filters: initialFilters,
              }
            : undefined,
        staleTime: 0,
        refetchOnWindowFocus: false,
    });

    // 5. Instant client-side reactive filtering (0ms latency fallback)
    const displayedUsers = useMemo(() => {
        let list: any[] = serverData?.users ?? initialUsers;

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase().trim();
            list = list.filter((u: any) => {
                const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase();
                const badge = `${u.badge_number ?? ''} ${u.badge_id ?? ''} ${u.responder_profile?.badge_number ?? ''}`.toLowerCase();
                const role = `${u.display_role ?? ''} ${u.responder_profile?.position ?? ''} ${u.role ?? ''}`.toLowerCase();
                const team = `${u.permanent_crew ?? ''} ${u.responder_profile?.team ?? ''}`.toLowerCase();
                const id = String(u.id ?? '');
                return (
                    fullName.includes(q) ||
                    badge.includes(q) ||
                    role.includes(q) ||
                    team.includes(q) ||
                    id === q ||
                    `rsp-${id}`.includes(q)
                );
            });
        }

        if (statusFilter) {
            list = list.filter((u: any) => {
                const raw = (u.current_status || (u.responder_profile?.availability === 'available' ? 'available' : 'offline')).toLowerCase();
                const st = raw === 'assigned' ? 'assigned' : (raw === 'available' ? 'available' : 'offline');
                return st === statusFilter.toLowerCase();
            });
        }

        if (roleFilter) {
            list = list.filter((u: any) => {
                const pos = `${u.display_role ?? ''} ${u.responder_profile?.position ?? ''} ${u.role ?? ''}`.toLowerCase();
                if (roleFilter === 'emt') return pos.includes('emt');
                if (roleFilter === 'driver') return pos.includes('driver');
                if (roleFilter === 'team_leader') return pos.includes('leader') || pos.includes('lead');
                return pos.includes(roleFilter.toLowerCase());
            });
        }

        if (teamFilter) {
            list = list.filter((u: any) => {
                const isReliever = Boolean(u.is_reliever || u.responder_profile?.is_reliever);
                const rawTeam = `${u.responder_profile?.team ?? ''} ${u.permanent_crew ?? ''}`.toLowerCase();
                if (teamFilter.toLowerCase() === 'reliever') {
                    return isReliever;
                }
                if (teamFilter.toLowerCase() === 'unassigned') {
                    return !isReliever && (rawTeam === '' || rawTeam.includes('unassigned'));
                }
                return !isReliever && rawTeam.includes(teamFilter.toLowerCase());
            });
        }

        return list;
    }, [serverData?.users, initialUsers, debouncedSearch, statusFilter, roleFilter, teamFilter]);

    const pagination = serverData?.pagination ?? initialPagination ?? null;
    const summary: SummaryStats = serverData?.summary ?? initialSummary ?? {
        total: initialUsers.length,
        assigned: initialUsers.filter((u: any) => u.current_status === 'assigned').length,
        available: initialUsers.filter((u: any) => u.current_status === 'available').length,
        offline: initialUsers.filter((u: any) => u.current_status !== 'assigned' && u.current_status !== 'available').length,
        relievers: initialUsers.filter((u: any) => u.is_reliever).length,
    };

    // 5. Drawer open / select responder
    const handleSelectResponder = (responder: any) => {
        setSelectedResponder(responder);
        const currentBadge =
            responder?.badge_number ||
            responder?.badge_id ||
            responder?.responder_profile?.badge_number ||
            `RSP-${String(responder?.id).padStart(4, '0')}`;
        setBadgeInput(currentBadge);
        setEditingBadge(false);
    };

    const handleUpdateBadge = () => {
        if (!selectedResponder || !badgeInput.trim()) return;
        setBadgeUpdating(true);
        router.patch(
            `/dispatcher/responders/${selectedResponder.id}/badge`,
            {
                badge_number: badgeInput.trim(),
            },
            {
                onFinish: () => {
                    setBadgeUpdating(false);
                    setEditingBadge(false);
                    setSelectedResponder((prev: any) =>
                        prev
                            ? {
                                  ...prev,
                                  badge_number: badgeInput.trim(),
                                  badge_id: badgeInput.trim(),
                              }
                            : null
                    );
                },
            }
        );
    };

    const handleUpdateStatus = (user: any, newAvailability: string) => {
        if (!user) return;
        setStatusUpdating(true);
        router.patch(
            `/dispatcher/responders/${user.id}/status`,
            {
                availability: newAvailability,
            },
            {
                onFinish: () => {
                    setStatusUpdating(false);
                    setSelectedResponder(null);
                },
            }
        );
    };

    // 6. Professional Status Badge (Only 3 canonical statuses: Assigned, Available, Offline)
    const renderStatusBadge = (user: any) => {
        const rawStatus = (user.current_status || (user.responder_profile?.availability === 'available' ? 'available' : 'offline')).toLowerCase();
        const status = rawStatus === 'assigned' ? 'assigned' : (rawStatus === 'available' ? 'available' : 'offline');
        const isLoggedIn = Boolean(user.is_logged_in);

        let badgeConfig = {
            label: 'Offline',
            dotClass: 'bg-slate-400',
            containerClass:
                'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/10',
        };

        if (status === 'assigned') {
            badgeConfig = {
                label: 'Assigned',
                dotClass: 'bg-cyan-500 animate-pulse',
                containerClass:
                    'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
            };
        } else if (status === 'available') {
            badgeConfig = {
                label: 'Available',
                dotClass: 'bg-emerald-500',
                containerClass:
                    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
            };
        }

        return (
            <div className="flex flex-col gap-1 items-start">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeConfig.containerClass}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeConfig.dotClass}`} />
                    <span>{badgeConfig.label}</span>
                </span>
                <span
                    className={`text-[10px] font-medium tracking-wide flex items-center gap-1 ${
                        isLoggedIn
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isLoggedIn ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                    />
                    {isLoggedIn ? 'App Online' : 'App Offline'}
                </span>
            </div>
        );
    };

    // 7. Table Columns
    const columns = [
        {
            key: 'name',
            header: 'Responder',
            render: (_: any, row: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 shrink-0">
                        <AvatarImage src={row.avatar} />
                        <AvatarFallback className="rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 text-xs font-bold ring-1 ring-slate-900/10 dark:ring-white/15">
                            {row.first_name?.[0]}
                            {row.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate capitalize">
                                {toPascalCase(`${row.first_name} ${row.last_name}`)}
                            </span>
                            {row.is_borrowed && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    Borrowed
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Role:{' '}
                            <span className="text-slate-800 dark:text-slate-300 font-medium capitalize">
                                {toPascalCase(row.display_role || 'Responder')}
                            </span>
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'badge_id',
            header: 'Badge ID',
            render: (_: any, row: any) => {
                const badge =
                    row.badge_number ||
                    row.badge_id ||
                    row.responder_profile?.badge_number ||
                    `RSP-${String(row.id).padStart(4, '0')}`;
                return (
                    <div className="flex flex-col items-start">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                            {badge}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                            ID #{row.id}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'permanent_crew',
            header: 'Team / Pool',
            render: (_: any, row: any) => (
                <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 capitalize">
                        {row.is_reliever ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                Reliever Pool
                            </span>
                        ) : (
                            toPascalCase(row.permanent_crew || 'Unassigned')
                        )}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {row.is_reliever ? 'Standby Fill-in' : 'Permanent Assignment'}
                    </span>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Role',
            render: (_: any, row: any) => (
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 capitalize">
                    {toPascalCase(row.display_role || 'Responder')}
                </span>
            ),
        },
        {
            key: 'availability',
            header: 'Status',
            render: (_: any, row: any) => renderStatusBadge(row),
        },
        {
            key: 'temporary_mission',
            header: 'Temporary Mission Assignment',
            render: (_: any, row: any) => {
                const mission = row.temporary_mission;
                if (!mission) {
                    return (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            — Standby
                        </span>
                    );
                }

                if (mission.is_reliever) {
                    return (
                        <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-[260px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                                    Reliever Mission
                                </span>
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 capitalize truncate">
                                    {toPascalCase(mission.dispatch_team || 'Emergency Mission')}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                Incident <strong className="text-slate-900 dark:text-white">#{mission.incident_id}</strong>
                                {mission.incident_code && (
                                    <span className="text-slate-500 dark:text-slate-400 font-mono ml-1">
                                        ({mission.incident_code})
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                            Incident #{mission.incident_id}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                            {toPascalCase(mission.dispatch_team)} • Active Deployment
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            render: (_: any, row: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectResponder(row)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <PageHeader
                title="Responder Availability & Crew Roster"
                subtitle="Track permanent team assignments, standby relievers, and live emergency mission deployments."
            />

            {/* Main Card with Search & Multi-Filter Toolbar */}
            <Card padding={false}>
                <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Search and Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                            {/* Debounced Search */}
                            <div className="w-full sm:w-64">
                                <SearchInput
                                    placeholder="Search name, badge, ID..."
                                    value={search}
                                    onChange={(val) => {
                                        setSearch(val);
                                        setDebouncedSearch(val);
                                        setPage(1);
                                    }}
                                    debounce={300}
                                    className="w-full"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="w-36 sm:w-40">
                                <Select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={handleStatusChange}
                                    options={STATUS_OPTIONS}
                                    placeholder={null}
                                    className="text-xs h-9 py-1.5"
                                />
                            </div>

                            {/* Role Filter */}
                            <div className="w-32 sm:w-36">
                                <Select
                                    id="role-filter"
                                    value={roleFilter}
                                    onChange={handleRoleChange}
                                    options={ROLE_OPTIONS}
                                    placeholder={null}
                                    className="text-xs h-9 py-1.5"
                                />
                            </div>

                            {/* Team / Pool Filter */}
                            <div className="w-36 sm:w-44">
                                <Select
                                    id="team-filter"
                                    value={teamFilter}
                                    onChange={handleTeamChange}
                                    options={TEAM_OPTIONS}
                                    placeholder={null}
                                    className="text-xs h-9 py-1.5"
                                />
                            </div>

                            {/* Reset Button (Only visible when filtered) */}
                            {isFiltered && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                    title="Reset all search and dropdown filters"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>

                        {/* Live Sync Status indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                            {isFetching && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                                    Updating...
                                </span>
                            )}
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                Showing {displayedUsers.length} of {summary.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Responders Table */}
                <div className="p-4">
                    <DataTable
                        columns={columns}
                        data={displayedUsers}
                        keyField="id"
                        loading={isFetching && displayedUsers.length === 0}
                        emptyTitle="No responders found"
                        emptyDescription="Try adjusting your search query, status, role, or team filters."
                    />

                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                            <Pagination
                                {...pagination}
                                onPageChange={(newPage) => {
                                    setPage(newPage);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* 4. Responder Details Drawer */}
            {selectedResponder && (
                <Drawer
                    open={Boolean(selectedResponder)}
                    onClose={() => setSelectedResponder(null)}
                    title={toPascalCase(`${selectedResponder.first_name} ${selectedResponder.last_name}`)}
                    description={`Permanent Assignment: ${toPascalCase(selectedResponder.permanent_crew || 'Unassigned')}`}
                    width="w-[420px]"
                >
                    <div className="space-y-4">
                        {/* Profile Header */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
                            <Avatar className="w-13 h-13 rounded-xl border border-slate-200/80 dark:border-white/10">
                                <AvatarImage src={selectedResponder.avatar} />
                                <AvatarFallback className="rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 text-base font-bold ring-1 ring-slate-900/10 dark:ring-white/15">
                                    {selectedResponder.first_name?.[0]}
                                    {selectedResponder.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate capitalize">
                                        {toPascalCase(`${selectedResponder.first_name} ${selectedResponder.last_name}`)}
                                    </h3>
                                    {selectedResponder.is_borrowed && (
                                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                                            Borrowed
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Official Role:{' '}
                                    <span className="text-slate-900 dark:text-white font-semibold capitalize">
                                        {toPascalCase(selectedResponder.display_role || 'Responder')}
                                    </span>
                                </p>
                                <div className="mt-2">{renderStatusBadge(selectedResponder)}</div>
                            </div>
                        </div>

                        {/* Official Badge & Identifier */}
                        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Official Badge & Identifier
                                </span>
                                {!editingBadge ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentBadge =
                                                selectedResponder.badge_number ||
                                                selectedResponder.badge_id ||
                                                selectedResponder.responder_profile?.badge_number ||
                                                `RSP-${String(selectedResponder.id).padStart(4, '0')}`;
                                            setBadgeInput(currentBadge);
                                            setEditingBadge(true);
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                        Edit Badge ID
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setEditingBadge(false)}
                                        className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {!editingBadge ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
                                            {selectedResponder.badge_number ||
                                                selectedResponder.badge_id ||
                                                selectedResponder.responder_profile?.badge_number ||
                                                `RSP-${String(selectedResponder.id).padStart(4, '0')}`}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            (User #{selectedResponder.id})
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                        Active Badge
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="text"
                                        value={badgeInput}
                                        onChange={(e) => setBadgeInput(e.target.value)}
                                        placeholder="e.g. RSP-0012 or BADGE-1"
                                        className="flex-1 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="default"
                                        loading={badgeUpdating}
                                        onClick={handleUpdateBadge}
                                        className="text-xs px-3 py-1.5 h-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                    >
                                        Save
                                    </Button>
                                </div>
                            )}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Used on reports and visible to residents in place of personal identity for responder privacy.
                            </p>
                        </div>

                        {/* Permanent Assignment Info */}
                        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Permanent Roster Assignment
                            </span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center justify-between">
                                <span>{toPascalCase(selectedResponder.permanent_crew || 'Unassigned')}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                    Official Unit
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Responders borrowed during mutual-aid missions automatically revert back to their permanent crew once the incident completes.
                            </p>
                        </div>

                        {/* Temporary Mission Assignment */}
                        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Temporary Mission Assignment
                            </span>

                            {selectedResponder.temporary_mission ? (
                                <div
                                    className={`p-3 rounded-xl border space-y-2 ${
                                        selectedResponder.is_borrowed
                                            ? 'bg-amber-500/10 border-amber-500/25'
                                            : 'bg-cyan-500/10 border-cyan-500/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                            Incident #{selectedResponder.temporary_mission.incident_id}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/60 dark:bg-white/10 text-slate-900 dark:text-white">
                                            {selectedResponder.temporary_mission.dispatch_status}
                                        </span>
                                    </div>

                                    {selectedResponder.is_borrowed && (
                                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                            Borrowed to: {selectedResponder.temporary_mission.borrowed_to || selectedResponder.temporary_mission.dispatch_team}
                                        </div>
                                    )}

                                    {selectedResponder.temporary_mission.incident_type && (
                                        <div className="text-xs text-slate-600 dark:text-slate-300">
                                            Emergency: {selectedResponder.temporary_mission.incident_type}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                                    No active mission deployment. Standby ready with{' '}
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                        {toPascalCase(selectedResponder.permanent_crew)}
                                    </span>
                                    .
                                </div>
                            )}
                        </div>

                        {/* Availability Control Actions */}
                        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Duty Status Control
                            </span>

                            {selectedResponder.current_status === 'assigned' ? (
                                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-800 dark:text-cyan-300">
                                    <strong>Mission Active:</strong> Duty status is locked while deployed on an active incident. Status unlocks automatically upon mission resolution.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'available'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'available')}
                                            className="text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 cursor-pointer"
                                        >
                                            Set Available
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'offline'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'offline')}
                                            className="text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/25 cursor-pointer"
                                        >
                                            Set Offline
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
}
