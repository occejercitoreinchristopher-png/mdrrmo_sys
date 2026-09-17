import { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { login } from '@/routes';

interface ResetPasswordProps {
    token: string;
    email: string;
    passwordRules?: string;
}

export default function ResetPassword({ token, email, passwordRules }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password - MDRRMO Opol EMS" />

            <div className="w-full max-w-md">
                <Card className="p-6 sm:p-8 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 mb-3">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Set New Password
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Create a secure new password for your MDRRMO account.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Password Reset Failed</p>
                                <p className="text-[11px] mt-0.5 opacity-90">
                                    {errors.email || errors.password || errors.password_confirmation}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (Readonly) */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    readOnly
                                    className="w-full bg-slate-100 dark:bg-white/[0.03] border border-slate-300/80 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                New Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    autoComplete="new-password"
                                    autoFocus
                                    required
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-11 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.password
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password_confirmation"
                                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Confirm New Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Repeat new password"
                                    autoComplete="new-password"
                                    required
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-11 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.password_confirmation
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.password_confirmation}</p>
                            )}
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl space-y-1.5 text-xs">
                            <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                                Password Requirements
                            </p>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${data.password.length >= 8 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                    ✓
                                </div>
                                <span className={data.password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                                    At least 8 characters
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${data.password.length > 0 && data.password === data.password_confirmation ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                    ✓
                                </div>
                                <span className={data.password.length > 0 && data.password === data.password_confirmation ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                                    Passwords match
                                </span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            loading={processing}
                            disabled={processing || data.password.length < 8 || data.password !== data.password_confirmation}
                            className="w-full justify-center py-2.5 mt-2 text-sm font-semibold tracking-wide shadow-md shadow-rose-500/20"
                        >
                            {processing ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                    </form>

                    {/* Back to Sign In */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
                        <Link
                            href={login ? login() : '/login'}
                            className="font-medium text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return to Sign In
                        </Link>
                    </div>
                </Card>
            </div>
        </>
    );
}
