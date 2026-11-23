import React, { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Search,
    X,
    RotateCcw,
    ChevronRight,
    Copy,
    Check,
    UserCheck,
    Users,
    CheckCircle2,
    UserX,
    Activity,
} from 'lucide-react';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Pagination from '@/shared/components/Pagination';
import Select from '@/shared/components/Select';
import { toPascalCase } from '@/shared/utils/utils';
import { PatientRecord } from './usePatientsQuery';
import IdentifyPatientModal from './IdentifyPatientModal';

interface PatientSummary {
    total: number;
    identified: number;
    unidentified: number;
    pcr_records: number;
}

interface PatientTableProps {
    patients?: PatientRecord[];
    pagination?: any;
    filters?: {
        search?: string;
        status?: string;
    };
    summary?: PatientSummary;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Patients' },
    { value: 'identified', label: 'Identified Only' },
    { value: 'unidentified', label: 'Unidentified / Trauma' },
];

export default function PatientTable({
    patients = [],
    pagination = null,
    filters = {},
    summary,
}: PatientTableProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [identifyingPatient, setIdentifyingPatient] = useState<PatientRecord | null>(null);

    // Debounce search input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Client-side reactive filter for 0ms instantaneous UI updates
    const displayedPatients = useMemo(() => {
        let list = [...patients];

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase().trim();
            list = list.filter((p) => {
                const name = (p.full_name || `${p.first_name} ${p.last_name}`).toLowerCase();
                const phone = (p.contact_number || '').toLowerCase();
                const barangay = (p.barangay || '').toLowerCase();
                const address = (p.address || '').toLowerCase();
                const id = String(p.id);
                return (
                    name.includes(q) ||
                    phone.includes(q) ||
                    barangay.includes(q) ||
                    address.includes(q) ||
                    id === q ||
                    `#${id}`.includes(q)
                );
            });
        }

        if (statusFilter) {
            if (statusFilter === 'unidentified') {
                list = list.filter((p) => Boolean(p.is_unidentified));
            } else if (statusFilter === 'identified') {
                list = list.filter((p) => !p.is_unidentified);
            }
        }

        return list;
    }, [patients, debouncedSearch, statusFilter]);

    const handleClearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setStatusFilter('');
    };

    const isFiltered = Boolean(debouncedSearch || statusFilter);

    const handleCopyPhone = (e: React.MouseEvent, id: number, phone: string) => {
        e.stopPropagation();
        if (!phone) return;
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(phone).then(() => {
                    setCopiedId(id);
                    setTimeout(() => setCopiedId(null), 2000);
                });
            } else {
                const ta = document.createElement('textarea');
                ta.value = phone;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }
        } catch {}
    };

    return (
        <div className="w-full space-y-4 pb-12">
            {/* 1. Page Header */}
            <PageHeader
                title="Patient Management"
                subtitle="Master clinical directory of patient records, identity resolution, and emergency care history."
            />

            {/* Top Clinical Telemetry Ribbon (4 Metric Cards matching Incident Records) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Total Registered Patients */}
                <div
                    onClick={() => setStatusFilter('all')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        statusFilter === 'all'
                            ? 'bg-blue-500/10 border-blue-500/40 shadow-md ring-1 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/40 shadow-xs'
                    }`}
                >
                    <div className="space-y-0.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Patients
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary?.total ?? patients.length}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Clinical Directory
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                </div>

                {/* Card 2: Identified Patients */}
                <div
                    onClick={() => setStatusFilter('identified')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        statusFilter === 'identified'
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 shadow-xs'
                    }`}
                >
                    <div className="space-y-0.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Identified Profiles
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary?.identified ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Verified Identity
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>

                {/* Card 3: Unidentified Patients */}
                <div
                    onClick={() => setStatusFilter('unidentified')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        statusFilter === 'unidentified'
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 shadow-xs'
                    }`}
                >
                    <div className="space-y-0.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Awaiting Identity
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary?.unidentified ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Unidentified Cases
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <UserX className="w-4 h-4" />
                    </div>
                </div>

                {/* Card 4: Total PCR Records */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                            Clinical Care Records
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary?.pcr_records ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            PCR Documentation
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* 2. Main Synchronized DataTable Card (Full Width matching Incident Records) */}
            <Card padding={false} className="w-full bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                {/* Search & Filter Toolbar Header */}
                <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                            Master Patient Directory
                        </h4>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 font-mono">
                            <span>Showing {displayedPatients.length} of {summary?.total ?? patients.length}</span>
                        </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
                        {/* Debounced Search */}
                        <div className="relative flex-1 sm:w-72 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search patient, phone, address..."
                                className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setDebouncedSearch('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Identification Status Filter */}
                        <div className="w-48 sm:w-56">
                            <Select
                                id="patient-status-filter"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={STATUS_OPTIONS}
                                placeholder={null}
                                className="text-xs h-9 py-1.5"
                            />
                        </div>

                        {/* Reset Button */}
                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                title="Reset search and filters"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/60">
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 w-20">
                                    #
                                </th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                    Patient Profile
                                </th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                    Contact Number
                                </th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                    Location / Address
                                </th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 text-center">
                                    Care Records
                                </th>
                                <th className="px-6 py-4 text-right text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                            {displayedPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                No Patients Found
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                                {isFiltered
                                                    ? 'No patient records matched your search or status filter.'
                                                    : 'There are no patient records currently registered in the system.'}
                                            </p>
                                            {isFiltered && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearFilters}
                                                    className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                >
                                                    Clear all filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedPatients.map((patient) => {
                                    const fullName = toPascalCase(
                                        patient.full_name || `${patient.first_name} ${patient.last_name}`
                                    );
                                    const initials = `${patient.first_name?.[0] || 'P'}${patient.last_name?.[0] || ''}`.toUpperCase();
                                    const location =
                                        patient.barangay
                                            ? `Brgy. ${toPascalCase(patient.barangay)}${patient.address ? ` • ${patient.address}` : ''}`
                                            : patient.address || '—';

                                    const pcrCount = patient.care_records_count ?? 0;

                                    return (
                                        <tr
                                            key={patient.id}
                                            onClick={() => router.get(`/dispatcher/patients/${patient.id}`)}
                                            className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                        >
                                            {/* ID */}
                                            <td className="px-6 py-4.5 font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">
                                                #{patient.id}
                                            </td>

                                            {/* Patient Profile */}
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-3.5">
                                                    <div
                                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs font-bold text-xs ${
                                                            patient.is_unidentified
                                                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                                                                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-200/80 dark:border-white/10'
                                                        }`}
                                                    >
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
                                                                {fullName}
                                                            </p>
                                                            {patient.is_unidentified && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                                                    Unidentified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                                                            {patient.gender ? patient.gender : 'Gender unrecorded'}
                                                            {patient.age !== null && patient.age !== undefined
                                                                ? ` • ${patient.age} yrs`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Number */}
                                            <td className="px-6 py-4.5 text-xs font-mono font-medium">
                                                {patient.contact_number ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-900 dark:text-slate-200">
                                                            {patient.contact_number}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleCopyPhone(e, patient.id, patient.contact_number!)
                                                            }
                                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                                            title="Copy phone number"
                                                        >
                                                            {copiedId === patient.id ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500">—</span>
                                                )}
                                            </td>

                                            {/* Barangay / Address */}
                                            <td className="px-6 py-4.5 text-xs text-slate-600 dark:text-slate-300 max-w-[280px]">
                                                <span className="truncate block font-medium" title={location}>
                                                    {location}
                                                </span>
                                            </td>

                                            {/* Care Records */}
                                            <td className="px-6 py-4.5 text-center">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                        pcrCount > 0
                                                            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200/60 dark:border-white/5'
                                                    }`}
                                                >
                                                    {pcrCount} {pcrCount === 1 ? 'PCR' : 'PCRs'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4.5 text-right">
                                                <div
                                                    className="flex items-center justify-end gap-1.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {patient.is_unidentified && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => setIdentifyingPatient(patient)}
                                                            className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 cursor-pointer px-3 py-1.5"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                                                            <span>Identify</span>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => router.get(`/dispatcher/patients/${patient.id}`)}
                                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors px-3 py-1.5"
                                                    >
                                                        <span>Details</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && !debouncedSearch && (
                    <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                        <Pagination
                            {...pagination}
                            onPageChange={(page) =>
                                router.get(
                                    window.location.pathname,
                                    { page, ...(statusFilter ? { status: statusFilter } : {}) },
                                    { preserveState: true, preserveScroll: true }
                                )
                            }
                        />
                    </div>
                )}
            </Card>

            {/* Identify Patient Modal */}
            {identifyingPatient && (
                <IdentifyPatientModal
                    open={Boolean(identifyingPatient)}
                    onClose={() => setIdentifyingPatient(null)}
                    patient={identifyingPatient}
                />
            )}
        </div>
    );
}
