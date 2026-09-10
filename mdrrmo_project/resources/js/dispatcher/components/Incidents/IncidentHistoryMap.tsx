import { useState, useRef, useEffect } from 'react';
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertCircle } from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';

export default function IncidentHistoryMap({ incidents = [], selectedIncident = null }: { incidents?: any[], selectedIncident?: any }) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState({
        longitude: 124.577, // near opol region
        latitude: 8.520,
        zoom: 12
    });
    const [popupInfo, setPopupInfo] = useState<any>(null);

    // Initial centering logic if there are incidents
    useEffect(() => {
        if (incidents.length > 0 && mapRef.current && !selectedIncident) {
            // center on the first one just for a rough starting point if default isn't good
            const validIncident = incidents.find(i => i.incident_longitude && i.incident_latitude);
            if (validIncident) {
                setViewState(prev => ({
                    ...prev,
                    longitude: parseFloat(validIncident.incident_longitude),
                    latitude: parseFloat(validIncident.incident_latitude),
                    zoom: 12
                }));
            }
        }
    }, [incidents]);

    useEffect(() => {
        if (selectedIncident && mapRef.current) {
            const lng = parseFloat(selectedIncident.incident_longitude);
            const lat = parseFloat(selectedIncident.incident_latitude);
            if (!isNaN(lng) && !isNaN(lat)) {
                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    duration: 1500,
                    essential: true
                });
                setPopupInfo(selectedIncident);
            }
        }
    }, [selectedIncident]);

    return (
        <div className="w-full h-[500px] overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-2xl relative mb-6 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-lg">
            <style>{`
                .mapboxgl-ctrl-logo { display: none !important; }
                .mapboxgl-ctrl-attrib { display: none !important; }
                .mapboxgl-popup-content { background: ${isDark ? '#1E293B' : '#FFFFFF'} !important; color: ${isDark ? '#ffffff' : '#0f172a'} !important; border: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; border-radius: 8px; padding: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                .mapboxgl-popup-tip { border-top-color: ${isDark ? '#1E293B' : '#FFFFFF'} !important; }
            `}</style>
            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                <Map
                    ref={mapRef}
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
                    attributionControl={false}
                >
                    {incidents.map(inc => {
                        const lng = parseFloat(inc.incident_longitude);
                        const lat = parseFloat(inc.incident_latitude);
                        if (isNaN(lng) || isNaN(lat)) return null;
                        
                        const isSelected = selectedIncident?.id === inc.id;
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
                                }}
                            >
                                <div className={`p-1.5 rounded-full shadow-lg transition-transform transform cursor-pointer ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10'} ${isRejected ? 'bg-rose-500/80 shadow-rose-500/50' : 'bg-emerald-500/80 shadow-emerald-500/50'}`}>
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                            </Marker>
                        );
                    })}

                    {popupInfo && (
                        <Popup
                            anchor="top"
                            longitude={parseFloat(popupInfo.incident_longitude)}
                            latitude={parseFloat(popupInfo.incident_latitude)}
                            onClose={() => setPopupInfo(null)}
                            closeButton={false}
                            offset={10}
                        >
                            <div className="flex flex-col gap-1 min-w-[160px]">
                                <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Incident #{popupInfo.id}
                                </span>
                                <span className="text-xs text-slate-400 capitalize">{popupInfo.incident_status}</span>
                                <span className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                    {popupInfo.description || 'No description provided.'}
                                </span>
                            </div>
                        </Popup>
                    )}
                </Map>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    Mapbox Token Missing
                </div>
            )}
        </div>
    );
}
