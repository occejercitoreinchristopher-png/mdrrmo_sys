import { useState } from 'react';
import { router } from '@inertiajs/react';
import DataTable from '@/shared/components/DataTable';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Card from '@/shared/components/Card';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import Drawer from '@/shared/components/Drawer';
import Pagination from '@/shared/components/Pagination';
import { 
    ShieldAlert, 
    Shield, 
    Truck, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    UserCheck, 
    ChevronRight,
    ArrowRightLeft,
    Siren
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { toPascalCase } from '@/shared/utils/utils';

const AVAILABILITY_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: '🟢 Available' },
    { value: 'assigned', label: '🚑 Assigned' },
    { value: 'off_duty', label: '🟡 Off Duty' },
    { value: 'on_leave', label: '🟠 On Leave' },
    { value: 'sick', label: '🔴 Sick' },
];

interface ResponderManagementProps {
    users?: any[];
    pagination?: any;
}

export default function ResponderManagement({ users = [], pagination = null }: ResponderManagementProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedResponder, setSelectedResponder] = useState<any | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const filtered = users.filter((u: any) => {
        const q = search.toLowerCase();
        const matchQ =
            !q ||
            u.first_name?.toLowerCase().includes(q) ||
            u.last_name?.toLowerCase().includes(q) ||
            u.display_role?.toLowerCase().includes(q) ||
            u.permanent_crew?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q);

        const currentStatus = u.current_status || u.responder_profile?.availability || 'offline';
        const matchStatus = !statusFilter || 
            (statusFilter === 'assigned' ? currentStatus === 'assigned' : currentStatus === statusFilter);

        return matchQ && matchStatus;
    });

    const getStatusBadge = (user: any) => {
        const status = user.current_status || user.responder_profile?.availability || 'offline';

        if (status === 'assigned') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    🚑 Assigned
                </span>
            );
        }

        switch (status) {
            case 'available':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        🟢 Available
                    </span>
                );
            case 'off_duty':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        🟡 Off Duty
                    </span>
                );
            case 'on_leave':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        🟠 On Leave
                    </span>
                );
            case 'sick':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        🔴 Sick
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30 capitalize">
                        ⚪ {status.replace('_', ' ')}
                    </span>
                );
        }
    };

    const handleUpdateStatus = (user: any, newAvailability: string) => {
        if (!user) return;
        setStatusUpdating(true);
        router.patch(`/dispatcher/responders/${user.id}/status`, {
            availability: newAvailability,
        }, {
            onFinish: () => {
                setStatusUpdating(false);
                setSelectedResponder(null);
            }
        });
    };

    const columns = [
        {
            key: 'name',
            header: 'Responder',
            render: (_: any, row: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 shrink-0">
                        <AvatarImage src={row.avatar} />
                        <AvatarFallback className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-bold ring-1 ring-slate-900/10 dark:ring-white/20">
                            {row.first_name?.[0]}{row.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate capitalize">
                                {toPascalCase(`${row.first_name} ${row.last_name}`)}
                            </span>
                            {row.is_borrowed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                                    <ArrowRightLeft className="w-2.5 h-2.5" />
                                    Borrowed
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Role: <span className="text-slate-800 dark:text-slate-300 font-medium capitalize">{toPascalCase(row.display_role || 'Responder')}</span>
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'permanent_crew',
            header: 'Team / Pool',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-200 capitalize">
                        {row.is_reliever ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Reliever Pool
                            </span>
                        ) : (
                            <>
                                <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                {toPascalCase(row.permanent_crew || 'Unassigned')}
                            </>
                        )}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {row.is_reliever ? 'Standby Fill-in' : 'Permanent Crew'}
                    </span>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (_: any, row: any) => (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-white/10 capitalize">
                    {toPascalCase(row.display_role || 'Responder')}
                </span>
            )
        },
        {
            key: 'availability',
            header: 'Status',
            render: (_: any, row: any) => getStatusBadge(row)
        },
        {
            key: 'temporary_mission',
            header: 'Temporary Mission Assignment',
            render: (_: any, row: any) => {
                const mission = row.temporary_mission;
                if (!mission) {
                    return <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">— Standby</span>;
                }

                if (mission.is_reliever) {
                    return (
                        <div className="flex flex-col gap-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25 max-w-[280px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                    Reliever Mission
                                </span>
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 capitalize">
                                    Assigned to: {toPascalCase(mission.dispatch_team || 'Emergency Mission')}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Siren className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Incident: <strong className="text-slate-900 dark:text-white">#{mission.incident_id}</strong></span>
                                {mission.incident_code && (
                                    <span className="text-slate-500 dark:text-slate-400 font-mono">({mission.incident_code})</span>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#F61509]" />
                            Incident #{mission.incident_id}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                            {toPascalCase(mission.dispatch_team)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: '',
            render: (_: any, row: any) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedResponder(row)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <PageHeader 
                title="Responder Availability & Crew Roster" 
                subtitle="Track permanent team assignments, standby relievers, and live emergency mission deployments." 
            />

            <Card padding={false}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3 flex-1 max-w-lg">
                        <SearchInput 
                            placeholder="Search by name, crew, role..." 
                            value={search}
                            onChange={setSearch} 
                            className="flex-1" 
                        />
                        <Select
                            id="status-filter"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={AVAILABILITY_OPTIONS}
                            className="w-44"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/20 font-medium">
                            <ArrowRightLeft className="w-3 h-3" /> Borrowed: Never changes permanent crew
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    <DataTable 
                        columns={columns} 
                        data={filtered} 
                        keyField="id" 
                        emptyTitle="No responders found" 
                        emptyIcon={ShieldAlert} 
                    />
                    {pagination && (
                        <div className="mt-4">
                            <Pagination {...pagination} onPageChange={(page) => router.get(window.location.pathname, { page })} />
                        </div>
                    )}
                </div>
            </Card>

            {/* Responder Details Sidebar Drawer */}
            {selectedResponder && (
                <Drawer
                    open={Boolean(selectedResponder)}
                    onClose={() => setSelectedResponder(null)}
                    title={toPascalCase(`${selectedResponder.first_name} ${selectedResponder.last_name}`)}
                    description={`Permanent Crew: ${toPascalCase(selectedResponder.permanent_crew || 'Unassigned')}`}
                    width="w-[420px]"
                >
                    <div className="space-y-5">
                        {/* Header Avatar & Identity */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
                            <Avatar className="w-14 h-14 rounded-xl border border-slate-200/80 dark:border-white/10">
                                <AvatarImage src={selectedResponder.avatar} />
                                <AvatarFallback className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-base font-bold ring-1 ring-slate-900/10 dark:ring-white/20">
                                    {selectedResponder.first_name?.[0]}{selectedResponder.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate capitalize">
                                        {toPascalCase(`${selectedResponder.first_name} ${selectedResponder.last_name}`)}
                                    </h3>
                                    {selectedResponder.is_borrowed && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                            Borrowed
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Role: <span className="text-slate-900 dark:text-white font-semibold capitalize">{toPascalCase(selectedResponder.display_role || 'Responder')}</span>
                                </p>
                                <div className="mt-2">
                                    {getStatusBadge(selectedResponder)}
                                </div>
                            </div>
                        </div>

                        {/* Permanent Crew Information */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-2">
                            <div className="text-[10px] font-bold text-[#F61509] uppercase tracking-widest flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Permanent Crew
                            </div>
                            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between capitalize">
                                <span>{toPascalCase(selectedResponder.permanent_crew || 'Unassigned')}</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">Official Team</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                This responder officially belongs to <strong className="text-slate-900 dark:text-white capitalize">{toPascalCase(selectedResponder.permanent_crew)}</strong>. Their permanent crew is never modified when borrowed.
                            </p>
                        </div>

                        {/* Temporary Mission Assignment Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-3">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-blue-500" /> Temporary Mission Assignment
                            </div>

                            {selectedResponder.temporary_mission ? (
                                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                                    selectedResponder.is_borrowed 
                                        ? 'bg-amber-500/10 border-amber-500/30' 
                                        : 'bg-cyan-500/10 border-cyan-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                            Incident: #{selectedResponder.temporary_mission.incident_id}
                                        </span>
                                        {selectedResponder.is_borrowed ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-500/30">
                                                Borrowed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-200">
                                                Active Crew
                                            </span>
                                        )}
                                    </div>

                                    {selectedResponder.is_borrowed && (
                                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                                            Borrowed to: <span className="text-slate-900 dark:text-white">{selectedResponder.temporary_mission.borrowed_to || selectedResponder.temporary_mission.dispatch_team}</span>
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-600 dark:text-slate-300">
                                        Status: <span className="capitalize font-medium text-slate-900 dark:text-white">{selectedResponder.temporary_mission.dispatch_status}</span>
                                    </div>

                                    {selectedResponder.temporary_mission.incident_type && (
                                        <div className="text-xs text-slate-400">
                                            Type: {selectedResponder.temporary_mission.incident_type}
                                        </div>
                                    )}

                                    {selectedResponder.is_borrowed && (
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
                                            ⚠️ <strong>Notice:</strong> {toPascalCase(selectedResponder.first_name)} remains assigned to Incident #{selectedResponder.temporary_mission.incident_id} until completion. Upon mission completion, they will automatically return to <strong className="capitalize">{toPascalCase(selectedResponder.permanent_crew)}</strong>.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400">
                                    No active mission assignment. Ready for deployment with <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{toPascalCase(selectedResponder.permanent_crew)}</span>.
                                </div>
                            )}
                        </div>

                        {/* Dispatcher Availability Control */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-3">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Availability Control
                            </div>

                            {selectedResponder.current_status === 'assigned' ? (
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-800 dark:text-cyan-300 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
                                    <span>
                                        Locked: Responders assigned to active missions cannot have their availability altered. They will automatically return to their permanent crew once the dispatch is completed.
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Update duty availability for <span className="font-semibold text-slate-900 dark:text-white capitalize">{toPascalCase(selectedResponder.first_name)}</span> (e.g., when returning from absence):
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'available'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'available')}
                                            className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Set Available / Returned
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'off_duty'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'off_duty')}
                                            className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/30"
                                        >
                                            <Clock className="w-3.5 h-3.5" /> 🟡 Set Off Duty
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'on_leave'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'on_leave')}
                                            className="text-xs text-slate-700 dark:text-slate-300"
                                        >
                                            🟠 Set On Leave
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'sick'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'sick')}
                                            className="text-xs text-slate-700 dark:text-slate-300"
                                        >
                                            🔴 Set Sick
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
