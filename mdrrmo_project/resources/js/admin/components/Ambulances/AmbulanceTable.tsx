import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Ambulance as AmbulanceIcon, CheckCircle2, Truck, Wrench } from 'lucide-react';
import DataTable, { type Column } from '@/shared/components/DataTable';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import Drawer from '@/shared/components/Drawer';
import AmbulanceForm, { type Ambulance } from './AmbulanceForm';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';
import { clsx } from 'clsx';
import { toPascalCase } from '@/shared/utils/utils';

interface AmbulanceTableProps {
    ambulances?: Ambulance[];
    pagination?: any;
}

export default function AmbulanceTable({ ambulances = [], pagination = null }: AmbulanceTableProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Ambulance | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Ambulance | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter by search and status tab
    const filtered = useMemo(() => {
        return ambulances.filter((a) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                a.plate_number?.toLowerCase().includes(q) ||
                a.vehicle_name?.toLowerCase().includes(q) ||
                a.ambulance_code?.toLowerCase().includes(q);

            const matchStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [ambulances, search, statusFilter]);

    // Fleet Counts
    const counts = useMemo(() => {
        return {
            total: ambulances.length,
            available: ambulances.filter((a) => a.status === 'available').length,
            dispatched: ambulances.filter((a) => a.status === 'dispatched' || a.status === 'busy').length,
            maintenance: ambulances.filter((a) => a.status === 'maintenance' || a.status === 'inactive').length,
        };
    }, [ambulances]);

    const openCreate = () => { setEditing(null); setDrawerOpen(true); };
    const openEdit = (a: Ambulance) => { setEditing(a); setDrawerOpen(true); };

    const handleSubmit = (form: any) => {
        setSubmitting(true);
        const url = editing ? `/admin/ambulances/${editing.id}` : '/admin/ambulances';
        const method = editing ? 'patch' : 'post';
        router[method](url, form, {
            onSuccess: () => { setDrawerOpen(false); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/ambulances/${deleteTarget.id}`, {
            onSuccess: () => { setDeleteTarget(null); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const columns: Column<Ambulance>[] = [
        {
            key: 'ambulance_code',
            header: 'Unit Code',
            sortable: true,
            render: (v) => (
                <span className="font-mono font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs">
                    {v || 'UNIT'}
                </span>
            ),
        },
        {
            key: 'plate_number',
            header: 'Plate Number',
            sortable: true,
            render: (v) => (
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    {v}
                </span>
            ),
        },
        {
            key: 'vehicle_name',
            header: 'Vehicle Model',
            sortable: true,
            render: (v) => (
                <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {toPascalCase(v) || '—'}
                </span>
            ),
        },
        {
            key: 'vehicle_type',
            header: 'Fleet Category',
            render: (v) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 capitalize">
                    {toPascalCase(v) || 'Standard'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Deployment Status',
            sortable: true,
            render: (v) => <AmbulanceStatusBadge status={v} />,
        },
        {
            key: 'actions',
            header: 'Manage',
            render: (_, row) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                        className="hover:bg-slate-200 dark:hover:bg-white/15"
                    >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ambulance Fleet"
                subtitle="Manage emergency medical vehicles, technical readiness, and dispatch status."
                actions={
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Ambulance</span>
                    </button>
                }
            />

            {/* Fleet Statistics KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0">
                        <AmbulanceIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Fleet</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{counts.total}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{counts.available}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dispatched</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{counts.dispatched}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Maintenance</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{counts.maintenance}</p>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <Card padding={false} className="overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start overflow-x-auto max-w-full">
                        {[
                            { id: 'all', label: 'All Fleet', count: counts.total },
                            { id: 'available', label: 'Available', count: counts.available },
                            { id: 'dispatched', label: 'Dispatched', count: counts.dispatched },
                            { id: 'maintenance', label: 'Maintenance', count: counts.maintenance },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={clsx(
                                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer',
                                    statusFilter === tab.id
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                                )}
                            >
                                <span>{tab.label}</span>
                                <span className={clsx(
                                    'px-1.5 py-0.2 rounded-full text-[10px]',
                                    statusFilter === tab.id
                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold'
                                        : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-slate-400',
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <SearchInput
                            placeholder="Search by code, plate, model..."
                            onChange={setSearch}
                            className="w-full md:w-72"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {filtered.length} found
                        </p>
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <DataTable
                        columns={columns}
                        data={filtered}
                        keyField="id"
                        emptyTitle="No ambulances found"
                        emptyDescription="Try adjusting your search criteria or filter tab."
                        emptyIcon={AmbulanceIcon}
                    />

                    {pagination && (
                        <Pagination
                            {...pagination}
                            onPageChange={(page) =>
                                router.get('/admin/ambulances', { page }, { preserveState: true, preserveScroll: true })
                            }
                        />
                    )}
                </div>
            </Card>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editing ? 'Edit Ambulance Details' : 'Register New Ambulance'}
            >
                <AmbulanceForm
                    ambulance={editing}
                    onSubmit={handleSubmit}
                    onCancel={() => setDrawerOpen(false)}
                    loading={submitting}
                />
            </Drawer>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Decommission Ambulance"
                description={deleteTarget ? `Are you sure you want to delete ambulance ${deleteTarget.ambulance_code || deleteTarget.plate_number}? This action cannot be reversed.` : ''}
                confirmLabel="Delete"
            />
        </div>
    );
}
