import { KeyRound, Pencil, Trash2, User as UserIcon, Shield, Radio, Ambulance, Users } from 'lucide-react';
import Button from '@/shared/components/Button';
import DataTable, { Column } from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import type { User } from './UserManagement';
import { clsx } from 'clsx';

import { toPascalCase } from '@/shared/utils/utils';

interface UserTableProps {
    users?: User[];
    loading?: boolean;
    onEdit?: (user: User) => void;
    onResetPassword?: (user: User) => void;
    onDelete?: (user: User) => void;
    roleFilter?: string | null;
}

const roleConfig: Record<string, { label: string; icon: any; style: string }> = {
    admin: { label: 'Admin', icon: Shield, style: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/20' },
    dispatcher: { label: 'Dispatcher', icon: Radio, style: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/20' },
    responder: { label: 'Responder', icon: Ambulance, style: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/20' },
    resident: { label: 'Resident', icon: Users, style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20' },
};

export default function UserTable({ users = [], loading = false, onEdit, onResetPassword, onDelete, roleFilter = null }: UserTableProps) {
    const filtered = roleFilter
        ? users.filter((u) => u.role === roleFilter)
        : users;

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'User Details',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ring-1 ring-slate-900/10 dark:ring-white/20">
                        {((row.first_name?.[0] ?? '') + (row.last_name?.[0] ?? '')).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 capitalize">
                            <span>{toPascalCase(`${row.first_name} ${row.last_name}`)}</span>
                            {row.age ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-normal">
                                    {row.age} yrs
                                </span>
                            ) : null}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'phone_number',
            header: 'Contact Phone',
            sortable: false,
            render: (v) => <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{v ?? '—'}</span>,
        },
        {
            key: 'role',
            header: 'Account Role',
            sortable: true,
            render: (v, row) => {
                const conf = roleConfig[v] || { label: v, icon: UserIcon, style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300' };
                const Icon = conf.icon;
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm', conf.style)}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{conf.label}</span>
                        </span>
                        {row.responder_profile && (
                            <span className={clsx(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                row.responder_profile.is_reliever
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            )}>
                                {row.responder_profile.is_reliever
                                    ? `Reliever • ${row.responder_profile.position === 'driver' ? 'Driver' : 'EMT'}`
                                    : `Team ${row.responder_profile.team || 'Alpha'} • ${row.responder_profile.position === 'driver' ? 'Driver' : 'EMT'}`
                                }
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: 'Account Status',
            sortable: true,
            render: (v) => {
                const isAct = v === 'active';
                return (
                    <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm capitalize',
                        isAct
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/20'
                    )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', isAct ? 'bg-emerald-500' : 'bg-rose-500')} />
                        {v || 'Active'}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            header: 'Registration',
            sortable: true,
            render: (v) =>
                v ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(v).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                ) : (
                    '—'
                ),
        },
        {
            key: 'actions',
            header: 'Manage',
            render: (_, row) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(row);
                        }}
                        className="hover:bg-slate-200 dark:hover:bg-white/15"
                    >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                    </Button>
                    <Button
                        size="xs"
                        variant="secondary"
                        className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20"
                        title="Reset Password"
                        onClick={(e) => {
                            e.stopPropagation();
                            onResetPassword?.(row);
                        }}
                    >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset</span>
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(row);
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            keyField="id"
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search query or role filter tab."
            emptyIcon={UserIcon}
        />
    );
}
