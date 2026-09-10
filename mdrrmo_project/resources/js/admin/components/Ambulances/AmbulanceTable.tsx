import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Ambulance as AmbulanceIcon } from 'lucide-react';
import DataTable, { type Column } from '@/shared/components/DataTable';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import Drawer from '@/shared/components/Drawer';
import AmbulanceForm, { type Ambulance } from './AmbulanceForm';
import ConfirmDialog from '@/shared/components/ConfirmDialog';

interface AmbulanceTableProps {
    ambulances?: Ambulance[];
}

export default function AmbulanceTable({ ambulances = [] }: AmbulanceTableProps) {
    const [search, setSearch] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Ambulance | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Ambulance | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const filtered = ambulances.filter((a) => {
        const q = search.toLowerCase();
        return !q || a.plate_number?.toLowerCase().includes(q) || a.vehicle_name?.toLowerCase().includes(q) || a.ambulance_code?.toLowerCase().includes(q);
    });

    const openCreate = () => { setEditing(null); setDrawerOpen(true); };
    const openEdit = (a: Ambulance) => { setEditing(a); setDrawerOpen(true); };

    const handleSubmit = (form) => {
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
        { key: 'ambulance_code', header: 'Code', sortable: true, render: (v) => <span className="font-mono font-bold text-slate-900 dark:text-white">{v}</span> },
        { key: 'plate_number', header: 'Plate Number', sortable: true, render: (v) => <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{v}</span> },
        { key: 'vehicle_name', header: 'Vehicle Name', sortable: true },
        { key: 'vehicle_type', header: 'Type' },
        { key: 'status', header: 'Status', sortable: true, render: (v) => <AmbulanceStatusBadge status={v} /> },
        {
            key: 'actions', header: '',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                        <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button size="xs" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Ambulance Management"
                subtitle="Manage the ambulance fleet and their availability."
                actions={<Button onClick={openCreate} variant="admin"><Plus className="w-4 h-4" />Add Ambulance</Button>}
            />
            <Card padding={false}>
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                    <SearchInput placeholder="Search ambulances..." onChange={setSearch} className="flex-1 max-w-sm" />
                </div>
                <div className="p-4">
                    <DataTable columns={columns} data={filtered} keyField="id" emptyTitle="No ambulances found" emptyIcon={AmbulanceIcon} />
                </div>
            </Card>

            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Ambulance' : 'Add Ambulance'}>
                <AmbulanceForm ambulance={editing} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} loading={submitting} />
            </Drawer>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete Ambulance"
                description={deleteTarget ? `Delete ambulance ${deleteTarget.plate_number}?` : ''}
                confirmLabel="Delete"
            />
        </div>
    );
}
