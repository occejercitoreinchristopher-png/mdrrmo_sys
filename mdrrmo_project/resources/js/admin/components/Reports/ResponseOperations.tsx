import Card from '@/shared/components/Card';
import { Clock, Truck, UserCircle2 } from 'lucide-react';

export default function ResponseOperations({ stats, incidents }) {
    const formatSeconds = (sec) => {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate responder/crew stats manually from incidents
    const responderStats = {};
    const ambulanceStats = {};

    incidents.forEach(inc => {
        inc.dispatches?.forEach(disp => {
            // Ambulance stats
            if (disp.ambulance) {
                const amb = disp.ambulance.name || disp.ambulance.plate_number;
                if (!ambulanceStats[amb]) ambulanceStats[amb] = { missions: 0, time: 0, status: disp.ambulance.status };
                ambulanceStats[amb].missions++;
                if (disp.en_route_at && disp.completed_at) {
                    ambulanceStats[amb].time += (new Date(disp.completed_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000;
                }
            }
            
            // Responder stats (crew)
            const addResponderStat = (name, type, dispatchTime, responseTime, missionDuration) => {
                if (!responderStats[name]) {
                    responderStats[name] = { missions: 0, totalDispatch: 0, totalResponse: 0, totalMission: 0, countDispatch: 0, countResponse: 0, countMission: 0 };
                }
                responderStats[name].missions++;
                if (dispatchTime > 0) { responderStats[name].totalDispatch += dispatchTime; responderStats[name].countDispatch++; }
                if (responseTime > 0) { responderStats[name].totalResponse += responseTime; responderStats[name].countResponse++; }
                if (missionDuration > 0) { responderStats[name].totalMission += missionDuration; responderStats[name].countMission++; }
            };

            const dispatchTime = (inc.verified_at && disp.assigned_at) ? (new Date(disp.assigned_at).getTime() - new Date(inc.verified_at).getTime()) / 1000 : 0;
            const responseTime = (disp.en_route_at && disp.arrived_at) ? (new Date(disp.arrived_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000 : 0;
            const missionDuration = (disp.en_route_at && disp.completed_at) ? (new Date(disp.completed_at).getTime() - new Date(disp.en_route_at).getTime()) / 1000 : 0;

            disp.crew?.forEach(member => {
                addResponderStat(`${member.first_name} ${member.last_name}`, member.pivot?.role, dispatchTime, responseTime, missionDuration);
            });
        });
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-rose-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    02 Response Operations
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-5 flex flex-col justify-center items-center text-center">
                    <Clock className="w-6 h-6 text-slate-400 mb-2" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatSeconds(stats.avg_dispatch_time)}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Dispatch Time</p>
                </Card>
                <Card className="p-5 flex flex-col justify-center items-center text-center">
                    <Truck className="w-6 h-6 text-blue-500 mb-2" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatSeconds(stats.avg_response_time)}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Response Time</p>
                </Card>
                <Card className="p-5 flex flex-col justify-center items-center text-center">
                    <Clock className="w-6 h-6 text-emerald-500 mb-2" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatSeconds(stats.avg_mission_duration)}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Mission Duration</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-slate-500" />
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Responder Activity</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    <th className="p-3">Responder</th>
                                    <th className="p-3 text-center">Missions</th>
                                    <th className="p-3 text-center">Avg Response</th>
                                    <th className="p-3 text-center">Avg Mission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {Object.entries(responderStats).map(([name, rStat]: any, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] text-sm text-slate-700 dark:text-slate-300">
                                        <td className="p-3 font-medium">{name}</td>
                                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{rStat.missions}</td>
                                        <td className="p-3 text-center font-mono text-xs">{formatSeconds(rStat.countResponse ? rStat.totalResponse / rStat.countResponse : 0)}</td>
                                        <td className="p-3 text-center font-mono text-xs">{formatSeconds(rStat.countMission ? rStat.totalMission / rStat.countMission : 0)}</td>
                                    </tr>
                                ))}
                                {Object.keys(responderStats).length === 0 && (
                                    <tr><td colSpan={4} className="p-4 text-center text-sm text-slate-500 italic">No responder activity matching filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
                
                <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Ambulance Utilization</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    <th className="p-3">Ambulance</th>
                                    <th className="p-3 text-center">Missions</th>
                                    <th className="p-3 text-center">Total Time</th>
                                    <th className="p-3 text-center">Avg Mission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {Object.entries(ambulanceStats).map(([name, aStat]: any, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] text-sm text-slate-700 dark:text-slate-300">
                                        <td className="p-3 font-medium">{name}</td>
                                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{aStat.missions}</td>
                                        <td className="p-3 text-center font-mono text-xs">{formatSeconds(aStat.time)}</td>
                                        <td className="p-3 text-center font-mono text-xs">{formatSeconds(aStat.missions ? aStat.time / aStat.missions : 0)}</td>
                                    </tr>
                                ))}
                                {Object.keys(ambulanceStats).length === 0 && (
                                    <tr><td colSpan={4} className="p-4 text-center text-sm text-slate-500 italic">No ambulance activity matching filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
