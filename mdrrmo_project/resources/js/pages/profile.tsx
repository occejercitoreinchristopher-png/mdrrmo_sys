import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Input from '@/shared/components/Input';
import {
    User as UserIcon,
    Key,
    Mail,
    Phone,
    MapPin,
    Hash,
    Cake,
    Pencil,
    X,
    Check,
    Lock,
    Eye,
    EyeOff,
    Shield,
    ShieldCheck,
    Copy,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface UserData {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    gender?: string | null;
    birthdate?: string | null;
    birthday?: string | null;
    age?: number | null;
    email: string;
    phone_number: string;
    address?: string | null;
    zip_code?: string | null;
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

interface InfoFieldCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string | null;
    fallback?: string;
    uppercaseValue?: boolean;
    mono?: boolean;
    className?: string;
    action?: {
        icon: React.ComponentType<{ className?: string }>;
        onClick: () => void;
        title: string;
    };
}

function InfoFieldCard({
    icon: Icon,
    label,
    value,
    fallback = '—',
    uppercaseValue = false,
    mono = false,
    className,
    action,
}: InfoFieldCardProps) {
    return (
        <div
            className={clsx(
                'group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200',
                'bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30',
                'shadow-xs hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-none',
                className
            )}
        >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none">
                        {label}
                    </p>
                    <p
                        className={clsx(
                            'text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate tracking-tight',
                            uppercaseValue && 'uppercase',
                            mono && 'font-mono'
                        )}
                    >
                        {value || fallback}
                    </p>
                </div>
            </div>

            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    title={action.title}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
                >
                    <action.icon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

export default function Profile({ user: propUser, status }: ProfileProps) {
    const page = usePage();
    const authUser = (page.props as any).auth?.user;
    const user: UserData = propUser || authUser;

    const isAdmin = user?.role === 'admin';
    const Layout = isAdmin ? AdminLayout : DispatcherLayout;

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'edit'>('overview');

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Format birthday display helper
    const formatBirthday = (dateStr?: string | null) => {
        if (!dateStr) return 'December 16, 2002';
        try {
            return new Intl.DateTimeFormat('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    // Calculate or format age
    const displayAge = user?.age
        ? `${user.age} yrs old`
        : user?.birthdate
        ? `${Math.max(0, new Date().getFullYear() - new Date(user.birthdate).getFullYear())} yrs old`
        : '21 yrs old';

    // Profile Edit Form
    const profileForm = useForm({
        first_name: user?.first_name || '',
        middle_name: user?.middle_name || '',
        last_name: user?.last_name || '',
        gender: user?.gender || 'Male',
        birthdate: user?.birthdate || user?.birthday || '2002-12-16',
        age: user?.age ? String(user.age) : '21',
        phone_number: user?.phone_number || '',
        position: user?.position || 'Administrator',
        address: user?.address || 'zone 1 molugan, Molugan, City Of El Salvador, Misamis Oriental',
        zip_code: user?.zip_code || '9017',
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Full name and initials
    const rawFullName = [user?.first_name, user?.middle_name, user?.last_name]
        .filter(Boolean)
        .join(' ');
    const displayFullName = rawFullName.toUpperCase() || 'REIN CHRISTOPHER MAGTRAYO EJERCITO';
    const initials =
        `${user?.first_name?.[0] || 'R'}${user?.last_name?.[0] || 'E'}`.toUpperCase();

    // Copy to clipboard helper
    const handleCopy = (text: string, title: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${title} to clipboard.`);
    };

    // Handle Profile Save
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setActiveTab('overview');
                toast.success('Profile credentials updated successfully.');
            },
            onError: () => {
                toast.error('Failed to update profile. Please verify your inputs.');
            },
        });
    };

    // Cancel Edit
    const handleCancelEdit = () => {
        profileForm.setData({
            first_name: user?.first_name || '',
            middle_name: user?.middle_name || '',
            last_name: user?.last_name || '',
            gender: user?.gender || 'Male',
            birthdate: user?.birthdate || user?.birthday || '2002-12-16',
            age: user?.age ? String(user.age) : '21',
            phone_number: user?.phone_number || '',
            position: user?.position || 'Administrator',
            address: user?.address || 'zone 1 molugan, Molugan, City Of El Salvador, Misamis Oriental',
            zip_code: user?.zip_code || '9017',
        });
        profileForm.clearErrors();
        setActiveTab('overview');
    };

    // Handle Password Submit
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
                toast.error('Unable to update password. Please check the fields below.');
            },
        });
    };

    return (
        <Layout title="Administrator Profile">
            <Head title="Admin Profile - MDRRMO Opol" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* 1. HERO & BANNER CARD */}
                <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-sm">
                    {/* Architectural Ambient Cover Banner */}
                    <div className="relative h-40 sm:h-48 w-full bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
                        {/* Background micro-dot pattern overlay */}
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                                backgroundSize: '20px 20px',
                            }}
                        />

                        {/* Ambient glowing radial flares */}
                        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 left-1/4 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

                        {/* Banner Agency Watermark / Title */}
                        <div className="absolute inset-0 px-6 sm:px-8 flex items-center justify-between pointer-events-none">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 text-cyan-200 backdrop-blur-md border border-white/15">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    MDRRMO Administration
                                </span>
                                <p className="text-white/60 text-xs sm:text-sm font-medium tracking-wide uppercase">
                                    MDRRMO OPOL • Misamis Oriental Operations Center
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Content Row overlapping banner */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-16 sm:-mt-20">
                            {/* Avatar & User Core Details */}
                            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                                {/* Avatar with Metallic Ring & Status Indicator */}
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold tracking-wider shadow-2xl shadow-blue-600/30 ring-4 ring-white dark:ring-[#0c1220]">
                                        {initials}
                                    </div>
                                    <div
                                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0c1220] flex items-center justify-center text-white"
                                        title="Active Online & On-Duty"
                                    >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                </div>

                                {/* Names and Badges */}
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            {displayFullName}
                                        </h1>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            <ShieldCheck className="w-3 h-3" />
                                            Administrator
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        {user?.position || 'Administrator'} • Municipal Disaster Operations Command
                                    </p>
                                </div>
                            </div>

                            {/* Top Quick Navigation Tabs & Edit Toggle */}
                            <div className="flex items-center gap-2 self-start sm:self-end pt-2 sm:pt-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className={clsx(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                        activeTab === 'overview'
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    )}
                                >
                                    Overview
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('security')}
                                    className={clsx(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                                        activeTab === 'security'
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    )}
                                >
                                    <Lock className="w-3 h-3" />
                                    <span>Security</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')
                                    }
                                    className={clsx(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                                        activeTab === 'edit'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                    )}
                                >
                                    {activeTab === 'edit' ? (
                                        <>
                                            <X className="w-3.5 h-3.5" />
                                            <span>Cancel Edit</span>
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span>Edit Profile</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TWO-COLUMN WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Identity & Credentials Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Card A: Officer Clearance & Credentials */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Account Clearance
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    ACTIVE
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        OFFICIAL OFFICER ID
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                            MDRRMO-ADM-{String(user?.id || 1).padStart(3, '0')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCopy(
                                                    `MDRRMO-ADM-${String(user?.id || 1).padStart(3, '0')}`,
                                                    'Officer ID'
                                                )
                                            }
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        CLEARANCE LEVEL
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                        Level 1 • Administrative Authority
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        OFFICIAL DESIGNATION
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                        {user?.position || 'Administrator'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        COMMAND JURISDICTION
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                        Municipality of Opol, Misamis Oriental
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card B: Security Health Snapshot */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Security Credentials
                                    </h3>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Password protected with bcrypt encryption and active session validation.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('security')}
                                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer text-center"
                            >
                                Update Security Password
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Modules & Forms (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* MODULE 1: Personal Details */}
                                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Personal Details
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Verified identification and personal background records.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('edit')}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span>Edit</span>
                                        </button>
                                    </div>

                                    {/* 3-Column Names */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="First Name"
                                            value={user?.first_name || 'REIN CHRISTOPHER'}
                                            uppercaseValue
                                        />
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Middle Name"
                                            value={user?.middle_name || 'MAGTRAYO'}
                                            uppercaseValue
                                        />
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Last Name"
                                            value={user?.last_name || 'EJERCITO'}
                                            uppercaseValue
                                        />
                                    </div>

                                    {/* 3-Column Demographics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Gender"
                                            value={user?.gender || 'Male'}
                                        />
                                        <InfoFieldCard
                                            icon={Cake}
                                            label="Birthday"
                                            value={formatBirthday(user?.birthdate || user?.birthday)}
                                        />
                                        <InfoFieldCard
                                            icon={Clock}
                                            label="Age"
                                            value={displayAge}
                                        />
                                    </div>
                                </div>

                                {/* MODULE 2: Contact & Location */}
                                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Contact & Location
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Direct telecommunications and designated residential address.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2-Column Communications */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InfoFieldCard
                                            icon={Mail}
                                            label="Email Address"
                                            value={user?.email || 'cyrax630@gmail.com'}
                                            action={{
                                                icon: Copy,
                                                title: 'Copy Email',
                                                onClick: () =>
                                                    handleCopy(
                                                        user?.email || 'cyrax630@gmail.com',
                                                        'Email address'
                                                    ),
                                            }}
                                        />
                                        <InfoFieldCard
                                            icon={Phone}
                                            label="Contact Number"
                                            value={user?.phone_number || '0966-895-9596'}
                                            mono
                                            action={{
                                                icon: Copy,
                                                title: 'Copy Contact Number',
                                                onClick: () =>
                                                    handleCopy(
                                                        user?.phone_number || '0966-895-9596',
                                                        'Phone number'
                                                    ),
                                            }}
                                        />
                                    </div>

                                    {/* Address & Zip Code */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <div className="sm:col-span-2">
                                            <InfoFieldCard
                                                icon={MapPin}
                                                label="Present Address"
                                                value={
                                                    user?.address ||
                                                    'zone 1 molugan, Molugan, City Of El Salvador, Misamis Oriental'
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InfoFieldCard
                                                icon={Hash}
                                                label="Zip Code"
                                                value={user?.zip_code || '9017'}
                                                mono
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: EDIT PROFILE FORM */}
                        {activeTab === 'edit' && (
                            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs">
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    <div className="pb-4 border-b border-slate-200/80 dark:border-white/10">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            Edit Officer Credentials
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Update legal names, contact numbers, and assigned residential address.
                                        </p>
                                    </div>

                                    {/* Personal Names */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Personal Details
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <Input
                                                label="First Name"
                                                id="first_name"
                                                value={profileForm.data.first_name}
                                                onChange={(e) =>
                                                    profileForm.setData('first_name', e.target.value)
                                                }
                                                error={profileForm.errors.first_name}
                                                required
                                            />
                                            <Input
                                                label="Middle Name"
                                                id="middle_name"
                                                value={profileForm.data.middle_name}
                                                onChange={(e) =>
                                                    profileForm.setData('middle_name', e.target.value)
                                                }
                                                error={profileForm.errors.middle_name}
                                                placeholder="(Optional)"
                                            />
                                            <Input
                                                label="Last Name"
                                                id="last_name"
                                                value={profileForm.data.last_name}
                                                onChange={(e) =>
                                                    profileForm.setData('last_name', e.target.value)
                                                }
                                                error={profileForm.errors.last_name}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Demographics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="gender"
                                                className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                            >
                                                Gender
                                            </label>
                                            <select
                                                id="gender"
                                                value={profileForm.data.gender}
                                                onChange={(e) => profileForm.setData('gender', e.target.value)}
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xs [color-scheme:light] dark:[color-scheme:dark]"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <Input
                                            label="Birthday"
                                            id="birthdate"
                                            type="date"
                                            value={profileForm.data.birthdate}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                let calcAge = profileForm.data.age;
                                                if (val) {
                                                    const diff =
                                                        new Date().getFullYear() -
                                                        new Date(val).getFullYear();
                                                    calcAge = String(diff);
                                                }
                                                profileForm.setData({
                                                    ...profileForm.data,
                                                    birthdate: val,
                                                    age: calcAge,
                                                });
                                            }}
                                            error={profileForm.errors.birthdate}
                                        />

                                        <Input
                                            label="Age"
                                            id="age"
                                            type="number"
                                            value={profileForm.data.age}
                                            onChange={(e) => profileForm.setData('age', e.target.value)}
                                            error={profileForm.errors.age}
                                            placeholder="21"
                                        />
                                    </div>

                                    {/* Contact & Location */}
                                    <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Contact & Location
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input
                                                label="Contact Phone"
                                                id="phone_number"
                                                value={profileForm.data.phone_number}
                                                onChange={(e) =>
                                                    profileForm.setData('phone_number', e.target.value)
                                                }
                                                error={profileForm.errors.phone_number}
                                                required
                                                placeholder="09XXXXXXXXX"
                                            />

                                            <Input
                                                label="Official Designation / Role"
                                                id="position"
                                                value={profileForm.data.position}
                                                onChange={(e) =>
                                                    profileForm.setData('position', e.target.value)
                                                }
                                                error={profileForm.errors.position}
                                                placeholder="Administrator"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-2">
                                                <Input
                                                    label="Present Address"
                                                    id="address"
                                                    value={profileForm.data.address}
                                                    onChange={(e) =>
                                                        profileForm.setData('address', e.target.value)
                                                    }
                                                    error={profileForm.errors.address}
                                                    placeholder="Zone / Street / Barangay / City"
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Zip Code"
                                                    id="zip_code"
                                                    value={profileForm.data.zip_code}
                                                    onChange={(e) =>
                                                        profileForm.setData('zip_code', e.target.value)
                                                    }
                                                    error={profileForm.errors.zip_code}
                                                    placeholder="9017"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={profileForm.processing}
                                            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>
                                                {profileForm.processing ? 'Saving...' : 'Save Changes'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: SECURITY & PASSWORD */}
                        {activeTab === 'security' && (
                            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs">
                                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
                                    <div className="pb-4 border-b border-slate-200/80 dark:border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                    Account Security & Password
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Change your password to keep your administrator account secure.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Password */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="current_password"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                        >
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="current_password"
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordForm.data.current_password}
                                                onChange={(e) =>
                                                    passwordForm.setData('current_password', e.target.value)
                                                }
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xs"
                                                placeholder="••••••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowCurrentPassword(!showCurrentPassword)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordForm.errors.current_password && (
                                            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                {passwordForm.errors.current_password}
                                            </p>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="password"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                        >
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordForm.data.password}
                                                onChange={(e) =>
                                                    passwordForm.setData('password', e.target.value)
                                                }
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xs"
                                                placeholder="••••••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordForm.errors.password && (
                                            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                {passwordForm.errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="password_confirmation"
                                            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                        >
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordForm.data.password_confirmation}
                                                onChange={(e) =>
                                                    passwordForm.setData(
                                                        'password_confirmation',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xs"
                                                placeholder="••••••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordForm.errors.password_confirmation && (
                                            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                {passwordForm.errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={passwordForm.processing}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>
                                                {passwordForm.processing
                                                    ? 'Updating...'
                                                    : 'Update Password'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
