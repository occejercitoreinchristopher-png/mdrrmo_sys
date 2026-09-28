import { useState, useRef, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertCircle, Activity, Calendar, Navigation, ShieldCheck, Truck, User, Clock, ChevronRight, FileText, Stethoscope, AlertTriangle } from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import StatusBadge from '@/shared/components/StatusBadge';

export interface IncidentHistoryMapProps {
    incidents?: any[];
    selectedIncident?: any;
    onSelectIncident?: (incident: any) => void;
    onViewDetails?: (incident: any) => void;
    selectedBarangays?: string[];
    barangayGeojson?: any;
    heightClass?: string;
}

export default function IncidentHistoryMap({ 
    incidents = [], 
    selectedIncident = null,
    onSelectIncident,
    onViewDetails,
    selectedBarangays = [],
    barangayGeojson = null,
    heightClass = 'h-[440px]'
}: IncidentHistoryMapProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewState, setViewState] = useState({
        longitude: 124.577, // near opol region
        latitude: 8.520,
        zoom: 12.2
    });
    const [popupInfo, setPopupInfo] = useState<any>(null);

    // Auto-resize Mapbox canvas whenever the container dimensions change
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });
        observer.observe(containerRef.current);

        const timer1 = setTimeout(() => mapRef.current?.resize(), 100);
        const timer2 = setTimeout(() => mapRef.current?.resize(), 350);

        return () => {
            observer.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    // Initial centering logic if there are incidents
    useEffect(() => {
        if (incidents.length > 0 && mapRef.current && !selectedIncident) {
            const validIncident = incidents.find(i => i.incident_longitude && i.incident_latitude && parseFloat(i.incident_latitude) > 0);
            if (validIncident) {
                setViewState(prev => ({
                    ...prev,
                    longitude: parseFloat(validIncident.incident_longitude),
                    latitude: parseFloat(validIncident.incident_latitude),
                }));
            }
        }
    }, [incidents]);

    // Fly to selected incident if specified
    useEffect(() => {
        if (selectedIncident && mapRef.current) {
            const lng = parseFloat(selectedIncident.incident_longitude);
            const lat = parseFloat(selectedIncident.incident_latitude);
            if (!isNaN(lng) && !isNaN(lat) && lat > 0 && lng > 0) {
                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    duration: 1200,
                    essential: true
                });
                setPopupInfo(selectedIncident);
            }
        }
    }, [selectedIncident]);

    // Filter GeoJSON boundary for selected barangays
    const highlightedBarangayGeojson = useMemo(() => {
        if (!barangayGeojson?.features) return null;
        if (!selectedBarangays || selectedBarangays.length === 0) {
            return null;
        }
        const normalizedSelected = selectedBarangays.map(s => s.toLowerCase().replace(/[\s-]/g, ''));
        return {
            type: 'FeatureCollection' as const,
            features: barangayGeojson.features.filter((f: any) => {
                const name = (f.properties?.name ?? '').toLowerCase().replace(/[\s-]/g, '');
                return normalizedSelected.includes(name);
            })
        };
    }, [barangayGeojson, selectedBarangays]);

    // Filter out incidents without valid coordinates
    const validIncidents = useMemo(() => {
        return incidents.filter(inc => {
            const lng = parseFloat(inc.incident_longitude);
            const lat = parseFloat(inc.incident_latitude);
            return !isNaN(lng) && !isNaN(lat) && lng > 0 && lat > 0;
        });
    }, [incidents]);

    return (
        <div 
            ref={containerRef}
            className={`w-full ${heightClass} overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-2xl relative border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-lg`}
        >
            <style>{`
                .mapboxgl-ctrl-logo { display: none !important; }
                .mapboxgl-ctrl-attrib { display: none !important; }
                .mapboxgl-popup-content { 
                    background: transparent !important; 
                    padding: 0 !important; 
                    border-radius: 20px !important; 
                    border: none !important; 
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.45) !important; 
                }
                .mapboxgl-popup-close-button {
                    color: ${isDark ? '#cbd5e1' : '#64748b'} !important;
                    font-size: 18px !important;
                    padding: 8px 12px !important;
                    z-index: 40 !important;
                    transition: color 0.15s ease !important;
                }
                .mapboxgl-popup-close-button:hover {
                    color: #f43f5e !important;
                    background: transparent !important;
                }
                .mapboxgl-popup-tip { 
                    border-top-color: ${isDark ? '#0f172a' : '#ffffff'} !important; 
                }
            `}</style>

            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                <Map
                    ref={mapRef}
                    style={{ width: '100%', height: '100%' }}
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    onLoad={() => mapRef.current?.resize()}
                    mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
                    attributionControl={false}
                >
                    {/* All 14 Barangays Base Boundary Layer */}
                    {barangayGeojson && (
                        <Source id="opol-all-barangays" type="geojson" data={barangayGeojson}>
                            <Layer
                                id="opol-all-line"
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

                    {/* Filtered / Highlighted Selected Barangays Layer */}
                    {highlightedBarangayGeojson && (
                        <Source id="opol-highlighted-barangays" type="geojson" data={highlightedBarangayGeojson}>
                            <Layer
                                id="opol-highlight-fill"
                                type="fill"
                                paint={{
                                    'fill-color': '#f43f5e',
                                    'fill-opacity': isDark ? 0.12 : 0.08,
                                }}
                            />
                            <Layer
                                id="opol-highlight-line"
                                type="line"
                                paint={{
                                    'line-color': '#f43f5e',
                                    'line-width': 2.5,
                                    'line-opacity': 0.85,
                                }}
                            />
                        </Source>
                    )}

                    {/* Incident Markers - Strictly filtered dataset */}
                    {validIncidents.map(inc => {
                        const lng = parseFloat(inc.incident_longitude);
                        const lat = parseFloat(inc.incident_latitude);
                        const isSelected = (selectedIncident?.id === inc.id) || (popupInfo?.id === inc.id);
                        const isRejected = inc.incident_status === 'rejected';

                        return (
                            <Marker 
                                key={inc.id} 
                                longitude={lng} 
                                latitude={lat} 
                                anchor="bottom"
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setPopupInfo(inc);
                                    if (onSelectIncident) {
                                        onSelectIncident(inc);
                                    }
                                }}
                            >
                                <div 
                                    className={`relative flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                                        isSelected ? 'scale-125 -translate-y-2 z-50' : 'hover:scale-115 hover:-translate-y-1 z-20'
                                    }`}
                                    title={`Incident #${inc.id} - ${inc.barangay || 'Opol'}`}
                                >
                                    {/* Hover / Selected Floating Mini Pill */}
                                    <div className={`absolute -top-7 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-lg border whitespace-nowrap transition-all duration-200 pointer-events-none ${
                                        isSelected 
                                            ? 'opacity-100 scale-100 bg-slate-950/95 text-white border-white/25 ring-2 ring-emerald-500/40' 
                                            : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 bg-slate-900/90 text-slate-100 border-white/15'
                                    }`}>
                                        #{inc.id} {inc.barangay ? `• Brgy. ${inc.barangay}` : ''}
                                    </div>

                                    {/* Pulse ring when selected */}
                                    {isSelected && (
                                        <span 
                                            className={`absolute bottom-0 w-8 h-8 rounded-full animate-ping pointer-events-none opacity-60 ${
                                                isRejected ? 'bg-rose-500' : 'bg-emerald-500'
                                            }`}
                                        />
                                    )}

                                    {/* Premium Teardrop Pin Silhouette (No Circle Background) */}
                                    <svg 
                                        width="32" 
                                        height="42" 
                                        viewBox="0 0 32 42" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] transition-all"
                                    >
                                        <defs>
                                            <linearGradient id={`pin-body-${inc.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                {isRejected ? (
                                                    <>
                                                        <stop offset="0%" stopColor="#fb7185" />
                                                        <stop offset="50%" stopColor="#e11d48" />
                                                        <stop offset="100%" stopColor="#9f1239" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <stop offset="0%" stopColor="#34d399" />
                                                        <stop offset="45%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#047857" />
                                                    </>
                                                )}
                                            </linearGradient>
                                            <radialGradient id={`pin-ground-${inc.id}`} cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                                                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                                            </radialGradient>
                                        </defs>

                                        {/* Ground Contact Shadow */}
                                        <ellipse cx="16" cy="40" rx="7" ry="2" fill={`url(#pin-ground-${inc.id})`} />

                                        {/* Teardrop Pin Body */}
                                        <path 
                                            d="M16 2C9.37 2 4 7.37 4 14C4 22.8 16 38 16 38C16 38 28 22.8 28 14C28 7.37 22.63 2 16 2Z" 
                                            fill={`url(#pin-body-${inc.id})`} 
                                            stroke="rgba(255, 255, 255, 0.95)" 
                                            strokeWidth="1.5"
                                            strokeLinejoin="round"
                                        />

                                        {/* Specular Highlight Sheen */}
                                        <path 
                                            d="M16 3.5C10.5 3.5 6 8 6 13.5C6 15.5 6.6 17.3 7.6 19C8.3 14.5 11.7 11 16 11C20.3 11 23.7 14.5 24.4 19C25.4 17.3 26 15.5 26 13.5C26 8 21.5 3.5 16 3.5Z" 
                                            fill="white" 
                                            fillOpacity="0.4" 
                                        />

                                        {/* Inner White Core */}
                                        <circle cx="16" cy="14" r="5.5" fill="#FFFFFF" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />

                                        {/* Center Dot Accent */}
                                        <circle 
                                            cx="16" 
                                            cy="14" 
                                            r="2.8" 
                                            fill={isRejected ? '#be123c' : '#047857'} 
                                        />
                                    </svg>
                                </div>
                            </Marker>
                        );
                    })}

                    {/* Interactive Marker Popup */}
                    {popupInfo && (
                        <Popup
                            anchor="top"
                            longitude={parseFloat(popupInfo.incident_longitude)}
                            latitude={parseFloat(popupInfo.incident_latitude)}
                            onClose={() => setPopupInfo(null)}
                            closeButton={true}
                            offset={14}
                        >
                            <div className="w-[310px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 font-sans">
                                {/* Header Bar */}
                                <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/90 dark:to-slate-900/90 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between pr-10">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 px-2 py-0.5 rounded-md tracking-wider">
                                            #{popupInfo.id}
                                        </span>
                                        {popupInfo.priority && (
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                                popupInfo.priority === 'Critical'
                                                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                                                    : popupInfo.priority === 'High'
                                                    ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                            }`}>
                                                {popupInfo.priority}
                                            </span>
                                        )}
                                    </div>
                                    <StatusBadge status={popupInfo.incident_status} size="xs" />
                                </div>

                                {/* Body Content */}
                                <div className="p-3.5 space-y-2.5 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                    
                                    {/* Classification & Description */}
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Classification
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mt-0.5">
                                            {popupInfo.incident_type?.name || popupInfo.incident_type || 'Emergency Incident'}
                                        </h4>
                                        {popupInfo.description && (
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 italic bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-200/60 dark:border-white/5">
                                                "{popupInfo.description}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Location & Barangay */}
                                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                                                {popupInfo.place_of_incident || popupInfo.location || popupInfo.incident_address || 'Location Unspecified'}
                                            </span>
                                            {popupInfo.barangay && (
                                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                                                    Brgy. {popupInfo.barangay}
                                                </span>
                                            )}
                                            {popupInfo.incident_latitude && popupInfo.incident_longitude && (
                                                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                    {parseFloat(popupInfo.incident_latitude).toFixed(4)}° N, {parseFloat(popupInfo.incident_longitude).toFixed(4)}° E
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* PCR Chief Complaint Banner */}
                                    {popupInfo.pcr_chief_complaint ? (
                                        <div className="p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-500/25">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                                <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                <span>PCR Chief Complaint</span>
                                            </div>
                                            <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100 mt-1">
                                                {popupInfo.pcr_chief_complaint}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                            <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span>PCR record not attached</span>
                                        </div>
                                    )}

                                    {/* Dispatched Unit & Responder Crew */}
                                    {popupInfo.dispatches && popupInfo.dispatches.length > 0 && (
                                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span>Response Mission</span>
                                            </div>
                                            {popupInfo.dispatches[0].ambulance && (
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                                    <span>{popupInfo.dispatches[0].ambulance.name}</span>
                                                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200/60 dark:border-white/10">
                                                        {popupInfo.dispatches[0].ambulance.plate_number}
                                                    </span>
                                                </div>
                                            )}
                                            {popupInfo.dispatches[0].driver && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {popupInfo.dispatches[0].driver.responder_profile?.profile_picture ? (
                                                        <img
                                                            src={`/storage/${popupInfo.dispatches[0].driver.responder_profile.profile_picture}`}
                                                            alt="Responder"
                                                            className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-white/10"
                                                        />
                                                    ) : popupInfo.dispatches[0].driver.profile_picture ? (
                                                        <img
                                                            src={`/storage/${popupInfo.dispatches[0].driver.profile_picture}`}
                                                            alt="Responder"
                                                            className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-white/10"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-white/10">
                                                            <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                                        Driver: {popupInfo.dispatches[0].driver.first_name} {popupInfo.dispatches[0].driver.last_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Timestamps */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {popupInfo.reported_at ? new Date(popupInfo.reported_at).toLocaleDateString('en-PH', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : '—'}
                                        </span>
                                        {popupInfo.resolved_at && (
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                <Clock className="w-3 h-3" />
                                                Resolved
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Button: View Dossier */}
                                    {onViewDetails && (
                                        <button
                                            onClick={() => onViewDetails(popupInfo)}
                                            className="w-full mt-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-rose-600/35 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Open Incident Dossier</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    Mapbox Token Missing
                </div>
            )}

            {/* Floating Telemetry & Marker Counter Pill */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-md">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                        {validIncidents.length} {validIncidents.length === 1 ? 'Incident Marker' : 'Incident Markers'}
                    </span>
                    {selectedBarangays.length > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 ml-1">
                            ({selectedBarangays.length} {selectedBarangays.length === 1 ? 'Barangay' : 'Barangays'} selected)
                        </span>
                    )}
                </div>
            </div>

            {/* Zero results overlay banner */}
            {validIncidents.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-4">
                    <div className="px-5 py-3 rounded-2xl bg-slate-900/85 text-white backdrop-blur-md shadow-2xl border border-white/10 text-center max-w-sm">
                        <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold">No Map Markers Match Selected Filters</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                            Try adjusting or resetting the Barangay and PCR Chief Complaint filters.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
