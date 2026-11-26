import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Plus,
    Ambulance as AmbulanceIcon,
    Search,
} from 'lucide-react';
import AmbulanceDetailsModal from './AmbulanceDetailsModal';
import AmbulanceCard from './AmbulanceCard';
import AmbulanceForm, { type Ambulance } from './AmbulanceForm';
import Drawer from '@/shared/components/Drawer';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';
import { clsx } from 'clsx';

interface AmbulanceTableProps {
    ambulances?: Ambulance[];
    pagination?: any;
    nextAmbulanceCode?: string;
}

export default function AmbulanceTable({
    ambulances = [],
    pagination = null,
    nextAmbulanceCode,
}: AmbulanceTableProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Ambulance | null>(null);
    const [viewingAmbulance, setViewingAmbulance] = useState<Ambulance | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Ambulance | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Compute next available ambulance callsign automatically as fallback
    const generatedNextCode = useMemo(() => {
        if (nextAmbulanceCode) return nextAmbulanceCode;
        let maxNum = 0;
        (ambulances || []).forEach((a) => {
            const match = a.ambulance_code?.match(/AMB-?(\d+)/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `AMB-${String(maxNum + 1).padStart(2, '0')}`;
    }, [ambulances, nextAmbulanceCode]);

    // Fleet Counts & Readiness Rate (excluding Station/Walk-in clinic from vehicle counts)
    const counts = useMemo(() => {
        const isFleetVehicle = (a: Ambulance) => {
            const isStation =
                a.ambulance_code?.toUpperCase().includes('STATION') ||
                a.ambulance_code?.toUpperCase().includes('WALK-IN') ||
                a.plate_number?.toUpperCase().includes('WALK-IN') ||
                a.vehicle_type?.toLowerCase().includes('station');
            return !isStation;
        };

        const fleetAmbulances = ambulances.filter(isFleetVehicle);

        return {
            total: fleetAmbulances.length,
            available: fleetAmbulances.filter((a) => a.status === 'available').length,
            dispatched: fleetAmbulances.filter((a) => a.status === 'dispatched' || a.status === 'busy').length,
            maintenance: fleetAmbulances.filter((a) => a.status === 'maintenance' || a.status === 'inactive').length,
        };
    }, [ambulances]);

    // Filter by search and status tab
    const filtered = useMemo(() => {
        return ambulances.filter((a) => {
            const isStation =
                a.ambulance_code?.toUpperCase().includes('STATION') ||
                a.ambulance_code?.toUpperCase().includes('WALK-IN') ||
                a.plate_number?.toUpperCase().includes('WALK-IN') ||
                a.vehicle_type?.toLowerCase().includes('station');

            const q = search.trim().toLowerCase();
            const matchSearch =
                !q ||
                a.plate_number?.toLowerCase().includes(q) ||
                a.vehicle_name?.toLowerCase().includes(q) ||
                a.ambulance_code?.toLowerCase().includes(q) ||
                a.vehicle_type?.toLowerCase().includes(q);

            if (statusFilter === 'all') {
                return matchSearch;
            }

            // Status tabs (Available, Dispatched, Maintenance) strictly filter fleet ambulances
            return matchSearch && !isStation && a.status === statusFilter;
        });
    }, [ambulances, search, statusFilter]);

    const openCreate = () => {
        setEditing(null);
        setDrawerOpen(true);
    };

    const openEdit = (a: Ambulance) => {
        setEditing(a);
        setDrawerOpen(true);
    };

    const handleSubmit = (form: any) => {
        setSubmitting(true);
        const url = editing ? `/admin/ambulances/${editing.id}` : '/admin/ambulances';
        const method = editing ? 'patch' : 'post';
        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setDrawerOpen(false);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/ambulances/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    // 1-Click Fast Status Switcher
    const handleQuickStatusChange = (amb: Ambulance, newStatus: string) => {
        if (amb.status === newStatus) return;
        router.patch(
            `/admin/ambulances/${amb.id}`,
            {
                ambulance_code: amb.ambulance_code,
                plate_number: amb.plate_number,
                vehicle_name: amb.vehicle_name,
                vehicle_type: amb.vehicle_type,
                status: newStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* COMMAND & CONTROL HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            MDRRMO FLEET COMMAND
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Ambulance Fleet
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage emergency medical vehicles, technical readiness, and dispatch status.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-auto">

                    {/* Add Ambulance Button */}
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/25 active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Ambulance</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT CARD */}
            <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                {/* TOOLBAR: Filter Tabs & Search */}
                <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-x-auto max-w-full scrollbar-none">
                        {[
                            { id: 'all', label: 'All Fleet', count: counts.total },
                            { id: 'available', label: 'Available', count: counts.available },
                            { id: 'dispatched', label: 'Dispatched', count: counts.dispatched },
                            { id: 'maintenance', label: 'Maintenance', count: counts.maintenance },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={clsx(
                                    'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer',
                                    statusFilter === tab.id
                                        ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={clsx(
                                        'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                                        statusFilter === tab.id
                                            ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold'
                                            : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by code, plate, model, category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                            {filtered.length} found
                        </span>
                    </div>
                </div>

                {/* CONTENT AREA: Fleet Grid View */}
                <div className="p-4 sm:p-5">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="max-w-xs mx-auto space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mx-auto flex items-center justify-center">
                                        <AmbulanceIcon className="w-6 h-6" />
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                        No ambulances found
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Try adjusting your search criteria or filter tab.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filtered.map((amb) => (
                                    <AmbulanceCard
                                        key={amb.id}
                                        ambulance={amb}
                                        onEdit={openEdit}
                                        onDelete={setDeleteTarget}
                                        onView={setViewingAmbulance}
                                        onQuickStatus={handleQuickStatusChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                {/* PAGINATION */}
                {pagination && pagination.total > (pagination.perPage || 10) && (
                    <div className="p-4 border-t border-slate-200/80 dark:border-white/10">
                        <Pagination
                            {...pagination}
                            onPageChange={(page) =>
                                router.get(
                                    '/admin/ambulances',
                                    { page },
                                    { preserveState: true, preserveScroll: true }
                                )
                            }
                        />
                    </div>
                )}
            </div>

            {/* EDIT / CREATE DRAWER */}
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editing ? 'Edit Ambulance Details' : 'Register New Ambulance'}
                description={
                    editing
                        ? 'Update vehicle identifiers, callsign, and deployment status.'
                        : 'Register a new emergency response vehicle or clinic into the CAD fleet.'
                }
                width="w-full max-w-xl"
            >
                <AmbulanceForm
                    ambulance={editing}
                    defaultCode={generatedNextCode}
                    onSubmit={handleSubmit}
                    onCancel={() => setDrawerOpen(false)}
                    loading={submitting}
                />
            </Drawer>

            {/* QUICK VEHICLE DOSSIER SPECIFICATIONS MODAL */}
            <AmbulanceDetailsModal
                open={!!viewingAmbulance}
                ambulance={viewingAmbulance}
                onClose={() => setViewingAmbulance(null)}
                onEdit={openEdit}
                onQuickStatus={handleQuickStatusChange}
            />

            {/* DELETE CONFIRM DIALOG */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Decommission Ambulance"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete ambulance ${
                              deleteTarget.ambulance_code || deleteTarget.plate_number
                          }? This action cannot be reversed.`
                        : ''
                }
                confirmLabel="Delete"
            />
        </div>
    );
}
