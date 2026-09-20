import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Heart,
    Eye,
    MapPin,
    Phone,
    User,
    Calendar,
    FileText,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import DataTable, { Column } from '@/shared/components/DataTable';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import { toPascalCase } from '@/shared/utils/utils';
import { usePatientsQuery, PatientRecord } from './usePatientsQuery';

interface PatientTableProps {
    patients?: PatientRecord[];
    pagination?: any;
}

export default function PatientTable({ patients = [], pagination = null }: PatientTableProps) {
    const {
        patients: queryPatients,
        search,
        setSearch,
        debouncedSearch,
        clearSearch,
        isLoading,
        isSearching,
    } = usePatientsQuery({
        initialData: patients,
        debounceMs: 300,
    });

    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopyPhone = (e: React.MouseEvent, id: number, phone: string) => {
        e.stopPropagation();
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const columns: Column<PatientRecord>[] = [
        {
            key: 'id',
            header: '#',
            sortable: true,
            render: (v) => (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">#{v}</span>
            ),
        },
        {
            key: 'name',
            header: 'Patient Name',
            sortable: true,
            render: (_, row) => {
                const name = toPascalCase(row.full_name || `${row.first_name} ${row.last_name}`);
                const initials = `${row.first_name?.[0] || 'P'}${row.last_name?.[0] || ''}`.toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 border border-slate-200/80 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-xs ring-1 ring-slate-900/10 dark:ring-white/20">
                            <span>{initials}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-[#F61509] transition-colors capitalize">
                                {name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {row.gender ? <span className="capitalize">{row.gender}</span> : 'Gender unrecorded'}
                                {row.age !== null && row.age !== undefined ? ` • ${row.age} yrs` : ''}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'age_gender',
            header: 'Demographics',
            render: (_, row) => (
                <div className="text-xs space-y-0.5">
                    <span className="text-slate-800 dark:text-slate-200 font-medium block">
                        {row.age !== null && row.age !== undefined ? `${row.age} yrs old` : 'Age unrecorded'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {row.gender || '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'contact_number',
            header: 'Contact Number',
            render: (v, row) => (
                v ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-200 text-xs font-mono font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#F61509] flex-shrink-0" />
                            <span>{v}</span>
                        </span>

                        {/* Copy Phone Button */}
                        <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, row.id, v)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-white/10 transition-colors text-xs font-medium cursor-pointer"
                            title="Copy phone number"
                        >
                            {copiedId === row.id ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[11px]">Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">No phone on record</span>
                )
            ),
        },
        {
            key: 'barangay',
            header: 'Barangay',
            sortable: true,
            render: (v) => (
                v ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium capitalize text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#F61509] flex-shrink-0" />
                        {toPascalCase(v)}
                    </span>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">—</span>
                )
            ),
        },
        {
            key: 'address',
            header: 'Address',
            render: (v, row) => {
                const addr = v || [row.house_no, row.street, row.barangay].filter(Boolean).join(', ');
                return (
                    <span className="text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate block capitalize" title={addr || ''}>
                        {addr ? toPascalCase(addr) : '—'}
                    </span>
                );
            },
        },
        {
            key: 'care_records_count',
            header: 'Care Records',
            sortable: true,
            render: (v) => (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-[#F61509] border border-rose-500/20">
                    <FileText className="w-3 h-3" />
                    {v ?? 0} {v === 1 ? 'PCR' : 'PCRs'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, row) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => router.get(`/dispatcher/patients/${row.id}`)}
                        className="group-hover:border-[#F61509]/40 group-hover:text-[#F61509] text-xs font-semibold"
                    >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Patient Management"
                subtitle="Master directory of patient profiles, fast debounced search, quick calling, and previous emergency care records."
            />
            <Card padding={false} className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm rounded-2xl overflow-hidden">
                {/* Search Bar with TanStack Query & Debounce */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <div className="relative flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by patient name, phone, or barangay..."
                                className="w-full bg-white dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F61509]/30 focus:border-[#F61509] transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                {isSearching ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F61509]" />
                                ) : (
                                    <Phone className="w-3.5 h-3.5" />
                                )}
                            </div>
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        {debouncedSearch && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-[#F61509] border border-rose-500/20 text-[11px] font-semibold">
                                Filtered by: &quot;{debouncedSearch}&quot;
                            </span>
                        )}
                        <span className="text-slate-500 dark:text-slate-400">
                            Showing <span className="text-slate-900 dark:text-white font-semibold">{queryPatients.length}</span> patients
                        </span>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl shadow-lg">
                                <Loader2 className="w-4 h-4 text-[#F61509] animate-spin" />
                                <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Searching patients...</span>
                            </div>
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={queryPatients}
                        keyField="id"
                        emptyTitle="No patients found"
                        emptyDescription={
                            debouncedSearch
                                ? `No patient profiles match "${debouncedSearch}".`
                                : "There are no patient records currently registered."
                        }
                        emptyIcon={Heart}
                        onRowClick={(row) => router.get(`/dispatcher/patients/${row.id}`)}
                    />

                    {pagination && !debouncedSearch && (
                        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
                            <Pagination
                                {...pagination}
                                onPageChange={(page) => router.get(window.location.pathname, { page }, { preserveState: true })}
                            />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
