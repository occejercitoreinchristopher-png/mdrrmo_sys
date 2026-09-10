import Input from '@/shared/components/Input';
import Textarea from '@/shared/components/Textarea';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function PatientCareForm({ record = null, onSubmit, onCancel, loading = false, errors = {} }) {
    const [form, setForm] = useState({
        treatment_type: record?.treatment_type ?? '',
        vital_signs: record?.vital_signs ?? '',
        medications: record?.medications ?? '',
        notes: record?.notes ?? '',
    });
    const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target ? e.target.value : e }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-4">
            <Input label="Treatment Type" id="treatment_type" value={form.treatment_type} onChange={set('treatment_type')} error={errors.treatment_type} />
            <Input label="Vital Signs" id="vital_signs" value={form.vital_signs} onChange={set('vital_signs')} placeholder="e.g. BP: 120/80, HR: 72" />
            <Input label="Medications" id="medications" value={form.medications} onChange={set('medications')} />
            <Textarea label="Notes" id="notes" value={form.notes} onChange={set('notes')} rows={4} />
            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} className="flex-1">Save Record</Button>
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
            </div>
        </form>
    );
}
