import { MapPin, Clock, CheckCircle, XCircle, ShieldAlert, Truck, Send, CheckCircle2, PhoneCall } from 'lucide-react';
import Drawer from '@/shared/components/Drawer';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Haversine distance calculation in meters
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c); 
}

// Reusable timeline node component
function TimelineNode({ label, time, active, isLast = false }) {
    return (
        <div className="flex gap-4 min-h-[50px]">
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${active ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                {!isLast && (
                    <div className={`w-0.5 h-full ${active ? 'bg-rose-500/50' : 'bg-slate-300/50 dark:bg-slate-700/50'}`} />
                )}
            </div>
            <div className="pb-6 pt-0 -mt-1">
                <p className={`text-sm font-medium ${active ? 'text-rose-900 dark:text-rose-100' : 'text-slate-500 dark:text-slate-500'}`}>
                    {label}
                </p>
                {time && (
                    <p className={`text-xs ${active ? 'text-rose-600 dark:text-rose-300' : 'text-slate-400 dark:text-slate-600'}`}>
                        {new Date(time).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function IncidentDetails({ 
    incident, 
    open, 
    onClose, 
    onAssignUnit 
}: { 
    incident: any; 
    open: boolean; 
    onClose: () => void; 
    onAssignUnit?: (incident: any) => void; 
}) {
    const [processing, setProcessing] = useState(false);
    const [address, setAddress] = useState(null);
    const [loadingAddress, setLoadingAddress] = useState(false);

    useEffect(() => {
        if (!incident || !incident.reporter_latitude || !incident.reporter_longitude) {
            setAddress(null);
            return;
        }

        const fetchAddress = async () => {
            setLoadingAddress(true);
            try {
                const token = import.meta.env.VITE_MAPBOX_TOKEN;
                if (!token) {
                    setAddress(null);
                    return;
                }
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${incident.reporter_longitude},${incident.reporter_latitude}.json?access_token=${token}`);
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    setAddress(data.features[0].place_name);
                } else {
                    setAddress('Address not found');
                }
            } catch (error) {
                console.error("Error fetching address:", error);
                setAddress('Error fetching address');
            } finally {
                setLoadingAddress(false);
            }
        };

        if (open) {
            fetchAddress();
        }
    }, [incident, open]);

    if (!incident) return null;

    const updateStatus = (status, payload = {}) => {
        setProcessing(true);
        let url = `/dispatcher/incidents/${incident.id}/verify`;
        if (status === 'rejected') {
            url = `/dispatcher/incidents/${incident.id}/reject`;
        } else if (status === 'resolved') {
            url = `/dispatcher/incidents/${incident.id}/resolve`;
        }
            
        router.post(
            url,
            payload,
            { onFinish: () => { setProcessing(false); onClose(); } },
        );
    };

    // Determine timeline states
    const statusMap = {
        'pending': 1,
        'verified': 2,
        'assigned': 3,
        'responding': 4,
        'resolved': 5,
        'rejected': 5
    };
    
    const currentStep = statusMap[incident.incident_status] || 1;

    const distance = getDistanceInMeters(
        incident.incident_latitude, 
        incident.incident_longitude, 
        incident.reporter_latitude, 
        incident.reporter_longitude
    );

    let locationStatusNode = null;
    if (distance !== null) {
        if (distance < 50) {
            locationStatusNode = (
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Reporter Nearby</span>
                    <span className="text-xs text-slate-500 ml-1">({distance}m from original location)</span>
                </div>
            );
        } else if (distance <= 200) {
            locationStatusNode = (
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Reporter Moving Away</span>
                    <span className="text-xs text-slate-500 ml-1">({distance}m from original location)</span>
                </div>
            );
        } else {
            locationStatusNode = (
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                    <span className="text-sm font-medium text-rose-700 dark:text-rose-400">Reporter Far Away</span>
                    <span className="text-xs text-slate-500 ml-1">({distance}m from original location)</span>
                </div>
            );
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={`Incident #${incident.id}`}
            description={incident.incident_type?.name ?? 'Incident Details'}
            width="w-[450px]"
            noPadding={true}
        >
            <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#080d1a]/50">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
                    
                    {/* Header Badges */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200 dark:border-white/10">
                        <StatusBadge status={incident.priority ?? 'Moderate'} />
                        <StatusBadge status={incident.incident_status} />
                        {incident.location_source === 'location_code' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <PhoneCall className="w-3 h-3" />
                                Phone/SIM Call
                            </span>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                            Status Timeline
                        </h4>
                        <div className="mt-2">
                            <TimelineNode 
                                label="Reported (Pending)" 
                                time={incident.reported_at} 
                                active={currentStep >= 1} 
                            />
                            {incident.incident_status === 'rejected' ? (
                                <TimelineNode 
                                    label="Rejected" 
                                    time={incident.resolved_at} 
                                    active={true} 
                                    isLast={true}
                                />
                            ) : (
                                <>
                                    <TimelineNode 
                                        label="Verified" 
                                        time={incident.verified_at} 
                                        active={currentStep >= 2} 
                                    />
                                    <TimelineNode 
                                        label="Assigned Crew" 
                                        time={incident.dispatches?.[0]?.assigned_at} 
                                        active={currentStep >= 3} 
                                    />
                                    <TimelineNode 
                                        label="Responding" 
                                        time={incident.dispatches?.[0]?.en_route_at || incident.dispatches?.[0]?.arrived_at} 
                                        active={currentStep >= 4} 
                                    />
                                    <TimelineNode 
                                        label="Resolved" 
                                        time={incident.resolved_at} 
                                        active={currentStep >= 5} 
                                        isLast={true}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Incident Information */}
                    <div className="space-y-4">
                        {incident.chief_complaint && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Chief Complaint
                                </p>
                                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 shadow-sm dark:shadow-none">
                                    {incident.chief_complaint}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Description
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                {incident.description ?? '—'}
                            </p>
                        </div>

                        {incident.place_of_incident && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Place of Incident (Confirmed Marker)
                                </p>
                                <div className="text-sm text-slate-800 dark:text-slate-200 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 shadow-sm dark:shadow-none">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                                                {incident.place_of_incident}
                                            </p>
                                            {incident.location_code && (
                                                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                    Location Code: <span className="font-bold">{incident.location_code}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Coordinates & Map Location
                            </p>
                            <div className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {incident.incident_latitude && incident.incident_longitude
                                                ? (loadingAddress ? 'Fetching address...' : (address || `${incident.incident_latitude}, ${incident.incident_longitude}`))
                                                : 'Location not available'}
                                        </span>
                                        {incident.incident_latitude && incident.incident_longitude && (
                                            <span className="text-xs font-mono text-slate-500 mt-0.5">
                                                {incident.incident_latitude}, {incident.incident_longitude}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {locationStatusNode}
                            </div>
                        </div>

                        {incident.images && incident.images.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Photo Evidence
                                </p>
                                <div className="mt-1">
                                    <img 
                                        src={`/storage/${incident.images[0].image_path}`} 
                                        alt="Incident" 
                                        className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Reported By
                            </p>
                            <div className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                <p className="font-medium">
                                    {incident.resident
                                        ? `${incident.resident.first_name} ${incident.resident.last_name}`
                                        : (incident.caller_phone_number ? `Phone Caller (${incident.caller_phone_number})` : '—')}
                                </p>
                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                    {incident.caller_phone_number || incident.resident?.phone_number || incident.resident?.email || ''}
                                </p>
                                {incident.incident_address && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5">
                                        <span className="font-medium text-slate-600 dark:text-slate-300">Registered Address:</span> {incident.incident_address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Action Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                    {incident.incident_status === 'pending' && (
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                className="flex-1"
                                loading={processing}
                                onClick={() => updateStatus('verified', { priority: incident.priority || 'Moderate' })}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Verify Incident
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-auto px-4"
                                loading={processing}
                                onClick={() => updateStatus('rejected', { rejection_reason: 'Rejected by Dispatcher' })}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {incident.incident_status === 'verified' && (
                        <Button
                            variant="primary"
                            className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-lg shadow-orange-500/20"
                            onClick={() => {
                                if (onAssignUnit) {
                                    onAssignUnit(incident);
                                } else {
                                    router.get(`/dispatcher/dispatches?incident_id=${incident.id}`);
                                }
                            }}
                        >
                            <Send className="w-4 h-4" />
                            Assign Responder Unit
                        </Button>
                    )}

                    {(incident.incident_status === 'assigned' || incident.incident_status === 'responding') && (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    router.get(`/dispatcher/dispatches?incident_id=${incident.id}`);
                                }}
                            >
                                <Truck className="w-4 h-4" />
                                View Active Dispatch
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                loading={processing}
                                onClick={() => {
                                    if (confirm('Are you sure you want to mark this incident as resolved and complete all associated missions?')) {
                                        updateStatus('resolved');
                                    }
                                }}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    );
}
