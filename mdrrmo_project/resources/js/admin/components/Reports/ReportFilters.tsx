import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Card from '@/shared/components/Card';
import { Filter, RotateCcw } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'All Incident Statuses' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'verified', label: 'Verified Incidents' },
    { value: 'resolved', label: 'Resolved Cases' },
    { value: 'rejected', label: 'Rejected / Cancelled' },
];

export interface ReportFiltersState {
    dateFrom: string;
    dateTo: string;
    status: string;
    type: string;
}

export interface ReportFiltersProps {
    filters: ReportFiltersState;
    onChange: (filters: ReportFiltersState) => void;
}

export default function ReportFilters({ filters, onChange }: ReportFiltersProps) {
    const set = (field: keyof ReportFiltersState) => (value: string) => onChange({ ...filters, [field]: value });

    const reset = () => onChange({ dateFrom: '', dateTo: '', status: '', type: '' });

    const hasActiveFilters = Boolean(filters.dateFrom || filters.dateTo || filters.status || filters.type);

    return (
        <Card className="mb-6 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 self-center pr-2">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter Period</span>
                    </div>

                    <Input
                        label="Date From"
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => set('dateFrom')(e.target.value)}
                        className="w-40"
                    />
                    <Input
                        label="Date To"
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => set('dateTo')(e.target.value)}
                        className="w-40"
                    />
                    <Select
                        label="Incident Status"
                        id="status"
                        value={filters.status}
                        onChange={set('status')}
                        options={STATUS_OPTIONS}
                        placeholder="All Statuses"
                        className="w-48"
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer self-end"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                    </button>
                )}
            </div>
        </Card>
    );
}
