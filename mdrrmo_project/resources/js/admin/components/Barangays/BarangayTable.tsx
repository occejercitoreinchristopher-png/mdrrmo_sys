import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import DataTable from '@/shared/components/DataTable';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import Drawer from '@/shared/components/Drawer';
import BarangayForm from './BarangayForm';
import ConfirmDialog from '@/shared/components/ConfirmDialog';

export default function BarangayTable({ barangays = [] }) {
    const [search, setSearch] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const filtered = barangays.filter((b) => {
        const q = search.toLowerCase();
        return !q || b.name?.toLowerCase().includes(q);
    });

    const openCreate = () => { setEditing(null); setDrawerOpen(true); };
    const openEdit = (b) => { setEditing(b); setDrawerOpen(true); };

    const handleSubmit = (form) => {
        setSubmitting(true);
        const url = editing ? `/admin/barangays/${editing.id}` : '/admin/barangays';
        const method = editing ? 'patch' : 'post';
        router[method](url, form, {
            onSuccess: () => { setDrawerOpen(false); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/barangays/${deleteTarget.id}`, {
            onSuccess: () => { setDeleteTarget(null); setDeleting(false); },
            onError: () => setDeleting(false),
        });
    };

    const columns = [
        { key: 'id', header: '#', render: (v) => <span className="font-mono text-xs text-slate-400">#{v}</span> },
        { key: 'name', header: 'Barangay Name', sortable: true, render: (v) => <span className="font-medium text-slate-900 dark:text-white">{v}</span> },
        { key: 'municipality', header: 'Municipality' },
        { key: 'province', header: 'Province' },
        {
            key: 'actions', header: '',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="w-3 h-3" /> Edit</Button>
                    <Button size="xs" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Barangay Management"
                subtitle="Manage barangays covered by MDRRMO."
                actions={<Button onClick={openCreate} variant="admin"><Plus className="w-4 h-4" />Add Barangay</Button>}
            />
            <Card padding={false}>
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                    <SearchInput placeholder="Search barangays..." onChange={setSearch} className="flex-1 max-w-sm" />
                </div>
                <div className="p-4">
                    <DataTable columns={columns} data={filtered} keyField="id" emptyTitle="No barangays found" emptyIcon={MapPin} />
                </div>
            </Card>

            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Barangay' : 'Add Barangay'}>
                <BarangayForm barangay={editing} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} loading={submitting} />
            </Drawer>
            <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Barangay" description={deleteTarget ? `Delete ${deleteTarget.name}?` : ''} confirmLabel="Delete" />
        </div>
    );
}
