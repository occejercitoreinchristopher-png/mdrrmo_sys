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

    const latestPcrDate = care_records.length > 0 && (care_records[0].record_date || care_records[0].created_at)
        ? new Date(care_records[0].record_date || care_records[0].created_at).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : 'None';

    const [copied, setCopied] = useState(false);

    const handleCopyPhone = () => {
        if (!patient.contact_number) return;
        navigator.clipboard.writeText(patient.contact_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DispatcherLayout title={`Patient: ${patient.full_name}`}>
            <div className="space-y-6 pb-12">
                {/* Back Navigation & Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/dispatcher/patients"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-150 group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Patients</span>
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Patient ID:</span>
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-white/10">
                            #{patient.id}
                        </span>
                    </div>
                </div>

                {/* Patient Profile Header Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-[#0d1527] via-[#101b33] to-[#141b2d] p-6 sm:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/25 border border-white/20">
                                <span className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                                    {patient.first_name?.[0] || 'P'}
                                    {patient.last_name?.[0] || ''}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                        {patient.full_name}
                                    </h1>
                                    {patient.registered_user ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                            <UserCheck className="w-3.5 h-3.5" /> Registered Resident
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/10">
                                            Community Patient
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                                    {patient.age !== null && (
                                        <span className="font-semibold text-rose-300">
                                            {patient.age} years old
                                        </span>
                                    )}
                                    {patient.gender && (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className="capitalize text-slate-300">{patient.gender}</span>
                                        </>
                                    )}
                                    {patient.barangay && (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className="flex items-center gap-1 text-slate-300">
                                                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                                {patient.barangay}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Stats Badges */}
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                            {patient.contact_number && (
                                <button
                                    type="button"
                                    onClick={handleCopyPhone}
                                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-semibold text-xs transition-all border border-white/10 hover:border-white/20 shadow-md group"
                                    title="Copy phone number"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span className="text-emerald-300 font-medium">Copied {patient.contact_number}!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                            <span>Copy Phone ({patient.contact_number})</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                                <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block">
                                    Care Records
                                </span>
                                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                                    {care_records.length}
                                </span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[120px]">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                    Last Response
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-white mt-1 block">
                                    {latestPcrDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout: 2 Columns on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Comprehensive Patient Information Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card padding={false} className="border-white/10 bg-slate-900/80 shadow-xl overflow-hidden">
                            <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-rose-400" /> Patient Profile
                                </h2>
                                <span className="text-[11px] text-slate-400">Master Record</span>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                <div className="space-y-1">
                                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                                        Full Name
                                    </span>
                                    <p className="font-semibold text-white text-sm">{patient.full_name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                    <div>
                                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                                            Birthdate
                                        </span>
                                        <p className="font-medium text-slate-200 mt-0.5">{formattedBirthdate}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                                            Age / Gender
                                        </span>
                                        <p className="font-medium text-slate-200 mt-0.5">
                                            {patient.age ? `${patient.age} yrs` : '—'} • {patient.gender ? <span className="capitalize">{patient.gender}</span> : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/5">
                                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold mb-1">
                                        Contact Number
                                    </span>
                                    {patient.contact_number ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-rose-400" />
                                                {patient.contact_number}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyPhone}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-xs"
                                                title="Copy phone number"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-emerald-400 text-[11px]">Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[11px]">Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 italic">No contact number on record</span>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-white/5 space-y-2">
                                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                                        Residential Address
                                    </span>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1.5">
                                        <div className="flex items-start gap-2">
                                            <Home className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-slate-200 font-medium">
                                                    {patient.address || 'Address details not fully specified'}
                                                </p>
                                                <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                                                    {patient.house_no && <p>House No: {patient.house_no}</p>}
                                                    {patient.street && <p>Street: {patient.street}</p>}
                                                    {patient.barangay && <p>Barangay: {patient.barangay}</p>}
                                                    <p className="text-slate-500">Balingasag, Misamis Oriental</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Linked App User Account Details */}
                                {patient.registered_user && (
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                                            Linked Resident Account
                                        </span>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1">
                                            <p className="font-semibold text-white flex items-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                {patient.registered_user.name}
                                            </p>
                                            <p className="text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {patient.registered_user.email}
                                            </p>
                                            {patient.registered_user.phone_number && (
                                                <p className="text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {patient.registered_user.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Registered: {formattedRegisteredDate}</span>
                                    <span>
                                        {patient.updated_at
                                            ? `Updated: ${new Date(patient.updated_at).toLocaleDateString('en-PH')}`
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Patient Care Record History Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-rose-400" /> Patient Care Record History
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Chronological timeline of all medical incidents and PCR submissions for this patient.
                                </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
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
