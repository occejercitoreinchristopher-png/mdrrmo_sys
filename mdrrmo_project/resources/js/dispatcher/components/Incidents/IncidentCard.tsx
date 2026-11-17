import { Clock, MapPin, AlertTriangle, Activity, User, Truck, ShieldAlert } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';
import { useState, useEffect, useMemo } from 'react';

export default function IncidentCard({ incident, onClick, selected = false }) {
    // 10-second live tick so elapsed times update in real-time
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
        return () => clearInterval(timer);
    }, []);

    // Format both exact reported hour & relative elapsed time
    const timeInfo = useMemo(() => {
        if (!incident.reported_at) {
            return { display: '—', elapsed: '—', full: '—' };
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

        return {
            display: `${datePrefix} • ${hourTime}`,
            hourTime,
            elapsed,
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
    }, [incident.reported_at, incident.resolved_at, currentTime]);

    // Priority color mapping for left border glow
    const borderGlow = {
        Critical: 'border-l-rose-500 shadow-[inset_4px_0_0_0_rgba(244,63,94,1)]',
        High: 'border-l-orange-500 shadow-[inset_4px_0_0_0_rgba(249,115,22,1)]',
        Moderate: 'border-l-slate-400 shadow-[inset_4px_0_0_0_rgba(148,163,184,1)]',
    }[incident.priority] || 'border-l-slate-500 shadow-[inset_4px_0_0_0_rgba(100,116,139,1)]';

    return (
        <Card
            padding={false}
            onClick={onClick}
            className={`relative mb-3 group cursor-pointer transition-all duration-300 border-l-4 overflow-hidden
                ${borderGlow}
                ${selected ? 'ring-2 ring-rose-500/50 bg-slate-50 dark:bg-white/10 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-white/10 hover:scale-[1.01]'}
            `}
        >
            <div className="p-3">
                {/* Header: ID & Accurate Report Hour */}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10 tracking-wider">
                        #{incident.id}
                    </span>
                    <div className="flex flex-col items-end text-right" title={`Reported: ${timeInfo.full}`}>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                            {timeInfo.display}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#F61509]" />
                            {timeInfo.elapsed}
                        </span>
                    </div>
                </div>

                {/* Title & Priority */}
                <div className="mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                        {incident.incident_type?.name ?? 'Unknown Incident'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <StatusBadge status={incident.priority ?? 'Moderate'} size="xs" showDot={true} />
                        {incident.incident_status === 'responding' && (
                            <StatusBadge status="responding" size="xs" />
                        )}
                        {(incident.reporter_prank_count > 0 || incident.is_prank) && (
                            <span 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                                title={incident.is_prank ? "Confirmed Prank Call" : `Reporter has ${incident.reporter_prank_count} prior confirmed prank call(s)`}
                            >
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                {incident.is_prank ? 'Prank Call' : `⚠️ Prank Record (${incident.reporter_prank_count})`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reporter / Resident info */}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-700 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold truncate">
                        {incident.resident
                            ? `${incident.resident.first_name} ${incident.resident.last_name}`
                            : (incident.caller_name || (incident.caller_phone_number ? `Caller: ${incident.caller_phone_number}` : 'Citizen / App User'))}
                    </span>
                    {(incident.caller_phone_number || incident.resident?.phone_number) && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                            &bull; {incident.caller_phone_number || incident.resident?.phone_number}
                        </span>
                    )}
                </div>

                {/* Location */}
                <div className="flex items-start gap-1.5 mt-2 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 font-medium">
                        {incident.place_of_incident 
                            || incident.incident_address 
                            || (incident.location_code ? `Marker: ${typeof incident.location_code === 'object' ? incident.location_code?.location_code || incident.location_code?.code : incident.location_code}` : null) 
                            || (typeof incident.location === 'object' ? incident.location?.location_name || incident.location?.name : incident.location)
                            || 'Location unavailable'}
                    </span>
                </div>

                {/* Description */}
                {incident.description && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        "{incident.description}"
                    </p>
                )}

                {/* Responder / Assignment info */}
                {(incident.incident_status === 'assigned' || incident.incident_status === 'responding') && incident.dispatches?.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center justify-between gap-1 text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-white/5 p-1.5 rounded-md">
                            <div className="flex items-center gap-1.5 truncate">
                                <Truck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                    {incident.dispatches[0].team ? `Unit ${incident.dispatches[0].team}` : 'Response Unit'}
                                </span>
                                {(incident.dispatches[0].ambulance?.vehicle_name || incident.dispatches[0].ambulance?.plate_number || incident.dispatches[0].ambulance?.name) && (
                                    <span className="truncate text-slate-500 dark:text-slate-400">
                                        &bull; {incident.dispatches[0].ambulance?.vehicle_name || incident.dispatches[0].ambulance?.plate_number || incident.dispatches[0].ambulance?.name}
                                    </span>
                                )}
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800/60 shrink-0">
                                {incident.dispatches[0].dispatch_status?.replace(/_/g, ' ') || 'responding'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
