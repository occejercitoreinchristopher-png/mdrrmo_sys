import { useState } from 'react';
import { router } from '@inertiajs/react';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Card from '@/shared/components/Card';
import { Filter, RotateCcw, Search } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'responding', label: 'Responding' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

export default function ReportFilters({ initialFilters, lookups }) {
    const [filters, setFilters] = useState({
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
        barangay: initialFilters.barangay || '',
        incident_type_id: initialFilters.incident_type_id || '',
        status: initialFilters.status || '',
        responder_id: initialFilters.responder_id || '',
        ambulance_id: initialFilters.ambulance_id || '',
    });

    const handleChange = (key: string) => (val: string) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const applyFilters = () => {
        const query = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
        router.get('/admin/reports', query, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setFilters({ date_from: '', date_to: '', barangay: '', incident_type_id: '', status: '', responder_id: '', ambulance_id: '' });
        router.get('/admin/reports');
    };

    const barangayOptions = [{ value: '', label: 'All Barangays' }, ...lookups.barangays.map(b => ({ value: b.id, label: b.name }))];
    const typeOptions = [{ value: '', label: 'All Types' }, ...lookups.incident_types.map(t => ({ value: t.id.toString(), label: t.incident_type_name }))];
    const responderOptions = [{ value: '', label: 'All Responders' }, ...lookups.responders.map(r => ({ value: r.id.toString(), label: `${r.first_name} ${r.last_name}` }))];
    const ambulanceOptions = [{ value: '', label: 'All Ambulances' }, ...lookups.ambulances.map(a => ({ value: a.id.toString(), label: a.plate_number }))];

    return (
        <Card className="mb-6 p-4 sm:p-5 print:hidden">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Filter className="w-4 h-4" />
                    <span>Global Report Filters</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Input label="Date From" id="date_from" type="date" value={filters.date_from} onChange={(e) => handleChange('date_from')(e.target.value)} />
                    <Input label="Date To" id="date_to" type="date" value={filters.date_to} onChange={(e) => handleChange('date_to')(e.target.value)} />
                    <Select label="Barangay" id="barangay" value={filters.barangay} onChange={handleChange('barangay')} options={barangayOptions} />
                    <Select label="Incident Type" id="incident_type_id" value={filters.incident_type_id} onChange={handleChange('incident_type_id')} options={typeOptions} />
                    <Select label="Status" id="status" value={filters.status} onChange={handleChange('status')} options={STATUS_OPTIONS} />
                    <Select label="Responder" id="responder_id" value={filters.responder_id} onChange={handleChange('responder_id')} options={responderOptions} />
                    <Select label="Ambulance" id="ambulance_id" value={filters.ambulance_id} onChange={handleChange('ambulance_id')} options={ambulanceOptions} />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                    <button onClick={resetFilters} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                    <button onClick={applyFilters} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors">
                        <Search className="w-4 h-4" />
                        <span>Apply Filters</span>
                    </button>
                </div>
            </div>
        </Card>
    );
}
