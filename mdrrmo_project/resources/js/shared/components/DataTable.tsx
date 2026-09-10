import { useState, ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { clsx } from 'clsx';

export interface Column<T> {
    key: string;
    header: string | ReactNode;
    sortable?: boolean;
    render?: (value: any, row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data?: T[];
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: React.ElementType;
    keyField?: string;
    onRowClick?: (row: T) => void;
}

export default function DataTable<T extends Record<string, any>>({
    columns,
    data = [],
    loading = false,
    emptyTitle = 'No records found',
    emptyDescription = 'There are no records to display.',
    emptyIcon,
    keyField = 'id',
    onRowClick,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = [...data].sort((a, b) => {
        if (!sortKey) return 0;
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, {
            numeric: true,
        });
        return sortDir === 'asc' ? cmp : -cmp;
    });

    return (
        <div className="relative">
            {loading && <LoadingSpinner overlay />}

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={
                                        col.sortable
                                            ? () => handleSort(col.key)
                                            : undefined
                                    }
                                    className={clsx(
                                        'text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap',
                                        col.sortable &&
                                            'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors',
                                    )}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable &&
                                            sortKey === col.key &&
                                            (sortDir === 'asc' ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            ))}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <EmptyState
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        icon={emptyIcon}
                                    />
                                </td>
                            </tr>
                        ) : (
                            sorted.map((row, i) => (
                                <tr
                                    key={(row[keyField] as string | number) ?? i}
                                    onClick={
                                        onRowClick
                                            ? () => onRowClick(row)
                                            : undefined
                                    }
                                    className={clsx(
                                        'border-b border-slate-200 dark:border-white/5 transition-colors duration-150',
                                        'hover:bg-slate-50 dark:hover:bg-white/5',
                                        onRowClick && 'cursor-pointer',
                                        i % 2 === 1 && 'bg-slate-50/50 dark:bg-white/[0.02]',
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                                        >
                                            {col.render
                                                ? col.render(row[col.key], row)
                                                : (row[col.key] as ReactNode ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
