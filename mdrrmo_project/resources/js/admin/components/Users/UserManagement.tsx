import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { UserPlus, Filter, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import UserTable from './UserTable';
import UserModal from './UserModal';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Button from '@/shared/components/Button';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role?: string;
    [key: string]: any;
}

interface UserManagementProps {
    users?: User[];
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        perPage: number;
    };
    roleFilter?: string | null;
    title?: string;
    subtitle?: string;
    canCreate?: boolean;
    submitUrlPrefix?: string;
    allowedRoles?: string[];
}

export default function UserManagement({
    users = [],
    pagination,
    roleFilter = null,
    title = 'User Management',
    subtitle = 'Manage all registered system users.',
    canCreate = true,
    submitUrlPrefix = '/admin/users',
    allowedRoles = ['dispatcher', 'responder'],
}: UserManagementProps) {
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { errors, flash } = usePage().props as any;

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.first_name?.toLowerCase().includes(q) ||
            u.last_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone_number?.includes(q)
        );
    });

    const openCreate = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = (form: any) => {
        setSubmitting(true);
        const url = editingUser
            ? `${submitUrlPrefix}/${editingUser.id}`
            : submitUrlPrefix;
        const method = editingUser ? 'patch' : 'post';

        router[method](url, form, {
            onSuccess: () => {
                setModalOpen(false);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`${submitUrlPrefix}/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    return (
        <div>
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={
                    canCreate && (
                        <Button onClick={openCreate}>
                            <UserPlus className="w-4 h-4" />
                            Add User
                        </Button>
                    )
                }
            />

            {flash?.success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-medium text-sm">{flash.success}</p>
                </div>
            )}

            <Card padding={false}>
                {/* Toolbar */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
                    <SearchInput
                        placeholder="Search users..."
                        value={search}
                        onChange={setSearch}
                        className="flex-1 max-w-sm"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="p-4">
                    <UserTable
                        users={filtered}
                        roleFilter={roleFilter}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                    />

                    {pagination && (
                        <Pagination
                            {...pagination}
                            onPageChange={(page) =>
                                router.get(window.location.pathname, { page })
                            }
                        />
                    )}
                </div>
            </Card>

            <UserModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                user={editingUser}
                onSubmit={handleSubmit}
                loading={submitting}
                errors={errors}
                allowedRoles={allowedRoles}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete User"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete ${deleteTarget.first_name} ${deleteTarget.last_name}? This action is permanent.`
                        : ''
                }
                confirmLabel="Delete"
            />
        </div>
    );
}
