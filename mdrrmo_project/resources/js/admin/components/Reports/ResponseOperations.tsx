import { Clock, Truck, UserCircle2, ShieldCheck, Zap, Activity, CheckCircle2 } from 'lucide-react';

export default function ResponseOperations({
    stats = {},
    incidents = [],
}: {
    stats?: any;
    incidents?: any[];
}) {
    const formatSeconds = (sec: number) => {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate responder and ambulance operational stats
    const responderStats: Record<
        string,
        {
            missions: number;
            totalResponse: number;
            countResponse: number;
            totalMission: number;
            countMission: number;
        }
    > = {};

    const ambulanceStats: Record<
        string,
        {
            missions: number;
            time: number;
            status: string;
            type: string;
        }
    > = {};

    incidents.forEach((inc) => {
        (inc.dispatches || []).forEach((disp: any) => {
            // Ambulance stats
            if (disp.ambulance) {
                const amb = disp.ambulance.plate_number || disp.ambulance.name || `Unit #${disp.ambulance.id}`;
                if (!ambulanceStats[amb]) {
                    ambulanceStats[amb] = {
                        missions: 0,
                        time: 0,
                        status: disp.ambulance.status || 'available',
                        type: disp.ambulance.vehicle_type || 'Type 1 Ambulance',
                    };
                }
                ambulanceStats[amb].missions++;
                if (disp.en_route_at && disp.completed_at) {
                    ambulanceStats[amb].time +=
                        (new Date(disp.completed_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000;
                }
            }

            // Crew / Responder stats
            const dispatchTime =
                inc.verified_at && disp.assigned_at
                    ? (new Date(disp.assigned_at).getTime() - new Date(inc.verified_at).getTime()) / 1000
                    : 0;
            const responseTime =
                disp.en_route_at && disp.arrived_at
                    ? (new Date(disp.arrived_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000
                    : 0;
            const missionDuration =
                disp.en_route_at && disp.completed_at
                    ? (new Date(disp.completed_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000
                    : 0;

            const crewList = disp.crew || [];
            crewList.forEach((member: any) => {
                const name = `${member.first_name} ${member.last_name}`;
                if (!responderStats[name]) {
                    responderStats[name] = {
                        missions: 0,
                        totalResponse: 0,
                        countResponse: 0,
                        totalMission: 0,
                        countMission: 0,
                    };
                }
                responderStats[name].missions++;
                if (responseTime > 0) {
                    responderStats[name].totalResponse += responseTime;
                    responderStats[name].countResponse++;
                }
                if (missionDuration > 0) {
                    responderStats[name].totalMission += missionDuration;
                    responderStats[name].countMission++;
                }
            });
        });
    });

    const sortedResponders = Object.entries(responderStats).sort(([, a], [, b]) => b.missions - a.missions);
    const sortedAmbulances = Object.entries(ambulanceStats).sort(([, a], [, b]) => b.missions - a.missions);

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <span>02 Fleet & Response Operations</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Velocity & Logistics
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Dispatch pipeline velocity, ambulance fleet utilization, and crew deployment metrics
                        </p>
                    </div>
                </div>
            </div>

            {/* 3-Stage Response Pipeline Velocity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stage 1: Verification to Dispatch */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Stage 1 • Call to Dispatch
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-1">
                        {formatSeconds(stats.avg_dispatch_time ?? 0)}
                        <span className="text-xs font-semibold text-slate-400 font-sans ml-1">avg</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>Intake to unit assignment</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                            Target &lt; 2m
                        </span>
                    </div>
                </div>

                {/* Stage 2: En Route Response */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Stage 2 • Transit to Scene
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Truck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-500 dark:text-amber-400 mb-1">
                        {formatSeconds(stats.avg_response_time ?? 0)}
                        <span className="text-xs font-semibold text-slate-400 font-sans ml-1">avg</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>Arrival at incident location</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
                            Target &lt; 8m
                        </span>
                    </div>
                </div>

                {/* Stage 3: Total Mission Duration */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Stage 3 • Mission Clearance
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-500 dark:text-emerald-400 mb-1">
                        {formatSeconds(stats.avg_mission_duration ?? 0)}
                        <span className="text-xs font-semibold text-slate-400 font-sans ml-1">avg</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>Full cycle to base / hospital</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                            Complete
                        </span>
                    </div>
                </div>
            </div>

            {/* Fleet & Crew Deployment Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ambulance Fleet Utilization */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Ambulance Fleet Utilization
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                            {sortedAmbulances.length} Units Deployed
                        </span>
                    </div>

                    <div className="pt-3 flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-white/5">
                                    <th className="py-2 px-3">Unit / Plate</th>
                                    <th className="py-2 px-3 text-center">Missions</th>
                                    <th className="py-2 px-3 text-center">Total Time</th>
                                    <th className="py-2 px-3 text-right">Avg Mission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {sortedAmbulances.map(([name, aStat]: any) => (
                                    <tr
                                        key={name}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                                    >
                                        <td className="py-2.5 px-3">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>{name}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">{aStat.type}</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                                            {aStat.missions}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                                            {formatSeconds(aStat.time)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-500">
                                            {formatSeconds(aStat.missions ? aStat.time / aStat.missions : 0)}
                                        </td>
                                    </tr>
                                ))}

                                {sortedAmbulances.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">
                                            No ambulance missions logged matching active filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Responder Deployment & Activity */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <UserCircle2 className="w-4 h-4 text-blue-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Crew & Responder Deployment
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                            {sortedResponders.length} Responders
                        </span>
                    </div>

                    <div className="pt-3 flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-white/5">
                                    <th className="py-2 px-3">Responder</th>
                                    <th className="py-2 px-3 text-center">Missions</th>
                                    <th className="py-2 px-3 text-center">Avg Response</th>
                                    <th className="py-2 px-3 text-right">Avg Mission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {sortedResponders.slice(0, 7).map(([name, rStat]: any, idx) => (
                                    <tr
                                        key={name}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                                    >
                                        <td className="py-2.5 px-3">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px]">
                                                    {name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span>{name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                                            {rStat.missions}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono text-amber-500">
                                            {formatSeconds(
                                                rStat.countResponse ? rStat.totalResponse / rStat.countResponse : 0
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                                            {formatSeconds(
                                                rStat.countMission ? rStat.totalMission / rStat.countMission : 0
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {sortedResponders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">
                                            No responder crew data matching current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
