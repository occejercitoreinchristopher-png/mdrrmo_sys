import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { UserPlus, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
    birthdate?: string | null;
    birthday?: string | null;
    age?: number | null;
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
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [resetting, setResetting] = useState(false);

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
                const wasEditing = !!editingUser;
                setModalOpen(false);
                setEditingUser(null);
                setSubmitting(false);
                toast.success(wasEditing ? 'User updated successfully.' : 'User account created successfully.');
            },
            onError: (errs) => {
                setSubmitting(false);
                const firstMsg = errs && Object.values(errs)[0];
                toast.error(typeof firstMsg === 'string' ? firstMsg : 'Failed to save user. Please check the form.');
            },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`${submitUrlPrefix}/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
                toast.success('User deleted successfully.');
            },
            onError: () => {
                setDeleting(false);
                toast.error('Failed to delete user.');
            },
        });
    };

    const handleResetPassword = () => {
        if (!resetTarget) return;
        setResetting(true);
        router.post(`${submitUrlPrefix}/${resetTarget.id}/reset-password`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setResetTarget(null);
                setResetting(false);
                toast.success("Password reset successfully. A temporary password has been sent to the user's registered email address. The user must change their password after logging in.");
            },
            onError: () => {
                setResetting(false);
                toast.error('Failed to reset user password.');
            },
        });
    };

    return (
        <div>
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={
                    canCreate && (
                        <Button onClick={openCreate} variant="admin">
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

            {flash?.error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-3 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium text-sm">{flash.error}</p>
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
                        onResetPassword={setResetTarget}
                        onDelete={setDeleteTarget}
                    />

                    {pagination && (
                        <Pagination
                            {...pagination}
                            onPageChange={(page) =>
                                router.get(window.location.pathname, { page }, { preserveState: true, preserveScroll: true })
                            }
                        />
                    )}
                </div>
            </Card>

            <UserModal
                key={modalOpen ? (editingUser?.id ?? 'create') : 'closed'}
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

            <ConfirmDialog
                open={!!resetTarget}
                onClose={() => setResetTarget(null)}
                onConfirm={handleResetPassword}
                loading={resetting}
                title="Reset User Password"
                description={
                    resetTarget
                        ? `Are you sure you want to reset this user's password? A new temporary password will be generated and emailed to ${resetTarget.email}. The user will be required to change their password after logging in.`
                        : ''
                }
                confirmLabel="Reset Password"
                variant="primary"
            />
        </div>
    );
}
