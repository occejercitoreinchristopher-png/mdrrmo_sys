import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';
import EmptyState from '@/shared/components/EmptyState';
import { AlertTriangle } from 'lucide-react';

export default function RecentIncidentsTable({ incidents = [] }: { incidents?: any[] }) {
    return (
        <Card padding={false}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Recent Incidents
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Latest reported incidents
                    </p>
                </div>
                <Link
                    href="/dispatcher/incidents"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                    View all <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {incidents.length === 0 ? (
                <EmptyState
                    title="No incidents yet"
                    description="No incidents have been reported."
                    icon={AlertTriangle}
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02]">
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Reporter
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Reported
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.slice(0, 5).map((incident) => (
                                <tr
                                    key={incident.id}
                                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs font-semibold">
                                        #{incident.id}
                                    </td>
                                    <td className="px-5 py-3 text-slate-800 dark:text-slate-300 font-medium">
                                        {incident.incident_type?.name ?? '—'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-800 dark:text-slate-300">
                                        {incident.resident
                                            ? `${incident.resident.first_name} ${incident.resident.last_name}`
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <StatusBadge
                                            status={incident.incident_status}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                        {incident.reported_at
                                            ? new Date(
                                                  incident.reported_at,
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
