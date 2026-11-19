import { useState, useEffect, useMemo } from 'react';
import { 
    Clock, 
    MapPin, 
    AlertTriangle, 
    Activity, 
    User, 
    Truck, 
    ShieldAlert,
    Phone,
    Smartphone,
    Send,
    Rocket,
    ShieldCheck,
    Navigation,
    ChevronRight,
    Copy,
    Check
} from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';

interface IncidentCardProps {
    incident: any;
    onClick?: () => void;
    selected?: boolean;
    onAssign?: (incident: any) => void;
    onLocate?: (incident: any) => void;
}

export default function IncidentCard({ 
    incident, 
    onClick, 
    selected = false,
    onAssign,
    onLocate,
}: IncidentCardProps) {
    // 10-second live tick so elapsed times update in real-time
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [copiedPhone, setCopiedPhone] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
        return () => clearInterval(timer);
    }, []);

    // Format both exact reported hour & relative elapsed time
    const timeInfo = useMemo(() => {
        if (!incident.reported_at) {
            return { display: '—', elapsed: '—', full: '—', isUrgent: false };
        }
        const start = new Date(incident.reported_at);
        const end = incident.resolved_at ? new Date(incident.resolved_at) : new Date(currentTime);

        const hourTime = start.toLocaleTimeString('en-PH', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const isToday = start.toDateString() === new Date(currentTime).toDateString();
        const datePrefix = isToday
            ? 'Today'
            : start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

        const diffMs = Math.max(0, end.getTime() - start.getTime());
        const diffMins = Math.floor(diffMs / 60000);
        let elapsed = '';
        if (diffMins < 1) {
            elapsed = 'Just now';
        } else if (diffMins < 60) {
            elapsed = `${diffMins}m ago`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            const remMins = diffMins % 60;
            elapsed = remMins > 0 ? `${diffHours}h ${remMins}m ago` : `${diffHours}h ago`;
        }

        const isUrgent = diffMins > 30 && incident.incident_status !== 'responding';

        return {
            display: `${datePrefix} • ${hourTime}`,
            hourTime,
            elapsed,
            diffMins,
            isUrgent,
            full: start.toLocaleString('en-PH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
        };
    }, [incident.reported_at, incident.resolved_at, currentTime, incident.incident_status]);

    // Priority color mapping for left border glow
    const borderGlow = {
        Critical: 'border-l-rose-500 bg-rose-500/[0.03]',
        High: 'border-l-orange-500 bg-orange-500/[0.03]',
        Moderate: 'border-l-blue-500 bg-blue-500/[0.03]',
        Low: 'border-l-slate-400 bg-slate-500/[0.03]',
    }[incident.priority] || 'border-l-slate-500 bg-slate-500/[0.03]';

    // Origin detection (Hotline call vs Mobile app)
    const isHotlineCall = Boolean(
        incident.caller_phone_number ||
        incident.description?.includes('Reported via Phone/SIM') ||
        !incident.resident
    );

    const callerPhone = incident.caller_phone_number || incident.resident?.phone_number;

    const handleCopyPhone = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!callerPhone) return;
        navigator.clipboard.writeText(callerPhone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
    };

    const locationText = incident.place_of_incident 
        || incident.incident_address 
        || (incident.location_code ? `Marker: ${typeof incident.location_code === 'object' ? incident.location_code?.location_code || incident.location_code?.code : incident.location_code}` : null) 
        || (typeof incident.location === 'object' ? incident.location?.location_name || incident.location?.name : incident.location)
        || 'Location unavailable';

    return (
        <div
            onClick={onClick}
            className={`relative mb-3 group cursor-pointer transition-all duration-200 border-l-4 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20
                ${borderGlow}
                ${selected ? 'ring-2 ring-rose-500 shadow-rose-500/10 bg-rose-50/20 dark:bg-rose-950/20 scale-[1.01]' : 'hover:scale-[1.008]'}
            `}
        >
            <div className="p-4 space-y-3">
                {/* Header: ID, Origin Badge & Elapsed Time */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 tracking-wider">
                            #{incident.id}
                        </span>

                        {isHotlineCall ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <Phone className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                Hotline Call
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                                <Smartphone className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                                Mobile App
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-end text-right" title={`Reported: ${timeInfo.full}`}>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {timeInfo.display}
                        </span>
                        <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                            timeInfo.isUrgent 
                                ? 'text-amber-600 dark:text-amber-400 font-bold animate-pulse'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            <Clock className={`w-3 h-3 ${timeInfo.isUrgent ? 'text-amber-500' : 'text-slate-400'}`} />
                            {timeInfo.elapsed}
                        </span>
                    </div>
                </div>

                {/* Title & Priority Badges */}
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {incident.incident_type?.name ?? 'Emergency Incident'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <StatusBadge status={incident.priority ?? 'Moderate'} size="xs" showDot={true} />

                        {incident.incident_status === 'responding' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 animate-pulse">
                                <Truck className="w-3 h-3" />
                                Responding
                            </span>
                        )}

                        {(incident.reporter_prank_count > 0 || incident.is_prank) && (
                            <span 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                title={incident.is_prank ? "Confirmed Prank Call" : `Reporter has ${incident.reporter_prank_count} prior prank call record(s)`}
                            >
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                {incident.is_prank ? 'Prank Call' : `⚠️ Prank Record (${incident.reporter_prank_count})`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reporter / Caller Info */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                            <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                {incident.resident
                                    ? `${incident.resident.first_name} ${incident.resident.last_name}`
                                    : (incident.caller_name || 'Resident / Caller')}
                            </div>
                            {callerPhone && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    {callerPhone}
                                </div>
                            )}
                        </div>
                    </div>

                    {callerPhone && (
                        <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                            title="Copy phone number"
                        >
                            {copiedPhone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}
                </div>

                {/* Incident Location */}
                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 font-medium leading-relaxed">
                        {locationText}
                    </span>
                </div>

                {/* Description / Caller Notes */}
                {incident.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-200/40 dark:border-white/5">
                        "{incident.description}"
                    </p>
                )}

                {/* ======================================================== */}
                {/* 1-CLICK DISPATCH & QUICK TACTICAL ACTIONS                */}
                {/* ======================================================== */}
                {incident.incident_status === 'verified' && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssign?.(incident);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-xs tracking-wide shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                            <Rocket className="w-3.5 h-3.5" />
                            Dispatch Ambulance
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onLocate?.(incident);
                            }}
                            title="Locate Incident on Map"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                        >
                            <MapPin className="w-4 h-4 text-rose-500" />
                        </button>
                    </div>
                )}

                {incident.incident_status === 'pending' && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick?.();
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Verify & Triage Details
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onLocate?.(incident);
                            }}
                            title="Locate Incident on Map"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                        >
                            <MapPin className="w-4 h-4 text-amber-500" />
                        </button>
                    </div>
                )}

                {(incident.incident_status === 'assigned' || incident.incident_status === 'responding') && incident.dispatches?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                        {/* Assigned Team / Ambulance badge */}
                        <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 text-xs">
                            <div className="flex items-center gap-2 truncate">
                                <Truck className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <div className="truncate">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                        {incident.dispatches[0].team ? `Unit ${incident.dispatches[0].team}` : 'Response Unit'}
                                    </span>
                                    {(incident.dispatches[0].ambulance?.vehicle_name || incident.dispatches[0].ambulance?.plate_number) && (
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-mono">
                                            {incident.dispatches[0].ambulance?.vehicle_name || incident.dispatches[0].ambulance?.plate_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shrink-0">
                                {incident.dispatches[0].dispatch_status?.replace(/_/g, ' ') || incident.incident_status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLocate?.(incident);
                                }}
                                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                Track Run
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick?.();
                                }}
                                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>Details</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
