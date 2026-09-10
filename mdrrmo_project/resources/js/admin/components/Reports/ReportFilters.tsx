import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
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

    return (
        <Card className="mb-4">
            <div className="flex flex-wrap items-end gap-4">
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
                    label="Status"
                    id="status"
                    value={filters.status}
                    onChange={set('status')}
                    options={STATUS_OPTIONS}
                    placeholder='All Status'
                    className="w-40"
                />
                <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
            </div>
        </Card>
    );
}
