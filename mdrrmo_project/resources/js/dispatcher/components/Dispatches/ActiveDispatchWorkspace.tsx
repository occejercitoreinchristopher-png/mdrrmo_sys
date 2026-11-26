import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    AlertCircle, MapPin, Truck, User as UserIcon, Users, Clock, Search, ShieldAlert, 
    Activity, Stethoscope, FileText, ChevronDown, ChevronUp, Maximize2, X, CheckCircle, 
    XCircle, AlertTriangle, ExternalLink, Radio, Shield, 
    Flame, Car, Phone, Eye, Sparkles, Filter, Check, HeartPulse, Send, Building2,
    CheckCircle2
} from 'lucide-react';
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
    const [viewFilter, setViewFilter] = useState<'all' | 'pending' | 'dispatched' | 'fleet'>('all');
    const [focusedTarget, setFocusedTarget] = useState<{ longitude: number; latitude: number; zoom?: number; key?: string | number } | null>(null);
    const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState('incident');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverlayMinimized, setIsOverlayMinimized] = useState(false);
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

    // 5-second ticker to increment 'Last updated X seconds ago' and 8-second background sync fallback with overlap guard
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
        let isPolling = false;
        const pollTimer = setInterval(() => {
            if (isPolling) return; // Prevent request pile-up during slow network latency
            isPolling = true;
            router.reload({
                only: ['dispatches', 'verifiedIncidents', 'ambulances', 'responders'],
                onFinish: () => {
                    isPolling = false;
                }
            });
        }, 8000);
        return () => {
            clearInterval(timer);
            clearInterval(pollTimer);
        };
    }, []);

    // Echo listener for real-time responder coordinates and incident/dispatch updates
    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');

            const refreshData = () => {
                router.reload({ only: ['dispatches', 'verifiedIncidents', 'ambulances', 'responders'] });
            };

            channel.listen('IncidentVerified', refreshData);
            channel.listen('.IncidentVerified', refreshData);
            channel.listen('IncidentCreated', refreshData);
            channel.listen('.IncidentCreated', refreshData);
            channel.listen('IncidentCancelled', refreshData);
            channel.listen('.IncidentCancelled', refreshData);
            channel.listen('IncidentRejected', refreshData);
            channel.listen('.IncidentRejected', refreshData);
            channel.listen('DispatchCreated', refreshData);
            channel.listen('.DispatchCreated', refreshData);
            channel.listen('DispatchCompleted', refreshData);
            channel.listen('.DispatchCompleted', refreshData);
            channel.listen('DispatchStatusUpdated', refreshData);
            channel.listen('.DispatchStatusUpdated', refreshData);

            const handleLocationUpdate = (e: any) => {
                const lat = parseFloat(e.latitude ?? e.ambulance?.latitude);
                const lng = parseFloat(e.longitude ?? e.ambulance?.longitude);
                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const incomingMs = typeof e.sequence === 'number' && e.sequence > 0
                        ? e.sequence
                        : (e.timestamp ? new Date(e.timestamp).getTime() : Date.now());

                    const locData = {
                        latitude: lat,
                        longitude: lng,
                        heading: e.heading ? parseFloat(e.heading) : null,
                        accuracy: e.accuracy ? parseFloat(e.accuracy) : null,
                        timestamp: e.timestamp || new Date().toISOString(),
                        sequence: incomingMs,
                        updatedAt: incomingMs,
                        responder_name: e.responder_name,
                    };

                    setLiveLocations(prev => {
                        // Monotonic Guard: check existing location for this dispatch or ambulance
                        const targetKey = e.dispatch_id || e.ambulance_id || e.ambulance?.id;
                        const existing = targetKey ? prev[targetKey] : null;
                        const existingMs = existing?.sequence || existing?.updatedAt || (existing?.timestamp ? new Date(existing.timestamp).getTime() : 0);

                        // If an out-of-order or delayed packet arrives that is older than what is currently rendered, ignore it
                        if (existing && existingMs > 0 && incomingMs < existingMs) {
                            return prev;
                        }

                        return {
                            ...prev,
                            ...(e.dispatch_id ? { [e.dispatch_id]: locData } : {}),
                            ...(e.ambulance_id ? { [e.ambulance_id]: locData } : {}),
                            ...(e.ambulance?.id ? { [e.ambulance.id]: locData } : {}),
                        };
                    });
                }
            };

            channel.listen('AmbulanceLocationUpdated', handleLocationUpdate);
            channel.listen('.AmbulanceLocationUpdated', handleLocationUpdate);

            return () => {
                channel.stopListening('AmbulanceLocationUpdated');
                channel.stopListening('.AmbulanceLocationUpdated');
                channel.stopListening('IncidentVerified');
                channel.stopListening('.IncidentVerified');
                channel.stopListening('IncidentCreated');
                channel.stopListening('.IncidentCreated');
                channel.stopListening('IncidentCancelled');
                channel.stopListening('.IncidentCancelled');
                channel.stopListening('IncidentRejected');
                channel.stopListening('.IncidentRejected');
                channel.stopListening('DispatchCreated');
                channel.stopListening('.DispatchCreated');
                channel.stopListening('DispatchCompleted');
                channel.stopListening('.DispatchCompleted');
                channel.stopListening('DispatchStatusUpdated');
                channel.stopListening('.DispatchStatusUpdated');
            };
        }
    }, []);

    // Keep liveLocations synchronized whenever dispatches prop updates with coordinates
    // Guard against overwriting live WebSocket tracking with older HTTP polling database snapshots
    useEffect(() => {
        dispatches.forEach(d => {
            const lat = parseFloat(d.last_latitude);
            const lng = parseFloat(d.last_longitude);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                const dbTimeMs = d.last_location_updated_at ? new Date(d.last_location_updated_at).getTime() : 0;
                const loc = {
                    latitude: lat,
                    longitude: lng,
                    heading: d.last_heading ? parseFloat(d.last_heading) : null,
                    accuracy: d.last_accuracy ? parseFloat(d.last_accuracy) : null,
                    timestamp: d.last_location_updated_at,
                    sequence: dbTimeMs,
                    updatedAt: dbTimeMs,
                };

                setLiveLocations(prev => {
                    const existing = prev[d.id] || (d.ambulance_id ? prev[d.ambulance_id] : null);
                    const existingMs = existing?.sequence || existing?.updatedAt || (existing?.timestamp ? new Date(existing.timestamp).getTime() : 0);

                    // POLLING CONFLICT GUARD: If the existing coordinate was set by a live WebSocket update
                    // and its timestamp is newer than or equal to this polling snapshot, DO NOT overwrite!
                    if (existing && existingMs > 0 && dbTimeMs <= existingMs) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [d.id]: loc,
                        ...(d.ambulance_id ? { [d.ambulance_id]: loc } : {})
                    };
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
        if (!dispatch) return { status: 'unavailable', label: 'Location Unavailable', color: 'text-slate-400 bg-slate-400/10 border-slate-500/20', isLive: false, isOffline: true, elapsedSeconds: 9999 };
        let loc = liveLocations[dispatch.id] || liveLocations[dispatch.ambulance_id];
        if (!loc && dispatch.last_latitude && dispatch.last_longitude) {
            loc = {
                latitude: parseFloat(dispatch.last_latitude),
                longitude: parseFloat(dispatch.last_longitude),
                updatedAt: dispatch.last_location_updated_at ? new Date(dispatch.last_location_updated_at).getTime() : 0,
            };
        }
        if (!loc || !loc.updatedAt) {
            return { status: 'unavailable', label: 'Location Unavailable', color: 'text-slate-400 bg-slate-400/10 border-slate-500/20', isLive: false, isOffline: true, elapsedSeconds: 9999 };
        }
        const elapsedSeconds = Math.max(0, Math.floor((currentTime - loc.updatedAt) / 1000));
        if (elapsedSeconds <= 35) {
            return { status: 'online', label: 'Online • Live Tracking', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', isLive: true, isOffline: false, elapsedSeconds };
        }
        if (elapsedSeconds <= 180) {
            return { status: 'stale', label: `Location Stale (${elapsedSeconds}s ago)`, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', isLive: false, isOffline: false, elapsedSeconds };
        }
        const minutes = Math.floor(elapsedSeconds / 60);
        return { status: 'offline', label: `Offline (${minutes}m ago)`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', isLive: false, isOffline: true, elapsedSeconds };
    };

    const handledIncidentIdRef = useRef<string | number | null>(null);

    useEffect(() => {
        if (selectedIncidentId && handledIncidentIdRef.current !== selectedIncidentId) {
            const dispatch = dispatches.find(d => d.incident_id == selectedIncidentId || d.id == selectedIncidentId);
            if (dispatch) {
                setSelectedDispatch(dispatch);
                setIsExpanded(true); // Auto-expand only once upon initial URL navigation
                const lat = parseFloat(dispatch.incident?.incident_latitude);
                const lng = parseFloat(dispatch.incident?.incident_longitude);
                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    setFocusedTarget({ latitude: lat, longitude: lng, zoom: 16, key: dispatch.id });
                }
                handledIncidentIdRef.current = selectedIncidentId;
                window.history.replaceState({}, '', '/dispatcher/dispatches');
            } else {
                const vi = verifiedIncidents.find(i => i.id == selectedIncidentId);
                if (vi) {
                    setAssigningIncident(vi);
                    const lat = parseFloat(vi.incident_latitude);
                    const lng = parseFloat(vi.incident_longitude);
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        setFocusedTarget({ latitude: lat, longitude: lng, zoom: 16, key: vi.id });
                    }
                    handledIncidentIdRef.current = selectedIncidentId;
                    window.history.replaceState({}, '', '/dispatcher/dispatches');
                }
            }
        }
    }, [selectedIncidentId, dispatches, verifiedIncidents]);

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

    // ESC key closes overlay or collapses details
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedDispatch) {
                if (isExpanded) {
                    setIsExpanded(false);
                } else {
                    setSelectedDispatch(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDispatch, isExpanded]);

    // Toggle or set selected dispatch
    const handleSelectDispatch = (dispatch: any) => {
        if (!dispatch) {
            setSelectedDispatch(null);
            setIsExpanded(false);
            setIsOverlayMinimized(false);
            return;
        }

        if (selectedDispatch && selectedDispatch.id === dispatch.id) {
            // Clicking the active responder again clears selection
            setSelectedDispatch(null);
            setIsExpanded(false);
            setIsOverlayMinimized(false);
        } else {
            setSelectedDispatch(dispatch);
            setIsExpanded(false);
            setIsOverlayMinimized(false);
            setActiveTab('incident');
        }
    };

    const activeAmbulances = useMemo(() => {
        return (ambulances || []).filter(a => a.plate_number !== 'WALK-IN' && a.vehicle_type !== 'Station');
    }, [ambulances]);

    const readyAmbulances = useMemo(() => {
        return activeAmbulances.filter(a => a.status === 'available');
    }, [activeAmbulances]);

    const dispatchedAmbulances = useMemo(() => {
        return activeAmbulances.filter(a => a.status === 'dispatched');
    }, [activeAmbulances]);

    const maintenanceAmbulances = useMemo(() => {
        return activeAmbulances.filter(a => a.status === 'maintenance');
    }, [activeAmbulances]);

    const filteredVerified = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return verifiedIncidents;
        const cleanQueryId = q.replace(/^#?inc-?/i, '').replace(/^0+/, '');
        return verifiedIncidents.filter((inc) => {
            const idMatch = String(inc.id).includes(q) ||
                (cleanQueryId !== '' && String(inc.id) === cleanQueryId) ||
                `#${inc.id}`.includes(q) ||
                `inc-${String(inc.id).padStart(4, '0')}`.includes(q) ||
                `#inc-${String(inc.id).padStart(4, '0')}`.includes(q) ||
                String(inc.id).padStart(4, '0').includes(q);
            const type = inc.incident_type?.name?.toLowerCase() || '';
            const loc = (typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay)?.toLowerCase() || '';
            const desc = (inc.place_of_incident || inc.incident_address || '')?.toLowerCase();
            const resident = `${inc.resident?.first_name || ''} ${inc.resident?.last_name || ''}`.toLowerCase();
            return idMatch || type.includes(q) || loc.includes(q) || desc.includes(q) || resident.includes(q);
        });
    }, [verifiedIncidents, search]);

    const getCategoryMeta = (category?: string, chiefComplaint?: string) => {
        const norm = (category || chiefComplaint || '').toLowerCase();
        if (norm.includes('fire')) return { icon: Flame, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', label: 'Fire & Rescue' };
        if (norm.includes('vehic') || norm.includes('trauma') || norm.includes('accident') || norm.includes('collision')) {
            return { icon: Car, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', label: 'Trauma & Rescue' };
        }
        if (norm.includes('cardiac') || norm.includes('arrest') || norm.includes('stroke') || norm.includes('chest')) {
            return { icon: HeartPulse, color: 'text-red-500 bg-red-500/10 border-red-500/30', label: 'Cardiac Emergency' };
        }
        return { icon: Stethoscope, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', label: 'Medical Emergency' };
    };

    const formatTimeElapsed = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const diffSecs = Math.max(0, Math.floor((currentTime - date.getTime()) / 1000));
        if (diffSecs < 60) return 'Just now';
        const mins = Math.floor(diffSecs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
        return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    };

    const filtered = dispatches.filter((d) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const cleanQueryId = q.replace(/^#?(?:inc|dsp)-?/i, '').replace(/^0+/, '');
        const incId = d.incident_id || d.incident?.id;
        const idMatch = String(d.id).includes(q) || 
            (cleanQueryId !== '' && (String(d.id) === cleanQueryId || (incId && String(incId) === cleanQueryId))) ||
            (incId && (
                String(incId).includes(q) ||
                `#${incId}`.includes(q) ||
                `inc-${String(incId).padStart(4, '0')}`.includes(q) ||
                `#inc-${String(incId).padStart(4, '0')}`.includes(q)
            ));
        return (
            idMatch ||
            d.ambulance?.plate_number?.toLowerCase().includes(q) ||
            (d.driver?.first_name + ' ' + d.driver?.last_name).toLowerCase().includes(q) ||
            (d.emt?.first_name + ' ' + d.emt?.last_name).toLowerCase().includes(q) ||
            d.incident?.incident_type?.name?.toLowerCase().includes(q) ||
            d.incident?.barangay?.toLowerCase().includes(q)
        );
    });

    const getPriorityColor = (priority: any) => {
        switch (priority?.toLowerCase()) {
            case 'critical': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
            case 'high': return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
            case 'moderate':
            case 'medium': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            case 'low': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
            default: return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
        }
    };

    const crew = selectedDispatch ? (() => {
        const members: any[] = [];
        
        // Driver
        if (selectedDispatch.driver) {
            members.push({ role: 'Driver', user: selectedDispatch.driver });
        } else if (selectedDispatch.crew_snapshot?.driver) {
            members.push({ 
                role: 'Driver', 
                user: { 
                    first_name: selectedDispatch.crew_snapshot.driver.name?.split(' ')[0] || 'Driver',
                    last_name: selectedDispatch.crew_snapshot.driver.name?.split(' ').slice(1).join(' ') || '',
                    responder_profile: { team: selectedDispatch.team || selectedDispatch.crew_snapshot.team }
                } 
            });
        } else {
            members.push({ role: 'Driver', user: null });
        }

        // EMT(s)
        if (Array.isArray(selectedDispatch.crew_snapshot?.emts) && selectedDispatch.crew_snapshot.emts.length > 0) {
            selectedDispatch.crew_snapshot.emts.forEach((emtItem: any, idx: number) => {
                const matchedUser = selectedDispatch.emt?.id === emtItem.id ? selectedDispatch.emt : null;
                members.push({
                    role: selectedDispatch.crew_snapshot.emts.length > 1 ? `EMT #${idx + 1}` : 'EMT',
                    user: matchedUser || {
                        first_name: emtItem.name?.split(' ')[0] || 'EMT',
                        last_name: emtItem.name?.split(' ').slice(1).join(' ') || '',
                        responder_profile: { team: selectedDispatch.team || selectedDispatch.crew_snapshot.team }
                    }
                });
            });
        } else if (selectedDispatch.emt) {
            members.push({ role: 'EMT', user: selectedDispatch.emt });
        } else {
            members.push({ role: 'EMT', user: null });
        }

        return members;
    })() : [];

    return (
        <div className="h-full flex-1 flex flex-col min-h-0 max-w-[1850px] mx-auto w-full overflow-hidden">
            {/* Main Workspace Area */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0 h-full">
                
                {/* LEFT COLUMN: Queue & Dispatch List (4/12 width on xl) */}
                <div className="xl:col-span-4 flex flex-col h-full bg-white/90 dark:bg-[#090e1a]/90 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-sm dark:shadow-2xl overflow-hidden relative z-10 transition-colors duration-300">
                    
                    {/* Header & Filter Tabs */}
                    <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] shrink-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F61509] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F61509]" />
                                </span>
                                Operations Queue
                            </h2>
                            <span className="bg-red-600 text-white text-[11px] font-bold py-0.5 px-2.5 rounded-full shadow-xs">
                                {dispatches.length + filteredVerified.length} Total Active
                            </span>
                        </div>

                        {/* Filter Segmented Control */}
                        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setViewFilter('all')}
                                title={`All Operations (${filteredVerified.length + filtered.length})`}
                                className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                                    viewFilter === 'all'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <span>All</span>
                                <span className="text-[10px] font-semibold opacity-90">({filteredVerified.length + filtered.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewFilter('pending')}
                                title={`Needs Crew / Pending Assignments (${filteredVerified.length})`}
                                className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                                    viewFilter === 'pending'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                                }`}
                            >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Pending</span>
                                <span className="text-[10px] font-semibold opacity-90">({filteredVerified.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewFilter('dispatched')}
                                title={`Active Dispatches (${filtered.length})`}
                                className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                                    viewFilter === 'dispatched'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Truck className="w-3 h-3 shrink-0" />
                                <span>Active</span>
                                <span className="text-[10px] font-semibold opacity-90">({filtered.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewFilter('fleet')}
                                title={`Ready Ambulance Fleet (${readyAmbulances.length})`}
                                className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                                    viewFilter === 'fleet'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                                }`}
                            >
                                <Shield className="w-3 h-3 shrink-0" />
                                <span>Fleet</span>
                                <span className="text-[10px] font-semibold opacity-90">({readyAmbulances.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Cards Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        
                        {/* 🚨 PENDING ASSIGNMENTS SECTION (NEEDS CREW) */}
                        {(viewFilter === 'all' || viewFilter === 'pending') && filteredVerified.length > 0 && (
                            <div className="space-y-3 mb-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" /> Pending Assignment ({filteredVerified.length})
                                    </h3>
                                    <span className="text-[10px] text-amber-500/80 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        Action Required
                                    </span>
                                </div>

                                {filteredVerified.map((incident) => {
                                    const isAlarming = activeAlarm && activeAlarm.id === incident.id;
                                    const categoryMeta = getCategoryMeta(incident.incident_type?.name, incident.description);
                                    const CategoryIcon = categoryMeta.icon;
                                    const barangayName = typeof incident.barangay === 'object' 
                                        ? incident.barangay?.barangay_name || incident.barangay?.name 
                                        : incident.barangay;
                                    const elapsed = formatTimeElapsed(incident.created_at);

                                    return (
                                        <div 
                                            key={`vi-${incident.id}`} 
                                            onClick={isAlarming ? acknowledgeAlarm : undefined}
                                            className={`rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group ${
                                                isAlarming 
                                                    ? 'bg-red-500/15 border-2 border-red-500 animate-pulse cursor-pointer shadow-lg shadow-red-500/30'
                                                    : 'bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-900 border border-amber-300 dark:border-amber-500/30 shadow-xs hover:shadow-md'
                                            }`}
                                        >
                                            {/* Top status bar accent */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                                            {/* Meta Row: ID, Category Chip, Priority & Elapsed */}
                                            <div className="flex items-center justify-between gap-1.5 mb-2 pt-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                                                        #{incident.id}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryMeta.color}`}>
                                                        <CategoryIcon className="w-3 h-3" />
                                                        <span>{categoryMeta.label}</span>
                                                    </span>
                                                    {incident.priority && (
                                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(incident.priority)}`}>
                                                            {incident.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                {elapsed && (
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {elapsed}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Chief Complaint / Title */}
                                            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1.5 leading-snug line-clamp-2">
                                                {incident.incident_type?.name || 'Emergency Incident'}
                                            </h3>

                                            {/* Location Badge */}
                                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 mb-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    {barangayName && (
                                                        <span className="font-bold text-slate-900 dark:text-white block">
                                                            Brgy. {barangayName}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 break-words block leading-relaxed">
                                                        {incident.place_of_incident || incident.incident_address || 'Opol, Misamis Oriental'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Reporter Info (if available) */}
                                            {incident.resident && (
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 px-1">
                                                    <span className="truncate">Caller: <span className="font-semibold text-slate-700 dark:text-slate-300">{incident.resident.first_name} {incident.resident.last_name}</span></span>
                                                    {incident.resident.phone_number && (
                                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                                                            <Phone className="w-3 h-3" /> {incident.resident.phone_number}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Buttons: Locate on Map & Assign Crew */}
                                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const lat = parseFloat(incident.incident_latitude);
                                                        const lng = parseFloat(incident.incident_longitude);
                                                        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                                                            setFocusedTarget({ latitude: lat, longitude: lng, zoom: 16, key: incident.id });
                                                        }
                                                    }}
                                                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-white/10"
                                                    title="Focus camera on incident location"
                                                >
                                                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>Locate</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isAlarming) acknowledgeAlarm();
                                                        setAssigningIncident(incident);
                                                    }}
                                                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/30 active:scale-95 cursor-pointer"
                                                >
                                                    <Truck className="w-3.5 h-3.5" />
                                                    <span>Assign Crew</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 🚑 ACTIVE DISPATCHES LIST */}
                        {(viewFilter === 'all' || viewFilter === 'dispatched') && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-blue-500" /> Active Dispatches ({filtered.length})
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        {filtered.length} active
                                    </span>
                                </div>

                                {/* Selected Dispatch Live Mission Tracker in Sidebar */}
                                {selectedDispatch && (
                                    <div className="bg-white dark:bg-[#070b14] rounded-2xl border border-[#F61509]/30 dark:border-[#F61509]/30 p-4 space-y-3.5 shadow-md dark:shadow-2xl relative overflow-hidden ring-1 ring-[#F61509]/20 transition-colors duration-300">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F61509] via-orange-500 to-amber-500" />
                                        
                                        {/* Header with Close and Connection Status */}
                                        <div className="flex items-start justify-between gap-2 pt-1">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="font-mono text-xs font-bold text-[#F61509] bg-[#F61509]/10 px-2 py-0.5 rounded-md border border-[#F61509]/20">
                                                        MISSION #{selectedDispatch.id}
                                                    </span>
                                                    <StatusBadge status={selectedDispatch.dispatch_status} />
                                                </div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                                                    {selectedDispatch.incident?.incident_type?.name}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedDispatch(null)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                title="Deselect Mission"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Live GPS Link Status */}
                                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                                            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">GPS Telemetry</span>
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

                                        {/* Offline Safeguard Warning Banner */}
                                        {(() => {
                                            const conn = getConnectionStatus(selectedDispatch);
                                            if (conn.isOffline && conn.status === 'offline') {
                                                const mins = Math.floor(conn.elapsedSeconds / 60);
                                                return (
                                                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 space-y-1 text-xs">
                                                        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px] uppercase tracking-wider">
                                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Responder Offline ({mins}m)</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                                            Network lost. GPS coordinates shown are the last known fix. The responder has cached this mission locally and is operating in offline mode. Automated reassignment is blocked.
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Q1: Where is the incident? */}
                                        <div className="bg-slate-50/80 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F61509] flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-[#F61509]" /> 1. Incident Location
                                                </span>
                                                {selectedDispatch.incident?.priority && (
                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(selectedDispatch.incident.priority)}`}>
                                                        {selectedDispatch.incident.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-900 dark:text-slate-200 font-semibold break-words leading-relaxed">
                                                {(typeof selectedDispatch.incident?.barangay === 'object' ? selectedDispatch.incident?.barangay?.barangay_name || selectedDispatch.incident?.barangay?.name : selectedDispatch.incident?.barangay) || selectedDispatch.incident?.place_of_incident || 'Reported Location'}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                                GPS: {parseFloat(selectedDispatch.incident?.incident_latitude)?.toFixed(5) || '--'}, {parseFloat(selectedDispatch.incident?.incident_longitude)?.toFixed(5) || '--'}
                                            </div>
                                        </div>

                                        {/* Q2: Where is the responder now? */}
                                        <div className="bg-slate-50/80 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> 2. Responder Location
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10">
                                                    {selectedDispatch.ambulance?.plate_number}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                                                <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {selectedDispatch.driver ? `${selectedDispatch.driver.first_name} ${selectedDispatch.driver.last_name}` : (selectedDispatch.emt ? `${selectedDispatch.emt.first_name} ${selectedDispatch.emt.last_name} (EMT)` : 'Assigned Crew')}
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
                                    </div>
                                )}

                                {filtered.map((dispatch) => {
                                    const isSelected = selectedDispatch?.id === dispatch.id;
                                    const incident = dispatch.incident;
                                    const etaStr = routeTelemetry[dispatch.id]?.formattedEta;
                                    
                                    return (
                                        <div 
                                            key={dispatch.id}
                                            onClick={() => handleSelectDispatch(dispatch)}
                                            className={`group cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-200 ${
                                                isSelected 
                                                    ? 'bg-slate-50 dark:bg-white/[0.06] border-[#F61509] shadow-sm ring-1 ring-[#F61509]/30 scale-[1.01] z-10' 
                                                    : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/70 dark:hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            {/* Highlight Accent */}
                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F61509]" />}

                                            <div className="p-4 pl-5">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            #{dispatch.id}
                                                        </span>
                                                        {(() => {
                                                            const itemConn = getConnectionStatus(dispatch);
                                                            return (
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${itemConn.color}`}>
                                                                    {itemConn.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                                    {itemConn.status === 'stale' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                                                    {itemConn.isOffline && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                                                    <span>{itemConn.status === 'online' ? 'Live' : (itemConn.status === 'stale' ? 'Stale' : 'Offline')}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <StatusBadge status={dispatch.dispatch_status} />
                                                </div>

                                                <div className="mb-3">
                                                    <h3 className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2 line-clamp-1">
                                                        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        {incident?.incident_type?.name}
                                                    </h3>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 mt-1">
                                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                        <span className="line-clamp-1">{(typeof incident?.barangay === 'object' ? incident.barangay?.barangay_name || incident.barangay?.name : incident?.barangay)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-200/60 dark:border-white/5">
                                                        <Truck className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                        <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{dispatch.ambulance?.plate_number}</span>
                                                    </div>
                                                    {dispatch.dispatch_status === 'arrived_on_scene' ? (
                                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                                                 On Scene
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                                                {etaStr ? `ETA ${etaStr}` : 'ETA Live'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Co-responding ambulances indicator if multiple units assigned to same incident */}
                                                {(() => {
                                                    const coResponders = filtered.filter(d => d.incident_id === dispatch.incident_id && d.id !== dispatch.id);
                                                    if (coResponders.length === 0) return null;
                                                    return (
                                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/70 dark:bg-indigo-950/30 px-2 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/30">
                                                            <Users className="w-3 h-3 shrink-0 text-indigo-500" />
                                                            <span className="truncate">Co-responding: {coResponders.map(c => c.ambulance?.plate_number || `Unit #${c.id}`).join(', ')}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 🛡️ AMBULANCE FLEET READINESS BAY (when fleet tab is selected or when 0 active dispatches) */}
                        {(viewFilter === 'fleet' || (filtered.length === 0 && viewFilter !== 'pending')) && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-emerald-500" /> Ambulance Fleet Readiness ({activeAmbulances.length})
                                    </h3>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        {readyAmbulances.length} Ready
                                    </span>
                                </div>

                                {activeAmbulances.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                                        No registered emergency ambulances in fleet.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {activeAmbulances.map(amb => {
                                            const isAvailable = amb.status === 'available';
                                            const isDispatched = amb.status === 'dispatched';
                                            return (
                                                <div 
                                                    key={`amb-bay-${amb.id}`}
                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                        isAvailable 
                                                            ? 'bg-white dark:bg-white/[0.02] border-emerald-500/30 shadow-xs' 
                                                            : (isDispatched
                                                                ? 'bg-blue-500/[0.03] border-blue-500/30'
                                                                : 'bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-70')
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                                                                {amb.ambulance_code || `AMB-0${amb.id}`}
                                                            </span>
                                                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                {amb.plate_number}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                                            isAvailable 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                                                : (isDispatched
                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30')
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : (isDispatched ? 'bg-blue-400' : 'bg-amber-400')}`} />
                                                            {isAvailable ? 'Available • Standby' : (isDispatched ? 'Dispatched • En Route' : 'Maintenance')}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {amb.vehicle_name || 'Emergency Medical Transport'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {amb.vehicle_type || 'Type 1 Ambulance'}
                                                    </div>

                                                    {/* Quick Dispatch Action if available and there is pending triage */}
                                                    {isAvailable && filteredVerified.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAssigningIncident(filteredVerified[0])}
                                                            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>Assign to Call #{filteredVerified[0].id}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Full-Height Live Map (8/12 width on xl) */}
                <div className="xl:col-span-8 flex flex-col h-full relative rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#070b14] z-0 transition-colors duration-300">
                    
                    {/* The Map itself takes up the entire container */}
                    <div className="absolute inset-0">
                        <LiveMonitoringMap 
                            dispatches={filtered} 
                            selectedDispatch={selectedDispatch}
                            liveLocations={liveLocations}
                            onRouteTelemetryChange={handleRouteTelemetryChange}
                            onSelectDispatch={handleSelectDispatch}
                            verifiedIncidents={filteredVerified}
                            onAssignIncident={setAssigningIncident}
                            focusedTarget={focusedTarget}
                            ambulances={ambulances}
                        />
                    </div>

                    {/* Floating Dispatch Overlay (Bottom Right) */}
                    {selectedDispatch && (
                        isOverlayMinimized ? (
                            /* 1. Tactical Floating Capsule (Minimized Pill Mode - Zero Obstruction) */
                            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-full shadow-2xl pointer-events-auto text-xs animate-in fade-in duration-200">
                                <span className="w-2 h-2 rounded-full bg-[#F61509] animate-pulse" />
                                <span className="font-mono font-bold text-[#F61509]">#{selectedDispatch.id}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                    {selectedDispatch.incident?.incident_type?.name || 'Mission'}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {selectedDispatch.ambulance?.plate_number || 'Unit'}
                                </span>
                                {routeTelemetry[selectedDispatch.id]?.formattedEta && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                        ETA {routeTelemetry[selectedDispatch.id].formattedEta}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-1.5 ml-0.5">
                                    <button 
                                        type="button"
                                        onClick={() => setIsOverlayMinimized(false)} 
                                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                                        title="Expand mission card"
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setSelectedDispatch(null);
                                            setIsExpanded(false);
                                        }} 
                                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                                        title="Close"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 2. Compact Tactical HUD Card (Normal & Expanded Mode) */
                            <div className={`absolute bottom-4 right-4 z-20 transition-all duration-300 ease-out flex flex-col bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto ${
                                isExpanded ? 'w-[440px] sm:w-[480px] h-[580px] max-h-[80vh]' : 'w-[310px] sm:w-[330px] h-auto'
                            }`}>
                                
                                {/* Compact Summary Header */}
                                <div className="p-3 border-b border-slate-200/80 dark:border-white/10 shrink-0 bg-slate-50/70 dark:bg-white/[0.02]">
                                    {/* Top Meta Row: ID, Priority, Status Badge & Close */}
                                    <div className="flex items-center justify-between gap-1.5 mb-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono text-[11px] font-bold text-[#F61509] bg-[#F61509]/10 px-1.5 py-0.5 rounded border border-[#F61509]/20">
                                                #{selectedDispatch.id}
                                            </span>
                                            {selectedDispatch.incident?.priority && (
                                                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(selectedDispatch.incident.priority)}`}>
                                                    {selectedDispatch.incident.priority}
                                                </span>
                                            )}
                                            <StatusBadge status={selectedDispatch.dispatch_status} size="xs" />
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {(() => {
                                                const conn = getConnectionStatus(selectedDispatch);
                                                return (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${conn.color}`}>
                                                        {conn.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                        {conn.status === 'stale' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                                        {conn.isOffline && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                                        <span>{conn.status === 'online' ? 'Live' : (conn.status === 'stale' ? 'Stale' : 'Offline')}</span>
                                                    </span>
                                                );
                                            })()}
                                            <button 
                                                type="button"
                                                onClick={() => setIsOverlayMinimized(true)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                title="Minimize to floating pill"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDispatch(null);
                                                    setIsExpanded(false);
                                                }}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                title="Close overlay"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Incident Title & Location */}
                                    <div className="mb-2">
                                        <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5 text-xs leading-snug">
                                            <AlertCircle className="w-3.5 h-3.5 text-[#F61509] shrink-0" />
                                            <span className="truncate">{selectedDispatch.incident?.incident_type?.name || 'Emergency Incident'}</span>
                                        </h3>
                                        <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="break-words leading-snug">
                                                {(typeof selectedDispatch.incident?.barangay === 'object' 
                                                    ? selectedDispatch.incident?.barangay?.barangay_name || selectedDispatch.incident?.barangay?.name 
                                                    : selectedDispatch.incident?.barangay) 
                                                    || selectedDispatch.incident?.place_of_incident 
                                                    || 'Opol, Misamis Oriental'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Unit & Telemetry Status Box */}
                                    <div className="flex items-center justify-between text-xs mb-2 p-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {selectedDispatch.ambulance?.plate_number || 'Unit Unassigned'}
                                            </span>
                                        </div>
                                        {selectedDispatch.dispatch_status === 'arrived_on_scene' ? (
                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                <span>On Scene</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {routeTelemetry[selectedDispatch.id]?.formattedEta 
                                                        ? `ETA ${routeTelemetry[selectedDispatch.id].formattedEta}` 
                                                        : 'ETA Live'}
                                                </span>
                                                {routeTelemetry[selectedDispatch.id]?.formattedDistance && (
                                                    <span className="text-[10px] text-amber-500/80 border-l border-amber-500/30 pl-1">
                                                        {routeTelemetry[selectedDispatch.id].formattedDistance}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Offline Notice in Floating Overlay */}
                                    {(() => {
                                        const conn = getConnectionStatus(selectedDispatch);
                                        if (conn.isOffline && conn.status === 'offline') {
                                            const mins = Math.floor(conn.elapsedSeconds / 60);
                                            return (
                                                <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-1.5 text-xs text-rose-500 font-medium">
                                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    <span className="text-[11px] leading-snug">
                                                        Responder Offline ({mins}m ago). Local mission cached.
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Action Buttons ("Easy to Access") */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button 
                                            type="button"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/10 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                                            title={isExpanded ? 'Collapse mission tabs' : 'View full mission tabs'}
                                        >
                                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <Maximize2 className="w-3 h-3 text-blue-500" />}
                                            <span>{isExpanded ? 'Hide Tabs' : 'Mission Tabs'}</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => router.get(`/dispatcher/incidents?incident_id=${selectedDispatch.incident_id}`)}
                                            className="py-1.5 px-2 bg-slate-100/60 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                                            title="Open complete incident record"
                                        >
                                            <ExternalLink className="w-3 h-3 text-slate-400" />
                                            <span>Incident File</span>
                                        </button>
                                    </div>
                                </div>

                            {/* Expanded Tabbed Content */}
                            {isExpanded && (
                                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                                    {/* Tab Navigation */}
                                    <div className="flex overflow-x-auto border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hide-scrollbar pt-1 px-2 shrink-0">
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
                                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                                                activeTab === tab.id 
                                                    ? 'border-[#F61509] text-[#F61509] bg-[#F61509]/5 rounded-t-lg' 
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
                                                     const permTeam = c.user?.responder_profile?.team;

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
                                                                             Team: {permTeam.startsWith('Team ') ? permTeam : `Team ${permTeam}`}
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             </div>
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
                            )}
                        </div>
                        )
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
