import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import { BarChart3 } from 'lucide-react';
import { ReportFiltersState } from './ReportFilters';

export interface Incident {
    id: number | string;
    incident_type_id?: number | string;
    incident_type?: { name: string };
    incident_status: string;
    reported_at: string;
    resolved_at?: string | null;
    [key: string]: any;
}

export interface ReportsTableProps {
    incidents?: Incident[];
    filters?: Partial<ReportFiltersState>;
}

export default function ReportsTable({ incidents = [], filters = {} }: ReportsTableProps) {
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = incidents.filter((inc) => {
        const matchStatus = !filters.status || inc.incident_status === filters.status;
        const matchType = !filters.type || String(inc.incident_type_id) === String(filters.type);
        const matchFrom = !filters.dateFrom || new Date(inc.reported_at) >= new Date(filters.dateFrom);
        const matchTo = !filters.dateTo || new Date(inc.reported_at) <= new Date(filters.dateTo);
        return matchStatus && matchType && matchFrom && matchTo;
    });

    useEffect(() => {
        setPage(1);
    }, [filters]);

    const total = filtered.length;
    const lastPage = Math.ceil(total / perPage) || 1;
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const columns: Column<Incident>[] = [
        { key: 'id', header: '#', render: (v: any) => <span className="font-mono text-xs">#{v}</span> },
        { key: 'incident_type', header: 'Type', render: (v: any) => v?.name ?? '—' },
        { key: 'incident_status', header: 'Status', sortable: true, render: (v: any) => <StatusBadge status={v} /> },
        { key: 'reported_at', header: 'Reported', sortable: true, render: (v: any) => v ? new Date(v).toLocaleDateString('en-PH') : '—' },
        { key: 'resolved_at', header: 'Resolved', render: (v: any) => v ? new Date(v).toLocaleDateString('en-PH') : '—' },
    ];

    return (
        <Card padding={false}>
            <div className="p-5 border-b border-white/10">
                <h3 className="font-semibold text-white text-sm">Incident Records</h3>
                <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records matching current filters</p>
            </div>
            <div className="p-4">
                <DataTable columns={columns} data={paginated} keyField="id" emptyTitle="No records match filters" emptyIcon={BarChart3} />
                {total > perPage && (
                    <Pagination
                        currentPage={page}
                        lastPage={lastPage}
                        total={total}
                        perPage={perPage}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </Card>
    );
}
