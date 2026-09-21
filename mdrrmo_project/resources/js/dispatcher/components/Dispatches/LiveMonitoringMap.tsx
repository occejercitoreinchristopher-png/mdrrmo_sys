import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, MapPin, AlertTriangle, Navigation, RotateCw, X, Radio, CheckCircle } from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';

export interface RouteTelemetry {
    distanceMeters: number | null;
    durationSeconds: number | null;
    formattedDistance: string;
    formattedEta: string;
    isOffRoute: boolean;
    routeGeometry: any | null;
}

export interface LiveLocation {
    latitude: number;
    longitude: number;
    heading?: number | null;
    accuracy?: number | null;
    timestamp?: string;
    updatedAt?: number;
    responder_name?: string;
}

interface LiveMonitoringMapProps {
    dispatches?: any[];
    selectedDispatch?: any | null;
    liveLocations?: Record<string | number, LiveLocation>;
    onRouteTelemetryChange?: (dispatchId: number | string, telemetry: RouteTelemetry) => void;
    onSelectDispatch?: (dispatch: any) => void;
}

const DEFAULT_MAP_CENTER = {
    longitude: 124.577, // Opol/Misamis Oriental center
    latitude: 8.520,
    zoom: 12
};

/**
 * Calculates distance in meters between two lat/lng pairs using Haversine formula
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Distance from point [lon, lat] to line segment between [aLon, aLat] and [bLon, bLat]
 */
function distanceToSegmentInMeters(
    pLon: number, pLat: number,
    aLon: number, aLat: number,
    bLon: number, bLat: number
): number {
    const cosLat = Math.cos((pLat * Math.PI) / 180);
    const px = pLon * cosLat * 111320;
    const py = pLat * 110540;
    const ax = aLon * cosLat * 111320;
    const ay = aLat * 110540;
    const bx = bLon * cosLat * 111320;
    const by = bLat * 110540;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
        return Math.hypot(px - ax, py - ay);
    }

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const projX = ax + t * dx;
    const projY = ay + t * dy;

    return Math.hypot(px - projX, py - projY);
}

/**
 * Distance from point [lon, lat] to GeoJSON LineString coordinates array
 */
function distanceToPolylineInMeters(lon: number, lat: number, coordinates: [number, number][]): number {
    if (!coordinates || coordinates.length === 0) return Infinity;
    if (coordinates.length === 1) {
        return getDistanceInMeters(lat, lon, coordinates[0][1], coordinates[0][0]);
    }

    let minDistance = Infinity;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const d = distanceToSegmentInMeters(
            lon, lat,
            coordinates[i][0], coordinates[i][1],
            coordinates[i + 1][0], coordinates[i + 1][1]
        );
        if (d < minDistance) minDistance = d;
    }
    return minDistance;
}

/**
 * Snap point [lon, lat] to nearest point on a polyline if within maxDistanceMeters.
 * Also computes the forward segment bearing (angle in degrees) along the route!
 */
/**
 * Snap point [lon, lat] to nearest point on a polyline if within maxDistanceMeters.
 * Also computes the forward segment bearing (angle in degrees) along the route and segment index.
 */
export function snapToPolyline(
    lon: number, 
    lat: number, 
    coordinates: [number, number][], 
    maxDistanceMeters = 150
): { lng: number; lat: number; bearing: number; segmentIndex: number; isSnapped: boolean } {
    if (!coordinates || coordinates.length < 2) {
        return { lng: lon, lat, bearing: 0, segmentIndex: 0, isSnapped: false };
    }

    let minDistance = Infinity;
    let bestPoint: [number, number] = [lon, lat];
    let bestBearing = 0;
    let bestSegmentIndex = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const aLon = coordinates[i][0];
        const aLat = coordinates[i][1];
        const bLon = coordinates[i + 1][0];
        const bLat = coordinates[i + 1][1];

        const cosLat = Math.cos((lat * Math.PI) / 180);
        const px = lon * cosLat * 111320;
        const py = lat * 110540;
        const ax = aLon * cosLat * 111320;
        const ay = aLat * 110540;
        const bx = bLon * cosLat * 111320;
        const by = bLat * 110540;

        const dx = bx - ax;
        const dy = by - ay;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
        const projLon = aLon + t * (bLon - aLon);
        const projLat = aLat + t * (bLat - aLat);

        const projX = ax + t * dx;
        const projY = ay + t * dy;
        const dist = Math.hypot(px - projX, py - projY);

        if (dist < minDistance) {
            minDistance = dist;
            bestPoint = [projLon, projLat];
            bestSegmentIndex = i;
            const rad = Math.atan2(bLon - aLon, bLat - aLat);
            bestBearing = (rad * 180 / Math.PI + 360) % 360;
        }
    }

    if (minDistance <= maxDistanceMeters) {
        return { 
            lng: bestPoint[0], 
            lat: bestPoint[1], 
            bearing: bestBearing, 
            segmentIndex: bestSegmentIndex, 
            isSnapped: true 
        };
    }

    return { lng: lon, lat, bearing: 0, segmentIndex: 0, isSnapped: false };
}

/**
 * Calculates remaining distance (in meters) from a snapped point along the rest of the polyline
 */
export function getRemainingDistance(
    snappedLon: number, 
    snappedLat: number, 
    segmentIndex: number, 
    coordinates: [number, number][]
): number {
    if (!coordinates || coordinates.length < 2) return 0;
    
    // Distance from snapped position to the end of the current segment
    const nextPt = coordinates[Math.min(segmentIndex + 1, coordinates.length - 1)];
    let total = getDistanceInMeters(snappedLat, snappedLon, nextPt[1], nextPt[0]);

    // Add up all remaining segments
    for (let i = segmentIndex + 1; i < coordinates.length - 1; i++) {
        total += getDistanceInMeters(
            coordinates[i][1], coordinates[i][0],
            coordinates[i + 1][1], coordinates[i + 1][0]
        );
    }

    return total;
}

export function formatDistance(meters: number | null): string {
    if (meters === null || isNaN(meters)) return '--';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null): string {
    if (seconds === null || isNaN(seconds)) return '--';
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
}

export default function LiveMonitoringMap({ 
    dispatches = [], 
    selectedDispatch = null,
    liveLocations = {},
    onRouteTelemetryChange,
    onSelectDispatch
}: LiveMonitoringMapProps) {
    const { theme } = useAppearance();
    const mapRef = useRef<MapRef>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [routeGeojson, setRouteGeojson] = useState<any | null>(null);
    const [isOffRoute, setIsOffRoute] = useState(false);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

    // Active mission tracking is ONLY active when dispatcher explicitly selects a responder/dispatch
    const activeDispatch = selectedDispatch ?? null;

    // Track active route geometry in ref to avoid re-rendering loops
    const activeRouteRef = useRef<{
        dispatchId: number | string;
        coordinates: [number, number][];
        distance: number;
        duration: number;
    } | null>(null);

    const prevActiveIdRef = useRef<number | string | null>(null);
    const lastRouteCalcTimeRef = useRef<number>(0);
    const isRoutingInProgressRef = useRef<boolean>(false);
    const consecutiveOffRouteCountRef = useRef<number>(0);

    // Extract current responder location for a dispatch
    const getResponderLocation = useCallback((dispatch: any): LiveLocation | null => {
        if (!dispatch) return null;

        // 1. First check liveLocations from real-time WebSocket
        const live = liveLocations[dispatch.id] || liveLocations[dispatch.ambulance_id];
        if (live && live.latitude && live.longitude) {
            return live;
        }

        // 2. Check last known persisted coordinates from dispatch record
        const lat = parseFloat(dispatch.last_latitude);
        const lng = parseFloat(dispatch.last_longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return {
                latitude: lat,
                longitude: lng,
                heading: dispatch.last_heading ? parseFloat(dispatch.last_heading) : null,
                accuracy: dispatch.last_accuracy ? parseFloat(dispatch.last_accuracy) : null,
                timestamp: dispatch.last_location_updated_at,
            };
        }

        return null;
    }, [liveLocations]);

    // Fetch route from Mapbox Directions API (with OSRM fallback)
    const calculateRoute = useCallback(async (
        startLon: number, startLat: number,
        destLon: number, destLat: number,
        dispatchId: number | string,
        keepExistingLine = false
    ) => {
        if (isRoutingInProgressRef.current) return;
        isRoutingInProgressRef.current = true;
        
        if (!keepExistingLine) {
            setIsCalculatingRoute(true);
        }
        lastRouteCalcTimeRef.current = Date.now();

        const token = import.meta.env.VITE_MAPBOX_TOKEN;

        // 1. Try Mapbox Directions API first
        if (token) {
            try {
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLon},${startLat};${destLon},${destLat}?geometries=geojson&overview=full&access_token=${token}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const geometry = route.geometry;
                    const distance = route.distance;
                    const duration = route.duration;

                    setRouteGeojson(geometry);
                    setIsOffRoute(false);
                    consecutiveOffRouteCountRef.current = 0;

                    activeRouteRef.current = {
                        dispatchId,
                        coordinates: geometry.coordinates,
                        distance,
                        duration,
                    };

                    if (onRouteTelemetryChange) {
                        onRouteTelemetryChange(dispatchId, {
                            distanceMeters: distance,
                            durationSeconds: duration,
                            formattedDistance: formatDistance(distance),
                            formattedEta: formatDuration(duration),
                            isOffRoute: false,
                            routeGeometry: geometry,
                        });
                    }
                    setIsCalculatingRoute(false);
                    isRoutingInProgressRef.current = false;
                    return;
                }
            } catch (err) {
                console.warn("Mapbox directions fetch error, attempting OSRM fallback:", err);
            }
        }

        // 2. Fallback to OSRM if Mapbox had an error or returned no routes
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?geometries=geojson&overview=full`;
            const osrmRes = await fetch(osrmUrl);
            const osrmData = await osrmRes.json();

            if (osrmData.routes && osrmData.routes.length > 0) {
                const route = osrmData.routes[0];
                const geometry = route.geometry;
                const distance = route.distance;
                const duration = route.duration;

                setRouteGeojson(geometry);
                setIsOffRoute(false);
                consecutiveOffRouteCountRef.current = 0;

                activeRouteRef.current = {
                    dispatchId,
                    coordinates: geometry.coordinates,
                    distance,
                    duration,
                };

                if (onRouteTelemetryChange) {
                    onRouteTelemetryChange(dispatchId, {
                        distanceMeters: distance,
                        durationSeconds: duration,
                        formattedDistance: formatDistance(distance),
                        formattedEta: formatDuration(duration),
                        isOffRoute: false,
                        routeGeometry: geometry,
                    });
                }
            }
        } catch (osrmErr) {
            console.error("Both Mapbox and OSRM routing failed:", osrmErr);
        } finally {
            setIsCalculatingRoute(false);
            isRoutingInProgressRef.current = false;
        }
    }, [onRouteTelemetryChange]);

    // Stable route tracking: Calculates route ONCE when mission selected; glides along route without re-routing on every move!
    useEffect(() => {
        if (!activeDispatch) {
            setRouteGeojson(null);
            activeRouteRef.current = null;
            setIsOffRoute(false);
            consecutiveOffRouteCountRef.current = 0;
            if (prevActiveIdRef.current !== null) {
                prevActiveIdRef.current = null;
                // Animate smoothly back to default fleet overview
                mapRef.current?.flyTo({
                    center: [DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude],
                    zoom: DEFAULT_MAP_CENTER.zoom,
                    duration: 1800,
                    essential: true,
                    curve: 1.42,
                    speed: 1.2
                });
            }
            return;
        }

        const dispatchId = activeDispatch.id;
        const incLon = parseFloat(activeDispatch.incident?.incident_longitude);
        const incLat = parseFloat(activeDispatch.incident?.incident_latitude);
        const responderLoc = getResponderLocation(activeDispatch);

        // If responder has already arrived on scene, clear the route line and set status to On Scene!
        const isArrived = ['arrived_on_scene', 'completed', 'cancelled'].includes(activeDispatch.dispatch_status) || Boolean(activeDispatch.arrived_at);

        if (isArrived) {
            setRouteGeojson(null);
            activeRouteRef.current = null;
            setIsOffRoute(false);
            consecutiveOffRouteCountRef.current = 0;
            if (onRouteTelemetryChange) {
                onRouteTelemetryChange(dispatchId, {
                    distanceMeters: 0,
                    durationSeconds: 0,
                    formattedDistance: 'At Scene',
                    formattedEta: 'On Scene',
                    isOffRoute: false,
                    routeGeometry: null,
                });
            }
            return;
        }

        // Cannot route without both valid coordinates
        if (!incLon || !incLat || !responderLoc) {
            return;
        }

        const currentRoute = activeRouteRef.current;
        const isNewDispatch = prevActiveIdRef.current !== dispatchId;

        // 1. If dispatch changed or no route established yet: calculate route ONCE
        if (!currentRoute || isNewDispatch || currentRoute.dispatchId !== dispatchId) {
            prevActiveIdRef.current = dispatchId;
            calculateRoute(responderLoc.longitude, responderLoc.latitude, incLon, incLat, dispatchId);
            return;
        }

        // 2. Responder is moving while active route is already established!
        // Snap responder to route polyline and update distance/ETA in-memory WITHOUT re-fetching route!
        const snapped = snapToPolyline(responderLoc.longitude, responderLoc.latitude, currentRoute.coordinates, 150);

        if (snapped.isSnapped) {
            // Vehicle is on or near the planned route:
            consecutiveOffRouteCountRef.current = 0;
            setIsOffRoute(false);

            // Compute remaining distance along the route polyline in real-time
            const remainingMeters = getRemainingDistance(
                snapped.lng, 
                snapped.lat, 
                snapped.segmentIndex, 
                currentRoute.coordinates
            );

            // Calculate ETA proportional to remaining distance
            const speedMps = (currentRoute.distance > 0 && currentRoute.duration > 0)
                ? (currentRoute.distance / currentRoute.duration)
                : 9.7; // ~35 km/h fallback
            const remainingSeconds = Math.max(15, Math.round(remainingMeters / Math.max(speedMps, 3)));

            if (onRouteTelemetryChange) {
                onRouteTelemetryChange(dispatchId, {
                    distanceMeters: remainingMeters,
                    durationSeconds: remainingSeconds,
                    formattedDistance: formatDistance(remainingMeters),
                    formattedEta: formatDuration(remainingSeconds),
                    isOffRoute: false,
                    routeGeometry: routeGeojson,
                });
            }
        } else {
            // Responder is genuinely > 150m away from the entire route
            consecutiveOffRouteCountRef.current += 1;

            // Only recalculate route if sustained off-route for 4+ consecutive location updates AND at least 30s cooldown
            const OFF_ROUTE_CONSECUTIVE_LIMIT = 4;
            const RECALC_COOLDOWN_MS = 30000;
            const now = Date.now();

            if (
                consecutiveOffRouteCountRef.current >= OFF_ROUTE_CONSECUTIVE_LIMIT &&
                now - lastRouteCalcTimeRef.current >= RECALC_COOLDOWN_MS
            ) {
                setIsOffRoute(true);
                calculateRoute(responderLoc.longitude, responderLoc.latitude, incLon, incLat, dispatchId, true);
            }
        }
    }, [activeDispatch, liveLocations, getResponderLocation, calculateRoute, onRouteTelemetryChange, routeGeojson]);

    // Smooth cinematic camera animation (zooms smoothly without snapping or teleporting)
    const animateToDispatch = useCallback((dispatch: any) => {
        if (!mapRef.current || !dispatch) return;

        const incLon = parseFloat(dispatch.incident?.incident_longitude);
        const incLat = parseFloat(dispatch.incident?.incident_latitude);
        const responderLoc = getResponderLocation(dispatch);

        const isArrived = ['arrived_on_scene', 'completed', 'cancelled'].includes(dispatch.dispatch_status) || Boolean(dispatch.arrived_at);

        if (isArrived && incLon && incLat) {
            // Responder is already on scene! Focus camera directly onto the scene
            mapRef.current.flyTo({
                center: [incLon, incLat],
                zoom: 15.5,
                duration: 1800,
                essential: true,
                curve: 1.42,
                speed: 1.2
            });
            return;
        }

        if (incLon && incLat && responderLoc) {
            const minLng = Math.min(incLon, responderLoc.longitude);
            const maxLng = Math.max(incLon, responderLoc.longitude);
            const minLat = Math.min(incLat, responderLoc.latitude);
            const maxLat = Math.max(incLat, responderLoc.latitude);

            try {
                // Calculate camera positioning and optimal zoom level to fit both pins comfortably
                // @ts-ignore
                const camera = mapRef.current.cameraForBounds(
                    [[minLng, minLat], [maxLng, maxLat]],
                    {
                        padding: { top: 90, bottom: 120, left: 90, right: 90 },
                        maxZoom: 15
                    }
                );

                if (camera && camera.center && typeof camera.zoom === 'number') {
                    mapRef.current.flyTo({
                        center: camera.center,
                        zoom: camera.zoom,
                        duration: 1800,
                        essential: true,
                        curve: 1.42, // Mapbox standard cinematic flight curve
                        speed: 1.2
                    });
                    return;
                }
            } catch (err) {
                console.warn("cameraForBounds calculation fallback:", err);
            }

            // Fallback to fitBounds with full animation
            mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                {
                    padding: { top: 90, bottom: 120, left: 90, right: 90 },
                    duration: 1800,
                    essential: true,
                    maxZoom: 15
                }
            );
        } else if (incLon && incLat) {
            mapRef.current.flyTo({
                center: [incLon, incLat],
                zoom: 14.5,
                duration: 1800,
                essential: true,
                curve: 1.42,
                speed: 1.2
            });
        } else if (responderLoc) {
            mapRef.current.flyTo({
                center: [responderLoc.longitude, responderLoc.latitude],
                zoom: 14.5,
                duration: 1800,
                essential: true,
                curve: 1.42,
                speed: 1.2
            });
        }
    }, [getResponderLocation]);

    // Camera Framing: Fit bounds to show both Incident and Responder when active dispatch changes
    useEffect(() => {
        if (activeDispatch) {
            animateToDispatch(activeDispatch);
        }
    }, [activeDispatch?.id, animateToDispatch]);

    // Manual Re-center button action
    const handleRecenter = () => {
        if (activeDispatch) {
            animateToDispatch(activeDispatch);
        }
    };

    return (
        <div className="w-full h-full overflow-hidden bg-slate-900 relative">
            <style>{`
                .mapboxgl-ctrl-logo { display: none !important; }
                .mapboxgl-ctrl-attrib { display: none !important; }
            `}</style>

            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                <Map
                    ref={mapRef}
                    initialViewState={DEFAULT_MAP_CENTER}
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                    onLoad={() => {
                        setMapLoaded(true);
                        if (activeDispatch) {
                            animateToDispatch(activeDispatch);
                        }
                    }}
                    mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
                    attributionControl={false}
                    onClick={(e) => {
                        // Clicking empty map background clears selection and returns to default fleet view
                        // @ts-ignore
                        if (e.originalEvent?.defaultPrevented) return;
                        if (onSelectDispatch) onSelectDispatch(null);
                    }}
                >
                    {/* Active Mission Route Line (ONLY displayed when a responder is selected) */}
                    {mapLoaded && activeDispatch && routeGeojson && (
                        <Source 
                            key={`route-source-${activeDispatch.id}-${routeGeojson.coordinates?.length || 0}`}
                            id="routeSource" 
                            type="geojson" 
                            data={{ 
                                type: 'Feature', 
                                properties: {}, 
                                geometry: routeGeojson 
                            }}
                        >
                            {/* Route Glow / Casing */}
                            <Layer 
                                id="routeLayerGlow" 
                                type="line" 
                                layout={{
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                }}
                                paint={{
                                    'line-color': '#1d4ed8',
                                    'line-width': 10,
                                    'line-opacity': 0.6
                                }} 
                            />
                            {/* Main Active Route Line */}
                            <Layer 
                                id="routeLayer" 
                                type="line" 
                                layout={{
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                }}
                                paint={{
                                    'line-color': '#3b82f6',
                                    'line-width': 5,
                                    'line-opacity': 1
                                }} 
                            />
                        </Source>
                    )}

                    {/* Render active responder markers (all live responders) & incident marker (only if selected) */}
                    {dispatches.map(dispatch => {
                        const isSelected = activeDispatch?.id === dispatch.id;
                        const incLon = parseFloat(dispatch.incident?.incident_longitude);
                        const incLat = parseFloat(dispatch.incident?.incident_latitude);
                        const responderLoc = getResponderLocation(dispatch);

                        return (
                            <div key={`dispatch-group-${dispatch.id}`}>
                                {/* 🔴 FIXED INCIDENT LOCATION MARKER (Visible ONLY when this mission is selected) */}
                                {isSelected && incLon && incLat && (
                                    <Marker 
                                        longitude={incLon} 
                                        latitude={incLat}
                                        anchor="bottom"
                                        onClick={(e) => {
                                            e.originalEvent?.preventDefault();
                                            e.originalEvent?.stopPropagation();
                                            if (onSelectDispatch) onSelectDispatch(dispatch);
                                        }}
                                    >
                                        <div className="flex flex-col items-center group cursor-pointer select-none">
                                            {/* Header Badge Tag */}
                                            <div className="px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] shadow-lg uppercase tracking-wider mb-1 flex items-center gap-1.5 border border-rose-400/40 bg-gradient-to-r from-rose-600 to-red-600 backdrop-blur-md">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <span>INCIDENT #{dispatch.incident_id || dispatch.id}</span>
                                            </div>

                                            {/* Premium Vector Teardrop Pin (NO BACKGROUND CIRCLE) */}
                                            <div className="relative flex items-center justify-center">
                                                <svg 
                                                    width="36" 
                                                    height="46" 
                                                    viewBox="0 0 36 46" 
                                                    fill="none" 
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="filter drop-shadow-[0_10px_18px_rgba(225,29,72,0.5)] transform hover:scale-110 transition-transform"
                                                >
                                                    <defs>
                                                        <linearGradient id={`inc-pin-${dispatch.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#fb7185" />
                                                            <stop offset="40%" stopColor="#f43f5e" />
                                                            <stop offset="100%" stopColor="#9f1239" />
                                                        </linearGradient>
                                                        <radialGradient id={`inc-ground-${dispatch.id}`} cx="50%" cy="50%" r="50%">
                                                            <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
                                                            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                                                        </radialGradient>
                                                    </defs>

                                                    {/* Ground Contact Shadow */}
                                                    <ellipse cx="18" cy="44" rx="8" ry="2" fill={`url(#inc-ground-${dispatch.id})`} />

                                                    {/* Teardrop Pin Body */}
                                                    <path 
                                                        d="M18 2C10.5 2 4.5 8 4.5 15.5C4.5 25.5 18 42 18 42C18 42 31.5 25.5 31.5 15.5C31.5 8 25.5 2 18 2Z" 
                                                        fill={`url(#inc-pin-${dispatch.id})`} 
                                                        stroke="#FFFFFF" 
                                                        strokeWidth="1.8" 
                                                        strokeLinejoin="round"
                                                    />

                                                    {/* Upper Specular Gloss Sheen */}
                                                    <path 
                                                        d="M18 4C11.8 4 6.8 9 6.8 15.2C6.8 17.5 7.5 19.5 8.6 21.4C9.4 16.3 13.2 12.4 18 12.4C22.8 12.4 26.6 16.3 27.4 21.4C28.5 19.5 29.2 17.5 29.2 15.2C29.2 9 24.2 4 18 4Z" 
                                                        fill="white" 
                                                        fillOpacity="0.45" 
                                                    />

                                                    {/* White Core Ring */}
                                                    <circle cx="18" cy="15.5" r="6" fill="#FFFFFF" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.35))" />

                                                    {/* Center Ruby Beacon */}
                                                    <circle cx="18" cy="15.5" r="3.2" fill="#be123c" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Marker>
                                )}

                                {/* 🔵 RESPONDER / DRIVER LIVE LOCATION MARKER (Navigation Arrow Only, No Circle Background) */}
                                {responderLoc && (() => {
                                    // Snap to route polyline if on active mission so it smoothly follows the road!
                                    const snapped = isSelected && routeGeojson?.coordinates
                                        ? snapToPolyline(responderLoc.longitude, responderLoc.latitude, routeGeojson.coordinates, 150)
                                        : null;

                                    const displayLng = snapped?.isSnapped ? snapped.lng : responderLoc.longitude;
                                    const displayLat = snapped?.isSnapped ? snapped.lat : responderLoc.latitude;
                                    const displayHeading = (responderLoc.heading && responderLoc.heading !== 0)
                                        ? responderLoc.heading
                                        : (snapped?.bearing ?? 0);

                                    return (
                                        <Marker 
                                            longitude={displayLng} 
                                            latitude={displayLat}
                                            anchor="center"
                                            onClick={(e) => {
                                                e.originalEvent?.preventDefault();
                                                e.originalEvent?.stopPropagation();
                                                if (onSelectDispatch) onSelectDispatch(dispatch);
                                            }}
                                        >
                                            <div className="flex flex-col items-center group cursor-pointer select-none">
                                                {/* Floating Unit Identifier Pill */}
                                                <div className={`px-2 py-0.5 rounded-full text-white font-bold text-[9px] font-mono tracking-wider mb-1 flex items-center gap-1 border transition-all whitespace-nowrap shadow-md ${
                                                    isSelected 
                                                        ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-500/40 ring-1 ring-blue-400/50' 
                                                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span>{dispatch.ambulance?.plate_number || (dispatch.driver ? `${dispatch.driver.first_name} ${dispatch.driver.last_name}` : 'Responder')}</span>
                                                </div>

                                                {/* Sleek 3D Navigation Arrow (NO Circle Background, Arrow Only!) */}
                                                <div className="relative flex items-center justify-center">
                                                    <svg 
                                                        width="38" 
                                                        height="38" 
                                                        viewBox="0 0 38 38" 
                                                        fill="none" 
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)] transition-transform duration-300 transform hover:scale-115"
                                                        style={{ 
                                                            transform: `rotate(${displayHeading}deg)` 
                                                        }}
                                                    >
                                                        <defs>
                                                            <linearGradient id={`arrow-wing-l-${dispatch.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#38bdf8" />
                                                                <stop offset="100%" stopColor="#2563eb" />
                                                            </linearGradient>
                                                            <linearGradient id={`arrow-wing-r-${dispatch.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#2563eb" />
                                                                <stop offset="100%" stopColor="#1d4ed8" />
                                                            </linearGradient>
                                                            <filter id={`arrow-glow-${dispatch.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e40af" floodOpacity="0.5" />
                                                            </filter>
                                                        </defs>

                                                        {/* Ground Depth Shadow */}
                                                        <ellipse cx="19" cy="22" rx="10" ry="5" fill="rgba(0,0,0,0.3)" />

                                                        {/* High-Contrast White Outer Shell */}
                                                        <path 
                                                            d="M19 3 L6 33 L19 25 L32 33 Z" 
                                                            fill="none"
                                                            stroke="#FFFFFF" 
                                                            strokeWidth="3" 
                                                            strokeLinejoin="round"
                                                            strokeLinecap="round"
                                                        />

                                                        {/* Left Wing (Vivid Light Facet) */}
                                                        <path 
                                                            d="M19 4 L7 32 L19 25 Z" 
                                                            fill={`url(#arrow-wing-l-${dispatch.id})`}
                                                        />

                                                        {/* Right Wing (Deep Blue Facet) */}
                                                        <path 
                                                            d="M19 4 L19 25 L31 32 Z" 
                                                            fill={`url(#arrow-wing-r-${dispatch.id})`}
                                                        />

                                                        {/* Center Spine Ridge Highlight */}
                                                        <line x1="19" y1="4" x2="19" y2="25" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Marker>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </Map>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    Mapbox Token Missing
                </div>
            )}

            {/* Floating Top Map HUD (Active Mission Telemetry & Actions OR Fleet Overview) */}
            {activeDispatch ? (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-auto">
                    {/* Mission Badge */}
                    <div className="flex items-center gap-2 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-lg text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full ${activeDispatch.dispatch_status === 'arrived_on_scene' ? 'bg-emerald-500' : 'bg-[#F61509] animate-pulse'}`} />
                        <span className="font-bold text-slate-900 dark:text-white">Mission #{activeDispatch.id}</span>
                        {activeDispatch.dispatch_status === 'arrived_on_scene' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Arrived on Scene
                            </span>
                        ) : (
                            <>
                                {isOffRoute && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 text-[10px] font-bold">
                                        <AlertTriangle className="w-3 h-3" /> Off Route - Recalculated
                                    </span>
                                )}
                                {isCalculatingRoute && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <RotateCw className="w-3 h-3 animate-spin" /> Routing...
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Re-center button */}
                    <button
                        onClick={handleRecenter}
                        className="bg-white/95 hover:bg-slate-100 dark:bg-[#090e1a]/95 dark:hover:bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-lg text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
                        title="Frame Incident & Responder in View"
                    >
                        <Navigation className="w-3.5 h-3.5 text-[#F61509]" />
                        <span>Fit View</span>
                    </button>

                    {/* Clear Selection / Return to Fleet View */}
                    <button
                        onClick={() => onSelectDispatch && onSelectDispatch(null)}
                        className="bg-white/95 hover:bg-red-50 dark:bg-[#090e1a]/95 dark:hover:bg-red-500/10 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-lg text-xs text-slate-600 hover:text-[#F61509] dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                        title="Deselect mission and return to live fleet view"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Exit Mission</span>
                    </button>
                </div>
            ) : (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-lg text-xs">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-900 dark:text-white">Live Responders Fleet</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">({dispatches.length} active units)</span>
                    </div>
                </div>
            )}
        </div>
    );
}