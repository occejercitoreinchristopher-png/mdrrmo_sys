import { useState } from 'react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';

import type { User } from './UserManagement';

const ALL_ROLES = ['admin', 'dispatcher', 'responder', 'resident'];
const STATUSES = ['active', 'inactive', 'suspended'];

const defaultForm = {
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'responder',
    position: 'driver',
    team: '',
    status: 'active',
    password: '',
    password_confirmation: '',
};

const ROLE_FIELDS = {
    admin: ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'status', 'password'],
    dispatcher: ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'status', 'password'],
    responder: ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'team', 'position', 'status', 'password'],
    resident: ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'status', 'password']
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

    const [form, setForm] = useState(user ? {
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        phone_number: user.phone_number ?? '',
        role: user.role ?? allowedRoles[0] ?? 'responder',
        position: user.responder_profile?.position ?? 'driver',
        team: user.responder_profile?.team ?? '',
        status: user.status ?? 'active',
        password: '',
        password_confirmation: '',
    } : defaultForm);

    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target ? e.target.value : e }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(form);
    };

    const handleRoleChange = (value) => {
        const newRole = value.target ? value.target.value : value;
        setForm(f => ({
            ...f,
            role: newRole,
            // Reset role-specific fields
            position: newRole === 'responder' ? 'driver' : '',
            team: newRole === 'responder' ? '' : ''
        }));
    };

    const activeFields = ROLE_FIELDS[form.role] || [];
    const showField = (field) => activeFields.includes(field);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showField('status') && (
                    <Select
                        label="Status"
                        id="status"
                        value={form.status}
                        onChange={set('status')}
                        options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                        error={errors.status}
                    />
                )}
            </div>

            {!user && showField('password') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={set('password')}
                        error={errors.password}
                        required={!user}
                        placeholder="••••••••"
                    />
                    <Input
                        label="Confirm Password"
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={set('password_confirmation')}
                        placeholder="••••••••"
                    />
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} className="flex-1">
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
