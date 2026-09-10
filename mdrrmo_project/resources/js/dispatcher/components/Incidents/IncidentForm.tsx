import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Textarea from '@/shared/components/Textarea';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function IncidentForm({ incident = null, onSubmit, onCancel, loading = false, errors = {} }) {
    const [form, setForm] = useState({
        description: incident?.description ?? '',
        incident_status: incident?.incident_status ?? 'pending',
        verification_remarks: incident?.verification_remarks ?? '',
    });

    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target ? e.target.value : e }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-4">
            <Textarea
                label="Description"
                id="description"
                value={form.description}
                onChange={set('description')}
                error={errors.description}
                rows={4}
            />
            <Select
                label="Status"
                id="incident_status"
                value={form.incident_status}
                onChange={set('incident_status')}
                options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'responding', label: 'Responding' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'rejected', label: 'Rejected' },
                ]}
            />
            <Textarea
                label="Verification Remarks"
                id="verification_remarks"
                value={form.verification_remarks}
                onChange={set('verification_remarks')}
                rows={3}
            />
            <div className="flex gap-3">
                <Button type="submit" loading={loading} className="flex-1">
                    Update Incident
                </Button>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
