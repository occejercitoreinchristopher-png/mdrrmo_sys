import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
    Plus, 
    Pencil, 
    Trash2, 
    MapPin, 
    ArrowLeft, 
    ArrowRight,
    Eye, 
    Search, 
    Filter,
    Compass,
    Building2,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    List,
    Sparkles,
    Navigation,
    Layers,
    ShieldCheck,
    Mountain,
    Waves,
    TreePine,
    Radio,
    ChevronRight,
    Check
} from 'lucide-react';
import DataTable, { Column } from '@/shared/components/DataTable';
import Button from '@/shared/components/Button';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';
import LocationCodeFormModal, { LOCATION_TYPES } from './LocationCodeFormModal';
import ViewLocationModal from './ViewLocationModal';
import { useBarangayLocationCodesQuery, LocationCode } from './useBarangayLocationCodesQuery';
import { toPascalCase } from '@/shared/utils/utils';
import { OPOL_LANDMARKS } from '@/dispatcher/data/opolLandmarks';

export interface Barangay {
    id: number;
    name: string;
    municipality: string;
    province: string;
    location_codes_count: number;
    location_codes?: LocationCode[];
}

interface BarangayTableProps {
    barangays: Barangay[];
}

export interface BarangayProfile {
    zone: string;
    zoneType: 'coastal' | 'highway' | 'inland' | 'upland';
    keyLandmarks: string;
    elevation: string;
    description: string;
}

export const OPOL_BARANGAY_PROFILES: Record<string, BarangayProfile> = {
    'Awang': {
        zone: 'Upland Hinterland',
        zoneType: 'upland',
        keyLandmarks: 'Awang Elementary & Hinterland Barangay Hall',
        elevation: '~280m ASL',
        description: 'Upland agricultural community and rural hinterland route.',
    },
    'Bagocboc': {
        zone: 'Upland Ridge & Forest',
        zoneType: 'upland',
        keyLandmarks: 'Bagocboc Elementary & Ridge Watershed',
        elevation: '~320m ASL',
        description: 'Mountain ridge district with watershed forest reserves.',
    },
    'Barra': {
        zone: 'Coastal Urban Corridor',
        zoneType: 'coastal',
        keyLandmarks: 'CDO City Border, Coastal Baywalk, Barra Elem',
        elevation: '~5m ASL',
        description: 'Dense coastal corridor bordering Cagayan de Oro City.',
    },
    'Bonbon': {
        zone: 'Coastal Residential',
        zoneType: 'coastal',
        keyLandmarks: 'Bonbon Beach, Coastal Road & Fisheries',
        elevation: '~6m ASL',
        description: 'Coastal settlement with municipal beachline and fishing zones.',
    },
    'Cauyonan': {
        zone: 'Upland Watershed',
        zoneType: 'upland',
        keyLandmarks: 'Agro-Forestry & Highland Hinterland Hall',
        elevation: '~210m ASL',
        description: 'Upland forest and agricultural transition zone.',
    },
    'Igpit': {
        zone: 'Highway Industrial & Coastal',
        zoneType: 'coastal',
        keyLandmarks: 'Apple Tree Resort, National Highway Belt, San Pedro',
        elevation: '~12m ASL',
        description: 'Major arterial highway commercial corridor and coastal resorts.',
    },
    'Limonda': {
        zone: 'Mountain Forest Reserve',
        zoneType: 'upland',
        keyLandmarks: 'Hinterland Forest, Limonda Watershed',
        elevation: '~450m ASL',
        description: 'High-elevation mountain hinterland and headwater reserve.',
    },
    'Luyongbonbon': {
        zone: 'Coastal Tourism Belt',
        zoneType: 'coastal',
        keyLandmarks: 'Beach Resorts, Coastal Agro-Fisheries',
        elevation: '~5m ASL',
        description: 'Tourism and beach recreation zone with coastal communities.',
    },
    'Malanang': {
        zone: 'Inland Agricultural Basin',
        zoneType: 'inland',
        keyLandmarks: 'Malanang Central, River Valley & Farms',
        elevation: '~50m ASL',
        description: 'Fertile river basin with agricultural farmlands.',
    },
    'Nangcaon': {
        zone: 'Inland Foothills',
        zoneType: 'inland',
        keyLandmarks: 'Nangcaon Elem, Foothill Agro-Communities',
        elevation: '~120m ASL',
        description: 'Inland foothill district connecting plains to highlands.',
    },
    'Patag': {
        zone: 'Inland Agro-Residential',
        zoneType: 'inland',
        keyLandmarks: 'Patag Hall, Transition Zone to Highlands',
        elevation: '~35m ASL',
        description: 'Expanding inland residential and agricultural transition.',
    },
    'Poblacion': {
        zone: 'Municipal Commercial Center',
        zoneType: 'coastal',
        keyLandmarks: 'Municipal Hall, Opol Public Market, Church',
        elevation: '~8m ASL',
        description: 'Administrative capital, municipal center, and commercial core.',
    },
    'Taboc': {
        zone: 'Highway Suburban Corridor',
        zoneType: 'highway',
        keyLandmarks: 'Taboc Elementary, Highway Commercial Line',
        elevation: '~15m ASL',
        description: 'Strategic highway corridor linking coastal and interior zones.',
    },
    'Tingalan': {
        zone: 'Highland Mountain Valley',
        zoneType: 'upland',
        keyLandmarks: 'Tingalan Elem & Mountainous Agro-Valley',
        elevation: '~390m ASL',
        description: 'Rugged upland valley community with scenic mountain terrain.',
    },
};

export default function BarangayTable({ barangays = [] }: BarangayTableProps) {
    const { errors = {} } = usePage().props as any;

    // View state: selected barangay for drill-down
    const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(null);

    // View mode: 'table' or 'grid'
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Filter states for Barangay list
    const [barangaySearch, setBarangaySearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'mapped' | 'unmapped' | 'coastal' | 'inland_upland'>('all');

    // TanStack Query for Location Codes under selected barangay
    const {
        search: codeSearch,
        setSearch: setCodeSearch,
        debouncedSearch,
        typeFilter: selectedTypeFilter,
        setTypeFilter: setSelectedTypeFilter,
        page,
        setPage,
        perPage,
        locationCodes,
        total: activeLocationCodesTotal,
        currentPage,
        lastPage,
        from,
        to,
        isLoading: codesLoading,
        isFetching: codesFetching,
        refetch: refetchLocationCodes,
    } = useBarangayLocationCodesQuery({
        barangayId: selectedBarangayId,
        debounceMs: 300,
        initialPerPage: 15,
    });

    // Modal states
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<LocationCode | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<LocationCode | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [viewTarget, setViewTarget] = useState<LocationCode | null>(null);

    // Current selected barangay object
    const selectedBarangay = useMemo(() => {
        if (!selectedBarangayId) return null;
        return barangays.find((b) => b.id === selectedBarangayId) ?? null;
    }, [barangays, selectedBarangayId]);

    // Count surveyed landmarks from OPOL_LANDMARKS dataset
    const landmarkCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        (OPOL_LANDMARKS || []).forEach((lm) => {
            const b = lm.barangay?.toLowerCase().replace(/\s+/g, '') || '';
            counts[b] = (counts[b] || 0) + 1;
        });
        return counts;
    }, []);

    // Mapped vs Unmapped counts
    const mappedCount = useMemo(() => {
        return barangays.filter((b) => (b.location_codes_count || 0) > 0).length;
    }, [barangays]);

    const unmappedCount = useMemo(() => {
        return barangays.length - mappedCount;
    }, [barangays, mappedCount]);

    // Filtered Barangays based on search and active filter
    const filteredBarangays = useMemo(() => {
        const q = barangaySearch.toLowerCase().trim();
        return barangays.filter((b) => {
            const profile = OPOL_BARANGAY_PROFILES[b.name] || {
                zone: 'General District',
                zoneType: 'inland',
                keyLandmarks: '',
                elevation: '',
                description: '',
            };

            // Search filter
            if (q) {
                const matchesName = b.name.toLowerCase().includes(q);
                const matchesZone = profile.zone.toLowerCase().includes(q);
                const matchesLandmarks = profile.keyLandmarks.toLowerCase().includes(q);
                if (!matchesName && !matchesZone && !matchesLandmarks) {
                    return false;
                }
            }

            // Quick filter
            if (activeFilter === 'mapped') {
                return (b.location_codes_count || 0) > 0;
            }
            if (activeFilter === 'unmapped') {
                return (b.location_codes_count || 0) === 0;
            }
            if (activeFilter === 'coastal') {
                return profile.zoneType === 'coastal';
            }
            if (activeFilter === 'inland_upland') {
                return profile.zoneType === 'inland' || profile.zoneType === 'upland';
            }

            return true;
        });
    }, [barangays, barangaySearch, activeFilter]);

    // Open create code modal
    const handleOpenCreateCode = () => {
        setEditingCode(null);
        setFormModalOpen(true);
    };

    // Open edit code modal
    const handleOpenEditCode = (code: LocationCode) => {
        setEditingCode(code);
        setFormModalOpen(true);
    };

    // Form submit for Add / Edit
    const handleFormSubmit = (formData: any) => {
        setSubmitting(true);
        if (editingCode) {
            router.patch(`/admin/location-codes/${editingCode.id}`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setFormModalOpen(false);
                    setSubmitting(false);
                    setEditingCode(null);
                    refetchLocationCodes();
                },
                onError: () => {
                    setSubmitting(false);
                },
            });
        } else if (selectedBarangay) {
            router.post(`/admin/barangays/${selectedBarangay.id}/location-codes`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setFormModalOpen(false);
                    setSubmitting(false);
                    refetchLocationCodes();
                },
                onError: () => {
                    setSubmitting(false);
                },
            });
        }
    };

    // Delete Location Code handler
    const handleDeleteLocationCode = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/location-codes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
                refetchLocationCodes();
            },
            onError: () => {
                setDeleting(false);
            },
        });
    };

    // Helper to get Zone Badge Color
    const getZoneBadge = (zoneType: string, zone: string) => {
        switch (zoneType) {
            case 'coastal':
                return {
                    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
                    icon: Waves,
                };
            case 'highway':
                return {
                    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                    icon: Navigation,
                };
            case 'upland':
                return {
                    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
                    icon: Mountain,
                };
            default:
                return {
                    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                    icon: TreePine,
                };
        }
    };

    // Columns for the 14 Barangays Table
    const barangayColumns: Column<Barangay>[] = [
        {
            key: 'index',
            header: '#',
            render: (_: any, __: Barangay, index: number) => (
                <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                    #{String(index + 1).padStart(2, '0')}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Official Barangay',
            sortable: true,
            render: (v: string, row: Barangay) => {
                const profile = OPOL_BARANGAY_PROFILES[row.name] || {
                    zone: 'General LGU Sector',
                    zoneType: 'inland',
                    keyLandmarks: '',
                    elevation: '',
                    description: '',
                };
                const zoneStyle = getZoneBadge(profile.zoneType, profile.zone);
                const ZoneIcon = zoneStyle.icon;

                return (
                    <div 
                        onClick={() => setSelectedBarangayId(row.id)}
                        className="cursor-pointer group flex items-start gap-3 py-1"
                    >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:border-red-500/40 group-hover:bg-red-500/5 transition-all">
                            <ZoneIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                                    Barangay {toPascalCase(v)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'profile',
            header: 'Geographic Profile',
            render: (_: any, row: Barangay) => {
                const profile = OPOL_BARANGAY_PROFILES[row.name];

                return (
                    <div className="space-y-1 max-w-sm">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                            {profile?.keyLandmarks || 'LGU Center & Residential District'}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'location_codes_count',
            header: 'CAD Location Markers',
            sortable: true,
            render: (count: number, row: Barangay) => {
                const total = count || row.location_codes?.length || 0;
                return (
                    <div>
                        {total > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                {total} {total === 1 ? 'Registered Marker' : 'Registered Markers'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                0 Markers (Pending Survey)
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Action',
            render: (_: any, row: Barangay) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBarangayId(row.id);
                    }}
                    className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/15 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 hover:border-red-500/30 transition-all shadow-xs cursor-pointer"
                >
                    <span>Manage Markers</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                </button>
            ),
        },
    ];

    // Helper to get type badge styling
    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'Post / Streetlight':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
            case 'Bridge':
                return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
            case 'Barangay Hall':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
            case 'School':
                return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
            case 'Health Facility':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
            case 'Evacuation Center':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
            case 'Road':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
            default:
                return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
        }
    };

    // Columns for Location Codes Table under the selected Barangay
    const locationCodeColumns: Column<LocationCode>[] = [
        {
            key: 'location_code',
            header: 'Code',
            sortable: true,
            render: (code: string) => (
                <span className="font-mono text-xs font-bold bg-slate-900 text-white dark:bg-slate-950 dark:text-white border border-slate-700 dark:border-white/15 px-2.5 py-1 rounded-md tracking-wider inline-block shadow-xs">
                    {code}
                </span>
            ),
        },
        {
            key: 'location_type',
            header: 'Type',
            sortable: true,
            render: (type: string) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getTypeBadgeClass(type)} capitalize`}>
                    {toPascalCase(type)}
                </span>
            ),
        },
        {
            key: 'location_name',
            header: 'Location / Landmark',
            sortable: true,
            render: (name: string, row: LocationCode) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs capitalize">
                        {toPascalCase(name)}
                    </div>
                    {row.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            {row.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'coordinates',
            header: 'Coordinates',
            render: (_: any, row: LocationCode) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setViewTarget(row);
                    }}
                    title="View on Map"
                    className="font-mono text-xs text-slate-700 dark:text-slate-300 hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                    <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
                    <span className="underline decoration-dotted underline-offset-2">
                        {Number(row.latitude).toFixed(6)}, {Number(row.longitude).toFixed(6)}
                    </span>
                </button>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: LocationCode) => (
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewTarget(row);
                        }}
                        title="View on Interactive Map"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 dark:text-slate-400 dark:hover:text-primary transition-colors cursor-pointer"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCode(row);
                        }}
                        title="Edit Marker"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 dark:text-slate-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(row);
                        }}
                        title="Delete Marker"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // ==========================================
    // VIEW 1: OVERVIEW OF 14 OFFICIAL BARANGAYS
    // ==========================================
    if (!selectedBarangay) {
        return (
            <div className="space-y-6">
                {/* Executive Top Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 border border-slate-800 shadow-xl">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-1/3 -mb-16 w-48 h-48 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wider uppercase">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <Compass className="w-3.5 h-3.5" />
                                Geographic Information System (GIS)
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Barangays & CAD Geolocation Registry
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Complete administrative registry of the <strong className="text-white">14 official barangays of Opol, Misamis Oriental</strong>. 
                                Manage emergency landmark codes, streetlight reference markers, and tactical GIS coordinates for telephone CAD dispatches.
                            </p>
                        </div>

                        {/* View Switcher & Quick Stats */}
                        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                            <div className="flex items-center p-1 bg-slate-800/90 border border-slate-700/80 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === 'table'
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                    Table View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === 'grid'
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Tactical Cards
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                activeFilter === 'all'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            All Barangays ({barangays.length || 14})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('mapped')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                activeFilter === 'mapped'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            With Markers ({mappedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('unmapped')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                activeFilter === 'unmapped'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            Needs Survey ({unmappedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('coastal')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                activeFilter === 'coastal'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            Coastal Belt
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('inland_upland')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                activeFilter === 'inland_upland'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            Inland & Upland
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="w-full sm:w-72 shrink-0">
                        <SearchInput
                            placeholder="Filter by barangay or landmark..."
                            value={barangaySearch}
                            onChange={setBarangaySearch}
                            className="w-full text-xs"
                        />
                    </div>
                </div>

                {/* Content: Table View vs Tactical Cards */}
                {viewMode === 'table' ? (
                    <Card padding={false} className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">
                                Showing {filteredBarangays.length} of {barangays.length || 14} Official Barangays
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Click any barangay row to configure its CAD location markers
                            </span>
                        </div>
                        <div className="p-4">
                            <DataTable
                                columns={barangayColumns}
                                data={filteredBarangays}
                                keyField="id"
                                emptyTitle="No barangay matching search"
                                emptyDescription="Try searching for a different barangay name, zone, or landmark."
                                emptyIcon={MapPin}
                            />
                        </div>
                    </Card>
                ) : (
                    /* Tactical Cards Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBarangays.map((b, idx) => {
                            const profile = OPOL_BARANGAY_PROFILES[b.name] || {
                                zone: 'General District',
                                zoneType: 'inland',
                                keyLandmarks: '',
                                elevation: '',
                                description: '',
                            };
                            const zoneStyle = getZoneBadge(profile.zoneType, profile.zone);
                            const ZoneIcon = zoneStyle.icon;
                            const cleanName = b.name.toLowerCase().replace(/\s+/g, '');
                            const poisCount = landmarkCounts[cleanName] || 0;
                            const markersCount = b.location_codes_count || 0;

                            return (
                                <div
                                    key={b.id}
                                    onClick={() => setSelectedBarangayId(b.id)}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-red-500/50 dark:hover:border-red-500/50 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none" />

                                    <div>
                                        {/* Card Top Row */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                                                #{String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${zoneStyle.bg}`}>
                                                <ZoneIcon className="w-3 h-3" />
                                                {profile.zone}
                                            </span>
                                        </div>

                                        {/* Barangay Name */}
                                        <div className="mt-3">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                                                Barangay {b.name}
                                            </h3>
                                        </div>

                                        {/* Landmarks note */}
                                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                            {profile.keyLandmarks || profile.description}
                                        </div>
                                    </div>

                                    {/* Card Footer: Metrics & Action */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">CAD Markers:</span>
                                            {markersCount > 0 ? (
                                                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                                    {markersCount} Registered
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 font-medium">
                                                    0 (Pending)
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Surveyed POIs:</span>
                                            <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                                                {poisCount} POIs
                                            </span>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between text-xs font-bold text-red-500 dark:text-red-400 group-hover:underline">
                                            <span>Manage Geolocation Markers</span>
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ==================================================
    // VIEW 2: LOCATION CODE MANAGEMENT (SELECTED BARANGAY)
    // ==================================================
    const currentProfile = OPOL_BARANGAY_PROFILES[selectedBarangay.name] || {
        zone: 'General LGU Sector',
        zoneType: 'inland',
        keyLandmarks: '',
        elevation: '',
        description: '',
    };
    const zoneStyle = getZoneBadge(currentProfile.zoneType, currentProfile.zone);
    const ZoneIcon = zoneStyle.icon;
    const cleanBarangayName = selectedBarangay.name.toLowerCase().replace(/\s+/g, '');
    const currentPoisCount = landmarkCounts[cleanBarangayName] || 0;

    return (
        <div className="space-y-6">
            {/* Navigation & Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 border border-slate-800 shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        {/* Breadcrumb Back Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedBarangayId(null);
                                setCodeSearch('');
                                setSelectedTypeFilter('');
                                setPage(1);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return to All 14 Barangays
                        </button>

                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Barangay {selectedBarangay.name}
                            </h1>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${zoneStyle.bg}`}>
                                <ZoneIcon className="w-3.5 h-3.5" />
                                {currentProfile.zone}
                            </span>
                        </div>

                        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                            Emergency marker registry & coordinates for <strong className="text-white">Barangay {selectedBarangay.name}, Municipality of Opol</strong>. 
                            Markers registered here immediately appear in the Dispatcher Phone Intake live search.
                        </p>

                        <div className="flex items-center gap-4 pt-1 flex-wrap text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {activeLocationCodesTotal} Active CAD Markers
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                                <Compass className="w-3.5 h-3.5" />
                                {currentPoisCount} Surveyed OpenStreetMap POIs
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                        <Button
                            onClick={handleOpenCreateCode}
                            variant="admin"
                            className="gap-2 shadow-lg px-4 py-2.5 text-xs font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            Register Location Code
                        </Button>
                    </div>
                </div>
            </div>

            {/* Location Codes Table & Filters Card */}
            <Card padding={false} className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40">
                    <SearchInput
                        placeholder="Search code (e.g. POB-001), landmark, or street..."
                        value={codeSearch}
                        onChange={setCodeSearch}
                        debounce={0}
                        className="w-full sm:flex-1 sm:max-w-xs text-xs"
                    />

                    <div className="w-full sm:w-auto flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="w-full sm:w-56 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-xs"
                        >
                            <option value="">All Location Types</option>
                            {LOCATION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {codesFetching && !codesLoading && (
                            <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                Searching...
                            </span>
                        )}
                        <span>
                            Showing {from || 0}–{to || 0} of {activeLocationCodesTotal} codes
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    <DataTable
                        columns={locationCodeColumns}
                        data={locationCodes}
                        loading={codesLoading}
                        keyField="id"
                        emptyTitle="No location codes registered"
                        emptyDescription={
                            debouncedSearch || selectedTypeFilter
                                ? 'No location codes match your search or category filter criteria.'
                                : `No emergency location codes have been registered yet for Barangay ${selectedBarangay.name}. Click "+ Register Location Code" to register streetlight poles, evacuation hubs, bridges, and landmarks.`
                        }
                        emptyIcon={MapPin}
                    />

                    {/* Pagination */}
                    {activeLocationCodesTotal > perPage && (
                        <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-3">
                            <Pagination
                                currentPage={currentPage}
                                lastPage={lastPage}
                                total={activeLocationCodesTotal}
                                perPage={perPage}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Add / Edit Location Code Modal with Mapbox */}
            {selectedBarangay && (
                <LocationCodeFormModal
                    open={formModalOpen}
                    onClose={() => {
                        setFormModalOpen(false);
                        setEditingCode(null);
                    }}
                    barangay={{ 
                        id: selectedBarangay.id, 
                        name: selectedBarangay.name,
                        location_codes: selectedBarangay.location_codes ?? []
                    }}
                    locationCode={editingCode}
                    onSubmit={handleFormSubmit}
                    loading={submitting}
                    errors={errors}
                />
            )}

            {/* View Location on Map Modal */}
            <ViewLocationModal
                open={Boolean(viewTarget)}
                onClose={() => setViewTarget(null)}
                locationCode={viewTarget}
            />

            {/* Confirm Delete Location Code Dialog */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteLocationCode}
                loading={deleting}
                title="Delete Location Code"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete location code "${deleteTarget.location_code}" (${deleteTarget.location_name})? This action cannot be undone. The barangay itself will NOT be affected.`
                        : ''
                }
                confirmLabel="Delete Location Code"
            />
        </div>
    );
}
