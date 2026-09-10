import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import {
    User as UserIcon,
    Shield,
    ShieldCheck,
    Lock,
    KeyRound,
    Eye,
    EyeOff,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    Info,
    Edit3,
    XCircle,
    Save,
    Radio,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    phone_number: string;
    role: 'admin' | 'dispatcher' | string;
    position?: string | null;
    status: string;
    created_at?: string | null;
    updated_at?: string | null;
}

interface ProfileProps {
    user: UserData;
    status?: string | null;
}

export default function Profile({ user: propUser, status }: ProfileProps) {
    const page = usePage();
    const authUser = (page.props as any).auth?.user;
    const user: UserData = propUser || authUser;

    const isAdmin = user?.role === 'admin';
    const isDispatcher = user?.role === 'dispatcher';

    // State for toggling Edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Personal Information Form
    const profileForm = useForm({
        first_name: user?.first_name || '',
        middle_name: user?.middle_name || '',
        last_name: user?.last_name || '',
        phone_number: user?.phone_number || '',
        position: user?.position || '',
    });

    // Change Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Formatting date helper
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'Not recorded';
        try {
            return new Intl.DateTimeFormat('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    // Full Name & Initials
    const fullName = [user?.first_name, user?.middle_name, user?.last_name]
        .filter(Boolean)
        .join(' ');
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

    // Handle Profile Update
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
                toast.success('Profile updated successfully.');
            },
            onError: () => {
                toast.error('Unable to update profile. Please check the fields and try again.');
            },
        });
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        profileForm.setData({
            first_name: user?.first_name || '',
            middle_name: user?.middle_name || '',
            last_name: user?.last_name || '',
            phone_number: user?.phone_number || '',
            position: user?.position || '',
        });
        profileForm.clearErrors();
        setIsEditing(false);
    };

    // Handle Password Change
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                toast.success('Password changed successfully.');
            },
            onError: () => {
                toast.error('Unable to update password. Please check the form errors.');
            },
        });
    };

    // Main Content
    const content = (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <Head title="My Profile - MDRRMO Opol EMS" />

            {/* 1. PROFILE HEADER */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-[#080d1a] border border-white/10 p-6 md:p-8 backdrop-blur-2xl shadow-xl">
                {/* Background Ambient Glow */}
                <div
                    className={`absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 ${
                        isAdmin ? 'bg-blue-600' : 'bg-rose-600'
                    }`}
                />
                <div
                    className={`absolute -left-16 -bottom-16 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-15 ${
                        isAdmin ? 'bg-indigo-600' : 'bg-orange-600'
                    }`}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar Ring */}
                    <div className="relative flex-shrink-0">
                        <div
                            className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-2xl ${
                                isAdmin
                                    ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/30 border-2 border-blue-400/40'
                                    : 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-600 shadow-rose-500/30 border-2 border-rose-400/40'
                            }`}
                        >
                            {initials}
                        </div>
                        {/* Live active ring */}
                        <div
                            className="absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-md bg-slate-900/95 border border-emerald-500/40 text-emerald-400"
                            title="Account status is Active"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                {fullName || 'Account User'}
                            </h1>

                            {/* Role Badge */}
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                                    isAdmin
                                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10'
                                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10'
                                }`}
                            >
                                {isAdmin ? (
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                ) : (
                                    <Radio className="w-3.5 h-3.5" />
                                )}
                                {user?.role ? user.role.toUpperCase() : 'USER'}
                            </span>

                            {/* Position Pill */}
                            {user?.position && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 bg-white/5 border border-white/10">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    {user.position}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {user?.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {user?.phone_number}
                            </span>
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400">
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 font-mono">
                                MDRRMO Opol Emergency Operations Center
                            </span>
                            <span className="text-slate-400">
                                User ID: <span className="text-white font-mono">#{user?.id}</span>
                            </span>
                        </div>
                    </div>

                    {/* Quick Edit Profile Action Button */}
                    <div className="flex items-center">
                        {!isEditing ? (
                            <Button
                                id="btn-edit-profile"
                                onClick={() => setIsEditing(true)}
                                variant={isAdmin ? 'admin' : 'primary'}
                                size="md"
                                className="gap-2 shadow-lg"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </Button>
                        ) : (
                            <Button
                                id="btn-cancel-edit-profile"
                                onClick={handleCancelEdit}
                                variant="secondary"
                                size="md"
                                className="gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Cancel Editing</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. MAIN GRID LAYOUT: Personal Info (Left) & Security/Account (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Personal Information Card */}
                <div className="lg:col-span-7 space-y-6">
                    <Card padding={false} className="overflow-hidden">
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        isAdmin
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                >
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Personal Information
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Your emergency services identity and contact details
                                    </p>
                                </div>
                            </div>

                            {/* Mode indicator */}
                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                    isEditing
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-white/5 text-slate-400 border-white/10'
                                }`}
                            >
                                {isEditing ? 'Editing Mode' : 'Read-Only'}
                            </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            {!isEditing ? (
                                /* VIEW MODE */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                First Name
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {user?.first_name || '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Middle Name
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {user?.middle_name || '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Last Name
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {user?.last_name || '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Phone Number
                                            </p>
                                            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                                {user?.phone_number || '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Email / Gmail
                                                </p>
                                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                    <Lock className="w-3 h-3 text-slate-500" />
                                                    Admin-managed
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                                {user?.email || '—'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                Email changes are managed by the administrator.
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Assigned Role
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                                                        isAdmin
                                                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                    }`}
                                                >
                                                    {user?.role}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Position / Title
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {user?.position || '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-1 sm:col-span-2">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Account Status
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 capitalize">
                                                    {user?.status || 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <Button
                                            id="btn-edit-personal-info"
                                            onClick={() => setIsEditing(true)}
                                            variant={isAdmin ? 'admin' : 'primary'}
                                            size="md"
                                            className="w-full sm:w-auto gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            <span>Edit Personal Information</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* EDIT FORM MODE */
                                <form onSubmit={handleProfileSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* First Name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="input-first-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                First Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="input-first-name"
                                                type="text"
                                                value={profileForm.data.first_name}
                                                onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                                className={`w-full bg-white dark:bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all ${
                                                    profileForm.errors.first_name
                                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                        : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-blue-500/50'
                                                }`}
                                                placeholder="e.g. Juan"
                                                required
                                            />
                                            {profileForm.errors.first_name && (
                                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {profileForm.errors.first_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Middle Name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="input-middle-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Middle Name
                                            </label>
                                            <input
                                                id="input-middle-name"
                                                type="text"
                                                value={profileForm.data.middle_name}
                                                onChange={(e) => profileForm.setData('middle_name', e.target.value)}
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                placeholder="e.g. Dela (optional)"
                                            />
                                            {profileForm.errors.middle_name && (
                                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {profileForm.errors.middle_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Last Name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="input-last-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Last Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="input-last-name"
                                                type="text"
                                                value={profileForm.data.last_name}
                                                onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                                className={`w-full bg-white dark:bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all ${
                                                    profileForm.errors.last_name
                                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                        : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-blue-500/50'
                                                }`}
                                                placeholder="e.g. Cruz"
                                                required
                                            />
                                            {profileForm.errors.last_name && (
                                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {profileForm.errors.last_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="input-phone-number" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Phone Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="input-phone-number"
                                                type="text"
                                                value={profileForm.data.phone_number}
                                                onChange={(e) => profileForm.setData('phone_number', e.target.value)}
                                                className={`w-full bg-white dark:bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white outline-none transition-all ${
                                                    profileForm.errors.phone_number
                                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                        : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-blue-500/50'
                                                }`}
                                                placeholder="09XXXXXXXXX"
                                                required
                                            />
                                            {profileForm.errors.phone_number && (
                                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {profileForm.errors.phone_number}
                                                </p>
                                            )}
                                        </div>

                                        {/* Position */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label htmlFor="input-position" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Position / EMS Role Title
                                            </label>
                                            <input
                                                id="input-position"
                                                type="text"
                                                value={profileForm.data.position}
                                                onChange={(e) => profileForm.setData('position', e.target.value)}
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                placeholder="e.g. Emergency Dispatcher, Head of Operations"
                                            />
                                            {profileForm.errors.position && (
                                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {profileForm.errors.position}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email (Read-Only) */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Email Address (Read-Only)
                                                </label>
                                                <span className="text-[11px] text-amber-500/90 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" />
                                                    System Locked
                                                </span>
                                            </div>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono select-none"
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                                                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                <span>Email changes are managed by the administrator.</span>
                                            </p>
                                        </div>

                                        {/* Role & Status (Locked) */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                System Role (Locked)
                                            </label>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                <Lock className="w-3.5 h-3.5" />
                                                <span>{user?.role} (Self-modification not allowed)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Account Status (Locked)
                                            </label>
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs font-bold text-emerald-500/80 uppercase">
                                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                                <span>● {user?.status || 'Active'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-3">
                                        <Button
                                            id="btn-cancel-edit"
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCancelEdit}
                                            disabled={profileForm.processing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            id="btn-save-profile"
                                            type="submit"
                                            variant={isAdmin ? 'admin' : 'primary'}
                                            loading={profileForm.processing}
                                            className="gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{profileForm.processing ? 'Saving changes...' : 'Save Changes'}</span>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Security (Change Password) & Account Info Cards */}
                <div className="lg:col-span-5 space-y-6">
                    {/* 3. CHANGE PASSWORD CARD */}
                    <Card padding={false} className="overflow-hidden border border-rose-500/20 dark:border-rose-500/20 shadow-md">
                        {/* Security Banner Header */}
                        <div className="p-6 bg-gradient-to-br from-rose-950/20 to-orange-950/10 dark:from-rose-950/40 dark:to-transparent border-b border-rose-500/20">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/10">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>Security</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
                                            Password
                                        </span>
                                    </h2>
                                    <p className="text-xs font-semibold text-rose-400/90">
                                        Keep your account secure
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Use a strong password and avoid sharing your account credentials.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Password Form */}
                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            {/* Current Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="input-current-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Current Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="input-current-password"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        className={`w-full bg-white dark:bg-white/5 border rounded-xl pl-4 pr-11 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all ${
                                            passwordForm.errors.current_password
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-rose-500/40'
                                        }`}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        id="btn-toggle-current-password"
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.current_password && (
                                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="input-new-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    New Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="input-new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        className={`w-full bg-white dark:bg-white/5 border rounded-xl pl-4 pr-11 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all ${
                                            passwordForm.errors.password
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-rose-500/40'
                                        }`}
                                        placeholder="Minimum 8 characters"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        id="btn-toggle-new-password"
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                                        title={showNewPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm New Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="input-confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Confirm New Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="input-confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        className={`w-full bg-white dark:bg-white/5 border rounded-xl pl-4 pr-11 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all ${
                                            passwordForm.errors.password_confirmation
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                                                : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-rose-500/40'
                                        }`}
                                        placeholder="Repeat new password"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        id="btn-toggle-confirm-password"
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {passwordForm.errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Submit Password Button */}
                            <div className="pt-2">
                                <Button
                                    id="btn-change-password"
                                    type="submit"
                                    variant="primary"
                                    loading={passwordForm.processing}
                                    className="w-full gap-2 shadow-lg shadow-rose-500/20"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span>
                                        {passwordForm.processing ? 'Updating password...' : 'Change Password'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* 4. ACCOUNT INFORMATION CARD */}
                    <Card padding={false} className="overflow-hidden">
                        <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center">
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Account Information
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    System record timeline and access status
                                </p>
                            </div>
                        </div>

                        <div className="p-5 divide-y divide-slate-200/80 dark:divide-white/5 text-xs space-y-0">
                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400">System Role</span>
                                <span className="font-bold text-slate-900 dark:text-white capitalize">
                                    {user?.role}
                                </span>
                            </div>

                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {user?.status || 'Active'}
                                </span>
                            </div>

                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Registered Email</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                    {user?.email}
                                </span>
                            </div>

                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    Account Created
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">
                                    {formatDate(user?.created_at)}
                                </span>
                            </div>

                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    Last Updated
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">
                                    {formatDate(user?.updated_at)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    // Render within appropriate Layout based on user role
    if (isAdmin) {
        return <AdminLayout title="My Profile">{content}</AdminLayout>;
    }

    if (isDispatcher) {
        return <DispatcherLayout title="My Profile">{content}</DispatcherLayout>;
    }

    // Safety fallback
    return (
        <div className="min-h-screen bg-[#080d1a] text-white p-6">
            {content}
        </div>
    );
}
