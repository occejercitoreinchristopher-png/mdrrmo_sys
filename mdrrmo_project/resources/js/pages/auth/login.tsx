import { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Shield,
    AlertCircle,
    CheckCircle2,
    Smartphone,
    Activity,
    Radio,
    Clock,
    Loader2,
    ArrowUpRight,
    HeartPulse,
} from 'lucide-react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import ThemeToggle from '@/shared/components/ThemeToggle';
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
        <ThemeProvider>
            <Head title="Sign In - MDRRMO Opol EMS" />

            <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 relative overflow-x-hidden font-sans bg-white dark:bg-[#0B132B] transition-colors duration-300">
                {/* Minimal Theme Toggle in Upper-Right Corner */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
                    <ThemeToggle className="bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-white/10" />
                </div>

                {/* ========================================================= */}
                {/* LEFT PANEL – Branding and System Identity                 */}
                {/* ========================================================= */}
                <section className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white dark:bg-[#0A1124] text-slate-900 dark:text-white border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/5 overflow-hidden">
                    {/* Subtle Topographic / Geographic Background Vector Pattern */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.05] -z-0">
                        <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                            <defs>
                                <pattern id="topo-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                                    <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <circle cx="24" cy="24" r="1.5" fill="currentColor" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#topo-grid)" />
                        </svg>
                    </div>

                    {/* Subtle Emergency Watermark Glow */}
                    <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#FF6B35]/5 dark:bg-[#FF6B35]/5 blur-3xl pointer-events-none" />

                    {/* Top Branding Header Pill */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/50 text-[#2455C5] dark:text-blue-300 text-xs font-semibold tracking-wide shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider">Official Municipal Operations Portal</span>
                        </div>
                    </div>

                    {/* Main Centered Identity Section */}
                    <div className="relative z-10 my-auto py-8 sm:py-12 flex flex-col items-center text-center max-w-lg mx-auto">
                        {/* Prominent Municipal Logo */}
                        <div className="relative mb-6 group">
                            {/* Ambient Seal Glow Ring */}
                            <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#2455C5]/20 via-sky-400/20 to-[#FF6B35]/20 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-center justify-center gap-3">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl p-1 bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-white/10 flex items-center justify-center transition-transform duration-300 hover:scale-105">
                                    <img
                                        src="/images/opol-logo.png"
                                        alt="Municipality of Opol Official Seal"
                                        className="w-full h-full object-contain drop-shadow"
                                    />
                                </div>
                                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl p-1 bg-white dark:bg-slate-900 shadow-lg border border-slate-200/80 dark:border-white/10 flex items-center justify-center transition-transform duration-300 hover:scale-105">
                                    <img
                                        src="/images/drrm_logo.png"
                                        alt="MDRRMO Opol DRRM Seal"
                                        className="w-full h-full object-contain drop-shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Official Titles */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#10264B] dark:text-white tracking-tight">
                            MDRRMO OPOL
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#2455C5] dark:text-sky-400">
                            EMERGENCY MEDICAL SERVICES MANAGEMENT SYSTEM
                        </p>

                        {/* Subtle Divider */}
                        <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#2455C5] via-[#3568DC] to-[#FF6B35] my-4" />

                        {/* Short Description */}
                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-md font-normal">
                            Preparedness, Protection, and Response for the Opol Community.
                        </p>

                        {/* Key Pillars / Micro-indicators */}
                        <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-md">
                            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-col items-center text-center">
                                <Radio className="w-4 h-4 text-[#2455C5] dark:text-sky-400 mb-1" />
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">24/7 Hotline</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">Triage & Dispatch</span>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-col items-center text-center">
                                <Activity className="w-4 h-4 text-[#E63946] mb-1" />
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">Live Telemetry</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">GPS Fleet Tracking</span>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-col items-center text-center">
                                <HeartPulse className="w-4 h-4 text-emerald-500 mb-1" />
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">Digital PCR</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">Pre-Hospital Care</span>
                            </div>
                        </div>
                    </div>

                    {/* Left Panel Footer */}
                    <div className="relative z-10 pt-4 border-t border-slate-200/60 dark:border-white/5 text-center lg:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Municipal Disaster Risk Reduction & Management Office</span>
                        <span>Municipality of Opol, Misamis Oriental</span>
                    </div>
                </section>

                {/* ========================================================= */}
                {/* RIGHT PANEL – Login Form with Professional Blue Gradient  */}
                {/* ========================================================= */}
                <section className="relative flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 lg:p-14 xl:p-16 bg-gradient-to-br from-[#10264B] via-[#163870] to-[#2455C5] text-white min-h-[550px] lg:min-h-screen overflow-hidden">
                    {/* Atmospheric Lighting Accents */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2455C5]/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-black/20 pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md my-auto">
                        {/* Title & Subtitle */}
                        <div className="mb-8 text-left">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                                Sign in to access the MDRRMO Emergency Medical Services Management System.
                            </p>
                        </div>

                        {/* Status Alert Banner */}
                        {status && (
                            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs flex items-center gap-2.5 backdrop-blur-sm animate-fade-in">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-300" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Generic Error Alert Banner */}
                        {(errors.email || errors.password) && (
                            <div className="mb-5 p-3.5 rounded-xl bg-[#E63946]/20 border border-[#E63946]/40 text-rose-100 text-xs flex items-start gap-2.5 backdrop-blur-sm animate-shake">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-300" />
                                <div>
                                    <p className="font-semibold text-white">Authentication Failed</p>
                                    <p className="text-[11px] mt-0.5 text-rose-100/90 leading-snug">
                                        {errors.email || errors.password}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            {/* Username or Email */}
                            <div className="space-y-1.5 text-left">
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-blue-100"
                                >
                                    Username or Email <span className="text-[#FF6B35]">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-200/80">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="email"
                                        type="text"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter your username or email"
                                        autoComplete="username"
                                        autoFocus
                                        required
                                        className={`w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-blue-200/50 transition-all duration-200 outline-none backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-white/40 focus:border-white ${
                                            errors.email
                                                ? 'border-[#E63946] focus:ring-[#E63946]/50'
                                                : 'border-white/20'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-rose-300 flex items-center gap-1.5 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5 text-left">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-blue-100"
                                >
                                    Password <span className="text-[#FF6B35]">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-200/80">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                        className={`w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-blue-200/50 transition-all duration-200 outline-none backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-white/40 focus:border-white ${
                                            errors.password
                                                ? 'border-[#E63946] focus:ring-[#E63946]/50'
                                                : 'border-white/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-200/70 hover:text-white transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-300 flex items-center gap-1.5 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>

                            {/* Below Password: Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none group">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-white/30 text-[#2455C5] focus:ring-white/40 bg-white/10 cursor-pointer transition-colors"
                                    />
                                    <span className="text-xs sm:text-sm text-blue-100/90 group-hover:text-white transition-colors font-medium">
                                        Remember me
                                    </span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={request ? request() : '/forgot-password'}
                                        className="text-xs sm:text-sm font-medium text-blue-200 hover:text-white underline-offset-4 hover:underline transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>

                            {/* Primary Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#10264B] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:shadow-2xl active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-[#10264B]" />
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                )}
                            </button>
                        </form>

                        {/* Additional Information Footer */}
                        <div className="mt-8 pt-6 border-t border-white/15 text-center space-y-4">
                            {/* Staff Access Notice */}
                            <p className="text-xs text-blue-200/80 flex items-center justify-center gap-1.5 font-normal">
                                <Shield className="w-3.5 h-3.5 text-blue-300" />
                                <span>Staff access is provided by the MDRRMO Administrator.</span>
                            </p>

                            {/* Resident Mobile Application Section */}
                            <div className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors text-left backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                                        <Smartphone className="w-4 h-4 text-sky-300" />
                                        <span>Are you an Opol Resident?</span>
                                    </div>
                                    <Link
                                        href="/download/app"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200 hover:text-white transition-colors"
                                    >
                                        <span>Get App</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                                <p className="text-[11px] text-blue-100/80 leading-relaxed mt-1">
                                    Report emergencies, request ambulance dispatch, and monitor responders using the{' '}
                                    <span className="font-semibold text-white">MDRRMO Mobile App</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </ThemeProvider>
    );
}

// Mark layout as self-contained so Inertia does not wrap with the outer navbar/footer
Login.layout = (page: React.ReactNode) => page;
