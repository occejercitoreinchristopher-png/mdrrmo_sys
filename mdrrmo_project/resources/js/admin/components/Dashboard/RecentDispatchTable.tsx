import { Link } from '@inertiajs/react';
import { ArrowRight, Truck } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';
import EmptyState from '@/shared/components/EmptyState';

export default function RecentDispatchTable({ dispatches = [] }: { dispatches?: any[] }) {
    return (
        <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-white/10">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Recent Dispatches
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Latest ambulance deployments
                    </p>
                </div>
                <Link
                    href="/admin/ambulances"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                    View fleet <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {dispatches.length === 0 ? (
                <EmptyState
                    title="No dispatches yet"
                    description="No ambulances have been dispatched."
                    icon={Truck}
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]">
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Ambulance
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Lead Responder
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Dispatched
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                            {dispatches.slice(0, 5).map((d) => (
                                <tr
                                    key={d.id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
                                        #{d.id}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                                        <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-xs font-semibold">
                                            {d.ambulance?.ambulance_code || d.ambulance?.plate_number || 'Unit —'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                                        {d.responder
                                            ? `${d.responder.first_name} ${d.responder.last_name}`
                                            : 'Assigned Crew'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge status={d.status} />
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                                        {d.dispatched_at
                                            ? new Date(d.dispatched_at).toLocaleDateString('en-PH', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
