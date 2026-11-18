import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Activity,
    Calendar,
    Camera,
    Check,
    Clock,
    Compass,
    Copy,
    ExternalLink,
    FileText,
    HeartPulse,
    Image as ImageIcon,
    Layers,
    MapPin,
    Navigation,
    Phone,
    Truck,
    User,
    X,
} from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import StatusBadge from '@/shared/components/StatusBadge';

interface IncidentLocateModalProps {
    incident: any | null;
    open: boolean;
    onClose: () => void;
    onOpenDetails?: (incident: any) => void;
    barangayGeojson?: any;
    categoryLabel?: string;
    chiefComplaintLabel?: string;
}

type MapStyleMode = 'default' | 'streets' | 'satellite';

export default function IncidentLocateModal({
    incident,
    open,
    onClose,
    onOpenDetails,
    barangayGeojson = null,
    categoryLabel,
    chiefComplaintLabel,
}: IncidentLocateModalProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';
    const mapRef = useRef<MapRef>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('default');
    const [copiedCoords, setCopiedCoords] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // Extract coordinates (prefer incident coordinates, fall back to reporter coordinates)
    const coords = useMemo(() => {
        if (!incident) return null;
        const rawLat = incident.incident_latitude ?? incident.reporter_latitude;
        const rawLng = incident.incident_longitude ?? incident.reporter_longitude;
        const lat = parseFloat(String(rawLat ?? ''));
        const lng = parseFloat(String(rawLng ?? ''));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { lat, lng };
        }
        return null;
    }, [incident]);

    const [viewState, setViewState] = useState({
        longitude: 124.577,
        latitude: 8.52,
        zoom: 15.5,
    });

    // Sync viewState whenever the located incident changes
    useEffect(() => {
        if (!open || !incident) return;
        setCopiedCoords(false);
        setPreviewImageUrl(null);
        if (coords) {
            setViewState({
                longitude: coords.lng,
                latitude: coords.lat,
                zoom: 16,
            });
            const timer = setTimeout(() => {
                mapRef.current?.resize();
                mapRef.current?.flyTo({
                    center: [coords.lng, coords.lat],
                    zoom: 16,
                    duration: 800,
                    essential: true,
                });
            }, 150);
            return () => clearTimeout(timer);
        } else {
            setViewState({
                longitude: 124.577,
                latitude: 8.52,
                zoom: 12.5,
            });
        }
    }, [open, incident?.id, coords?.lat, coords?.lng]);

    // ResizeObserver for Mapbox inside Radix dialog
    useEffect(() => {
        if (!open || !mapContainerRef.current) return;
        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });
        observer.observe(mapContainerRef.current);
        const t1 = setTimeout(() => mapRef.current?.resize(), 100);
        const t2 = setTimeout(() => mapRef.current?.resize(), 350);
        return () => {
            observer.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [open]);

    const barangayName = useMemo(() => {
        if (!incident) return '';
        if (typeof incident.barangay === 'object') {
            return incident.barangay?.barangay_name || incident.barangay?.name || '';
        }
        return (
            incident.barangay ||
            incident.resident?.resident_profile?.barangay?.barangay_name ||
            incident.resident?.residentProfile?.barangay?.barangay_name ||
            ''
        );
    }, [incident]);

    const highlightedBarangayGeojson = useMemo(() => {
        if (!barangayGeojson?.features || !barangayName) return null;
        const norm = barangayName.toLowerCase().replace(/[\s-]/g, '');
        const matching = barangayGeojson.features.filter((f: any) => {
            const name = (f.properties?.name ?? '').toLowerCase().replace(/[\s-]/g, '');
            return name === norm;
        });
        if (matching.length === 0) return null;
        return {
            type: 'FeatureCollection' as const,
            features: matching,
        };
    }, [barangayGeojson, barangayName]);

    const mapStyleUrl = useMemo(() => {
        if (mapStyleMode === 'satellite') {
            return 'mapbox://styles/mapbox/satellite-streets-v12';
        }
        if (mapStyleMode === 'streets') {
            return 'mapbox://styles/mapbox/streets-v12';
        }
        return isDark
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/light-v11';
    }, [mapStyleMode, isDark]);

    if (!incident) return null;

    const placeDisplay =
        incident.incident_address ||
        incident.place_of_incident ||
        incident.location ||
        (barangayName ? `Brgy. ${barangayName}, Opol, Misamis Oriental` : 'Opol, Misamis Oriental');

    const reportedDateObj = incident.reported_at || incident.created_at
        ? new Date(incident.reported_at || incident.created_at)
        : null;
    const resolvedDateObj = incident.resolved_at ? new Date(incident.resolved_at) : null;

    const callerName =
        incident.caller_name ||
        (incident.resident
            ? [incident.resident.first_name, incident.resident.last_name].filter(Boolean).join(' ')
            : 'Citizen / Unspecified Caller');
    const callerPhone =
        incident.caller_phone_number || incident.resident?.phone_number || 'N/A';

    const locationCodeText =
        typeof incident.location_code === 'object'
            ? incident.location_code?.code || incident.location_code?.location_code
            : incident.location_code;

    const rawDescription =
        incident.incident_description || incident.description || 'No narrative description recorded.';

    const dispatches: any[] = Array.isArray(incident.dispatches) ? incident.dispatches : [];

    // Collect deduplicated incident / dispatch / PCR scene images
    const incidentPhotos: { url: string; source?: string; caption?: string }[] = [];
    const seenPhotoUrls = new Set<string>();
    const pushPhoto = (img: any, fallbackSource?: string) => {
        if (!img) return;
        const rawPath = typeof img === 'string' ? img : (img.image_url || img.url || img.image_path || '');
        if (!rawPath || typeof rawPath !== 'string') return;
        const url =
            rawPath.startsWith('http://') ||
            rawPath.startsWith('https://') ||
            rawPath.startsWith('/storage/') ||
            rawPath.startsWith('data:')
                ? rawPath
                : `/storage/${rawPath.replace(/^\/+/, '')}`;
        if (seenPhotoUrls.has(url)) return;
        seenPhotoUrls.add(url);
        incidentPhotos.push({
            url,
            source: typeof img === 'object' ? (img.source || fallbackSource) : fallbackSource,
            caption: typeof img === 'object' ? (img.location_name || img.caption || undefined) : undefined,
        });
    };

    if (Array.isArray(incident.images)) {
        for (const img of incident.images) pushPhoto(img, 'resident');
    }
    for (const d of dispatches) {
        if (Array.isArray(d?.images)) {
            for (const img of d.images) pushPhoto(img, 'responder_pcr');
        }
        const pcrs = [
            ...(Array.isArray(d?.patient_care_records) ? d.patient_care_records : []),
            ...(Array.isArray(d?.patientCareRecords) ? d.patientCareRecords : []),
            ...(d?.patient_care_record ? [d.patient_care_record] : []),
            ...(d?.patientCareRecord ? [d.patientCareRecord] : []),
        ];
        for (const p of pcrs) {
            if (Array.isArray(p?.images)) {
                for (const img of p.images) pushPhoto(img, 'responder_pcr');
            }
        }
    }

    // Collect PCR patient names attached to this incident
    const pcrPatients: string[] = [];
    const seenPcrIds = new Set<number | string>();
    for (const d of dispatches) {
        const list = [
            ...(Array.isArray(d?.patient_care_records) ? d.patient_care_records : []),
            ...(Array.isArray(d?.patientCareRecords) ? d.patientCareRecords : []),
            ...(d?.patient_care_record ? [d.patient_care_record] : []),
            ...(d?.patientCareRecord ? [d.patientCareRecord] : []),
        ];
        for (const p of list) {
            if (!p || seenPcrIds.has(p.id)) continue;
            seenPcrIds.add(p.id);
            const pt = p.patient || {};
            const name =
                [pt.first_name, pt.last_name].filter(Boolean).join(' ') ||
                pt.full_name ||
                p.patient_name ||
                `PCR #${p.id}`;
            pcrPatients.push(name);
        }
    }

    const handleRecenter = () => {
        if (!coords || !mapRef.current) return;
        mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 16.5,
            duration: 700,
            essential: true,
        });
    };

    const handleCopyCoords = () => {
        if (!coords) return;
        navigator.clipboard?.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 1800);
    };

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-900 dark:text-white overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                                <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <Dialog.Title className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                        Incident #{incident.id} Location
                                    </Dialog.Title>
                                    <StatusBadge status={incident.incident_status} size="xs" />
                                    {incident.priority && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                            {incident.priority}
                                        </span>
                                    )}
                                </div>
                                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {placeDisplay}
                                </Dialog.Description>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Split Body */}
                    <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
                        {/* Left: Interactive Map */}
                        <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[380px] lg:min-h-[500px] bg-slate-100 dark:bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
                            <div ref={mapContainerRef} className="w-full h-full min-h-[320px] sm:min-h-[380px] lg:min-h-[500px] relative">
                                <style>{`
                                    .mapboxgl-ctrl-logo { display: none !important; }
                                    .mapboxgl-ctrl-attrib { display: none !important; }
                                `}</style>

                                {import.meta.env.VITE_MAPBOX_TOKEN && coords ? (
                                    <Map
                                        ref={mapRef}
                                        style={{ width: '100%', height: '100%' }}
                                        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                        {...viewState}
                                        onMove={(evt) => setViewState(evt.viewState)}
                                        onLoad={() => mapRef.current?.resize()}
                                        mapStyle={mapStyleUrl}
                                        attributionControl={false}
                                    >
                                        {barangayGeojson && (
                                            <Source id="locate-all-barangays" type="geojson" data={barangayGeojson}>
                                                <Layer
                                                    id="locate-all-line"
                                                    type="line"
                                                    paint={{
                                                        'line-color': isDark ? '#64748b' : '#94a3b8',
                                                        'line-width': 1,
                                                        'line-opacity': 0.45,
                                                        'line-dasharray': [2, 2],
                                                    }}
                                                />
                                            </Source>
                                        )}

                                        {highlightedBarangayGeojson && (
                                            <Source id="locate-highlight-barangay" type="geojson" data={highlightedBarangayGeojson}>
                                                <Layer
                                                    id="locate-highlight-fill"
                                                    type="fill"
                                                    paint={{
                                                        'fill-color': '#0ea5e9',
                                                        'fill-opacity': 0.1,
                                                    }}
                                                />
                                                <Layer
                                                    id="locate-highlight-line"
                                                    type="line"
                                                    paint={{
                                                        'line-color': '#0ea5e9',
                                                        'line-width': 2,
                                                        'line-opacity': 0.8,
                                                    }}
                                                />
                                            </Source>
                                        )}

                                        <Marker longitude={coords.lng} latitude={coords.lat} anchor="bottom">
                                            <div className="relative flex flex-col items-center">
                                                <div className="mb-1 px-2.5 py-1 rounded-full bg-slate-950/90 text-white text-[11px] font-bold shadow-lg border border-white/20 whitespace-nowrap flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                    <span>
                                                        #{incident.id}
                                                        {barangayName ? ` • Brgy. ${barangayName}` : ''}
                                                    </span>
                                                </div>
                                                <MapPin
                                                    className="w-9 h-9 text-white fill-rose-600 drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]"
                                                    strokeWidth={1.75}
                                                />
                                            </div>
                                        </Marker>
                                    </Map>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                                            <Compass className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {coords ? 'Mapbox Token Not Configured' : 'No GPS Coordinates Available'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                            {coords
                                                ? `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                                                : 'This incident record has no latitude/longitude coordinates saved, but its text address and details are shown on the right.'}
                                        </p>
                                    </div>
                                )}

                                {/* Map Controls Overlay */}
                                {coords && (
                                    <>
                                        {/* Top-left: Map Style Switcher */}
                                        <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/15 shadow-lg">
                                            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
                                            {(
                                                [
                                                    { id: 'default', label: isDark ? 'Dark' : 'Light' },
                                                    { id: 'streets', label: 'Streets' },
                                                    { id: 'satellite', label: 'Satellite' },
                                                ] as const
                                            ).map((mode) => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => setMapStyleMode(mode.id)}
                                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                                        mapStyleMode === mode.id
                                                            ? 'bg-sky-600 text-white shadow-xs'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                                                    }`}
                                                >
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Bottom-right: Recenter + Google Maps */}
                                        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleRecenter}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/15 shadow-lg transition-colors cursor-pointer"
                                                title="Center map on incident pin"
                                            >
                                                <Navigation className="w-3.5 h-3.5 text-sky-500" />
                                                <span>Re-center</span>
                                            </button>
                                            <a
                                                href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/30 shadow-lg transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Google Maps</span>
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Specific Location & Incident Details */}
                        <div className="lg:col-span-5 p-4 sm:p-5 overflow-y-auto space-y-4 bg-white dark:bg-[#0b1120]">
                            {/* Incident Photo Evidence */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5" />
                                        Incident Photo{incidentPhotos.length > 1 ? `s (${incidentPhotos.length})` : ''}
                                    </span>
                                    {incidentPhotos[0]?.source && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            incidentPhotos[0].source === 'responder_pcr'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        }`}>
                                            {incidentPhotos[0].source === 'responder_pcr' ? 'Responder Scene Photo' : 'Resident Photo'}
                                        </span>
                                    )}
                                </div>

                                {incidentPhotos.length > 0 ? (
                                    <div className="space-y-2">
                                        <div
                                            className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900/50 cursor-pointer"
                                            onClick={() => setPreviewImageUrl(incidentPhotos[0].url)}
                                        >
                                            <img
                                                src={incidentPhotos[0].url}
                                                alt={`Incident #${incident.id} Photo`}
                                                className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-[11px] text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <ExternalLink className="w-3 h-3" />
                                                <span>Click to enlarge</span>
                                            </div>
                                        </div>

                                        {incidentPhotos.length > 1 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {incidentPhotos.slice(1).map((photo, idx) => (
                                                    <img
                                                        key={photo.url}
                                                        src={photo.url}
                                                        alt={`Incident #${incident.id} Photo ${idx + 2}`}
                                                        onClick={() => setPreviewImageUrl(photo.url)}
                                                        className="w-full h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 py-3 px-2.5 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5 text-xs text-slate-400">
                                        <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>No photo evidence attached to this incident.</span>
                                    </div>
                                )}
                            </div>

                            {/* Specific Location Info */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        Specific Location
                                    </span>
                                    {incident.location_source && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                            {String(incident.location_source).replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                        {placeDisplay}
                                    </p>
                                    {barangayName && (
                                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                                            Brgy. {barangayName}, Opol, Misamis Oriental
                                        </p>
                                    )}
                                </div>

                                {locationCodeText && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-white/5">
                                        <span className="text-slate-500 dark:text-slate-400">Location Code:</span>
                                        <span className="font-mono font-semibold">{locationCodeText}</span>
                                    </div>
                                )}

                                {coords && (
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-white/5">
                                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyCoords}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                                        >
                                            {copiedCoords ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                    <span>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copy GPS</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Classification & Timeline */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                    Incident Details
                                </span>

                                <div className="flex flex-wrap gap-1.5">
                                    {categoryLabel && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20">
                                            <Activity className="w-3 h-3" />
                                            <span>{categoryLabel}</span>
                                        </span>
                                    )}
                                    {chiefComplaintLabel && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/20">
                                            <HeartPulse className="w-3 h-3" />
                                            <span>{chiefComplaintLabel}</span>
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/70 dark:border-white/5">
                                    {rawDescription}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>
                                            <span className="text-slate-400">Reported: </span>
                                            {reportedDateObj
                                                ? reportedDateObj.toLocaleString('en-US', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                      hour: 'numeric',
                                                      minute: '2-digit',
                                                  })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    {resolvedDateObj && (
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            <span>
                                                <span className="text-slate-400">Resolved: </span>
                                                {resolvedDateObj.toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reporter & Dispatched Units */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                        <User className="w-3.5 h-3.5" />
                                        <span>Reporter</span>
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                                        {callerName}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>Contact</span>
                                    </span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">
                                        {callerPhone}
                                    </span>
                                </div>

                                {dispatches.length > 0 && (
                                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 space-y-1.5">
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <Truck className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>Dispatched Unit{dispatches.length > 1 ? 's' : ''}</span>
                                        </span>
                                        {dispatches.map((d: any) => (
                                            <div
                                                key={d.id}
                                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 text-[11px]"
                                            >
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {d.ambulance?.plate_number
                                                        ? `Ambulance ${d.ambulance.plate_number}`
                                                        : d.team || `Dispatch #${d.id}`}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400 truncate">
                                                    {d.driver
                                                        ? `${d.driver.first_name} ${d.driver.last_name}`
                                                        : d.dispatch_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {pcrPatients.length > 0 && (
                                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 space-y-1">
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>PCR Patients ({pcrPatients.length})</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pcrPatients.map((name, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/20"
                                                >
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>

                    {/* Fullscreen Photo Lightbox Overlay */}
                    {previewImageUrl && (
                        <div
                            className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            <button
                                type="button"
                                onClick={() => setPreviewImageUrl(null)}
                                className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold border border-white/20 shadow-xl cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                                <span>Close Photo</span>
                            </button>
                            <img
                                src={previewImageUrl}
                                alt="Enlarged Incident Photo"
                                onClick={(e) => e.stopPropagation()}
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/15"
                            />
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
