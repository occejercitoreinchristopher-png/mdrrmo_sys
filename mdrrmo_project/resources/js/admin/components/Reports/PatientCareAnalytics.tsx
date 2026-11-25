import { Stethoscope, HeartPulse, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function PatientCareAnalytics({ stats = {} }: { stats?: any }) {
    const {
        patients_attended = 0,
        patients_transported = 0,
        patients_not_transported = 0,
        chief_complaints = {},
    } = stats;

    const transportRate =
        patients_attended > 0 ? Math.round((patients_transported / patients_attended) * 100) : 0;
    const sceneRate =
        patients_attended > 0 ? Math.round((patients_not_transported / patients_attended) * 100) : 0;

    const complaintsList = Object.entries(chief_complaints || {});
    const maxCount = complaintsList.length > 0 ? Math.max(...complaintsList.map(([, c]: any) => c)) : 1;

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-[#F61509] rounded-full shadow-[0_0_12px_rgba(246,21,9,0.4)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <span>03 Patient Care & Clinical Outcomes</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                PCR Intelligence
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Patient triage encounters, transport dispositions, and top clinical chief complaints
                        </p>
                    </div>
                </div>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Attended */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-red-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Patients Attended
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mb-1">
                        {patients_attended}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>Clinical encounters recorded</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            100% PCR
                        </span>
                    </div>
                </div>

                {/* Transported */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-red-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Transported to Hospital
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
                            <HeartPulse className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mb-1">
                        {patients_transported}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>Admitted / Referred to ER</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
                            {transportRate}% Rate
                        </span>
                    </div>
                </div>

                {/* Treated on Scene */}
                <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-red-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Treated on Scene / Refused
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mb-1">
                        {patients_not_transported}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span>First Aid on site or signed waiver</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
                            {sceneRate}% Rate
                        </span>
                    </div>
                </div>
            </div>

            {/* Chief Medical Complaints Leaderboard */}
            <div className="rounded-2xl p-5 bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-violet-500" />
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Clinical Chief Complaints Breakdown
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Most prevalent medical conditions and trauma complaints logged by EMTs
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                        Top {complaintsList.length} Diagnoses
                    </span>
                </div>

                <div className="pt-4">
                    {complaintsList.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 italic">
                            No patient care records matching the active filters.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {complaintsList.map(([complaint, count]: any, idx) => {
                                const barWidth = Math.round((count / maxCount) * 100);
                                return (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-violet-500/30 transition-all flex flex-col gap-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-900 dark:text-white truncate pr-2">
                                                {complaint}
                                            </span>
                                            <span className="font-mono font-black text-violet-500 shrink-0">
                                                {count} {count === 1 ? 'case' : 'cases'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200/70 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-violet-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
