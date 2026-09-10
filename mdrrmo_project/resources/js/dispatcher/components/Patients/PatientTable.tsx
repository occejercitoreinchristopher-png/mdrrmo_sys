import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Heart,
    Eye,
    MapPin,
    Phone,
    PhoneCall,
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
                <span className="font-mono text-xs text-slate-400 font-semibold">#{v}</span>
            ),
        },
        {
            key: 'name',
            header: 'Patient Name',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-rose-300 uppercase">
                            {row.first_name?.[0] || 'P'}
                            {row.last_name?.[0] || ''}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                            {row.full_name || `${row.first_name} ${row.last_name}`}
                        </p>
                        <p className="text-[11px] text-slate-400">
                            {row.gender ? <span className="capitalize">{row.gender}</span> : 'Gender unrecorded'}
                            {row.age !== null && row.age !== undefined ? ` • ${row.age} yrs` : ''}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'age_gender',
            header: 'Demographics',
            render: (_, row) => (
                <div className="text-xs space-y-0.5">
                    <span className="text-slate-200 font-medium block">
                        {row.age !== null && row.age !== undefined ? `${row.age} yrs old` : 'Age unrecorded'}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">
                        {row.gender || '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'contact_number',
            header: 'Contact & Quick Call',
            render: (v, row) => (
                v ? (
                    <div className="flex items-center gap-2">
                        {/* Quick Direct Call Button */}
                        <a
                            href={`tel:${v}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-all text-xs font-mono font-semibold group/call"
                            title={`Call ${v} directly`}
                        >
                            <PhoneCall className="w-3.5 h-3.5 group-hover/call:scale-110 transition-transform" />
                            <span>{v}</span>
                        </a>

                        {/* Copy Phone Icon */}
                        <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, row.id, v)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Copy phone number"
                        >
                            {copiedId === row.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-500 text-xs italic">No phone on record</span>
                )
            ),
        },
        {
            key: 'barangay',
            header: 'Barangay',
            sortable: true,
            render: (v) => (
                v ? (
                    <span className="text-xs text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        {v}
                    </span>
                ) : (
                    <span className="text-slate-500 text-xs italic">—</span>
                )
            ),
        },
        {
            key: 'address',
            header: 'Address',
            render: (v, row) => (
                <span className="text-xs text-slate-300 max-w-[200px] truncate block" title={v || ''}>
                    {v || [row.house_no, row.street, row.barangay].filter(Boolean).join(', ') || '—'}
                </span>
            ),
        },
        {
            key: 'care_records_count',
            header: 'Care Records',
            sortable: true,
            render: (v) => (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
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
                    {row.contact_number && (
                        <a
                            href={`tel:${row.contact_number}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                            title="Call Patient"
                        >
                            <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                    )}
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => router.get(`/dispatcher/patients/${row.id}`)}
                        className="hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all text-xs shadow-sm"
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
            <Card padding={false} className="border-white/10 bg-slate-900/60 shadow-xl overflow-hidden">
                {/* Search Bar with TanStack Query & Debounce */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-white/5">
                    <div className="relative flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by patient name, phone, or barangay..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40 transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                {isSearching ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                ) : (
                                    <Phone className="w-3.5 h-3.5" />
                                )}
                            </div>
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        {debouncedSearch && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                                Filtered by: &quot;{debouncedSearch}&quot;
                            </span>
                        )}
                        <span className="text-slate-400">
                            Showing <span className="text-white font-semibold">{queryPatients.length}</span> patients
                        </span>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-slate-800 border border-white/10 px-4 py-2 rounded-xl shadow-lg">
                                <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                                <span className="text-xs text-slate-200 font-medium">Searching patients...</span>
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
                        <div className="mt-4 pt-4 border-t border-white/10">
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
