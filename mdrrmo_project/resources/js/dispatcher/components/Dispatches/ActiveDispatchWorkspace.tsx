import { useState, useEffect, useCallback, useContext } from 'react';
import { router } from '@inertiajs/react';
import { AlertCircle, MapPin, Truck, User as UserIcon, Clock, Search, ShieldAlert, Activity, Stethoscope, FileText, ChevronDown, Maximize2, X, CheckCircle, XCircle, Compass, Navigation, AlertTriangle } from 'lucide-react';
import { AlarmContext } from '../../contexts/AlarmContext';
import StatusBadge from '@/shared/components/StatusBadge';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import LiveMonitoringMap, { type RouteTelemetry } from './LiveMonitoringMap';
import DispatchTimeline from './DispatchTimeline';
import CreateDispatchModal from './CreateDispatchModal';

export default function ActiveDispatchWorkspace({ 
    dispatches = [], 
    verifiedIncidents = [],
    ambulances = [],
    responders = [],
    pagination = null, 
    selectedIncidentId = null 
}: {
    dispatches?: any[];
    verifiedIncidents?: any[];
    ambulances?: any[];
    responders?: any[];
    pagination?: any;
    selectedIncidentId?: string | number | null;
}) {
    const [search, setSearch] = useState('');
    const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState('incident');
    const [isExpanded, setIsExpanded] = useState(false);
    const [assigningIncident, setAssigningIncident] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { activeAlarm, acknowledgeAlarm } = useContext(AlarmContext);

    const [currentTime, setCurrentTime] = useState(Date.now());
    const [routeTelemetry, setRouteTelemetry] = useState<Record<string | number, RouteTelemetry>>({});
    const [liveLocations, setLiveLocations] = useState<Record<string | number, any>>(() => {
        const initial: Record<string | number, any> = {};
        dispatches.forEach(d => {
            const lat = parseFloat(d.last_latitude);
            const lng = parseFloat(d.last_longitude);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                const loc = {
                    latitude: lat,
                    longitude: lng,
                    heading: d.last_heading ? parseFloat(d.last_heading) : null,
                    accuracy: d.last_accuracy ? parseFloat(d.last_accuracy) : null,
                    timestamp: d.last_location_updated_at,
                    updatedAt: d.last_location_updated_at ? new Date(d.last_location_updated_at).getTime() : Date.now(),
                };
                initial[d.id] = loc;
                if (d.ambulance_id) initial[d.ambulance_id] = loc;
            }
        });
        return initial;
    });

    // 5-second ticker to increment 'Last updated X seconds ago' and 10-second background sync fallback
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
        const pollTimer = setInterval(() => {
            router.reload({ only: ['dispatches'] });
        }, 10000);
        return () => {
            clearInterval(timer);
            clearInterval(pollTimer);
        };
    }, []);

    // Echo listener for real-time responder coordinates
    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');

            channel.listen('AmbulanceLocationUpdated', (e: any) => {
                const lat = parseFloat(e.latitude ?? e.ambulance?.latitude);
                const lng = parseFloat(e.longitude ?? e.ambulance?.longitude);
                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const locData = {
                        latitude: lat,
                        longitude: lng,
                        heading: e.heading ? parseFloat(e.heading) : null,
                        accuracy: e.accuracy ? parseFloat(e.accuracy) : null,
                        timestamp: e.timestamp || new Date().toISOString(),
                        updatedAt: Date.now(),
                        responder_name: e.responder_name,
                    };
                    setLiveLocations(prev => ({
                        ...prev,
                        ...(e.dispatch_id ? { [e.dispatch_id]: locData } : {}),
                        ...(e.ambulance_id ? { [e.ambulance_id]: locData } : {}),
                        ...(e.ambulance?.id ? { [e.ambulance.id]: locData } : {}),
                    }));
                }
            });

            return () => {
                channel.stopListening('AmbulanceLocationUpdated');
            };
        }
    }, []);

    // Keep liveLocations synchronized whenever dispatches prop updates with coordinates
    useEffect(() => {
        dispatches.forEach(d => {
            const lat = parseFloat(d.last_latitude);
            const lng = parseFloat(d.last_longitude);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                const loc = {
                    latitude: lat,
                    longitude: lng,
                    heading: d.last_heading ? parseFloat(d.last_heading) : null,
                    accuracy: d.last_accuracy ? parseFloat(d.last_accuracy) : null,
                    timestamp: d.last_location_updated_at,
                    updatedAt: d.last_location_updated_at ? new Date(d.last_location_updated_at).getTime() : Date.now(),
                };
                setLiveLocations(prev => {
                    const existing = prev[d.id];
                    if (!existing || !existing.updatedAt || loc.updatedAt >= existing.updatedAt) {
                        return {
                            ...prev,
                            [d.id]: loc,
                            ...(d.ambulance_id ? { [d.ambulance_id]: loc } : {})
                        };
                    }
                    return prev;
                });
            }
        });
    }, [dispatches]);

    const handleRouteTelemetryChange = useCallback((dispatchId: number | string, telemetry: RouteTelemetry) => {
        setRouteTelemetry(prev => ({
            ...prev,
            [dispatchId]: telemetry
        }));
    }, []);

    const getConnectionStatus = (dispatch: any) => {
        if (!dispatch) return { status: 'unavailable', label: 'Location update unavailable', color: 'text-slate-400 bg-slate-400/10 border-slate-500/20', isLive: false };
        let loc = liveLocations[dispatch.id] || liveLocations[dispatch.ambulance_id];
        if (!loc && dispatch.last_latitude && dispatch.last_longitude) {
            loc = {
                latitude: parseFloat(dispatch.last_latitude),
                longitude: parseFloat(dispatch.last_longitude),
                updatedAt: dispatch.last_location_updated_at ? new Date(dispatch.last_location_updated_at).getTime() : Date.now(),
            };
        }
        if (!loc || !loc.updatedAt) {
            return { status: 'unavailable', label: 'Location update unavailable', color: 'text-slate-400 bg-slate-400/10 border-slate-500/20', isLive: false };
        }
        const elapsedSeconds = Math.max(0, Math.floor((currentTime - loc.updatedAt) / 1000));
        if (elapsedSeconds <= 30) {
            return { status: 'live', label: 'Live Tracking', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', isLive: true };
        }
        if (elapsedSeconds <= 90) {
            return { status: 'stale', label: `Last updated ${elapsedSeconds}s ago`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', isLive: false };
        }
        const minutes = Math.floor(elapsedSeconds / 60);
        return { status: 'stale', label: `Last updated ${minutes}m ago`, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', isLive: false };
    };

    const handleForceResolve = (dispatch: any) => {
        if (!dispatch) return;
        if (confirm(`Force resolve mission #${dispatch.id}? This will complete the dispatch, resolve the incident, and release the deployed unit.`)) {
            setActionLoading(true);
            router.post(`/dispatcher/dispatches/${dispatch.id}/resolve`, {}, {
                onFinish: () => {
                    setActionLoading(false);
                    setSelectedDispatch(null);
                }
            });
        }
    };

    const handleCancelDispatch = (dispatch: any) => {
        if (!dispatch) return;
        if (confirm(`Cancel mission #${dispatch.id}? This will release the crew/ambulance and cancel this emergency request.`)) {
            setActionLoading(true);
            router.post(`/dispatcher/dispatches/${dispatch.id}/cancel`, { revert_incident: false }, {
                onFinish: () => {
                    setActionLoading(false);
                    setSelectedDispatch(null);
                }
            });
        }
    };

    useEffect(() => {
        if (selectedIncidentId) {
            const dispatch = dispatches.find(d => d.incident_id == selectedIncidentId);
            if (dispatch) {
                setSelectedDispatch(dispatch);
                setIsExpanded(true); // Auto-expand if opened via URL
            }
            window.history.replaceState({}, '', '/dispatcher/dispatches');
        }
    }, [selectedIncidentId, dispatches]);

    // Keep selectedDispatch synchronized with latest dispatches or clear if completed
    useEffect(() => {
        if (selectedDispatch) {
            const fresh = dispatches.find(d => d.id === selectedDispatch.id);
            if (!fresh) {
                setSelectedDispatch(null);
            } else if (fresh.dispatch_status !== selectedDispatch.dispatch_status || fresh.updated_at !== selectedDispatch.updated_at) {
                setSelectedDispatch(fresh);
            }
        }
    }, [dispatches, selectedDispatch]);

    // Toggle or set selected dispatch
    const handleSelectDispatch = (dispatch: any) => {
        if (!dispatch) {
            setSelectedDispatch(null);
            setIsExpanded(false);
            return;
        }

        if (selectedDispatch && selectedDispatch.id === dispatch.id) {
            // Clicking the active responder again clears selection
            setSelectedDispatch(null);
            setIsExpanded(false);
        } else {
            setSelectedDispatch(dispatch);
            setIsExpanded(false);
            setActiveTab('incident');
        }
    };

    const filtered = dispatches.filter((d) => {
        const q = search.toLowerCase();
        return (
            !q ||
            String(d.id).includes(q) ||
            d.ambulance?.plate_number?.toLowerCase().includes(q) ||
            (d.teamLeader?.first_name + ' ' + d.teamLeader?.last_name).toLowerCase().includes(q) ||
            d.incident?.incident_type?.name?.toLowerCase().includes(q) ||
            d.incident?.barangay?.toLowerCase().includes(q)
        );
    });

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const crew = selectedDispatch ? [
        { role: 'Driver', user: selectedDispatch.driver },
        { role: 'Team Leader', user: selectedDispatch.teamLeader },
        { role: 'EMT', user: selectedDispatch.emt }
    ] : [];

    return (
        <div className="h-screen max-h-screen flex flex-col pb-6 max-w-[1800px] mx-auto overflow-hidden">
            <div className="shrink-0 mb-4">
                <PageHeader 
                    title="Operations Workspace" 
                    subtitle="Live command center for active emergency response tracking." 
                />
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
                
                {/* LEFT COLUMN: Dispatch List (3/12 width) - Compacted slightly to give map more room */}
                <div className="xl:col-span-3 flex flex-col h-full bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-sm dark:shadow-2xl overflow-hidden relative z-10">
                    {/* Header & Search */}
                    <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                            Active Responses
                            <span className="ml-auto bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs py-1 px-2.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                {dispatches.length} Live
                            </span>
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Search unit or location..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    {/* Cards List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        
                        {/* Pending Assignments Section */}
                        {verifiedIncidents.length > 0 && (
                            <div className="space-y-3 mb-6">
                                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5" /> Pending Assignment ({verifiedIncidents.length})
                                </h3>
                                {verifiedIncidents.map(incident => {
                                    const isAlarming = activeAlarm && activeAlarm.id === incident.id;
                                    return (
                                        <div 
                                            key={`vi-${incident.id}`} 
                                            onClick={isAlarming ? acknowledgeAlarm : undefined}
                                            className={`rounded-xl p-4 transition-all duration-300 ${
                                                isAlarming 
                                                    ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 animate-pulse cursor-pointer shadow-lg shadow-red-500/30'
                                                    : 'bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-lg'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`font-mono text-sm font-semibold ${isAlarming ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    #{incident.id}
                                                </span>
                                                <StatusBadge status={incident.incident_status} />
                                            </div>
                                            <h3 className={`${isAlarming ? 'text-red-900 dark:text-red-100 font-bold' : 'text-slate-900 dark:text-white font-medium'} text-sm mb-1`}>
                                                {incident.incident_type?.name}
                                            </h3>
                                            <div className={`text-xs flex items-start gap-1.5 mb-3 ${isAlarming ? 'text-red-700/80 dark:text-red-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{incident.description || 'No description'}</span>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="primary" 
                                                className={`w-full text-white border-none ${
                                                    isAlarming 
                                                        ? 'bg-red-600 hover:bg-red-700' 
                                                        : 'bg-amber-600 hover:bg-amber-500'
                                                }`}
                                                onClick={() => {
                                                    if (isAlarming) acknowledgeAlarm();
                                                    setAssigningIncident(incident);
                                                }}
                                            >
                                                Assign Crew
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                                Active Dispatches
                            </h3>
                            <span className="text-[11px] text-slate-400">
                                {filtered.length} active
                            </span>
                        </div>
                        {!selectedDispatch && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
                                Select any responder below or on the map to display their live route, incident pin, and ETA.
                            </p>
                        )}

                        {/* Selected Dispatch Live Mission Tracker in Sidebar */}
                        {selectedDispatch && (
                            <div className="bg-slate-900 rounded-2xl border border-primary/40 p-4 space-y-3.5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-400" />
                                
                                {/* Header with Close and Connection Status */}
                                <div className="flex items-start justify-between gap-2 pt-1">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded border border-primary/30">
                                                MISSION #{selectedDispatch.id}
                                            </span>
                                            <StatusBadge status={selectedDispatch.dispatch_status} />
                                        </div>
                                        <div className="text-sm font-semibold text-white truncate max-w-[200px]">
                                            {selectedDispatch.incident?.incident_type?.name}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedDispatch(null)}
                                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                                        title="Deselect Mission"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Live GPS Link Status */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">GPS Telemetry</span>
                                    {(() => {
                                        const conn = getConnectionStatus(selectedDispatch);
                                        return (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${conn.color}`}>
                                                {conn.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                {conn.label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Q1: Where is the incident? */}
                                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-rose-400" /> 1. Incident Location
                                        </span>
                                        {selectedDispatch.incident?.priority && (
                                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(selectedDispatch.incident.priority)}`}>
                                                {selectedDispatch.incident.priority}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-200 font-medium">
                                        {selectedDispatch.incident?.barangay || selectedDispatch.incident?.place_of_incident || 'Reported Location'}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400">
                                        GPS: {parseFloat(selectedDispatch.incident?.incident_latitude)?.toFixed(5) || '--'}, {parseFloat(selectedDispatch.incident?.incident_longitude)?.toFixed(5) || '--'}
                                    </div>
                                </div>

                                {/* Q2: Where is the responder now? */}
                                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                                            <Truck className="w-3.5 h-3.5 text-blue-400" /> 2. Responder Location
                                        </span>
                                        <span className="text-[10px] font-mono font-medium text-slate-300">
                                            {selectedDispatch.ambulance?.plate_number}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">
                                            {selectedDispatch.driver ? `${selectedDispatch.driver.first_name} ${selectedDispatch.driver.last_name} (Driver)` : (selectedDispatch.teamLeader ? `${selectedDispatch.teamLeader.first_name} ${selectedDispatch.teamLeader.last_name} (TL)` : 'Assigned Crew')}
                                        </span>
                                    </div>
                                    {(() => {
                                        let loc = liveLocations[selectedDispatch.id] || liveLocations[selectedDispatch.ambulance_id];
                                        if ((!loc || !loc.latitude) && selectedDispatch.last_latitude && selectedDispatch.last_longitude) {
                                            loc = {
                                                latitude: parseFloat(selectedDispatch.last_latitude),
                                                longitude: parseFloat(selectedDispatch.last_longitude),
                                                heading: selectedDispatch.last_heading ? parseFloat(selectedDispatch.last_heading) : null,
                                            };
                                        }
                                        if (loc && loc.latitude && loc.longitude) {
                                            return (
                                                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                                                    <span>GPS: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</span>
                                                    {loc.heading ? <span>• {Math.round(loc.heading)}°</span> : null}
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="text-[10px] text-slate-500 italic">
                                                Awaiting responder device GPS link...
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Q3 & Q4: Route & How close are they (Distance & ETA)? */}
                                {selectedDispatch.dispatch_status === 'arrived_on_scene' ? (
                                    <div className="bg-emerald-950/70 border border-emerald-500/30 rounded-xl p-3 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 3 & 4. Mission Status
                                            </span>
                                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                                                Arrived
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-200 font-medium">
                                            Responder is currently on scene at the incident.
                                        </div>
                                        <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 pt-0.5">
                                            <CheckCircle className="w-3 h-3" /> Navigation completed
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                                <Navigation className="w-3.5 h-3.5 text-amber-400" /> 3 & 4. Route & Proximity
                                            </span>
                                            {routeTelemetry[selectedDispatch.id]?.isOffRoute && (
                                                <span className="text-[9px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                                                    <AlertTriangle className="w-2.5 h-2.5" /> Off-Route
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                                                <div className="text-[10px] text-slate-400 font-medium">Est. Arrival</div>
                                                <div className="text-base font-bold font-mono text-amber-400 flex items-center gap-1 mt-0.5 truncate">
                                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>{routeTelemetry[selectedDispatch.id]?.formattedEta || 'Calculating...'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                                                <div className="text-[10px] text-slate-400 font-medium">Road Distance</div>
                                                <div className="text-base font-bold font-mono text-blue-400 flex items-center gap-1 mt-0.5 truncate">
                                                    <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                    <span>{routeTelemetry[selectedDispatch.id]?.formattedDistance || '--'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                                <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                                <p>No active dispatches.</p>
                            </div>
                        ) : (
                            filtered.map((dispatch) => {
                                const isSelected = selectedDispatch?.id === dispatch.id;
                                const incident = dispatch.incident;
                                const etaStr = routeTelemetry[dispatch.id]?.formattedEta;
                                
                                return (
                                    <div 
                                        key={dispatch.id}
                                        onClick={() => handleSelectDispatch(dispatch)}
                                        className={`group cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-300 ${
                                            isSelected 
                                                ? 'bg-slate-50 dark:bg-slate-800/80 border-primary shadow-sm dark:shadow-lg shadow-primary/20 scale-[1.02] z-10' 
                                                : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-white/10'
                                        }`}
                                    >
                                        {/* Highlight Accent */}
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(var(--color-primary),1)]" />}

                                        <div className="p-4 pl-5">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                        #{dispatch.id}
                                                    </span>
                                                </div>
                                                <StatusBadge status={dispatch.dispatch_status} />
                                            </div>

                                            <div className="mb-3">
                                                <h3 className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2 line-clamp-1">
                                                    <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                                    {incident?.incident_type?.name}
                                                </h3>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 mt-1">
                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                                                    <span className="line-clamp-1">{incident?.barangay}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
                                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/50 px-2 py-1 rounded-md border border-slate-200 dark:border-white/5">
                                                    <Truck className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{dispatch.ambulance?.plate_number}</span>
                                                </div>
                                                {dispatch.dispatch_status === 'arrived_on_scene' ? (
                                                    <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold tracking-wider uppercase">
                                                            On Scene
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold tracking-wider uppercase">
                                                            {etaStr ? `ETA ${etaStr}` : 'ETA Live'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Full-Height Live Map (9/12 width) */}
                <div className="xl:col-span-9 flex flex-col h-full relative rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 z-0">
                    
                    {/* The Map itself takes up the entire container */}
                    <div className="absolute inset-0">
                        <LiveMonitoringMap 
                            dispatches={filtered} 
                            selectedDispatch={selectedDispatch}
                            liveLocations={liveLocations}
                            onRouteTelemetryChange={handleRouteTelemetryChange}
                            onSelectDispatch={handleSelectDispatch}
                        />
                    </div>

                    {/* Floating Dispatch Overlay (Bottom Right) */}
                    {selectedDispatch && (
                        <div className={`absolute bottom-6 right-6 z-20 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col bg-white/95 dark:bg-slate-950/85 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto ${
                            isExpanded ? 'w-[550px] h-[650px]' : 'w-[420px] h-[200px]'
                        }`}>
                            
                            {/* Compact Summary Header (Always visible) */}
                            <div className="p-5 border-b border-slate-200 dark:border-white/5 shrink-0 bg-gradient-to-b from-slate-50 dark:from-slate-900/50 to-transparent">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">#{selectedDispatch.id}</span>
                                            {selectedDispatch.incident?.priority && (
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(selectedDispatch.incident.priority)}`}>
                                                    {selectedDispatch.incident.priority}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-slate-900 dark:text-white font-medium flex items-center gap-2 text-lg">
                                            <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            {selectedDispatch.incident?.incident_type?.name}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const conn = getConnectionStatus(selectedDispatch);
                                                return (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${conn.color}`}>
                                                        {conn.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                        {conn.label}
                                                    </span>
                                                );
                                            })()}
                                            <StatusBadge status={selectedDispatch.dispatch_status} />
                                        </div>
                                        <button 
                                            onClick={() => setSelectedDispatch(null)}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{selectedDispatch.ambulance?.plate_number}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{selectedDispatch.teamLeader?.first_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    {selectedDispatch.dispatch_status === 'arrived_on_scene' ? (
                                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            <span>Arrived on Scene</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {routeTelemetry[selectedDispatch.id]?.formattedEta 
                                                    ? `ETA ${routeTelemetry[selectedDispatch.id].formattedEta}` 
                                                    : 'ETA Live'}
                                            </span>
                                            {routeTelemetry[selectedDispatch.id]?.formattedDistance && (
                                                <span className="text-xs text-amber-400/70 border-l border-amber-400/30 pl-1.5">
                                                    {routeTelemetry[selectedDispatch.id].formattedDistance}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex-1 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        {isExpanded ? 'Collapse' : 'Details'}
                                    </button>
                                    <button
                                        onClick={() => handleForceResolve(selectedDispatch)}
                                        disabled={actionLoading}
                                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                        title="Mark Mission as Resolved"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleCancelDispatch(selectedDispatch)}
                                        disabled={actionLoading}
                                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                        title="Cancel Mission and Revert Incident"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Cancel
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Tabbed Content */}
                            <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                                {/* Tab Navigation */}
                                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 hide-scrollbar pt-1 px-2 shrink-0">
                                    {[
                                        { id: 'incident', icon: AlertCircle, label: 'Incident' },
                                        { id: 'crew', icon: Truck, label: 'Crew' },
                                        { id: 'timeline', icon: Clock, label: 'Timeline' },
                                        { id: 'patient', icon: Stethoscope, label: 'Patient' },
                                        { id: 'notes', icon: FileText, label: 'Logs' }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)} 
                                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                                                activeTab === tab.id 
                                                    ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-t-lg'
                                            }`}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Area */}
                                <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-900/30 custom-scrollbar">
                                    
                                    {activeTab === 'incident' && (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-3">
                                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2 mb-2">Emergency Info</h3>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Incident ID</span>
                                                    <span className="font-mono text-slate-900 dark:text-white font-medium">#{selectedDispatch.incident_id}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Location</span>
                                                    <span className="text-slate-900 dark:text-white text-right max-w-[250px] truncate">{selectedDispatch.incident?.barangay}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Time Reported</span>
                                                    <span className="text-slate-900 dark:text-white">{new Date(selectedDispatch.incident?.created_at).toLocaleString('en-PH')}</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-3">
                                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2 mb-2">Reporter Info</h3>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Name</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{selectedDispatch.incident?.resident?.first_name} {selectedDispatch.incident?.resident?.last_name}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Contact</span>
                                                    <span className="text-slate-900 dark:text-white font-mono">{selectedDispatch.incident?.resident?.phone_number || 'N/A'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 pt-2">
                                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Remarks</span>
                                                    <p className="text-slate-700 dark:text-slate-300 text-sm bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-white/5 leading-relaxed">
                                                        {selectedDispatch.incident?.description || 'No description provided.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'crew' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                                                    <Truck className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-primary/80 font-medium uppercase tracking-wider mb-0.5">Deployed Unit</div>
                                                    <div className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                                                        {selectedDispatch.ambulance?.plate_number}
                                                    </div>
                                                </div>
                                            <div className="ml-auto">
                                                    <StatusBadge status={selectedDispatch.ambulance?.status || 'dispatched'} />
                                                </div>
                                            </div>

                                             <div className="grid gap-3">
                                                 {crew.map((c, i) => {
                                                     const isBorrowed = Boolean(
                                                         selectedDispatch.borrowed_crew?.some((b: any) => b.user_id === c.user?.id) ||
                                                         (c.user?.responder_profile?.team && selectedDispatch.team && c.user.responder_profile.team !== selectedDispatch.team)
                                                     );
                                                     const borrowedInfo = selectedDispatch.borrowed_crew?.find((b: any) => b.user_id === c.user?.id);
                                                     const permTeam = borrowedInfo?.permanent_team || c.user?.responder_profile?.team;

                                                     return (
                                                         <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between gap-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                             <div className="flex items-center gap-3 min-w-0">
                                                                 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                                                     <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                                 </div>
                                                                 <div className="min-w-0">
                                                                     <div className="text-[10px] text-primary/80 uppercase tracking-widest font-bold mb-0.5">{c.role}</div>
                                                                     <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.user ? `${c.user.first_name} ${c.user.last_name}` : 'Not assigned'}</div>
                                                                     {permTeam && (
                                                                         <div className="text-[10px] text-slate-500">
                                                                             Permanent Crew: {permTeam.startsWith('Team ') ? permTeam : `Team ${permTeam}`}
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                             {isBorrowed && (
                                                                 <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40">
                                                                     Borrowed
                                                                 </span>
                                                             )}
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     )}

                                    {activeTab === 'timeline' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-5 border border-slate-200 dark:border-white/5 h-full">
                                            <DispatchTimeline dispatch={selectedDispatch} open={true} inlineMode={true} />
                                        </div>
                                    )}

                                    {activeTab === 'patient' && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-10">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
                                                <Stethoscope className="w-6 h-6 opacity-50 text-emerald-500 dark:text-emerald-400" />
                                            </div>
                                            <p className="text-base font-medium text-slate-900 dark:text-white mb-2">No Patient Records</p>
                                            <p className="text-xs max-w-[250px] text-center leading-relaxed">Patient Care Records (PCR) will automatically populate here once submitted by the responding crew.</p>
                                        </div>
                                    )}

                                    {activeTab === 'notes' && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-10">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
                                                <FileText className="w-6 h-6 opacity-50 text-blue-500 dark:text-blue-400" />
                                            </div>
                                            <p className="text-base font-medium text-slate-900 dark:text-white mb-2">Operational Logs Empty</p>
                                            <p className="text-xs max-w-[250px] text-center leading-relaxed">Any field remarks or dispatcher notes will be securely logged here for post-incident review.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            <CreateDispatchModal 
                open={!!assigningIncident}
                onClose={() => setAssigningIncident(null)}
                incident={assigningIncident}
                ambulances={ambulances}
                responders={responders}
            />
        </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
