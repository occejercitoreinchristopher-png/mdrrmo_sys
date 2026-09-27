import { MapPin, Clock, CheckCircle, XCircle, ShieldAlert, AlertTriangle, Truck, Send, CheckCircle2, PhoneCall, Smartphone, UserCheck, Image as ImageIcon, ExternalLink, X, Camera } from 'lucide-react';
import Drawer from '@/shared/components/Drawer';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import { router } from '@inertiajs/react';
import { useState, useEffect, ReactNode } from 'react';
import RejectModal from './RejectModal';

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
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<string>(incident?.priority || 'Moderate');

    useEffect(() => {
        if (incident?.priority) {
            setSelectedPriority(incident.priority);
        }
    }, [incident]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && previewImage) {
                setPreviewImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewImage]);

    useEffect(() => {
        if (!incident) {
            setAddress(null);
            return;
        }

        const existingPlace = incident.place_of_incident || incident.incident_address;
        if (existingPlace) {
            setAddress(existingPlace);
            return;
        }

        const lat = incident.incident_latitude || incident.reporter_latitude;
        const lng = incident.incident_longitude || incident.reporter_longitude;
        if (!lat || !lng) {
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
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=PH&types=poi,address,neighborhood,locality`);
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    setAddress(data.features[0].place_name);
                } else {
                    setAddress(null);
                }
            } catch (error) {
                console.error("Error fetching address:", error);
                setAddress(null);
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
            { 
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errs) => {
                    console.error('Failed to update incident status:', errs);
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                }
            },
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

    let locationStatusNode: ReactNode = null;
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
                        {incident.report_source === 'walk_in' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <UserCheck className="w-3 h-3" />
                                Walk-In
                            </span>
                        ) : incident.report_source === 'dispatcher' || incident.report_source === 'phone_sim' || incident.location_source === 'location_code' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <PhoneCall className="w-3 h-3" />
                                Phone / SIM Call
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Smartphone className="w-3 h-3" />
                                Resident App
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
                                Coordinates & Reporter Telemetry
                            </p>
                            <div className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#F61509] flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                                            {incident.place_of_incident && distance && distance > 50
                                                ? 'Reporter Device Position'
                                                : (incident.place_of_incident 
                                                    || incident.incident_address 
                                                    || (incident.location_code ? `Location Marker: ${incident.location_code}` : null) 
                                                    || (loadingAddress ? 'Fetching location name...' : address) 
                                                    || (incident.resident?.resident_profile?.barangay?.barangay_name ? `Brgy. ${incident.resident.resident_profile.barangay.barangay_name}, Opol` : null)
                                                    || 'Opol, Misamis Oriental')}
                                        </span>
                                        {incident.incident_latitude && incident.incident_longitude && (
                                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                                GPS: {parseFloat(String(incident.incident_latitude)).toFixed(5)}, {parseFloat(String(incident.incident_longitude)).toFixed(5)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {locationStatusNode}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Photo Evidence
                            </p>
                            {incident.images && incident.images.length > 0 ? (
                                <div className="mt-1 space-y-2">
                                    <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900/50">
                                        <img 
                                            src={`/storage/${incident.images[0].image_path}`} 
                                            alt="Incident Photo Evidence" 
                                            className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                            onClick={() => setPreviewImage(`/storage/${incident.images[0].image_path}`)}
                                        />
                                        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <ExternalLink className="w-3 h-3" />
                                            Click to enlarge
                                        </div>
                                    </div>

                                    {/* Captured Photo Metadata Card */}
                                    {incident.images[0] && (
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-white/10">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Camera className="w-3.5 h-3.5 text-primary" /> Photo Information
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    incident.images[0].source === 'responder_pcr'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    {incident.images[0].source === 'responder_pcr' ? 'Responder Scene Photo' : 'Resident Incident Photo'}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                                                <span className="font-bold text-slate-500 shrink-0">Location:</span>
                                                <span className="line-clamp-2">{incident.images[0].location_name || incident.place_of_incident || 'Poblacion, Opol, Misamis Oriental, Philippines'}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                                <span className="font-bold text-slate-500 shrink-0 font-sans text-xs">Coordinates:</span>
                                                <span>
                                                    {incident.images[0].latitude && incident.images[0].longitude 
                                                        ? `${Number(incident.images[0].latitude).toFixed(6)}, ${Number(incident.images[0].longitude).toFixed(6)}`
                                                        : (incident.incident_latitude && incident.incident_longitude 
                                                            ? `${Number(incident.incident_latitude).toFixed(6)}, ${Number(incident.incident_longitude).toFixed(6)}`
                                                            : 'N/A')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <span className="font-bold text-slate-500 shrink-0">Date/Time:</span>
                                                <span>
                                                    {incident.images[0].formatted_captured_at || 
                                                     (incident.images[0].captured_at 
                                                        ? new Date(incident.images[0].captured_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) 
                                                        : new Date(incident.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }))}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {incident.images.length > 1 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {incident.images.slice(1).map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`/storage/${img.image_path}`}
                                                    alt={`Incident Evidence ${idx + 2}`}
                                                    className="w-full h-16 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => setPreviewImage(`/storage/${img.image_path}`)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-1 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-xs">
                                    {incident.report_source === 'dispatcher' || incident.report_source === 'phone_sim' || incident.location_source === 'location_code' ? (
                                        <div className="flex items-start gap-2.5 text-slate-400">
                                            <PhoneCall className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-slate-200">Phone / SIM Call Intake (Voice Only)</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                                    Traditional cellular SIM voice calls do not transmit image files. Photos can be captured and uploaded on-scene by the dispatched ambulance crew.
                                                </p>
                                            </div>
                                        </div>
                                    ) : incident.report_source === 'walk_in' ? (
                                        <div className="flex items-start gap-2.5 text-slate-400">
                                            <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-slate-200">Station Walk-In Intake</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                                    Reported directly in-person at the MDRRMO station. No initial mobile photo uploaded.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <ImageIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                            <span>No photo evidence attached to this report.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Reported By
                            </p>
                            <div className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
                                <div>
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

                                {/* Reporter Prank History Warning & Reference Box */}
                                {(incident.reporter_prank_count > 0 || incident.is_prank) && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                <span>
                                                    {incident.is_prank 
                                                        ? '🚨 Recorded as Confirmed Prank' 
                                                        : `⚠️ Reporter Has ${incident.reporter_prank_count} Prior Prank Call${incident.reporter_prank_count === 1 ? '' : 's'}`}
                                                </span>
                                            </div>
                                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300/60">
                                                Reference Only
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                                            This history is displayed for reference so dispatchers do not need to re-interrogate the resident about past events. Each new report must be evaluated independently.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rejection Details (if rejected) */}
                        {incident.incident_status === 'rejected' && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Rejection Details
                                </p>
                                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold uppercase tracking-wider text-[11px]">
                                            <XCircle className="w-4 h-4 shrink-0" />
                                            <span>
                                                {incident.rejection_category === 'prank' 
                                                    ? '🚨 Intentional Prank / Hoax Call' 
                                                    : (incident.rejection_category 
                                                        ? incident.rejection_category.replace('_', ' ').toUpperCase() 
                                                        : 'REJECTED')}
                                            </span>
                                        </div>
                                        {incident.is_prank && (
                                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-red-600 text-white shadow-xs">
                                                Flagged Prank
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-red-950 dark:text-red-200 font-medium pt-1">
                                        <strong>Recorded Reason:</strong> "{incident.rejection_reason || 'No specific reason provided'}"
                                    </p>
                                    {incident.resolved_at && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            Processed on {new Date(incident.resolved_at).toLocaleString('en-PH')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Action Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                    {incident.incident_status === 'pending' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">Priority Level:</span>
                                <div className="flex gap-1.5">
                                    {(['Moderate', 'High', 'Critical'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setSelectedPriority(p)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                selectedPriority === p
                                                    ? p === 'Critical'
                                                        ? 'bg-red-600 text-white shadow-sm'
                                                        : p === 'High'
                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                        : 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    loading={processing}
                                    onClick={() => updateStatus('verified', { priority: selectedPriority || incident.priority || 'Moderate' })}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Verify Incident
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-auto px-4"
                                    title="Reject Incident (Prank / False Alarm)"
                                    onClick={() => setShowRejectModal(true)}
                                >
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {incident.incident_status === 'verified' && (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                className="flex-1 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-lg shadow-orange-500/20"
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
                            <Button
                                variant="destructive"
                                className="w-auto px-3 text-xs"
                                title="Reject as Prank or False Alarm"
                                onClick={() => setShowRejectModal(true)}
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                        </div>
                    )}

                    {(incident.incident_status === 'assigned' || incident.incident_status === 'responding') && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        router.get(`/dispatcher/dispatches?incident_id=${incident.id}`);
                                    }}
                                >
                                    <Truck className="w-4 h-4 mr-1.5" />
                                    View Active Dispatch
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-auto px-3 text-xs"
                                    title="Cancel mission & mark as Prank / False Alarm"
                                    onClick={() => setShowRejectModal(true)}
                                >
                                    <ShieldAlert className="w-4 h-4 mr-1" />
                                    Reject / Prank
                                </Button>
                            </div>
                            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 italic">
                                If responders arrive and find no incident or report a hoax, use "Reject / Prank" to cancel active units and log the incident.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* High-Resolution Photo Lightbox Preview Modal with Clear Close Button */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
                    onClick={() => setPreviewImage(null)}
                >
                    {/* Top Right Close Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(null);
                        }}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-2xl transition-all hover:scale-105 cursor-pointer"
                        title="Close preview (Esc)"
                    >
                        <X className="w-5 h-5 text-rose-400" />
                        <span className="text-sm font-semibold">Close</span>
                    </button>

                    {/* Image Box */}
                    <div
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Incident Full Evidence"
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                        />
                        <div className="mt-4 flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewImage(null)}
                                className="bg-slate-900/80 hover:bg-slate-800 border-white/20 text-white"
                            >
                                <X className="w-4 h-4 mr-1.5 text-rose-400" />
                                Close Preview
                            </Button>
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-colors border border-white/10"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open in New Window
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* Reject Modal */}
            <RejectModal
                incident={incident}
                open={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    onClose();
                }}
            />
        </Drawer>
    );
}
