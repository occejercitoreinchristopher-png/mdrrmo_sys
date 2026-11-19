import { Link } from '@inertiajs/react';
import { ArrowRight, Truck, ExternalLink } from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';

export default function RecentDispatchTable({ dispatches = [] }: { dispatches?: any[] }) {
    return (
        <div className="rounded-2xl bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-500" />
                        <span>Recent Dispatches & Deployments</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Latest ambulance missions and responder teams
                    </p>
                </div>
                <Link
                    href="/admin/dispatch-logs"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {dispatches.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 italic">
                    No recent dispatches logged.
                </div>
            ) : (
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-[10px] uppercase font-bold text-slate-400">
                                <th className="py-2.5 px-4"># ID</th>
                                <th className="py-2.5 px-4">Ambulance</th>
                                <th className="py-2.5 px-4">Lead Crew</th>
                                <th className="py-2.5 px-4">Status</th>
                                <th className="py-2.5 px-4">Dispatched</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {dispatches.slice(0, 5).map((d) => (
                                <tr
                                    key={d.id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                        #{d.id}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                                        <span className="font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                                            {d.ambulance?.plate_number || d.ambulance?.vehicle_name || 'Unit —'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                        {d.responder
                                            ? `${d.responder.first_name} ${d.responder.last_name}`
                                            : 'Assigned Crew'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <StatusBadge status={d.status} />
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                        {d.dispatched_at
                                            ? new Date(d.dispatched_at).toLocaleDateString('en-PH', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <a
                                            href={`/admin/dispatch-logs/${d.incident_id || d.id}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                        >
                                            <span>Inspect</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
