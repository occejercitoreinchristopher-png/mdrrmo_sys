import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { UserCheck, AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';

interface IdentifyPatientModalProps {
    open: boolean;
    onClose: () => void;
    patient: {
        id: number;
        first_name?: string | null;
        middle_name?: string | null;
        last_name?: string | null;
        gender?: string | null;
        age?: number | string | null;
        birthdate?: string | null;
        address?: string | null;
        street?: string | null;
        contact_number?: string | null;
    } | null;
}

export default function IdentifyPatientModal({ open, onClose, patient }: IdentifyPatientModalProps) {
    if (!patient) return null;

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        age: patient.age && !String(patient.age).includes('-') ? String(patient.age) : '',
        birthdate: patient.birthdate || '',
        gender: patient.gender || 'male',
        address: patient.street || patient.address || '',
        contact_number: patient.contact_number || '',
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (field: string) => (e: any) => {
        const val = e?.target ? e.target.value : e;
        setForm((prev) => ({ ...prev, [field]: val }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!form.first_name.trim()) errs.first_name = 'First name is required.';
        if (!form.last_name.trim()) errs.last_name = 'Last name is required.';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);
        router.put(
            `/dispatcher/patients/${patient.id}/identify`,
            {
                first_name: form.first_name.trim(),
                middle_name: form.middle_name.trim() || null,
                last_name: form.last_name.trim(),
                age: form.age ? parseInt(form.age, 10) : null,
                birthdate: form.birthdate || null,
                gender: form.gender || null,
                street: form.address.trim() || null,
                contact_number: form.contact_number.trim() || null,
            },
            {
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: (backendErrors: any) => {
                    setLoading(false);
                    setErrors(backendErrors || {});
                },
            }
        );
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Complete Patient Identification"
            description={`Patient #${patient.id} is currently recorded as unidentified. Enter their verified legal details below.`}
            size="lg"
            footer={
                <div className="flex items-center justify-end gap-2.5 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <UserCheck className="w-4 h-4" />
                                <span>Verify & Save Identification</span>
                            </>
                        )}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* One-time Warning Banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="leading-relaxed">
                        <strong className="font-semibold">Important:</strong> Once you verify this patient, their legal identity is locked in the system. Further edits will be disabled for both responders and dispatchers to maintain medical record integrity.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                        label="First Name"
                        id="first_name"
                        value={form.first_name}
                        onChange={set('first_name')}
                        placeholder="e.g. Juan"
                        error={errors.first_name}
                        required
                    />
                    <Input
                        label="Middle Name"
                        id="middle_name"
                        value={form.middle_name}
                        onChange={set('middle_name')}
                        placeholder="Optional"
                        error={errors.middle_name}
                    />
                    <Input
                        label="Last Name"
                        id="last_name"
                        value={form.last_name}
                        onChange={set('last_name')}
                        placeholder="e.g. Dela Cruz"
                        error={errors.last_name}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                        label="Gender"
                        id="gender"
                        value={form.gender}
                        onChange={set('gender')}
                        options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                        ]}
                    />
                    <Input
                        label="Age"
                        id="age"
                        type="number"
                        value={form.age}
                        onChange={set('age')}
                        placeholder="Years old"
                        error={errors.age}
                    />
                    <Input
                        label="Birth Date"
                        id="birthdate"
                        type="date"
                        value={form.birthdate}
                        onChange={set('birthdate')}
                        error={errors.birthdate}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                        label="Complete Home Address"
                        id="address"
                        value={form.address}
                        onChange={set('address')}
                        placeholder="House / Street / Barangay / Town"
                        error={errors.street || errors.address}
                    />
                    <Input
                        label="Contact Number"
                        id="contact_number"
                        value={form.contact_number}
                        onChange={set('contact_number')}
                        placeholder="e.g. 09123456789"
                        error={errors.contact_number}
                    />
                </div>
            </form>
        </Modal>
    );
}
