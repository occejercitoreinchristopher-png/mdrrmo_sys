import Card from '@/shared/components/Card';
import { Activity, Stethoscope, UserCheck, AlertTriangle } from 'lucide-react';

export default function PatientCareAnalytics({ stats }) {
    const { patients_attended, patients_transported, patients_not_transported, chief_complaints } = stats;
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-rose-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    03 Patient Care Analytics
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-5 flex flex-col justify-center items-center text-center bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20">
                    <UserCheck className="w-8 h-8 text-indigo-500 mb-2" />
                    <h3 className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{patients_attended}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400">Patients Attended</p>
                </Card>
                <Card className="p-5 flex flex-col justify-center items-center text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20">
                    <Activity className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{patients_transported}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400">Patients Transported</p>
                </Card>
                <Card className="p-5 flex flex-col justify-center items-center text-center bg-slate-50/50 dark:bg-slate-800/30">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
                    <h3 className="text-3xl font-black text-slate-800 dark:text-slate-200">{patients_not_transported}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Not Transported / Treated on Scene</p>
                </Card>
            </div>

            <Card padding={false} className="border-slate-200/60 dark:border-white/10 shadow-sm">
                <div className="p-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-slate-500" />
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Top Chief Complaints</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Most common medical issues from PCRs</p>
                    </div>
                </div>
                <div className="p-0">
                    {Object.keys(chief_complaints || {}).length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500 italic">No patient care records match the current filters.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {Object.entries(chief_complaints).map(([complaint, count], idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{complaint}</span>
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">{count as number} cases</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
