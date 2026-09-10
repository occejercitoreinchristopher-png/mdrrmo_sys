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

const AVAILABILITY_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: '🟢 Available' },
    { value: 'assigned', label: '🚑 Assigned' },
    { value: 'off_duty', label: '🟡 Off Duty' },
    { value: 'on_leave', label: '🟠 On Leave' },
    { value: 'sick', label: '🔴 Sick' },
];

export default function ResponderManagement({ users = [], pagination = null }) {
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    🚑 Assigned
                </span>
            );
        }

        switch (status) {
            case 'available':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        🟢 Available
                    </span>
                );
            case 'off_duty':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        🟡 Off Duty
                    </span>
                );
            case 'on_leave':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        🟠 On Leave
                    </span>
                );
            case 'sick':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        🔴 Sick
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
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
                    <Avatar className="w-9 h-9 rounded-xl border border-white/10 shrink-0">
                        <AvatarImage src={row.avatar} />
                        <AvatarFallback className="rounded-xl bg-slate-800 text-xs font-bold text-slate-200">
                            {row.first_name?.[0]}{row.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm truncate">
                                {row.first_name} {row.last_name}
                            </span>
                            {row.is_borrowed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                    <ArrowRightLeft className="w-2.5 h-2.5" />
                                    Borrowed
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                            Role: <span className="text-slate-300 font-medium">{row.display_role || 'Responder'}</span>
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'permanent_crew',
            header: 'Permanent Crew',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                        {row.permanent_crew || 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-slate-500">Official Crew</span>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (_: any, row: any) => (
                <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-white/5">
                    {row.display_role || 'Responder'}
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
                    return <span className="text-xs text-slate-500 font-mono">— Standby</span>;
                }

                if (mission.is_borrowed) {
                    return (
                        <div className="flex flex-col gap-1 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 max-w-[280px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                    Borrowed
                                </span>
                                <span className="text-xs font-bold text-amber-200">
                                    Borrowed to: {mission.borrowed_to || mission.dispatch_team || 'Other Team'}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-300 flex items-center gap-1">
                                <Siren className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Incident: <strong className="text-white">#{mission.incident_id}</strong></span>
                                {mission.incident_code && (
                                    <span className="text-slate-400 font-mono">({mission.incident_code})</span>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-cyan-300 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Incident #{mission.incident_id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {mission.dispatch_team}
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
                    className="text-slate-400 hover:text-white hover:bg-white/5 text-xs flex items-center gap-1"
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
                subtitle="Track permanent crew assignments, live status, and temporary borrowed missions across teams." 
            />

            <Card padding={false}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-slate-900/30">
                    <div className="flex items-center gap-3 flex-1 max-w-lg">
                        <SearchInput 
                            placeholder="Search by name, crew, role..." 
                            onChange={setSearch} 
                            className="flex-1" 
                        />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={AVAILABILITY_OPTIONS}
                            placeholder={null}
                            className="w-44"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20">
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
                    title={`${selectedResponder.first_name} ${selectedResponder.last_name}`}
                    description={`Permanent Crew: ${selectedResponder.permanent_crew || 'Unassigned'}`}
                    width="w-[420px]"
                >
                    <div className="space-y-5">
                        {/* Header Avatar & Identity */}
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center gap-4">
                            <Avatar className="w-14 h-14 rounded-xl border border-white/10">
                                <AvatarImage src={selectedResponder.avatar} />
                                <AvatarFallback className="rounded-xl bg-slate-800 text-base font-bold text-white">
                                    {selectedResponder.first_name?.[0]}{selectedResponder.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base text-white truncate">
                                        {selectedResponder.first_name} {selectedResponder.last_name}
                                    </h3>
                                    {selectedResponder.is_borrowed && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                            Borrowed
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Role: <span className="text-white font-medium">{selectedResponder.display_role || 'Responder'}</span>
                                </p>
                                <div className="mt-2">
                                    {getStatusBadge(selectedResponder)}
                                </div>
                            </div>
                        </div>

                        {/* Permanent Crew Information */}
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 space-y-2">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Permanent Crew
                            </div>
                            <div className="text-base font-bold text-white flex items-center justify-between">
                                <span>{selectedResponder.permanent_crew || 'Unassigned'}</span>
                                <span className="text-[11px] font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded">Official Team</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                This responder officially belongs to <strong>{selectedResponder.permanent_crew}</strong>. Their permanent crew is never modified when borrowed.
                            </p>
                        </div>

                        {/* Temporary Mission Assignment Card */}
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 space-y-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-cyan-400" /> Temporary Mission Assignment
                            </div>

                            {selectedResponder.temporary_mission ? (
                                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                                    selectedResponder.is_borrowed 
                                        ? 'bg-amber-500/10 border-amber-500/30' 
                                        : 'bg-cyan-500/10 border-cyan-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-white">
                                            Incident: #{selectedResponder.temporary_mission.incident_id}
                                        </span>
                                        {selectedResponder.is_borrowed ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40">
                                                Borrowed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/30 text-cyan-200">
                                                Active Crew
                                            </span>
                                        )}
                                    </div>

                                    {selectedResponder.is_borrowed && (
                                        <div className="text-xs font-semibold text-amber-300">
                                            Borrowed to: <span className="text-white">{selectedResponder.temporary_mission.borrowed_to || selectedResponder.temporary_mission.dispatch_team}</span>
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-300">
                                        Status: <span className="capitalize font-medium text-white">{selectedResponder.temporary_mission.dispatch_status}</span>
                                    </div>

                                    {selectedResponder.temporary_mission.incident_type && (
                                        <div className="text-xs text-slate-400">
                                            Type: {selectedResponder.temporary_mission.incident_type}
                                        </div>
                                    )}

                                    {selectedResponder.is_borrowed && (
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                                            ⚠️ <strong>Notice:</strong> Carlos remains assigned to Incident #{selectedResponder.temporary_mission.incident_id} until completion. Upon mission completion, he will automatically return to <strong>{selectedResponder.permanent_crew}</strong>.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center text-xs text-slate-400">
                                    No active mission assignment. Ready for deployment with {selectedResponder.permanent_crew}.
                                </div>
                            )}
                        </div>

                        {/* Dispatcher Availability Control */}
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 space-y-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Availability Control
                            </div>

                            {selectedResponder.current_status === 'assigned' ? (
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        Locked: Responders assigned to active missions cannot have their availability altered. They will automatically return to their permanent crew once the dispatch is completed.
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400">
                                        Update duty availability for {selectedResponder.first_name} (e.g., when returning from absence):
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'available'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'available')}
                                            className="text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Set Available / Returned
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'off_duty'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'off_duty')}
                                            className="text-xs bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/30"
                                        >
                                            <Clock className="w-3.5 h-3.5" /> 🟡 Set Off Duty
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'on_leave'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'on_leave')}
                                            className="text-xs text-slate-300"
                                        >
                                            🟠 Set On Leave
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={statusUpdating}
                                            disabled={selectedResponder.current_status === 'sick'}
                                            onClick={() => handleUpdateStatus(selectedResponder, 'sick')}
                                            className="text-xs text-slate-300"
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
