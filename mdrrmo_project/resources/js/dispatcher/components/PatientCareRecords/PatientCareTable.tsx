import React, { useState } from 'react';
import { ClipboardList, Eye, Building2, User, Truck, FileText } from 'lucide-react';
import { router } from '@inertiajs/react';
import DataTable, { Column } from '@/shared/components/DataTable';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import SearchInput from '@/shared/components/SearchInput';
import Pagination from '@/shared/components/Pagination';
import PatientCareRecordDetailsModal from '@/dispatcher/components/PatientCareRecords/PatientCareRecordDetailsModal';
import { toPascalCase } from '@/shared/utils/utils';

interface PatientCareTableProps {
    records?: any[];
    pagination?: any;
}

export default function PatientCareTable({ records = [], pagination = null }: PatientCareTableProps) {
    const [search, setSearch] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    const filtered = records.filter((r) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        const patientName = r.patient ? `${r.patient.first_name} ${r.patient.last_name}`.toLowerCase() : '';
        const complaint = (r.chief_complaint || '').toLowerCase();
        const nature = (r.nature_of_call || '').toLowerCase();
        const dest = (r.transported_to || '').toLowerCase();
        return patientName.includes(q) || complaint.includes(q) || nature.includes(q) || dest.includes(q);
    });

    const columns: Column<any>[] = [
        {
            key: 'id',
            header: '#',
            sortable: true,
            render: (v) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">#{v}</span>,
        },
        {
            key: 'patient',
            header: 'Patient',
            sortable: true,
            render: (v, row) => (
                v ? (
                    <div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.get(`/dispatcher/patients/${v.id}`);
                            }}
                            className="font-semibold text-slate-900 dark:text-white hover:text-[#F61509] transition-colors text-left capitalize cursor-pointer"
                        >
                            {toPascalCase(`${v.first_name} ${v.last_name}`)}
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                            {v.gender ? <span className="capitalize">{v.gender}</span> : ''}
                            {v.barangay?.barangay_name ? ` • Brgy. ${toPascalCase(v.barangay.barangay_name)}` : ''}
                        </p>
                    </div>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">Unlinked Patient</span>
                )
            ),
        },
        {
            key: 'nature_of_call',
            header: 'Nature / Complaint',
            render: (_, row) => {
                const complaints = (row.chief_complaint || '')
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean);

                return (
                    <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-[#F61509] border border-rose-500/20 inline-block">
                            {toPascalCase(row.nature_of_call || 'Emergency')}
                        </span>
                        {complaints.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500">—</p>
                        ) : complaints.length === 1 ? (
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={complaints[0]}>
                                {toPascalCase(complaints[0])}
                            </p>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-nowrap" title={row.chief_complaint}>
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                                    {toPascalCase(complaints[0])}
                                </span>
                                <div className="relative group inline-block">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-help hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        +{complaints.length - 1} more
                                    </span>
                                    {/* Hover Tooltip / Popover */}
                                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex flex-col z-50 min-w-[180px] max-w-xs bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-2xl border border-slate-800 pointer-events-none">
                                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                All Complaints
                                            </span>
                                            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded-full border border-rose-500/30">
                                                {complaints.length} Total
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {complaints.map((c: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 text-slate-200 text-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                    <span className="truncate">{toPascalCase(c)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'transported',
            header: 'Transport Status',
            render: (v, row) => (
                v ? (
                    <div className="text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> Transported
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[150px] capitalize">
                            {toPascalCase(row.transported_to || 'Health Facility')}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Non-transport / Scene</span>
                )
            ),
        },
        {
            key: 'dispatch',
            header: 'Assigned Unit',
            render: (_, row) => (
                row.dispatch?.ambulance ? (
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 capitalize">
                        <Truck className="w-3.5 h-3.5 text-[#F61509]" />
                        {toPascalCase(row.dispatch.ambulance.vehicle_name || row.dispatch.ambulance.plate_number)}
                    </span>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                )
            ),
        },
        {
            key: 'created_at',
            header: 'Recorded Date',
            sortable: true,
            render: (v) => (
                v ? (
                    <div>
                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                            {new Date(v).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                            {new Date(v).toLocaleTimeString('en-PH', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Action',
            render: (_, row) => (
                <Button
                    size="xs"
                    variant="secondary"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(row);
                    }}
                    className="group-hover:border-[#F61509]/40 group-hover:text-[#F61509] text-xs font-semibold"
                >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Patient Care Records"
                subtitle="View and audit all emergency treatment and care records submitted by responder teams."
            />
            <Card padding={false} className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <SearchInput
                        placeholder="Search by patient, complaint, hospital..."
                        onChange={setSearch}
                        className="flex-1 max-w-sm"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Total records: <span className="text-slate-900 dark:text-white font-semibold">{filtered.length}</span>
                    </span>
                </div>
                <div className="p-4">
                    <DataTable
                        columns={columns}
                        data={filtered}
                        keyField="id"
                        emptyTitle="No care records found"
                        emptyDescription="No PCR entries match your current search."
                        emptyIcon={ClipboardList}
                        onRowClick={(row) => setSelectedRecord(row)}
                    />
                    {pagination && (
                        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
                            <Pagination
                                {...pagination}
                                onPageChange={(page) => router.get(window.location.pathname, { page })}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Complete PCR Modal */}
            <PatientCareRecordDetailsModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
        </div>
    );
}
