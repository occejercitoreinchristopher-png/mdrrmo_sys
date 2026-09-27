import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import PatientHistory from '@/dispatcher/components/Patients/PatientHistory';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Heart,
    Home,
    Mail,
    MapPin,
    Phone,
    Shield,
    Sparkles,
    User,
    UserCheck,
    Copy,
    Check,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

interface PatientDetailsProps {
    patient: {
        id: number;
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        full_name: string;
        birthdate?: string | null;
        age?: number | null;
        gender?: string | null;
        contact_number?: string | null;
        barangay?: string | null;
        house_no?: string | null;
        street?: string | null;
        address?: string | null;
        care_records_count?: number;
        created_at?: string | null;
        updated_at?: string | null;
        registered_user?: {
            id: number;
            name: string;
            email: string;
            phone_number?: string | null;
        } | null;
    };
    care_records: any[];
}

export default function PatientDetailsPage({ patient, care_records = [] }: PatientDetailsProps) {
    const formattedBirthdate = patient.birthdate
        ? new Date(patient.birthdate).toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Not recorded';

    const formattedRegisteredDate = patient.created_at
        ? new Date(patient.created_at).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : '—';

    const rawPcrDate = care_records.length > 0 ? (care_records[0].record_date || care_records[0].created_at) : null;
    const latestPcrDate = rawPcrDate
        ? new Date(typeof rawPcrDate === 'string' && rawPcrDate.includes('-') && !rawPcrDate.includes('T') ? rawPcrDate.replace(/-/g, '/') : rawPcrDate).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'None';

    const [copied, setCopied] = useState(false);

    const handleCopyPhone = () => {
        if (!patient.contact_number) return;
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(patient.contact_number).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }).catch(() => {
                    fallbackCopy(patient.contact_number!);
                });
            } else {
                fallbackCopy(patient.contact_number);
            }
        } catch {
            fallbackCopy(patient.contact_number);
        }
    };

    const fallbackCopy = (text: string) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const formattedPatientName = toPascalCase(patient.full_name || `${patient.first_name} ${patient.last_name}`);
    const formattedBarangay = patient.barangay ? toPascalCase(patient.barangay) : null;

    return (
        <DispatcherLayout title={`Patient: ${formattedPatientName}`}>
            <div className="space-y-6 pb-12 max-w-7xl mx-auto">
                {/* Back Navigation & Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/dispatcher/patients"
                        className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-150 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Patients</span>
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Patient ID:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-white/10 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-sm">
                            #{patient.id}
                        </span>
                    </div>
                </div>

                {/* Patient Profile Header Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#090e1a] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl p-6 md:p-8">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md ring-1 ring-slate-900/10 dark:ring-white/20">
                                <span className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                                    {patient.first_name?.[0] || 'P'}
                                    {patient.last_name?.[0] || ''}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">
                                        {formattedPatientName}
                                    </h1>
                                    {patient.registered_user ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <UserCheck className="w-3.5 h-3.5" /> Registered Resident
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-[#F61509] border border-rose-500/20">
                                            Community Patient
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {patient.age !== null && (
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {patient.age} years old
                                        </span>
                                    )}
                                    {patient.gender && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{patient.gender}</span>
                                        </>
                                    )}
                                    {formattedBarangay && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                                                <MapPin className="w-3.5 h-3.5 text-[#F61509]" />
                                                Brgy. {formattedBarangay}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Stats Badges */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {patient.contact_number && (
                                <button
                                    type="button"
                                    onClick={handleCopyPhone}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white border border-slate-200/80 dark:border-white/10 font-semibold text-xs transition-all shadow-sm cursor-pointer group"
                                    title="Copy phone number"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
                                            <span>Copy Phone ({patient.contact_number})</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-center min-w-[95px]">
                                <span className="block text-xl font-bold text-slate-900 dark:text-white font-mono">
                                    {care_records.length}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                                    Care Records
                                </span>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center min-w-[105px]">
                                <span className="block text-sm font-bold text-[#F61509] mt-0.5">
                                    {latestPcrDate}
                                </span>
                                <span className="text-[10px] text-[#F61509] uppercase tracking-wider font-semibold">
                                    Last Response
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout: 2 Columns on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Comprehensive Patient Information Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] flex items-center justify-between">
                                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#F61509]" /> Patient Profile
                                </h2>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Master Record</span>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                <div className="space-y-1">
                                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold">
                                        Full Name
                                    </span>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm capitalize">{formattedPatientName}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold">
                                            Birthdate
                                        </span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formattedBirthdate}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold">
                                            Age / Gender
                                        </span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                            {patient.age ? `${patient.age} yrs` : '—'} • {patient.gender ? <span className="capitalize">{patient.gender}</span> : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-1">
                                        Contact Number
                                    </span>
                                    {patient.contact_number ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-slate-900 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-[#F61509]" />
                                                {patient.contact_number}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyPhone}
                                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                                title="Copy phone number"
                                            >
                                                {copied ? (
                                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500 italic">No contact number on record</span>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold">
                                        Residential Address
                                    </span>
                                    <div className="bg-slate-50/70 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/5 space-y-1.5">
                                        <div className="flex items-start gap-2.5">
                                            <Home className="w-4 h-4 text-[#F61509] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-slate-900 dark:text-slate-200 font-semibold capitalize">
                                                    {patient.address ? toPascalCase(patient.address) : 'Address details not fully specified'}
                                                </p>
                                                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                                                    {patient.house_no && <p>House No: <span className="font-medium text-slate-800 dark:text-slate-300">{patient.house_no}</span></p>}
                                                    {patient.street && <p>Street: <span className="font-medium text-slate-800 dark:text-slate-300">{toPascalCase(patient.street)}</span></p>}
                                                    {formattedBarangay && <p>Barangay: <span className="font-medium text-slate-800 dark:text-slate-300">{formattedBarangay}</span></p>}
                                                    <p className="text-slate-500 dark:text-slate-500">Opol, Misamis Oriental</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Linked App User Account Details */}
                                {patient.registered_user && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-bold">
                                            Linked Resident Account
                                        </span>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs space-y-1.5">
                                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 capitalize">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                {toPascalCase(patient.registered_user.name)}
                                            </p>
                                            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {patient.registered_user.email}
                                            </p>
                                            {patient.registered_user.phone_number && (
                                                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {patient.registered_user.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>Registered: {formattedRegisteredDate}</span>
                                    <span>
                                        {patient.updated_at
                                            ? `Updated: ${new Date(patient.updated_at).toLocaleDateString('en-PH')}`
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Patient Care Record History Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#F61509]" /> Patient Care Record History
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Chronological timeline of all medical incidents and PCR submissions for this patient.
                                </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                                {care_records.length} {care_records.length === 1 ? 'Record' : 'Records'} on file
                            </span>
                        </div>

                        {/* Renders chronological history */}
                        <PatientHistory records={care_records} />
                    </div>
                </div>
            </div>
        </DispatcherLayout>
    );
}
