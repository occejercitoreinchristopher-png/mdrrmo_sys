import { Link } from '@inertiajs/react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';
import EmptyState from '@/shared/components/EmptyState';

export default function RecentIncidentsTable({ incidents = [] }: { incidents?: any[] }) {
    return (
        <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-white/10">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Recent Incidents
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Latest reported emergency cases
                    </p>
                </div>
                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                    View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {incidents.length === 0 ? (
                <EmptyState
                    title="No recent incidents"
                    description="There are currently no reported incidents."
                    icon={AlertTriangle}
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
                                    Type
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Reporter
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Reported
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                            {incidents.slice(0, 5).map((incident) => (
                                <tr
                                    key={incident.id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
                                        #{incident.id}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                                        {incident.incident_type?.name ?? 'General'}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                                        {incident.resident
                                            ? `${incident.resident.first_name} ${incident.resident.last_name}`
                                            : 'Anonymous'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge
                                            status={incident.incident_status}
                                        />
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                                        {incident.reported_at || incident.created_at
                                            ? new Date(
                                                  incident.reported_at || incident.created_at,
                                              ).toLocaleDateString('en-PH', {
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
