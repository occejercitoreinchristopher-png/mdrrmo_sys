import { useState, useEffect } from 'react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Textarea from '@/shared/components/Textarea';
import { AlertTriangle, Plus, Pencil, LifeBuoy } from 'lucide-react';

export interface IncidentType {
    id?: number;
    incident_type_name: string;
    type_description?: string | null;
    incidents_count?: number;
}

interface IncidentTypeModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { incident_type_name: string; type_description: string }) => void;
    incidentType?: IncidentType | null;
    loading?: boolean;
    errors?: Record<string, string>;
}

export default function IncidentTypeModal({
    open,
    onClose,
    onSubmit,
    incidentType = null,
    loading = false,
    errors = {},
}: IncidentTypeModalProps) {
    const isEdit = Boolean(incidentType?.id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (open) {
            setName(incidentType?.incident_type_name ?? '');
            setDescription(incidentType?.type_description ?? '');
        }
    }, [open, incidentType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            incident_type_name: name.trim(),
            type_description: description.trim(),
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Emergency Incident Type' : 'Add New Emergency Incident Type'}
            description="Configure official emergency category available for dispatchers and mobile residents."
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0 mt-0.5">
                        <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-900 dark:text-white">Emergency Category Sync:</span> Once added, this emergency category will automatically be available in both the Dispatcher call logger and Resident mobile emergency report form.
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Emergency Type Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Search and Rescue, Landslide, Flash Flood"
                        required
                        autoFocus
                    />
                    {errors.incident_type_name && (
                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.incident_type_name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Description / Scope of Incidents
                    </label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what situations and distress calls fall under this category (e.g. Drowning, collapsed structure, lost hikers, trapped residents)..."
                        rows={3}
                    />
                    {errors.type_description && (
                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.type_description}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        {isEdit ? 'Update Emergency Type' : 'Save Emergency Type'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

