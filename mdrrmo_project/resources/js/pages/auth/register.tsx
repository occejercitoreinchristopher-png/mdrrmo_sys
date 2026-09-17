import { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { login } from '@/routes';

interface RegisterProps {
    passwordRules?: string;
}

export default function Register({ passwordRules }: RegisterProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [termsError, setTermsError] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        birthdate: '',
        age: '',
        phone_number: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const isPasswordLongEnough = data.password.length >= 8;
    const doPasswordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

    const maxDate = new Date().toISOString().split('T')[0];

    const handleBirthdateChange = (val: string) => {
        let calculatedAge = data.age;
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
            }
        }
        setData((prev) => ({ ...prev, birthdate: val, age: calculatedAge }));
    };

    const handleAgeChange = (val: string) => {
        const cleanVal = val.replace(/[^0-9]/g, '');
        setData('age', cleanVal);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setTermsError('You must agree to the Terms of Service and Privacy Policy to create an account.');
            return;
        }
        setTermsError('');

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Resident Registration - MDRRMO Opol EMS" />

            <div className="w-full max-w-xl">
                <Card className="p-6 sm:p-8 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 mb-3">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Resident Registration Only
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Create Resident Account
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                            Register as an Opol resident to request emergency medical assistance, track dispatches, and access community safety services.
                        </p>
                    </div>

                    {/* Form-level Error Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Please correct the following errors:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] opacity-90">
                                    {Object.entries(errors).map(([key, msg]) => (
                                        <li key={key}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {termsError && (
                        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{termsError}</span>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* First Name */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="first_name"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    First Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="first_name"
                                    type="text"
                                    name="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    placeholder="Juan"
                                    required
                                    autoFocus
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.first_name
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                {errors.first_name && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.first_name}</p>
                                )}
                            </div>

                            {/* Middle Name */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="middle_name"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Middle Name <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="middle_name"
                                    type="text"
                                    name="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) => setData('middle_name', e.target.value)}
                                    placeholder="Santos"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="last_name"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Last Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="last_name"
                                    type="text"
                                    name="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    placeholder="Dela Cruz"
                                    required
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.last_name
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                {errors.last_name && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.last_name}</p>
                                )}
                            </div>
                        </div>

                        {/* Birthday and Age Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Birthday */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="birthdate"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Birthday <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="birthdate"
                                    type="date"
                                    max={maxDate}
                                    name="birthdate"
                                    value={data.birthdate}
                                    onChange={(e) => handleBirthdateChange(e.target.value)}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.birthdate
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                {errors.birthdate && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.birthdate}</p>
                                )}
                            </div>

                            {/* Age */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="age"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Age <span className="text-[10px] text-slate-400 font-normal">(Numbers only)</span>
                                </label>
                                <input
                                    id="age"
                                    type="text"
                                    inputMode="numeric"
                                    name="age"
                                    value={data.age}
                                    onChange={(e) => handleAgeChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                                        if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder="Auto-calculated or enter age"
                                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                        errors.age
                                            ? 'border-rose-500/60'
                                            : 'border-slate-300/80 dark:border-white/10'
                                    }`}
                                />
                                {errors.age && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.age}</p>
                                )}
                            </div>
                        </div>

                        {/* Contact Information Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Phone Number */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="phone_number"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="phone_number"
                                        type="tel"
                                        name="phone_number"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        placeholder="09XXXXXXXXX"
                                        autoComplete="tel"
                                        required
                                        className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                            errors.phone_number
                                                ? 'border-rose-500/60'
                                                : 'border-slate-300/80 dark:border-white/10'
                                        }`}
                                    />
                                </div>
                                {errors.phone_number && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.phone_number}</p>
                                )}
                            </div>

                            {/* Email Address */}
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
                                        placeholder="resident@example.com"
                                        autoComplete="email"
                                        required
                                        className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 ${
                                            errors.email
                                                ? 'border-rose-500/60'
                                                : 'border-slate-300/80 dark:border-white/10'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Password <span className="text-rose-500">*</span>
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

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Confirm Password <span className="text-rose-500">*</span>
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
                                        placeholder="Repeat password"
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
                        </div>

                        {/* Password Requirements Indicator */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">Password checklist:</span>
                            <span className={`inline-flex items-center gap-1 ${isPasswordLongEnough ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                {isPasswordLongEnough ? <Check className="w-3 h-3" /> : '•'} 8+ characters
                            </span>
                            <span className={`inline-flex items-center gap-1 ${doPasswordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                {doPasswordsMatch ? <Check className="w-3 h-3" /> : '•'} Passwords match
                            </span>
                        </div>

                        {/* Terms & Privacy Agreement */}
                        <div className="pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => {
                                        setAgreedToTerms(e.target.checked);
                                        if (e.target.checked) setTermsError('');
                                    }}
                                    className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-white/20 text-rose-600 focus:ring-rose-500/40 bg-slate-50 dark:bg-white/5 cursor-pointer transition-colors"
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                    I agree to the <span className="font-medium text-slate-800 dark:text-slate-200">MDRRMO Terms of Service</span> and <span className="font-medium text-slate-800 dark:text-slate-200">Privacy Policy</span> for emergency medical assistance and resident data protection.
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
                            className="w-full justify-center py-2.5 mt-3 text-sm font-semibold tracking-wide shadow-md shadow-rose-500/20"
                        >
                            {processing ? 'Creating Account...' : 'Create Resident Account'}
                        </Button>
                    </form>

                    {/* Footer Navigation */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link
                                href={login ? login() : '/login'}
                                className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 inline-flex items-center gap-1 transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Sign In
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </>
    );
}
