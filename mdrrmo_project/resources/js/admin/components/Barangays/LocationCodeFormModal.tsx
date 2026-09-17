import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, LocateFixed, AlertCircle, X, HelpCircle, Sparkles, RefreshCw, Wand2, Compass, Check } from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Select from '@/shared/components/Select';
import Textarea from '@/shared/components/Textarea';
import { useAppearance } from '@/shared/contexts/ThemeContext';

export const LOCATION_TYPES = [
    'Post / Streetlight',
    'Bridge',
    'Landmark',
    'Road',
    'Barangay Hall',
    'Evacuation Center',
    'School',
    'Health Facility',
    'Other Emergency Location',
] as const;

export const BARANGAY_CENTERS: Record<string, { lat: number; lng: number }> = {
    'Awang': { lat: 8.44112, lng: 124.51234 },
    'Bagocboc': { lat: 8.419848, lng: 124.502216 },
    'Barra': { lat: 8.5135, lng: 124.5930 },
    'Bonbon': { lat: 8.5195, lng: 124.5660 },
    'Cauyonan': { lat: 8.4280, lng: 124.5200 },
    'Igpit': { lat: 8.5185, lng: 124.5840 },
    'Limonda': { lat: 8.3950, lng: 124.5050 },
    'Luyongbonbon': { lat: 8.5320, lng: 124.5580 },
    'Luyong Bonbon': { lat: 8.5320, lng: 124.5580 },
    'Malanang': { lat: 8.5020, lng: 124.5630 },
    'Nangcaon': { lat: 8.4720, lng: 124.5450 },
    'Patag': { lat: 8.4850, lng: 124.5540 },
    'Poblacion': { lat: 8.5215, lng: 124.5720 },
    'Taboc': { lat: 8.5230, lng: 124.5790 },
    'Tingalan': { lat: 8.4150, lng: 124.5120 },
};

export const BARANGAY_PREFIXES: Record<string, string> = {
    'Awang': 'AWG',
    'Bagocboc': 'BGC',
    'Barra': 'BAR',
    'Bonbon': 'BNB',
    'Cauyonan': 'CYN',
    'Igpit': 'IGP',
    'Limonda': 'LMD',
    'Luyongbonbon': 'LBB',
    'Luyong Bonbon': 'LBB',
    'Malanang': 'MLN',
    'Nangcaon': 'NC',
    'Patag': 'PTG',
    'Poblacion': 'POB',
    'Taboc': 'TBC',
    'Tingalan': 'TNG',
};

export const TYPE_PREFIXES: Record<string, string> = {
    'Post / Streetlight': 'POLE',
    'Bridge': 'BRG',
    'Landmark': 'LMK',
    'Road': 'RD',
    'Barangay Hall': 'BGY',
    'Evacuation Center': 'EVAC',
    'School': 'SCH',
    'Health Facility': 'HLT',
    'Other Emergency Location': 'EMG',
};

export function getBarangayPrefix(name?: string): string {
    if (!name) return 'LOC';
    if (BARANGAY_PREFIXES[name]) return BARANGAY_PREFIXES[name];
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.slice(0, 3) || 'LOC';
}

export function getTypePrefix(type?: string): string {
    if (!type) return 'LOC';
    return TYPE_PREFIXES[type] || 'LOC';
}

export function generateNextLocationCode(
    barangayName: string,
    locationType: string,
    existingCodes: Array<{ location_code?: string; [key: string]: any } | string> = []
): { code: string; seqNumber: number } {
    const bgyPrefix = getBarangayPrefix(barangayName);
    const typePrefix = getTypePrefix(locationType);
    const prefix = `${typePrefix}-${bgyPrefix}-`;

    const numbers: number[] = [];
    existingCodes.forEach((item) => {
        const str = typeof item === 'string' ? item : item?.location_code;
        if (!str) return;
        const upper = str.toUpperCase().trim();
        if (upper.startsWith(prefix)) {
            const remainder = upper.slice(prefix.length);
            const numPart = remainder.match(/^\d+/);
            if (numPart) {
                numbers.push(parseInt(numPart[0], 10));
            }
        }
    });

    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return {
        code: `${prefix}${formattedNum}`,
        seqNumber: nextNum,
    };
}

export function generateDefaultLocationName(
    barangayName: string,
    locationType: string,
    seqNumber: number = 1
): string {
    const formattedNum = String(seqNumber).padStart(2, '0');
    const bgy = barangayName || 'Barangay';
    switch (locationType) {
        case 'Post / Streetlight':
            return `${bgy} Streetlight Pole ${formattedNum}`;
        case 'Barangay Hall':
            return `${bgy} Barangay Hall`;
        case 'Evacuation Center':
            return `${bgy} Evacuation Center`;
        case 'Health Facility':
            return `${bgy} Barangay Health Station`;
        case 'School':
            return `${bgy} Public School`;
        case 'Bridge':
            return `${bgy} Bridge`;
        case 'Road':
            return `${bgy} Main Road Access`;
        case 'Landmark':
            return `${bgy} Landmark Point`;
        case 'Other Emergency Location':
            return `${bgy} Emergency Marker ${formattedNum}`;
        default:
            return `${bgy} ${locationType} ${formattedNum}`;
    }
}

const DEFAULT_CENTER = { lat: 8.5222, lng: 124.5715 };

interface LocationCodeFormModalProps {
    open: boolean;
    onClose: () => void;
    barangay: { 
        id: number; 
        name: string;
        location_codes?: Array<{ location_code?: string; [key: string]: any }>;
    };
    locationCode?: any | null;
    onSubmit: (formData: any) => void;
    loading?: boolean;
    errors?: Record<string, string>;
}

export default function LocationCodeFormModal({
    open,
    onClose,
    barangay,
    locationCode = null,
    onSubmit,
    loading = false,
    errors = {},
}: LocationCodeFormModalProps) {
    const { theme } = useAppearance();
    const isEdit = Boolean(locationCode);

    // Determine initial center
    const bCenter = BARANGAY_CENTERS[barangay?.name] ?? DEFAULT_CENTER;

    const [code, setCode] = useState('');
    const [type, setType] = useState<string>('Post / Streetlight');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');

    // Tracks if admin manually changed the inputs so we don't clobber custom typed text
    const [hasUserEditedCode, setHasUserEditedCode] = useState(false);
    const [hasUserEditedName, setHasUserEditedName] = useState(false);
    const [mapDetectedName, setMapDetectedName] = useState<string | null>(null);

    const [viewState, setViewState] = useState({
        latitude: bCenter.lat,
        longitude: bCenter.lng,
        zoom: 15,
    });

    const mapRef = useRef<any>(null);

    // Reverse geocode coordinates to find street or POI name
    const fetchReverseGeocode = useCallback(async (lng: number, lat: number) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!token) return;
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=poi,address,neighborhood,locality`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    const feature = data.features.find((f: any) => 
                        f.place_type?.includes('poi') || f.place_type?.includes('address')
                    ) || data.features[0];
                    const clean = feature.text || feature.place_name?.split(',')[0];
                    if (clean) {
                        setMapDetectedName(clean.trim());
                    }
                }
            }
        } catch {
            // Silently skip if network or rate limit fails
        }
    }, []);

    // Sync form state when modal opens or locationCode changes
    useEffect(() => {
        if (open) {
            setMapDetectedName(null);
            if (locationCode) {
                setCode(locationCode.location_code ?? '');
                setType(locationCode.location_type ?? 'Post / Streetlight');
                setName(locationCode.location_name ?? '');
                setDescription(locationCode.description ?? '');
                setLatitude(locationCode.latitude != null ? String(locationCode.latitude) : '');
                setLongitude(locationCode.longitude != null ? String(locationCode.longitude) : '');
                setHasUserEditedCode(true);
                setHasUserEditedName(true);

                const lat = Number(locationCode.latitude);
                const lng = Number(locationCode.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    setViewState({ latitude: lat, longitude: lng, zoom: 16 });
                }
            } else {
                const defaultType = 'Post / Streetlight';
                const { code: autoCode, seqNumber } = generateNextLocationCode(
                    barangay?.name ?? '',
                    defaultType,
                    barangay?.location_codes ?? []
                );
                const autoName = generateDefaultLocationName(barangay?.name ?? '', defaultType, seqNumber);
                const autoDesc = `Emergency reference marker in Barangay ${barangay?.name ?? ''}, Opol.`;

                setCode(autoCode);
                setType(defaultType);
                setName(autoName);
                setDescription(autoDesc);
                setHasUserEditedCode(false);
                setHasUserEditedName(false);

                setLatitude(String(bCenter.lat));
                setLongitude(String(bCenter.lng));
                setViewState({ latitude: bCenter.lat, longitude: bCenter.lng, zoom: 15 });

                // Try to detect nearby road / landmark from initial center
                fetchReverseGeocode(bCenter.lng, bCenter.lat);
            }
        }
    }, [open, locationCode, barangay, bCenter, fetchReverseGeocode]);

    // Handle Location Type change: automatically updates Code and Name if user hasn't typed custom values
    const handleTypeChange = (newType: string) => {
        setType(newType);
        if (!isEdit) {
            const { code: autoCode, seqNumber } = generateNextLocationCode(
                barangay?.name ?? '',
                newType,
                barangay?.location_codes ?? []
            );
            if (!hasUserEditedCode) {
                setCode(autoCode);
            }
            if (!hasUserEditedName) {
                setName(generateDefaultLocationName(barangay?.name ?? '', newType, seqNumber));
            }
        }
    };

    // Manual triggers to auto-generate code or name
    const handleAutoGenerateCode = () => {
        const { code: autoCode } = generateNextLocationCode(
            barangay?.name ?? '',
            type,
            barangay?.location_codes ?? []
        );
        setCode(autoCode);
        setHasUserEditedCode(false);
    };

    const handleAutoSuggestName = () => {
        const { seqNumber } = generateNextLocationCode(
            barangay?.name ?? '',
            type,
            barangay?.location_codes ?? []
        );
        setName(generateDefaultLocationName(barangay?.name ?? '', type, seqNumber));
        setHasUserEditedName(false);
    };

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);
    const hasValidCoords = !isNaN(numLat) && !isNaN(numLng) && numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180;

    // Handle manual coordinate changes
    const handleLatitudeChange = (val: string) => {
        setLatitude(val);
        const lat = parseFloat(val);
        if (!isNaN(lat) && lat >= -90 && lat <= 90 && hasValidCoords) {
            if (mapRef.current) {
                mapRef.current.flyTo({ center: [numLng, lat], duration: 500 });
            }
            fetchReverseGeocode(numLng, lat);
        }
    };

    const handleLongitudeChange = (val: string) => {
        setLongitude(val);
        const lng = parseFloat(val);
        if (!isNaN(lng) && lng >= -180 && lng <= 180 && hasValidCoords) {
            if (mapRef.current) {
                mapRef.current.flyTo({ center: [lng, numLat], duration: 500 });
            }
            fetchReverseGeocode(lng, numLat);
        }
    };

    // Click on map to pick location
    const handleMapClick = (e: any) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;
        setLatitude(lat.toFixed(7));
        setLongitude(lng.toFixed(7));
        fetchReverseGeocode(lng, lat);
    };

    // Drag marker to adjust
    const handleMarkerDragEnd = (e: any) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;
        setLatitude(lat.toFixed(7));
        setLongitude(lng.toFixed(7));
        fetchReverseGeocode(lng, lat);
    };

    const handleCenterOnBarangay = () => {
        setLatitude(bCenter.lat.toFixed(7));
        setLongitude(bCenter.lng.toFixed(7));
        if (mapRef.current) {
            mapRef.current.flyTo({ center: [bCenter.lng, bCenter.lat], zoom: 15, duration: 800 });
        }
        fetchReverseGeocode(bCenter.lng, bCenter.lat);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            location_code: code.trim().toUpperCase(),
            location_type: type,
            location_name: name.trim(),
            description: description.trim() || null,
            latitude: numLat,
            longitude: numLng,
            barangay_id: barangay.id,
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Location Code' : 'Add Location Code'}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header context badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Barangay:
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {barangay?.name}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Code Prefix: {getBarangayPrefix(barangay?.name)}
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Official 14 Opol Barangays
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column: Form Inputs */}
                    <div className="lg:col-span-6 space-y-3.5">
                        {/* Location Type (Top field so changing it auto-fills code & name) */}
                        <div>
                            <Select
                                label="Location Type"
                                id="location_type"
                                value={type}
                                onChange={handleTypeChange}
                                error={errors.location_type}
                                options={LOCATION_TYPES.map((t) => ({ label: t, value: t }))}
                                required
                            />
                        </div>

                        {/* Location Code Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="location_code" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Location Code <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAutoGenerateCode}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                    title="Auto-calculate next sequential code based on Barangay and Type"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Auto-generate
                                </button>
                            </div>
                            <Input
                                id="location_code"
                                placeholder="e.g. POLE-AWG-001, BRG-LBB-002"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setHasUserEditedCode(true);
                                }}
                                error={errors.location_code}
                                required
                                className="font-mono uppercase tracking-wider font-semibold"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Auto-generated code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getTypePrefix(type)}-{getBarangayPrefix(barangay?.name)}-###</span>
                            </p>
                        </div>

                        {/* Location Name */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="location_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Location Name <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAutoSuggestName}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                    title="Reset to smart auto-generated location name"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Auto-suggest
                                </button>
                            </div>
                            <Input
                                id="location_name"
                                placeholder="e.g. Awang Streetlight Pole 01"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setHasUserEditedName(true);
                                }}
                                error={errors.location_name}
                                required
                            />

                            {/* Map Reverse-Geocoded helper pill */}
                            {mapDetectedName && (
                                <div className="mt-1.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span className="truncate">
                                            Detected near pin: <strong className="font-semibold text-slate-800 dark:text-slate-200">{mapDetectedName}</strong>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setName(`${barangay?.name} - ${mapDetectedName}`);
                                            setHasUserEditedName(true);
                                        }}
                                        className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                        title="Use this detected road or landmark as the location name"
                                    >
                                        Use Name
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <Textarea
                                label="Description (Optional)"
                                id="description"
                                placeholder="e.g. Near the main road junction and street lighting outpost"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Coordinate manual inputs */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <Input
                                    label="Latitude"
                                    id="latitude"
                                    placeholder="8.XXXXXXX"
                                    value={latitude}
                                    onChange={(e) => handleLatitudeChange(e.target.value)}
                                    error={errors.latitude}
                                    required
                                    className="font-mono text-xs"
                                />
                            </div>
                            <div>
                                <Input
                                    label="Longitude"
                                    id="longitude"
                                    placeholder="124.XXXXXXX"
                                    value={longitude}
                                    onChange={(e) => handleLongitudeChange(e.target.value)}
                                    error={errors.longitude}
                                    required
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>

                        {(!hasValidCoords && (latitude || longitude)) && (
                            <div className="p-2 text-xs text-rose-500 flex items-center gap-1.5 bg-rose-500/10 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Please enter valid coordinates or click a point on the map.</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Map Preview & Pick on Map */}
                    <div className="lg:col-span-6 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-primary" />
                                Map Preview & Pick on Map
                            </label>
                            <button
                                type="button"
                                onClick={handleCenterOnBarangay}
                                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                            >
                                Reset to Barangay Center
                            </button>
                        </div>

                        <div className="flex-1 min-h-[300px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 relative shadow-inner">
                            <style>{`
                                .mapboxgl-ctrl-logo { display: none !important; }
                                .mapboxgl-ctrl-attrib { display: none !important; }
                            `}</style>

                            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                                <Map
                                    ref={mapRef}
                                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                    {...viewState}
                                    onMove={(evt) => setViewState(evt.viewState)}
                                    onClick={handleMapClick}
                                    mapStyle={theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'}
                                    cursor="crosshair"
                                    attributionControl={false}
                                >
                                    {hasValidCoords && (
                                        <Marker
                                            longitude={numLng}
                                            latitude={numLat}
                                            anchor="bottom"
                                            draggable
                                            onDragEnd={handleMarkerDragEnd}
                                        >
                                            <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
                                                <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-primary/40 mb-1 flex items-center gap-1 backdrop-blur-sm whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                                    <span>{code || name || 'Location Marker'}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-xl ring-4 ring-primary/30">
                                                    <MapPin className="w-4 h-4 fill-white text-primary" />
                                                </div>
                                            </div>
                                        </Marker>
                                    )}
                                </Map>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 p-4 text-center">
                                    Mapbox token missing in configuration.
                                </div>
                            )}

                            {/* Floating hint */}
                            <div className="absolute top-2 left-2 pointer-events-none">
                                <span className="text-[10px] font-medium bg-slate-900/80 text-slate-200 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm shadow">
                                    📍 Click map to pick point or drag marker
                                </span>
                            </div>

                            {/* Coordinate readout */}
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                <span className="font-mono text-[10px] bg-slate-950/85 text-slate-300 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-sm">
                                    {hasValidCoords ? `${numLat.toFixed(6)}, ${numLng.toFixed(6)}` : 'No coordinates selected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="admin" loading={loading} disabled={!hasValidCoords || !code.trim() || !name.trim()}>
                        {isEdit ? 'Update Location Code' : 'Save Location Code'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
