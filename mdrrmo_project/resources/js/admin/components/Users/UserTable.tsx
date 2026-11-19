import { useState, useEffect } from 'react';
import {
    KeyRound,
    Pencil,
    Trash2,
    Shield,
    Radio,
    Ambulance,
    Users,
    Eye,
    RotateCcw,
    Copy,
    Check,
    Phone,
    Calendar,
    UserCheck,
    AlertCircle,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import type { User } from './UserManagement';
import { toPascalCase } from '@/shared/utils/utils';

interface UserTableProps {
    users?: User[];
    loading?: boolean;
    onEdit?: (user: User) => void;
    onResetPassword?: (user: User) => void;
    onDelete?: (user: User) => void;
    onRestore?: (user: User) => void;
    onForceDelete?: (user: User) => void;
    roleFilter?: string | null;
    isArchivedTab?: boolean;
}

const roleConfig: Record<string, { label: string; icon: any; style: string; badgeDot: string }> = {
    admin: {
        label: 'Admin',
        icon: Shield,
        style: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/20',
        badgeDot: 'bg-indigo-500',
    },
    dispatcher: {
        label: 'Dispatcher',
        icon: Radio,
        style: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/20',
        badgeDot: 'bg-rose-500',
    },
    responder: {
        label: 'Responder',
        icon: Ambulance,
        style: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/20',
        badgeDot: 'bg-sky-500',
    },
    resident: {
        label: 'Resident',
        icon: Users,
        style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20',
        badgeDot: 'bg-emerald-500',
    },
};

export default function UserTable({
    users = [],
    loading = false,
    onEdit,
    onResetPassword,
    onDelete,
    onRestore,
    roleFilter = null,
    isArchivedTab = false,
}: UserTableProps) {
    const [resetCooldowns, setResetCooldowns] = useState<Record<number, number>>({});
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setResetCooldowns((prev) => {
                let changed = false;
                const next = { ...prev };
                for (const id in next) {
                    if (next[id] > 0) {
                        next[id] -= 1;
                        changed = true;
                    }
                    if (next[id] <= 0) {
                        delete next[id];
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getDaysRemaining = (deletedAt?: string | null) => {
        if (!deletedAt) return 15;
        const deletedTime = new Date(deletedAt).getTime();
        const expiryTime = deletedTime + 15 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const diffMs = expiryTime - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const copyToClipboard = (text: string) => {
        if (!navigator?.clipboard) return;
        navigator.clipboard.writeText(text);
        setCopiedEmail(text);
        toast.success(`Copied: ${text}`);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

    if (filtered.length === 0) {
        return (
            <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No users matching criteria
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {isArchivedTab
                        ? 'There are currently no archived staff accounts.'
                        : 'Try adjusting your search keywords or switching between the role filter tabs.'}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4">Account Role</th>
                        <th className="py-3 px-4">Team & Position</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filtered.map((row) => {
                        const conf = roleConfig[row.role || ''] || {
                            label: row.role || 'User',
                            icon: Users,
                            style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300',
                            badgeDot: 'bg-slate-400',
                        };
                        const Icon = conf.icon;
                        const isArchived = !!row.deleted_at;
                        const isUserActive = row.status === 'active' && !isArchived;
                        const daysRemaining = row.deleted_at ? getDaysRemaining(row.deleted_at) : 15;

                        return (
                            <tr
                                key={row.id}
                                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                {/* Staff Member Details */}
                                <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ring-1 ring-slate-900/10 dark:ring-white/20 overflow-hidden">
                                                {row.profile_photo_url ? (
                                                    <img
                                                        src={row.profile_photo_url}
                                                        alt={`${row.first_name}'s profile`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    ((row.first_name?.[0] ?? '') + (row.last_name?.[0] ?? '')).toUpperCase()
                                                )}
                                            </div>
                                            {/* Status Dot */}
                                            <span
                                                className={clsx(
                                                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0c1220]',
                                                    isArchived
                                                        ? 'bg-slate-400'
                                                        : isUserActive
                                                        ? 'bg-emerald-500'
                                                        : 'bg-rose-500'
                                                )}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 capitalize">
                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                    {toPascalCase(`${row.first_name} ${row.last_name}`)}
                                                </span>
                                                {row.age ? (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono shrink-0">
                                                        {row.age} yrs
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                <span className="truncate">{row.email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(row.email)}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white transition-opacity ml-1"
                                                    title="Copy email address"
                                                >
                                                    {copiedEmail === row.email ? (
                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Contact Phone */}
                                <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{row.phone_number ?? '—'}</span>
                                    </div>
                                </td>

                                {/* Account Role */}
                                <td className="py-3.5 px-4">
                                    <span
                                        className={clsx(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm',
                                            conf.style
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{conf.label}</span>
                                    </span>
                                </td>

                                {/* Team & Position */}
                                <td className="py-3.5 px-4">
                                    {row.responder_profile ? (
                                        <div className="flex flex-col gap-1 items-start">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={clsx(
                                                        'text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider',
                                                        row.responder_profile.is_reliever
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                    )}
                                                >
                                                    {row.responder_profile.is_reliever
                                                        ? 'Reliever'
                                                        : `Team ${row.responder_profile.team || 'Alpha'}`}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                    {row.responder_profile.position === 'driver' ? 'Driver' : 'EMT'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {row.responder_profile.is_reliever
                                                    ? 'Standby Reliever Pool'
                                                    : 'Active Deployment Crew'}
                                            </span>
                                        </div>
                                    ) : row.role === 'dispatcher' ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                Radio & Call Intake
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Dispatch Center Unit
                                            </span>
                                        </div>
                                    ) : row.role === 'admin' ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                System Governance
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Executive Command HQ
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>

                                {/* Account Status */}
                                <td className="py-3.5 px-4">
                                    {isArchived ? (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                Archived
                                            </span>
                                            <span
                                                className={clsx(
                                                    'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border whitespace-nowrap',
                                                    daysRemaining <= 3
                                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium'
                                                )}
                                                title={`Archived on ${new Date(row.deleted_at!).toLocaleDateString()}. Will be permanently deleted after 15 days.`}
                                            >
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span>
                                                    {daysRemaining <= 0
                                                        ? 'Purging today'
                                                        : daysRemaining === 1
                                                        ? 'Purges in 1 day'
                                                        : `Purges in ${daysRemaining} days`}
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <span
                                            className={clsx(
                                                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize',
                                                isUserActive
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                            )}
                                        >
                                            <span
                                                className={clsx(
                                                    'w-1.5 h-1.5 rounded-full',
                                                    isUserActive ? 'bg-emerald-500' : 'bg-rose-500'
                                                )}
                                            />
                                            {row.status || 'Active'}
                                        </span>
                                    )}
                                </td>

                                {/* Registration Date */}
                                <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                                    {row.created_at
                                        ? new Date(row.created_at).toLocaleDateString('en-PH', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })
                                        : '—'}
                                </td>

                                {/* Manage Actions */}
                                <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {isArchived ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => onRestore?.(row)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer active:scale-95"
                                                    title="Restore account to active status"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>Restore</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onForceDelete?.(row)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                                                    title="Permanently delete account now and free email immediately"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Purge Now</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Edit Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit?.(row)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
                                                    title="Edit user details"
                                                >
                                                    <Pencil className="w-3 h-3 text-slate-500" />
                                                    <span>Edit</span>
                                                </button>

                                                {/* Reset Password Button */}
                                                <button
                                                    type="button"
                                                    disabled={resetCooldowns[row.id] > 0}
                                                    onClick={() => {
                                                        if (resetCooldowns[row.id] > 0) return;
                                                        onResetPassword?.(row);
                                                        setResetCooldowns((prev) => ({ ...prev, [row.id]: 30 }));
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                                                    title={
                                                        resetCooldowns[row.id] > 0
                                                            ? `Wait ${resetCooldowns[row.id]}s`
                                                            : 'Reset Password'
                                                    }
                                                >
                                                    <KeyRound className="w-3 h-3" />
                                                    <span>
                                                        {resetCooldowns[row.id] > 0
                                                            ? `${resetCooldowns[row.id]}s`
                                                            : 'Reset'}
                                                    </span>
                                                </button>

                                                {/* Delete / Archive Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete?.(row)}
                                                    className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer active:scale-95"
                                                    title="Archive user account"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
