import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import AdminLayout from '@/admin/layouts/AdminLayout';
import PageHeader from '@/shared/components/PageHeader';
import { printPatientCareRecord } from '@/dispatcher/utils/printPatientCareRecord';
import MultiSelectFilterCombobox from '@/dispatcher/components/Incidents/MultiSelectFilterCombobox';
import ManualPinModal from '@/shared/components/ManualPinModal';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Flame,
    MapPin,
    AlertTriangle,
    Activity,
    Calendar,
    Clock,
    Search,
    Filter,
    RotateCcw,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
    Layers,
    Eye,
    EyeOff,
    Navigation,
    Shield,
    TrendingUp,
    BarChart3,
    PieChart,
    ArrowLeft,
    CheckCircle2,
    Info,
    ExternalLink,
    X,
    Building2,
    AlertCircle,
    Compass,
    Radio,
    Phone,
    User,
    Truck,
    Camera,
    Copy,
    Check,
    FileText,
    Smartphone,
    PhoneCall,
    UserCheck,
    HeartPulse,
    Users,
    Plus,
    Trash2
} from 'lucide-react';

interface IncidentRecord {
    id: number;
    incident_id: number;
    incident_number?: string;
    incident_type: string;
    incident_type_id: number | null;
    type_filter_key?: string | null;
    is_manual_pin?: boolean;
    manual_pin_id?: number | null;
    status: string;
    priority: string;
    address: string;
    purok_or_location?: string;
    barangay: string;
    description: string;
    chief_complaint: string;
    latitude: number | null;
    longitude: number | null;
    has_coords: boolean;
    created_at: string | null;
    formatted_date: string;
    incident_date?: string;
    incident_time?: string;
    time_ago: string;
    caller_name?: string;
    caller_phone?: string;
    report_source?: string;
    verified_by?: string | null;
    verification_remarks?: string | null;
    reported_at?: string | null;
    verified_at?: string | null;
    resolved_at?: string | null;
    images?: Array<{
        id: number;
        image_path: string;
        url: string;
        source_role?: 'responder' | 'resident';
        source_label?: string;
        uploaded_by?: string | null;
        captured_at?: string | null;
        is_grayscale?: boolean;
        is_manual_pin_image?: boolean;
    }>;
    dispatches?: Array<{
        id: number;
        status: string;
        ambulance_unit: string;
        ambulance_plate: string;
        driver_name: string;
        crew_members: string[];
        pcr_patient?: string | null;
        pcr_hospital?: string | null;
        pcr_condition?: string | null;
        dispatched_at?: string | null;
        arrived_at?: string | null;
        completed_at?: string | null;
    }>;
    patients?: Array<{
        id: number;
        pcr_id: number;
        patient_id?: number | null;
        name: string;
        gender?: string;
        birthdate?: string | null;
        age?: number | null;
        address?: string;
        is_unidentified?: boolean;
        chief_complaint?: string;
        destination_hospital?: string | null;
        disposition?: string;
        ambulance_unit?: string | null;
        responders?: string | null;
        pcr_record?: any;
    }>;
}

interface HotspotRecord {
    cluster_key: string;
    cluster_id?: string;
    latitude: number;
    longitude: number;
    seed_latitude?: number;
    seed_longitude?: number;
    location_name: string;
    barangay: string;
    incident_type?: string;
    incident_type_id?: number | null;
    unique_types?: string[];
    incident_count: number;
    most_common_type: string;
    classification?: string;
    intensity: 'Critical' | 'High' | 'Moderate';
    intensity_class: 'critical' | 'high' | 'moderate';
    color: string;
    badge_text?: string;
    radius_meters?: number;
    incident_ids: number[];
    incidents?: IncidentRecord[];
    recent_incidents: Array<{
        id: number;
        type: string;
        date: string;
        status: string;
    }>;
    meets_threshold: boolean;
    rank?: number;
}

interface AnalyticsData {
    by_barangay: {
        labels: string[];
        series: number[];
    };
    by_type: {
        labels: string[];
        series: number[];
    };
    monthly_trend: {
        categories: string[];
        series: number[];
    };
}

interface AccidentHeatmapProps {
    incidents?: IncidentRecord[];
    hotspots?: HotspotRecord[];
    analytics?: AnalyticsData;
    barangayGeojson?: any;
    incidentTypes?: Array<{ id: number; incident_type_name: string }>;
    customPinTypes?: string[];
    availableYears?: number[];
    opolBarangays?: string[];
    filters?: {
        period?: string;
        years?: string[];
        months?: string[];
        barangays?: string[];
        emergency_types?: string[];
        status?: string;
        min_threshold?: number;
    };
    totalIncidentsCount?: number;
    validCoordinatesCount?: number;
    missingCoordinatesCount?: number;
    userRole?: string;
}

const MONTH_OPTIONS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const OPOL_CENTER = {
    longitude: 124.577,
    latitude: 8.520,
    zoom: 12.4,
};

export default function AccidentHeatmapView({
    incidents = [],
    hotspots = [],
    analytics,
    barangayGeojson = null,
    incidentTypes = [],
    customPinTypes = [],
    availableYears = [],
    opolBarangays = [],
    filters = {},
    totalIncidentsCount = 0,
    validCoordinatesCount = 0,
    missingCoordinatesCount = 0,
    userRole = 'dispatcher',
}: AccidentHeatmapProps) {
    const mapRef = useRef<MapRef>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const inspectorScrollRef = useRef<HTMLDivElement>(null);

    // Sync chart theme with app Light/Dark mode toggle
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const syncTheme = () => setIsDarkMode(root.classList.contains('dark'));
        syncTheme();
        const observer = new MutationObserver(syncTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Multi-Select Filter states
    const [selectedPeriod, setSelectedPeriod] = useState<string>(filters.period || 'all');
    const [selectedYears, setSelectedYears] = useState<string[]>(filters.years || []);
    const [selectedMonths, setSelectedMonths] = useState<string[]>(filters.months || []);
    const [selectedBarangays, setSelectedBarangays] = useState<string[]>(filters.barangays || []);
    const [selectedEmergencyTypes, setSelectedEmergencyTypes] = useState<string[]>(filters.emergency_types || []);
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
    const [minThreshold, setMinThreshold] = useState<number>(filters.min_threshold ?? 1);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [deletingPinId, setDeletingPinId] = useState<number | null>(null);
    const [confirmDeletePin, setConfirmDeletePin] = useState<IncidentRecord | null>(null);

    // Keep local filter state synced if server props update
    useEffect(() => {
        setSelectedPeriod(filters.period || 'all');
        setSelectedYears(Array.isArray(filters.years) ? filters.years : []);
        setSelectedMonths(Array.isArray(filters.months) ? filters.months : []);
        setSelectedBarangays(Array.isArray(filters.barangays) ? filters.barangays : []);
        setSelectedEmergencyTypes(Array.isArray(filters.emergency_types) ? filters.emergency_types : []);
        setSelectedStatus(filters.status || 'all');
        setMinThreshold(Number(filters.min_threshold ?? 1));
    }, [
        filters.period,
        JSON.stringify(filters.years || []),
        JSON.stringify(filters.months || []),
        JSON.stringify(filters.barangays || []),
        JSON.stringify(filters.emergency_types || []),
        filters.status,
        filters.min_threshold,
    ]);

    // Map view and layer controls
    const [viewState, setViewState] = useState(OPOL_CENTER);
    const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
    const [showMarkers, setShowMarkers] = useState(true);
    const [showBarangayBoundaries, setShowBarangayBoundaries] = useState(true);
    const [selectedHotspot, setSelectedHotspot] = useState<HotspotRecord | null>(null);
    const [activeIncidentIdx, setActiveIncidentIdx] = useState<number>(0);
    const [lightboxState, setLightboxState] = useState<{
        images: Array<{
            id?: number;
            url: string;
            source_role?: 'responder' | 'resident';
            source_label?: string;
            uploaded_by?: string | null;
            captured_at?: string | null;
            is_grayscale?: boolean;
            is_manual_pin_image?: boolean;
        }>;
        index: number;
    } | null>(null);
    const [grayscaleOverrides, setGrayscaleOverrides] = useState<Record<string, boolean>>({});
    const [copiedCoord, setCopiedCoord] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const getPhotoKey = (img?: { id?: number; url?: string; is_manual_pin_image?: boolean } | null) =>
        img?.id
            ? `${img.is_manual_pin_image ? 'manual_' : 'inc_'}${img.id}`
            : `url_${img?.url || ''}`;

    const isPhotoGrayscale = (
        img?: { id?: number; url?: string; is_grayscale?: boolean; is_manual_pin_image?: boolean } | null
    ): boolean => {
        if (!img) return false;
        const key = getPhotoKey(img);
        if (Object.prototype.hasOwnProperty.call(grayscaleOverrides, key)) {
            return grayscaleOverrides[key];
        }
        return Boolean(img.is_grayscale);
    };

    const togglePhotoGrayscale = async (
        img?: { id?: number; url?: string; is_grayscale?: boolean; is_manual_pin_image?: boolean } | null
    ) => {
        if (!img) return;
        const key = getPhotoKey(img);
        const nextVal = !isPhotoGrayscale(img);

        // Instant optimistic UI update for this specific photo only
        setGrayscaleOverrides((prev) => ({ ...prev, [key]: nextVal }));

        // Persist in DB (supports both IncidentImage and HeatmapManualPinImage)
        if (img.id) {
            try {
                const csrfToken =
                    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                const prefix = userRole === 'admin' ? '/admin' : '/dispatcher';
                const endpoint = img.is_manual_pin_image
                    ? `${prefix}/accident-heatmap/manual-pin-images/${img.id}/grayscale`
                    : `${prefix}/incident-images/${img.id}/grayscale`;
                await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ is_grayscale: nextVal }),
                });
            } catch (err) {
                console.error('Failed to persist photo grayscale preference:', err);
            }
        }
    };

    // Keyboard navigation for photo enlarger lightbox (< / > / Esc) & Fullscreen exit (Esc)
    useEffect(() => {
        if (!lightboxState && !isFullScreen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (lightboxState) {
                if (e.key === 'Escape') {
                    setLightboxState(null);
                } else if (e.key === 'ArrowRight' && lightboxState.images.length > 1) {
                    setLightboxState((prev) =>
                        prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
                    );
                } else if (e.key === 'ArrowLeft' && lightboxState.images.length > 1) {
                    setLightboxState((prev) =>
                        prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null
                    );
                }
            } else if (isFullScreen && e.key === 'Escape') {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxState, isFullScreen]);

    // Build query params payload for server-synced multi-select filters
    const buildFilterParams = (overrides: Record<string, any> = {}) => {
        const nextPeriod = overrides.period !== undefined ? overrides.period : selectedPeriod;
        const nextYears: string[] = overrides.years !== undefined ? overrides.years : selectedYears;
        const nextMonths: string[] = overrides.months !== undefined ? overrides.months : selectedMonths;
        const nextBarangays: string[] = overrides.barangays !== undefined ? overrides.barangays : selectedBarangays;
        const nextTypes: string[] =
            overrides.emergency_types !== undefined ? overrides.emergency_types : selectedEmergencyTypes;
        const nextStatus = overrides.status !== undefined ? overrides.status : selectedStatus;
        const nextThreshold = overrides.min_threshold !== undefined ? overrides.min_threshold : minThreshold;

        const params: Record<string, any> = {
            period: nextPeriod,
            status: nextStatus,
            min_threshold: nextThreshold,
        };
        if (nextYears.length > 0) params.years = nextYears;
        if (nextMonths.length > 0) params.months = nextMonths;
        if (nextBarangays.length > 0) params.barangays = nextBarangays;
        if (nextTypes.length > 0) params.emergency_types = nextTypes;
        return params;
    };

    // Realtime Automatic Updates via WebSocket (Echo private-dispatcher channel) & Polling Heartbeat
    useEffect(() => {
        if (typeof window === 'undefined' || !(window as any).Echo) return;

        // @ts-ignore
        const channel = (window as any).Echo.private('dispatcher');
        if (!channel) return;

        const handleRealtimeIncidentUpdate = (eventName: string, payload?: any) => {
            console.log(`[Incident Heatmap] Realtime event: ${eventName}, automatically recalculating 20m clusters...`, payload);
            router.reload({
                only: [
                    'incidents',
                    'hotspots',
                    'analytics',
                    'customPinTypes',
                    'availableYears',
                    'totalIncidentsCount',
                    'validCoordinatesCount',
                ],
                data: buildFilterParams(),
            });
        };

        const liveEvents = [
            'IncidentCreated',
            'IncidentVerified',
            'IncidentCancelled',
            'IncidentRejected',
            'IncidentUpdated',
            'DispatchCreated',
            'DispatchCompleted',
            'ResidentCalledResponder',
        ];

        liveEvents.forEach((ev) => {
            channel.listen(ev, (data: any) => handleRealtimeIncidentUpdate(ev, data));
            channel.listen(`.${ev}`, (data: any) => handleRealtimeIncidentUpdate(`.${ev}`, data));
        });

        // 30-second automated heartbeat refresh to guarantee zero stale data
        const heartbeat = setInterval(() => {
            router.reload({
                only: [
                    'incidents',
                    'hotspots',
                    'analytics',
                    'customPinTypes',
                    'availableYears',
                    'totalIncidentsCount',
                    'validCoordinatesCount',
                ],
                data: buildFilterParams(),
            });
        }, 30000);

        return () => {
            liveEvents.forEach((ev) => {
                channel.stopListening(ev);
                channel.stopListening(`.${ev}`);
            });
            clearInterval(heartbeat);
        };
    }, [
        selectedPeriod,
        JSON.stringify(selectedYears),
        JSON.stringify(selectedMonths),
        JSON.stringify(selectedBarangays),
        JSON.stringify(selectedEmergencyTypes),
        selectedStatus,
        minThreshold,
    ]);

    // Auto-resize Mapbox canvas whenever container geometry changes (fullscreen, sidebar, or right-panel width toggle)
    useEffect(() => {
        if (!mapContainerRef.current) return;
        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });
        observer.observe(mapContainerRef.current);

        const timer1 = setTimeout(() => mapRef.current?.resize(), 150);
        const timer2 = setTimeout(() => mapRef.current?.resize(), 400);

        return () => {
            observer.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isFullScreen, Boolean(selectedHotspot)]);

    // Handle filter application via Inertia router
    const applyFilters = (overrides: Record<string, any> = {}) => {
        const params = buildFilterParams(overrides);

        const currentRoute =
            typeof window !== 'undefined' && window.location.pathname
                ? window.location.pathname
                : userRole === 'admin'
                ? '/admin/accident-heatmap'
                : '/dispatcher/accident-heatmap';

        router.get(currentRoute, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedPeriod('all');
        setSelectedYears([]);
        setSelectedMonths([]);
        setSelectedBarangays([]);
        setSelectedEmergencyTypes([]);
        setSelectedStatus('all');
        setMinThreshold(1);
        setSelectedHotspot(null);

        const currentRoute =
            typeof window !== 'undefined' && window.location.pathname
                ? window.location.pathname
                : userRole === 'admin'
                ? '/admin/accident-heatmap'
                : '/dispatcher/accident-heatmap';

        router.get(currentRoute, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDeleteManualPin = async (pinRecord: IncidentRecord) => {
        const manualPinId = pinRecord.manual_pin_id;
        if (!manualPinId) return;
        setDeletingPinId(manualPinId);
        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const prefix = userRole === 'admin' ? '/admin' : '/dispatcher';
            const resp = await fetch(`${prefix}/accident-heatmap/manual-pins/${manualPinId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (resp.ok) {
                setConfirmDeletePin(null);
                setSelectedHotspot(null);
                setActiveIncidentIdx(0);
                toast.success('Manual heatmap pin deleted.');
                router.reload({
                    only: [
                        'incidents',
                        'hotspots',
                        'analytics',
                        'customPinTypes',
                        'availableYears',
                        'totalIncidentsCount',
                        'validCoordinatesCount',
                    ],
                    data: buildFilterParams(),
                });
            } else {
                toast.error('Failed to delete manual pin. Please try again.');
            }
        } catch (err) {
            console.error('Failed to delete manual pin:', err);
            toast.error('Network error while deleting manual pin.');
        } finally {
            setDeletingPinId(null);
        }
    };

    // Multi-Select Filter Option Lists
    const yearFilterOptions = useMemo(() => {
        const list = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
        return list.map((yr) => ({ value: String(yr), label: String(yr) }));
    }, [availableYears]);

    const barangayFilterOptions = useMemo(
        () => opolBarangays.map((b) => ({ value: b, label: `Brgy. ${b}` })),
        [opolBarangays]
    );

    const emergencyTypeFilterOptions = useMemo(() => {
        const standard = incidentTypes.map((t) => ({
            value: `type_${t.id}`,
            label: t.incident_type_name,
        }));
        const custom = customPinTypes.map((c) => ({
            value: `custom_${c}`,
            label: `${c} (Manual Pin)`,
        }));
        return [...standard, ...custom];
    }, [incidentTypes, customPinTypes]);

    // Human-readable summary of active filters (displayed inside ManualPinModal map)
    const activeFilterSummary = useMemo(() => {
        const parts: string[] = [];
        if (selectedPeriod !== 'all') {
            parts.push(
                selectedPeriod === 'weekly'
                    ? 'Weekly'
                    : selectedPeriod === 'monthly'
                    ? 'Monthly'
                    : 'Yearly'
            );
        }
        if (selectedYears.length > 0) parts.push(`Year: ${selectedYears.join(', ')}`);
        if (selectedMonths.length > 0) {
            const labels = selectedMonths.map(
                (m) => MONTH_OPTIONS.find((o) => o.value === m)?.label?.slice(0, 3) || m
            );
            parts.push(`Month: ${labels.join(', ')}`);
        }
        if (selectedBarangays.length > 0) parts.push(`Brgy: ${selectedBarangays.join(', ')}`);
        if (selectedEmergencyTypes.length > 0) {
            const labels = selectedEmergencyTypes.map(
                (v) => emergencyTypeFilterOptions.find((o) => o.value === v)?.label || v
            );
            parts.push(`Type: ${labels.join(', ')}`);
        }
        return parts.length > 0 ? parts.join(' • ') : 'All Time • All Barangays • All Types';
    }, [
        selectedPeriod,
        selectedYears,
        selectedMonths,
        selectedBarangays,
        selectedEmergencyTypes,
        emergencyTypeFilterOptions,
    ]);

    // 1. Reactive Active Incidents (Real Incidents + Manual Pins) matching all Multi-Select filters
    const activeIncidents = useMemo(() => {
        return incidents.filter((inc) => {
            const st = (inc.status || '').toLowerCase();
            if (st === 'cancelled' || st === 'rejected') {
                return false;
            }

            // Multi-Select Emergency Type Filter (supports DB incident_type_id AND custom manual pin types)
            if (selectedEmergencyTypes.length > 0) {
                const incKey =
                    inc.type_filter_key ||
                    (inc.incident_type_id ? `type_${inc.incident_type_id}` : `custom_${inc.incident_type}`);
                const matched = selectedEmergencyTypes.some(
                    (sel) => sel.toLowerCase() === String(incKey).toLowerCase()
                );
                if (!matched) return false;
            }

            // Multi-Select Barangay Filter
            if (selectedBarangays.length > 0) {
                const incBrgy = (inc.barangay || '').replace(/[\s-]/g, '').toLowerCase();
                const matchedBrgy = selectedBarangays.some((b) => {
                    const target = b.replace(/[\s-]/g, '').toLowerCase();
                    return incBrgy === target || incBrgy.includes(target) || target.includes(incBrgy);
                });
                if (!matchedBrgy) return false;
            }

            // Multi-Select Year & Month Filters
            if (inc.created_at && (selectedYears.length > 0 || selectedMonths.length > 0)) {
                const dt = new Date(inc.created_at);
                if (!Number.isNaN(dt.getTime())) {
                    if (selectedYears.length > 0 && !selectedYears.includes(String(dt.getFullYear()))) {
                        return false;
                    }
                    if (selectedMonths.length > 0 && !selectedMonths.includes(String(dt.getMonth() + 1))) {
                        return false;
                    }
                }
            }

            // Status Filter (applies to regular incidents; manual pins stay visible)
            if (selectedStatus && selectedStatus !== 'all' && !inc.is_manual_pin) {
                if (inc.status !== selectedStatus) {
                    return false;
                }
            }

            return true;
        });
    }, [incidents, selectedEmergencyTypes, selectedBarangays, selectedYears, selectedMonths, selectedStatus]);

    // Haversine distance in meters (matches backend AccidentHeatmapController)
    const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // True ONLY when exactly 1 specific Emergency Type is checked;
    // False when "All" (0 checked) OR 2+ Emergency Types are checked!
    const isSpecificEmergencyType = selectedEmergencyTypes.length === 1;

    // Dynamic Risk Classification:
    // - All Emergency Types:       1-4 Low (Yellow), 5-8 Moderate (Orange), 9+ High (Red)
    // - Specific Emergency Type:   1-2 Low (Yellow), 3 Moderate (Orange),   4+ High (Red)
    const classifyClusterRisk = (count: number, isSpecificType: boolean) => {
        const highMin = isSpecificType ? 4 : 9;
        const modMin = isSpecificType ? 3 : 5;
        const isRed = count >= highMin;
        const isOrange = !isRed && count >= modMin;

        return {
            isRed,
            isOrange,
            color: isRed ? '#EF4444' : isOrange ? '#F97316' : '#EAB308',
            level: isRed ? 'High' : isOrange ? 'Moderate' : 'Low',
            classification: isRed
                ? 'High Incident Concentration'
                : isOrange
                ? 'Moderate Incident Concentration'
                : 'Low Incident Concentration',
            intensity: (isRed ? 'Critical' : isOrange ? 'High' : 'Moderate') as HotspotRecord['intensity'],
            intensityClass: (isRed ? 'critical' : isOrange ? 'high' : 'moderate') as HotspotRecord['intensity_class'],
            badgeText: isRed
                ? isSpecificType
                    ? 'High (4+)'
                    : 'High (9+)'
                : isOrange
                ? isSpecificType
                    ? 'Moderate (3)'
                    : 'Moderate (5-8)'
                : isSpecificType
                ? 'Low (1-2)'
                : 'Low (1-4)',
        };
    };

    // 2. Reactive Active Hotspots: mirrors backend Option A nearest-cluster non-overlapping 20m circle logic
    //    - When "All Emergency Types" is selected: combines all nearby incidents regardless of type (1-4 Low, 5-8 Mod, 9+ High)
    //    - When a specific Emergency Type is selected: re-clusters ONLY that emergency type cleanly (1-2 Low, 3 Mod, 4+ High)
    const activeHotspots = useMemo(() => {
        const isFilterActive =
            selectedEmergencyTypes.length > 0 ||
            selectedBarangays.length > 0 ||
            selectedYears.length > 0 ||
            selectedMonths.length > 0 ||
            (selectedStatus && selectedStatus !== 'all');

        if (!isFilterActive) {
            return hotspots
                .filter((h) => h.incident_count >= minThreshold)
                .map((h) => {
                    const risk = classifyClusterRisk(h.incident_count, false);
                    return {
                        ...h,
                        color: risk.color,
                        classification: risk.classification,
                        intensity: risk.intensity,
                        intensity_class: risk.intensityClass,
                        badge_text: risk.badgeText,
                    };
                });
        }

        const circleRadiusMeters = 20.0;
        const nonOverlapMeters = circleRadiusMeters * 2.0; // 40m anti-overlap threshold

        const valid = activeIncidents
            .filter((i) => i.has_coords && i.latitude !== null && i.longitude !== null)
            .sort((a, b) => a.id - b.id);

        const rawClusters: Array<{
            cluster_key: string;
            latitude: number;
            longitude: number;
            location_name: string;
            barangay: string;
            incidents: IncidentRecord[];
        }> = [];

        let counter = 1;
        for (const inc of valid) {
            const lat = Number(inc.latitude);
            const lng = Number(inc.longitude);

            let closestIdx = -1;
            let closestDist = nonOverlapMeters + 0.0001;
            let closestCount = -1;

            for (let idx = 0; idx < rawClusters.length; idx++) {
                const c = rawClusters[idx];
                const dist = haversineMeters(lat, lng, c.latitude, c.longitude);
                if (dist > nonOverlapMeters) continue;

                const isCloser = dist < closestDist - 0.0001;
                const isTieLarger = Math.abs(dist - closestDist) <= 0.0001 && c.incidents.length > closestCount;
                if (isCloser || isTieLarger) {
                    closestDist = dist;
                    closestIdx = idx;
                    closestCount = c.incidents.length;
                }
            }

            if (closestIdx >= 0) {
                const c = rawClusters[closestIdx];
                c.incidents.push(inc);
                const count = c.incidents.length;
                c.latitude = c.incidents.reduce((s, i) => s + Number(i.latitude), 0) / count;
                c.longitude = c.incidents.reduce((s, i) => s + Number(i.longitude), 0) / count;
                if (inc.barangay && inc.barangay.toLowerCase() !== 'opol' && c.barangay.toLowerCase() === 'opol') {
                    c.barangay = inc.barangay;
                }
                const loc = (inc.purok_or_location || inc.address || '').trim();
                if (loc && loc.length > c.location_name.length && !loc.startsWith('Opol')) {
                    c.location_name = loc;
                }
            } else {
                rawClusters.push({
                    cluster_key: `cluster_20m_${counter++}_${inc.id}`,
                    latitude: lat,
                    longitude: lng,
                    location_name: inc.purok_or_location || inc.address || 'Opol, Misamis Oriental',
                    barangay: inc.barangay || 'Opol',
                    incidents: [inc],
                });
            }
        }

        const built: HotspotRecord[] = rawClusters
            .map((c) => {
                const sorted = [...c.incidents].sort((a, b) => b.id - a.id);
                const count = sorted.length;
                const risk = classifyClusterRisk(count, isSpecificEmergencyType);
                const { color, classification, intensity, intensityClass, badgeText } = risk;

                const typeFreq: Record<string, number> = {};
                sorted.forEach((i) => {
                    typeFreq[i.incident_type] = (typeFreq[i.incident_type] || 0) + 1;
                });
                const uniqueTypes = Object.entries(typeFreq)
                    .sort((a, b) => b[1] - a[1])
                    .map(([t]) => t);
                const dominantType = uniqueTypes[0] || 'General Emergency';

                return {
                    cluster_key: c.cluster_key,
                    cluster_id: c.cluster_key,
                    latitude: c.latitude,
                    longitude: c.longitude,
                    location_name: c.location_name,
                    barangay: c.barangay,
                    incident_type: dominantType,
                    most_common_type: dominantType,
                    unique_types: uniqueTypes,
                    incident_count: count,
                    incident_ids: sorted.map((i) => i.id),
                    incidents: sorted,
                    recent_incidents: sorted.slice(0, 5).map((i) => ({
                        id: i.id,
                        type: i.incident_type,
                        date: i.formatted_date || i.incident_date || '',
                        status: i.status || '',
                    })),
                    color,
                    classification,
                    intensity,
                    intensity_class: intensityClass,
                    badge_text: badgeText,
                    radius_meters: 20,
                    meets_threshold: count >= minThreshold,
                };
            })
            .filter((spot) => spot.incident_count >= minThreshold)
            .sort((a, b) => b.incident_count - a.incident_count)
            .map((spot, idx) => ({ ...spot, rank: idx + 1 }));

        return built;
    }, [
        hotspots,
        activeIncidents,
        selectedEmergencyTypes,
        selectedBarangays,
        selectedYears,
        selectedMonths,
        selectedStatus,
        minThreshold,
        isSpecificEmergencyType,
    ]);

    // GeoJSON Feature Collection for 20-Meter Cluster Monochromatic Radial Glows from activeHotspots
    const clustersGeojson = useMemo(() => {
        const features = activeHotspots.map((spot) => ({
            type: 'Feature' as const,
            properties: {
                cluster_key: spot.cluster_key,
                color: spot.color,
                incident_count: spot.incident_count,
                classification: spot.classification,
                location_name: spot.location_name,
                is_red: classifyClusterRisk(spot.incident_count, isSpecificEmergencyType).isRed,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [spot.longitude, spot.latitude],
            },
        }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [activeHotspots]);

    // Exact 20-Meter True-Scale Geographic Radius Polygons for each Same-Type Cluster
    const clustersPerimeterGeojson = useMemo(() => {
        const steps = 48;
        const earthRadius = 6371000;

        const features = activeHotspots.map((spot) => {
            const radiusM = spot.radius_meters || 20;
            const latRad = (spot.latitude * Math.PI) / 180;
            const dLat = (radiusM / earthRadius) * (180 / Math.PI);
            const dLng = ((radiusM / earthRadius) * (180 / Math.PI)) / Math.cos(latRad);

            const ring: [number, number][] = [];
            for (let i = 0; i <= steps; i++) {
                const angle = (i / steps) * 2 * Math.PI;
                ring.push([
                    spot.longitude + dLng * Math.cos(angle),
                    spot.latitude + dLat * Math.sin(angle),
                ]);
            }

            return {
                type: 'Feature' as const,
                properties: {
                    cluster_key: spot.cluster_key,
                    color: spot.color,
                    incident_count: spot.incident_count,
                },
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [ring],
                },
            };
        });

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [activeHotspots]);

    // Compute slight visual pixel offset ONLY when two DIFFERENT incident-type clusters occupy virtually identical GPS points (~<=3m)
    const clusterPinOffsets = useMemo(() => {
        const offsets: Record<string, [number, number]> = {};
        const groups: Record<string, HotspotRecord[]> = {};

        activeHotspots.forEach((spot) => {
            // Bucket to ~3m precision (0.00003 deg)
            const key = `${Math.round(spot.latitude * 33333)}_${Math.round(spot.longitude * 33333)}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(spot);
        });

        Object.values(groups).forEach((group) => {
            if (group.length === 1) {
                offsets[group[0].cluster_key] = [0, 0];
            } else {
                const spread = 16;
                const startX = -((group.length - 1) * spread) / 2;
                group.forEach((spot, idx) => {
                    offsets[spot.cluster_key] = [startX + idx * spread, 0];
                });
            }
        });

        return offsets;
    }, [activeHotspots]);

    // Keep inspected cluster synced if activeHotspots updates (e.g., when changing filters)
    const activeSelectedHotspot = useMemo(() => {
        if (!selectedHotspot) return null;
        return (
            activeHotspots.find((h) => h.cluster_key === selectedHotspot.cluster_key) ||
            selectedHotspot
        );
    }, [selectedHotspot, activeHotspots]);

    // Incidents inside the currently clicked pin/cluster, sorted NEWEST FIRST (latest first, oldest last)
    const inspectedIncidents = useMemo<IncidentRecord[]>(() => {
        if (!activeSelectedHotspot) return [];

        let list: IncidentRecord[] = [];
        if (activeSelectedHotspot.incidents && activeSelectedHotspot.incidents.length > 0) {
            list = [...activeSelectedHotspot.incidents];
        } else if (activeSelectedHotspot.incident_ids && activeSelectedHotspot.incident_ids.length > 0) {
            const idSet = new Set(activeSelectedHotspot.incident_ids);
            list = activeIncidents.filter((i) => idSet.has(i.id));
        }

        // Latest (most recent) incident first, earliest/oldest incident last
        return list.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.id - a.id;
        });
    }, [activeSelectedHotspot, activeIncidents]);

    // Clamp activeIncidentIdx whenever inspectedIncidents length changes
    const safeIncidentIdx =
        inspectedIncidents.length > 0
            ? Math.min(activeIncidentIdx, inspectedIncidents.length - 1)
            : 0;
    const currentInspectedIncident: IncidentRecord | null =
        inspectedIncidents.length > 0 ? inspectedIncidents[safeIncidentIdx] : null;
    const isInspectingPin = Boolean(activeSelectedHotspot && currentInspectedIncident);

    // Always scroll the right-panel Incident Details back to top when switching incidents (< / >) or pins
    useEffect(() => {
        if (inspectorScrollRef.current) {
            inspectorScrollRef.current.scrollTop = 0;
        }
    }, [safeIncidentIdx, activeSelectedHotspot?.cluster_key]);

    // Fly/zoom in to clicked pin or Ranked Hotspot and open inline Right Panel inspector
    const focusHotspotOnMap = (spot: HotspotRecord) => {
        setSelectedHotspot(spot);
        setActiveIncidentIdx(0);
        setCopiedCoord(false);
        mapRef.current?.flyTo({
            center: [spot.longitude, spot.latitude],
            zoom: 17,
            duration: 1000,
            essential: true,
        });
    };

    // Close inline Right Panel inspector, restore Ranked Hotspots, and zoom back out to Opol overview
    const closeInspectorPanel = () => {
        setSelectedHotspot(null);
        setActiveIncidentIdx(0);
        setCopiedCoord(false);
        mapRef.current?.flyTo({
            center: [OPOL_CENTER.longitude, OPOL_CENTER.latitude],
            zoom: OPOL_CENTER.zoom,
            duration: 1000,
            essential: true,
        });
    };

    // Reset map view to full extent of Opol municipality
    const resetMapView = () => {
        closeInspectorPanel();
    };

    // Color mapper for emergency incident types (Strict Color Coding: Fire = Red, Medical = Blue, Vehicular = Orange, Rescue = Green)
    const getTypeBadgeColor = (type: string) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('fire')) {
            return {
                bg: 'bg-red-500/15 border-red-500/30 text-red-300',
                dot: 'bg-red-500',
                hex: '#EF4444',
            };
        }
        if (lower.includes('vehicular') || lower.includes('accident') || lower.includes('traffic') || lower.includes('collision')) {
            return {
                bg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
                dot: 'bg-orange-500',
                hex: '#F97316',
            };
        }
        if (lower.includes('medical') || lower.includes('cardiac') || lower.includes('trauma')) {
            return {
                bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
                dot: 'bg-blue-500',
                hex: '#3B82F6',
            };
        }
        if (lower.includes('search') || lower.includes('rescue') || lower.includes('drown') || lower.includes('water')) {
            return {
                bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
                dot: 'bg-emerald-500',
                hex: '#10B981',
            };
        }
        if (lower.includes('weather') || lower.includes('flood') || lower.includes('typhoon')) {
            return {
                bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
                dot: 'bg-cyan-500',
                hex: '#06B6D4',
            };
        }
        return {
            bg: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
            dot: 'bg-violet-500',
            hex: '#8B5CF6',
        };
    };

    // Helper to format cluster header label ensuring Barangay is prominently displayed
    const getClusterBarangayLabel = (spot: HotspotRecord) => {
        const rawBrgy = (spot.barangay || '').trim();
        const hasSpecificBrgy = rawBrgy && rawBrgy.toLowerCase() !== 'opol';
        const brgyPrefix = hasSpecificBrgy ? `Brgy. ${rawBrgy}` : 'Brgy. Poblacion';

        const loc = (spot.location_name || '').trim();
        const isGeneric =
            !loc ||
            loc.toLowerCase() === 'opol' ||
            loc.toLowerCase().includes('opol, misamis oriental') ||
            loc.toLowerCase() === rawBrgy.toLowerCase() ||
            loc.toLowerCase() === `brgy. ${rawBrgy}`.toLowerCase();

        if (!isGeneric) {
            return `${brgyPrefix} • ${loc}`;
        }

        return brgyPrefix;
    };

    // Top identified hotspot name
    const topHotspot = hotspots.length > 0 ? hotspots[0] : null;
    const Layout = userRole === 'admin' ? AdminLayout : DispatcherLayout;

    return (
        <Layout title="Incident Heatmap">
            <div
                className={
                    isFullScreen
                        ? 'fixed inset-0 z-[60] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-3'
                        : 'w-full space-y-4 text-slate-900 dark:text-slate-100'
                }
            >
                <Head title="Incident Heatmap | MDRRMO Opol" />

                {/* Custom Mapbox Popup & Control CSS */}
                <style>{`
                    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
                    .mapboxgl-popup-content {
                        background: transparent !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7) !important;
                    }
                    .mapboxgl-popup-close-button {
                        display: none !important;
                    }
                    .mapboxgl-popup-tip {
                        border-top-color: #0b1329 !important;
                    }
                `}</style>

                {/* NATIVE APP PAGE HEADER (Matches Live Overview & Incident Records) */}
                <PageHeader
                    title="Incident Heatmap"
                    subtitle="Accident-prone area heatmap and incident hotspot analytics across Opol barangays."
                    actions={
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Total Plotted KPI Pill */}
                            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-rose-500" />
                                <div className="text-xs leading-tight">
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Total Plotted</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {validCoordinatesCount} of {totalIncidentsCount}
                                    </span>
                                </div>
                            </div>

                            {/* Rank #1 Hotspot KPI Pill */}
                            {topHotspot && (
                                <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-300/60 dark:border-amber-500/30 shadow-2xs items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    <div className="text-xs leading-tight">
                                        <span className="text-amber-600 dark:text-amber-400 text-[10px] block font-semibold">
                                            Rank #1 Hotspot
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] block">
                                            Brgy. {topHotspot.barangay}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Add Manual Heatmap Pin Button */}
                            <button
                                type="button"
                                onClick={() => setIsManualModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F61509] hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-[#F61509]/25 transition-colors cursor-pointer"
                                title="Manually add a hazard or incident pin on the heatmap"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Manual Pin</span>
                            </button>

                            {/* Full Screen Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                                    isFullScreen
                                        ? 'bg-[#F61509] hover:bg-rose-600 border-rose-500 text-white shadow-md shadow-[#F61509]/25'
                                        : 'bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200'
                                }`}
                                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Expand Full Screen'}
                            >
                                {isFullScreen ? (
                                    <>
                                        <Minimize2 className="w-3.5 h-3.5" />
                                        <span>Exit Full Screen</span>
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        <span className="hidden md:inline">Expand</span>
                                    </>
                                )}
                            </button>
                        </div>
                    }
                />

                {/* UNIFIED FILTER TOOLBAR CARD */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Time Period Filter: All Time | Weekly | Monthly | Yearly */}
                        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 p-0.5 text-xs font-medium">
                            {[
                                { id: 'all', label: 'All Time' },
                                { id: 'weekly', label: 'Weekly' },
                                { id: 'monthly', label: 'Monthly' },
                                { id: 'yearly', label: 'Yearly' },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedPeriod(preset.id);
                                        applyFilters({ period: preset.id });
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                        selectedPeriod === preset.id
                                            ? 'bg-[#F61509] text-white font-semibold shadow-sm shadow-[#F61509]/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Multi-Select Years */}
                        <MultiSelectFilterCombobox
                            values={selectedYears}
                            onChange={(nextYears) => {
                                setSelectedYears(nextYears);
                                applyFilters({ years: nextYears });
                            }}
                            options={yearFilterOptions}
                            allLabel="All Years"
                            searchable={false}
                        />

                        {/* Multi-Select Months */}
                        <MultiSelectFilterCombobox
                            values={selectedMonths}
                            onChange={(nextMonths) => {
                                setSelectedMonths(nextMonths);
                                applyFilters({ months: nextMonths });
                            }}
                            options={MONTH_OPTIONS}
                            allLabel="All Months"
                            searchPlaceholder="Search month..."
                        />

                        {/* Multi-Select Barangays (check 1, 2, 3+ barangays at once) */}
                        <MultiSelectFilterCombobox
                            values={selectedBarangays}
                            onChange={(nextBarangays) => {
                                setSelectedBarangays(nextBarangays);
                                applyFilters({ barangays: nextBarangays });
                            }}
                            options={barangayFilterOptions}
                            allLabel={`All Barangays (${opolBarangays.length || 14})`}
                            searchPlaceholder="Search barangay..."
                        />

                        {/* Multi-Select Emergency / Hazard Types (DB types + Custom Manual Pin types) */}
                        <MultiSelectFilterCombobox
                            values={selectedEmergencyTypes}
                            onChange={(nextTypes) => {
                                const nextIsSpecificSingle = nextTypes.length === 1;
                                const validThresholds = nextIsSpecificSingle ? [1, 2, 3, 4] : [1, 5, 9];
                                const nextThreshold = validThresholds.includes(minThreshold) ? minThreshold : 1;

                                setSelectedEmergencyTypes(nextTypes);
                                if (nextThreshold !== minThreshold) {
                                    setMinThreshold(nextThreshold);
                                }
                                applyFilters({ emergency_types: nextTypes, min_threshold: nextThreshold });
                            }}
                            options={emergencyTypeFilterOptions}
                            allLabel="All Emergency Types"
                            searchPlaceholder="Search emergency or hazard..."
                        />

                        {/* Easy-to-Understand Risk Level Filter (replaces technical Threshold label) */}
                        <select
                            value={minThreshold}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setMinThreshold(val);
                                applyFilters({ min_threshold: val });
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 cursor-pointer"
                            title="Filter map areas by incident risk level"
                        >
                            {isSpecificEmergencyType ? (
                                <>
                                    <option value={1}>Risk Level: All Areas</option>
                                    <option value={2}>Risk Level: 2+ Incidents</option>
                                    <option value={3}>Risk Level: Moderate &amp; High (3+)</option>
                                    <option value={4}>Risk Level: High Risk Only (4+)</option>
                                </>
                            ) : (
                                <>
                                    <option value={1}>Risk Level: All Areas</option>
                                    <option value={5}>Risk Level: Moderate &amp; High (5+)</option>
                                    <option value={9}>Risk Level: High Risk Only (9+)</option>
                                </>
                            )}
                        </select>

                        {/* Reset Filter Button */}
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>
                    </div>

                    {/* Map Layers & Style Toggles */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowMarkers(!showMarkers)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                                showMarkers
                                    ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/35 text-rose-700 dark:text-rose-300'
                                    : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Pins</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowBarangayBoundaries(!showBarangayBoundaries)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                                showBarangayBoundaries
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/35 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Boundaries</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                            <Layers className="w-3.5 h-3.5 text-rose-500" />
                            <span>{mapStyle === 'dark' ? 'Satellite' : 'Dark'}</span>
                        </button>
                    </div>
                </div>

                {/* MAIN TWO-COLUMN DASHBOARD BODY (MAP + RANKED HOTSPOTS) */}
                <div className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* =========================================================================
                            MAIN PANEL: INTERACTIVE INCIDENT HEATMAP
                        ========================================================================= */}
                        <div
                            className={`${
                                isInspectingPin
                                    ? 'lg:col-span-6 xl:col-span-7'
                                    : 'lg:col-span-8 xl:col-span-9'
                            } flex flex-col bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm relative min-h-[580px] ${
                                isFullScreen ? 'xl:h-[calc(100vh-180px)]' : 'xl:h-[calc(100vh-230px)]'
                            } xl:min-h-[640px] transition-all duration-200`}
                        >
                        {/* Map Container */}
                        <div ref={mapContainerRef} className="w-full h-full flex-1 relative bg-slate-950">
                            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                                <Map
                                    ref={mapRef}
                                    style={{ width: '100%', height: '100%' }}
                                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                    {...viewState}
                                    onMove={(evt) => setViewState(evt.viewState)}
                                    onLoad={() => mapRef.current?.resize()}
                                    mapStyle={
                                        mapStyle === 'dark'
                                            ? 'mapbox://styles/mapbox/dark-v11'
                                            : 'mapbox://styles/mapbox/satellite-streets-v12'
                                    }
                                    attributionControl={false}
                                >
                                    {/* 1. Opol 14 Barangays Boundary Outline & Fill */}
                                    {showBarangayBoundaries && barangayGeojson && (
                                        <Source id="opol-barangays-boundary" type="geojson" data={barangayGeojson}>
                                            <Layer
                                                id="opol-boundary-fill"
                                                type="fill"
                                                paint={{
                                                    'fill-color': '#64748b',
                                                    'fill-opacity': 0.02,
                                                }}
                                            />
                                            <Layer
                                                id="opol-boundary-lines"
                                                type="line"
                                                paint={{
                                                    'line-color': '#475569',
                                                    'line-width': 1.2,
                                                    'line-opacity': 0.4,
                                                    'line-dasharray': [3, 2],
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* 2. 20-Meter Monochromatic Cluster Radial Glow + True 20m Geographic Perimeter Ring */}
                                    {clustersGeojson && (
                                        <Source id="clusters-zones-source" type="geojson" data={clustersGeojson}>
                                            <Layer
                                                id="clusters-radial-glow"
                                                type="circle"
                                                paint={{
                                                    'circle-radius': [
                                                        'interpolate',
                                                        ['exponential', 2],
                                                        ['zoom'],
                                                        13, 8,
                                                        15, 20,
                                                        16, 38,
                                                        17, 72,
                                                        18, 140,
                                                        19, 280,
                                                    ],
                                                    'circle-color': ['get', 'color'],
                                                    'circle-opacity': 0.36,
                                                    'circle-blur': 0.72,
                                                }}
                                            />
                                        </Source>
                                    )}
                                    {clustersPerimeterGeojson && (
                                        <Source id="clusters-20m-perimeter-source" type="geojson" data={clustersPerimeterGeojson}>
                                            <Layer
                                                id="clusters-20m-perimeter-fill"
                                                type="fill"
                                                minzoom={14.5}
                                                paint={{
                                                    'fill-color': ['get', 'color'],
                                                    'fill-opacity': 0.12,
                                                }}
                                            />
                                            <Layer
                                                id="clusters-20m-perimeter-line"
                                                type="line"
                                                minzoom={14.5}
                                                paint={{
                                                    'line-color': ['get', 'color'],
                                                    'line-width': 1.5,
                                                    'line-opacity': 0.65,
                                                    'line-dasharray': [3, 2],
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* 3. Floating Cluster Label Pills & Pulsing Red Beat */}
                                    {activeHotspots.map((spot, idx) => {
                                        const isSelected = selectedHotspot?.cluster_key === spot.cluster_key;
                                        const risk = classifyClusterRisk(spot.incident_count, isSpecificEmergencyType);
                                        const isRed = risk.isRed;
                                        const clusterColor = risk.color;
                                        const clusterLevel = risk.level;

                                        return (
                                            <Fragment key={`hotspot-group-${spot.cluster_key}-${idx}`}>
                                                {/* Pulsing Red Radar Beat Ring at Center of High (4+) Clusters */}
                                                {isRed && (
                                                    <Marker
                                                        longitude={spot.longitude}
                                                        latitude={spot.latitude}
                                                        anchor="center"
                                                    >
                                                        <div className="relative flex items-center justify-center pointer-events-none">
                                                            <span className="w-16 h-16 rounded-full bg-red-500/40 animate-ping absolute" />
                                                            <span className="w-4 h-4 rounded-full bg-red-500/60 animate-pulse absolute" />
                                                        </div>
                                                    </Marker>
                                                )}

                                                {/* Floating Cluster Label Pill (Above the combined pin, prominently displaying Barangay) */}
                                                <Marker
                                                    longitude={spot.longitude}
                                                    latitude={spot.latitude}
                                                    anchor="bottom"
                                                    offset={[0, -44]}
                                                    onClick={(e) => {
                                                        e.originalEvent.stopPropagation();
                                                        focusHotspotOnMap(spot);
                                                    }}
                                                >
                                                    <div
                                                        className={`group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border shadow-2xl transition-all duration-200 hover:scale-105 select-none ${
                                                            isSelected ? 'border-white ring-2 ring-white scale-105' : 'border-white/20'
                                                        }`}
                                                        title={`Click to inspect all ${spot.incident_count} incidents in this 20m cluster`}
                                                    >
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                                                            style={{ backgroundColor: clusterColor }}
                                                        />
                                                        <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                                                            {getClusterBarangayLabel(spot)}
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md whitespace-nowrap"
                                                            style={{
                                                                color: clusterColor,
                                                                backgroundColor: `${clusterColor}25`,
                                                            }}
                                                        >
                                                            {clusterLevel} ({spot.incident_count})
                                                        </span>
                                                    </div>
                                                </Marker>
                                            </Fragment>
                                        );
                                    })}

                                    {/* 4. Combined Center Pins (1 Pin at Exact Centroid per Same-Type 20m Cluster) */}
                                    {showMarkers &&
                                        activeHotspots.map((spot, idx) => {
                                            const clusterType = spot.incident_type || spot.most_common_type || 'Emergency';
                                            const badge = getTypeBadgeColor(clusterType);
                                            const isCombined = spot.incident_count > 1;
                                            const singleIncident = spot.incidents && spot.incidents.length === 1 ? spot.incidents[0] : null;
                                            const pinOffset = clusterPinOffsets[spot.cluster_key] || [0, 0];

                                            return (
                                                <Marker
                                                    key={`combined-pin-${spot.cluster_key}-${idx}`}
                                                    longitude={spot.longitude}
                                                    latitude={spot.latitude}
                                                    anchor="bottom"
                                                    offset={pinOffset}
                                                    onClick={(e) => {
                                                        e.originalEvent.stopPropagation();
                                                        focusHotspotOnMap(spot);
                                                    }}
                                                >
                                                    <div
                                                        className="cursor-pointer group relative flex flex-col items-center"
                                                        title={
                                                            isCombined
                                                                ? `${clusterType} • ${spot.incident_count} combined incidents within 20m (Brgy. ${spot.barangay})`
                                                                : `#INC-${singleIncident?.id ?? ''}: ${clusterType} (${spot.location_name || spot.barangay})`
                                                        }
                                                    >
                                                        {/* Teardrop Emergency Pin (Single or Combined Center Pin with Count) */}
                                                        <div className="relative transition-transform duration-200 group-hover:scale-125 group-hover:-translate-y-1">
                                                            <svg
                                                                width={isCombined ? 30 : 24}
                                                                height={isCombined ? 40 : 32}
                                                                viewBox="0 0 24 32"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
                                                            >
                                                                {/* Teardrop Pin Body pointing down to exact center coordinates */}
                                                                <path
                                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                                    fill={badge.hex}
                                                                    stroke="#FFFFFF"
                                                                    strokeWidth="2"
                                                                    strokeLinejoin="round"
                                                                />
                                                                {isCombined ? (
                                                                    <>
                                                                        {/* Combined Cluster Center Circle with Incident Count */}
                                                                        <circle cx="12" cy="11.5" r="7.2" fill="#0f172a" />
                                                                        <text
                                                                            x="12"
                                                                            y="14.7"
                                                                            textAnchor="middle"
                                                                            fill="#FFFFFF"
                                                                            fontSize={spot.incident_count >= 10 ? '8' : '9.5'}
                                                                            fontWeight="800"
                                                                            fontFamily="system-ui, -apple-system, sans-serif"
                                                                        >
                                                                            {spot.incident_count}
                                                                        </text>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Single Incident Inner Target */}
                                                                        <circle cx="12" cy="11.5" r="4.8" fill="#FFFFFF" />
                                                                        <circle cx="12" cy="11.5" r="2.6" fill={badge.hex} />
                                                                    </>
                                                                )}
                                                            </svg>
                                                            {/* Ground shadow beneath the pin point */}
                                                            <div className="w-2.5 h-1 rounded-full bg-black/60 blur-[1px] mx-auto -mt-0.5" />
                                                        </div>

                                                        {/* Floating Tooltip on Hover */}
                                                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                                                            <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-white/20 shadow-2xl text-[11px] text-white whitespace-nowrap flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.hex }} />
                                                                <span className="font-bold">
                                                                    {spot.unique_types && spot.unique_types.length > 1
                                                                        ? `${clusterType} +${spot.unique_types.length - 1} more`
                                                                        : clusterType}
                                                                </span>
                                                                {isCombined ? (
                                                                    <span className="text-amber-300 font-bold text-[10px]">
                                                                        {spot.incident_count} combined (20m)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-mono text-[10px]">
                                                                        #INC-{singleIncident?.id}
                                                                    </span>
                                                                )}
                                                                <span className="text-slate-400 text-[10px]">Brgy. {spot.barangay}</span>
                                                            </div>
                                                            <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-white/20" />
                                                        </div>
                                                    </div>
                                                </Marker>
                                            );
                                        })}

                                </Map>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                                    <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                                    <h3 className="text-base font-bold text-white mb-1">Mapbox Token Not Configured</h3>
                                    <p className="text-xs text-slate-400 max-w-sm">
                                        Please ensure <code className="text-cyan-400 font-mono">VITE_MAPBOX_TOKEN</code> is set in your .env configuration.
                                    </p>
                                </div>
                            )}

                            {/* ON-MAP FLOATING LEGEND (Bottom Left, like reference image) */}
                            <div className="absolute bottom-3 left-3 bg-[#0b1329]/95 border border-white/15 backdrop-blur-md rounded-xl p-3 shadow-2xl max-w-[280px] z-10 text-xs">
                                {/* Section 1: Cluster Risk Level (Glow) */}
                                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                                        <span>20m Cluster Risk</span>
                                    </span>
                                    <span className="text-[9px] text-amber-400 font-mono font-bold">Radius: 20m</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mb-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
                                        <span className="text-[10px] text-yellow-300 font-bold">
                                            {isSpecificEmergencyType ? 'Low (1–2)' : 'Low (1–4)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                                        <span className="text-[10px] text-orange-300 font-bold">
                                            {isSpecificEmergencyType ? 'Moderate (3)' : 'Moderate (5–8)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                                        <span className="text-[10px] text-red-300 font-bold">
                                            {isSpecificEmergencyType ? 'High (4+)' : 'High (9+)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Section 2: Incident Pin Color Coding */}
                                <div className="pt-2 border-t border-white/10">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                        Incident Pins (Emergency Type)
                                    </span>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            <svg width="12" height="16" viewBox="0 0 24 32" fill="none" className="flex-shrink-0">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill="#EF4444"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="2"
                                                />
                                                <circle cx="12" cy="11.5" r="4" fill="#FFFFFF" />
                                            </svg>
                                            <span className="text-slate-200 truncate">Fire</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg width="12" height="16" viewBox="0 0 24 32" fill="none" className="flex-shrink-0">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill="#3B82F6"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="2"
                                                />
                                                <circle cx="12" cy="11.5" r="4" fill="#FFFFFF" />
                                            </svg>
                                            <span className="text-slate-200 truncate">Medical</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg width="12" height="16" viewBox="0 0 24 32" fill="none" className="flex-shrink-0">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill="#F97316"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="2"
                                                />
                                                <circle cx="12" cy="11.5" r="4" fill="#FFFFFF" />
                                            </svg>
                                            <span className="text-slate-200 truncate">Vehicular</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg width="12" height="16" viewBox="0 0 24 32" fill="none" className="flex-shrink-0">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill="#10B981"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="2"
                                                />
                                                <circle cx="12" cy="11.5" r="4" fill="#FFFFFF" />
                                            </svg>
                                            <span className="text-slate-200 truncate">Rescue</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ON-MAP CONTROLS (Top Right) */}
                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                                <button
                                    type="button"
                                    onClick={() => mapRef.current?.zoomIn()}
                                    className="w-8 h-8 rounded-lg bg-[#0b1329]/90 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors"
                                    title="Zoom In"
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={() => mapRef.current?.zoomOut()}
                                    className="w-8 h-8 rounded-lg bg-[#0b1329]/90 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors"
                                    title="Zoom Out"
                                >
                                    −
                                </button>
                                <button
                                    type="button"
                                    onClick={resetMapView}
                                    className="w-8 h-8 rounded-lg bg-[#0b1329]/90 hover:bg-slate-800 border border-white/15 text-cyan-300 hover:text-cyan-200 flex items-center justify-center shadow-md transition-colors"
                                    title="Reset to Opol Extent"
                                >
                                    <Compass className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* =========================================================================
                        RIGHT PANEL: EXPANDED INLINE INCIDENT INSPECTOR (ON PIN CLICK) OR COMPACT RANKED HOTSPOTS
                    ========================================================================= */}
                    <aside
                        className={`${
                            isInspectingPin
                                ? 'lg:col-span-6 xl:col-span-5'
                                : 'lg:col-span-4 xl:col-span-3'
                        } flex flex-col bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm min-h-[580px] ${
                            isFullScreen ? 'xl:h-[calc(100vh-180px)]' : 'xl:h-[calc(100vh-230px)]'
                        } xl:min-h-[640px] transition-all duration-200`}
                    >
                        {activeSelectedHotspot && currentInspectedIncident ? (
                            <>
                                {/* INSPECTOR HEADER + CLOSE (X) */}
                                <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] shrink-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{
                                                        backgroundColor: getTypeBadgeColor(
                                                            currentInspectedIncident.incident_type
                                                        ).hex,
                                                    }}
                                                />
                                                <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">
                                                    {currentInspectedIncident.incident_number ||
                                                        `#INC-${currentInspectedIncident.id}`}
                                                </span>
                                                <span
                                                    className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border"
                                                    style={{
                                                        backgroundColor: `${activeSelectedHotspot.color}20`,
                                                        borderColor: `${activeSelectedHotspot.color}55`,
                                                        color: activeSelectedHotspot.color,
                                                    }}
                                                >
                                                    {activeSelectedHotspot.badge_text ||
                                                        `${inspectedIncidents.length} in 20m`}
                                                </span>
                                            </div>
                                            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                                                {currentInspectedIncident.incident_type}
                                            </h2>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                Brgy. {currentInspectedIncident.barangay || activeSelectedHotspot.barangay}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={closeInspectorPanel}
                                            className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                                            title="Close details & return to Ranked Hotspots (zooms out map)"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* MULTI-INCIDENT STEPPER (< Prev / Next >) — Newest First */}
                                    {inspectedIncidents.length > 1 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                disabled={safeIncidentIdx === 0}
                                                onClick={() => {
                                                    setActiveIncidentIdx((prev) => Math.max(0, prev - 1));
                                                    setCopiedCoord(false);
                                                }}
                                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                title="Previous (Newer Incident)"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>

                                            <div className="text-center leading-tight">
                                                <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                                                    Incident {safeIncidentIdx + 1} of {inspectedIncidents.length}
                                                </div>
                                                <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                                    {safeIncidentIdx === 0
                                                        ? 'Latest incident'
                                                        : safeIncidentIdx === inspectedIncidents.length - 1
                                                        ? 'Earliest incident'
                                                        : 'Newest → Oldest'}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={safeIncidentIdx >= inspectedIncidents.length - 1}
                                                onClick={() => {
                                                    setActiveIncidentIdx((prev) =>
                                                        Math.min(inspectedIncidents.length - 1, prev + 1)
                                                    );
                                                    setCopiedCoord(false);
                                                }}
                                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                title="Next (Older Incident)"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* SCROLLABLE COMPLETE INCIDENT DETAILS BODY */}
                                <div ref={inspectorScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                                    {/* Status, Priority, & Report Source Badges (Clean Manual Pin Badge when manual) */}
                                    {currentInspectedIncident.is_manual_pin ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30">
                                                <MapPin className="w-2.5 h-2.5" />
                                                Manual Heatmap Pin
                                            </span>
                                            {currentInspectedIncident.caller_name && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10">
                                                    Added by {currentInspectedIncident.caller_name}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span
                                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                    currentInspectedIncident.status === 'resolved'
                                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                                        : currentInspectedIncident.status === 'verified'
                                                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                                }`}
                                            >
                                                {currentInspectedIncident.status}
                                            </span>

                                            <span
                                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                    (currentInspectedIncident.priority || '').toLowerCase() === 'critical'
                                                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                                        : (currentInspectedIncident.priority || '').toLowerCase() === 'high'
                                                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300'
                                                        : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                                }`}
                                            >
                                                Priority: {currentInspectedIncident.priority || 'Moderate'}
                                            </span>

                                            {currentInspectedIncident.report_source === 'walk_in' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                                    <UserCheck className="w-2.5 h-2.5" />
                                                    Walk-In
                                                </span>
                                            ) : currentInspectedIncident.report_source === 'phone_sim' ||
                                              currentInspectedIncident.report_source === 'dispatcher' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                                                    <PhoneCall className="w-2.5 h-2.5" />
                                                    Phone / SIM
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                                    <Smartphone className="w-2.5 h-2.5" />
                                                    Resident App
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* 1. Incident Photo Evidence — Resident & Responder Photos (Click to Enlarge with < > Arrows) */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-2">
                                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                                <Camera className="w-3.5 h-3.5" />
                                                Incident Photos ({currentInspectedIncident.images?.length || 0})
                                            </span>
                                            {currentInspectedIncident.images && currentInspectedIncident.images.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {currentInspectedIncident.images.some((i) => i.source_role !== 'responder') && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                                            Resident:{' '}
                                                            {
                                                                currentInspectedIncident.images.filter(
                                                                    (i) => i.source_role !== 'responder'
                                                                ).length
                                                            }
                                                        </span>
                                                    )}
                                                    {currentInspectedIncident.images.some((i) => i.source_role === 'responder') && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25">
                                                            Responder:{' '}
                                                            {
                                                                currentInspectedIncident.images.filter(
                                                                    (i) => i.source_role === 'responder'
                                                                ).length
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {currentInspectedIncident.images && currentInspectedIncident.images.length > 0 ? (
                                            <div
                                                className={`grid gap-2 ${
                                                    currentInspectedIncident.images.length === 1
                                                        ? 'grid-cols-1'
                                                        : 'grid-cols-2'
                                                }`}
                                            >
                                                {currentInspectedIncident.images.map((img, imgIdx) => {
                                                    const isResponderPhoto = img.source_role === 'responder';
                                                    const isBw = isPhotoGrayscale(img);
                                                    return (
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            key={`panel-img-${img.id || imgIdx}`}
                                                            onClick={() =>
                                                                setLightboxState({
                                                                    images: currentInspectedIncident.images || [],
                                                                    index: imgIdx,
                                                                })
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setLightboxState({
                                                                        images: currentInspectedIncident.images || [],
                                                                        index: imgIdx,
                                                                    });
                                                                }
                                                            }}
                                                            className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-950 cursor-pointer block w-full text-left"
                                                        >
                                                            <img
                                                                src={img.url}
                                                                alt={`${img.source_label || 'Incident Photo'} ${imgIdx + 1}`}
                                                                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${
                                                                    isBw ? 'grayscale' : ''
                                                                }`}
                                                            />
                                                            {/* Resident / Responder Photo Badge */}
                                                            <span
                                                                className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shadow-md backdrop-blur-sm ${
                                                                    isResponderPhoto
                                                                        ? 'bg-sky-600/90 text-white'
                                                                        : 'bg-emerald-600/90 text-white'
                                                                }`}
                                                            >
                                                                {isResponderPhoto ? 'Responder' : 'Resident'}
                                                            </span>

                                                            {/* Per-Photo Black & White / Color Toggle Button */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    togglePhotoGrayscale(img);
                                                                }}
                                                                className={`absolute top-1.5 right-1.5 z-20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shadow-md backdrop-blur-sm border transition-colors cursor-pointer ${
                                                                    isBw
                                                                        ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                                                                        : 'bg-slate-950/80 text-slate-100 border-white/25 hover:bg-slate-900'
                                                                }`}
                                                                title={
                                                                    isBw
                                                                        ? 'Switch this photo back to Color'
                                                                        : 'Switch this photo to Black & White (for sensitive/graphic content)'
                                                                }
                                                            >
                                                                {isBw ? 'Color' : 'B&W'}
                                                            </button>

                                                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-1 rounded-md flex items-center gap-1">
                                                                    <Maximize2 className="w-3 h-3" />
                                                                    Enlarge
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] italic text-slate-500 dark:text-slate-400 py-1">
                                                No photo evidence uploaded for this incident.
                                            </p>
                                        )}
                                    </div>

                                    {/* 2. Location & GPS */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            Location &amp; GPS
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-snug">
                                            {currentInspectedIncident.address || 'Opol, Misamis Oriental'}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-white/5">
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                                {currentInspectedIncident.latitude && currentInspectedIncident.longitude
                                                    ? `${currentInspectedIncident.latitude.toFixed(6)}, ${currentInspectedIncident.longitude.toFixed(6)}`
                                                    : 'No GPS'}
                                            </span>
                                            {currentInspectedIncident.latitude && currentInspectedIncident.longitude && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            `${currentInspectedIncident.latitude}, ${currentInspectedIncident.longitude}`
                                                        );
                                                        setCopiedCoord(true);
                                                        setTimeout(() => setCopiedCoord(false), 2000);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                                >
                                                    {copiedCoord ? (
                                                        <>
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Description / Chief Complaint */}
                                    {(currentInspectedIncident.description || currentInspectedIncident.chief_complaint) && (
                                        <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-1">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" />
                                                Chief Complaint / Description
                                            </div>
                                            <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                                {currentInspectedIncident.description || currentInspectedIncident.chief_complaint}
                                            </p>
                                        </div>
                                    )}

                                    {/* 4. Responders & Emergency Units Dispatched */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5" />
                                            Responders &amp; Units ({currentInspectedIncident.dispatches?.length || 0})
                                        </div>

                                        {currentInspectedIncident.dispatches &&
                                        currentInspectedIncident.dispatches.length > 0 ? (
                                            <div className="space-y-2">
                                                {currentInspectedIncident.dispatches.map((disp, dIdx) => (
                                                    <div
                                                        key={`panel-disp-${disp.id}-${dIdx}`}
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200/70 dark:border-white/5 space-y-1 text-[11px]"
                                                    >
                                                        <div className="flex items-center justify-between gap-1.5">
                                                            <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                {disp.ambulance_unit}
                                                            </span>
                                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 shrink-0">
                                                                {disp.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-600 dark:text-slate-300">
                                                            <span className="text-slate-400">Driver:</span>{' '}
                                                            <strong className="text-slate-900 dark:text-slate-100">
                                                                {disp.driver_name}
                                                            </strong>
                                                        </div>
                                                        {disp.crew_members && disp.crew_members.length > 0 && (
                                                            <div className="text-slate-600 dark:text-slate-300">
                                                                <span className="text-slate-400">Responders / Crew:</span>{' '}
                                                                <strong className="text-slate-900 dark:text-slate-100">
                                                                    {disp.crew_members.join(', ')}
                                                                </strong>
                                                            </div>
                                                        )}
                                                        {(disp.dispatched_at || disp.arrived_at || disp.completed_at) && (
                                                            <div className="pt-1 border-t border-slate-200/60 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                                                {disp.dispatched_at && (
                                                                    <div>Dispatched: {disp.dispatched_at}</div>
                                                                )}
                                                                {disp.arrived_at && <div>Arrived: {disp.arrived_at}</div>}
                                                                {disp.completed_at && (
                                                                    <div>Completed: {disp.completed_at}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                                                No responder unit dispatched for this incident.
                                            </p>
                                        )}
                                    </div>

                                    {/* 5. Caller / Reporter */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-1">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            Caller / Reporter
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-[11px]">
                                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                                                {currentInspectedIncident.caller_name || 'Anonymous / Walk-In'}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                                                {currentInspectedIncident.caller_phone || 'None'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 6. Patients Catered / PCR */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                            <HeartPulse className="w-3.5 h-3.5" />
                                            Patients Catered ({currentInspectedIncident.patients?.length || 0})
                                        </div>

                                        {currentInspectedIncident.patients &&
                                        currentInspectedIncident.patients.length > 0 ? (
                                            <div className="space-y-2">
                                                {currentInspectedIncident.patients.map((pat, pIdx) => (
                                                    <div
                                                        key={`panel-pat-${pat.id || pIdx}`}
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200/70 dark:border-white/5 space-y-1 text-[11px]"
                                                    >
                                                        <div className="flex items-center justify-between gap-1.5">
                                                            <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                {pIdx + 1}. {pat.name}
                                                            </span>
                                                            {pat.disposition && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                                                                    {pat.disposition}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            {pat.gender || 'Unspecified'}
                                                            {pat.age ? ` • ${pat.age} yrs old` : ''}
                                                            {pat.destination_hospital
                                                                ? ` • ${pat.destination_hospital}`
                                                                : ''}
                                                        </div>
                                                        {pat.chief_complaint && (
                                                            <p className="text-[10px] text-slate-700 dark:text-slate-300">
                                                                {pat.chief_complaint}
                                                            </p>
                                                        )}
                                                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                                            {pat.pcr_record ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => printPatientCareRecord(pat.pcr_record)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F61509] hover:bg-rose-600 text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-xs"
                                                                    title="Open full Patient Care Record Print Preview (stays on Heatmap)"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    View PCR
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                                                No patients recorded for this incident.
                                            </p>
                                        )}
                                    </div>

                                    {/* 7. Incident Timeline */}
                                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            Timeline
                                        </div>
                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-slate-500 dark:text-slate-400">Reported:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {currentInspectedIncident.reported_at ||
                                                        currentInspectedIncident.formatted_date ||
                                                        'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-slate-500 dark:text-slate-400">Verified:</span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-300">
                                                    {currentInspectedIncident.verified_at || 'Pending'}
                                                </span>
                                            </div>
                                            {currentInspectedIncident.verified_by && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-slate-500 dark:text-slate-400">Verified By:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                                        {currentInspectedIncident.verified_by}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-slate-500 dark:text-slate-400">Resolved:</span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                                                    {currentInspectedIncident.resolved_at ||
                                                        (currentInspectedIncident.status === 'resolved'
                                                            ? 'Resolved'
                                                            : 'Ongoing')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* INSPECTOR FOOTER */}
                                <div className="p-2.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-2 shrink-0 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                            {currentInspectedIncident.time_ago}
                                        </span>
                                        {currentInspectedIncident.is_manual_pin && currentInspectedIncident.manual_pin_id && (
                                            <button
                                                type="button"
                                                disabled={deletingPinId === currentInspectedIncident.manual_pin_id}
                                                onClick={() => setConfirmDeletePin(currentInspectedIncident)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                                title="Delete this manual heatmap pin"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Delete Pin</span>
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeInspectorPanel}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                        Back to Hotspots
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* RANKED HOTSPOTS HEADER */}
                                <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-rose-500" />
                                            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Ranked Hotspots
                                            </h2>
                                        </div>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25">
                                            {activeHotspots.length} Areas
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                        High-frequency incident areas ({minThreshold === 1 ? 'Showing all risk levels' : `Showing ${minThreshold}+ incidents`})
                                    </p>
                                </div>

                                {/* Hotspots List */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {activeHotspots.length === 0 ? (
                                        <div className="py-14 px-4 text-center">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                No Hotspots at Threshold ≥{minThreshold}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1 mb-3">
                                                No geographical area has reached the selected recurring volume in this period.
                                            </p>
                                            {minThreshold > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMinThreshold(1);
                                                        applyFilters({ min_threshold: 1 });
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    Show Single Occurrences (≥1)
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        activeHotspots.map((spot, idx) => {
                                            const isSelected = selectedHotspot?.cluster_key === spot.cluster_key;
                                            return (
                                                <div
                                                    key={spot.cluster_key}
                                                    onClick={() => focusHotspotOnMap(spot)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                                                        isSelected
                                                            ? 'bg-rose-50/70 dark:bg-slate-800/90 border-rose-500 ring-1 ring-rose-500/40 shadow-sm'
                                                            : 'bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 border-slate-200/60 dark:border-white/5 hover:border-rose-500/35'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span
                                                                className="w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center text-white shadow-sm shrink-0"
                                                                style={{ backgroundColor: spot.color }}
                                                            >
                                                                #{spot.rank ?? idx + 1}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                                                                    {spot.location_name}
                                                                </h3>
                                                                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                                                    Brgy. {spot.barangay}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border shadow-2xs shrink-0"
                                                            style={{
                                                                backgroundColor: `${spot.color}20`,
                                                                borderColor: `${spot.color}55`,
                                                                color: spot.color,
                                                            }}
                                                        >
                                                            {spot.badge_text ||
                                                                classifyClusterRisk(
                                                                    spot.incident_count,
                                                                    isSpecificEmergencyType
                                                                ).badgeText}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-white dark:bg-slate-950/60 text-[10px] border border-slate-200/70 dark:border-white/5 mb-2">
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">
                                                                Incident Count
                                                            </span>
                                                            <span className="font-extrabold text-amber-600 dark:text-amber-300 text-xs">
                                                                {spot.incident_count} Incidents
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">
                                                                Dominant Type
                                                            </span>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                                {spot.most_common_type}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                                        <span>Click to zoom &amp; inspect</span>
                                                        <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Right Panel Disclaimer Note */}
                                <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <p>
                                        Hotspots reflect historical incident density. Click any pin or hotspot to inspect complete details.
                                    </p>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
                </div>

            {/* FULLSCREEN PHOTO ENLARGER LIGHTBOX WITH < > ARROWS */}
            {lightboxState && lightboxState.images.length > 0 && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    onClick={() => setLightboxState(null)}
                >
                    {/* Top Bar: Counter + Resident/Responder Source Badge + Close */}
                    <div
                        className="absolute top-4 inset-x-4 z-20 flex items-center justify-between gap-2 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white border border-white/15 text-xs font-bold">
                                Photo {lightboxState.index + 1} of {lightboxState.images.length}
                            </span>
                            {(() => {
                                const activeImg = lightboxState.images[lightboxState.index];
                                const isResp = activeImg?.source_role === 'responder';
                                return (
                                    <span
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                            isResp
                                                ? 'bg-sky-600/90 text-white border-sky-400/40'
                                                : 'bg-emerald-600/90 text-white border-emerald-400/40'
                                        }`}
                                    >
                                        {activeImg?.source_label || (isResp ? 'Responder Photo' : 'Resident Photo')}
                                        {activeImg?.uploaded_by ? ` • ${activeImg.uploaded_by}` : ''}
                                        {activeImg?.captured_at ? ` • ${activeImg.captured_at}` : ''}
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const activeImg = lightboxState.images[lightboxState.index];
                                const isBw = isPhotoGrayscale(activeImg);
                                return (
                                    <button
                                        type="button"
                                        onClick={() => togglePhotoGrayscale(activeImg)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                            isBw
                                                ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                                                : 'bg-slate-900/90 hover:bg-slate-800 text-white border-white/20'
                                        }`}
                                        title={
                                            isBw
                                                ? 'Switch this photo back to Color'
                                                : 'Switch this photo to Black & White'
                                        }
                                    >
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full border ${
                                                isBw
                                                    ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-sky-500 border-slate-400'
                                                    : 'bg-gradient-to-r from-black to-white border-white/50'
                                            }`}
                                        />
                                        <span>{isBw ? 'Switch to Color' : 'Black & White'}</span>
                                    </button>
                                );
                            })()}
                            <button
                                type="button"
                                onClick={() => setLightboxState(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                                <span>Close</span>
                            </button>
                        </div>
                    </div>

                    {/* Center Image + Left/Right < > Arrows */}
                    <div
                        className="relative max-w-5xl max-h-[78vh] w-full flex items-center justify-center px-12 sm:px-16"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {lightboxState.images.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setLightboxState((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  index: (prev.index - 1 + prev.images.length) % prev.images.length,
                                              }
                                            : null
                                    )
                                }
                                className="absolute left-1 sm:left-2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 hover:bg-[#F61509] text-white border border-white/20 flex items-center justify-center shadow-xl transition-colors cursor-pointer"
                                title="Previous Photo"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        <img
                            src={lightboxState.images[lightboxState.index]?.url}
                            alt={`Incident Photo ${lightboxState.index + 1}`}
                            className={`max-w-full max-h-[78vh] object-contain rounded-xl border border-white/10 shadow-2xl select-none transition-all duration-200 ${
                                isPhotoGrayscale(lightboxState.images[lightboxState.index]) ? 'grayscale' : ''
                            }`}
                        />

                        {lightboxState.images.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setLightboxState((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  index: (prev.index + 1) % prev.images.length,
                                              }
                                            : null
                                    )
                                }
                                className="absolute right-1 sm:right-2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 hover:bg-[#F61509] text-white border border-white/20 flex items-center justify-center shadow-xl transition-colors cursor-pointer"
                                title="Next Photo"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* Thumbnail Strip when multiple photos */}
                    {lightboxState.images.length > 1 && (
                        <div
                            className="mt-4 flex items-center gap-2 overflow-x-auto max-w-3xl px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {lightboxState.images.map((img, i) => (
                                <button
                                    key={`lb-thumb-${img.id || i}`}
                                    type="button"
                                    onClick={() => setLightboxState((prev) => (prev ? { ...prev, index: i } : null))}
                                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                        i === lightboxState.index
                                            ? 'border-[#F61509] scale-105 opacity-100'
                                            : 'border-white/20 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Thumb ${i + 1}`}
                                        className={`w-full h-full object-cover ${
                                            isPhotoGrayscale(img) ? 'grayscale' : ''
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* MANUAL HEATMAP PIN POPUP MODAL (SYNCED WITH ACTIVE FILTERS & EXISTING PINS) */}
            <ManualPinModal
                open={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSaved={() => {
                    toast.success('Manual heatmap pin saved.');
                    router.reload({
                        only: [
                            'incidents',
                            'hotspots',
                            'analytics',
                            'customPinTypes',
                            'availableYears',
                            'totalIncidentsCount',
                            'validCoordinatesCount',
                        ],
                        data: buildFilterParams(),
                    });
                }}
                userRole={userRole}
                incidentTypes={incidentTypes}
                opolBarangays={opolBarangays}
                existingHotspots={activeHotspots}
                barangayGeojson={barangayGeojson}
                activeFilterSummary={activeFilterSummary}
                getTypeColorHex={(typeName) => getTypeBadgeColor(typeName).hex}
            />

            {/* PROFESSIONAL DELETE CONFIRMATION MODAL FOR MANUAL PINS */}
            {confirmDeletePin && (
                <div
                    className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => deletingPinId === null && setConfirmDeletePin(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Rose Danger Icon */}
                        <div className="p-5 pb-4 flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                    Delete Manual Heatmap Pin?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    This pin will be permanently removed from the Incident Heatmap and its cluster will automatically recalculate. This action cannot be undone.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={deletingPinId !== null}
                                onClick={() => setConfirmDeletePin(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Pin Summary Card */}
                        <div className="mx-5 mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {confirmDeletePin.incident_type}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25 shrink-0">
                                    {confirmDeletePin.incident_number || `PIN-${confirmDeletePin.manual_pin_id}`}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{confirmDeletePin.address}</span>
                            </p>
                        </div>

                        {/* Actions Footer */}
                        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={deletingPinId !== null}
                                onClick={() => setConfirmDeletePin(null)}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingPinId !== null}
                                onClick={() => handleDeleteManualPin(confirmDeletePin)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F61509] hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-[#F61509]/25 transition-colors cursor-pointer disabled:opacity-60"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{deletingPinId !== null ? 'Deleting...' : 'Yes, Delete Pin'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </Layout>
    );
}
