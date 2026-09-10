import { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, AlertCircle, CheckCircle2, ArrowRight, Smartphone } from 'lucide-react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { request } from '@/routes/password';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = true }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign In - MDRRMO Opol EMS" />

            <div className="w-full max-w-md">
                <Card className="p-6 sm:p-8 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                    {/* Branding Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 mb-3">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Sign in to access the <span className="font-semibold text-slate-700 dark:text-slate-300">MDRRMO Emergency Medical Services</span> Management System.
                        </p>
                    </div>

                    {/* Status Alert Banner (e.g. Password Reset Confirmation) */}
                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Generic Error Banner */}
                    {(errors.email || errors.password) && (
                        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Authentication Failed</p>
                                <p className="text-[11px] mt-0.5 opacity-90">
                                    {errors.email || errors.password}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Email Address <span className="text-rose-500">*</span>
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
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none shadow-sm dark:shadow-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.email
                                            ? 'border-rose-500/60 focus:ring-rose-500/40'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Password <span className="text-rose-500">*</span>
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={request ? request() : '/forgot-password'}
                                        className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
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
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none shadow-sm dark:shadow-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.password
                                            ? 'border-rose-500/60 focus:ring-rose-500/40'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-rose-600 focus:ring-rose-500/40 bg-slate-50 dark:bg-white/5 cursor-pointer transition-colors"
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                    Remember me
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            loading={processing}
                            disabled={processing}
                            className="w-full justify-center py-2.5 mt-2 text-sm font-semibold tracking-wide shadow-md shadow-rose-500/20"
                        >
                            {processing ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Mobile App Promotion for Residents */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center space-y-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Are you an Opol Resident?</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Create your resident account, report emergencies, and track dispatched ambulances directly using the <span className="font-semibold text-slate-900 dark:text-white">MDRRMO Mobile App</span>.
                            </p>
                        </div>

                        {/* Security Notice */}
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Staff Access:</span> Admin, Dispatcher, and Responder credentials are provisioned by the MDRRMO Administrator.
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
