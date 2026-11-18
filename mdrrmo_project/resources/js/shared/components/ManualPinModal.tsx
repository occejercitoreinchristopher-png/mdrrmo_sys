import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    AlertCircle,
    AlertTriangle,
    Camera,
    CheckCircle2,
    Compass,
    Layers,
    Loader2,
    MapPin,
    Plus,
    Upload,
    X,
} from 'lucide-react';

export interface ModalHotspotPreview {
    cluster_key: string;
    latitude: number;
    longitude: number;
    color: string;
    incident_count: number;
    incident_type?: string;
    most_common_type: string;
    barangay: string;
    location_name: string;
    radius_meters?: number;
    incidents?: Array<{
        id: number;
        incident_type: string;
        is_manual_pin?: boolean;
        latitude: number | null;
        longitude: number | null;
    }>;
}

interface ManualPinModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    userRole: 'admin' | 'dispatcher' | string;
    incidentTypes: Array<{ id: number; incident_type_name: string }>;
    opolBarangays: string[];
    existingHotspots: ModalHotspotPreview[];
    barangayGeojson: any;
    activeFilterSummary: string;
    getTypeColorHex: (typeName: string) => string;
}

const OPOL_DEFAULT = {
    latitude: 8.5142,
    longitude: 124.5731,
    zoom: 13.0,
};

export default function ManualPinModal({
    open,
    onClose,
    onSaved,
    userRole,
    incidentTypes,
    opolBarangays,
    existingHotspots,
    barangayGeojson,
    activeFilterSummary,
    getTypeColorHex,
}: ManualPinModalProps) {
    const mapRef = useRef<MapRef>(null);
    const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastGeocodedRef = useRef<string>('');

    const [typeMode, setTypeMode] = useState<string>('custom');
    const [customType, setCustomType] = useState<string>('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [detectedBarangay, setDetectedBarangay] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [photoFiles, setPhotoFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
    const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset form cleanly whenever modal opens
    useEffect(() => {
        if (!open) return;
        setTypeMode(incidentTypes.length > 0 ? String(incidentTypes[0].id) : 'custom');
        setCustomType('');
        setLatitude('');
        setLongitude('');
        setAddress('');
        setDetectedBarangay('');
        setDescription('');
        setPhotoFiles((prev) => {
            prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return [];
        });
        setErrorMsg(null);
        lastGeocodedRef.current = '';

        const t = setTimeout(() => mapRef.current?.resize(), 200);
        return () => clearTimeout(t);
    }, [open]);

    const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = Math.max(0, 5 - photoFiles.length);
        const accepted = files.slice(0, remainingSlots).filter((f) => {
            if (!f.type.startsWith('image/')) return false;
            if (f.size > 5 * 1024 * 1024) {
                setErrorMsg(`"${f.name}" exceeds the 5MB photo size limit.`);
                return false;
            }
            return true;
        });

        if (accepted.length > 0) {
            const entries = accepted.map((file) => ({
                file,
                previewUrl: URL.createObjectURL(file),
            }));
            setPhotoFiles((prev) => [...prev, ...entries]);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotoFiles((prev) => {
            const target = prev[index];
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((_, idx) => idx !== index);
        });
    };

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSaving) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, isSaving, onClose]);

    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    const hasValidPin =
        latitude.trim() !== '' &&
        longitude.trim() !== '' &&
        !Number.isNaN(parsedLat) &&
        !Number.isNaN(parsedLng) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLng >= -180 &&
        parsedLng <= 180;

    // Haversine distance in meters to detect nearby/overlapping clusters & exact custom hazard duplicates
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

    const proximityCheck = useMemo(() => {
        if (!hasValidPin) return null;

        let nearestSpot: ModalHotspotPreview | null = null;
        let nearestDist = Infinity;

        for (const spot of existingHotspots) {
            const dist = haversineMeters(parsedLat, parsedLng, spot.latitude, spot.longitude);
            if (dist <= 40 && dist < nearestDist) {
                nearestDist = dist;
                nearestSpot = spot;
            }
        }

        // Check if exact same custom hazard manual pin already exists within 20m
        let duplicateCustomPin: { type: string; dist: number; barangay: string } | null = null;
        const normCustom = typeMode === 'custom' ? customType.trim().toLowerCase() : '';
        if (normCustom) {
            for (const spot of existingHotspots) {
                const items = spot.incidents || [];
                for (const item of items) {
                    if (
                        item.is_manual_pin &&
                        item.latitude !== null &&
                        item.longitude !== null &&
                        item.incident_type.trim().toLowerCase() === normCustom
                    ) {
                        const d = haversineMeters(parsedLat, parsedLng, Number(item.latitude), Number(item.longitude));
                        if (d <= 20) {
                            duplicateCustomPin = {
                                type: item.incident_type,
                                dist: Math.round(d),
                                barangay: spot.barangay,
                            };
                            break;
                        }
                    }
                }
                if (duplicateCustomPin) break;
            }
        }

        if (!nearestSpot && !duplicateCustomPin) return null;

        return {
            nearestSpot,
            nearestDistMeters: Math.round(nearestDist),
            duplicateCustomPin,
        };
    }, [hasValidPin, parsedLat, parsedLng, existingHotspots, typeMode, customType]);

    // Detect Opol barangay from text
    const extractBarangay = (text: string): string => {
        if (!text) return '';
        const lower = text.toLowerCase();
        for (const b of opolBarangays) {
            if (lower.includes(b.toLowerCase())) return b;
        }
        if (lower.includes('luyongbon')) return 'Luyongbonbon';
        return '';
    };

    // Mapbox Reverse Geocoding: auto-fill address when latitude & longitude are filled or pin is clicked
    const reverseGeocodeCoords = async (lat: number, lng: number) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (lastGeocodedRef.current === coordKey) return;
        lastGeocodedRef.current = coordKey;

        if (!token) {
            setAddress(`Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            return;
        }

        setIsGeocoding(true);
        try {
            const resp = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(
                    token
                )}&limit=1`
            );
            if (!resp.ok) throw new Error('Geocoding request failed');
            const data = await resp.json();
            const placeName = String(data?.features?.[0]?.place_name || '').trim();
            if (placeName) {
                const trimmed = placeName.slice(0, 255);
                setAddress(trimmed);
                const brgy = extractBarangay(trimmed);
                setDetectedBarangay(brgy);
            } else {
                setAddress(`Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            }
        } catch {
            setAddress(`Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Auto-geocode & pan map when user manually types Latitude and Longitude
    useEffect(() => {
        if (!open || !hasValidPin) return;
        if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);

        reverseTimerRef.current = setTimeout(() => {
            reverseGeocodeCoords(parsedLat, parsedLng);
            mapRef.current?.flyTo({
                center: [parsedLng, parsedLat],
                zoom: Math.max(mapRef.current?.getZoom() || 14, 15),
                duration: 600,
                essential: true,
            });
        }, 450);

        return () => {
            if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
        };
    }, [open, latitude, longitude]);

    // GeoJSON for existing filtered hotspots (radial glows + 20m true-scale perimeter circles)
    const existingGlowGeojson = useMemo(() => {
        return {
            type: 'FeatureCollection' as const,
            features: existingHotspots.map((spot) => ({
                type: 'Feature' as const,
                properties: {
                    color: spot.color,
                    incident_count: spot.incident_count,
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [spot.longitude, spot.latitude],
                },
            })),
        };
    }, [existingHotspots]);

    const existingPerimeterGeojson = useMemo(() => {
        const steps = 40;
        const earthRadius = 6371000;
        return {
            type: 'FeatureCollection' as const,
            features: existingHotspots.map((spot) => {
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
                    properties: { color: spot.color },
                    geometry: { type: 'Polygon' as const, coordinates: [ring] },
                };
            }),
        };
    }, [existingHotspots]);

    // New Pin 20m preview circle on the modal map so user sees if it overlaps/enters an existing circle
    const newPinPerimeterGeojson = useMemo(() => {
        if (!hasValidPin) return null;
        const steps = 40;
        const earthRadius = 6371000;
        const latRad = (parsedLat * Math.PI) / 180;
        const dLat = (20 / earthRadius) * (180 / Math.PI);
        const dLng = ((20 / earthRadius) * (180 / Math.PI)) / Math.cos(latRad);
        const ring: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            ring.push([parsedLng + dLng * Math.cos(angle), parsedLat + dLat * Math.sin(angle)]);
        }
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: { type: 'Polygon' as const, coordinates: [ring] },
                },
            ],
        };
    }, [hasValidPin, parsedLat, parsedLng]);

    const handleMapPick = (lat: number, lng: number) => {
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        setLatitude(latStr);
        setLongitude(lngStr);
        setErrorMsg(null);
        reverseGeocodeCoords(Number(latStr), Number(lngStr));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const isCustom = typeMode === 'custom';
        if (isCustom && !customType.trim()) {
            setErrorMsg('Please enter a custom type (e.g., Landslide Area).');
            return;
        }
        if (proximityCheck?.duplicateCustomPin) {
            setErrorMsg(
                `A manual hazard pin for "${proximityCheck.duplicateCustomPin.type}" already exists ${proximityCheck.duplicateCustomPin.dist}m away. Move the pin or use a different label to avoid duplicating this hazard area.`
            );
            return;
        }
        if (!hasValidPin) {
            setErrorMsg('Please click a location on the map or enter valid Latitude and Longitude.');
            return;
        }
        if (!address.trim()) {
            setErrorMsg('Address is required.');
            return;
        }

        setIsSaving(true);
        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const prefix = userRole === 'admin' ? '/admin' : '/dispatcher';

            const formData = new FormData();
            if (!isCustom) {
                formData.append('incident_type_id', String(Number(typeMode)));
            } else {
                formData.append('custom_pin_type', customType.trim().slice(0, 100));
            }
            formData.append('pin_address', address.trim().slice(0, 255));
            formData.append('pin_latitude', String(Number(parsedLat.toFixed(7))));
            formData.append('pin_longitude', String(Number(parsedLng.toFixed(7))));
            if (description.trim()) {
                formData.append('pin_description', description.trim().slice(0, 255));
            }
            const resolvedBrgy = detectedBarangay || extractBarangay(address);
            if (resolvedBrgy) {
                formData.append('barangay_name', resolvedBrgy);
            }
            photoFiles.forEach((entry) => {
                formData.append('pin_images[]', entry.file);
            });

            const resp = await fetch(`${prefix}/accident-heatmap/manual-pins`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => null);
                const firstErr =
                    errData?.message ||
                    (errData?.errors ? Object.values(errData.errors).flat()[0] : null) ||
                    'Failed to save manual pin.';
                setErrorMsg(String(firstErr));
                return;
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error('Error saving manual pin:', err);
            setErrorMsg('Network error while saving manual pin. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => !isSaving && onClose()}
        >
            <div
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#F61509]/15 border border-[#F61509]/30 flex items-center justify-center text-[#F61509]">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                                Add Manual Heatmap Pin
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Pin a hazard or incident location directly on the map. Existing filtered pins remain visible for reference.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Form (Left) + Synced Interactive Map (Right) */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
                    {/* Left Form Column */}
                    <div className="lg:col-span-5 p-4 sm:p-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 overflow-y-auto">
                        {errorMsg && (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Smart Proximity Warning / Duplicate Hazard Guard Banner */}
                        {proximityCheck?.duplicateCustomPin ? (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-[11px] flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="leading-snug">
                                    <span className="font-bold block">Duplicate Custom Hazard Detected ({proximityCheck.duplicateCustomPin.dist}m away)</span>
                                    <span>
                                        A manual pin for <strong>{proximityCheck.duplicateCustomPin.type}</strong> is already placed here (Brgy. {proximityCheck.duplicateCustomPin.barangay}). Move the pin farther than 20m to avoid duplicates.
                                    </span>
                                </div>
                            </div>
                        ) : proximityCheck?.nearestSpot ? (
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300/80 dark:border-amber-500/35 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="leading-snug">
                                    <span className="font-bold block">
                                        Near Existing Pin ({proximityCheck.nearestDistMeters}m away) &mdash; Will Auto-Combine
                                    </span>
                                    <span>
                                        Within 40m of <strong>{proximityCheck.nearestSpot.most_common_type}</strong> ({proximityCheck.nearestSpot.incident_count}{' '}
                                        {proximityCheck.nearestSpot.incident_count === 1 ? 'record' : 'records'} in Brgy. {proximityCheck.nearestSpot.barangay}). Saving here combines into this circle (new total:{' '}
                                        <strong>{proximityCheck.nearestSpot.incident_count + 1}</strong>). Drag farther (&gt;40m) to create a separate solo pin.
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {/* Emergency Type or Custom Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Emergency / Hazard Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={typeMode}
                                onChange={(e) => setTypeMode(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 cursor-pointer"
                            >
                                {incidentTypes.map((t) => (
                                    <option key={t.id} value={String(t.id)}>
                                        {t.incident_type_name}
                                    </option>
                                ))}
                                <option value="custom">+ Other / Custom Type (e.g., Landslide Area)</option>
                            </select>

                            {typeMode === 'custom' && (
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    placeholder="e.g., Landslide Area, Flood-Prone Zone, Blind Curve..."
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-500/40 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    required
                                />
                            )}
                        </div>

                        {/* Latitude & Longitude */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                    Latitude <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="8.514200"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                    Longitude <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="124.573100"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-2">
                            Click anywhere on the map or type Latitude &amp; Longitude — the Address will auto-fill automatically.
                        </p>

                        {/* Auto-filled Address (max 255 string) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span>Address <span className="text-rose-500">*</span></span>
                                    {isGeocoding && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Detecting...
                                        </span>
                                    )}
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">{address.length}/255</span>
                            </div>
                            <input
                                type="text"
                                maxLength={255}
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    const b = extractBarangay(e.target.value);
                                    if (b) setDetectedBarangay(b);
                                }}
                                placeholder="Auto-filled from map pin or coordinates..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500"
                                required
                            />
                            {detectedBarangay && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Detected Barangay: Brgy. {detectedBarangay}
                                </p>
                            )}
                        </div>

                        {/* Description (max 255 string — NOT text) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Description
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">{description.length}/255</span>
                            </div>
                            <textarea
                                rows={3}
                                maxLength={255}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief notes about this hazard or location (max 255 characters)..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 resize-none"
                            />
                        </div>

                        {/* Optional Photos Upload (Up to 5 Photos, stored in 3NF child table) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Photos (Optional)</span>
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {photoFiles.length}/5
                                </span>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleSelectPhotos}
                                className="hidden"
                            />

                            {photoFiles.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="font-semibold">Upload Photo(s)</span>
                                    <span className="text-[10px] text-slate-400">(JPG, PNG, WEBP • max 5MB)</span>
                                </button>
                            )}

                            {photoFiles.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    {photoFiles.map((entry, idx) => (
                                        <div
                                            key={entry.previewUrl}
                                            className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-950 group"
                                        >
                                            <img
                                                src={entry.previewUrl}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(idx)}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-[#F61509] text-white flex items-center justify-center transition-colors cursor-pointer"
                                                title="Remove photo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit / Cancel Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-white/10">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || Boolean(proximityCheck?.duplicateCustomPin)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F61509] hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-[#F61509]/25 transition-colors cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving Pin...</span>
                                    </>
                                ) : proximityCheck?.nearestSpot && !proximityCheck?.duplicateCustomPin ? (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Save &amp; Combine (+1)</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Save Manual Pin</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Interactive Map Column (Shows existing filtered pins + Click-to-Pin) */}
                    <div className="lg:col-span-7 relative min-h-[380px] lg:min-h-[500px] bg-slate-950">
                        {import.meta.env.VITE_MAPBOX_TOKEN ? (
                            <Map
                                ref={mapRef}
                                initialViewState={OPOL_DEFAULT}
                                style={{ width: '100%', height: '100%' }}
                                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                mapStyle={
                                    mapStyle === 'dark'
                                        ? 'mapbox://styles/mapbox/dark-v11'
                                        : 'mapbox://styles/mapbox/satellite-streets-v12'
                                }
                                attributionControl={false}
                                cursor="crosshair"
                                onClick={(e) => handleMapPick(e.lngLat.lat, e.lngLat.lng)}
                            >
                                {/* Opol Barangay Boundaries */}
                                {barangayGeojson && (
                                    <Source id="modal-opol-boundaries" type="geojson" data={barangayGeojson}>
                                        <Layer
                                            id="modal-opol-boundary-lines"
                                            type="line"
                                            paint={{
                                                'line-color': '#64748b',
                                                'line-width': 1,
                                                'line-opacity': 0.4,
                                                'line-dasharray': [3, 2],
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Existing Filtered Hotspots Radial Glows + 20m Perimeters */}
                                <Source id="modal-existing-glow" type="geojson" data={existingGlowGeojson}>
                                    <Layer
                                        id="modal-existing-glow-layer"
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
                                            ],
                                            'circle-color': ['get', 'color'],
                                            'circle-opacity': 0.34,
                                            'circle-blur': 0.7,
                                        }}
                                    />
                                </Source>

                                <Source id="modal-existing-perimeters" type="geojson" data={existingPerimeterGeojson}>
                                    <Layer
                                        id="modal-existing-perim-line"
                                        type="line"
                                        minzoom={14.5}
                                        paint={{
                                            'line-color': ['get', 'color'],
                                            'line-width': 1.5,
                                            'line-opacity': 0.7,
                                            'line-dasharray': [3, 2],
                                        }}
                                    />
                                </Source>

                                {/* New Pin 20m Preview Ring */}
                                {newPinPerimeterGeojson && (
                                    <Source id="modal-new-pin-ring" type="geojson" data={newPinPerimeterGeojson}>
                                        <Layer
                                            id="modal-new-pin-ring-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': '#F61509',
                                                'fill-opacity': 0.16,
                                            }}
                                        />
                                        <Layer
                                            id="modal-new-pin-ring-line"
                                            type="line"
                                            paint={{
                                                'line-color': '#F61509',
                                                'line-width': 2,
                                                'line-dasharray': [2, 2],
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Existing Filtered Pins (Synced with Heatmap Filters) */}
                                {existingHotspots.map((spot, idx) => {
                                    const hex = getTypeColorHex(spot.incident_type || spot.most_common_type);
                                    const isCombined = spot.incident_count > 1;
                                    return (
                                        <Marker
                                            key={`modal-existing-${spot.cluster_key}-${idx}`}
                                            longitude={spot.longitude}
                                            latitude={spot.latitude}
                                            anchor="bottom"
                                        >
                                            <div
                                                className="pointer-events-none opacity-85"
                                                title={`${spot.most_common_type} (${spot.incident_count}) — Brgy. ${spot.barangay}`}
                                            >
                                                <svg
                                                    width={isCombined ? 24 : 20}
                                                    height={isCombined ? 32 : 26}
                                                    viewBox="0 0 24 32"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                        fill={hex}
                                                        stroke="#FFFFFF"
                                                        strokeWidth="2"
                                                    />
                                                    {isCombined ? (
                                                        <>
                                                            <circle cx="12" cy="11.5" r="7" fill="#0f172a" />
                                                            <text
                                                                x="12"
                                                                y="14.7"
                                                                textAnchor="middle"
                                                                fill="#FFFFFF"
                                                                fontSize="9"
                                                                fontWeight="800"
                                                            >
                                                                {spot.incident_count}
                                                            </text>
                                                        </>
                                                    ) : (
                                                        <circle cx="12" cy="11.5" r="4" fill="#FFFFFF" />
                                                    )}
                                                </svg>
                                            </div>
                                        </Marker>
                                    );
                                })}

                                {/* New Manual Pin Marker (Draggable!) */}
                                {hasValidPin && (
                                    <Marker
                                        longitude={parsedLng}
                                        latitude={parsedLat}
                                        anchor="bottom"
                                        draggable
                                        onDragEnd={(e) => handleMapPick(e.lngLat.lat, e.lngLat.lng)}
                                    >
                                        <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
                                            <span className="mb-1 px-2 py-0.5 rounded-full bg-[#F61509] text-white text-[10px] font-bold shadow-lg whitespace-nowrap border border-white/40">
                                                New Pin
                                            </span>
                                            <svg width="32" height="42" viewBox="0 0 24 32" fill="none" className="drop-shadow-xl">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill="#F61509"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="2.2"
                                                />
                                                <circle cx="12" cy="11.5" r="4.5" fill="#FFFFFF" />
                                            </svg>
                                        </div>
                                    </Marker>
                                )}
                            </Map>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-6">
                                Mapbox token not configured.
                            </div>
                        )}

                        {/* Top-Left Synced Filter Info Pill */}
                        <div className="absolute top-3 left-3 z-10 max-w-[78%] px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 backdrop-blur-md text-[11px] text-slate-100 shadow-lg space-y-0.5">
                            <div className="font-bold flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#F61509] shrink-0" />
                                <span>Click on map to drop pin ({existingHotspots.length} existing pins shown)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                                Synced filter: {activeFilterSummary}
                            </div>
                        </div>

                        {/* Top-Right Map Style & Reset Controls */}
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                            <button
                                type="button"
                                onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-100 text-[11px] font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                                title="Switch Map Style"
                            >
                                <Layers className="w-3.5 h-3.5 text-rose-400" />
                                <span>{mapStyle === 'dark' ? 'Satellite' : 'Dark'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    mapRef.current?.flyTo({
                                        center: [OPOL_DEFAULT.longitude, OPOL_DEFAULT.latitude],
                                        zoom: OPOL_DEFAULT.zoom,
                                        duration: 700,
                                    })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 shadow-md cursor-pointer"
                                title="Reset to Opol"
                            >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Opol</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
