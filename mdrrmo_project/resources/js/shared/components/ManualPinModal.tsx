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
    MousePointerClick,
    Plus,
    Redo2,
    RotateCcw,
    Shapes,
    Trash2,
    Undo2,
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
    onSaved: (newPin?: any) => void;
    userRole: 'admin' | 'dispatcher' | string;
    incidentTypes: Array<{ id: number; incident_type_name: string }>;
    opolBarangays: string[];
    existingHotspots: ModalHotspotPreview[];
    existingPronePolygons?: any;
    barangayGeojson: any;
    activeFilterSummary: string;
    getTypeColorHex: (typeName: string) => string;
    initialCenter?: { latitude: number; longitude: number; zoom: number };
    initialMapStyleUrl?: string;
}

const OPOL_DEFAULT = {
    latitude: 8.5142,
    longitude: 124.5731,
    zoom: 13.0,
};

export const RISK_LEVELS = [
    { label: 'High', color: '#E53935', bg: 'bg-[#E53935]', text: 'text-red-400', border: 'border-red-500' },
    { label: 'Moderate-High', color: '#FB8C00', bg: 'bg-[#FB8C00]', text: 'text-orange-400', border: 'border-orange-500' },
    { label: 'Moderate', color: '#FDD835', bg: 'bg-[#FDD835]', text: 'text-yellow-300', border: 'border-yellow-400' },
    { label: 'Low', color: '#43A047', bg: 'bg-[#43A047]', text: 'text-emerald-400', border: 'border-emerald-500' },
] as const;

export const getRiskColorHex = (level?: string | null): string => {
    const l = (level || '').toLowerCase();
    if (l.includes('high') && !l.includes('mod')) return '#EF4444';
    if (l.includes('mod-high') || l.includes('moderate-high')) return '#F97316';
    if (l.includes('mod')) return '#FACC15';
    if (l.includes('low')) return '#3B82F6';
    return '#FACC15';
};

// Simple Ray-Casting algorithm to check if a point [lng, lat] is inside a polygon ring
function isPointInRing(point: [number, number], ring: number[][]): boolean {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

export default function ManualPinModal({
    open,
    onClose,
    onSaved,
    userRole,
    incidentTypes,
    opolBarangays,
    existingHotspots,
    existingPronePolygons,
    barangayGeojson,
    activeFilterSummary,
    getTypeColorHex,
    initialCenter,
    initialMapStyleUrl,
}: ManualPinModalProps) {
    const mapRef = useRef<MapRef>(null);
    const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastGeocodedRef = useRef<string>('');

    // Sync camera to user's current view on main heatmap when modal opens
    useEffect(() => {
        if (!open) return;
        const target = initialCenter || OPOL_DEFAULT;
        const syncCamera = () => {
            if (mapRef.current) {
                try {
                    mapRef.current.resize();
                    mapRef.current.jumpTo({
                        center: [target.longitude, target.latitude],
                        zoom: target.zoom || 14.5,
                    });
                } catch {
                    // map may not be initialized yet
                }
            }
        };

        syncCamera();
        const t1 = setTimeout(syncCamera, 60);
        const t2 = setTimeout(syncCamera, 200);
        const t3 = setTimeout(syncCamera, 500);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [open, initialCenter]);

    // GeoJSON for existing hotspot 20m circle glows for visual reference
    const existingHotspotsGeojson = useMemo(() => {
        if (!existingHotspots || existingHotspots.length === 0) return null;
        const steps = 36;
        const earthRadius = 6371000;
        const features = existingHotspots.map((spot) => {
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
            const clusterType = spot.incident_type || spot.most_common_type || 'Incident';
            const pinColor = spot.color || getTypeColorHex(clusterType) || '#3B82F6';
            return {
                type: 'Feature' as const,
                properties: {
                    color: pinColor,
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
    }, [existingHotspots, getTypeColorHex]);

    // INPUT MODE: MODE A (POINT) or MODE B (POLYGON)
    const [inputMode, setInputMode] = useState<'POINT' | 'POLYGON'>('POINT');

    // Common fields
    const [areaName, setAreaName] = useState<string>('');
    const [riskLevel, setRiskLevel] = useState<string>('Moderate');
    const [typeMode, setTypeMode] = useState<string>('');
    const [customType, setCustomType] = useState<string>('');
    const [detectedBarangay, setDetectedBarangay] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [photoFiles, setPhotoFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
    const [mapStyleUrl, setMapStyleUrl] = useState<string>(
        initialMapStyleUrl || 'mapbox://styles/mapbox/dark-v11'
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && initialMapStyleUrl) {
            setMapStyleUrl(initialMapStyleUrl);
        }
    }, [open, initialMapStyleUrl]);

    // Mode A: Point specific
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Mode B: Polygon specific
    const [polygonVertices, setPolygonVertices] = useState<Array<[number, number]>>([]); // [lng, lat][]
    const [redoStack, setRedoStack] = useState<Array<[number, number]>>([]);
    const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);
    const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const currentRiskColor = getRiskColorHex(riskLevel);

    // Reset form cleanly whenever modal opens
    useEffect(() => {
        if (!open) return;
        setInputMode('POINT');
        setAreaName('');
        setRiskLevel('Moderate');
        setTypeMode('');
        setCustomType('');
        setLatitude('');
        setLongitude('');
        setAddress('');
        setDetectedBarangay('');
        setDescription('');
        setPolygonVertices([]);
        setRedoStack([]);
        setIsPolygonClosed(false);
        setSelectedVertexIdx(null);
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

    // Auto-detect barangay from polygon coordinates using GeoJSON boundaries
    const detectBarangayFromCoordinates = (coords: Array<[number, number]>): string => {
        if (!barangayGeojson || !barangayGeojson.features || coords.length === 0) return '';
        // Calculate centroid of coordinates
        let sumLng = 0;
        let sumLat = 0;
        coords.forEach(([lng, lat]) => {
            sumLng += lng;
            sumLat += lat;
        });
        const centroid: [number, number] = [sumLng / coords.length, sumLat / coords.length];

        const matchFeatureName = (feat: any): string | null => {
            const rawName = String(feat.properties?.name || feat.properties?.barangay_name || feat.properties?.BARANGAY || '').trim();
            if (!rawName) return null;
            const clean = rawName.toLowerCase().replace(/[\s-]/g, '');
            if (clean.includes('luyongbon')) return 'Luyongbonbon';
            for (const b of opolBarangays) {
                if (b.toLowerCase().replace(/[\s-]/g, '') === clean) return b;
            }
            return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        };

        for (const feat of barangayGeojson.features) {
            const geom = feat.geometry;
            if (geom.type === 'Polygon') {
                for (const ring of geom.coordinates) {
                    if (isPointInRing(centroid, ring)) {
                        const matched = matchFeatureName(feat);
                        if (matched) return matched;
                    }
                }
            } else if (geom.type === 'MultiPolygon') {
                for (const poly of geom.coordinates) {
                    for (const ring of poly) {
                        if (isPointInRing(centroid, ring)) {
                            const matched = matchFeatureName(feat);
                            if (matched) return matched;
                        }
                    }
                }
            }
        }
        return '';
    };

    // Mode A: Reverse Geocode
    const reverseGeocodeCoords = async (lat: number, lng: number) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (lastGeocodedRef.current === coordKey) return;
        lastGeocodedRef.current = coordKey;

        // Immediate spatial detection from official Opol GeoJSON boundary
        const coordBrgy = detectBarangayFromCoordinates([[lng, lat]]);
        if (coordBrgy) {
            setDetectedBarangay(coordBrgy);
        }

        if (!token) {
            setAddress(coordBrgy ? `Brgy. ${coordBrgy}, Opol, Misamis Oriental` : `Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
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
                const brgy = extractBarangay(trimmed) || coordBrgy;
                if (brgy) setDetectedBarangay(brgy);
            } else {
                setAddress(coordBrgy ? `Brgy. ${coordBrgy}, Opol, Misamis Oriental` : `Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            }
        } catch {
            if (coordBrgy) setDetectedBarangay(coordBrgy);
            setAddress(coordBrgy ? `Brgy. ${coordBrgy}, Opol, Misamis Oriental` : `Opol, Misamis Oriental (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Mode A: Auto-geocode & pan map when user manually types Latitude and Longitude
    useEffect(() => {
        if (!open || inputMode !== 'POINT' || !hasValidPin) return;
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
    }, [open, inputMode, latitude, longitude]);

    // Mode B: Centroid and automatic barangay detection on vertices change
    useEffect(() => {
        if (inputMode !== 'POLYGON' || polygonVertices.length === 0) return;
        const brgy = detectBarangayFromCoordinates(polygonVertices);
        if (brgy) setDetectedBarangay(brgy);
    }, [inputMode, polygonVertices]);

    // Mode B Polygon Drawing Handlers
    const handleAddPolygonVertex = (lng: number, lat: number) => {
        if (isPolygonClosed) return;

        // If clicking near the first vertex (threshold) and has >= 3 vertices, close the polygon
        if (polygonVertices.length >= 3) {
            const [firstLng, firstLat] = polygonVertices[0];
            const distDeg = Math.hypot(lng - firstLng, lat - firstLat);
            // Approx 30 meters threshold in degrees (~0.0003)
            if (distDeg < 0.00035) {
                setIsPolygonClosed(true);
                return;
            }
        }

        const newPoint: [number, number] = [Number(lng.toFixed(7)), Number(lat.toFixed(7))];
        setPolygonVertices((prev) => [...prev, newPoint]);
        setRedoStack([]);
        setSelectedVertexIdx(null);
        setErrorMsg(null);
    };

    const handleUndoVertex = () => {
        if (polygonVertices.length === 0) return;
        const last = polygonVertices[polygonVertices.length - 1];
        setPolygonVertices((prev) => prev.slice(0, prev.length - 1));
        setRedoStack((prev) => [...prev, last]);
        setIsPolygonClosed(false);
    };

    const handleRedoVertex = () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setRedoStack((prev) => prev.slice(0, prev.length - 1));
        setPolygonVertices((prev) => [...prev, next]);
    };

    const handleDeleteVertex = (idx: number) => {
        setPolygonVertices((prev) => prev.filter((_, i) => i !== idx));
        setSelectedVertexIdx(null);
        setIsPolygonClosed(false);
    };

    const handleDragVertex = (idx: number, lat: number, lng: number) => {
        setPolygonVertices((prev) => {
            const copy = [...prev];
            copy[idx] = [Number(lng.toFixed(7)), Number(lat.toFixed(7))];
            return copy;
        });
    };

    const handleFinishPolygon = () => {
        if (polygonVertices.length < 3) {
            setErrorMsg('A polygon area must have at least 3 distinct boundary vertices.');
            return;
        }
        setIsPolygonClosed(true);
        setErrorMsg(null);
    };

    const handleResetPolygon = () => {
        setPolygonVertices([]);
        setRedoStack([]);
        setIsPolygonClosed(false);
        setSelectedVertexIdx(null);
    };

    // Mode B: GeoJSON for real-time drawing (LineString while drawing, Polygon when completed/preview)
    const activeDrawingLineGeojson = useMemo(() => {
        if (inputMode !== 'POLYGON' || polygonVertices.length < 2) return null;
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: polygonVertices,
                    },
                },
            ],
        };
    }, [inputMode, polygonVertices]);

    const activeDrawingPolygonGeojson = useMemo(() => {
        if (inputMode !== 'POLYGON' || polygonVertices.length < 3) return null;
        const ring = [...polygonVertices];
        // Ensure closed ring for valid GeoJSON polygon
        if (
            ring[0][0] !== ring[ring.length - 1][0] ||
            ring[0][1] !== ring[ring.length - 1][1]
        ) {
            ring.push(ring[0]);
        }
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    properties: {
                        color: getRiskColorHex(riskLevel),
                    },
                    geometry: {
                        type: 'Polygon' as const,
                        coordinates: [ring],
                    },
                },
            ],
        };
    }, [inputMode, polygonVertices, riskLevel]);

    // MODE A: Real-time 20-meter cluster circle preview underneath active pin
    const activePinClusterGeojson = useMemo(() => {
        if (inputMode !== 'POINT' || !hasValidPin) return null;
        const steps = 48;
        const radiusM = 20.0;
        const earthRadius = 6371000;
        const latRad = (parsedLat * Math.PI) / 180;
        const dLat = (radiusM / earthRadius) * (180 / Math.PI);
        const dLng = ((radiusM / earthRadius) * (180 / Math.PI)) / Math.cos(latRad);
        const ring: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            ring.push([
                parsedLng + dLng * Math.cos(angle),
                parsedLat + dLat * Math.sin(angle),
            ]);
        }
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    properties: {
                        color: currentRiskColor,
                    },
                    geometry: {
                        type: 'Polygon' as const,
                        coordinates: [ring],
                    },
                },
            ],
        };
    }, [inputMode, hasValidPin, parsedLat, parsedLng, currentRiskColor]);

    // Handle Map click depending on current mode
    const handleMapClick = (lat: number, lng: number) => {
        if (inputMode === 'POINT') {
            const latStr = lat.toFixed(6);
            const lngStr = lng.toFixed(6);
            setLatitude(latStr);
            setLongitude(lngStr);
            setErrorMsg(null);
            reverseGeocodeCoords(Number(latStr), Number(lngStr));
        } else {
            handleAddPolygonVertex(lng, lat);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!typeMode) {
            setErrorMsg('Please select an Incident / Hazard Type.');
            return;
        }

        const isCustom = typeMode === 'custom';
        if (isCustom && !customType.trim()) {
            setErrorMsg('Please enter an Incident / Hazard Type (e.g., Landslide Area).');
            return;
        }

        if (inputMode === 'POINT') {
            if (!hasValidPin) {
                setErrorMsg('Please click on the map to set a location pin or enter valid Latitude and Longitude.');
                return;
            }
            if (!address.trim()) {
                setErrorMsg('Address is required for pin location.');
                return;
            }
        } else {
            // MODE B: POLYGON
            if (polygonVertices.length < 3) {
                setErrorMsg('Please draw an enclosed area with at least 3 points on the map.');
                return;
            }
        }

        setIsSaving(true);
        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const prefix = userRole === 'admin' ? '/admin' : '/dispatcher';

            const formData = new FormData();
            formData.append('geometry_type', inputMode);
            if (areaName.trim()) {
                formData.append('area_name', areaName.trim().slice(0, 150));
            }
            formData.append('risk_level', riskLevel);

            if (!isCustom) {
                formData.append('incident_type_id', String(Number(typeMode)));
            } else {
                formData.append('custom_pin_type', customType.trim().slice(0, 100));
            }

            if (description.trim()) {
                formData.append('pin_description', description.trim().slice(0, 255));
            }

            const coordsForFallback: Array<[number, number]> =
                inputMode === 'POINT' ? [[parsedLng, parsedLat]] : polygonVertices;
            const coordFallback = detectBarangayFromCoordinates(coordsForFallback);
            const resolvedBrgy = detectedBarangay || extractBarangay(address) || coordFallback;
            if (resolvedBrgy) {
                formData.append('barangay_name', resolvedBrgy);
            }

            if (inputMode === 'POINT') {
                formData.append('pin_address', address.trim().slice(0, 255));
                formData.append('pin_latitude', String(Number(parsedLat.toFixed(7))));
                formData.append('pin_longitude', String(Number(parsedLng.toFixed(7))));
            } else {
                // Polygon mode
                const ringCoords = [...polygonVertices];
                if (
                    ringCoords.length >= 3 &&
                    (ringCoords[0][0] !== ringCoords[ringCoords.length - 1][0] ||
                        ringCoords[0][1] !== ringCoords[ringCoords.length - 1][1])
                ) {
                    ringCoords.push(ringCoords[0]);
                }
                formData.append('polygon_coordinates', JSON.stringify(ringCoords));
                formData.append(
                    'pin_address',
                    address.trim() || areaName.trim() || `Prone Area Polygon (${resolvedBrgy || 'Opol'})`
                );

                // Compute centroid
                let sumLng = 0;
                let sumLat = 0;
                polygonVertices.forEach(([lng, lat]) => {
                    sumLng += lng;
                    sumLat += lat;
                });
                const cLat = sumLat / polygonVertices.length;
                const cLng = sumLng / polygonVertices.length;
                formData.append('pin_latitude', String(Number(cLat.toFixed(7))));
                formData.append('pin_longitude', String(Number(cLng.toFixed(7))));
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
                    'Failed to save incident-prone area.';
                setErrorMsg(String(firstErr));
                return;
            }

            const savedData = await resp.json().catch(() => null);
            onSaved(savedData?.pin);
            onClose();
        } catch (err) {
            console.error('Error saving incident-prone area:', err);
            setErrorMsg('Network error while saving incident-prone area. Please try again.');
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header with Mode Switcher */}
                <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-sm"
                            style={{
                                backgroundColor: `${currentRiskColor}20`,
                                borderColor: `${currentRiskColor}50`,
                                color: currentRiskColor,
                            }}
                        >
                            {inputMode === 'POINT' ? (
                                <MapPin className="w-5 h-5" />
                            ) : (
                                <Shapes className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                                Add Incident-Prone Area
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {inputMode === 'POINT'
                                    ? 'MODE A: Drop a single pin at a specific geographical location.'
                                    : 'MODE B: Draw an enclosed geographical boundary by connecting multiple points.'}
                            </p>
                        </div>
                    </div>

                    {/* TWO-MODE SELECTOR SWITCHER */}
                    <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/80 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => {
                                setInputMode('POINT');
                                setErrorMsg(null);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                inputMode === 'POINT'
                                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>MODE A: PIN LOCATION</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setInputMode('POLYGON');
                                setErrorMsg(null);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                inputMode === 'POLYGON'
                                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Shapes className="w-3.5 h-3.5" />
                            <span>MODE B: DRAW AREA (POLYGON)</span>
                        </button>
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

                {/* Modal Body: Form (Left) + Interactive Drawing Map (Right) */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
                    {/* Left Form Column */}
                    <div className="lg:col-span-5 p-4 sm:p-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 overflow-y-auto">
                        {errorMsg && (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Mode Indicator Banner */}
                        <div
                            className="p-2.5 rounded-xl border text-[11px] flex items-center justify-between"
                            style={{
                                backgroundColor: `${currentRiskColor}12`,
                                borderColor: `${currentRiskColor}40`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {inputMode === 'POINT' ? 'Single Pin Marker' : 'Custom Enclosed Polygon'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 text-white font-mono font-semibold">
                                    {inputMode === 'POINT' ? 'POINT' : `POLYGON (${polygonVertices.length} pts)`}
                                </span>
                            </div>
                            <span
                                className="font-bold font-mono text-[11px]"
                                style={{ color: currentRiskColor }}
                            >
                                {riskLevel.toUpperCase()} RISK
                            </span>
                        </div>

                        {/* Prone Area Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Prone Area Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                maxLength={150}
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                placeholder={
                                    inputMode === 'POINT'
                                        ? 'e.g., Poblacion Blind Curve, Barra Highway Junction'
                                        : 'e.g., Luyongbonbon Coastal Flood Zone, Awang Landslide Perimeter'
                                }
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                required
                            />
                        </div>

                        {/* Risk Level Selector Buttons (High, Mod-High, Moderate, Low) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Risk Level Classification <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {RISK_LEVELS.map((r) => {
                                    const isSelected = riskLevel === r.label;
                                    return (
                                        <button
                                            key={r.label}
                                            type="button"
                                            onClick={() => setRiskLevel(r.label)}
                                            className={`px-2 py-1.5 rounded-xl border text-[10.5px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white ring-2 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-white/10'
                                            }`}
                                            style={isSelected ? { borderColor: r.color } : {}}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: r.color }}
                                            />
                                            <span className="truncate w-full text-center leading-tight">
                                                {r.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Emergency / Hazard Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Incident / Hazard Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={typeMode}
                                onChange={(e) => setTypeMode(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                            >
                                <option value="" disabled>-- Select Incident / Hazard Type --</option>
                                {incidentTypes.map((t) => (
                                    <option key={t.id} value={String(t.id)}>
                                        {t.incident_type_name}
                                    </option>
                                ))}
                                <option value="custom">+ Other / Custom Hazard Type</option>
                            </select>

                            {typeMode === 'custom' && (
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    placeholder="e.g., Flood Prone, Landslide Hazard, Vehicular Blindspot..."
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-500/40 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    required
                                />
                            )}
                        </div>

                        {/* Mode A: Lat/Lng & Address */}
                        {inputMode === 'POINT' ? (
                            <>
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
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                            <span>Address / Landmark <span className="text-rose-500">*</span></span>
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
                                        placeholder="Click on the map or type address..."
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            /* Mode B: Polygon Coordinates Status & Summary */
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                        <Shapes className="w-4 h-4 text-cyan-400" />
                                        <span>Polygon Boundary Status</span>
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isPolygonClosed
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : polygonVertices.length >= 3
                                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                  : 'bg-slate-700/60 text-slate-300'
                                        }`}
                                    >
                                        {isPolygonClosed
                                            ? 'Enclosed Area Ready'
                                            : polygonVertices.length >= 3
                                              ? 'Unclosed Area'
                                              : `${polygonVertices.length}/3 Min Points`}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {polygonVertices.length === 0
                                        ? 'Click on the map to start placing points along the perimeter of the prone area.'
                                        : isPolygonClosed
                                          ? `Enclosed area formed with ${polygonVertices.length} perimeter vertices. You can drag vertices to adjust the shape.`
                                          : `Drawing: ${polygonVertices.length} points placed. Click first point or "Finish Drawing" to close.`}
                                </p>
                            </div>
                        )}

                        {/* Covered / Detected Barangay */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Covered Barangay
                            </label>
                            <select
                                value={detectedBarangay}
                                onChange={(e) => setDetectedBarangay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                            >
                                <option value="">Select or Auto-detected Barangay</option>
                                {opolBarangays.map((b) => (
                                    <option key={b} value={b}>
                                        Brgy. {b}
                                    </option>
                                ))}
                            </select>
                            {detectedBarangay && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Area associated with Brgy. {detectedBarangay}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Description / Hazard Notes
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">{description.length}/255</span>
                            </div>
                            <textarea
                                rows={2}
                                maxLength={255}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe specific hazards, terrain, blindspots, or historical incidents..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                            />
                        </div>

                        {/* Optional Photos */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Photos (Optional)</span>
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">{photoFiles.length}/5</span>
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
                                    className="w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="font-semibold">Upload Photo(s)</span>
                                    <span className="text-[10px] text-slate-400">(max 5MB)</span>
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
                                disabled={isSaving || !typeMode || (typeMode === 'custom' && !customType.trim()) || (inputMode === 'POLYGON' && polygonVertices.length < 3)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: currentRiskColor }}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving Prone Area...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Save Incident-Prone Area</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Interactive Drawing Map Column */}
                    <div className="lg:col-span-7 relative min-h-[420px] lg:min-h-[540px] bg-slate-950">
                        {import.meta.env.VITE_MAPBOX_TOKEN ? (
                            <Map
                                ref={mapRef}
                                key={`manual-pin-map-${open ? 'open' : 'closed'}-${initialCenter?.latitude ?? 0}-${initialCenter?.longitude ?? 0}`}
                                initialViewState={
                                    initialCenter
                                        ? {
                                              latitude: initialCenter.latitude,
                                              longitude: initialCenter.longitude,
                                              zoom: initialCenter.zoom || 14.5,
                                          }
                                        : OPOL_DEFAULT
                                }
                                style={{ width: '100%', height: '100%' }}
                                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                mapStyle={mapStyleUrl}
                                attributionControl={false}
                                cursor={inputMode === 'POLYGON' ? 'crosshair' : 'pointer'}
                                onClick={(e) => handleMapClick(e.lngLat.lat, e.lngLat.lng)}
                                onLoad={(e) => {
                                    try {
                                        e.target.resize();
                                        const target = initialCenter || OPOL_DEFAULT;
                                        e.target.jumpTo({
                                            center: [target.longitude, target.latitude],
                                            zoom: target.zoom || 14.5,
                                        });
                                    } catch {
                                        // ignore
                                    }
                                }}
                            >
                                {/* Opol Barangay Reference Boundary Lines */}
                                {barangayGeojson && (
                                    <Source id="modal-opol-boundaries" type="geojson" data={barangayGeojson}>
                                        <Layer
                                            id="modal-opol-boundary-lines"
                                            type="line"
                                            paint={{
                                                'line-color': '#64748b',
                                                'line-width': 1.2,
                                                'line-opacity': 0.5,
                                                'line-dasharray': [3, 2],
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Existing Saved Incident-Prone Polygons (faint background reference) */}
                                {existingPronePolygons && existingPronePolygons.features?.length > 0 && (
                                    <Source id="modal-existing-polygons" type="geojson" data={existingPronePolygons}>
                                        <Layer
                                            id="modal-existing-polygons-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': ['get', 'color'],
                                                'fill-opacity': 0.16,
                                            }}
                                        />
                                        <Layer
                                            id="modal-existing-polygons-stroke"
                                            type="line"
                                            paint={{
                                                'line-color': ['get', 'color'],
                                                'line-width': 1.5,
                                                'line-dasharray': [2, 2],
                                                'line-opacity': 0.65,
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Existing Hotspot 20m Cluster Circles (reference glow) */}
                                {existingHotspotsGeojson && (
                                    <Source id="modal-hotspot-circles" type="geojson" data={existingHotspotsGeojson}>
                                        <Layer
                                            id="modal-hotspot-circle-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': ['get', 'color'],
                                                'fill-opacity': 0.28,
                                                'fill-antialias': true,
                                            }}
                                        />
                                        <Layer
                                            id="modal-hotspot-circle-line"
                                            type="line"
                                            paint={{
                                                'line-color': ['get', 'color'],
                                                'line-width': 2.0,
                                                'line-opacity': 0.85,
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* MODE A: Real-time 20-Meter Active Pin Cluster Preview */}
                                {activePinClusterGeojson && (
                                    <Source id="active-pin-cluster-source" type="geojson" data={activePinClusterGeojson}>
                                        <Layer
                                            id="active-pin-cluster-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': currentRiskColor,
                                                'fill-opacity': 0.32,
                                                'fill-antialias': true,
                                            }}
                                        />
                                        <Layer
                                            id="active-pin-cluster-stroke"
                                            type="line"
                                            paint={{
                                                'line-color': currentRiskColor,
                                                'line-width': 2.2,
                                                'line-opacity': 0.95,
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* MODE B: Real-time Polygon Area Fill & Outline */}
                                {activeDrawingPolygonGeojson && (
                                    <Source id="active-polygon-area" type="geojson" data={activeDrawingPolygonGeojson}>
                                        <Layer
                                            id="active-polygon-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': currentRiskColor,
                                                'fill-opacity': isPolygonClosed ? 0.38 : 0.2,
                                            }}
                                        />
                                        <Layer
                                            id="active-polygon-stroke"
                                            type="line"
                                            paint={{
                                                'line-color': currentRiskColor,
                                                'line-width': isPolygonClosed ? 2.5 : 1.5,
                                                'line-dasharray': isPolygonClosed ? [1, 0] : [2, 2],
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* MODE B: Real-time In-progress Line String */}
                                {activeDrawingLineGeojson && !isPolygonClosed && (
                                    <Source id="active-polygon-lines" type="geojson" data={activeDrawingLineGeojson}>
                                        <Layer
                                            id="active-lines-layer"
                                            type="line"
                                            paint={{
                                                'line-color': currentRiskColor,
                                                'line-width': 2.2,
                                                'line-dasharray': [3, 1.5],
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* MODE B: Draggable Vertex Point Markers */}
                                {inputMode === 'POLYGON' &&
                                    polygonVertices.map(([lng, lat], idx) => {
                                        const isFirst = idx === 0;
                                        const isSelected = selectedVertexIdx === idx;
                                        return (
                                            <Marker
                                                key={`vertex-${idx}-${lng}-${lat}`}
                                                longitude={lng}
                                                latitude={lat}
                                                draggable
                                                onDragEnd={(e) => handleDragVertex(idx, e.lngLat.lat, e.lngLat.lng)}
                                                onClick={(e) => {
                                                    e.originalEvent.stopPropagation();
                                                    if (isFirst && polygonVertices.length >= 3 && !isPolygonClosed) {
                                                        handleFinishPolygon();
                                                    } else {
                                                        setSelectedVertexIdx(idx);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded-full border-2 cursor-move hover:scale-130 transition-all flex items-center justify-center shadow-lg ${
                                                        isFirst
                                                            ? 'bg-amber-400 border-white ring-2 ring-amber-500 animate-pulse'
                                                            : isSelected
                                                              ? 'bg-cyan-400 border-white ring-2 ring-cyan-500'
                                                              : 'bg-white'
                                                    }`}
                                                    style={!isFirst && !isSelected ? { borderColor: currentRiskColor } : {}}
                                                    title={
                                                        isFirst && polygonVertices.length >= 3 && !isPolygonClosed
                                                            ? 'Click to Close Polygon Area'
                                                            : `Vertex ${idx + 1} (Drag to adjust)`
                                                    }
                                                >
                                                    <span className="text-[8px] font-extrabold text-slate-900 leading-none">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                            </Marker>
                                        );
                                    })}

                                {/* MODE A: Draggable Single Pin Marker */}
                                {inputMode === 'POINT' && hasValidPin && (
                                    <Marker
                                        longitude={parsedLng}
                                        latitude={parsedLat}
                                        anchor="bottom"
                                        draggable
                                        onDragEnd={(e) => handleMapClick(e.lngLat.lat, e.lngLat.lng)}
                                    >
                                        <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
                                            <span
                                                className="mb-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-lg whitespace-nowrap border border-white/40"
                                                style={{ backgroundColor: currentRiskColor }}
                                            >
                                                {areaName.trim() || 'Prone Area Pin'}
                                            </span>
                                            <svg width="32" height="42" viewBox="0 0 24 32" fill="none" className="drop-shadow-xl">
                                                <path
                                                    d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 12 32 12 32C12 32 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z"
                                                    fill={currentRiskColor}
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

                        {/* Top-Left Instructions / Drawing Status Badge */}
                        <div className="absolute top-3 left-3 z-10 max-w-[82%] px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 backdrop-blur-md text-[11px] text-slate-100 shadow-xl space-y-1">
                            {inputMode === 'POINT' ? (
                                <div className="font-bold flex items-center gap-1.5 text-slate-200">
                                    <MousePointerClick className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span>Click on map to drop pin, or drag pin to adjust coordinates.</span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="font-bold flex items-center gap-1.5 text-slate-200">
                                        <Shapes className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span>
                                            {isPolygonClosed
                                                ? 'Polygon Closed! Drag any numbered point to refine shape.'
                                                : 'Click map to add boundary points. Click point #1 to close area.'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                                        <span>Vertices: {polygonVertices.length}</span>
                                        {detectedBarangay && <span>Barangay: Brgy. {detectedBarangay}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODE B: Interactive Polygon Toolbar on the Map */}
                        {inputMode === 'POLYGON' && (
                            <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/95 border border-white/15 backdrop-blur-md p-1.5 rounded-xl shadow-2xl">
                                <button
                                    type="button"
                                    onClick={handleUndoVertex}
                                    disabled={polygonVertices.length === 0}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Undo last added point"
                                >
                                    <Undo2 className="w-3 h-3" />
                                    <span>Undo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRedoVertex}
                                    disabled={redoStack.length === 0}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Redo previously removed point"
                                >
                                    <Redo2 className="w-3 h-3" />
                                    <span>Redo</span>
                                </button>
                                {selectedVertexIdx !== null && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteVertex(selectedVertexIdx)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                        title={`Delete Vertex ${selectedVertexIdx + 1}`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Del #{selectedVertexIdx + 1}</span>
                                    </button>
                                )}
                                {!isPolygonClosed && (
                                    <button
                                        type="button"
                                        onClick={handleFinishPolygon}
                                        disabled={polygonVertices.length < 3}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                        title="Close and complete the polygon boundary"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Finish Drawing</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleResetPolygon}
                                    disabled={polygonVertices.length === 0}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Clear drawing and start over"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset</span>
                                </button>
                            </div>
                        )}

                        {/* Top-Right Map Style & Reset Controls */}
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setMapStyleUrl((prev) =>
                                        prev.includes('satellite')
                                            ? 'mapbox://styles/mapbox/streets-v12'
                                            : prev.includes('streets')
                                            ? 'mapbox://styles/mapbox/dark-v11'
                                            : 'mapbox://styles/mapbox/satellite-streets-v12'
                                    );
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-100 text-[11px] font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                                title="Switch Map Style"
                            >
                                <Layers className="w-3.5 h-3.5 text-rose-400" />
                                <span>
                                    {mapStyleUrl.includes('satellite')
                                        ? 'Satellite'
                                        : mapStyleUrl.includes('streets')
                                        ? 'Streets'
                                        : 'Dark'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const target = initialCenter || OPOL_DEFAULT;
                                    mapRef.current?.flyTo({
                                        center: [target.longitude, target.latitude],
                                        zoom: target.zoom || 14.5,
                                        duration: 600,
                                    });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 shadow-md cursor-pointer"
                                title="Reset to Heatmap View"
                            >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Current View</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
