import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function PatientForm({ patient = null, onSubmit, onCancel, loading = false, errors = {} }) {
    const [form, setForm] = useState({
        first_name: patient?.first_name ?? '',
        last_name: patient?.last_name ?? '',
        age: patient?.age ?? '',
        gender: patient?.gender ?? '',
        contact_number: patient?.contact_number ?? '',
        address: patient?.address ?? '',
    });
    const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target ? e.target.value : e }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" id="first_name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} required />
                <Input label="Last Name" id="last_name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Age" id="age" type="number" value={form.age} onChange={set('age')} />
                <Select label="Gender" id="gender" value={form.gender} onChange={set('gender')}
                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                />
            </div>
            <Input label="Contact Number" id="contact_number" value={form.contact_number} onChange={set('contact_number')} />
            <Input label="Address" id="address" value={form.address} onChange={set('address')} />
            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} className="flex-1">{patient ? 'Update' : 'Add Patient'}</Button>
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
            </div>
        </form>
    );
}
