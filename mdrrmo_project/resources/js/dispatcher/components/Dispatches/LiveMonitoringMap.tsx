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
        dispatchId: number | string
    ) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        setIsCalculatingRoute(true);

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
        }
    }, [onRouteTelemetryChange]);

    // Off-route detection & smart route recalculation for active dispatch
    useEffect(() => {
        if (!activeDispatch) {
            setRouteGeojson(null);
            activeRouteRef.current = null;
            setIsOffRoute(false);
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
            setRouteGeojson(null);
            activeRouteRef.current = null;
            return;
        }

        const currentRoute = activeRouteRef.current;
        const isNewDispatch = prevActiveIdRef.current !== dispatchId;
        prevActiveIdRef.current = dispatchId;

        // If no route yet or active dispatch changed: calculate initial route
        if (!currentRoute || isNewDispatch || currentRoute.dispatchId !== dispatchId) {
            calculateRoute(responderLoc.longitude, responderLoc.latitude, incLon, incLat, dispatchId);
            return;
        }

        // Check if responder is off-route:
        // Compare responder's current position to the polyline of the active route
        const deviationDistance = distanceToPolylineInMeters(
            responderLoc.longitude,
            responderLoc.latitude,
            currentRoute.coordinates
        );

        const OFF_ROUTE_THRESHOLD_METERS = 50;

        if (deviationDistance > OFF_ROUTE_THRESHOLD_METERS) {
            // Significant deviation detected: recalculate new route
            setIsOffRoute(true);
            calculateRoute(responderLoc.longitude, responderLoc.latitude, incLon, incLat, dispatchId);
        } else {
            // On route: DO NOT recalculate route!
            setIsOffRoute(false);
        }
    }, [activeDispatch, liveLocations, getResponderLocation, calculateRoute, onRouteTelemetryChange]);

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
                                        <div className="flex flex-col items-center group cursor-pointer">
                                            <div className="px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] shadow-lg uppercase tracking-wider mb-1 flex items-center gap-1.5 border transition-all bg-[#F61509] border-red-300 scale-105 shadow-[#F61509]/40 ring-2 ring-[#F61509]/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                <span>INCIDENT #{dispatch.incident_id || dispatch.id}</span>
                                            </div>
                                            <div className="relative flex items-center justify-center">
                                                <span className="absolute w-8 h-8 rounded-full bg-[#F61509]/40 animate-ping" />
                                                <div className="p-2 rounded-full border-2 border-white shadow-xl transition-all bg-[#F61509] scale-110">
                                                    <MapPin className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </Marker>
                                )}

                                {/* 🔵 RESPONDER / DRIVER LIVE LOCATION MARKER (Updates live as responder moves) */}
                                {responderLoc && (
                                    <Marker 
                                        longitude={responderLoc.longitude} 
                                        latitude={responderLoc.latitude}
                                        anchor="center"
                                        onClick={(e) => {
                                            e.originalEvent?.preventDefault();
                                            e.originalEvent?.stopPropagation();
                                            if (onSelectDispatch) onSelectDispatch(dispatch);
                                        }}
                                    >
                                        <div className="flex flex-col items-center group cursor-pointer">
                                            <div className={`px-2 py-0.5 rounded-full text-white font-bold text-[10px] shadow-md uppercase tracking-wider mb-1 flex items-center gap-1 border transition-all whitespace-nowrap ${
                                                isSelected 
                                                    ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-600/50 ring-2 ring-blue-500/30' 
                                                    : 'bg-slate-800/90 border-slate-600 text-slate-300 hover:bg-slate-700'
                                            }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span>{dispatch.ambulance?.plate_number || (dispatch.driver ? `${dispatch.driver.first_name} ${dispatch.driver.last_name}` : 'Responder')}</span>
                                            </div>
                                            <div className="relative flex items-center justify-center">
                                                {isSelected && (
                                                    <span className="absolute w-10 h-10 rounded-full bg-blue-500/30 animate-pulse" />
                                                )}
                                                <div 
                                                    className={`p-2 rounded-full border-2 border-white shadow-xl text-white transition-all transform duration-500 ${
                                                        isSelected ? 'bg-blue-600 scale-110 shadow-blue-500/50' : 'bg-slate-700/90 scale-95 group-hover:scale-105'
                                                    }`}
                                                    style={{ 
                                                        transform: responderLoc.heading ? `rotate(${responderLoc.heading}deg)` : undefined 
                                                    }}
                                                >
                                                    <Truck className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </Marker>
                                )}
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