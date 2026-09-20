import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Eye, AlertTriangle, Check, X, PhoneCall, Send } from 'lucide-react';
import DataTable from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Card from '@/shared/components/Card';
import Select from '@/shared/components/Select';
import Pagination from '@/shared/components/Pagination';
import IncidentDetails from './IncidentDetails';
import RejectModal from './RejectModal';
import IncidentHistoryMap from './IncidentHistoryMap';
import IncidentKanbanBoard from './IncidentKanbanBoard';
import CreatePhoneIncidentModal from './CreatePhoneIncidentModal';
import CreateDispatchModal from '@/dispatcher/components/Dispatches/CreateDispatchModal';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'responding', label: 'Responding' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
    { value: '', label: 'All Priorities' },
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Moderate', label: 'Moderate' },
];

export default function IncidentTable({ 
    incidents = [], 
    pagination = null, 
    statusFilter = 'active',
    incidentTypes = [],
    chiefComplaints = [],
    ambulances = [],
    responders = [],
}: {
    incidents?: any[];
    pagination?: any;
    statusFilter?: string;
    incidentTypes?: any[];
    chiefComplaints?: string[];
    ambulances?: any[];
    responders?: any[];
}) {
    const [search, setSearch] = useState('');
    const [localStatusFilter, setLocalStatusFilter] = useState('');
    const [localPriorityFilter, setLocalPriorityFilter] = useState('');
    const [viewing, setViewing] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [assigningIncident, setAssigningIncident] = useState<any | null>(null);
    const [phoneCallModalOpen, setPhoneCallModalOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('create_call') === '1') {
            setPhoneCallModalOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const filtered = incidents.filter((inc) => {
        const q = search.toLowerCase();
        const matchQ =
            !q ||
            inc.description?.toLowerCase().includes(q) ||
            String(inc.id).includes(q) ||
            inc.incident_type?.name?.toLowerCase().includes(q);
        const matchStatus = !localStatusFilter || inc.incident_status === localStatusFilter;
        const matchPriority = !localPriorityFilter || inc.priority === localPriorityFilter;
        return matchQ && matchPriority && (statusFilter === 'history' ? true : matchStatus);
    });

    const columns = [
        {
            key: 'id',
            header: '#',
            sortable: true,
            render: (v) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{v}</span>,
        },
        {
            key: 'priority',
            header: 'Priority',
            sortable: true,
            render: (v) => <StatusBadge status={v} />,
        },
        {
            key: 'incident_type',
            header: 'Type',
            render: (v) => v?.name ?? '—',
        },
        {
            key: 'description',
            header: 'Description',
            render: (v) => (
                <span className="line-clamp-1 max-w-xs text-slate-700 dark:text-slate-300">
                    {v ?? '—'}
                </span>
            ),
        },
        {
            key: 'resident',
            header: 'Reporter',
            render: (v) =>
                v ? `${v.first_name} ${v.last_name}` : '—',
        },
        {
            key: 'incident_status',
            header: 'Status',
            sortable: true,
            render: (v) => <StatusBadge status={v} />,
        },
        {
            key: 'reported_at',
            header: 'Reported At',
            sortable: true,
            render: (v) => {
                if (!v) return '—';
                const date = new Date(v);
                const dateStr = date.toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
                const timeStr = date.toLocaleTimeString('en-PH', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                });
                return (
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">{dateStr}</span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{timeStr}</span>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2">
                    {row.incident_status === 'verified' && (
                        <Button 
                            size="xs" 
                            variant="primary" 
                            className="bg-amber-600 hover:bg-amber-500 text-white"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setAssigningIncident(row);
                            }}
                        >
                            <Send className="w-3 h-3" /> Assign
                        </Button>
                    )}
                    <Button size="xs" variant="secondary" onClick={(e) => { 
                        e.stopPropagation(); 
                        if (statusFilter === 'history') {
                            router.get(`/dispatcher/incidents/map?incident_id=${row.id}`);
                        } else {
                            setViewing(row); 
                        }
                    }}>
                        <Eye className="w-3 h-3" /> View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title={statusFilter === 'history' ? "Incident Records" : "Incoming Incidents"}
                subtitle={statusFilter === 'history' ? "Review resolved and rejected incidents in a tabular format." : "Manage active emergency incidents using the Kanban Board."}
                actions={
                    statusFilter !== 'history' && (
                        <Button 
                            variant="primary" 
                            onClick={() => setPhoneCallModalOpen(true)}
                            className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-lg shadow-rose-600/25 border-none font-semibold text-xs tracking-wide"
                        >
                            <PhoneCall className="w-4 h-4 mr-1.5" />
                            + Create Phone/SIM Incident
                        </Button>
                    )
                }
            />

            <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg backdrop-blur-md">
                <SearchInput
                    placeholder="Search incidents..."
                    onChange={setSearch}
                    className="flex-1 min-w-[200px]"
                />
                <Select
                    id="incident-priority-filter"
                    value={localPriorityFilter}
                    onChange={setLocalPriorityFilter}
                    options={PRIORITY_OPTIONS}
                    placeholder=""
                    className="w-40"
                />
                {statusFilter !== 'history' && (
                    <Select
                        id="incident-status-filter"
                        value={localStatusFilter}
                        onChange={setLocalStatusFilter}
                        options={STATUS_OPTIONS}
                        placeholder=""
                        className="w-40"
                    />
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
            </div>

            {statusFilter !== 'history' ? (
                <IncidentKanbanBoard 
                    incidents={filtered} 
                    viewing={viewing} 
                    setViewing={setViewing} 
                />
            ) : (
                <Card padding={false}>
                    <div className="p-4">
                        <DataTable
                            columns={columns}
                            data={filtered}
                            keyField="id"
                            emptyTitle="No incidents found"
                            emptyDescription="No incidents match your current filters."
                            emptyIcon={AlertTriangle}
                            onRowClick={(row) => {
                                if (statusFilter === 'history') {
                                    router.get(`/dispatcher/incidents/map?incident_id=${row.id}`);
                                } else {
                                    setViewing(row);
                                }
                            }}
                        />
                        {pagination && (
                            <Pagination
                                {...pagination}
                                onPageChange={(page) =>
                                    router.get(window.location.pathname, { page, status: statusFilter })
                                }
                            />
                        )}
                    </div>
                </Card>
            )}
            <IncidentDetails
                incident={viewing}
                open={!!viewing}
                onClose={() => setViewing(null)}
                onAssignUnit={(inc) => setAssigningIncident(inc)}
            />

            <RejectModal 
                incident={rejecting}
                open={!!rejecting}
                onClose={() => setRejecting(null)}
            />

            <CreateDispatchModal
                open={!!assigningIncident}
                onClose={() => {
                    setAssigningIncident(null);
                    setViewing(null);
                }}
                incident={assigningIncident}
                ambulances={ambulances}
                responders={responders}
            />

            {phoneCallModalOpen && (
                <CreatePhoneIncidentModal
                    open={phoneCallModalOpen}
                    onClose={() => setPhoneCallModalOpen(false)}
                    incidentTypes={incidentTypes}
                    chiefComplaints={chiefComplaints}
                />
            )}
        </div>
    );
}
