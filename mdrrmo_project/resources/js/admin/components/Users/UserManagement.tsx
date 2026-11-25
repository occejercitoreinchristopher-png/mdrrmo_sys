import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Shield,
    Search,
    X,
    Filter,
    ArrowUpDown,
    RotateCcw,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import UserTable from './UserTable';
import UserModal from './UserModal';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
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
    title = 'System User Management',
    subtitle = 'Manage registered staff accounts, role designations, operational credentials, and security permissions.',
    canCreate = true,
    submitUrlPrefix = '/admin/users',
    allowedRoles = ['dispatcher', 'responder'],
}: UserManagementProps) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [forceDeleting, setForceDeleting] = useState(false);

    const { errors, flash } = usePage().props as any;

    // Filter by search query, role tab & status
    const filtered = useMemo(() => {
        let list = users.filter((u) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                u.first_name?.toLowerCase().includes(q) ||
                u.last_name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone_number?.includes(q);

            const matchRole =
                roleFilter !== null
                    ? u.role === roleFilter && !u.deleted_at
                    : (activeTab === 'all' && !u.deleted_at) ||
                      (activeTab === 'archived' && !!u.deleted_at) ||
                      (u.role === activeTab && !u.deleted_at);

            const matchStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'archived'
                    ? !!u.deleted_at
                    : (u.status || 'active') === statusFilter && !u.deleted_at;

            return matchSearch && matchRole && matchStatus;
        });

        // Sorting
        list.sort((a, b) => {
            if (sortOrder === 'name') {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            }
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return list;
    }, [users, search, activeTab, statusFilter, sortOrder, roleFilter]);

    // Role Counts for Tab Badges
    const counts = useMemo(() => {
        return {
            all: users.filter((u) => !u.deleted_at).length,
            dispatcher: users.filter((u) => u.role === 'dispatcher' && !u.deleted_at).length,
            responder: users.filter((u) => u.role === 'responder' && !u.deleted_at).length,
            admin: users.filter((u) => u.role === 'admin' && !u.deleted_at).length,
            resident: users.filter((u) => u.role === 'resident' && !u.deleted_at).length,
            archived: users.filter((u) => !!u.deleted_at).length,
        };
    }, [users]);

    const openCreate = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEdit = (user: User) => {
        if (user.role === 'resident') {
            toast.error('Resident accounts cannot be edited by administrators.');
            return;
        }
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = (form: any) => {
        setSubmitting(true);
        const url = editingUser ? `${submitUrlPrefix}/${editingUser.id}` : submitUrlPrefix;
        const method = editingUser ? 'patch' : 'post';

        router[method](url, form, {
            onSuccess: () => {
                const wasEditing = !!editingUser;
                setModalOpen(false);
                setEditingUser(null);
                setSubmitting(false);
                toast.success(
                    wasEditing ? 'User updated successfully.' : 'User account created successfully.'
                );
            },
            onError: (errs) => {
                setSubmitting(false);
                const firstMsg = errs && Object.values(errs)[0];
                toast.error(
                    typeof firstMsg === 'string' ? firstMsg : 'Failed to save user. Please check the form.'
                );
            },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.role === 'resident') {
            toast.error('Resident accounts cannot be deleted by administrators.');
            setDeleteTarget(null);
            return;
        }
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
        router.post(
            `${submitUrlPrefix}/${restoreTarget.id}/restore`,
            {},
            {
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
            }
        );
    };

    const handleResetPassword = () => {
        if (!resetTarget) return;
        setResetting(true);
        router.post(
            `${submitUrlPrefix}/${resetTarget.id}/reset-password`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResetTarget(null);
                    setResetting(false);
                    toast.success(
                        "Password reset successfully. A temporary password has been emailed to the user."
                    );
                },
                onError: () => {
                    setResetting(false);
                    toast.error('Failed to reset user password.');
                },
            }
        );
    };

    const handleForceDelete = () => {
        if (!forceDeleteTarget) return;
        setForceDeleting(true);
        router.delete(`/admin/users/${forceDeleteTarget.id}/force`, {
            preserveScroll: true,
            onSuccess: () => {
                setForceDeleteTarget(null);
                setForceDeleting(false);
                toast.success('Account permanently deleted. Email is now available for new registrations.');
            },
            onError: (err: any) => {
                setForceDeleting(false);
                toast.error(err?.message || 'Failed to permanently delete user.');
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Command-Center Header Banner */}
            <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 text-white border border-slate-800/80 shadow-xl relative overflow-hidden">
                {/* Decorative glows */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                <Shield className="w-3 h-3 text-blue-400" />
                                <span>Personnel Governance & Security</span>
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            {title}
                        </h1>
                    </div>

                    {canCreate && (
                        <div className="shrink-0">
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-95 border border-red-400/30"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Add New User</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

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

            {/* Main Content Card */}
            <div className="rounded-2xl bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                {/* Filter Tabs & Search Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Role Filter Tabs */}
                    {!roleFilter ? (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start overflow-x-auto max-w-full scrollbar-none">
                            {[
                                { id: 'all', label: 'All Roles', count: counts.all },
                                { id: 'dispatcher', label: 'Dispatchers', count: counts.dispatcher },
                                { id: 'responder', label: 'Responders', count: counts.responder },
                                { id: 'admin', label: 'Admins', count: counts.admin },
                                { id: 'archived', label: 'Archived', count: counts.archived },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer',
                                        activeTab === tab.id
                                            ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={clsx(
                                            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                                            activeTab === tab.id
                                                ? 'bg-white/20 text-white font-bold'
                                                : 'bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                        )}
                                    >
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

                    {/* Search & Secondary Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort Order Selector */}
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold"
                        >
                            <option value="newest" className="dark:bg-slate-900">Newest First</option>
                            <option value="oldest" className="dark:bg-slate-900">Oldest First</option>
                            <option value="name" className="dark:bg-slate-900">Name (A-Z)</option>
                        </select>

                        <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap pl-1">
                            {filtered.length} found
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="p-4 sm:p-5">
                    {/* 15-Day Policy Banner for Archived Tab */}
                    {activeTab === 'archived' && (
                        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3">
                            <Clock className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    15-Day Account Retention & Auto-Purge Policy
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Archived accounts are retained for <strong>15 days</strong> in case they need to be restored. After 15 days, they will be <strong>permanently deleted automatically</strong>. Once an account is purged, its Gmail address becomes immediately available for new registrations. You can also click <strong>Purge Now</strong> on any row to delete immediately.
                                </p>
                            </div>
                        </div>
                    )}

                    <UserTable
                        users={filtered}
                        roleFilter={roleFilter}
                        onEdit={openEdit}
                        onResetPassword={setResetTarget}
                        onDelete={setDeleteTarget}
                        onRestore={setRestoreTarget}
                        onForceDelete={setForceDeleteTarget}
                        isArchivedTab={activeTab === 'archived'}
                    />

                    {pagination && pagination.total > pagination.perPage && (
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                            <Pagination
                                {...pagination}
                                onPageChange={(page) =>
                                    router.get(
                                        window.location.pathname,
                                        { page },
                                        { preserveState: true, preserveScroll: true }
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Dialogs */}
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
                title="Archive User Account"
                description={
                    deleteTarget
                        ? `Are you sure you want to archive ${deleteTarget.first_name} ${deleteTarget.last_name}? They will be revoked from active duty access.`
                        : ''
                }
                confirmLabel="Archive"
            />

            <ConfirmDialog
                open={!!restoreTarget}
                onClose={() => setRestoreTarget(null)}
                onConfirm={handleRestore}
                loading={restoring}
                title="Restore User Account"
                description={
                    restoreTarget
                        ? `Are you sure you want to restore ${restoreTarget.first_name} ${restoreTarget.last_name}? They will regain access to their assigned operational role.`
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
                        ? `Are you sure you want to reset this user's password? A new temporary password will be generated and emailed to ${resetTarget.email}. The user will be required to change their password upon login.`
                        : ''
                }
                confirmLabel="Reset Password"
                variant="primary"
            />

            <ConfirmDialog
                open={!!forceDeleteTarget}
                onClose={() => setForceDeleteTarget(null)}
                onConfirm={handleForceDelete}
                loading={forceDeleting}
                title="Permanently Delete Account"
                description={
                    forceDeleteTarget
                        ? `Are you sure you want to PERMANENTLY delete ${forceDeleteTarget.first_name} ${forceDeleteTarget.last_name}? This will completely wipe their records from the database. Their email address (${forceDeleteTarget.email}) will immediately be freed up for new registrations. This action CANNOT be undone.`
                        : ''
                }
                confirmLabel="Delete Permanently"
                variant="danger"
            />
        </div>
    );
}
