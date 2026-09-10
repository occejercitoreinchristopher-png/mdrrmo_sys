import { Link } from '@inertiajs/react';
import { ArrowRight, Truck } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';
import EmptyState from '@/shared/components/EmptyState';

export default function RecentDispatchTable({ dispatches = [] }) {
    return (
        <Card padding={false}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                    <h3 className="font-semibold text-white text-sm">
                        Recent Dispatches
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Latest ambulance dispatches
                    </p>
                </div>
                <Link
                    href="/admin/dispatches"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    View all <ArrowRight className="w-3 h-3" />
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
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Ambulance
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Responder
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Dispatched
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispatches.slice(0, 5).map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">
                                        #{d.id}
                                    </td>
                                    <td className="px-5 py-3 text-slate-300">
                                        {d.ambulance?.plate_number ?? '—'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-300">
                                        {d.responder
                                            ? `${d.responder.first_name} ${d.responder.last_name}`
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <StatusBadge status={d.status} />
                                    </td>
                                    <td className="px-5 py-3 text-slate-400 text-xs">
                                        {d.dispatched_at
                                            ? new Date(
                                                  d.dispatched_at,
                                              ).toLocaleDateString('en-PH')
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
