import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Eye, AlertTriangle, Check, X, PhoneCall, Send, MapPin, Activity, RotateCcw, Map as MapIcon, Table, LayoutList, Layers } from 'lucide-react';
import DataTable from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import IncidentDetails from './IncidentDetails';
import RejectModal from './RejectModal';
import IncidentHistoryMap from './IncidentHistoryMap';
import IncidentKanbanBoard from './IncidentKanbanBoard';
import CreatePhoneIncidentModal from './CreatePhoneIncidentModal';
import CreateDispatchModal from '@/dispatcher/components/Dispatches/CreateDispatchModal';
import ArchiveFilterSidebar from './ArchiveFilterSidebar';

const DEFAULT_OPOL_BARANGAYS = [
    'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
    'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang',
    'Nangcaon', 'Patag', 'Poblacion', 'Taboc', 'Tingalan'
];

export default function IncidentTable({ 
    incidents = [], 
    allHistoryIncidents = [],
    pagination = null, 
    statusFilter = 'active',
    incidentTypes = [],
    chiefComplaints = [],
    pcrChiefComplaints = [],
    opolBarangays = [],
    barangayGeojson = null,
    ambulances = [],
    responders = [],
}: {
    incidents?: any[];
    allHistoryIncidents?: any[];
    pagination?: any;
    statusFilter?: string;
    incidentTypes?: any[];
    chiefComplaints?: string[];
    pcrChiefComplaints?: string[];
    opolBarangays?: string[];
    barangayGeojson?: any;
    ambulances?: any[];
    responders?: any[];
}) {
    // Active / Kanban states
    const [viewing, setViewing] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [assigningIncident, setAssigningIncident] = useState<any | null>(null);
    const [phoneCallModalOpen, setPhoneCallModalOpen] = useState(false);

    // Archive / History filtering states
    const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
    const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyPranks, setOnlyPranks] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
    const [archiveViewMode, setArchiveViewMode] = useState<'split' | 'map' | 'table'>('split');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('create_call') === '1') {
            setPhoneCallModalOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // 14 Opol Barangays list
    const availableBarangays = useMemo(() => {
        return opolBarangays && opolBarangays.length > 0 ? opolBarangays : DEFAULT_OPOL_BARANGAYS;
    }, [opolBarangays]);

    // Full archived dataset for zero-latency client filtering & synchronized map/table display
    const archiveDataset = useMemo(() => {
        return (allHistoryIncidents && allHistoryIncidents.length > 0) ? allHistoryIncidents : incidents;
    }, [allHistoryIncidents, incidents]);

    // Available PCR Chief Complaints recorded in the dataset
    const availablePcrComplaints = useMemo(() => {
        if (pcrChiefComplaints && pcrChiefComplaints.length > 0) {
            return pcrChiefComplaints;
        }
        const set = new Set<string>();
        archiveDataset.forEach((inc) => {
            const list = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
            list.forEach((c: string) => {
                if (c && c.trim()) set.add(c.trim());
            });
        });
        return Array.from(set).sort();
    }, [pcrChiefComplaints, archiveDataset]);

    // Barangay counts for badges in sidebar
    const barangayCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        archiveDataset.forEach((inc) => {
            if (inc.barangay) {
                counts[inc.barangay] = (counts[inc.barangay] || 0) + 1;
            }
        });
        return counts;
    }, [archiveDataset]);

    // PCR Chief Complaint counts for badges in sidebar
    const complaintCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        archiveDataset.forEach((inc) => {
            const list = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
            list.forEach((c: string) => {
                counts[c] = (counts[c] || 0) + 1;
            });
        });
        return counts;
    }, [archiveDataset]);

    // Combined Filtering:
    // (Selected Barangay 1 OR Barangay 2) AND (Selected Complaint 1 OR Complaint 2)
    const filteredHistoryIncidents = useMemo(() => {
        if (statusFilter !== 'history') return incidents;

        return archiveDataset.filter((inc) => {
            // 1. Barangay Filter (OR logic among selected barangays)
            if (selectedBarangays.length > 0) {
                const incBarangay = (inc.barangay || '').toLowerCase().replace(/[\s-]/g, '');
                const matches = selectedBarangays.some((b) => {
                    const normB = b.toLowerCase().replace(/[\s-]/g, '');
                    return incBarangay === normB;
                });
                if (!matches) return false;
            }

            // 2. Chief Complaint Filter (based on PCR chief_complaint, OR logic among selected complaints)
            if (selectedComplaints.length > 0) {
                const complaintsList: string[] = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
                const matches = selectedComplaints.some((c) => {
                    const normC = c.toLowerCase().trim();
                    return complaintsList.some((ic) => (ic || '').toLowerCase().trim() === normC);
                });
                if (!matches) return false;
            }

            // 3. Prank Calls Filter
            if (onlyPranks) {
                const isPrank = inc.is_prank === true || inc.is_prank === 1 || inc.rejection_category === 'prank';
                if (!isPrank) return false;
            }

            // 4. Keyword Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchQ =
                    String(inc.id).includes(q) ||
                    (inc.place_of_incident && inc.place_of_incident.toLowerCase().includes(q)) ||
                    (inc.incident_address && inc.incident_address.toLowerCase().includes(q)) ||
                    (inc.location && inc.location.toLowerCase().includes(q)) ||
                    (inc.barangay && inc.barangay.toLowerCase().includes(q)) ||
                    (inc.description && inc.description.toLowerCase().includes(q)) ||
                    (inc.incident_type?.name && inc.incident_type.name.toLowerCase().includes(q)) ||
                    (inc.pcr_chief_complaint && inc.pcr_chief_complaint.toLowerCase().includes(q)) ||
                    (inc.caller_phone_number && inc.caller_phone_number.toLowerCase().includes(q));
                if (!matchQ) return false;
            }

            return true;
        });
    }, [statusFilter, archiveDataset, incidents, selectedBarangays, selectedComplaints, searchQuery, onlyPranks]);

    const totalPrankCount = useMemo(() => {
        return archiveDataset.filter((inc) => inc.is_prank === true || inc.is_prank === 1 || inc.rejection_category === 'prank').length;
    }, [archiveDataset]);

    const handleResetFilters = () => {
        setSelectedBarangays([]);
        setSelectedComplaints([]);
        setSearchQuery('');
        setOnlyPranks(false);
        setSelectedIncident(null);
    };

    // Columns for History / Archive Table
    const archiveColumns = [
        {
            key: 'id',
            header: '#',
            sortable: true,
            render: (v, row) => (
                <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md border ${
                    selectedIncident?.id === row.id 
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                        : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                    #{v}
                </span>
            ),
        },
        {
            key: 'reported_at',
            header: 'Date & Time',
            sortable: true,
            render: (v) => {
                if (!v) return '—';
                const date = new Date(v);
                return (
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">
                            {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'place_of_incident',
            header: 'Place & Barangay',
            render: (_, row) => (
                <div className="flex flex-col max-w-sm">
                    <span className="font-medium text-slate-900 dark:text-white text-xs line-clamp-1">
                        {row.place_of_incident || row.incident_address || row.location || 'Location Unavailable'}
                    </span>
                    {row.barangay && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span>Brgy. {row.barangay}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'pcr_chief_complaint',
            header: 'PCR Chief Complaint',
            render: (v) => {
                if (!v) {
                    return <span className="text-slate-400 text-xs italic">Not recorded in PCR</span>;
                }
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        {v}
                    </span>
                );
            },
        },
        {
            key: 'incident_status',
            header: 'Status',
            sortable: true,
            render: (v, row) => (
                <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={v} size="xs" />
                    {(row.is_prank || row.rejection_category === 'prank') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                            🚨 Prank Call
                        </span>
                    )}
                </div>
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
                        onClick={() => {
                            setSelectedIncident(row);
                            // If user is in table-only mode, switch to split so they see the marker on the map
                            if (archiveViewMode === 'table') {
                                setArchiveViewMode('split');
                            }
                        }}
                        className="text-xs"
                    >
                        <MapPin className="w-3 h-3 text-rose-500 mr-1" />
                        Locate
                    </Button>
                    <Button 
                        size="xs" 
                        variant="ghost" 
                        onClick={() => setViewing(row)}
                        className="text-xs"
                    >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <PageHeader
                title={statusFilter === 'history' ? "Incident Archive" : "Incoming Incidents"}
                subtitle={statusFilter === 'history' ? "Synchronized incident records and geospatial intelligence filtered by Barangay and PCR Chief Complaints." : undefined}
                actions={
                    statusFilter !== 'history' ? (
                        <Button 
                            variant="primary" 
                            onClick={() => setPhoneCallModalOpen(true)}
                            className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-lg shadow-rose-600/25 border-none font-semibold text-xs tracking-wide"
                        >
                            <PhoneCall className="w-4 h-4 mr-1.5" />
                            + Create Phone/SIM Incident
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                            <button
                                onClick={() => setArchiveViewMode('split')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    archiveViewMode === 'split'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Dual View (Map on top + Table below)"
                            >
                                <Layers className="w-3.5 h-3.5 text-rose-500" />
                                Split View
                            </button>
                            <button
                                onClick={() => setArchiveViewMode('map')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    archiveViewMode === 'map'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Map View Only"
                            >
                                <MapIcon className="w-3.5 h-3.5 text-rose-500" />
                                Map Only
                            </button>
                            <button
                                onClick={() => setArchiveViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    archiveViewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Table View Only"
                            >
                                <Table className="w-3.5 h-3.5 text-rose-500" />
                                Table Only
                            </button>
                        </div>
                    )
                }
            />

            {/* Active Incidents Kanban Board (Incoming Flow) */}
            {statusFilter !== 'history' && (
                <IncidentKanbanBoard 
                    incidents={incidents} 
                    viewing={viewing} 
                    setViewing={setViewing} 
                />
            )}

            {/* Incident Archive Synchronized Workspace (History Flow) */}
            {statusFilter === 'history' && (
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* Left Sidebar: Barangay & PCR Chief Complaint Filters */}
                    <ArchiveFilterSidebar
                        barangays={availableBarangays}
                        chiefComplaints={availablePcrComplaints}
                        selectedBarangays={selectedBarangays}
                        setSelectedBarangays={setSelectedBarangays}
                        selectedComplaints={selectedComplaints}
                        setSelectedComplaints={setSelectedComplaints}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onlyPranks={onlyPranks}
                        setOnlyPranks={setOnlyPranks}
                        prankCount={totalPrankCount}
                        barangayCounts={barangayCounts}
                        complaintCounts={complaintCounts}
                        totalFilteredCount={filteredHistoryIncidents.length}
                        totalAllCount={archiveDataset.length}
                        onReset={handleResetFilters}
                    />

                    {/* Right Workspace: Synchronized Map & Table */}
                    <div className="flex-1 min-w-0 w-full space-y-5">
                        
                        {/* Active Filter Chips Bar */}
                        {(selectedBarangays.length > 0 || selectedComplaints.length > 0 || searchQuery.trim().length > 0 || onlyPranks) && (
                            <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-md">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
                                    Active Filters:
                                </span>

                                {/* Prank Filter Chip */}
                                {onlyPranks && (
                                    <button
                                        onClick={() => setOnlyPranks(false)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                        <span>🚨 Prank Calls Only</span>
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                )}

                                {/* Barangay Chips */}
                                {selectedBarangays.map((b) => (
                                    <button
                                        key={`chip-b-${b}`}
                                        onClick={() => setSelectedBarangays(selectedBarangays.filter((item) => item !== b))}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 transition-colors cursor-pointer"
                                    >
                                        <MapPin className="w-3 h-3 text-rose-500" />
                                        <span>Brgy. {b}</span>
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                ))}

                                {/* PCR Chief Complaint Chips */}
                                {selectedComplaints.map((c) => (
                                    <button
                                        key={`chip-c-${c}`}
                                        onClick={() => setSelectedComplaints(selectedComplaints.filter((item) => item !== c))}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 transition-colors cursor-pointer"
                                    >
                                        <Activity className="w-3 h-3 text-indigo-500" />
                                        <span>{c}</span>
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                ))}

                                {/* Keyword Chip */}
                                {searchQuery.trim() && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                        <span>"{searchQuery}"</span>
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                )}

                                <button
                                    onClick={handleResetFilters}
                                    className="ml-auto text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

                        {/* Interactive Synchronized Incident Map */}
                        {archiveViewMode !== 'table' && (
                            <IncidentHistoryMap
                                incidents={filteredHistoryIncidents}
                                selectedIncident={selectedIncident}
                                onSelectIncident={(inc) => setSelectedIncident(inc)}
                                onViewDetails={(inc) => setViewing(inc)}
                                selectedBarangays={selectedBarangays}
                                barangayGeojson={barangayGeojson}
                                heightClass={archiveViewMode === 'map' ? 'h-[calc(100vh-14rem)] min-h-[560px]' : 'h-[440px]'}
                            />
                        )}

                        {/* Synchronized DataTable */}
                        {archiveViewMode !== 'map' && (
                            <Card padding={false} className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            Archived Incident Records
                                        </h4>
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                                            {filteredHistoryIncidents.length} of {archiveDataset.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 italic hidden sm:block">
                                        Click any row to pinpoint location on the map
                                    </p>
                                </div>

                                {filteredHistoryIncidents.length === 0 ? (
                                    <div className="py-14 px-4 text-center">
                                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            No Incidents Found
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                            No historical incident records match the selected Barangay and PCR Chief Complaint filter combination.
                                        </p>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={handleResetFilters} 
                                            className="mt-4"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                                            Reset All Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <DataTable
                                            columns={archiveColumns}
                                            data={filteredHistoryIncidents}
                                            keyField="id"
                                            emptyTitle="No incidents found"
                                            emptyDescription="No incidents match the active criteria."
                                            onRowClick={(row) => {
                                                setSelectedIncident(row);
                                                if (archiveViewMode === 'table') {
                                                    setArchiveViewMode('split');
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </Card>
                        )}

                    </div>
                </div>
            )}

            {/* Details Drawer */}
            <IncidentDetails
                incident={viewing}
                open={!!viewing}
                onClose={() => setViewing(null)}
                onAssignUnit={(inc) => setAssigningIncident(inc)}
            />

            {/* Reject Modal */}
            <RejectModal 
                incident={rejecting}
                open={!!rejecting}
                onClose={() => setRejecting(null)}
            />

            {/* Create Dispatch Modal */}
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

            {/* Create Phone Incident Modal */}
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
