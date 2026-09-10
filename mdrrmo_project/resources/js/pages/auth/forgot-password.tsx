import { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { login } from '@/routes';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password - MDRRMO Opol EMS" />

            <div className="w-full max-w-md">
                <Card className="p-6 sm:p-8 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 mb-3">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Reset Your Password
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Enter your registered email address and we'll send you instructions to reset your password.
                        </p>
                    </div>

                    {/* Status Alert Banner */}
                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Error Banner */}
                    {errors.email && (
                        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{errors.email}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Registered Email Address <span className="text-rose-500">*</span>
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
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            loading={processing}
                            disabled={processing}
                            className="w-full justify-center py-2.5 mt-2 text-sm font-semibold tracking-wide shadow-md shadow-rose-500/20"
                        >
                            {processing ? 'Sending Link...' : 'Send Password Reset Link'}
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
