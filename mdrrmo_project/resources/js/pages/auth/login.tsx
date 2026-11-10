import { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Smartphone,
    Loader2,
} from 'lucide-react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import ThemeToggle from '@/shared/components/ThemeToggle';
import { request } from '@/routes/password';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

function LoginForm({ status, canResetPassword = true }: LoginProps) {
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
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#F4F6FA] dark:bg-[#070D1B] transition-colors duration-500 overflow-x-hidden selection:bg-[#FF6B35] selection:text-white">
            {/* ========================================================= */}
            {/* SUBTLE BACKGROUND ANIMATIONS & AMBIENT FLOATING ELEMENTS  */}
            {/* ========================================================= */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {/* Slow Floating Gradient Orb 1 (Primary Blue) */}
                <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-[#2455C5]/12 dark:bg-[#2455C5]/18 rounded-full blur-3xl animate-ambient-drift-1" />

                {/* Slow Floating Gradient Orb 2 (Orange Accent) */}
                <div className="absolute -bottom-36 -right-36 w-[440px] h-[440px] bg-[#FF6B35]/8 dark:bg-[#FF6B35]/12 rounded-full blur-3xl animate-ambient-drift-2" />

                {/* Slow Floating Gradient Orb 3 (Secondary Blue) */}
                <div className="absolute top-1/3 left-2/3 w-[360px] h-[360px] bg-[#3568DC]/8 dark:bg-[#3568DC]/10 rounded-full blur-3xl animate-ambient-drift-3" />

                {/* Subtle Floating Geometric Diamond Accent */}
                <div className="absolute top-20 right-28 w-24 h-24 border border-slate-300/40 dark:border-white/5 rounded-2xl rotate-45 animate-ambient-drift-2 opacity-30 dark:opacity-20 hidden md:block" />

                {/* Subtle Dot Grid Background */}
                <div
                    className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* Top Right Theme Toggle */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 animate-fade-in delay-1">
                <ThemeToggle className="shadow-md shadow-black/5 dark:shadow-black/40 transition-transform duration-200 hover:scale-105 active:scale-95" />
            </div>

            {/* ========================================================= */}
            {/* MAIN SPLIT-SCREEN CONTAINER (Max 960px × 600px)          */}
            {/* ========================================================= */}
            <div className="relative z-10 w-full max-w-[960px] lg:h-[600px] bg-white dark:bg-[#0D1B2A] rounded-[18px] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 border border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row overflow-hidden transition-all duration-300 animate-container">
                {/* ========================================================= */}
                {/* LEFT PANEL – HELICOPTER RESCUE BACKGROUND (40% width)     */}
                {/* ========================================================= */}
                <div className="relative w-full lg:w-[40%] min-h-[220px] sm:min-h-[260px] lg:min-h-full overflow-hidden flex flex-col justify-between p-6 sm:p-7 select-none animate-slide-left">
                    {/* Background Photograph */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out hover:scale-105"
                        style={{
                            backgroundImage: "url('/images/rescue-helicopter.jpg')",
                        }}
                    />

                    {/* Dark Navy Gradient Overlay: darker at bottom for text, keeps helicopter & responders bright */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10264B]/95 via-[#10264B]/55 to-[#10264B]/40" />

                    {/* Subtle top edge vignette */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#10264B]/50 to-transparent pointer-events-none" />

                    {/* Top Branding Content */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-lg shadow-black/20 flex items-center justify-center flex-shrink-0 animate-logo">
                            <img
                                src="/images/opol-logo.png"
                                alt="MDRRMO Opol Municipal Logo"
                                className="w-full h-full object-contain drop-shadow-md"
                            />
                        </div>
                        <div className="animate-fade-up delay-2">
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white drop-shadow-sm">
                                    MDRRMO OPOL
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#FF6B35] text-white shadow-sm transition-transform duration-200 hover:scale-105">
                                    EMS
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-white/80 font-medium tracking-wide">
                                Municipality of Opol
                            </p>
                        </div>
                    </div>

                    {/* Center area kept completely clear to showcase helicopter and rescue responders */}
                    <div className="flex-1 pointer-events-none" />

                    {/* Bottom Branding Content */}
                    <div className="relative z-10 pt-4 lg:pt-0 animate-fade-up delay-3">
                        {/* Subtle Orange Accent Line */}
                        <div className="w-12 h-1 bg-[#FF6B35] rounded-full mb-2.5 shadow-sm shadow-[#FF6B35]/50" />

                        <h2 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase leading-snug drop-shadow-sm">
                            EMERGENCY MEDICAL SERVICES MANAGEMENT SYSTEM
                        </h2>
                        <p className="text-[11px] text-slate-200/90 font-medium leading-relaxed mt-1 drop-shadow-sm">
                            Preparedness, Protection, and Response for the Opol Community.
                        </p>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* RIGHT PANEL – LOGIN FORM (60% width)                      */}
                {/* ========================================================= */}
                <div className="relative w-full lg:w-[60%] flex flex-col justify-center items-center p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#10264B] via-[#2455C5] to-[#3568DC] text-white animate-slide-right">
                    {/* Subtle geometric pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.035] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
                            backgroundSize: '20px 20px',
                        }}
                    />

                    <div className="relative z-10 w-full max-w-[400px] mx-auto flex flex-col justify-center">
                        {/* Login Heading with upward slide entrance */}
                        <div className="mb-5 sm:mb-6 animate-fade-up delay-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                                Welcome Back
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
                                Sign in to access the MDRRMO Emergency Medical Services Management System.
                            </p>
                        </div>

                        {/* Status Banner (e.g. Password Reset Confirmation) */}
                        {status && (
                            <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs flex items-center gap-2 backdrop-blur-sm animate-fade-in">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-300" />
                                <span className="font-medium">{status}</span>
                            </div>
                        )}

                        {/* Error Banner */}
                        {(errors.email || errors.password) && (
                            <div className="mb-4 p-2.5 rounded-xl bg-[#E63946]/25 border border-[#E63946]/50 text-white text-xs flex items-start gap-2 backdrop-blur-sm animate-fade-in">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#FF6B35]" />
                                <div>
                                    <p className="font-semibold text-white">Authentication Failed</p>
                                    <p className="text-[11px] text-white/90 mt-0.5">
                                        {errors.email || errors.password}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form with Staggered Elements */}
                        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                            {/* Stagger 1: Username or Email Field */}
                            <div className="space-y-1.5 animate-fade-up delay-2">
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-semibold text-white/90 tracking-wide"
                                >
                                    Username or Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors duration-200">
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
                                        className={`w-full bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.18] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/45 outline-none backdrop-blur-sm shadow-inner transition-all duration-200 ease-out ${
                                            errors.email
                                                ? 'border-[#E63946] focus:ring-2 focus:ring-[#E63946]/50 shadow-red-500/10'
                                                : 'border-white/20 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/40 focus:shadow-lg focus:shadow-[#FF6B35]/10'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[11px] text-[#FF6B35] flex items-center gap-1 mt-1 font-medium animate-fade-in">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            {/* Stagger 2: Password Field */}
                            <div className="space-y-1.5 animate-fade-up delay-3">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-white/90 tracking-wide"
                                >
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors duration-200">
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
                                        className={`w-full bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.18] border rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-white/45 outline-none backdrop-blur-sm shadow-inner transition-all duration-200 ease-out ${
                                            errors.password
                                                ? 'border-[#E63946] focus:ring-2 focus:ring-[#E63946]/50 shadow-red-500/10'
                                                : 'border-white/20 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/40 focus:shadow-lg focus:shadow-[#FF6B35]/10'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4 transition-transform" />
                                        ) : (
                                            <Eye className="w-4 h-4 transition-transform" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[11px] text-[#FF6B35] flex items-center gap-1 mt-1 font-medium animate-fade-in">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>

                            {/* Stagger 3: Remember Me and Forgot Password Row */}
                            <div className="flex items-center justify-between text-xs pt-0.5 animate-fade-up delay-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none group">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#2455C5] focus:ring-[#FF6B35]/60 focus:ring-offset-0 cursor-pointer transition-all duration-200 checked:scale-105 active:scale-90"
                                    />
                                    <span className="text-white/85 group-hover:text-white transition-colors duration-200 font-medium">
                                        Remember Me
                                    </span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={request ? request() : '/forgot-password'}
                                        className="text-white/85 hover:text-white hover:underline transition-colors duration-200 font-medium"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>

                            {/* Stagger 4: Sign In Button */}
                            <div className="animate-fade-up delay-5">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-[#2455C5] shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 ease-out flex items-center justify-center gap-2 tracking-wide cursor-pointer select-none"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-[#2455C5]" />
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        <span>Sign In</span>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Stagger 5: Additional Information Section */}
                        <div className="mt-4 pt-3.5 border-t border-white/15 space-y-2.5 animate-fade-up delay-6">
                            {/* Staff Access note */}
                            <p className="text-[11px] text-white/75 text-center leading-relaxed">
                                <span className="font-semibold text-white">Staff Access:</span> Admin, Dispatcher, and Responder accounts are provided by the MDRRMO Administrator.
                            </p>

                            {/* Resident Mobile App Promo Card */}
                            <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/[0.13] border border-white/15 text-left flex items-start gap-2.5 shadow-sm transition-all duration-200">
                                <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/25 border border-[#FF6B35]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Smartphone className="w-3.5 h-3.5 text-[#FF6B35]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-white tracking-wide">
                                        Are you an Opol Resident?
                                    </p>
                                    <p className="text-[10px] text-white/80 leading-snug mt-0.5">
                                        Create your resident account, report emergencies, and track dispatched ambulances through the{' '}
                                        <span className="font-semibold text-white underline decoration-white/40 hover:decoration-white transition-colors">
                                            MDRRMO Mobile App
                                        </span>
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* EMBEDDED KEYFRAME STYLES FOR SMOOTH TRANSITIONS & REDUCED MOTION */}
            {/* ========================================================= */}
            <style>{`
                /* Container Fade & Subtle Scale */
                @keyframes containerEntrance {
                    0% {
                        opacity: 0;
                        transform: scale(0.975);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                /* Left Panel Slide */
                @keyframes panelSlideLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-18px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                /* Right Panel Slide */
                @keyframes panelSlideRight {
                    0% {
                        opacity: 0;
                        transform: translateX(18px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                /* Logo Scale-In */
                @keyframes logoScaleIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                /* Fade-In Upward for Text & Staggered Elements */
                @keyframes fadeInUpward {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Simple Fade-In */
                @keyframes simpleFadeIn {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                /* Slow Ambient Background Drift Keyframes */
                @keyframes ambientDrift1 {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    50% {
                        transform: translate(24px, -28px) scale(1.06);
                    }
                }

                @keyframes ambientDrift2 {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    50% {
                        transform: translate(-26px, 22px) scale(1.05);
                    }
                }

                @keyframes ambientDrift3 {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    50% {
                        transform: translate(16px, 20px) scale(1.04);
                    }
                }

                /* Animation Utility Classes */
                .animate-container {
                    animation: containerEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .animate-slide-left {
                    animation: panelSlideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .animate-slide-right {
                    animation: panelSlideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .animate-logo {
                    animation: logoScaleIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
                }

                .animate-fade-up {
                    animation: fadeInUpward 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .animate-fade-in {
                    animation: simpleFadeIn 0.4s ease-out both;
                }

                .animate-ambient-drift-1 {
                    animation: ambientDrift1 20s ease-in-out infinite;
                }

                .animate-ambient-drift-2 {
                    animation: ambientDrift2 24s ease-in-out infinite;
                }

                .animate-ambient-drift-3 {
                    animation: ambientDrift3 28s ease-in-out infinite;
                }

                /* Staggered Delay Helpers */
                .delay-1 {
                    animation-delay: 100ms;
                }

                .delay-2 {
                    animation-delay: 180ms;
                }

                .delay-3 {
                    animation-delay: 260ms;
                }

                .delay-4 {
                    animation-delay: 340ms;
                }

                .delay-5 {
                    animation-delay: 420ms;
                }

                .delay-6 {
                    animation-delay: 500ms;
                }

                /* Accessibility: Respect Reduced Motion Preferences */
                @media (prefers-reduced-motion: reduce) {
                    .animate-container,
                    .animate-slide-left,
                    .animate-slide-right,
                    .animate-logo,
                    .animate-fade-up,
                    .animate-fade-in,
                    .animate-ambient-drift-1,
                    .animate-ambient-drift-2,
                    .animate-ambient-drift-3 {
                        animation: none !important;
                        transition: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default function Login(props: LoginProps) {
    return (
        <ThemeProvider>
            <Head title="Sign In - MDRRMO Opol EMS" />
            <LoginForm {...props} />
        </ThemeProvider>
    );
}
