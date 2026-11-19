import { Link } from '@inertiajs/react';
import { ArrowRight, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';

export default function RecentIncidentsTable({ incidents = [] }: { incidents?: any[] }) {
    return (
        <div className="rounded-2xl bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>Recent Emergency Incidents</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Latest reported emergency distress calls
                    </p>
                </div>
                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {incidents.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 italic">
                    No recent emergency incidents recorded.
                </div>
            ) : (
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-[10px] uppercase font-bold text-slate-400">
                                <th className="py-2.5 px-4"># ID</th>
                                <th className="py-2.5 px-4">Type</th>
                                <th className="py-2.5 px-4">Reporter</th>
                                <th className="py-2.5 px-4">Status</th>
                                <th className="py-2.5 px-4">Reported</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {incidents.slice(0, 5).map((incident) => {
                                const typeName =
                                    incident.incident_type?.name ||
                                    incident.incident_type?.incident_type_name ||
                                    'General';
                                const reporterName = incident.resident
                                    ? `${incident.resident.first_name} ${incident.resident.last_name}`
                                    : 'Anonymous / Phone Call';

                                return (
                                    <tr
                                        key={incident.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                            #{incident.id}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                                            {typeName}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                            {reporterName}
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={incident.incident_status} />
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                            {incident.reported_at || incident.created_at
                                                ? new Date(
                                                      incident.reported_at || incident.created_at
                                                  ).toLocaleDateString('en-PH', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <a
                                                href={`/dispatcher/incidents/${incident.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            >
                                                <span>Inspect</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
