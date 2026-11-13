import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Map, { Marker, Popup, Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
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
    Users
} from 'lucide-react';

interface IncidentRecord {
    id: number;
    incident_id: number;
    incident_number?: string;
    incident_type: string;
    incident_type_id: number;
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
    opolBarangays?: string[];
    filters?: {
        date_from?: string | null;
        date_to?: string | null;
        barangay?: string;
        incident_type_id?: string | number;
        status?: string;
        min_threshold?: number;
    };
    totalIncidentsCount?: number;
    validCoordinatesCount?: number;
    missingCoordinatesCount?: number;
    userRole?: string;
}

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
    opolBarangays = [],
    filters = {},
    totalIncidentsCount = 0,
    validCoordinatesCount = 0,
    missingCoordinatesCount = 0,
    userRole = 'dispatcher',
}: AccidentHeatmapProps) {
    const mapRef = useRef<MapRef>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Current time ticker for live emergency clock
    const [currentTime, setCurrentTime] = useState<string>('');
    const [currentDate, setCurrentDate] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                })
            );
            setCurrentDate(
                now.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState(filters.barangay || 'all');
    const [selectedTypeId, setSelectedTypeId] = useState(filters.incident_type_id ? String(filters.incident_type_id) : 'all');
    const [selectedDatePreset, setSelectedDatePreset] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
    const [minThreshold, setMinThreshold] = useState<number>(filters.min_threshold ?? 1);

    // Keep local filter state synced if server props update
    useEffect(() => {
        if (filters.incident_type_id !== undefined && filters.incident_type_id !== null) {
            setSelectedTypeId(String(filters.incident_type_id));
        }
        if (filters.barangay !== undefined && filters.barangay !== null) {
            setSelectedBarangay(filters.barangay);
        }
        if (filters.status !== undefined && filters.status !== null) {
            setSelectedStatus(filters.status);
        }
        if (filters.min_threshold !== undefined && filters.min_threshold !== null) {
            setMinThreshold(Number(filters.min_threshold));
        }
    }, [filters.incident_type_id, filters.barangay, filters.status, filters.min_threshold]);

    // Map view and layer controls
    const [viewState, setViewState] = useState(OPOL_CENTER);
    const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
    const [showMarkers, setShowMarkers] = useState(true);
    const [showBarangayBoundaries, setShowBarangayBoundaries] = useState(true);
    const [popupInfo, setPopupInfo] = useState<any | null>(null);
    const [selectedIncidentModal, setSelectedIncidentModal] = useState<IncidentRecord | null>(null);
    const [selectedClusterModal, setSelectedClusterModal] = useState<HotspotRecord | null>(null);
    const [selectedHotspot, setSelectedHotspot] = useState<HotspotRecord | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedCoord, setCopiedCoord] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Realtime Automatic Updates via WebSocket (Echo private-dispatcher channel) & Polling Heartbeat
    useEffect(() => {
        if (typeof window === 'undefined' || !(window as any).Echo) return;

        // @ts-ignore
        const channel = (window as any).Echo.private('dispatcher');
        if (!channel) return;

        const handleRealtimeIncidentUpdate = (eventName: string, payload?: any) => {
            console.log(`[Incident Heatmap] Realtime event: ${eventName}, automatically recalculating 20m clusters...`, payload);
            // Refresh data from server while keeping map pan/zoom position and interactive state
            router.reload({
                only: ['incidents', 'hotspots', 'analytics', 'totalIncidentsCount', 'validCoordinatesCount'],
                data: {
                    barangay: selectedBarangay,
                    incident_type_id: selectedTypeId,
                    status: selectedStatus,
                    min_threshold: minThreshold,
                },
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
                only: ['incidents', 'hotspots', 'analytics', 'totalIncidentsCount', 'validCoordinatesCount'],
                data: {
                    barangay: selectedBarangay,
                    incident_type_id: selectedTypeId,
                    status: selectedStatus,
                    min_threshold: minThreshold,
                },
            });
        }, 30000);

        return () => {
            liveEvents.forEach((ev) => {
                channel.stopListening(ev);
                channel.stopListening(`.${ev}`);
            });
            clearInterval(heartbeat);
        };
    }, [selectedBarangay, selectedTypeId, selectedStatus, minThreshold]);

    // Auto-resize Mapbox canvas whenever container geometry changes
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
    }, [isFullScreen]);

    // Handle filter application via Inertia router
    const applyFilters = (overrides: Record<string, any> = {}) => {
        const nextBarangay = overrides.barangay !== undefined ? overrides.barangay : selectedBarangay;
        const nextTypeId = overrides.incident_type_id !== undefined ? overrides.incident_type_id : selectedTypeId;
        const nextStatus = overrides.status !== undefined ? overrides.status : selectedStatus;
        const nextThreshold = overrides.min_threshold !== undefined ? overrides.min_threshold : minThreshold;

        const params: Record<string, any> = {
            barangay: nextBarangay,
            incident_type_id: nextTypeId,
            status: nextStatus,
            min_threshold: nextThreshold,
        };

        const preset = overrides.datePreset !== undefined ? overrides.datePreset : selectedDatePreset;
        if (preset !== 'all') {
            const now = new Date();
            let fromDate = new Date();
            if (preset === '7d') fromDate.setDate(now.getDate() - 7);
            else if (preset === '30d') fromDate.setDate(now.getDate() - 30);
            else if (preset === '90d') fromDate.setDate(now.getDate() - 90);
            else if (preset === 'ytd') fromDate = new Date(now.getFullYear(), 0, 1);

            params.date_from = fromDate.toISOString().split('T')[0];
            params.date_to = now.toISOString().split('T')[0];
        }

        // Always post to current URL path (whether /admin/accident-heatmap or /dispatcher/accident-heatmap)
        const currentRoute = typeof window !== 'undefined' && window.location.pathname
            ? window.location.pathname
            : (userRole === 'admin' ? '/admin/accident-heatmap' : '/dispatcher/accident-heatmap');

        router.get(currentRoute, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedBarangay('all');
        setSelectedTypeId('all');
        setSelectedDatePreset('all');
        setSelectedStatus('all');
        setMinThreshold(1);
        setSearchQuery('');
        setSelectedHotspot(null);
        setPopupInfo(null);

        const currentRoute = typeof window !== 'undefined' && window.location.pathname
            ? window.location.pathname
            : (userRole === 'admin' ? '/admin/accident-heatmap' : '/dispatcher/accident-heatmap');

        router.get(currentRoute, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // 1. Reactive Active Incidents: strictly filters incidents by selected type and barangay
    const activeIncidents = useMemo(() => {
        return incidents.filter((inc) => {
            // Exclude cancelled and rejected reports from heatmap
            const st = (inc.status || '').toLowerCase();
            if (st === 'cancelled' || st === 'rejected') {
                return false;
            }

            // Emergency Type Filter
            if (selectedTypeId && selectedTypeId !== 'all') {
                if (String(inc.incident_type_id) !== String(selectedTypeId)) {
                    return false;
                }
            }

            // Barangay Filter
            if (selectedBarangay && selectedBarangay !== 'all') {
                const incBrgy = (inc.barangay || '').replace(/[\s-]/g, '').toLowerCase();
                const targetBrgy = selectedBarangay.replace(/[\s-]/g, '').toLowerCase();
                if (incBrgy !== targetBrgy && !incBrgy.includes(targetBrgy) && !targetBrgy.includes(incBrgy)) {
                    return false;
                }
            }

            // Status Filter
            if (selectedStatus && selectedStatus !== 'all') {
                if (inc.status !== selectedStatus) {
                    return false;
                }
            }

            return true;
        });
    }, [incidents, selectedTypeId, selectedBarangay, selectedStatus]);

    // 2. Reactive Active Hotspots: dynamically recalculates/filters 20m clusters based on active matching incidents
    const activeHotspots = useMemo(() => {
        const isFilterActive =
            (selectedTypeId && selectedTypeId !== 'all') ||
            (selectedBarangay && selectedBarangay !== 'all') ||
            (selectedStatus && selectedStatus !== 'all');

        if (!isFilterActive) {
            return hotspots.filter((h) => h.incident_count >= minThreshold);
        }

        const activeIncidentIds = new Set(activeIncidents.map((i) => i.id));

        return hotspots
            .map((spot) => {
                const matchedIds = (spot.incident_ids || []).filter((id) => activeIncidentIds.has(id));
                if (matchedIds.length === 0) return null;

                const count = matchedIds.length;
                const isRed = count >= 4;
                const isOrange = count === 3;
                const color = isRed ? '#EF4444' : isOrange ? '#F97316' : '#EAB308';
                const classification = isRed
                    ? 'High Incident Concentration'
                    : isOrange
                    ? 'Moderate Incident Concentration'
                    : 'Low Incident Concentration';
                const intensity = isRed ? 'Critical' : isOrange ? 'High' : 'Moderate';
                const intensityClass = isRed ? 'critical' : isOrange ? 'high' : 'moderate';
                const badgeText = isRed ? 'High (4+)' : isOrange ? 'Moderate (3)' : 'Low (1-2)';

                const filteredContainedIncidents = spot.incidents
                    ? spot.incidents.filter((i) => activeIncidentIds.has(i.id))
                    : undefined;

                return {
                    ...spot,
                    incident_count: count,
                    incident_ids: matchedIds,
                    incidents: filteredContainedIncidents,
                    color,
                    classification,
                    intensity,
                    intensity_class: intensityClass,
                    badge_text: badgeText,
                    meets_threshold: count >= minThreshold,
                } as HotspotRecord;
            })
            .filter((spot): spot is HotspotRecord => spot !== null && spot.incident_count >= minThreshold);
    }, [hotspots, activeIncidents, selectedTypeId, selectedBarangay, selectedStatus, minThreshold]);

    // Filter recent incidents panel list locally by search query from active filtered incidents
    const filteredRecentIncidents = useMemo(() => {
        if (!searchQuery.trim()) return activeIncidents;
        const q = searchQuery.toLowerCase().trim();
        return activeIncidents.filter((inc) => {
            return (
                String(inc.id).includes(q) ||
                inc.incident_type.toLowerCase().includes(q) ||
                inc.address.toLowerCase().includes(q) ||
                inc.barangay.toLowerCase().includes(q) ||
                inc.chief_complaint.toLowerCase().includes(q) ||
                inc.status.toLowerCase().includes(q)
            );
        });
    }, [activeIncidents, searchQuery]);

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
                is_red: spot.incident_count >= 4,
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

    // Fly to specific incident on the map
    const focusIncidentOnMap = (inc: IncidentRecord) => {
        if (!inc.has_coords || !inc.latitude || !inc.longitude) return;
        mapRef.current?.flyTo({
            center: [inc.longitude, inc.latitude],
            zoom: 15.5,
            duration: 1200,
            essential: true,
        });
        setPopupInfo({
            type: 'incident',
            data: inc,
            latitude: inc.latitude,
            longitude: inc.longitude,
        });
    };

    // Fly to specific 20-meter cluster and inspect its contained incidents
    const focusHotspotOnMap = (spot: HotspotRecord) => {
        setSelectedHotspot(spot);
        setSelectedClusterModal(spot);
        mapRef.current?.flyTo({
            center: [spot.longitude, spot.latitude],
            zoom: 16.5,
            duration: 1200,
            essential: true,
        });
        setPopupInfo({
            type: 'hotspot',
            data: spot,
            latitude: spot.latitude,
            longitude: spot.longitude,
        });
    };

    // Reset map view to full extent of Opol municipality
    const resetMapView = () => {
        setSelectedHotspot(null);
        setPopupInfo(null);
        mapRef.current?.flyTo({
            center: [OPOL_CENTER.longitude, OPOL_CENTER.latitude],
            zoom: OPOL_CENTER.zoom,
            duration: 1000,
            essential: true,
        });
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

    // ApexCharts Theme Configuration (Cyber Navy & Cyan Dark Command Center)
    const baseChartOptions: ApexOptions = {
        chart: {
            background: 'transparent',
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        theme: { mode: 'dark' },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.07)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        tooltip: {
            theme: 'dark',
            style: { fontSize: '12px' },
        },
    };

    // 1. Incidents by Barangay Bar Chart Options
    const barangayChartOptions: ApexOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'bar' },
        colors: ['#06b6d4'],
        plotOptions: {
            bar: {
                borderRadius: 5,
                horizontal: true,
                barHeight: '60%',
                distributed: false,
            },
        },
        dataLabels: {
            enabled: true,
            style: { colors: ['#ffffff'], fontSize: '11px', fontWeight: 'bold' },
            offsetX: 8,
        },
        xaxis: {
            categories: analytics?.by_barangay.labels || [],
            labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: '#cbd5e1', fontSize: '11px', fontWeight: 600 },
            },
        },
    };

    // 2. Incident Type Distribution Donut Chart Options
    const typeChartOptions: ApexOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'donut' },
        colors: ['#f43f5e', '#06b6d4', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
        labels: analytics?.by_type.labels || [],
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${Math.round(val)}%`,
            style: { fontSize: '11px', fontWeight: 'bold' },
        },
        legend: {
            position: 'bottom',
            fontSize: '11px',
            labels: { colors: '#94a3b8' },
            itemMargin: { horizontal: 6, vertical: 3 },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 600,
                            formatter: () => `${totalIncidentsCount}`,
                        },
                        value: {
                            color: '#ffffff',
                            fontSize: '18px',
                            fontWeight: 800,
                        },
                    },
                },
            },
        },
        stroke: { show: false },
    };

    // 3. Monthly Trend Area Chart Options
    const trendChartOptions: ApexOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'area' },
        colors: ['#06b6d4'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 95, 100],
            },
        },
        stroke: { curve: 'smooth', width: 2.5 },
        dataLabels: { enabled: false },
        xaxis: {
            categories: analytics?.monthly_trend.categories || [],
            labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
        },
    };

    // Top identified hotspot name
    const topHotspot = hotspots.length > 0 ? hotspots[0] : null;

    return (
        <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 ${isFullScreen ? 'p-0' : ''}`}>
            <Head title="Accident-Prone Area Heatmap | MDRRMO Opol" />

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

            {/* TOP NAVIGATION & BRANDING BAR */}
            <header className="border-b border-white/10 bg-[#0b1329]/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left: Branding & Subtitle */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(userRole === 'admin' ? '/admin/dashboard' : '/dispatcher/dashboard')}
                            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm group"
                            title="Return to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                                <Flame className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                                        MDRRMO OPOL
                                    </h1>
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-wider">
                                        Spatial Intelligence
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    Accident-Prone Area Heatmap & Incident Hotspot Analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Clock & Quick KPI Indicators */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Live Status indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="tracking-wide uppercase text-[10px]">Live Grid</span>
                            <span className="text-slate-500">•</span>
                            <span className="font-mono text-emerald-200">{currentTime || '08:00:00 PM'}</span>
                        </div>

                        {/* Total Recorded Incidents */}
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <div className="text-xs">
                                <span className="text-slate-400 text-[10px] block leading-tight">Total Plotted</span>
                                <span className="font-bold text-white leading-tight">{validCoordinatesCount} of {totalIncidentsCount}</span>
                            </div>
                        </div>

                        {/* Top Identified Hotspot */}
                        {topHotspot && (
                            <div className="hidden lg:flex px-3 py-1.5 rounded-lg bg-slate-900/80 border border-amber-500/30 items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <div className="text-xs">
                                    <span className="text-amber-400/90 text-[10px] block leading-tight font-semibold">Rank #1 Hotspot</span>
                                    <span className="font-bold text-slate-200 leading-tight truncate max-w-[140px]">{topHotspot.barangay}</span>
                                </div>
                            </div>
                        )}

                        {/* Full Screen Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-colors"
                            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                        >
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* FILTER TOOLBAR STRIP */}
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Time Horizon Preset */}
                        <div className="flex items-center rounded-lg bg-slate-900 border border-white/10 p-0.5 text-xs font-medium">
                            {[
                                { id: 'all', label: 'All Time' },
                                { id: '7d', label: '7 Days' },
                                { id: '30d', label: '30 Days' },
                                { id: '90d', label: '90 Days' },
                                { id: 'ytd', label: 'YTD' },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedDatePreset(preset.id);
                                        applyFilters({ datePreset: preset.id });
                                    }}
                                    className={`px-2.5 py-1 rounded-md transition-all ${
                                        selectedDatePreset === preset.id
                                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Barangay Filter */}
                        <select
                            value={selectedBarangay}
                            onChange={(e) => {
                                setSelectedBarangay(e.target.value);
                                applyFilters({ barangay: e.target.value });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                            <option value="all">All Barangays (14)</option>
                            {opolBarangays.map((b) => (
                                <option key={b} value={b}>
                                    Brgy. {b}
                                </option>
                            ))}
                        </select>

                        {/* Incident Type Filter */}
                        <select
                            value={selectedTypeId}
                            onChange={(e) => {
                                setSelectedTypeId(e.target.value);
                                applyFilters({ incident_type_id: e.target.value });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                            <option value="all">All Emergency Types</option>
                            {incidentTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.incident_type_name}
                                </option>
                            ))}
                        </select>

                        {/* Minimum Incident Threshold */}
                        <select
                            value={minThreshold}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setMinThreshold(val);
                                applyFilters({ min_threshold: val });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                            title="Minimum incident count required to display a 20-meter cluster"
                        >
                            <option value={1}>Threshold: All Clusters (≥1)</option>
                            <option value={2}>Threshold: ≥ 2 incidents</option>
                            <option value={3}>Threshold: Moderate & High (≥3)</option>
                            <option value={4}>Threshold: High Only (≥4 Red)</option>
                        </select>

                        {/* Reset Filter Button */}
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                        >
                            <RotateCcw className="w-3 h-3 text-slate-400" />
                            <span>Reset</span>
                        </button>
                    </div>

                    {/* Map Layers & Style Toggles */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowMarkers(!showMarkers)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                showMarkers
                                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <MapPin className="w-3 h-3" />
                            <span>Pins</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowBarangayBoundaries(!showBarangayBoundaries)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                showBarangayBoundaries
                                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Compass className="w-3 h-3" />
                            <span>Boundaries</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                        >
                            <Layers className="w-3 h-3 text-cyan-400" />
                            <span>{mapStyle === 'dark' ? 'Satellite' : 'Dark'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN THREE-COLUMN DASHBOARD BODY */}
            <main className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col gap-4 max-w-[1800px] w-full mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* =========================================================================
                        LEFT PANEL: RECENT INCIDENTS FEED
                    ========================================================================= */}
                    <aside className="xl:col-span-3 flex flex-col bg-[#0b1329]/95 border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
                        {/* Panel Header */}
                        <div className="p-3.5 border-b border-white/10 bg-slate-900/60">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-cyan-400" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Recent Incidents
                                    </h2>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    {filteredRecentIncidents.length}
                                </span>
                            </div>

                            {/* Search Field */}
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search ID, type, address..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Incidents Scrollable List */}
                        <div className="flex-1 overflow-y-auto max-h-[620px] p-2 space-y-2 divide-y divide-white/5">
                            {filteredRecentIncidents.length === 0 ? (
                                <div className="py-12 px-4 text-center">
                                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-400">No matching incidents found</p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Adjust your search or filter parameters to view records.
                                    </p>
                                </div>
                            ) : (
                                filteredRecentIncidents.map((inc) => {
                                    const badge = getTypeBadgeColor(inc.incident_type);
                                    return (
                                        <div
                                            key={inc.id}
                                            onClick={() => focusIncidentOnMap(inc)}
                                            className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                                        {inc.incident_type}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5">
                                                    #INC-{inc.id}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-1.5 text-xs text-slate-300 mb-1.5">
                                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <p className="truncate text-[11px] text-slate-300 leading-tight">
                                                    {inc.address}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                                                <span className="text-slate-400">{inc.formatted_date}</span>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`uppercase font-extrabold text-[9px] px-1.5 py-0.5 rounded ${
                                                            inc.status === 'resolved'
                                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                                : 'bg-amber-500/15 text-amber-400'
                                                        }`}
                                                    >
                                                        {inc.status}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedIncidentModal(inc);
                                                        }}
                                                        className="text-cyan-400 hover:text-cyan-200 underline text-[10px] font-semibold"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Left Panel Footer Summary */}
                        <div className="p-2.5 border-t border-white/10 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>GPS Mapped: <strong className="text-cyan-300">{activeIncidents.filter((i) => i.has_coords && i.latitude !== null && i.longitude !== null).length}</strong></span>
                            {activeIncidents.filter((i) => !i.has_coords || i.latitude === null || i.longitude === null).length > 0 && (
                                <span className="text-amber-400/90 text-[10px]">({activeIncidents.filter((i) => !i.has_coords || i.latitude === null || i.longitude === null).length} unmapped)</span>
                            )}
                        </div>
                    </aside>

                    {/* =========================================================================
                        CENTER PANEL: INTERACTIVE INCIDENT HEATMAP
                    ========================================================================= */}
                    <div className="xl:col-span-6 flex flex-col bg-[#0b1329]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative min-h-[580px] xl:min-h-[660px]">
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

                                    {/* 2. 20-Meter Monochromatic Cluster Radial Glow Layer (Pure Red, Orange, Yellow) */}
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
                                                    'circle-opacity': 0.38,
                                                    'circle-blur': 0.72,
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* 3. Floating Cluster Label Pills & Pulsing Red Beat (Like reference image) */}
                                    {activeHotspots.map((spot, idx) => {
                                        const isSelected = selectedHotspot?.cluster_key === spot.cluster_key;
                                        const isRed = spot.incident_count >= 4;
                                        const isOrange = spot.incident_count === 3;
                                        const clusterColor = isRed ? '#EF4444' : isOrange ? '#F97316' : '#EAB308';
                                        const clusterLevel = isRed ? 'High' : isOrange ? 'Moderate' : 'Low';

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

                                                {/* Floating Cluster Label Pill (Above the cluster area, prominently displaying Barangay) */}
                                                <Marker
                                                    longitude={spot.longitude}
                                                    latitude={spot.latitude}
                                                    anchor="bottom"
                                                    offset={[0, -36]}
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

                                    {/* 4. Individual Incident Location Pins (Professional SVG Teardrop Pins, Color-Coded by Emergency Type) */}
                                    {showMarkers &&
                                        activeIncidents
                                            .filter((i) => i.has_coords && i.latitude !== null && i.longitude !== null)
                                            .map((inc) => {
                                                const badge = getTypeBadgeColor(inc.incident_type);
                                                return (
                                                    <Marker
                                                        key={`inc-pin-${inc.id}`}
                                                        longitude={inc.longitude as number}
                                                        latitude={inc.latitude as number}
                                                        anchor="bottom"
                                                        onClick={(e) => {
                                                            e.originalEvent.stopPropagation();
                                                            focusIncidentOnMap(inc);
                                                        }}
                                                    >
                                                        <div
                                                            className="cursor-pointer group relative flex flex-col items-center"
                                                            title={`#INC-${inc.id}: ${inc.incident_type} (${inc.address || inc.barangay})`}
                                                        >
                                                            {/* Professional 3D-Look Teardrop Emergency Map Pin (NOT a circle) */}
                                                            <div className="relative transition-transform duration-200 group-hover:scale-130 group-hover:-translate-y-1">
                                                                <svg
                                                                    width="24"
                                                                    height="32"
                                                                    viewBox="0 0 24 32"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
                                                                >
                                                                    {/* Teardrop Pin Body pointing down to GPS coordinates */}
                                                                    <path
                                                                        d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                                        fill={badge.hex}
                                                                        stroke="#FFFFFF"
                                                                        strokeWidth="2"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                    {/* Inner white circle target */}
                                                                    <circle
                                                                        cx="12"
                                                                        cy="11.5"
                                                                        r="4.8"
                                                                        fill="#FFFFFF"
                                                                    />
                                                                    {/* Inner emergency color core dot */}
                                                                    <circle
                                                                        cx="12"
                                                                        cy="11.5"
                                                                        r="2.6"
                                                                        fill={badge.hex}
                                                                    />
                                                                </svg>
                                                                {/* Ground shadow beneath the pin point */}
                                                                <div className="w-2.5 h-1 rounded-full bg-black/60 blur-[1px] mx-auto -mt-0.5" />
                                                            </div>

                                                            {/* Floating Tooltip on Hover */}
                                                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                                                                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-white/20 shadow-2xl text-[11px] text-white whitespace-nowrap flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.hex }} />
                                                                    <span className="font-bold">{inc.incident_type}</span>
                                                                    <span className="text-slate-400 font-mono text-[10px]">#INC-{inc.id}</span>
                                                                    <span className="text-slate-400 text-[10px]">Brgy. {inc.barangay}</span>
                                                                </div>
                                                                <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-white/20" />
                                                            </div>
                                                        </div>
                                                    </Marker>
                                                );
                                            })}

                                    {/* 5. Mapbox Interactive Click Popup */}
                                    {popupInfo && (
                                        <Popup
                                            longitude={popupInfo.longitude}
                                            latitude={popupInfo.latitude}
                                            anchor="top"
                                            closeButton={false}
                                            closeOnClick={false}
                                            onClose={() => setPopupInfo(null)}
                                            offset={14}
                                        >
                                            <div className="w-68 bg-[#0b1329] border border-cyan-500/40 rounded-xl p-3.5 shadow-2xl text-slate-100">
                                                {popupInfo.type === 'hotspot' ? (
                                                    <div>
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Flame className="w-4 h-4 text-amber-400" />
                                                                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                                                                    20m Cluster
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                                                                    style={{ backgroundColor: popupInfo.data.color }}
                                                                >
                                                                    {popupInfo.data.badge_text || `${popupInfo.data.incident_count} Incidents`}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPopupInfo(null)}
                                                                    className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                                                                    title="Close"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs font-bold text-white mb-1">
                                                            {popupInfo.data.location_name}
                                                        </p>
                                                        <p className="text-[11px] text-cyan-300 mb-2">
                                                            Brgy. {popupInfo.data.barangay}
                                                        </p>

                                                        <div className="bg-slate-900/80 rounded-lg p-2 text-[10px] text-slate-300 space-y-1 mb-2.5 border border-white/5">
                                                            <div>
                                                                <span className="text-slate-400">Total in 20m:</span>{' '}
                                                                <strong className="text-amber-300 font-bold">{popupInfo.data.incident_count} incidents</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Dominant Type:</span>{' '}
                                                                <strong className="text-white">{popupInfo.data.most_common_type}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Concentration:</span>{' '}
                                                                <strong className="text-cyan-300">{popupInfo.data.classification || '20-Meter Cluster'}</strong>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedClusterModal(popupInfo.data);
                                                            }}
                                                            className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                                        >
                                                            <span>Inspect All ({popupInfo.data.incident_count}) Incidents</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {/* Header row with Incident ID, Status Badge, and non-overlapping Close Button */}
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                                    #INC-{popupInfo.data.id}
                                                                </span>
                                                                <span
                                                                    className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                                                                        popupInfo.data.status === 'resolved'
                                                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                                    }`}
                                                                >
                                                                    {popupInfo.data.status}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPopupInfo(null)}
                                                                className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                                                                title="Close popup"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-white mb-1">
                                                            {popupInfo.data.incident_type}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                                                            {popupInfo.data.address}
                                                        </p>
                                                        <div className="text-[10px] text-slate-400 mb-2">
                                                            {popupInfo.data.formatted_date}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedIncidentModal(popupInfo.data)}
                                                            className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                                                        >
                                                            <span>Inspect Incident</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    )}
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
                                        <span className="text-[10px] text-yellow-300 font-bold">Low (1–2)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                                        <span className="text-[10px] text-orange-300 font-bold">Moderate (3)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                                        <span className="text-[10px] text-red-300 font-bold">High (4+)</span>
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
                        RIGHT PANEL: RANKED INCIDENT HOTSPOTS
                    ========================================================================= */}
                    <aside className="xl:col-span-3 flex flex-col bg-[#0b1329]/95 border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
                        {/* Panel Header */}
                        <div className="p-3.5 border-b border-white/10 bg-slate-900/60">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-400" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Ranked Hotspots
                                    </h2>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    {activeHotspots.length} Clusters
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                High-frequency incident concentrations (Threshold: ≥{minThreshold} cases)
                            </p>
                        </div>

                        {/* Hotspots List */}
                        <div className="flex-1 overflow-y-auto max-h-[620px] p-2 space-y-2">
                            {activeHotspots.length === 0 ? (
                                <div className="py-14 px-4 text-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-300">No Hotspots at Threshold ≥{minThreshold}</p>
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
                                            className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-colors"
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
                                                    ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                                                    : 'bg-slate-900/50 hover:bg-slate-800/50 border-white/5 hover:border-cyan-500/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center text-white shadow-md"
                                                        style={{ backgroundColor: spot.color }}
                                                    >
                                                        #{spot.rank ?? idx + 1}
                                                    </span>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-white leading-tight">
                                                            {spot.location_name}
                                                        </h3>
                                                        <p className="text-[10px] text-cyan-300 font-medium">
                                                            Brgy. {spot.barangay}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border shadow-sm"
                                                    style={{
                                                        backgroundColor: `${spot.color}25`,
                                                        borderColor: `${spot.color}60`,
                                                        color: spot.color,
                                                    }}
                                                >
                                                    {spot.badge_text || (spot.incident_count >= 4 ? 'High (4+)' : spot.incident_count === 3 ? 'Moderate (3)' : 'Low (1-2)')}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-950/60 text-[10px] border border-white/5 mb-2">
                                                <div>
                                                    <span className="text-slate-400 block text-[9px]">Incident Count</span>
                                                    <span className="font-extrabold text-amber-300 text-xs">
                                                        {spot.incident_count} Incidents
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-[9px]">Dominant Type</span>
                                                    <span className="font-bold text-slate-200 truncate block">
                                                        {spot.most_common_type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                <span>Click to pan & inspect</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Panel Disclaimer Note */}
                        <div className="p-3 border-t border-white/10 bg-slate-900/60 text-[10px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <p>
                                Hotspots reflect historical incident density. Operational planning should consider road geometry and time of day.
                            </p>
                        </div>
                    </aside>
                </div>

                {/* =========================================================================
                    BOTTOM PANEL: THREE DATA-DRIVEN VISUALIZATIONS
                ========================================================================= */}
                <section className="bg-[#0b1329]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                Spatial & Temporal Analytics Overview
                            </h2>
                        </div>
                        <span className="text-xs text-slate-400">
                            Respecting current filters ({validCoordinatesCount} mapped incidents)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* 1. Incidents by Barangay */}
                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Incidents by Barangay</span>
                                </h3>
                                <span className="text-[10px] text-slate-400">Ranked frequency</span>
                            </div>
                            <div className="flex-1 min-h-[220px]">
                                {analytics?.by_barangay && analytics.by_barangay.series.some((v) => v > 0) ? (
                                    <ReactApexChart
                                        options={barangayChartOptions}
                                        series={[{ name: 'Incidents', data: analytics.by_barangay.series }]}
                                        type="bar"
                                        height={220}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                                        <BarChart3 className="w-6 h-6 mb-1 opacity-50" />
                                        <span>No records available</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Incident-Type Distribution */}
                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <PieChart className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Incident-Type Distribution</span>
                                </h3>
                                <span className="text-[10px] text-slate-400">Breakdown</span>
                            </div>
                            <div className="flex-1 min-h-[220px] flex items-center justify-center">
                                {analytics?.by_type && analytics.by_type.series.length > 0 && analytics.by_type.series.some((v) => v > 0) ? (
                                    <ReactApexChart
                                        options={typeChartOptions}
                                        series={analytics.by_type.series}
                                        type="donut"
                                        height={220}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                                        <PieChart className="w-6 h-6 mb-1 opacity-50" />
                                        <span>No records available</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Monthly Incident Trends */}
                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Monthly Incident Trends</span>
                                </h3>
                                <span className="text-[10px] text-slate-400">Timeline history</span>
                            </div>
                            <div className="flex-1 min-h-[220px]">
                                {analytics?.monthly_trend && analytics.monthly_trend.series.some((v) => v > 0) ? (
                                    <ReactApexChart
                                        options={trendChartOptions}
                                        series={[{ name: 'Reported Incidents', data: analytics.monthly_trend.series }]}
                                        type="area"
                                        height={220}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                                        <TrendingUp className="w-6 h-6 mb-1 opacity-50" />
                                        <span>No timeline records available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* 20-METER CLUSTER INSPECTION MODAL */}
            {selectedClusterModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
                    <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/80 flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span
                                        className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm"
                                        style={{
                                            backgroundColor: `${selectedClusterModal.color}25`,
                                            borderColor: `${selectedClusterModal.color}80`,
                                            color: selectedClusterModal.color,
                                        }}
                                    >
                                        {selectedClusterModal.classification || `${selectedClusterModal.incident_count} Incidents in 20m`}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                                        20-Meter Radius
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        Rank #{selectedClusterModal.rank ?? 1}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                                    {selectedClusterModal.location_name}
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>Brgy. {selectedClusterModal.barangay}</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="font-mono text-emerald-400">
                                        GPS: {selectedClusterModal.latitude.toFixed(6)}, {selectedClusterModal.longitude.toFixed(6)}
                                    </span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedClusterModal(null)}
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Close Cluster Details"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cluster Overview Stats Bar */}
                        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
                            <div>
                                Total Incidents: <strong className="text-white text-sm">{selectedClusterModal.incident_count}</strong>
                            </div>
                            <div>
                                Dominant Type: <strong className="text-amber-300">{selectedClusterModal.most_common_type}</strong>
                            </div>
                            <div className="hidden sm:block text-[11px] text-slate-400">
                                Proximity: ≤20.0 meters (Haversine)
                            </div>
                        </div>

                        {/* List of ALL Incidents in this 20-Meter Cluster */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!selectedClusterModal.incidents || selectedClusterModal.incidents.length === 0) ? (
                                <p className="text-xs text-slate-400 text-center py-8">
                                    No incident details available for this cluster.
                                </p>
                            ) : (
                                selectedClusterModal.incidents.map((inc, iIdx) => {
                                    const badge = getTypeBadgeColor(inc.incident_type);
                                    return (
                                        <div
                                            key={`cluster-inc-${inc.id}-${iIdx}`}
                                            className="bg-slate-900/50 hover:bg-slate-800/60 p-3.5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                                                    <span className="text-xs font-bold text-white">
                                                        {inc.incident_type}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                                        {inc.incident_number || `#INC-${inc.id}`}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${
                                                        inc.status === 'resolved'
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : inc.status === 'verified'
                                                            ? 'bg-blue-500/15 text-blue-400'
                                                            : 'bg-amber-500/15 text-amber-400'
                                                    }`}
                                                >
                                                    {inc.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 mb-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">{inc.purok_or_location || inc.address}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span>Brgy. {inc.barangay}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span>{inc.incident_date || inc.formatted_date}</span>
                                                    {inc.incident_time && (
                                                        <span className="text-slate-500">at {inc.incident_time}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-mono text-emerald-400/90 text-[10px]">
                                                    <Compass className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span>
                                                        {inc.latitude && inc.longitude
                                                            ? `${inc.latitude.toFixed(6)}, ${inc.longitude.toFixed(6)}`
                                                            : 'No GPS'}
                                                    </span>
                                                </div>
                                            </div>

                                            {inc.chief_complaint && (
                                                <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-white/5 mb-2.5">
                                                    <strong className="text-slate-300">Complaint / Details:</strong> {inc.chief_complaint}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {inc.time_ago}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedIncidentModal(inc);
                                                    }}
                                                    className="px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <span>Inspect Full Details</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3.5 bg-slate-900/80 border-t border-white/10 flex justify-between items-center text-xs">
                            <span className="text-slate-400 text-[11px]">
                                Showing all {selectedClusterModal.incident_count} incidents clustered within 20m.
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedClusterModal(null)}
                                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPREHENSIVE INCIDENT DETAILS INSPECTION MODAL */}
            {selectedIncidentModal && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/80 flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                                        #INC-{selectedIncidentModal.id}
                                    </span>
                                    
                                    {/* Priority Badge */}
                                    <span
                                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                            (selectedIncidentModal.priority || '').toLowerCase() === 'critical'
                                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                                : (selectedIncidentModal.priority || '').toLowerCase() === 'high'
                                                ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                        }`}
                                    >
                                        Priority: {selectedIncidentModal.priority || 'Moderate'}
                                    </span>

                                    {/* Status Badge */}
                                    <span
                                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                            selectedIncidentModal.status === 'resolved'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                : selectedIncidentModal.status === 'verified'
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        }`}
                                    >
                                        {selectedIncidentModal.status}
                                    </span>

                                    {/* Report Source Badge */}
                                    {selectedIncidentModal.report_source === 'walk_in' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                            <UserCheck className="w-3 h-3" />
                                            Walk-In
                                        </span>
                                    ) : selectedIncidentModal.report_source === 'phone_sim' || selectedIncidentModal.report_source === 'dispatcher' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                                            <PhoneCall className="w-3 h-3" />
                                            Phone / SIM Call
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                            <Smartphone className="w-3 h-3" />
                                            Resident Mobile App
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                                        style={{ backgroundColor: getTypeBadgeColor(selectedIncidentModal.incident_type).hex }}
                                    />
                                    <h3 className="text-lg sm:text-xl font-black text-white">
                                        {selectedIncidentModal.incident_type}
                                    </h3>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setSelectedIncidentModal(null)}
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                            {/* 1. Location & Geographic Coordinates Card */}
                            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Incident Location & Geographical Details</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Address / Landmark:</span>
                                        <span className="font-semibold text-white">{selectedIncidentModal.address || 'Opol, Misamis Oriental'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Barangay:</span>
                                        <span className="font-bold text-cyan-300">Brgy. {selectedIncidentModal.barangay}</span>
                                    </div>
                                    <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                                        <div>
                                            <span className="text-slate-400 block text-[11px]">Exact GPS Coordinates:</span>
                                            <span className="font-mono text-emerald-300 font-bold">
                                                {selectedIncidentModal.latitude && selectedIncidentModal.longitude
                                                    ? `${selectedIncidentModal.latitude.toFixed(6)}, ${selectedIncidentModal.longitude.toFixed(6)}`
                                                    : 'Not recorded'}
                                            </span>
                                        </div>
                                        {selectedIncidentModal.latitude && selectedIncidentModal.longitude && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${selectedIncidentModal.latitude}, ${selectedIncidentModal.longitude}`);
                                                    setCopiedCoord(true);
                                                    setTimeout(() => setCopiedCoord(false), 2000);
                                                }}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-white/10 transition-colors"
                                            >
                                                {copiedCoord ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-emerald-300">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3 text-slate-400" />
                                                        <span>Copy GPS</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Reporter & Caller Information Card */}
                            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Caller / Reporter Details</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Reported By:</span>
                                        <span className="font-semibold text-white">{selectedIncidentModal.caller_name || 'Anonymous / Walk-In'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Contact Number:</span>
                                        <span className="font-mono text-cyan-200">{selectedIncidentModal.caller_phone || 'None provided'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Incident Description / Chief Complaint Card */}
                            {(selectedIncidentModal.description || selectedIncidentModal.chief_complaint) && (
                                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Incident Description & Chief Complaint</span>
                                    </div>
                                    <p className="text-xs text-slate-200 leading-relaxed pt-1 whitespace-pre-wrap">
                                        {selectedIncidentModal.description || selectedIncidentModal.chief_complaint}
                                    </p>
                                </div>
                            )}

                            {/* 4. Operational Timeline Card */}
                            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Incident Milestones & Timeline</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                    <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                                        <span className="text-slate-400 block text-[10px]">Reported:</span>
                                        <span className="font-semibold text-slate-200 text-[11px]">
                                            {selectedIncidentModal.reported_at || selectedIncidentModal.formatted_date || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                                        <span className="text-slate-400 block text-[10px]">Verified:</span>
                                        <span className="font-semibold text-blue-300 text-[11px]">
                                            {selectedIncidentModal.verified_at || 'Pending'}
                                        </span>
                                        {selectedIncidentModal.verified_by && (
                                            <span className="text-[10px] text-slate-400 block truncate">By: {selectedIncidentModal.verified_by}</span>
                                        )}
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                                        <span className="text-slate-400 block text-[10px]">Resolved:</span>
                                        <span className="font-semibold text-emerald-300 text-[11px]">
                                            {selectedIncidentModal.resolved_at || (selectedIncidentModal.status === 'resolved' ? 'Resolved' : 'Ongoing')}
                                        </span>
                                    </div>
                                </div>
                                {selectedIncidentModal.verification_remarks && (
                                    <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-xs text-slate-300">
                                        <span className="text-slate-400 text-[10px] block font-semibold">Verification Remarks:</span>
                                        <p className="italic text-[11px] text-slate-300">{selectedIncidentModal.verification_remarks}</p>
                                    </div>
                                )}
                            </div>

                            {/* 5. Patients Catered / Medical Care Records */}
                            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Patients Catered / Medical Care Records ({selectedIncidentModal.patients?.length || 0})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/dispatcher/patients"
                                            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold normal-case text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                            title="Open Master Patient Directory Table"
                                        >
                                            <span>Patient Directory</span>
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                        {selectedIncidentModal.patients && selectedIncidentModal.patients.length > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold lowercase">
                                                {selectedIncidentModal.patients.length} patient{selectedIncidentModal.patients.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {selectedIncidentModal.patients && selectedIncidentModal.patients.length > 0 ? (
                                    <div className="space-y-2.5 pt-1">
                                        {selectedIncidentModal.patients.map((pat, pIdx) => (
                                            <div
                                                key={`modal-pat-${pat.id || pIdx}`}
                                                className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-xs space-y-2"
                                            >
                                                {/* Patient Header: Name, Tag, Disposition */}
                                                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-[11px] font-bold text-rose-300">
                                                            {pIdx + 1}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-white text-sm">
                                                                {pat.name}
                                                            </span>
                                                            {pat.is_unidentified && (
                                                                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                    Unidentified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {pat.disposition && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                                            {pat.disposition}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Demographics & Address */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                                                    <div>
                                                        <span className="text-slate-400">Demographics:</span>{' '}
                                                        <strong className="text-slate-200">
                                                            {pat.gender || 'Unspecified'}
                                                            {pat.age ? `, ${pat.age} yrs old` : ''}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Address:</span>{' '}
                                                        <span className="text-slate-200">{pat.address || 'Not specified'}</span>
                                                    </div>
                                                </div>

                                                {/* Chief Complaint / Clinical Findings */}
                                                {pat.chief_complaint && (
                                                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 text-[11px] text-slate-300 space-y-0.5">
                                                        <span className="text-amber-400 font-bold block text-[10px] uppercase">
                                                            Chief Complaint / Clinical Notes
                                                        </span>
                                                        <p className="text-slate-200 leading-relaxed">{pat.chief_complaint}</p>
                                                    </div>
                                                )}

                                                {/* Destination Hospital & Attending Responders */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-0.5">
                                                    {pat.destination_hospital && (
                                                        <div>
                                                            <span className="text-slate-400">Destination Hospital:</span>{' '}
                                                            <strong className="text-cyan-300">{pat.destination_hospital}</strong>
                                                        </div>
                                                    )}
                                                    {pat.ambulance_unit && (
                                                        <div>
                                                            <span className="text-slate-400">Attending Unit:</span>{' '}
                                                            <span className="text-slate-200">{pat.ambulance_unit}</span>
                                                        </div>
                                                    )}
                                                    {pat.responders && (
                                                        <div className="sm:col-span-2">
                                                            <span className="text-slate-400">Responders / EMT:</span>{' '}
                                                            <span className="text-slate-200">{pat.responders}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons: Redirect to Patient Table & View Full PCR Details (Same Tab Navigation) */}
                                                <div className="pt-2.5 mt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                                                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                                                        <span>PCR #{pat.pcr_id}</span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Button: Open Master Patient Table filtered by this patient */}
                                                        <Link
                                                            href={`/dispatcher/patients?search=${encodeURIComponent(pat.name)}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-white/25 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                                                            title="Redirect to Patient Table directory"
                                                        >
                                                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span>Patient Table</span>
                                                        </Link>

                                                        {/* Button: View Full Patient Profile & PCR Details */}
                                                        {pat.patient_id ? (
                                                            <Link
                                                                href={`/dispatcher/patients/${pat.patient_id}`}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 hover:scale-[1.02] cursor-pointer"
                                                                title="View full patient profile and complete medical PCR history"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>View Full PCR Details</span>
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href="/dispatcher/patient-care-records"
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                                                                title="Open Patient Care Records table"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>View Care Records</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-2.5 px-3 rounded-xl bg-slate-950/40 border border-white/5 text-center text-slate-400 text-xs">
                                        <span className="italic">No patients recorded or catered for this incident.</span>
                                    </div>
                                )}
                            </div>

                            {/* 6. Assigned Dispatch & Responder Units Card (if any) */}
                            {selectedIncidentModal.dispatches && selectedIncidentModal.dispatches.length > 0 && (
                                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                                        <Truck className="w-3.5 h-3.5" />
                                        <span>Assigned Emergency Units & Responders ({selectedIncidentModal.dispatches.length})</span>
                                    </div>
                                    <div className="space-y-2 pt-1">
                                        {selectedIncidentModal.dispatches.map((disp, dIdx) => (
                                            <div key={`modal-disp-${disp.id}-${dIdx}`} className="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 text-xs space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-white flex items-center gap-1.5">
                                                        <Truck className="w-3 h-3 text-cyan-400" />
                                                        {disp.ambulance_unit}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                                        {disp.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                                                    <div>
                                                        <span className="text-slate-400">Driver:</span>{' '}
                                                        <strong className="text-slate-200">{disp.driver_name}</strong>
                                                    </div>
                                                    {disp.crew_members && disp.crew_members.length > 0 && (
                                                        <div>
                                                            <span className="text-slate-400">Crew / EMTs:</span>{' '}
                                                            <strong className="text-slate-200">{disp.crew_members.join(', ')}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                                {(disp.pcr_patient || disp.pcr_hospital || disp.pcr_condition) && (
                                                    <div className="p-2 rounded bg-slate-900 border border-white/5 text-[11px] text-slate-300 space-y-0.5">
                                                        <span className="text-cyan-400 font-bold block text-[10px] uppercase">Patient Care Record (PCR)</span>
                                                        {disp.pcr_patient && disp.pcr_patient !== 'N/A' && (
                                                            <div><span className="text-slate-400">Patient:</span> {disp.pcr_patient}</div>
                                                        )}
                                                        {disp.pcr_hospital && disp.pcr_hospital !== 'N/A' && (
                                                            <div><span className="text-slate-400">Hospital:</span> {disp.pcr_hospital}</div>
                                                        )}
                                                        {disp.pcr_condition && (
                                                            <div><span className="text-slate-400">Chief Complaint:</span> {disp.pcr_condition}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 7. Photo Evidence (if any) */}
                            {selectedIncidentModal.images && selectedIncidentModal.images.length > 0 && (
                                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                                        <Camera className="w-3.5 h-3.5" />
                                        <span>Incident Photo Evidence ({selectedIncidentModal.images.length})</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                                        {selectedIncidentModal.images.map((img, imgIdx) => (
                                            <div
                                                key={`modal-img-${img.id || imgIdx}`}
                                                className="group relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black cursor-pointer shadow-md"
                                                onClick={() => setPreviewImage(img.url)}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={`Evidence #${imgIdx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        View Full
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-400">
                                Recorded in MDRRMO Opol Emergency System
                            </span>
                            <div className="flex items-center gap-2">
                                {selectedIncidentModal.has_coords && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            focusIncidentOnMap(selectedIncidentModal);
                                            setSelectedIncidentModal(null);
                                        }}
                                        className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
                                    >
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Locate on Map</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedIncidentModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULLSCREEN PHOTO LIGHTBOX PREVIEW */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 text-xs font-bold transition-all"
                    >
                        <X className="w-4 h-4" />
                        <span>Close Preview</span>
                    </button>
                    <div
                        className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Incident Full Evidence"
                            className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/10 shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
