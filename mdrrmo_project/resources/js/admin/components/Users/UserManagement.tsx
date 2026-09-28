import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { UserPlus, CheckCircle2, AlertCircle, Users, Radio, Ambulance, Shield } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import UserTable from './UserTable';
import UserModal from './UserModal';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Button from '@/shared/components/Button';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import { clsx } from 'clsx';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    birthdate?: string | null;
    birthday?: string | null;
    age?: number | null;
    email: string;
    phone_number: string;
    role?: string;
    status?: string;
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
    subtitle = 'Manage registered system accounts, roles, and security credentials.',
    canCreate = true,
    submitUrlPrefix = '/admin/users',
    allowedRoles = ['dispatcher', 'responder'],
}: UserManagementProps) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [resetting, setResetting] = useState(false);

    const { errors, flash } = usePage().props as any;

    // Filter by search query & role tab
    const filtered = useMemo(() => {
        return users.filter((u) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                u.first_name?.toLowerCase().includes(q) ||
                u.last_name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone_number?.includes(q);

            const matchRole = roleFilter !== null
                ? (u.role === roleFilter && !u.deleted_at)
                : (activeTab === 'all' && !u.deleted_at) || 
                  (activeTab === 'archived' && !!u.deleted_at) || 
                  (u.role === activeTab && !u.deleted_at);

            return matchSearch && matchRole;
        });
    }, [users, search, activeTab, roleFilter]);

    // Role Counts for Tab Badges
    const counts = useMemo(() => {
        return {
            all: users.filter(u => !u.deleted_at).length,
            dispatcher: users.filter((u) => u.role === 'dispatcher' && !u.deleted_at).length,
            responder: users.filter((u) => u.role === 'responder' && !u.deleted_at).length,
            admin: users.filter((u) => u.role === 'admin' && !u.deleted_at).length,
            resident: users.filter((u) => u.role === 'resident' && !u.deleted_at).length,
            archived: users.filter(u => !!u.deleted_at).length,
        };
    }, [users]);

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
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
                toast.success('User archived successfully.');
            },
            onError: () => {
                setDeleting(false);
                toast.error('Failed to archive user.');
            },
        });
    };

    const handleRestore = () => {
        if (!restoreTarget) return;
        setRestoring(true);
        router.post(`${submitUrlPrefix}/${restoreTarget.id}/restore`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setRestoreTarget(null);
                setRestoring(false);
                toast.success('User restored successfully.');
            },
            onError: () => {
                setRestoring(false);
                toast.error('Failed to restore user.');
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
                toast.success("Password reset successfully. A temporary password has been emailed to the user.");
            },
            onError: () => {
                setResetting(false);
                toast.error('Failed to reset user password.');
            },
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={
                    canCreate && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Add New User</span>
                        </button>
                    )
                }
            />

            {/* Flash notifications */}
            {flash?.success && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{flash.error}</p>
                </div>
            )}

            {/* Top KPI Metrics Strip */}
            {!roleFilter && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Staff</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{counts.all}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Radio className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dispatchers</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{counts.dispatcher}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Ambulance className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Responders</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{counts.responder}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admins</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{counts.admin}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Card */}
            <Card padding={false} className="overflow-hidden">
                {/* Filter Tabs & Search Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Role Filter Tabs (Only shown when not locked to a specific role) */}
                    {!roleFilter ? (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start overflow-x-auto max-w-full">
                            {[
                                { id: 'all', label: 'All Roles', count: counts.all },
                                { id: 'dispatcher', label: 'Dispatchers', count: counts.dispatcher },
                                { id: 'responder', label: 'Responders', count: counts.responder },
                                { id: 'admin', label: 'Admins', count: counts.admin },
                                { id: 'archived', label: 'Archived', count: counts.archived },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer',
                                        activeTab === tab.id
                                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    <span className={clsx(
                                        'px-1.5 py-0.2 rounded-full text-[10px]',
                                        activeTab === tab.id
                                            ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold'
                                            : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-slate-400',
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Filtered View
                        </div>
                    )}

                    {/* Search Toolbar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <SearchInput
                            placeholder="Search by name, email, phone..."
                            value={search}
                            onChange={setSearch}
                            className="w-full md:w-72"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {filtered.length} found
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4 sm:p-5">
                    <UserTable
                        users={filtered}
                        roleFilter={roleFilter}
                        onEdit={openEdit}
                        onResetPassword={setResetTarget}
                        onDelete={setDeleteTarget}
                        onRestore={setRestoreTarget}
                        isArchivedTab={activeTab === 'archived'}
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
                title="Archive User"
                description={
                    deleteTarget
                        ? `Are you sure you want to archive ${deleteTarget.first_name} ${deleteTarget.last_name}? They will not be able to log in.`
                        : ''
                }
                confirmLabel="Archive"
            />

            <ConfirmDialog
                open={!!restoreTarget}
                onClose={() => setRestoreTarget(null)}
                onConfirm={handleRestore}
                loading={restoring}
                title="Restore User"
                description={
                    restoreTarget
                        ? `Are you sure you want to restore ${restoreTarget.first_name} ${restoreTarget.last_name}? They will regain access to the system.`
                        : ''
                }
                confirmLabel="Restore"
                variant="primary"
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
