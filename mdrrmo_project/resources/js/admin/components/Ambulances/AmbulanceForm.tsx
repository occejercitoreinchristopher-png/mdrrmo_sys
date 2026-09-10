import { useState } from 'react';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';

export default function AmbulanceForm({ ambulance = null, onSubmit, onCancel, loading = false, errors = {} }) {
    const [form, setForm] = useState({
        ambulance_code: ambulance?.ambulance_code ?? '',
        plate_number: ambulance?.plate_number ?? '',
        vehicle_name: ambulance?.vehicle_name ?? '',
        vehicle_type: ambulance?.vehicle_type ?? '',
        status: ambulance?.status ?? 'available',
    });

    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target ? e.target.value : e }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-4">
            <Input label="Ambulance Code" id="ambulance_code" value={form.ambulance_code} onChange={set('ambulance_code')} error={errors.ambulance_code} required placeholder="e.g. AMB-01" />
            <Input label="Plate Number" id="plate_number" value={form.plate_number} onChange={set('plate_number')} error={errors.plate_number} required placeholder="e.g. SLR-123" />
            <Input label="Vehicle Name" id="vehicle_name" value={form.vehicle_name} onChange={set('vehicle_name')} error={errors.vehicle_name} required placeholder="e.g. Toyota Hi-Ace" />
            <Input label="Vehicle Type" id="vehicle_type" value={form.vehicle_type} onChange={set('vehicle_type')} error={errors.vehicle_type} required placeholder="e.g. Type I" />
            <Select label="Status" id="status" value={form.status} onChange={set('status')} error={errors.status}
                options={[
                    { value: 'available', label: 'Available' },
                    { value: 'dispatched', label: 'Dispatched' },
                    { value: 'maintenance', label: 'Maintenance' },
                ]}
            />
            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} className="flex-1">
                    {ambulance ? 'Update Ambulance' : 'Add Ambulance'}
                </Button>
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
            </div>
        </form>
    );
}
