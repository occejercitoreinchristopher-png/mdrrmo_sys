import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus,
    Pencil,
    Trash2,
    AlertTriangle,
    LifeBuoy,
    Flame,
    Car,
    ShieldAlert,
    Stethoscope,
    Activity,
    Layers,
    Search
} from 'lucide-react';
import DataTable, { Column } from '@/shared/components/DataTable';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';
import IncidentTypeModal, { IncidentType } from './IncidentTypeModal';

interface IncidentTypeTableProps {
    incidentTypes?: IncidentType[];
    pagination?: any;
    filters?: {
        search?: string;
    };
}

export default function IncidentTypeTable({
    incidentTypes = [],
    pagination = null,
    filters = {},
}: IncidentTypeTableProps) {
    const { errors = {} } = usePage().props as any;

    const [search, setSearch] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<IncidentType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IncidentType | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter by client search if pagination is single-page or local
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return incidentTypes;
        return incidentTypes.filter((t) => {
            return (
                t.incident_type_name.toLowerCase().includes(q) ||
                (t.type_description && t.type_description.toLowerCase().includes(q))
            );
        });
    }, [incidentTypes, search]);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (type: IncidentType) => {
        setEditing(type);
        setModalOpen(true);
    };

    const handleSubmit = (form: { incident_type_name: string; type_description: string }) => {
        setSubmitting(true);
        const url = editing?.id ? `/admin/incident-types/${editing.id}` : '/admin/incident-types';
        const method = editing?.id ? 'patch' : 'post';

        router[method](url, form, {
            onSuccess: () => {
                setModalOpen(false);
                setEditing(null);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget?.id) return;
        setDeleting(true);

        router.delete(`/admin/incident-types/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const getTypeColor = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('medic') || n.includes('trauma')) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', icon: Stethoscope };
        if (n.includes('fire')) return { bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800', icon: Flame };
        if (n.includes('accident') || n.includes('vehic') || n.includes('traffic')) return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', icon: Car };
        if (n.includes('crime') || n.includes('assault') || n.includes('weapon')) return { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800', icon: ShieldAlert };
        if (n.includes('rescue') || n.includes('search') || n.includes('drown') || n.includes('flood')) return { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800', icon: LifeBuoy };
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: AlertTriangle };
    };

    const columns: Column<IncidentType>[] = [
        {
            key: 'id',
            header: 'ID',
            sortable: true,
            render: (v) => (
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    #{v}
                </span>
            ),
        },
        {
            key: 'incident_type_name',
            header: 'Emergency Type Name',
            sortable: true,
            render: (v, row) => {
                const { bg, icon: IconComponent } = getTypeColor(String(v || ''));
                return (
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg}`}>
                            <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {v}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'type_description',
            header: 'Description & Scope',
            render: (v) => (
                <span className="text-xs text-slate-600 dark:text-slate-400 max-w-md line-clamp-2 leading-relaxed">
                    {v || <span className="italic text-slate-400">No description provided</span>}
                </span>
            ),
        },
        {
            key: 'incidents_count',
            header: 'Total Incidents',
            sortable: true,
            render: (v) => {
                const count = Number(v) || 0;
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${count > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {count} recorded
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, row) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        title="Edit emergency type"
                        className="h-8 w-8 p-0"
                    >
                        <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete emergency type"
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Emergency Incident Types"
                subtitle="Manage official emergency categories configured for web dispatchers and resident mobile app."
                actions={
                    <Button variant="primary" onClick={openCreate} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Emergency Type
                    </Button>
                }
            />

            <Card>
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-72">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search emergency types..."
                        />
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Showing <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span> categories
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filtered}
                    emptyTitle="No emergency incident types found"
                    emptyDescription="Click 'Add Emergency Type' to create and configure a new emergency category."
                />

                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-white/10">
                        <Pagination
                            currentPage={pagination.currentPage}
                            lastPage={pagination.lastPage}
                            perPage={pagination.perPage}
                            total={pagination.total}
                            onPageChange={(page) => {
                                router.get('/admin/incident-types', { page, search }, { preserveState: true });
                            }}
                        />
                    </div>
                )}
            </Card>

            <IncidentTypeModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                onSubmit={handleSubmit}
                incidentType={editing}
                loading={submitting}
                errors={errors}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={`Delete "${deleteTarget?.incident_type_name}"?`}
                description={
                    deleteTarget && (deleteTarget.incidents_count || 0) > 0
                        ? `This emergency category has ${deleteTarget.incidents_count} recorded incident(s). It cannot be removed to maintain dispatch integrity.`
                        : `Are you sure you want to delete this emergency type? It will no longer appear in resident reporting or dispatcher logging.`
                }
                confirmLabel="Delete Type"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}
