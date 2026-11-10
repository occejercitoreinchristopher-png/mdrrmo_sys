import { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Mail,
    KeyRound,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
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

            <div className="w-full max-w-[460px] mx-auto animate-card-entrance">
                <div className="p-8 sm:p-10 bg-white dark:bg-[#101A30] border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 rounded-[20px] transition-all duration-300 relative overflow-hidden backdrop-blur-sm">
                    {/* Subtle Top Accent Bar */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E63946] via-[#FF6B35] to-[#2455C5]" />

                    {/* ========================================================= */}
                    {/* SUCCESS STATE (If Password Reset Link Was Sent)           */}
                    {/* ========================================================= */}
                    {status ? (
                        <div className="text-center py-2 animate-fade-in">
                            {/* Success Icon */}
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 mb-4 shadow-lg shadow-emerald-500/10 animate-scale-in">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>

                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Check Your Email
                            </h1>

                            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-[#A9B8D0] leading-relaxed max-w-sm mx-auto">
                                If an account exists with the email address you entered, password reset instructions will be sent to that address. Please check your inbox and spam folder.
                            </p>

                            <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-white/10 flex justify-center">
                                <Link
                                    href={login ? login() : '/login'}
                                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#E63946] to-[#FF6B35] hover:from-[#d62839] hover:to-[#f75a22] text-white shadow-lg shadow-[#E63946]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2 select-none"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Sign In</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* ========================================================= */
                        /* DEFAULT FORM STATE                                        */
                        /* ========================================================= */
                        <div>
                            {/* Card Header & Key Icon */}
                            <div className="text-center mb-6">
                                {/* Modern Red-to-Orange Gradient Key Icon */}
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E63946] to-[#FF6B35] text-white shadow-lg shadow-[#E63946]/30 border border-white/20 mb-3.5 animate-scale-in">
                                    <KeyRound className="w-7 h-7 drop-shadow-sm" />
                                </div>

                                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-up delay-1">
                                    Reset Your Password
                                </h1>

                                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-[#A9B8D0] leading-relaxed animate-fade-up delay-2">
                                    Forgot your password? Enter your registered email address and we'll send you instructions to securely reset it.
                                </p>
                            </div>

                            {/* Error Alert Banner */}
                            {errors.email && (
                                <div className="mb-5 p-3 rounded-xl bg-[#E63946]/10 border border-[#E63946]/25 text-[#E63946] dark:text-[#FF6B35] text-xs flex items-center gap-2.5 animate-fade-in">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium">{errors.email}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email Field */}
                                <div className="space-y-1.5 animate-fade-up delay-3">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide"
                                    >
                                        Registered Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-[#2455C5] dark:group-focus-within:text-white transition-colors duration-200">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter your registered email address"
                                            autoComplete="email"
                                            autoFocus
                                            required
                                            className={`w-full bg-slate-50 dark:bg-[#1B2941] border rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 ease-out shadow-sm dark:shadow-none ${
                                                errors.email
                                                    ? 'border-[#E63946] focus:ring-2 focus:ring-[#E63946]/40'
                                                    : 'border-slate-300/80 dark:border-white/15 focus:border-[#2455C5] focus:ring-2 focus:ring-[#2455C5]/40 focus:shadow-lg focus:shadow-[#2455C5]/10'
                                            }`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-[11px] text-[#E63946] dark:text-[#FF6B35] flex items-center gap-1 mt-1 font-medium animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.email}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Send Password Reset Link Button */}
                                <div className="animate-fade-up delay-4 pt-1">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#E63946] to-[#FF6B35] hover:from-[#d62839] hover:to-[#f75a22] text-white shadow-lg shadow-[#E63946]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 ease-out flex items-center justify-center gap-2 tracking-wide cursor-pointer select-none"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                <span>Sending Reset Link...</span>
                                            </>
                                        ) : (
                                            <span>Send Password Reset Link</span>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Back to Sign In Link */}
                            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center animate-fade-up delay-5">
                                <Link
                                    href={login ? login() : '/login'}
                                    className="font-medium text-xs sm:text-sm text-slate-500 dark:text-[#A9B8D0] hover:text-[#2455C5] dark:hover:text-white inline-flex items-center gap-2 transition-colors duration-200 group select-none"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                                    <span>Back to Sign In</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Embedded Keyframe Animations */}
            <style>{`
                @keyframes cardEntrance {
                    0% {
                        opacity: 0;
                        transform: translateY(12px) scale(0.98);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes scaleIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes fadeInUpward {
                    0% {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                .animate-card-entrance {
                    animation: cardEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-scale-in {
                    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
                }
                .animate-fade-up {
                    animation: fadeInUpward 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .animate-fade-in {
                    animation: fadeIn 0.35s ease-out both;
                }
                .delay-1 {
                    animation-delay: 120ms;
                }
                .delay-2 {
                    animation-delay: 200ms;
                }
                .delay-3 {
                    animation-delay: 280ms;
                }
                .delay-4 {
                    animation-delay: 360ms;
                }
                .delay-5 {
                    animation-delay: 440ms;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-card-entrance,
                    .animate-scale-in,
                    .animate-fade-up,
                    .animate-fade-in {
                        animation: none !important;
                        transition: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </>
    );
}
