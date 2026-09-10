import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function BarangayForm({ barangay = null, onSubmit, onCancel, loading = false, errors = {} }) {
    const [form, setForm] = useState({
        name: barangay?.name ?? '',
        municipality: barangay?.municipality ?? '',
        province: barangay?.province ?? '',
    });
    const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-4">
            <Input label="Barangay Name" id="name" value={form.name} onChange={set('name')} error={errors.name} required placeholder="e.g. Barangay 1" />
            <Input label="Municipality" id="municipality" value={form.municipality} onChange={set('municipality')} placeholder="e.g. Opol" />
            <Input label="Province" id="province" value={form.province} onChange={set('province')} placeholder="e.g. Misamis Oriental" />
            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} variant="admin" className="flex-1">{barangay ? 'Update' : 'Add Barangay'}</Button>
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
            </div>
        </form>
    );
}
