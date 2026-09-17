import { useState, useEffect } from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';

import type { User } from './UserManagement';

const ALL_ROLES = ['admin', 'dispatcher', 'responder', 'resident'];
const STATUSES = ['active', 'inactive', 'suspended'];

const ROLE_FIELDS = {
    admin: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status'],
    dispatcher: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status'],
    responder: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'team', 'position', 'status'],
    resident: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status']
};

const POSITIONS = ['driver', 'emt'];

interface UserFormProps {
    user?: User | null;
    onSubmit?: (form: any) => void;
    onCancel?: () => void;
    loading?: boolean;
    errors?: any;
    allowedRoles?: string[];
}

export default function UserForm({ user = null, onSubmit, onCancel, loading = false, errors = {}, allowedRoles = ['dispatcher', 'responder'] }: UserFormProps) {
    const userRole = user?.role;
    const rolesToDisplay = userRole && !allowedRoles.includes(userRole)
        ? [...allowedRoles, userRole]
        : allowedRoles;

    const availableRoles = ALL_ROLES.filter(r => rolesToDisplay.includes(r));
    const initialRole = userRole || allowedRoles[0] || 'dispatcher';

    const getInitialForm = (targetUser?: User | null) => ({
        first_name: targetUser?.first_name ?? '',
        middle_name: targetUser?.middle_name ?? '',
        last_name: targetUser?.last_name ?? '',
        birthdate: targetUser?.birthdate ? String(targetUser.birthdate).substring(0, 10) : (targetUser?.birthday ? String(targetUser.birthday).substring(0, 10) : ''),
        age: targetUser?.age !== undefined && targetUser?.age !== null ? String(targetUser.age) : '',
        email: targetUser?.email ?? '',
        phone_number: targetUser?.phone_number ?? '',
        role: targetUser?.role ?? initialRole,
        position: targetUser?.responder_profile?.position ?? (initialRole === 'responder' ? 'driver' : ''),
        team: targetUser?.responder_profile?.team ?? '',
        status: targetUser?.status ?? 'active',
    });

    const [form, setForm] = useState(() => getInitialForm(user));
    const [ageError, setAgeError] = useState('');

    useEffect(() => {
        setForm(getInitialForm(user));
        setAgeError('');
    }, [user]);

    const set = (field: string) => (e: any) =>
        setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }));

    // Auto-calculate age when birthdate changes
    const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        let calculatedAge = form.age;
        if (val) {
            const birthDate = new Date(val);
            const today = new Date();
            let ageDiff = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                ageDiff--;
            }
            if (!isNaN(ageDiff) && ageDiff >= 0 && ageDiff <= 120) {
                calculatedAge = String(ageDiff);
                setAgeError('');
            }
        }
        setForm(f => ({ ...f, birthdate: val, age: calculatedAge }));
    };

    // Strictly enforce numbers only for Age (no letters or special characters)
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
        // Strip out any non-numeric characters
        const cleanVal = rawVal.replace(/[^0-9]/g, '');

        if (cleanVal !== '') {
            const num = parseInt(cleanVal, 10);
            if (num < 1 || num > 120) {
                setAgeError('Age must be between 1 and 120.');
            } else {
                setAgeError('');
            }
        } else {
            setAgeError('');
        }

        setForm(f => ({ ...f, age: cleanVal }));
    };

    const maxDate = new Date().toISOString().split('T')[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.age !== '') {
            const num = parseInt(form.age, 10);
            if (isNaN(num) || num < 1 || num > 120) {
                setAgeError('Please enter a valid age between 1 and 120.');
                return;
            }
        }
        const payload: Record<string, any> = { ...form };
        if (payload.role !== 'responder') {
            delete payload.position;
            delete payload.team;
        }
        // Format payload: send integer age or null
        if (payload.age !== '') {
            payload.age = parseInt(payload.age, 10);
        } else {
            payload.age = null;
        }
        if (!payload.birthdate) {
            payload.birthdate = null;
        }
        // When creating a new user, status is automatically active
        payload.status = user ? (form.status || 'active') : 'active';
        onSubmit?.(payload);
    };

    const handleRoleChange = (value: any) => {
        const newRole = value?.target ? value.target.value : value;
        setForm(f => ({
            ...f,
            role: newRole,
            // Reset role-specific fields
            position: newRole === 'responder' ? (f.position || 'driver') : '',
            team: newRole === 'responder' ? f.team : ''
        }));
    };

    const activeFields = ROLE_FIELDS[form.role] || [];
    const showField = (field: string) => activeFields.includes(field);

    const hasErrors = (errors && Object.keys(errors).length > 0) || Boolean(ageError);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {hasErrors && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Please fix the following errors:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                            {ageError && <li><span className="capitalize font-medium">Age:</span> {ageError}</li>}
                            {errors && Object.entries(errors).map(([field, err]) => (
                                <li key={field}>
                                    <span className="capitalize font-medium">{field.replace(/_/g, ' ')}:</span> {String(err)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Top-Level Role Selection */}
            <div className="grid grid-cols-1 mb-6">
                <Select
                    label="Role"
                    id="role"
                    value={form.role}
                    onChange={handleRoleChange}
                    options={availableRoles.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                    error={errors.role}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {showField('first_name') && (
                    <Input
                        label="First Name"
                        id="first_name"
                        value={form.first_name}
                        onChange={set('first_name')}
                        error={errors.first_name}
                        required
                        placeholder="Juan"
                    />
                )}
                {showField('middle_name') && (
                    <Input
                        label="Middle Name"
                        id="middle_name"
                        value={form.middle_name}
                        onChange={set('middle_name')}
                        error={errors.middle_name}
                        placeholder="(Optional)"
                    />
                )}
                {showField('last_name') && (
                    <Input
                        label="Last Name"
                        id="last_name"
                        value={form.last_name}
                        onChange={set('last_name')}
                        error={errors.last_name}
                        required
                        placeholder="Dela Cruz"
                    />
                )}
            </div>

            {/* Birthday and Age Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showField('birthdate') && (
                    <Input
                        label="Birthday"
                        id="birthdate"
                        type="date"
                        max={maxDate}
                        value={form.birthdate}
                        onChange={handleBirthdateChange}
                        error={errors.birthdate || errors.birthday}
                        placeholder="YYYY-MM-DD"
                    />
                )}
                {showField('age') && (
                    <Input
                        label="Age"
                        id="age"
                        type="text"
                        inputMode="numeric"
                        value={form.age}
                        onChange={handleAgeChange}
                        onKeyDown={(e) => {
                            // Block any non-numeric keys, except navigation and editing keys
                            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        error={ageError || errors.age}
                        placeholder="e.g. 28 (numbers only)"
                    />
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showField('email') && (
                    <Input
                        label="Email"
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        error={errors.email}
                        required
                        placeholder="juan@example.com"
                    />
                )}
                {showField('phone_number') && (
                    <Input
                        label="Phone Number"
                        id="phone_number"
                        value={form.phone_number}
                        onChange={set('phone_number')}
                        error={errors.phone_number}
                        required
                        placeholder="09XXXXXXXXX"
                    />
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showField('team') && (
                    <Input
                        label="Team"
                        id="team"
                        value={form.team}
                        onChange={set('team')}
                        error={errors.team}
                        required={form.role === 'responder'}
                        placeholder="e.g. Alpha"
                    />
                )}
                {showField('position') && (
                    <Select
                        label="Position"
                        id="position"
                        value={form.position}
                        onChange={set('position')}
                        options={POSITIONS.map((p) => ({ value: p, label: p === 'emt' ? 'EMT' : p.charAt(0).toUpperCase() + p.slice(1) }))}
                        error={errors.position}
                    />
                )}
            </div>

            {Boolean(user) && showField('status') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                        label="Status"
                        id="status"
                        value={form.status}
                        onChange={set('status')}
                        options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                        error={errors.status}
                    />
                </div>
            )}

            {!user && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm flex items-start gap-3">
                    <KeyRound className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                    <div className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Temporary Password Generation</p>
                        <p className="text-slate-600 dark:text-slate-400">
                            A secure temporary password will be automatically generated and sent to the user's email address upon creation. The user will be required to change their password on their first login.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} variant="admin" className="flex-1">
                    {user ? 'Update User' : 'Create User'}
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
