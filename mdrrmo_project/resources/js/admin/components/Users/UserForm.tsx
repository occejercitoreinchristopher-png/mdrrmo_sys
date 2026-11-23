import { useState, useEffect } from 'react';
import {
    AlertCircle,
    KeyRound,
    Shield,
    UserCheck,
    User as UserIcon,
    Radio,
    Ambulance,
    Phone,
    Mail,
    Calendar,
    Check,
    Save,
    X
} from 'lucide-react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import { clsx } from 'clsx';
import type { User } from './UserManagement';

const ALL_ROLES = ['admin', 'dispatcher', 'responder', 'resident'];
const STATUSES = [
    { value: 'active', label: 'Active Account' },
    { value: 'inactive', label: 'Inactive / On Leave' },
    { value: 'suspended', label: 'Suspended Access' },
];

const ROLE_FIELDS = {
    admin: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status'],
    dispatcher: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status'],
    responder: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'team', 'position', 'status'],
    resident: ['first_name', 'middle_name', 'last_name', 'birthdate', 'age', 'email', 'phone_number', 'status'],
};

const POSITIONS = [
    { value: 'driver', label: 'Emergency Driver' },
    { value: 'emt', label: 'Emergency Medical Technician (EMT)' },
];

const DEFAULT_TEAMS = [
    { value: 'Alpha', label: 'Team Alpha' },
    { value: 'Bravo', label: 'Team Bravo' },
    { value: 'Charlie', label: 'Team Charlie' },
    { value: 'Delta', label: 'Team Delta' },
    { value: 'Echo', label: 'Team Echo' },
    { value: 'Foxtrot', label: 'Team Foxtrot' },
];

interface UserFormProps {
    user?: User | null;
    onSubmit?: (form: any) => void;
    onCancel?: () => void;
    loading?: boolean;
    errors?: any;
    allowedRoles?: string[];
}

export default function UserForm({
    user = null,
    onSubmit,
    onCancel,
    loading = false,
    errors = {},
    allowedRoles = ['dispatcher', 'responder'],
}: UserFormProps) {
    const userRole = user?.role;
    const rolesToDisplay =
        userRole && !allowedRoles.includes(userRole) ? [...allowedRoles, userRole] : allowedRoles;

    const availableRoles = ALL_ROLES.filter((r) => rolesToDisplay.includes(r));
    const initialRole = userRole || allowedRoles[0] || 'dispatcher';

    const normalizePhone = (phone?: string | null) => {
        if (!phone) return '';
        let clean = String(phone).replace(/\D/g, '');
        if (clean.startsWith('639')) {
            clean = '09' + clean.slice(3);
        } else if (clean.startsWith('9')) {
            clean = '09' + clean.slice(1);
        }
        return clean.slice(0, 11);
    };

    const getInitialForm = (targetUser?: User | null) => ({
        first_name: targetUser?.first_name ?? '',
        middle_name: targetUser?.middle_name ?? '',
        last_name: targetUser?.last_name ?? '',
        birthdate: targetUser?.birthdate
            ? String(targetUser.birthdate).substring(0, 10)
            : targetUser?.birthday
            ? String(targetUser.birthday).substring(0, 10)
            : '',
        age: targetUser?.age !== undefined && targetUser?.age !== null ? String(targetUser.age) : '',
        email: targetUser?.email ?? '',
        phone_number: normalizePhone(targetUser?.phone_number),
        role: targetUser?.role ?? initialRole,
        position: targetUser?.responder_profile?.position ?? (initialRole === 'responder' ? 'driver' : ''),
        team: targetUser?.responder_profile?.team ?? '',
        is_reliever: Boolean(targetUser?.responder_profile?.is_reliever),
        status: targetUser?.status ?? 'active',
    });

    const [form, setForm] = useState(() => getInitialForm(user));
    const [ageError, setAgeError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isCustomTeam, setIsCustomTeam] = useState(() => {
        const currentTeam = user?.responder_profile?.team;
        return Boolean(currentTeam && !DEFAULT_TEAMS.some((t) => t.value.toLowerCase() === String(currentTeam).toLowerCase()));
    });

    useEffect(() => {
        setForm(getInitialForm(user));
        setAgeError('');
        setPhoneError('');
        const currentTeam = user?.responder_profile?.team;
        setIsCustomTeam(Boolean(currentTeam && !DEFAULT_TEAMS.some((t) => t.value.toLowerCase() === String(currentTeam).toLowerCase())));
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
        setForm((f) => ({ ...f, birthdate: val, age: calculatedAge }));
    };

    // Strictly enforce numbers only for Age (1-120)
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
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

        setForm((f) => ({ ...f, age: cleanVal }));
    };

    // Strictly enforce Philippine mobile numbers (starts with 09, 11 digits)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
        let cleanVal = rawVal.replace(/[^0-9]/g, '');

        if (cleanVal.startsWith('639')) {
            cleanVal = '09' + cleanVal.slice(3);
        } else if (cleanVal.startsWith('9')) {
            cleanVal = '09' + cleanVal.slice(1);
        }

        if (cleanVal.length > 11) {
            cleanVal = cleanVal.slice(0, 11);
        }

        if (cleanVal !== '') {
            if (!cleanVal.startsWith('09')) {
                setPhoneError('Philippine mobile numbers must start with 09 (e.g. 09123456789).');
            } else if (cleanVal.length < 11) {
                setPhoneError(`Phone number must be exactly 11 digits (${cleanVal.length}/11).`);
            } else {
                setPhoneError('');
            }
        } else {
            setPhoneError('');
        }

        setForm((f) => ({ ...f, phone_number: cleanVal }));
    };

    const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) {
            return;
        }
        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePhoneBlur = () => {
        if (!form.phone_number) return;
        if (!/^09\d{9}$/.test(form.phone_number)) {
            setPhoneError(
                'Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09123456789).'
            );
        } else {
            setPhoneError('');
        }
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
        if (showField('phone_number')) {
            if (!form.phone_number) {
                setPhoneError('Phone number is required.');
                return;
            }
            if (!/^09\d{9}$/.test(form.phone_number)) {
                setPhoneError(
                    'Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09123456789).'
                );
                return;
            }
        }

        const payload: Record<string, any> = { ...form };
        if (payload.role !== 'responder') {
            delete payload.position;
            delete payload.team;
            delete payload.is_reliever;
        } else {
            payload.is_reliever = Boolean(form.is_reliever);
            if (payload.is_reliever) {
                payload.team = null;
            }
        }

        if (payload.age !== '') {
            payload.age = parseInt(payload.age, 10);
        } else {
            payload.age = null;
        }

        if (!payload.birthdate) {
            payload.birthdate = null;
        }

        payload.status = user ? form.status || 'active' : 'active';
        onSubmit?.(payload);
    };

    const handleRoleChange = (newRole: string) => {
        setForm((f) => ({
            ...f,
            role: newRole,
            position: newRole === 'responder' ? f.position || 'driver' : '',
            team: newRole === 'responder' ? f.team : '',
        }));
    };

    const activeFields = ROLE_FIELDS[form.role as keyof typeof ROLE_FIELDS] || [];
    const showField = (field: string) => activeFields.includes(field);

    const hasErrors =
        (errors && Object.keys(errors).length > 0) || Boolean(ageError) || Boolean(phoneError);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Banner */}
            {hasErrors && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Please review the form errors:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {ageError && (
                                <li>
                                    <span className="font-semibold">Age:</span> {ageError}
                                </li>
                            )}
                            {phoneError && (
                                <li>
                                    <span className="font-semibold">Phone:</span> {phoneError}
                                </li>
                            )}
                            {errors &&
                                Object.entries(errors).map(([field, err]) => (
                                    <li key={field}>
                                        <span className="font-semibold capitalize">
                                            {field.replace(/_/g, ' ')}:
                                        </span>{' '}
                                        {String(err)}
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* SECTION 1: ROLE DESIGNATION */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                    <Shield className="w-4 h-4 text-red-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Operational Role Designation
                    </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableRoles.map((r) => {
                        const isSelected = form.role === r;
                        const roleMeta = {
                            dispatcher: { label: 'Dispatcher', icon: Radio, desc: 'Communications' },
                            responder: { label: 'Responder', icon: Ambulance, desc: 'Field Team / EMT' },
                            admin: { label: 'Admin', icon: Shield, desc: 'Full System Access' },
                            resident: { label: 'Resident', icon: UserIcon, desc: 'Public User' },
                        }[r] || { label: r, icon: UserIcon, desc: 'Staff Role' };

                        const Icon = roleMeta.icon;

                        return (
                            <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleChange(r)}
                                className={clsx(
                                    'p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-1',
                                    isSelected
                                        ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-1 ring-red-500/30 shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <Icon className={clsx('w-4 h-4', isSelected ? 'text-red-500' : 'text-slate-400')} />
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                </div>
                                <span className="text-xs font-bold capitalize mt-1">{roleMeta.label}</span>
                                <span className="text-[10px] text-slate-400">{roleMeta.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SECTION 2: PERSONAL DETAILS (Organized 2-Column Grid) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Personal Information
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {showField('first_name') && (
                        <Input
                            label="First Name"
                            id="first_name"
                            value={form.first_name}
                            onChange={set('first_name')}
                            error={errors.first_name}
                            required
                            placeholder="e.g. Juan"
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
                            placeholder="e.g. Dela Cruz"
                        />
                    )}

                    {showField('middle_name') && (
                        <Input
                            label="Middle Name (Optional)"
                            id="middle_name"
                            value={form.middle_name}
                            onChange={set('middle_name')}
                            error={errors.middle_name}
                            placeholder="(Optional)"
                        />
                    )}

                    {showField('birthdate') && (
                        <Input
                            label="Birthday"
                            id="birthdate"
                            type="date"
                            max={maxDate}
                            value={form.birthdate}
                            onChange={handleBirthdateChange}
                            error={errors.birthdate || errors.birthday}
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
                            error={ageError || errors.age}
                            placeholder="e.g. 24"
                        />
                    )}
                </div>
            </div>

            {/* SECTION 3: CONTACT & TELECOMMUNICATIONS */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Contact Details
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {showField('email') && (
                        <div className="sm:col-span-2">
                            <Input
                                label="Email Address (Login Username)"
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={set('email')}
                                error={errors.email}
                                required
                                placeholder="name@mdrrmo.gov.ph"
                            />
                        </div>
                    )}

                    {showField('phone_number') && (
                        <div className="sm:col-span-2">
                            <Input
                                label="Contact Number (Philippine Mobile)"
                                id="phone_number"
                                type="tel"
                                inputMode="numeric"
                                maxLength={11}
                                value={form.phone_number}
                                onChange={handlePhoneChange}
                                onKeyDown={handlePhoneKeyDown}
                                onBlur={handlePhoneBlur}
                                error={phoneError || errors.phone_number}
                                required
                                placeholder="09XXXXXXXXX"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 4: RESPONDER TEAM & MEMBERSHIP (Only for Responders) */}
            {form.role === 'responder' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                        <Ambulance className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Responder Crew Assignment
                        </h4>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Membership Structure
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                {form.is_reliever ? 'Standby Reliever Pool' : 'Permanent Shift Team'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, is_reliever: false }))}
                                className={clsx(
                                    'p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
                                    !form.is_reliever
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400'
                                )}
                            >
                                <Shield className="w-4 h-4" />
                                <span className="text-xs font-bold">Permanent Team</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, is_reliever: true, team: '' }))}
                                className={clsx(
                                    'p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
                                    form.is_reliever
                                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-400'
                                )}
                            >
                                <UserCheck className="w-4 h-4" />
                                <span className="text-xs font-bold">Reliever (Standby)</span>
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {!form.is_reliever
                                ? 'Permanent teams are limited to exactly 1 Driver and up to 3 EMTs per shift.'
                                : 'Relievers can be called on-demand to replace permanent members during absence or off-duty rotations.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!form.is_reliever ? (
                            <div className="flex flex-col gap-2">
                                <Select
                                    label="Permanent Team"
                                    id="team"
                                    value={isCustomTeam ? '__custom__' : (form.team || '')}
                                    onChange={(val) => {
                                        if (val === '__custom__') {
                                            setIsCustomTeam(true);
                                            setForm((f) => ({ ...f, team: '' }));
                                        } else {
                                            setIsCustomTeam(false);
                                            setForm((f) => ({ ...f, team: val }));
                                        }
                                    }}
                                    options={[
                                        ...DEFAULT_TEAMS,
                                        { value: '__custom__', label: '✏️ Other / Custom Team Name...' },
                                    ]}
                                    error={!isCustomTeam ? errors.team : undefined}
                                    required
                                    placeholder="Select a Team (e.g. Team Alpha)"
                                />

                                {isCustomTeam && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Input
                                                label="Custom Team Name"
                                                id="custom_team"
                                                value={form.team}
                                                onChange={set('team')}
                                                error={errors.team}
                                                required
                                                placeholder="e.g. Rescue 1, Golf, Hotel"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomTeam(false);
                                                setForm((f) => ({ ...f, team: 'Alpha' }));
                                            }}
                                            className="mt-6 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                                        >
                                            Back to list
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                    Assignment Pool
                                </label>
                                <div className="px-3.5 py-2.5 text-xs rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                                    Standby Pool (Rotational Reliever)
                                </div>
                            </div>
                        )}

                        <Select
                            label={form.is_reliever ? 'Reliever Position' : 'Team Position'}
                            id="position"
                            value={form.position}
                            onChange={set('position')}
                            options={POSITIONS}
                            error={errors.position}
                        />
                    </div>
                </div>
            )}

            {/* SECTION 5: ACCOUNT STATUS (When Editing) */}
            {Boolean(user) && showField('status') && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                        <UserCheck className="w-4 h-4 text-purple-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Account Access Status
                        </h4>
                    </div>

                    <Select
                        label="Status"
                        id="status"
                        value={form.status}
                        onChange={set('status')}
                        options={STATUSES}
                        error={errors.status}
                    />
                </div>
            )}

            {/* Notice for New User Password Generation */}
            {!user && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-3">
                    <KeyRound className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">
                            Automated Credential Dispatch
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            A temporary randomized password will be automatically dispatched to{' '}
                            <strong>{form.email || 'the specified email'}</strong> upon creation. The staff
                            member will be required to set their permanent password upon initial login.
                        </p>
                    </div>
                </div>
            )}

            {/* ACTION FOOTER BUTTONS */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <span>Saving Changes...</span>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>{user ? 'Update Staff Member' : 'Provision Staff Account'}</span>
                        </>
                    )}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-3 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
