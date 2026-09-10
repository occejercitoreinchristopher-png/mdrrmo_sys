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
            render: (v) => <span className="font-mono text-xs text-slate-400 font-semibold">#{v}</span>,
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
                            className="font-medium text-white hover:text-rose-400 transition-colors text-left"
                        >
                            {v.first_name} {v.last_name}
                        </button>
                        <p className="text-[11px] text-slate-400">
                            {v.gender ? <span className="capitalize">{v.gender}</span> : ''}
                            {v.barangay?.barangay_name ? ` • ${v.barangay.barangay_name}` : ''}
                        </p>
                    </div>
                ) : (
                    <span className="text-slate-500 text-xs italic">Unlinked Patient</span>
                )
            ),
        },
        {
            key: 'nature_of_call',
            header: 'Nature / Complaint',
            render: (_, row) => (
                <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/25 inline-block">
                        {row.nature_of_call || 'Emergency'}
                    </span>
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                        {row.chief_complaint || '—'}
                    </p>
                </div>
            ),
        },
        {
            key: 'transported',
            header: 'Transport Status',
            render: (v, row) => (
                v ? (
                    <div className="text-xs">
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> Transported
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {row.transported_to || 'Health Facility'}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 text-xs">Non-transport / Scene</span>
                )
            ),
        },
        {
            key: 'dispatch',
            header: 'Assigned Unit',
            render: (_, row) => (
                row.dispatch?.ambulance ? (
                    <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-orange-400" />
                        {row.dispatch.ambulance.vehicle_name || row.dispatch.ambulance.plate_number}
                    </span>
                ) : (
                    <span className="text-slate-500 text-xs">—</span>
                )
            ),
        },
        {
            key: 'created_at',
            header: 'Recorded Date',
            sortable: true,
            render: (v) => (
                v ? (
                    <span className="text-xs text-slate-400">
                        {new Date(v).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                ) : (
                    <span className="text-slate-500 text-xs">—</span>
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
                    className="hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all text-xs"
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
            <Card padding={false} className="border-white/10 bg-slate-900/60 shadow-xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-white/5">
                    <SearchInput
                        placeholder="Search by patient, complaint, hospital..."
                        onChange={setSearch}
                        className="flex-1 max-w-sm"
                    />
                    <span className="text-xs text-slate-400">
                        Total records: <span className="text-white font-semibold">{filtered.length}</span>
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
                        <div className="mt-4 pt-4 border-t border-white/10">
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
