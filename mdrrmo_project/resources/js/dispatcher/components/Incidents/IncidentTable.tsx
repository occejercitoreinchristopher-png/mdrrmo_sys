import { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
    AlertTriangle, 
    X, 
    PhoneCall, 
    MapPin, 
    Activity, 
    RotateCcw, 
    ChevronDown, 
    Search, 
    Plus, 
    CheckCircle2, 
    HeartPulse, 
    Printer, 
    Loader2,
    Calendar,
    Clock,
    Flame,
    ShieldAlert,
    Layers,
    FolderArchive,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '@/shared/components/DataTable';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import IncidentRowActionsDropdown from './IncidentRowPrintDropdown';
import IncidentLocateModal from './IncidentLocateModal';
import IncidentPinsMapModal from './IncidentPinsMapModal';
import MultiSelectFilterCombobox from './MultiSelectFilterCombobox';
import IncidentDetails from './IncidentDetails';
import RejectModal from './RejectModal';
import IncidentKanbanBoard from './IncidentKanbanBoard';
import CreatePhoneIncidentModal from './CreatePhoneIncidentModal';
import CreateDispatchModal from '@/dispatcher/components/Dispatches/CreateDispatchModal';
import AddCategoryModal from './AddCategoryModal';
import AddIncidentTypeModal from './AddIncidentTypeModal';
import MonthlyReportPrintModal from '@/admin/components/Reports/MonthlyReportPrintModal';
import { useIncidentRecordsQuery } from './useIncidentRecordsQuery';
import { 
    MAIN_CATEGORIES, 
    INCIDENT_TYPES_BY_CATEGORY, 
    ALL_INCIDENT_TYPES,
    getCategoryForIncident, 
    getIncidentsForCategory,
    getStoredCustomCategories,
    saveStoredCustomCategory,
    getStoredCustomIncidents,
    saveStoredCustomIncident
} from '@/dispatcher/data/incidentCategories';

const DEFAULT_OPOL_BARANGAYS = [
    'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
    'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang',
    'Nangcaon', 'Patag', 'Poblacion', 'Taboc', 'Tingalan'
];

const MONTH_OPTIONS = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
];

const TIME_OPTIONS = [
    { value: 'all', label: 'All Times' },
    { value: 'morning', label: 'Morning (06:00 - 11:59)' },
    { value: 'afternoon', label: 'Afternoon (12:00 - 17:59)' },
    { value: 'evening', label: 'Evening (18:00 - 23:59)' },
    { value: 'night', label: 'Night (00:00 - 05:59)' },
];

export default function IncidentTable({ 
    incidents = [], 
    allHistoryIncidents = [],
    pagination = null, 
    statusFilter = 'active',
    incidentTypes = [],
    chiefComplaints = [],
    dbChiefComplaintsByCategory = {},
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
    dbChiefComplaintsByCategory?: Record<string, string[]>;
    pcrChiefComplaints?: string[];
    opolBarangays?: string[];
    barangayGeojson?: any;
    ambulances?: any[];
    responders?: any[];
}) {
    const { auth } = usePage<{ auth?: { user?: { first_name?: string; last_name?: string; name?: string } } }>().props;
    const preparedByName = auth?.user
        ? ([auth.user.first_name, auth.user.last_name].filter(Boolean).join(' ') || auth.user.name || undefined)
        : undefined;

    // Active / Kanban states
    const [viewing, setViewing] = useState(null);
    const [locatingIncident, setLocatingIncident] = useState<any | null>(null);
    const [rejecting, setRejecting] = useState(null);
    const [assigningIncident, setAssigningIncident] = useState<any | null>(null);
    const [phoneCallModalOpen, setPhoneCallModalOpen] = useState(false);

    // Archive / History horizontal multi-select filtering states: Category, Chief Complaint, Month, Time, Barangay
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);

    // Custom Category & Incident Modal states
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isAddIncidentModalOpen, setIsAddIncidentModalOpen] = useState(false);
    const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
    const [isPinsMapModalOpen, setIsPinsMapModalOpen] = useState(false);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [customIncidents, setCustomIncidents] = useState<Record<string, string[]>>({});
    const [notificationMessage, setNotificationMessage] = useState<{
        title: string;
        message: string;
        type: 'category' | 'incident';
    } | null>(null);

    useEffect(() => {
        setCustomCategories(getStoredCustomCategories());
        setCustomIncidents(getStoredCustomIncidents());
    }, []);

    // Auto-dismiss confirmation banner after 6 seconds
    useEffect(() => {
        if (notificationMessage) {
            const timer = setTimeout(() => {
                setNotificationMessage(null);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [notificationMessage]);

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

    // Full archived dataset fallback for initial zero-flash render and barangay zone extraction
    const archiveDataset = useMemo(() => {
        return (allHistoryIncidents && allHistoryIncidents.length > 0) ? allHistoryIncidents : incidents;
    }, [allHistoryIncidents, incidents]);

    // TanStack Query + Search Debounce + Page Pagination for Incident Records
    const {
        records: paginatedHistoryRecords,
        searchQuery,
        setSearchQuery,
        isDebouncing,
        clearSearch,
        page: recordsPage,
        setPage: setRecordsPage,
        perPage: recordsPerPage,
        setPerPage: setRecordsPerPage,
        lastPage: recordsLastPage,
        total: recordsTotal,
        overallTotal: recordsOverallTotal,
        from: recordsFrom,
        to: recordsTo,
        isLoading: isRecordsLoading,
        isFetching: isRecordsFetching,
    } = useIncidentRecordsQuery({
        enabled: statusFilter === 'history',
        categories: selectedCategories,
        incidents: selectedIncidents,
        months: selectedMonths,
        times: selectedTimes,
        barangays: selectedZones,
        customIncidents,
        initialIncidents: archiveDataset,
        initialTotal: pagination?.total ?? archiveDataset.length,
        debounceMs: 350,
        initialPerPage: 10,
    });

    // Available Categories (1. Category) combining official categories and any custom categories
    const availableCategories = useMemo(() => {
        return Array.from(new Set([...MAIN_CATEGORIES, ...customCategories]));
    }, [customCategories]);

    // Available Incidents / Specific Complaints (2. Chief Complaint) dynamically filtered by selected Categories + DB + custom incidents
    const availableIncidents = useMemo(() => {
        if (selectedCategories.length === 0) {
            const allCustom = Object.values(customIncidents).flat();
            const allDbByCat = Object.values(dbChiefComplaintsByCategory || {}).flat();
            return Array.from(
                new Set([
                    ...ALL_INCIDENT_TYPES,
                    ...(Array.isArray(chiefComplaints) ? chiefComplaints : []),
                    ...allDbByCat,
                    ...allCustom,
                ].filter((item) => typeof item === 'string' && item.trim().length > 0)),
            ).sort((a, b) => a.localeCompare(b));
        }

        const collected: string[] = [];
        for (const selCat of selectedCategories) {
            const base = INCIDENT_TYPES_BY_CATEGORY[selCat as any] || [];
            collected.push(...base);

            const targetNorm = selCat.trim().toLowerCase();
            for (const sourceMap of [dbChiefComplaintsByCategory || {}, customIncidents]) {
                for (const [catKey, incList] of Object.entries(sourceMap)) {
                    if (catKey.trim().toLowerCase() === targetNorm && Array.isArray(incList)) {
                        collected.push(...incList);
                    }
                }
            }
        }

        return Array.from(
            new Set(collected.filter((item) => typeof item === 'string' && item.trim().length > 0)),
        ).sort((a, b) => a.localeCompare(b));
    }, [selectedCategories, customIncidents, chiefComplaints, dbChiefComplaintsByCategory]);

    // Handle cascading multi-category change
    const handleCategoriesChange = (nextCats: string[]) => {
        setSelectedCategories(nextCats);
        if (selectedIncidents.length > 0 && nextCats.length > 0) {
            const allowedSet = new Set<string>();
            for (const cat of nextCats) {
                for (const item of INCIDENT_TYPES_BY_CATEGORY[cat as any] || []) {
                    allowedSet.add(item);
                }
                const targetNorm = cat.trim().toLowerCase();
                for (const sourceMap of [dbChiefComplaintsByCategory || {}, customIncidents]) {
                    for (const [k, list] of Object.entries(sourceMap)) {
                        if (k.trim().toLowerCase() === targetNorm && Array.isArray(list)) {
                            for (const item of list) allowedSet.add(item);
                        }
                    }
                }
            }
            const pruned = selectedIncidents.filter((inc) => allowedSet.has(inc));
            if (pruned.length !== selectedIncidents.length) {
                setSelectedIncidents(pruned);
            }
        }
    };

    // Handle multi-incident change
    const handleIncidentsChange = (nextIncs: string[]) => {
        setSelectedIncidents(nextIncs);
    };

    const handleAddCategory = async (newCat: string) => {
        const formatted = saveStoredCustomCategory(newCat);
        setCustomCategories(getStoredCustomCategories());

        // Save to database so resident mobile app immediately receives it
        try {
            await fetch('/incident-types', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    incident_type_name: formatted,
                    type_description: `${formatted} emergency and operational response category`,
                }),
            });
        } catch (e) {
            console.warn('Failed to sync new category to database:', e);
        }

        toast.success(`Category "${formatted}" created successfully!`, {
            description: 'Saved to database and available in mobile apps and filter dropdown.',
        });
        setNotificationMessage({
            type: 'category',
            title: 'Category Created Successfully',
            message: `"${formatted}" has been saved to database and is now available in mobile apps and filter dropdown.`,
        });
    };

    const handleAddIncidentType = async (cat: string, newInc: string) => {
        const result = saveStoredCustomIncident(cat, newInc);
        const updatedMap = getStoredCustomIncidents();
        setCustomIncidents(updatedMap);

        // If the user currently has this category selected in the filter, add the new incident to selection
        if (
            selectedCategories.some(
                (c) => c.trim().toLowerCase() === cat.trim().toLowerCase(),
            )
        ) {
            setSelectedIncidents((prev) =>
                prev.includes(result.incident) ? prev : [...prev, result.incident],
            );
        }

        // Save to database so responder mobile app immediately receives it
        try {
            await fetch('/chief-complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    category: result.category,
                    complaint_name: result.incident,
                    description: `${result.incident} under ${result.category}`,
                }),
            });
        } catch (e) {
            console.warn('Failed to sync new chief complaint to database:', e);
        }

        toast.success(`Chief Complaint "${result.incident}" created successfully!`, {
            description: `Saved to database under category "${result.category}".`,
        });
        setNotificationMessage({
            type: 'incident',
            title: 'Chief Complaint Created Successfully',
            message: `"${result.incident}" has been saved to database under "${result.category}".`,
        });
    };

    // Available Zones / Barangays (5. Zone)
    const availableZones = useMemo(() => {
        const set = new Set<string>(availableBarangays);
        archiveDataset.forEach((inc) => {
            const b = typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay;
            if (b && typeof b === 'string' && b.trim()) set.add(b.trim());
        });
        return Array.from(set).sort();
    }, [availableBarangays, archiveDataset]);

    // Check if any filters are active
    const hasActiveFilters = 
        selectedCategories.length > 0 || 
        selectedIncidents.length > 0 || 
        selectedMonths.length > 0 || 
        selectedTimes.length > 0 || 
        selectedZones.length > 0 || 
        searchQuery.trim().length > 0;

    // Helper to resolve PCR Chief Complaint
    const getIncidentChiefComplaint = (row: any): string => {
        if (!row) return '';
        // 1. Direct PCR chief complaint accessor from model
        if (row.pcr_chief_complaint && typeof row.pcr_chief_complaint === 'string' && row.pcr_chief_complaint.trim()) {
            return row.pcr_chief_complaint.trim();
        }
        // 2. Dispatches patient_care_record / patient_care_records
        if (Array.isArray(row.dispatches)) {
            for (const d of row.dispatches) {
                const pcr = d?.patient_care_record || d?.patientCareRecord;
                if (pcr?.chief_complaint && typeof pcr.chief_complaint === 'string' && pcr.chief_complaint.trim()) {
                    return pcr.chief_complaint.trim();
                }
                if (pcr?.clinical_chief_complaint && typeof pcr.clinical_chief_complaint === 'string' && pcr.clinical_chief_complaint.trim()) {
                    return pcr.clinical_chief_complaint.trim();
                }
                const pcrs = d?.patient_care_records || d?.patientCareRecords;
                if (Array.isArray(pcrs)) {
                    for (const p of pcrs) {
                        if (p?.chief_complaint && typeof p.chief_complaint === 'string' && p.chief_complaint.trim()) {
                            return p.chief_complaint.trim();
                        }
                        if (p?.clinical_chief_complaint && typeof p.clinical_chief_complaint === 'string' && p.clinical_chief_complaint.trim()) {
                            return p.clinical_chief_complaint.trim();
                        }
                    }
                }
            }
        }
        // 3. Fallback to model chief_complaint accessor
        if (row.chief_complaint && typeof row.chief_complaint === 'string' && row.chief_complaint.trim()) {
            return row.chief_complaint.trim();
        }
        // 4. Bracketed description e.g. "[Chest Pain] Patient collapsed"
        const desc = row.incident_description || row.description || '';
        if (typeof desc === 'string') {
            const match = desc.match(/^\[(.*?)\]/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return '';
    };

    // Helper to resolve Authoritative Emergency Category:
    // Priority: Responder's on-scene PCR Chief Complaint is the clinical authority.
    // If no PCR has been recorded yet (e.g. ongoing response), falls back to initial reported emergency type.
    const resolveAuthoritativeCategory = (complaint: string, rawTypeName: string): string => {
        if (complaint && complaint.trim()) {
            const norm = complaint.trim().toLowerCase();
            for (const [c, list] of Object.entries(customIncidents)) {
                if (Array.isArray(list) && list.some(item => item.toLowerCase().trim() === norm)) {
                    return c;
                }
            }
            const derived = getCategoryForIncident(complaint);
            if (derived) return derived;
        }

        if (rawTypeName && rawTypeName.trim()) {
            const normType = rawTypeName.trim().toLowerCase();
            for (const [c, list] of Object.entries(customIncidents)) {
                if (Array.isArray(list) && list.some(item => item.toLowerCase().trim() === normType)) {
                    return c;
                }
            }
            return getCategoryForIncident(rawTypeName) || rawTypeName;
        }

        return 'Medical Emergency';
    };

    // Helper to extract printable PCR records attached to an incident row
    const getIncidentPcrEntries = (row: any): { id: number | string; label: string; record: any }[] => {
        if (!row) return [];
        const entries: { id: number | string; label: string; record: any }[] = [];
        const seenIds = new Set<string | number>();

        const pushPcr = (pcr: any, dispatch: any) => {
            if (!pcr || typeof pcr !== 'object') return;
            const key = pcr.id ?? `${dispatch?.id ?? 'd'}-${entries.length}`;
            if (seenIds.has(key)) return;
            seenIds.add(key);

            const patient = pcr.patient || {};
            const patientName = [patient.first_name, patient.last_name].filter(Boolean).join(' ')
                || patient.full_name
                || pcr.patient_name
                || '';

            entries.push({
                id: key,
                label: patientName,
                record: {
                    ...pcr,
                    dispatch: {
                        ...(dispatch || pcr.dispatch || {}),
                        incident: row,
                    },
                },
            });
        };

        if (Array.isArray(row.dispatches)) {
            for (const d of row.dispatches) {
                const list = d?.patient_care_records || d?.patientCareRecords;
                if (Array.isArray(list)) {
                    for (const p of list) pushPcr(p, d);
                }
                const single = d?.patient_care_record || d?.patientCareRecord;
                if (single) pushPcr(single, d);
            }
        }

        const directList = row.patient_care_records || row.patientCareRecords;
        if (Array.isArray(directList)) {
            for (const p of directList) pushPcr(p, null);
        }

        return entries;
    };

    const handleResetFilters = () => {
        setSelectedCategories([]);
        setSelectedIncidents([]);
        setSelectedMonths([]);
        setSelectedTimes([]);
        setSelectedZones([]);
        clearSearch();
        setRecordsPage(1);
    };

    // Historical Archives Telemetry summary
    const archiveStats = useMemo(() => {
        const list = archiveDataset || [];
        const total = recordsOverallTotal || list.length;
        
        let medicalCount = 0;
        let traumaCount = 0;
        let fireCount = 0;
        const barangayCounts: Record<string, number> = {};

        list.forEach((item: any) => {
            const rawCat = (item.incident_type?.name || item.incident_type?.incident_type_name || '').toLowerCase();
            const b = typeof item.barangay === 'object' 
                ? item.barangay?.barangay_name || item.barangay?.name || '' 
                : item.barangay || '';
            
            if (rawCat.includes('medical') || rawCat.includes('health')) medicalCount++;
            else if (rawCat.includes('trauma') || rawCat.includes('vehicular') || rawCat.includes('accident') || rawCat.includes('injury')) traumaCount++;
            else if (rawCat.includes('fire') || rawCat.includes('rescue') || rawCat.includes('disaster')) fireCount++;
            else medicalCount++; // fallback

            if (b) {
                barangayCounts[b] = (barangayCounts[b] || 0) + 1;
            }
        });

        let topBarangay = '—';
        let topCount = 0;
        Object.entries(barangayCounts).forEach(([b, count]) => {
            if (count > topCount) {
                topCount = count;
                topBarangay = b;
            }
        });

        return {
            total,
            medicalCount,
            traumaCount,
            fireCount,
            topBarangay: topBarangay !== '—' ? `Brgy. ${topBarangay} (${topCount})` : 'All 14 Barangays',
        };
    }, [archiveDataset, recordsOverallTotal]);

    const handlePresetSelect = (preset: 'all' | 'medical' | 'trauma' | 'fire' | 'this_month') => {
        if (preset === 'all') {
            handleResetFilters();
            return;
        }
        if (preset === 'medical') {
            setSelectedCategories(['Medical Emergency']);
            setSelectedIncidents([]);
        } else if (preset === 'trauma') {
            setSelectedCategories(['Trauma Emergency']);
            setSelectedIncidents([]);
        } else if (preset === 'fire') {
            setSelectedCategories(['Fire & Disaster']);
            setSelectedIncidents([]);
        } else if (preset === 'this_month') {
            const curMonth = new Date().getMonth().toString();
            setSelectedMonths([curMonth]);
        }
    };

    // Columns for History / Archive Table
    const archiveColumns = [
        {
            key: 'id',
            header: '#',
            sortable: true,
            render: (v, row) => (
                <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md border ${
                    (viewing as any)?.id === row.id 
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
                    <div className="flex flex-col whitespace-nowrap space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-200 text-xs flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'place_of_incident',
            header: 'Place & Barangay',
            render: (_, row) => {
                const rawPlace = row.place_of_incident || row.incident_address || (typeof row.location === 'object' ? row.location?.location_name || row.location?.name : row.location) || 'Location Unavailable';
                const cleanPlace = rawPlace.replace(/,?\s*Opol,?\s*Misamis\s*Oriental/gi, '').trim() || rawPlace;
                const bgyName = typeof row.barangay === 'object' ? row.barangay?.barangay_name || row.barangay?.name : row.barangay;

                return (
                    <div className="flex flex-col max-w-sm">
                        <span className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1" title={rawPlace}>
                            {cleanPlace}
                        </span>
                        {bgyName && (
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>Brgy. {bgyName}</span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'incident_type',
            header: 'Category',
            render: (v, row) => {
                const complaint = getIncidentChiefComplaint(row);
                const rawTypeName = row.incident_type?.name || row.incident_type?.incident_type_name || '';
                const name = resolveAuthoritativeCategory(complaint, rawTypeName);
                if (!name) {
                    return <span className="text-slate-400 text-xs italic">Unclassified</span>;
                }
                const isFire = name.toLowerCase().includes('fire');
                const isTrauma = name.toLowerCase().includes('trauma') || name.toLowerCase().includes('accident');
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        isFire
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : isTrauma
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                    }`}>
                        {isFire ? (
                            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : isTrauma ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span>{name}</span>
                    </span>
                );
            },
        },
        {
            key: 'chief_complaint',
            header: 'Chief Complaint',
            render: (_, row) => {
                const complaint = getIncidentChiefComplaint(row);
                if (!complaint) {
                    return <span className="text-slate-400 text-xs italic">None Recorded</span>;
                }
                return (
                    <div className="min-w-[170px] max-w-[210px]">
                        <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/20 max-w-full truncate shadow-2xs"
                            title={complaint}
                        >
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{complaint}</span>
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'incident_status',
            header: 'Status',
            sortable: true,
            render: (v, row) => (
                <div className="min-w-[110px] flex flex-col gap-1 items-start">
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
                <IncidentRowActionsDropdown
                    row={row}
                    pcrEntries={getIncidentPcrEntries(row)}
                    preparedByName={preparedByName}
                    onViewDetails={(selectedRow) => setViewing(selectedRow)}
                    onLocate={(selectedRow) => setLocatingIncident(selectedRow)}
                />
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <PageHeader
                title={statusFilter === 'history' ? "Incident Records" : "Incoming Incidents"}
                subtitle={statusFilter === 'history' ? "Historical incident records filtered by Barangay, emergency type, date range, and search keyword." : undefined}
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
                    ) : undefined
                }
            />

            {/* Active Incidents Kanban Board (Incoming Flow) */}
            {statusFilter !== 'history' && (
                <IncidentKanbanBoard 
                    incidents={incidents} 
                    viewing={viewing} 
                    setViewing={setViewing}
                    onAssign={(inc) => setAssigningIncident(inc)}
                    onLocate={(inc) => setLocatingIncident(inc)}
                />
            )}

            {/* Incident Archive Synchronized Workspace (History Flow) */}
            {statusFilter === 'history' && (
                <div className="w-full space-y-4">
                    {/* Top Historical Telemetry Ribbon (4 Metric Cards) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Card 1: Total Incidents */}
                        <div 
                            onClick={() => handlePresetSelect('all')}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all"
                        >
                            <div className="space-y-0.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total Archived
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {archiveStats.total}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    MDRRMO CAD Vault
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <FolderArchive className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 2: Medical Responses */}
                        <div 
                            onClick={() => handlePresetSelect('medical')}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                selectedCategories.includes('Medical Emergency')
                                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40'
                            }`}
                        >
                            <div className="space-y-0.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    Medical Calls
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {archiveStats.medicalCount}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    Health & Clinical cases
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 3: Trauma & Rescue */}
                        <div 
                            onClick={() => handlePresetSelect('trauma')}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                selectedCategories.includes('Trauma Emergency') || selectedCategories.includes('Fire & Disaster')
                                    ? 'bg-rose-500/10 border-rose-500/40 shadow-md ring-1 ring-rose-500/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 hover:border-rose-500/40'
                            }`}
                        >
                            <div className="space-y-0.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                    Trauma & Rescue
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {archiveStats.traumaCount + archiveStats.fireCount}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    Accidents & Fire incidents
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 4: Top Affected Sector */}
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
                            <div className="space-y-0.5 max-w-[170px]">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                    Top Hotspot
                                </div>
                                <div className="text-lg font-black text-slate-900 dark:text-white truncate">
                                    {archiveStats.topBarangay}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    Highest response volume
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Synchronized DataTable Card */}
                    <Card padding={false} className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                        
                        {/* Card Header with Title, Count, Search Bar, Reset, and Grouped Buttons */}
                        <div className="p-4 border-b border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <h4 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                                    Archived Incident Records
                                </h4>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 font-mono">
                                    <span>{recordsTotal} of {recordsOverallTotal}</span>
                                    {isRecordsFetching && (
                                        <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
                                <div className="relative flex-1 sm:w-64 min-w-[200px]">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search records..."
                                        className="w-full text-xs pl-8 pr-14 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        {(isDebouncing || isRecordsFetching) && (
                                            <Loader2
                                                className="w-3.5 h-3.5 animate-spin text-rose-500"
                                                aria-label="Searching..."
                                            />
                                        )}
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                title="Clear search"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer shrink-0"
                                        title="Reset all filters"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                    </button>
                                )}

                                {/* Action Buttons: Grouped Operational & Taxonomy Tools */}
                                <div className="flex items-center flex-wrap gap-2 shrink-0">
                                    {/* GIS & Export Tools */}
                                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setIsPinsMapModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all cursor-pointer"
                                            title="View & Print All Filtered Incident Location Pins on Map"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-sky-500" />
                                            <span>Map Pins</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsMonthlyReportModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all cursor-pointer"
                                            title="Print Official MDRRMO Monthly Responses & Patient Complaints Report"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-red-500" />
                                            <span>Print Report</span>
                                        </button>
                                    </div>

                                    {/* Taxonomy Management */}
                                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddIncidentModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all cursor-pointer"
                                            title="Add Chief Complaint"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>Chief Complaint</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddCategoryModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all cursor-pointer"
                                            title="Add Incident Category"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Category</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Presets Ribbon */}
                        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-rose-500" /> Quick:
                            </span>
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    !hasActiveFilters
                                        ? 'bg-red-600 text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                All Records
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('medical')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    selectedCategories.includes('Medical Emergency') && selectedCategories.length === 1
                                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                ⚡ Medical Emergencies
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('trauma')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    selectedCategories.includes('Trauma Emergency') && selectedCategories.length === 1
                                        ? 'bg-rose-600 text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                🚨 Trauma & Vehicular
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('fire')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    selectedCategories.includes('Fire & Disaster') && selectedCategories.length === 1
                                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                🔥 Fire & Disaster
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('this_month')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    selectedMonths.includes(new Date().getMonth().toString()) && selectedMonths.length === 1
                                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                                }`}
                            >
                                📅 This Month
                            </button>
                        </div>

                        {/* Confirmation Notification Banner */}
                        {notificationMessage && (
                            <div className="mx-4 mt-3.5 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 animate-fadeIn">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                                            {notificationMessage.title}:
                                        </span>
                                        <span>{notificationMessage.message}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotificationMessage(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                    title="Dismiss"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* HORIZONTAL MULTI-SELECT FILTER ROW: 1. Category, 2. Chief Complaint, 3. Month, 4. Time, 5. Barangay */}
                        <div className="px-4 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                
                                {/* 1. Category (Multi-Select) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        Category
                                    </label>
                                    <MultiSelectFilterCombobox
                                        values={selectedCategories}
                                        onChange={handleCategoriesChange}
                                        options={availableCategories.map((cat) => ({
                                            value: cat,
                                            label: cat,
                                        }))}
                                        allLabel="All Categories"
                                        searchable={true}
                                        searchPlaceholder="Search category..."
                                    />
                                </div>

                                {/* 2. Chief Complaint (Multi-Select Searchable Combobox) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        Chief Complaint
                                    </label>
                                    <MultiSelectFilterCombobox
                                        values={selectedIncidents}
                                        onChange={handleIncidentsChange}
                                        options={availableIncidents.map((incName) => ({
                                            value: incName,
                                            label: incName,
                                        }))}
                                        allLabel="All Chief Complaints"
                                        searchable={true}
                                        searchPlaceholder="Type to search chief complaint..."
                                    />
                                </div>

                                {/* 3. Month (Multi-Select) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        Month
                                    </label>
                                    <MultiSelectFilterCombobox
                                        values={selectedMonths}
                                        onChange={setSelectedMonths}
                                        options={MONTH_OPTIONS.filter((m) => m.value !== 'all')}
                                        allLabel="All Months"
                                        searchable={true}
                                        searchPlaceholder="Search month..."
                                    />
                                </div>

                                {/* 4. Time (Multi-Select) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        Time
                                    </label>
                                    <MultiSelectFilterCombobox
                                        values={selectedTimes}
                                        onChange={setSelectedTimes}
                                        options={TIME_OPTIONS.filter((t) => t.value !== 'all')}
                                        allLabel="All Times"
                                        searchable={false}
                                    />
                                </div>

                                {/* 5. Barangay (Multi-Select) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                        Barangay
                                    </label>
                                    <MultiSelectFilterCombobox
                                        values={selectedZones}
                                        onChange={setSelectedZones}
                                        options={availableZones.map((z) => ({
                                            value: z,
                                            label: `Brgy. ${z}`,
                                        }))}
                                        allLabel="All Barangays"
                                        searchable={true}
                                        searchPlaceholder="Search barangay..."
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Active Filter Chips Bar (if any filter is active) */}
                        {hasActiveFilters && (
                            <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                                    Active:
                                </span>

                                {selectedCategories.map((cat) => (
                                    <span
                                        key={`cat-${cat}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                                    >
                                        <span>Category: {cat}</span>
                                        <button
                                            onClick={() =>
                                                handleCategoriesChange(
                                                    selectedCategories.filter((c) => c !== cat),
                                                )
                                            }
                                            className="hover:opacity-75 cursor-pointer"
                                        >
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                ))}

                                {selectedIncidents.map((incName) => (
                                    <span
                                        key={`inc-${incName}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20"
                                    >
                                        <span>Chief Complaint: {incName}</span>
                                        <button
                                            onClick={() =>
                                                handleIncidentsChange(
                                                    selectedIncidents.filter((i) => i !== incName),
                                                )
                                            }
                                            className="hover:opacity-75 cursor-pointer"
                                        >
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                ))}

                                {selectedMonths.map((monthVal) => (
                                    <span
                                        key={`month-${monthVal}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                                    >
                                        <span>
                                            Month: {MONTH_OPTIONS.find((m) => m.value === monthVal)?.label || monthVal}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setSelectedMonths(
                                                    selectedMonths.filter((m) => m !== monthVal),
                                                )
                                            }
                                            className="hover:opacity-75 cursor-pointer"
                                        >
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                ))}

                                {selectedTimes.map((timeVal) => (
                                    <span
                                        key={`time-${timeVal}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
                                    >
                                        <span>
                                            Time: {TIME_OPTIONS.find((t) => t.value === timeVal)?.label || timeVal}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setSelectedTimes(
                                                    selectedTimes.filter((t) => t !== timeVal),
                                                )
                                            }
                                            className="hover:opacity-75 cursor-pointer"
                                        >
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                ))}

                                {selectedZones.map((zoneVal) => (
                                    <span
                                        key={`zone-${zoneVal}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20"
                                    >
                                        <span>Brgy. {zoneVal}</span>
                                        <button
                                            onClick={() =>
                                                setSelectedZones(
                                                    selectedZones.filter((z) => z !== zoneVal),
                                                )
                                            }
                                            className="hover:opacity-75 cursor-pointer"
                                        >
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                ))}

                                {searchQuery.trim() && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10">
                                        <span>Search: "{searchQuery}"</span>
                                        <button onClick={clearSearch} className="hover:opacity-75 cursor-pointer">
                                            <X className="w-3 h-3 ml-0.5" />
                                        </button>
                                    </span>
                                )}

                                <button
                                    onClick={handleResetFilters}
                                    className="ml-auto text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

                        {/* Table, Loading State, or Empty State */}
                        {isRecordsLoading && paginatedHistoryRecords.length === 0 ? (
                            <div className="py-16 px-4 text-center">
                                <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Loading incident records...
                                </p>
                            </div>
                        ) : paginatedHistoryRecords.length === 0 ? (
                            <div className="py-14 px-4 text-center">
                                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    No Incidents Found
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                    No historical incident records match the active Category, Chief Complaint, Month, Time, Barangay, or Search criteria.
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
                            <div className="p-4 space-y-4">
                                <div className={isRecordsFetching ? 'opacity-60 transition-opacity duration-150' : 'transition-opacity duration-150'}>
                                    <DataTable
                                        columns={archiveColumns}
                                        data={paginatedHistoryRecords}
                                        keyField="id"
                                        emptyTitle="No incidents found"
                                        emptyDescription="No incidents match the active criteria."
                                        onRowClick={(row) => {
                                            setViewing(row);
                                        }}
                                    />
                                </div>

                                {/* Pagination Footer Bar */}
                                <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span>
                                            Showing{' '}
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {recordsFrom}–{recordsTo}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {recordsTotal}
                                            </span>{' '}
                                            records
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <label
                                                htmlFor="incident-records-per-page"
                                                className="text-slate-500 dark:text-slate-400"
                                            >
                                                Rows:
                                            </label>
                                            <select
                                                id="incident-records-per-page"
                                                value={recordsPerPage}
                                                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                                                className="text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 cursor-pointer"
                                            >
                                                <option value={10}>10</option>
                                                <option value={15}>15</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Page{' '}
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {recordsPage}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {recordsLastPage}
                                            </span>
                                        </span>
                                        <div className="[&>div]:mt-0">
                                            <Pagination
                                                currentPage={recordsPage}
                                                lastPage={recordsLastPage}
                                                total={recordsTotal}
                                                perPage={recordsPerPage}
                                                onPageChange={setRecordsPage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Details Drawer */}
            <IncidentDetails
                incident={viewing}
                open={!!viewing}
                onClose={() => setViewing(null)}
                onAssignUnit={(inc) => setAssigningIncident(inc)}
                incidentTypes={incidentTypes}
            />

            {/* Locate Incident Map & Details Modal */}
            <IncidentLocateModal
                incident={locatingIncident}
                open={!!locatingIncident}
                onClose={() => setLocatingIncident(null)}
                onOpenDetails={(inc) => setViewing(inc)}
                barangayGeojson={barangayGeojson}
                categoryLabel={
                    locatingIncident
                        ? resolveAuthoritativeCategory(
                              getIncidentChiefComplaint(locatingIncident),
                              locatingIncident.incident_type?.name ||
                                  locatingIncident.incident_type?.incident_type_name ||
                                  '',
                          )
                        : undefined
                }
                chiefComplaintLabel={
                    locatingIncident
                        ? getIncidentChiefComplaint(locatingIncident) || undefined
                        : undefined
                }
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

            {/* Add Category Modal */}
            <AddCategoryModal
                open={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
                onAddCategory={handleAddCategory}
                existingCategories={availableCategories}
            />

            {/* Add Chief Complaint Modal */}
            <AddIncidentTypeModal
                open={isAddIncidentModalOpen}
                onClose={() => setIsAddIncidentModalOpen(false)}
                onAddIncidentType={handleAddIncidentType}
                categories={availableCategories}
                defaultCategory={selectedCategories.length === 1 ? selectedCategories[0] : undefined}
            />

            {/* Official MDRRMO Monthly Response Report Print Preview Modal */}
            <MonthlyReportPrintModal
                isOpen={isMonthlyReportModalOpen}
                onClose={() => setIsMonthlyReportModalOpen(false)}
            />

            {/* All Filtered Incident Pins Map & Printable Map Modal */}
            <IncidentPinsMapModal
                open={isPinsMapModalOpen}
                onClose={() => setIsPinsMapModalOpen(false)}
                filters={{
                    categories: selectedCategories,
                    incidents: selectedIncidents,
                    months: selectedMonths,
                    monthLabels: selectedMonths.map(
                        (mv) => MONTH_OPTIONS.find((m) => m.value === mv)?.label || mv,
                    ),
                    times: selectedTimes,
                    timeLabels: selectedTimes.map(
                        (tv) => TIME_OPTIONS.find((t) => t.value === tv)?.label || tv,
                    ),
                    barangays: selectedZones,
                    search: searchQuery,
                    customIncidents,
                }}
                barangayGeojson={barangayGeojson}
                preparedByName={preparedByName}
                resolveCategory={(row) =>
                    resolveAuthoritativeCategory(
                        getIncidentChiefComplaint(row),
                        row?.incident_type?.name ||
                            row?.incident_type?.incident_type_name ||
                            '',
                    )
                }
                resolveChiefComplaint={(row) => getIncidentChiefComplaint(row)}
            />
        </div>
    );
}
