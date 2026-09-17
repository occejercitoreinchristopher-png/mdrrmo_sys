import { useState, FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    Check,
    X,
    AlertCircle,
    ShieldCheck,
    LogOut,
} from 'lucide-react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';

interface ChangePasswordProps {
    user: {
        first_name: string;
        last_name: string;
        email: string;
        role: string;
    };
}

export default function ChangePassword({ user }: ChangePasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Validation checks
    const hasMinLength = data.password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;
    const isDifferent = data.password.length > 0 && data.password !== data.current_password;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/change-password', {
            onError: () => {
                reset('current_password');
            },
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Create Permanent Password - MDRRMO Opol" />

            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
                {/* Decorative background glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <Card className="p-6 sm:p-8 bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 mb-3">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Mandatory Password Change
                            </h1>
                            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                Welcome, <strong className="text-slate-200">{user.first_name} {user.last_name}</strong> ({user.role.toUpperCase()}). You logged in with a temporary password. Please establish your permanent password to continue.
                            </p>
                        </div>

                        {/* Top Banner Alert */}
                        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block text-amber-200">Action Required:</span>
                                Your temporary password is only valid for initial access. You cannot access the system dashboard until you complete this step.
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Current Temporary Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="current_password"
                                    className="block text-xs font-semibold text-slate-300"
                                >
                                    Current Temporary Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="current_password"
                                        type={showCurrent ? 'text' : 'password'}
                                        name="current_password"
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        placeholder="Enter temporary password"
                                        autoComplete="current-password"
                                        required
                                        className={`w-full bg-white/5 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                            errors.current_password
                                                ? 'border-rose-500/60'
                                                : 'border-white/10'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                                    >
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.current_password && (
                                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.current_password}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-slate-300"
                                >
                                    New Permanent Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showNew ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        required
                                        className={`w-full bg-white/5 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                            errors.password
                                                ? 'border-rose-500/60'
                                                : 'border-white/10'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                                    >
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm New Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-xs font-semibold text-slate-300"
                                >
                                    Confirm New Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                        required
                                        className={`w-full bg-white/5 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                            errors.password_confirmation
                                                ? 'border-rose-500/60'
                                                : 'border-white/10'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Requirements Checklist */}
                            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-slate-400">
                                <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                                    Password Guidelines:
                                </p>
                                <div className="flex items-center gap-2">
                                    {hasMinLength ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                    <span className={hasMinLength ? 'text-emerald-300' : ''}>
                                        At least 8 characters long
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasLetter && hasNumber ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                    <span className={hasLetter && hasNumber ? 'text-emerald-300' : ''}>
                                        Includes both letters and numbers
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {passwordsMatch ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                    <span className={passwordsMatch ? 'text-emerald-300' : ''}>
                                        New password and confirmation match
                                    </span>
                                </div>
                                {data.current_password && data.password && (
                                    <div className="flex items-center gap-2">
                                        {isDifferent ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-rose-400" />
                                        )}
                                        <span className={isDifferent ? 'text-emerald-300' : 'text-rose-300'}>
                                            Different from temporary password
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                loading={processing}
                                disabled={processing || !hasMinLength || !passwordsMatch || !isDifferent}
                                className="w-full justify-center py-2.5 mt-2 text-sm font-semibold tracking-wide shadow-md shadow-rose-500/20"
                            >
                                {processing ? 'Updating Password...' : 'Save Permanent Password'}
                            </Button>
                        </form>

                        {/* Sign Out Option */}
                        <div className="mt-6 pt-5 border-t border-white/10 text-center">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="font-medium text-xs text-slate-400 hover:text-rose-400 inline-flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign out of this session
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
