import { useState, useRef, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Radio
} from 'lucide-react';

interface IncidentRecord {
    id: number;
    incident_id: number;
    incident_type: string;
    incident_type_id: number;
    status: string;
    priority: string;
    address: string;
    barangay: string;
    description: string;
    chief_complaint: string;
    latitude: number | null;
    longitude: number | null;
    has_coords: boolean;
    created_at: string | null;
    formatted_date: string;
    time_ago: string;
}

interface HotspotRecord {
    cluster_key: string;
    latitude: number;
    longitude: number;
    location_name: string;
    barangay: string;
    incident_count: number;
    most_common_type: string;
    intensity: 'Critical' | 'High' | 'Moderate';
    intensity_class: 'critical' | 'high' | 'moderate';
    color: string;
    incident_ids: number[];
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
    const [minThreshold, setMinThreshold] = useState<number>(filters.min_threshold ?? 2);

    // Map view and layer controls
    const [viewState, setViewState] = useState(OPOL_CENTER);
    const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
    const [showHeatmapLayer, setShowHeatmapLayer] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [showBarangayBoundaries, setShowBarangayBoundaries] = useState(true);
    const [popupInfo, setPopupInfo] = useState<any | null>(null);
    const [selectedIncidentModal, setSelectedIncidentModal] = useState<IncidentRecord | null>(null);
    const [selectedHotspot, setSelectedHotspot] = useState<HotspotRecord | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

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
        const params: Record<string, any> = {
            barangay: overrides.barangay !== undefined ? overrides.barangay : selectedBarangay,
            incident_type_id: overrides.incident_type_id !== undefined ? overrides.incident_type_id : selectedTypeId,
            status: overrides.status !== undefined ? overrides.status : selectedStatus,
            min_threshold: overrides.min_threshold !== undefined ? overrides.min_threshold : minThreshold,
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

        const currentRoute = userRole === 'admin' ? '/admin/accident-heatmap' : '/dispatcher/accident-heatmap';
        router.get(currentRoute, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedBarangay('all');
        setSelectedTypeId('all');
        setSelectedDatePreset('all');
        setSelectedStatus('all');
        setMinThreshold(2);
        setSearchQuery('');
        setSelectedHotspot(null);
        setPopupInfo(null);

        const currentRoute = userRole === 'admin' ? '/admin/accident-heatmap' : '/dispatcher/accident-heatmap';
        router.get(currentRoute, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Filter recent incidents panel list locally by search query
    const filteredRecentIncidents = useMemo(() => {
        if (!searchQuery.trim()) return incidents;
        const q = searchQuery.toLowerCase().trim();
        return incidents.filter((inc) => {
            return (
                String(inc.id).includes(q) ||
                inc.incident_type.toLowerCase().includes(q) ||
                inc.address.toLowerCase().includes(q) ||
                inc.barangay.toLowerCase().includes(q) ||
                inc.chief_complaint.toLowerCase().includes(q) ||
                inc.status.toLowerCase().includes(q)
            );
        });
    }, [incidents, searchQuery]);

    // GeoJSON Feature Collection for Mapbox Heatmap Layer
    const incidentsGeojson = useMemo(() => {
        const features = incidents
            .filter((i) => i.has_coords && i.latitude !== null && i.longitude !== null)
            .map((i) => ({
                type: 'Feature' as const,
                properties: {
                    id: i.id,
                    incident_type: i.incident_type,
                    address: i.address,
                    barangay: i.barangay,
                    status: i.status,
                    priority: i.priority,
                    formatted_date: i.formatted_date,
                    // Weight multiplier: critical incidents have slightly higher heat weight
                    weight: i.priority === 'Critical' ? 1.5 : i.priority === 'High' ? 1.2 : 1.0,
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [i.longitude as number, i.latitude as number],
                },
            }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [incidents]);

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

    // Fly to specific hotspot cluster
    const focusHotspotOnMap = (spot: HotspotRecord) => {
        setSelectedHotspot(spot);
        mapRef.current?.flyTo({
            center: [spot.longitude, spot.latitude],
            zoom: 15.2,
            duration: 1300,
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

    // Color mapper for emergency incident types
    const getTypeBadgeColor = (type: string) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('vehicular') || lower.includes('accident') || lower.includes('traffic')) {
            return {
                bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
                dot: 'bg-rose-500',
                hex: '#f43f5e',
            };
        }
        if (lower.includes('medical') || lower.includes('cardiac') || lower.includes('trauma')) {
            return {
                bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
                dot: 'bg-cyan-500',
                hex: '#06b6d4',
            };
        }
        if (lower.includes('fire')) {
            return {
                bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
                dot: 'bg-amber-500',
                hex: '#f59e0b',
            };
        }
        if (lower.includes('weather') || lower.includes('flood')) {
            return {
                bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
                dot: 'bg-blue-500',
                hex: '#3b82f6',
            };
        }
        return {
            bg: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
            dot: 'bg-violet-500',
            hex: '#8b5cf6',
        };
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
                    color: #94a3b8 !important;
                    font-size: 16px !important;
                    padding: 6px 10px !important;
                    z-index: 40 !important;
                }
                .mapboxgl-popup-close-button:hover {
                    color: #f43f5e !important;
                    background: transparent !important;
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
                            title="Minimum recurring incident volume required to classify as a hotspot"
                        >
                            <option value={2}>Threshold: ≥ 2 incidents</option>
                            <option value={3}>Threshold: ≥ 3 incidents</option>
                            <option value={5}>Threshold: ≥ 5 incidents (Critical)</option>
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
                            onClick={() => setShowHeatmapLayer(!showHeatmapLayer)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                showHeatmapLayer
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Flame className="w-3 h-3" />
                            <span>Heatmap</span>
                        </button>

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
                            <span>GPS Mapped: <strong className="text-cyan-300">{validCoordinatesCount}</strong></span>
                            {missingCoordinatesCount > 0 && (
                                <span className="text-amber-400/90 text-[10px]">({missingCoordinatesCount} unmapped)</span>
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
                                                    'fill-color': '#06b6d4',
                                                    'fill-opacity': 0.04,
                                                }}
                                            />
                                            <Layer
                                                id="opol-boundary-lines"
                                                type="line"
                                                paint={{
                                                    'line-color': '#06b6d4',
                                                    'line-width': 1.2,
                                                    'line-opacity': 0.35,
                                                    'line-dasharray': [3, 2],
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* 2. Mapbox Built-in Density Heatmap Layer */}
                                    {showHeatmapLayer && (
                                        <Source id="incidents-density-source" type="geojson" data={incidentsGeojson}>
                                            <Layer
                                                id="incidents-heatmap-layer"
                                                type="heatmap"
                                                maxzoom={24}
                                                paint={{
                                                    'heatmap-weight': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['get', 'weight'],
                                                        0.8, 0.8,
                                                        1.5, 1.8
                                                    ],
                                                    'heatmap-intensity': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['zoom'],
                                                        9, 1.0,
                                                        12, 1.8,
                                                        15, 3.2,
                                                        17, 5.0,
                                                        19, 7.5,
                                                        21, 10.0,
                                                    ],
                                                    // Emergency heat color ramp: transparent -> cyan -> blue -> amber -> red
                                                    'heatmap-color': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['heatmap-density'],
                                                        0, 'rgba(6, 182, 212, 0)',
                                                        0.05, 'rgba(6, 182, 212, 0.45)',
                                                        0.2, 'rgba(59, 130, 246, 0.75)',
                                                        0.45, 'rgba(245, 158, 11, 0.88)',
                                                        0.75, 'rgba(239, 68, 68, 0.95)',
                                                        1.0, 'rgba(225, 29, 72, 1.0)',
                                                    ],
                                                    'heatmap-radius': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['zoom'],
                                                        9, 14,
                                                        12, 24,
                                                        15, 42,
                                                        17, 65,
                                                        19, 90,
                                                        21, 120,
                                                    ],
                                                    'heatmap-opacity': 0.88,
                                                }}
                                            />
                                            {/* Street-Level Heat Glow Circle Layer for close-up street zoom (zoom >= 14) */}
                                            <Layer
                                                id="incidents-street-heat-glow"
                                                type="circle"
                                                minzoom={14}
                                                maxzoom={24}
                                                paint={{
                                                    'circle-radius': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['zoom'],
                                                        14, 18,
                                                        16, 34,
                                                        18, 58,
                                                        20, 88,
                                                    ],
                                                    'circle-color': [
                                                        'case',
                                                        ['==', ['get', 'priority'], 'Critical'],
                                                        '#e11d48',
                                                        ['==', ['get', 'priority'], 'High'],
                                                        '#f59e0b',
                                                        '#06b6d4',
                                                    ],
                                                    'circle-opacity': [
                                                        'interpolate',
                                                        ['linear'],
                                                        ['zoom'],
                                                        14, 0.25,
                                                        16, 0.55,
                                                        18, 0.75,
                                                        20, 0.85,
                                                    ],
                                                    'circle-blur': 0.85,
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* 3. Hotspot Cluster Indicators */}
                                    {hotspots.map((spot, idx) => {
                                        const isSelected = selectedHotspot?.cluster_key === spot.cluster_key;
                                        return (
                                            <Marker
                                                key={`hotspot-${spot.cluster_key}-${idx}`}
                                                longitude={spot.longitude}
                                                latitude={spot.latitude}
                                                anchor="center"
                                                onClick={(e) => {
                                                    e.originalEvent.stopPropagation();
                                                    focusHotspotOnMap(spot);
                                                }}
                                            >
                                                <div className="relative group cursor-pointer">
                                                    {/* Outer pulsing ring for critical/high hotspots */}
                                                    {spot.intensity === 'Critical' && (
                                                        <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping" />
                                                    )}
                                                    {spot.intensity === 'High' && (
                                                        <span className="absolute -inset-1.5 rounded-full bg-amber-500/35 animate-pulse" />
                                                    )}

                                                    {/* Central Badge */}
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow-lg border-2 transition-transform duration-200 group-hover:scale-125 ${
                                                            isSelected ? 'ring-4 ring-cyan-400 scale-125' : ''
                                                        }`}
                                                        style={{
                                                            backgroundColor: spot.color,
                                                            borderColor: '#ffffff',
                                                            boxShadow: `0 0 16px ${spot.color}`,
                                                        }}
                                                    >
                                                        {spot.incident_count}
                                                    </div>
                                                </div>
                                            </Marker>
                                        );
                                    })}

                                    {/* 4. Individual Incident Markers */}
                                    {showMarkers &&
                                        incidents
                                            .filter((i) => i.has_coords && i.latitude !== null && i.longitude !== null)
                                            .map((inc) => {
                                                const badge = getTypeBadgeColor(inc.incident_type);
                                                return (
                                                    <Marker
                                                        key={`inc-marker-${inc.id}`}
                                                        longitude={inc.longitude as number}
                                                        latitude={inc.latitude as number}
                                                        anchor="bottom"
                                                        onClick={(e) => {
                                                            e.originalEvent.stopPropagation();
                                                            focusIncidentOnMap(inc);
                                                        }}
                                                    >
                                                        <div className="cursor-pointer group relative">
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125"
                                                                style={{ backgroundColor: badge.hex }}
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                                            closeOnClick={false}
                                            onClose={() => setPopupInfo(null)}
                                            offset={14}
                                        >
                                            <div className="w-64 bg-[#0b1329] border border-cyan-500/40 rounded-xl p-3 shadow-2xl text-slate-100">
                                                {popupInfo.type === 'hotspot' ? (
                                                    <div>
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Flame className="w-4 h-4 text-amber-400" />
                                                                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                                                                    Hotspot Area
                                                                </span>
                                                            </div>
                                                            <span
                                                                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                                                                style={{ backgroundColor: popupInfo.data.color }}
                                                            >
                                                                {popupInfo.data.intensity} ({popupInfo.data.incident_count})
                                                            </span>
                                                        </div>

                                                        <p className="text-xs font-bold text-white mb-1">
                                                            {popupInfo.data.location_name}
                                                        </p>
                                                        <p className="text-[11px] text-cyan-300 mb-2">
                                                            Brgy. {popupInfo.data.barangay}
                                                        </p>

                                                        <div className="bg-slate-900/80 rounded-lg p-2 text-[10px] text-slate-300 space-y-1 mb-2.5">
                                                            <div>
                                                                <span className="text-slate-400">Primary Incident Type:</span>{' '}
                                                                <strong className="text-white">{popupInfo.data.most_common_type}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Total Recorded:</span>{' '}
                                                                <strong className="text-amber-300">{popupInfo.data.incident_count} incidents</strong>
                                                            </div>
                                                        </div>

                                                        <p className="text-[10px] text-slate-400 italic">
                                                            Recurring hotspot meeting frequency threshold.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                                                            <span className="text-[10px] font-mono font-bold text-cyan-400">
                                                                #INC-{popupInfo.data.id}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                                                {popupInfo.data.status}
                                                            </span>
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

                            {/* ON-MAP FLOATING LEGEND (Bottom Left) */}
                            <div className="absolute bottom-3 left-3 bg-[#0b1329]/90 border border-white/15 backdrop-blur-md rounded-xl p-3 shadow-xl max-w-[240px] z-10">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                        Heatmap Density
                                    </span>
                                    <span className="text-[9px] text-cyan-400 font-mono">Kernel KDE</span>
                                </div>
                                {/* Gradient intensity bar */}
                                <div className="h-2.5 rounded-full w-full bg-gradient-to-r from-cyan-500 via-blue-500 via-amber-400 to-rose-600 shadow-inner mb-1.5" />
                                <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase">
                                    <span>Low</span>
                                    <span>Moderate</span>
                                    <span>High</span>
                                    <span className="text-rose-400">Critical</span>
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
                                    {hotspots.length} Clusters
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                High-frequency incident concentrations (Threshold: ≥{minThreshold} cases)
                            </p>
                        </div>

                        {/* Hotspots List */}
                        <div className="flex-1 overflow-y-auto max-h-[620px] p-2 space-y-2">
                            {hotspots.length === 0 ? (
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
                                hotspots.map((spot, idx) => {
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
                                                        className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center text-white ${
                                                            idx === 0
                                                                ? 'bg-rose-600 shadow-md shadow-rose-600/30'
                                                                : idx === 1
                                                                ? 'bg-amber-600'
                                                                : idx === 2
                                                                ? 'bg-blue-600'
                                                                : 'bg-slate-700'
                                                        }`}
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
                                                    className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                                                        spot.intensity === 'Critical'
                                                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                                            : spot.intensity === 'High'
                                                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                                            : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                                    }`}
                                                >
                                                    {spot.intensity}
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

            {/* INCIDENT DETAILS INSPECTION MODAL */}
            {selectedIncidentModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-slate-100">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedIncidentModal(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                                #INC-{selectedIncidentModal.id}
                            </span>
                            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {selectedIncidentModal.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">
                            {selectedIncidentModal.incident_type}
                        </h3>

                        <div className="space-y-3 my-4">
                            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5 text-xs">
                                <div>
                                    <span className="text-slate-400">Location:</span>{' '}
                                    <strong className="text-white">{selectedIncidentModal.address}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400">Barangay:</span>{' '}
                                    <strong className="text-cyan-300">Brgy. {selectedIncidentModal.barangay}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400">GPS Coordinates:</span>{' '}
                                    <strong className="font-mono text-emerald-300">
                                        {selectedIncidentModal.latitude && selectedIncidentModal.longitude
                                            ? `${selectedIncidentModal.latitude.toFixed(6)}, ${selectedIncidentModal.longitude.toFixed(6)}`
                                            : 'Not recorded'}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-slate-400">Date Reported:</span>{' '}
                                    <strong className="text-slate-200">{selectedIncidentModal.formatted_date}</strong>
                                </div>
                            </div>

                            {selectedIncidentModal.description && (
                                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs">
                                    <span className="text-slate-400 block mb-1 font-semibold">Incident Details:</span>
                                    <p className="text-slate-200 leading-relaxed">
                                        {selectedIncidentModal.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {selectedIncidentModal.has_coords && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        focusIncidentOnMap(selectedIncidentModal);
                                        setSelectedIncidentModal(null);
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
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
            )}
        </div>
    );
}
