import { FileText, AlertTriangle, CheckCircle2, XCircle, Clock, HeartPulse } from 'lucide-react';
import ReportStatCard from './ReportStatCard';

export default function ReportOverview({ stats = {} }: { stats?: any }) {
    const total = stats.total_incidents ?? 0;
    const verified = stats.verified_count ?? 0;
    const resolved = stats.resolved_count ?? 0;
    const rejected = stats.rejected_count ?? 0;
    const attended = stats.patients_attended ?? 0;
    const transported = stats.patients_transported ?? 0;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    const transportRate = attended > 0 ? Math.round((transported / attended) * 100) : 0;

    const formatSeconds = (sec: number) => {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const avgResponseTimeStr = formatSeconds(stats.avg_response_time ?? 0);
    const avgDispatchTimeStr = formatSeconds(stats.avg_dispatch_time ?? 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                            Operational Overview & Core Metrics
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            High-level performance summary of emergency calls and municipal operations
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time DB Sync</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <ReportStatCard
                    title="Total Incidents"
                    value={total}
                    icon={FileText}
                    color="blue"
                    badgeText={`${resolutionRate}% Resolved`}
                    badgeType="info"
                    subtitle="All logged records"
                    progress={100}
                    delayMs={0}
                />

                <ReportStatCard
                    title="Verified Cases"
                    value={verified}
                    icon={AlertTriangle}
                    color="amber"
                    badgeText={`${verificationRate}% of total`}
                    badgeType="warning"
                    subtitle="Confirmed legit"
                    progress={verificationRate}
                    delayMs={60}
                />

                <ReportStatCard
                    title="Resolved Cases"
                    value={resolved}
                    icon={CheckCircle2}
                    color="emerald"
                    badgeText="Cleared"
                    badgeType="success"
                    subtitle="Successfully closed"
                    progress={resolutionRate}
                    delayMs={120}
                />

                <ReportStatCard
                    title="Rejected / Prank"
                    value={rejected}
                    icon={XCircle}
                    color="crimson"
                    badgeText={`${rejectionRate}% filtered`}
                    badgeType={rejected > 0 ? 'danger' : 'neutral'}
                    subtitle="Unfounded / invalid"
                    progress={rejectionRate}
                    delayMs={180}
                />

                <ReportStatCard
                    title="Avg Response Speed"
                    value={avgResponseTimeStr}
                    valueSuffix="min"
                    icon={Clock}
                    color="cyan"
                    badgeText="Target < 8m"
                    badgeType="info"
                    subtitle={`Dispatch: ${avgDispatchTimeStr}`}
                    delayMs={240}
                />

                <ReportStatCard
                    title="Patients Attended"
                    value={attended}
                    icon={HeartPulse}
                    color="violet"
                    badgeText={`${transportRate}% Transported`}
                    badgeType="success"
                    subtitle={`${transported} to hospital`}
                    progress={transportRate}
                    delayMs={300}
                />
            </div>
        </div>
    );
}
