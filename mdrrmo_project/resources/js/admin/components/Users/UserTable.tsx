import { Pencil, Trash2, User as UserIcon } from 'lucide-react';
import Button from '@/shared/components/Button';
import DataTable, { Column } from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import type { User } from './UserManagement';

interface UserTableProps {
    users?: User[];
    loading?: boolean;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
    roleFilter?: string | null;
}

export default function UserTable({ users = [], loading = false, onEdit, onDelete, roleFilter = null }: UserTableProps) {
    const filtered = roleFilter
        ? users.filter((u) => u.role === roleFilter)
        : users;

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'User',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold flex-shrink-0">
                        {(row.first_name?.[0] ?? '') + (row.last_name?.[0] ?? '')}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                            {row.first_name} {row.last_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'phone_number',
            header: 'Phone',
            sortable: false,
            render: (v) => <span className="font-mono text-xs">{v ?? '—'}</span>,
        },
        {
            key: 'role',
            header: 'Role',
            sortable: true,
            render: (v) => <StatusBadge status={v} />,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (v) => <StatusBadge status={v} />,
        },
        {
            key: 'created_at',
            header: 'Joined',
            sortable: true,
            render: (v) =>
                v
                    ? new Date(v).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                      })
                    : '—',
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
 e.stopPropagation(); onEdit?.(row); 
}}
                    >
                        <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => {
 e.stopPropagation(); onDelete?.(row); 
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
            emptyDescription="Try adjusting your search or filters."
            emptyIcon={UserIcon}
        />
    );
}
